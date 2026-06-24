import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import twilio from "npm:twilio@4.10.0";

// Twilio error code mapping
const TWILIO_ERROR_30032 = {
  code: 30032,
  category: "sender_compliance_block",
  title: "Toll-Free Verification Required",
  explanation: "The toll-free sender number is not verified/approved for SMS traffic.",
};

// Normalize phone to E.164 format
function normalizePhoneE164(rawPhone) {
  if (!rawPhone) return null;
  const digits = String(rawPhone).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === "1") return `+${digits}`;
  if (digits.length > 0) return `+${digits}`;
  return null;
}

// Extract Twilio error code from error message
function extractTwilioErrorCode(twilioErrorString) {
  if (!twilioErrorString) return null;
  const match = String(twilioErrorString).match(/\b(\d{5})\b/);
  return match ? parseInt(match[1], 10) : null;
}

// Redact secrets from payload
function redactPayload(payload) {
  if (!payload) return null;
  const str = JSON.stringify(payload, null, 2);
  return str
    .replace(/authToken["\s:]*["\w]+/gi, "authToken: [REDACTED]")
    .replace(/password["\s:]*["\w]+/gi, "password: [REDACTED]")
    .replace(/secret["\s:]*["\w]+/gi, "secret: [REDACTED]")
    .replace(/key["\s:]*["\w]+/gi, "key: [REDACTED]");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const leadId = "6a38d0b4ae4b42c2c3e76799";

    // 1. Load WebsiteLead
    const lead = await base44.asServiceRole.entities.WebsiteLead.get(leadId).catch(() => null);
    if (!lead) {
      return new Response(JSON.stringify({ error: "Lead not found", lead_id: leadId }), { status: 404 });
    }

    const rawPhone = lead.phone_number;
    console.log(`[deliveryProofTest] Loaded lead ${leadId}, raw phone: ${rawPhone}`);

    // 2. Validate and normalize
    const normalizedPhone = normalizePhoneE164(rawPhone);
    if (!normalizedPhone) {
      return new Response(JSON.stringify({ error: "Invalid phone number", raw_phone: rawPhone }), { status: 400 });
    }

    console.log(`[deliveryProofTest] Normalized ${rawPhone} → ${normalizedPhone}`);

    // 3. Initialize Twilio
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
      return new Response(JSON.stringify({ error: "Twilio credentials missing" }), { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    // 4. Send real SMS
    const testMessage = "ClientSurge internal Twilio delivery proof test. Reply STOP to opt out.";
    const statusCallbackUrl = Deno.env.get('TWILIO_SMS_STATUS_CALLBACK_URL');
    
    const requestPayload = {
      to: normalizedPhone,
      from: fromNumber,
      body: testMessage,
      statusCallback: statusCallbackUrl,
    };

    console.log(`[deliveryProofTest] Sending SMS to ${normalizedPhone} from ${fromNumber} with statusCallback=${statusCallbackUrl}`);

    let twilioResponse = null;
    let twilioError = null;
    let providerMessageId = null;
    let providerStatus = "failed";

    try {
      twilioResponse = await client.messages.create(requestPayload);
      providerMessageId = twilioResponse.sid;
      providerStatus = twilioResponse.status; // queued, sent, delivered, etc.
      console.log(`[deliveryProofTest] Twilio accepted message SID: ${providerMessageId}, status: ${providerStatus}`);
    } catch (e) {
      twilioError = e.message || String(e);
      const errorCode = extractTwilioErrorCode(twilioError);
      console.error(`[deliveryProofTest] Twilio failed (code: ${errorCode}): ${twilioError}`);
    }

    // Extract error code for diagnostic categorization
    const errorCode = twilioError ? extractTwilioErrorCode(twilioError) : null;

    // 5. Create CommunicationLog
    const commLog = await base44.asServiceRole.entities.CommunicationLog.create({
      related_entity_type: "WebsiteLead",
      related_entity_id: leadId,
      lead_phone: rawPhone,
      canonical_to_address: normalizedPhone,
      to_address: normalizedPhone,
      from_address: fromNumber,
      provider: "twilio",
      channel: "sms",
      direction: "outbound",
      trigger_name: "delivery_proof_test",
      template_name: "delivery_proof_test",
      subject: null,
      body_preview: testMessage.substring(0, 500),
      provider_message_id: providerMessageId || null,
      provider_status: providerStatus,
      delivery_status: providerStatus === "queued" || providerStatus === "sent" ? "queued" : "failed",
      error_code: errorCode ? String(errorCode) : (twilioError ? "TWILIO_ERROR_UNMAPPED" : null),
      error_message: twilioError || null,
      request_payload_redacted: redactPayload({ To: normalizedPhone, From: fromNumber, Body: testMessage, StatusCallback: statusCallbackUrl }),
      response_payload_redacted: twilioResponse ? redactPayload(twilioResponse) : JSON.stringify({ error: twilioError }),
      sent_at: new Date().toISOString(),
      environment: "production",
    }).catch(e => {
      console.error(`[deliveryProofTest] Failed to create CommunicationLog: ${e.message}`);
      return null;
    });

    console.log(`[deliveryProofTest] CommunicationLog created: ${commLog?.id || "FAILED"}`);

    // 6. Create CommunicationEvent records
    const events = [];

    // Event 1: provider_send_attempted
    const attemptEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      channel: "sms",
      direction: "outbound",
      event_type: "provider_send_attempted",
      provider: "twilio",
      status: "pending",
      subject: "delivery_proof_test",
      message_body: testMessage,
      provider_message_id: null,
      metadata_json: JSON.stringify({
        raw_phone: rawPhone,
        normalized_phone: normalizedPhone,
        status_callback_url: statusCallbackUrl,
        test_type: "delivery_proof_test",
      }),
      environment: "production",
    }).catch(e => {
      console.error(`[deliveryProofTest] Failed to create attempt event: ${e.message}`);
      return null;
    });

    events.push({ type: "provider_send_attempted", id: attemptEvent?.id });

    // Event 2: provider_send_succeeded or provider_send_failed
    if (providerMessageId) {
      const successEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: leadId,
        channel: "sms",
        direction: "outbound",
        event_type: "provider_send_succeeded",
        provider: "twilio",
        status: "processed",
        subject: "delivery_proof_test",
        message_body: testMessage,
        provider_message_id: providerMessageId,
        metadata_json: JSON.stringify({
          raw_phone: rawPhone,
          normalized_phone: normalizedPhone,
          status_callback_url: statusCallbackUrl,
          twilio_status: providerStatus,
          test_type: "delivery_proof_test",
        }),
        environment: "production",
      }).catch(e => {
        console.error(`[deliveryProofTest] Failed to create success event: ${e.message}`);
        return null;
      });
      events.push({ type: "provider_send_succeeded", id: successEvent?.id });
    } else {
      const failedEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: leadId,
        channel: "sms",
        direction: "outbound",
        event_type: "provider_send_failed",
        provider: "twilio",
        status: "processed",
        subject: "delivery_proof_test",
        message_body: testMessage,
        error_message: twilioError,
        metadata_json: JSON.stringify({
          raw_phone: rawPhone,
          normalized_phone: normalizedPhone,
          error: twilioError,
          test_type: "delivery_proof_test",
        }),
        environment: "production",
      }).catch(e => {
        console.error(`[deliveryProofTest] Failed to create failed event: ${e.message}`);
        return null;
      });
      events.push({ type: "provider_send_failed", id: failedEvent?.id });
    }

    // Build diagnostic for the proof
    let diagnostic = null;
    if (errorCode === 30032) {
      diagnostic = {
        error_code: 30032,
        title: "Toll-Free Verification Required",
        category: "sender_compliance_block",
        explanation: "The toll-free sender number is not verified/approved for US/Canada SMS traffic.",
        next_action: [
          "Open Twilio Console > Phone Numbers > Manage > Active Numbers",
          "Select the toll-free sender: " + fromNumber,
          "Check Regulatory Information / Toll-Free Verification status",
          "Complete or fix the verification process",
          "Do not retry production SMS until verification is approved",
        ],
        is_launch_blocker: true,
      };
    }

    // Return proof
    const proof = {
      test_type: "delivery_proof_test",
      timestamp: new Date().toISOString(),
      lead_id: leadId,
      raw_phone: rawPhone,
      normalized_phone: normalizedPhone,
      twilio_from: fromNumber,
      provider_message_id: providerMessageId,
      provider_status: providerStatus,
      delivery_status: commLog?.delivery_status || "failed",
      communication_log_id: commLog?.id,
      events: events,
      error_code: errorCode,
      error: twilioError,
      diagnostic: diagnostic,
      message: providerMessageId
        ? `✓ SMS accepted by Twilio (SID: ${providerMessageId}). Awaiting delivery confirmation via status callback.`
        : `✗ SMS rejected by Twilio (Code ${errorCode}): ${twilioError}`,
    };

    console.log(`[deliveryProofTest] PROOF: ${JSON.stringify(proof, null, 2)}`);

    return new Response(JSON.stringify(proof, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[deliveryProofTest] Unhandled error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});