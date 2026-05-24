/**
 * Send Instant Lead Response SMS
 * Triggered when a new WebsiteLead is created
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  sendCommunicationViaOutbox,
  sendResendEmailProvider,
  sendTwilioSmsProvider,
} from "../_shared/communicationOutbox.js";

// Default SMS template if none provided in config
const DEFAULT_SMS_TEMPLATE = "Hi {first_name}, thanks for reaching out! We received your message about {service_interest}. A member of our team will be in touch shortly.";

function formatSmsTemplate(template, lead) {
  return template
    .replace("{first_name}", lead.first_name || lead.full_name.split(" ")[0] || "there")
    .replace("{service_interest}", lead.service_interest || "your inquiry")
    .replace("{business_name}", lead.business_name || "your business");
}

async function logSmsEvent(base44, leadId, status, messageId, errorMessage = null) {
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
    console.log(`[InstantResponse] CommunicationEvent written — status: ${status}, lead: ${leadId}`);
  } catch (e) {
    console.error(`[InstantResponse] CommunicationEvent write failed for lead ${leadId}: ${e.message}`);
  }
}

async function sendResendEmail(base44, leadId, toEmail, firstName, businessName) {
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@clientsurgesystems.com";

  const subject = "We received your request";
  const body = `Hi ${firstName},\n\nWe received your request and will be reaching out shortly.\n\nIf this is urgent, feel free to reply to this email or text us back.\n\n– ${businessName}`;

  console.log(`[InstantResponse] Sending email to ${toEmail} — lead: ${leadId}`);

  try {
    const result = await sendCommunicationViaOutbox({
      base44,
      channel: "email",
      provider: "resend",
      recipient: toEmail,
      subject,
      body,
      from: fromEmail,
      leadId,
      source: "sendInstantLeadResponseSms",
      sourceRecordId: leadId,
      templateKey: "instant_lead_response_email",
      messageType: "transactional",
      consentBasis: "transactional_relationship",
      idempotencyKey: `resend:email:instant-response:${toEmail}:initial-email:${leadId}`,
      metadata: { service_key: "instant_lead_response" },
      providerSend: (providerPayload) => sendResendEmailProvider({
        ...providerPayload,
        env: (name) => Deno.env.get(name),
        fetchImpl: fetch,
      }),
    });

    if (!result.success && !result.suppressed) {
      throw new Error(result.error || result.reason || "Resend outbox send failed");
    }
    console.log(`[InstantResponse] Email outbox status — status: ${result.status}, id: ${result.provider_message_id || "n/a"}, lead: ${leadId}`);
  } catch (emailError) {
    console.error(`[InstantResponse] Email send failed for lead ${leadId}: ${emailError.message}`);
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      context_id: leadId,
      context_type: "WebsiteLead",
      channel: "email",
      direction: "outbound",
      event_type: "instant_email_sent",
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
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const { lead_id, order_id, lead } = await req.json();

    console.log(`[InstantResponse] START — lead_id: ${lead_id}`);

    if (!lead_id) {
      return Response.json({ error: "lead_id is required" }, { status: 400 });
    }

    // Fetch lead — always fetch fresh from DB (ignore passed lead object to ensure idempotency check is against live data)
    let leadData = null;
    try {
      leadData = await base44.asServiceRole.entities.WebsiteLead.get(lead_id);
      console.log(`[InstantResponse] Lead found: ${lead_id}`);
    } catch (e) {
      console.error(`[InstantResponse] Lead fetch failed for ${lead_id}: ${e.message}`);
    }

    if (!leadData) {
      console.error(`[InstantResponse] Lead not found: ${lead_id}`);
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // IDEMPOTENCY — only condition: initial_response_sent_at already set
    if (leadData.initial_response_sent_at) {
      console.log(`[InstantResponse] SKIPPED — already sent for lead ${lead_id}`);
      return Response.json({ success: false, reason: "Already sent" });
    }

    // Validate phone number
    if (!leadData.phone_number) {
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
    const messageBody = formatSmsTemplate(smsTemplate, leadData);
    let messageSid;
    try {
      const smsResult = await sendCommunicationViaOutbox({
        base44,
        channel: "sms",
        provider: "twilio",
        recipient: leadData.phone_number,
        body: messageBody,
        lead: leadData,
        leadId: lead_id,
        orderId: order_id,
        source: "sendInstantLeadResponseSms",
        sourceRecordId: lead_id,
        templateKey: "instant_lead_response_sms",
        messageType: "transactional",
        consentBasis: "transactional_relationship",
        idempotencyKey: `twilio:sms:instant-response:${leadData.phone_number}:initial-sms:${lead_id}`,
        metadata: { service_key: "instant_lead_response" },
        providerSend: (providerPayload) => sendTwilioSmsProvider({
          ...providerPayload,
          env: (name) => Deno.env.get(name),
          fetchImpl: fetch,
        }),
      });
      if (!smsResult.success && !smsResult.suppressed) {
        throw new Error(smsResult.error || smsResult.reason || "Twilio outbox send failed");
      }
      if (smsResult.suppressed) {
        return Response.json({ success: false, suppressed: true, reason: smsResult.reason, outbox_id: smsResult.outbox?.id });
      }
      messageSid = smsResult.provider_message_id;
      console.log(`[InstantResponse] SMS send success — SID: ${messageSid}, lead: ${lead_id}`);
    } catch (smsError) {
      console.error(`[InstantResponse] SMS send failed for lead ${lead_id}: ${smsError.message}`);
      await logSmsEvent(base44, lead_id, "failed", null, smsError.message);
      return Response.json({ error: smsError.message }, { status: 500 });
    }

    // Update WebsiteLead — set contacted status and follow-up anchor
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
      console.log(`[InstantResponse] WebsiteLead updated — lead: ${lead_id}`);
    } catch (updateError) {
      console.error(`[InstantResponse] WebsiteLead update failed for lead ${lead_id}: ${updateError.message}`);
      // SMS was sent — still log the event and return success
    }

    // Log CommunicationEvent for SMS
    await logSmsEvent(base44, lead_id, "sent", messageSid);

    // Send email if lead has an email address
    if (leadData.email) {
      const firstName = leadData.first_name || leadData.full_name?.split(" ")[0] || "there";
      const businessName = Deno.env.get("DEFAULT_BUSINESS_NAME") || "ClientSurge Systems";
      await sendResendEmail(base44, lead_id, leadData.email, firstName, businessName);
    } else {
      console.log(`[InstantResponse] No email address on lead ${lead_id} — email skipped`);
    }

    return Response.json({ success: true, message_id: messageSid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[InstantResponse] Error: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
});
