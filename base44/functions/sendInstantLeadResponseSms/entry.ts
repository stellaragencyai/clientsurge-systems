/**
 * Send Instant Lead Response SMS
 * Triggered when a new WebsiteLead is created
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

// Default SMS template if none provided in config
const DEFAULT_SMS_TEMPLATE = "Hi {first_name}, thanks for reaching out! We received your message about {service_interest}. A member of our team will be in touch shortly.";

function formatSmsTemplate(template, lead) {
  return template
    .replace("{first_name}", lead.first_name || lead.full_name.split(" ")[0] || "there")
    .replace("{service_interest}", lead.service_interest || "your inquiry")
    .replace("{business_name}", lead.business_name || "your business");
}

async function sendTwilioSms(toNumber, messageBody) {
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  
  const response = await fetch(TWILIO_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: TWILIO_FROM_NUMBER,
      To: toNumber,
      Body: messageBody,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.sid; // Twilio message SID
}

async function logSmsEvent(base44, leadId, status, messageId, errorMessage = null) {
  await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: leadId,
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
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const { lead_id, order_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: "lead_id is required" }, { status: 400 });
    }

    // Fetch the WebsiteLead
    const leads = await base44.asServiceRole.entities.WebsiteLead.filter(
      { id: lead_id },
      null,
      1
    );

    if (!leads || leads.length === 0) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const lead = leads[0];

    // Check if we already sent initial response
    if (lead.initial_response_sent_at) {
      console.log(`[InstantResponse] Lead ${lead_id} already received initial response`);
      return Response.json({ success: false, reason: "Already sent" });
    }

    // Validate phone number
    if (!lead.phone_number) {
      console.warn(`[InstantResponse] Lead ${lead_id} missing phone number`);
      await logSmsEvent(base44, lead_id, "failed", null, "Missing phone number");
      return Response.json({ success: false, error: "Phone number missing" });
    }

    // Load install configuration if order_id provided
    let smsTemplate = DEFAULT_SMS_TEMPLATE;
    if (order_id) {
      try {
        const orders = await base44.asServiceRole.entities.Order.filter(
          { id: order_id },
          null,
          1
        );
        if (orders && orders.length > 0) {
          const order = orders[0];
          const config = order.install_configuration?.services?.instant_lead_response;
          if (config?.sms_template) {
            smsTemplate = config.sms_template;
          }
        }
      } catch (e) {
        console.warn(`[InstantResponse] Could not load order config: ${e.message}`);
      }
    }

    // Format and send SMS
    const messageBody = formatSmsTemplate(smsTemplate, lead);
    const messageSid = await sendTwilioSms(lead.phone_number, messageBody);

    // Update lead with initial response timestamp and log event
    await base44.asServiceRole.entities.WebsiteLead.update(lead_id, {
      initial_response_sent_at: new Date().toISOString(),
      sms_attempt_count: (lead.sms_attempt_count || 0) + 1,
      last_engagement_type: "sms",
      last_engagement_at: new Date().toISOString(),
    });

    await logSmsEvent(base44, lead_id, "sent", messageSid);

    console.log(`[InstantResponse] Sent SMS to ${lead.phone_number} (SID: ${messageSid})`);

    return Response.json({ success: true, message_id: messageSid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[InstantResponse] Error: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
});