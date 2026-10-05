import { resendFetch } from "../_shared/resendFetch.js";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { getWebsiteLeadOutboundSuppression, logSuppressedWebsiteLeadOutbound } from "../_shared/outboundLeadGuards.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function appendSmsOptOut(message) {
  if (!message) return "";
  const trimmed = message.trim();
  if (/\bSTOP\b/i.test(trimmed)) return trimmed;
  return `${trimmed}\n\nReply STOP to opt out.`;
}

function safeResendFrom() {
  const configured = String(Deno.env.get("RESEND_FROM_EMAIL") || "").trim();
  if (configured && configured.includes("@")) {
    if (configured.includes("<")) return configured;
    return `ClientSurge Systems <${configured}>`;
  }
  return "ClientSurge Systems <system@clientsurgesystems.com>";
}

const DEFAULT_SMS_TEMPLATE = "Hi {first_name}, thanks for reaching out! We received your message about {service_interest}. A member of our team will be in touch shortly.";

function formatSmsTemplate(template, lead) {
  return template
    .replace("{first_name}", lead.first_name || lead.full_name?.split(" ")[0] || "there")
    .replace("{service_interest}", lead.service_interest || "your inquiry")
    .replace("{business_name}", lead.business_name || "your business");
}

async function sendTwilioSms(toNumber, messageBody) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials not configured");
  }

  const auth = btoa(`${accountSid}:${authToken}`);
  const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");

  const params = { From: fromNumber, To: toNumber, Body: appendSmsOptOut(messageBody) };
  if (statusCallbackUrl) params.StatusCallback = statusCallbackUrl;

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params).toString(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.sid;
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
      message_body: null,
      provider_message_id: messageId || null,
      error_message: errorMessage || null,
      metadata_json: JSON.stringify({
        service_key: "instant_lead_response",
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (_) {
    // Non-blocking
  }
}

async function sendResendEmail(base44, leadId, toEmail, firstName, businessName) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return; // Skip silently — Resend not configured

  const subject = "We received your request";
  const body = `Hi ${firstName},\n\nWe received your request and will be reaching out shortly.\n\nIf this is urgent, feel free to reply to this email or text us back.\n\n– ${businessName}`;

  try {
    const res = await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `instant-response/${leadId}/initial-email`,
      },
      body: JSON.stringify({ from: safeResendFrom(), to: toEmail, subject, text: body }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Resend error: ${err?.message || res.status}`);
    }

    const result = await res.json();

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      context_id: leadId,
      context_type: "WebsiteLead",
      channel: "email",
      direction: "outbound",
      event_type: "email_sent",
      provider: "resend",
      status: "sent",
      provider_message_id: result.id || null,
      metadata_json: JSON.stringify({ service_key: "instant_lead_response", timestamp: new Date().toISOString() }),
    });
  } catch (emailError) {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      context_id: leadId,
      context_type: "WebsiteLead",
      channel: "email",
      direction: "outbound",
      event_type: "email_failed",
      provider: "resend",
      status: "failed",
      error_message: emailError.message,
      metadata_json: JSON.stringify({ service_key: "instant_lead_response", timestamp: new Date().toISOString() }),
    });
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const base44 = createClientFromRequest(req);
    const { lead_id, order_id } = await req.json();

    if (!lead_id) {
      return json({ error: "lead_id is required" }, 400);
    }

    let leadData = null;
    try {
      leadData = await base44.asServiceRole.entities.WebsiteLead.get(lead_id);
    } catch (_) {}

    if (!leadData) {
      return json({ error: "Lead not found" }, 404);
    }

    const leadHold = getWebsiteLeadOutboundSuppression(leadData);
    if (leadHold.suppressed) {
      await logSuppressedWebsiteLeadOutbound(base44, {
        lead: leadData,
        source: "sendInstantLeadResponseSms",
        channel: "internal",
        reason: leadHold.reasons,
      });
      return json({
        success: true,
        skipped: true,
        reason: "outbound_guardrail",
        reasons: leadHold.reasons,
        sms_sent: false,
      }, 200);
    }

    // Idempotency guard
    if (leadData.initial_response_sent_at) {
      return json({ success: false, reason: "Already sent" }, 409);
    }

    // Consent guard
    if (leadData.do_not_contact === true) {
      await logSmsEvent(base44, lead_id, "failed", null, "Lead has do_not_contact flag");
      return json({ error: "Lead has do_not_contact flag", sms_sent: false }, 200);
    }

    if (!leadData.phone_number) {
      await logSmsEvent(base44, lead_id, "failed", null, "Missing phone number");
      return json({ success: false, error: "Phone number missing" }, 400);
    }

    // Load install configuration
    let smsTemplate = DEFAULT_SMS_TEMPLATE;
    if (order_id) {
      try {
        const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id }, null, 1);
        if (orders && orders.length > 0) {
          const config = orders[0].install_configuration?.services?.instant_lead_response;
          if (config?.sms_template) {
            smsTemplate = config.sms_template;
          }
        }
      } catch (_) {}
    }

    // Format and send SMS
    const messageBody = formatSmsTemplate(smsTemplate, leadData);
    let messageSid;
    try {
      messageSid = await sendTwilioSms(leadData.phone_number, messageBody);
    } catch (smsError) {
      await logSmsEvent(base44, lead_id, "failed", null, smsError.message);
      return json({ error: smsError.message }, 500);
    }

    // Update WebsiteLead
    const now = new Date().toISOString();
    try {
      await base44.asServiceRole.entities.WebsiteLead.update(lead_id, {
        initial_response_sent_at: now,
        lead_status: "contacted",
        next_follow_up_at: now,
        sms_attempt_count: (leadData.sms_attempt_count || 0) + 1,
        last_engagement_type: "sms",
        last_engagement_at: now,
      });
    } catch (_) {}

    await logSmsEvent(base44, lead_id, "sent", messageSid);

    // Send email if address present
    if (leadData.email) {
      const firstName = leadData.first_name || leadData.full_name?.split(" ")[0] || "there";
      const businessName = Deno.env.get("DEFAULT_BUSINESS_NAME") || "ClientSurge Systems";
      await sendResendEmail(base44, lead_id, leadData.email, firstName, businessName);
    }

    return json({ success: true, message_id: messageSid });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});
