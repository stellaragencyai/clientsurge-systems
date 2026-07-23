import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";
import crypto from "node:crypto";

const SALES_NUMBER = "+16025843227";
const CUSTOMER_SERVICE_NUMBER = "+18778123630";
const NOTIFICATION_EVENT = "internal_sms_notification_sent";

function normalizePhone(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? `+${digits}` : null;
}

function classifyIntent(body) {
  const text = String(body || "").toLowerCase();
  if (/\b(stop|unsubscribe|opt.?out|remove me|cancel|end|quit)\b/.test(text)) return "stop_opt_out";
  if (/\b(book|schedule|appointment|ready|available|confirm)\b/.test(text)) return "booking_intent";
  if (/\b(price|cost|pricing|quote|fee|rate|how much)\b/.test(text)) return "pricing_question";
  if (/\b(human|person|agent|representative|help|support)\b/.test(text)) return "human_help_needed";
  return "unknown";
}

async function validateTwilio(req, rawBody) {
  const webhookKey = Deno.env.get("TWILIO_WEBHOOK_KEY");
  const suppliedKey = new URL(req.url).searchParams.get("twilio_webhook_key");
  if (webhookKey && suppliedKey === webhookKey) return true;

  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const signature = req.headers.get("X-Twilio-Signature");
  if (!token || !signature) return false;

  const url = new URL(req.url);
  const protocol = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const publicUrl = `${protocol}://${host}${url.pathname}${url.search}`;
  const params = new URLSearchParams(rawBody);
  const signed = publicUrl + Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}${value}`)
    .join("");
  return crypto.createHmac("sha1", token).update(signed).digest("base64") === signature;
}

async function getSettings(base44) {
  try {
    return (await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1))?.[0] || null;
  } catch (_) {
    return null;
  }
}

async function sendSms(from, to, body) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!sid || !token) throw new Error("Twilio credentials missing");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.message || `Twilio HTTP ${response.status}`);
  return result;
}

async function notifyAdmin(base44, settings, input) {
  const destination = normalizePhone(
    settings?.internal_sms_notification_number || Deno.env.get("INTERNAL_SMS_NOTIFICATION_NUMBER")
  );
  const enabled = settings?.internal_sms_notification_enabled !== false;
  const ownNumbers = new Set([SALES_NUMBER, CUSTOMER_SERVICE_NUMBER, destination].filter(Boolean));

  if (!enabled || input.to !== SALES_NUMBER || !destination || ownNumbers.has(input.from)) {
    return { sent: false, reason: "not_eligible" };
  }

  const existing = await base44.asServiceRole.entities.CommunicationEvent.filter(
    { context_id: input.messageId, event_type: NOTIFICATION_EVENT }, "-created_date", 1
  ).catch(() => []);
  if (existing?.length) return { sent: false, reason: "duplicate" };

  const notificationBody = [
    "New ClientSurge Sales text",
    "",
    `Customer: ${input.from}`,
    `Received on: ${input.to}`,
    "",
    "Message:",
    String(input.body).slice(0, 1200),
    "",
    "Reply through ClientSurge to preserve the sales number.",
  ].join("\n");

  try {
    const result = await sendSms(SALES_NUMBER, destination, notificationBody);
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: input.leadId || undefined,
      context_type: "internal_sms_notification",
      context_id: input.messageId,
      channel: "sms",
      direction: "outbound",
      event_type: NOTIFICATION_EVENT,
      provider: "twilio",
      status: "sent",
      subject: `Internal sales SMS notification from ${input.from}`,
      message_body: notificationBody,
      provider_message_id: result?.sid || null,
      metadata_json: JSON.stringify({
        internal_only: true,
        original_from: input.from,
        original_to: input.to,
        notification_to: destination,
        notification_from: SALES_NUMBER,
      }),
    });
    return { sent: true };
  } catch (error) {
    console.error("[InboundSms] Admin notification failed:", error?.message);
    return { sent: false, reason: "send_failed" };
  }
}

async function updateNurture(base44, leadId, stop) {
  const status = stop ? { $in: ["active", "paused"] } : "active";
  const campaigns = await base44.asServiceRole.entities.NurtureCampaign.filter(
    { lead_id: leadId, status }, "-created_date", 25
  ).catch(() => []);
  for (const campaign of campaigns || []) {
    await base44.asServiceRole.entities.NurtureCampaign.update(campaign.id, {
      status: stop ? "stopped" : "paused",
      stop_reason: stop ? "opted_out" : "inbound_reply",
    }).catch(() => null);
  }
  return campaigns?.length || 0;
}

Deno.serve(async (req) => {
  try {
    if (req.method === "GET") {
      return Response.json({ status: "ok", route: "receiveTwilioInboundSms", sales_notifications: true });
    }
    if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const rawBody = await req.text();
    if (!(await validateTwilio(req, rawBody))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = new URLSearchParams(rawBody);
    const from = normalizePhone(params.get("From"));
    const to = normalizePhone(params.get("To"));
    const body = params.get("Body")?.trim();
    const messageId = params.get("MessageSid");
    if (!from || !to || !body || !messageId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const duplicate = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { provider_message_id: messageId, event_type: "sms_received" }, "-created_date", 1
    );
    if (duplicate?.length) return Response.json({ received: true, duplicate: true });

    const intent = classifyIntent(body);
    const leads = await base44.asServiceRole.entities.WebsiteLead.list("-created_date", 1000);
    const lead = (leads || []).find((item) => normalizePhone(item.phone_number) === from) || null;

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead?.id || undefined,
      context_type: lead ? "website_lead" : "inbound_sms_unmatched",
      context_id: lead?.id || messageId,
      channel: "sms",
      direction: "inbound",
      event_type: "sms_received",
      provider: "twilio",
      status: lead ? "received" : "unmatched",
      subject: `[TWILIO SMS] Inbound from ${from}`,
      message_body: body,
      provider_message_id: messageId,
      metadata_json: JSON.stringify({ from, to, message_sid: messageId, intent }),
    });

    const settings = await getSettings(base44);
    const notification = await notifyAdmin(base44, settings, {
      from, to, body, messageId, leadId: lead?.id,
    });

    let nurtureUpdated = 0;
    if (lead) {
      const optedOut = intent === "stop_opt_out";
      await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
        reply_status: "responded",
        lead_status: "responded",
        last_engagement_type: "sms",
        last_engagement_at: new Date().toISOString(),
        automation_enabled: false,
        ...(optedOut ? { sms_permission: false, cadence_paused: true } : {}),
      });
      nurtureUpdated = await updateNurture(base44, lead.id, optedOut);

      if (["booking_intent", "pricing_question", "human_help_needed", "unknown"].includes(intent)) {
        await base44.asServiceRole.entities.Alert.create({
          type: intent === "booking_intent" ? "booking_request" : "engagement_trigger",
          severity: intent === "booking_intent" ? "high" : "medium",
          phone_number: from,
          lead_name: lead.full_name || lead.business_name || "Unknown",
          lead_id: lead.id,
          message: `[Inbound SMS] ${intent}: "${body.slice(0, 200)}"`,
          lead_intent: intent === "booking_intent" ? "booking_request" : "support",
          lead_score: intent === "booking_intent" ? 80 : 40,
          source: "twilio",
          notification_sent: notification.sent,
          read_status: false,
          conversion_status: "new",
        }).catch(() => null);
      }
    }

    return Response.json({
      received: true,
      matched: Boolean(lead),
      lead_id: lead?.id || null,
      intent,
      internal_notification_sent: notification.sent,
      internal_notification_reason: notification.reason || null,
      nurture_campaigns_updated: nurtureUpdated,
    });
  } catch (error) {
    console.error("[InboundSms] Handler error:", error?.message, error?.stack);
    return Response.json({ error: "An error occurred processing your request." }, { status: 500 });
  }
});
