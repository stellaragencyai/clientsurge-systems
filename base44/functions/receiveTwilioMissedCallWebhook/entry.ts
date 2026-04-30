/**
 * Missed Call Text-Back Handler
 * Triggered when a call comes in and no one answers
 * Sends automatic SMS to reopen conversation
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import crypto from "node:crypto";

async function validateTwilioSignature(req, rawBody) {
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!token) {
    console.error("[MissedCall] TWILIO_AUTH_TOKEN is not set — cannot validate signature");
    return { valid: false, missing_token: true };
  }

  const signature = req.headers.get("X-Twilio-Signature");
  if (!signature) {
    console.warn("[MissedCall] X-Twilio-Signature header is missing");
    return { valid: false, missing_signature: true };
  }

  console.log("[MissedCall] Validating Twilio signature...");

  const url = new URL(req.url).toString();
  const params = new URLSearchParams(rawBody);
  const toSign =
    url +
    Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}${v}`)
      .join("");

  const computed = crypto.createHmac("sha1", token).update(toSign).digest("base64");

  if (computed !== signature) {
    console.warn("[MissedCall] Signature invalid — request rejected");
    return { valid: false };
  }

  console.log("[MissedCall] Signature valid");
  return { valid: true };
}

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

const DEFAULT_MISSED_CALL_SMS = "Hi {first_name}, we missed your call! Text back or reply to this message and we'll get right back to you.";

function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `+${digits.length === 10 ? "1" : ""}${digits}`;
}

function formatSmsTemplate(template, lead) {
  return template
    .replace("{first_name}", lead.first_name || lead.full_name?.split(" ")[0] || "there")
    .replace("{business_name}", lead.business_name || "our business");
}

async function sendTwilioSms(toNumber, messageBody) {
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");
  if (!statusCallbackUrl) {
    console.warn("[MissedCall] TWILIO_SMS_STATUS_CALLBACK_URL missing — SMS delivery tracking disabled");
  }

  console.log(`[MissedCall] Sending SMS to ${toNumber}`);

  const params = { From: TWILIO_FROM_NUMBER, To: toNumber, Body: messageBody };
  if (statusCallbackUrl) params.StatusCallback = statusCallbackUrl;

  const response = await fetch(TWILIO_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Twilio] Error: ${response.status} - ${error}`);
    throw new Error(`Twilio SMS failed: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[MissedCall] SMS sent. SID: ${data.sid}`);
  return data.sid;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    // Read raw body for signature validation (must be done before formData)
    const rawBody = await req.text();

    // Validate Twilio signature before processing anything
    const sigResult = await validateTwilioSignature(req, rawBody);
    if (sigResult.missing_token) {
      return Response.json({ error: "Server configuration error" }, { status: 500 });
    }
    if (!sigResult.valid) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse Twilio webhook payload
    const formData = new URLSearchParams(rawBody);
    const callSid = formData.get("CallSid");
    const fromNumber = formData.get("From");
    const callStatus = formData.get("CallStatus");

    console.log(`[MissedCall] Webhook received. Status: ${callStatus}, From: ${fromNumber}`);

    if (callStatus !== "no-answer" && callStatus !== "failed") {
      console.log(`[MissedCall] Call status ${callStatus} does not require text-back`);
      return Response.json({ message: "No text-back needed" });
    }

    if (!fromNumber) {
      return Response.json({ error: "Missing phone number" }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(fromNumber);
    if (!normalizedPhone) {
      return Response.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // ─────────────────────────────────────────────────────────
    // STEP 1: Find or create lead in Leads entity (for missed-call processor)
    // ─────────────────────────────────────────────────────────
    let lead;
    const now = new Date().toISOString();
    
    try {
      const leads = await base44.asServiceRole.entities.Leads.filter(
        { phone: normalizedPhone },  
        "-last_contacted_at",
        1
      );
      
      if (leads && leads.length > 0) {
        lead = leads[0];
        console.log(`[MissedCall] Found existing lead ${lead.id}`);
      } else {
        // Create new lead with "Contacted" status so processMissedCallFollowUps will pick it up
        lead = await base44.asServiceRole.entities.Leads.create({
          full_name: "Unknown Caller",
          business_name: "Unknown Business",
          email: "unknown@example.com",
          phone: normalizedPhone,
          business_type: "Unknown",
          problem: "Missed call inbound",
          source: "twilio_missed_call",
          status: "Contacted",
          activation_priority: "Hot",
          last_contacted_at: now,
        });
        console.log(`[MissedCall] Created new lead ${lead.id} from missed call`);
      }
    } catch (e) {
      console.error(`[MissedCall] Lead lookup/creation failed: ${e.message}`);
      // Continue anyway — SMS will still be sent
      lead = null;
    }

    // Get SMS template from settings
    let smsTemplate = DEFAULT_MISSED_CALL_SMS;
    try {
      const settings = await base44.asServiceRole.entities.AdminSettings.filter({}, null, 1);
      if (settings && settings.length > 0 && settings[0].missed_call_sms_template) {
        smsTemplate = settings[0].missed_call_sms_template;
      }
    } catch (e) {
      console.warn(`[MissedCall] Settings fetch failed: ${e.message}`);
    }

    // Format message
    const messageBody = lead
      ? formatSmsTemplate(smsTemplate, lead)
      : smsTemplate.replace("{first_name}", "there").replace("{business_name}", "our business");

    // Send SMS
    const messageSid = await sendTwilioSms(normalizedPhone, messageBody);

    // ─────────────────────────────────────────────────────────
    // STEP 2: Update lead and log missed-call inbound event
    // ─────────────────────────────────────────────────────────
    if (lead) {
      try {
        // Update lead: ensure activation_priority stays Hot and last_contacted_at is current
        await base44.asServiceRole.entities.Leads.update(lead.id, {
          status: "Contacted",
          activation_priority: "Hot",
          last_contacted_at: now,
        });
        console.log(`[MissedCall] Updated lead ${lead.id} — status=Contacted, priority=Hot`);
      } catch (e) {
        console.error(`[MissedCall] Failed to update lead: ${e.message}`);
      }

      // ─────────────────────────────────────────────────────────
      // STEP 3: Log inbound missed call event
      // ─────────────────────────────────────────────────────────
      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: lead.id,
          channel: "sms",
          direction: "inbound",
          event_type: "missed_call",
          provider: "twilio",
          status: "received",
          subject: `[TWILIO] Missed call from ${normalizedPhone}`,
          message_body: `Missed call (no answer / failed). Automated text-back sent.`,
          provider_message_id: callSid,
          metadata_json: JSON.stringify({
            service_key: "missed_call_text_back",
            inbound_call_sid: callSid,
            caller_phone: normalizedPhone,
            call_status: callStatus,
            sms_response_sent: messageSid,
            timestamp: now,
            trigger: "missed_call_webhook",
          }),
        });
        console.log(`[MissedCall] Logged missed-call event for lead ${lead.id}`);
      } catch (e) {
        console.warn(`[MissedCall] Failed to log event: ${e.message}`);
      }

      // ─────────────────────────────────────────────────────────
      // STEP 4: Log outbound SMS response
      // ─────────────────────────────────────────────────────────
      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: lead.id,
          channel: "sms",
          direction: "outbound",
          event_type: "sms_sent",
          provider: "twilio",
          status: "sent",
          message_body: messageBody,
          provider_message_id: messageSid,
          metadata_json: JSON.stringify({
            service_key: "missed_call_text_back",
            trigger: "missed_call_webhook",
            timestamp: now,
          }),
        });
        console.log(`[MissedCall] Logged SMS response for lead ${lead.id}`);
      } catch (e) {
        console.warn(`[MissedCall] Failed to log SMS event: ${e.message}`);
      }
    } else {
      console.log(`[MissedCall] No lead created/found for ${normalizedPhone}, SMS sent anyway`);
    }

    return Response.json({ success: true, message_id: messageSid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[MissedCall] Handler error: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
});