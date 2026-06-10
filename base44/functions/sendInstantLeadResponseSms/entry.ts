/**
 * sendInstantLeadResponseSms — self-contained (no _shared imports)
 * Sends an instant SMS + email response when a new WebsiteLead is created.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.startsWith("+")) return phone;
  return `+${digits}`;
}

function appendOptOut(body) {
  if (/reply stop/i.test(body) || /text stop/i.test(body)) return body;
  return `${body}\n\nReply STOP to opt out.`;
}

const DEFAULT_SMS_TEMPLATE = "Hi {first_name}, thanks for reaching out! We received your message about {service_interest}. A member of our team will be in touch shortly.";

function formatSmsTemplate(template, lead) {
  const firstName = lead.first_name || (lead.full_name || "").split(" ")[0] || "there";
  return template
    .replace(/\{first_name\}/g, firstName)
    .replace(/\{service_interest\}/g, lead.service_interest || "your inquiry")
    .replace(/\{business_name\}/g, lead.business_name || "your business");
}

async function logSmsEvent(base44, leadId, status, messageId, errorMessage) {
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      context_id: leadId,
      context_type: "WebsiteLead",
      channel: "sms",
      direction: "outbound",
      event_type: status === "sent" ? "sms_sent" : "sms_failed",
      provider: "twilio",
      status: status === "sent" ? "sent" : "failed",
      provider_message_id: messageId || null,
      error_message: errorMessage || null,
      metadata_json: JSON.stringify({ service_key: "instant_lead_response", timestamp: new Date().toISOString() }),
    });
  } catch (e) {
    console.error(`[sendInstantLeadResponseSms] CommunicationEvent write failed: ${e.message}`);
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const base44 = createClientFromRequest(req);
    const { lead_id, order_id } = await req.json().catch(() => ({}));

    if (!lead_id) return json({ error: "lead_id is required" }, 400);

    const leadData = await base44.asServiceRole.entities.WebsiteLead.get(lead_id).catch(() => null);
    if (!leadData) return json({ error: "Lead not found" }, 404);

    if (leadData.initial_response_sent_at) {
      console.log(`[sendInstantLeadResponseSms] SKIPPED — already sent for lead ${lead_id}`);
      return json({ success: false, reason: "Already sent" }, 409);
    }

    if (!leadData.phone_number) {
      await logSmsEvent(base44, lead_id, "failed", null, "Missing phone number");
      return json({ success: false, error: "Phone number missing" }, 400);
    }

    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER") || Deno.env.get("TWILIO_FROM_NUMBER");
    if (!twilioSid || !twilioToken || !twilioFrom) {
      return json({ error: "Twilio credentials not configured" }, 500);
    }

    // Load SMS template from order config if available
    let smsTemplate = DEFAULT_SMS_TEMPLATE;
    if (order_id) {
      const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id }, null, 1).catch(() => []);
      const orderConfig = orders?.[0]?.install_configuration?.services?.instant_lead_response;
      if (orderConfig?.sms_template) smsTemplate = orderConfig.sms_template;
    }

    const messageBody = appendOptOut(formatSmsTemplate(smsTemplate, leadData));
    const toNumber = normalizePhone(leadData.phone_number);
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");

    const params = { From: twilioFrom, To: toNumber, Body: messageBody };
    if (statusCallbackUrl) params.StatusCallback = statusCallbackUrl;

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params).toString(),
    });

    if (!twilioRes.ok) {
      const errText = await twilioRes.text();
      console.error(`[sendInstantLeadResponseSms] Twilio error ${twilioRes.status}: ${errText}`);
      await logSmsEvent(base44, lead_id, "failed", null, `Twilio ${twilioRes.status}`);
      return json({ error: `Twilio error: ${twilioRes.status}` }, 500);
    }

    const twilioData = await twilioRes.json();
    const messageSid = twilioData.sid;
    console.log(`[sendInstantLeadResponseSms] SMS sent — SID: ${messageSid}, lead: ${lead_id}`);

    const now = new Date().toISOString();
    await base44.asServiceRole.entities.WebsiteLead.update(lead_id, {
      initial_response_sent_at: now,
      lead_status: "contacted",
      next_follow_up_at: now,
      sms_attempt_count: (leadData.sms_attempt_count || 0) + 1,
      last_engagement_type: "sms",
      last_engagement_at: now,
    }).catch((e) => console.error(`[sendInstantLeadResponseSms] Lead update failed: ${e.message}`));

    await logSmsEvent(base44, lead_id, "sent", messageSid);

    // Also send email if available
    if (leadData.email) {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@clientsurgesystems.com";
      const firstName = leadData.first_name || (leadData.full_name || "").split(" ")[0] || "there";
      const businessName = Deno.env.get("DEFAULT_BUSINESS_NAME") || "ClientSurge Systems";

      if (resendKey) {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `instant-response/${lead_id}/initial-email`,
          },
          body: JSON.stringify({
            from: `${businessName} <${fromEmail}>`,
            to: leadData.email,
            subject: "We received your request",
            text: `Hi ${firstName},\n\nWe received your request and will be reaching out shortly.\n\nIf this is urgent, feel free to reply to this email or text us back.\n\n– ${businessName}`,
          }),
        });

        const emailEventStatus = emailRes.ok ? "sent" : "failed";
        const emailData = emailRes.ok ? await emailRes.json().catch(() => ({})) : {};
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id, context_id: lead_id, context_type: "WebsiteLead",
          channel: "email", direction: "outbound", event_type: "instant_email_sent",
          provider: "resend", status: emailEventStatus,
          provider_message_id: emailData?.id || null,
          metadata_json: JSON.stringify({ service_key: "instant_lead_response", timestamp: now }),
        }).catch(() => null);
      }
    }

    return json({ success: true, message_id: messageSid });
  } catch (error) {
    console.error(`[sendInstantLeadResponseSms] error: ${error.message}`);
    return json({ error: error.message }, 500);
  }
});