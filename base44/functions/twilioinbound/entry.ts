/**
 * PUBLIC WEBHOOK: Twilio Inbound Call Handler
 * POST: /api/twilioinbound
 * 
 * Handles ALL Twilio call events:
 * - Incoming calls (CallStatus: ringing, in-progress)
 * - Missed calls (CallStatus: no-answer, failed)
 * - Status callbacks (CallStatus: completed, busy, canceled)
 * - Call recordings
 * 
 * NO authentication required (Twilio sends requests)
 * Validates via signature verification
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import crypto from "node:crypto";

const CALL_STATUS_VALID = [
  "queued",
  "ringing",
  "in-progress",
  "completed",
  "failed",
  "busy",
  "no-answer",
  "canceled",
];

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let base44;
  let callEvent = {};

  try {
    base44 = createClientFromRequest(req);

    // Parse form-encoded Twilio webhook
    const formData = await req.formData();
    const payload = Object.fromEntries(formData);

    console.log("[TwilioInbound] Received event:", payload.CallStatus, "from", payload.From);

    // ─────────────────────────────────────────────────────
    // STEP 1: Validate Twilio signature
    // ─────────────────────────────────────────────────────
    const signature = req.headers.get("X-Twilio-Signature");
    const token = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (signature && token) {
      const url = new URL(req.url).toString();
      const data = new URLSearchParams(formData);
      const toSign =
        url +
        Array.from(data.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}${v}`)
          .join("");
      const computed = crypto
        .createHmac("sha1", token)
        .update(toSign)
        .digest("base64");
      if (computed !== signature) {
        console.warn("[TwilioInbound] Signature mismatch - rejecting");
        await logValidationError(base44, {
          error_code: "INVALID_SIGNATURE",
          error_message: "Twilio signature verification failed",
          payload_preview: { CallSid: payload.CallSid, From: payload.From },
        });
        return Response.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // ─────────────────────────────────────────────────────
    // STEP 2: Validate required fields
    // ─────────────────────────────────────────────────────
    const errors = [];
    if (!payload.CallSid) errors.push("CallSid is required");
    if (!payload.From) errors.push("From is required");
    if (!payload.To) errors.push("To is required");
    if (!payload.CallStatus) errors.push("CallStatus is required");
    if (
      payload.CallStatus &&
      !CALL_STATUS_VALID.includes(payload.CallStatus)
    ) {
      errors.push(
        `CallStatus must be one of: ${CALL_STATUS_VALID.join(", ")}`
      );
    }
    if (payload.CallDuration && !/^\d+$/.test(payload.CallDuration)) {
      errors.push("CallDuration must be numeric");
    }
    if (payload.From && !/^[\+]?[1-9]\d{1,14}$/.test(payload.From)) {
      errors.push("From number format invalid");
    }
    if (payload.To && !/^[\+]?[1-9]\d{1,14}$/.test(payload.To)) {
      errors.push("To number format invalid");
    }

    if (errors.length > 0) {
      console.warn("[TwilioInbound] Validation errors:", errors);
      await logValidationError(base44, {
        error_code: "INVALID_PAYLOAD",
        error_message: errors.join("; "),
        payload_preview: { CallSid: payload.CallSid, From: payload.From },
      });
      return Response.json(
        { error: "Invalid payload", details: errors },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────
    // STEP 3: Normalize and sanitize
    // ─────────────────────────────────────────────────────
    callEvent = {
      call_sid: (payload.CallSid || "").trim(),
      from_number: (payload.From || "").trim(),
      to_number: (payload.To || "").trim(),
      call_status: (payload.CallStatus || "unknown").toLowerCase(),
      call_duration: parseInt(payload.CallDuration || "0", 10),
      recording_url: (payload.RecordingUrl || "").trim() || null,
      recording_sid: (payload.RecordingSid || "").trim() || null,
      timestamp: new Date().toISOString(),
    };

    console.log("[TwilioInbound] Validated call event:", callEvent.call_sid, callEvent.call_status);

    // ─────────────────────────────────────────────────────
    // STEP 4: Detect missed call vs answered
    // ─────────────────────────────────────────────────────
    const isMissedCall =
      callEvent.call_status === "no-answer" ||
      callEvent.call_status === "failed" ||
      callEvent.call_status === "busy";
    const isAnsweredCall = callEvent.call_status === "completed";

    // If call was answered, just log it and return (no automation)
    if (isAnsweredCall) {
      console.log("[TwilioInbound] Call answered - logging only, no recovery automation");
      await base44.asServiceRole.entities.CommunicationEvent.create({
        channel: "webhook",
        direction: "inbound",
        event_type: "call_answered",
        provider: "twilio",
        status: "completed",
        subject: `[TWILIO] Answered call from ${callEvent.from_number}`,
        message_body: `Duration: ${callEvent.call_duration}s`,
        provider_message_id: callEvent.call_sid,
        metadata_json: JSON.stringify({
          call_sid: callEvent.call_sid,
          from: callEvent.from_number,
          to: callEvent.to_number,
          duration: callEvent.call_duration,
          timestamp: callEvent.timestamp,
        }),
      });
      return Response.json({ status: "logged_answered", call_sid: callEvent.call_sid }, { status: 200 });
    }

    // ─────────────────────────────────────────────────────
    // STEP 5: For MISSED calls - create/find lead & trigger recovery
    // ─────────────────────────────────────────────────────
    if (isMissedCall) {
      console.log("[TwilioInbound] MISSED CALL DETECTED - triggering recovery automation");

      // Find or create lead
      const lead = await findOrCreateLeadByPhone(base44, callEvent.from_number);
      if (!lead) {
        console.warn("[TwilioInbound] Failed to create/find lead");
        await logValidationError(base44, {
          error_code: "LEAD_CREATE_FAILED",
          error_message: "Could not create or find lead for phone number",
          payload_preview: { from: callEvent.from_number },
        });
        return Response.json("OK", { status: 200 }); // Still accept but log
      }

      // Log the missed call event
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: lead.id,
        channel: "call",
        direction: "inbound",
        event_type: "call_missed",
        provider: "twilio",
        status: callEvent.call_status,
        subject: `[TWILIO] Missed call from ${callEvent.from_number}`,
        message_body: `Call status: ${callEvent.call_status}`,
        provider_message_id: callEvent.call_sid,
        metadata_json: JSON.stringify({
          call_sid: callEvent.call_sid,
          from: callEvent.from_number,
          to: callEvent.to_number,
          duration: callEvent.call_duration,
          timestamp: callEvent.timestamp,
        }),
      });

      // Queue SMS recovery message
      await base44.asServiceRole.entities.AutomationJob.create({
        lead_id: lead.id,
        job_type: "instant_sms",
        trigger_event: "missed_call",
        status: "queued",
        scheduled_for: new Date().toISOString(),
        result_metadata: JSON.stringify({
          call_sid: callEvent.call_sid,
          recipient_phone: lead.phone,
          triggered_at: callEvent.timestamp,
        }),
      });

      // Update lead status
      await base44.asServiceRole.entities.Leads.update(lead.id, {
        status: "Contacted",
        last_contacted_at: new Date().toISOString(),
        activation_priority: "Hot", // Mark as hot priority
      });

      console.log("[TwilioInbound] Missed call automation queued for lead:", lead.id);
    }

    // Log recording if present
    if (callEvent.recording_url) {
      const lead = await findOrCreateLeadByPhone(base44, callEvent.from_number);
      if (lead) {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: lead.id,
          channel: "call",
          direction: "inbound",
          event_type: "call_recording",
          provider: "twilio",
          status: "recorded",
          subject: "Call recording available",
          message_body: callEvent.recording_url,
          provider_message_id: callEvent.call_sid,
          metadata_json: JSON.stringify({
            recording_url: callEvent.recording_url,
            recording_sid: callEvent.recording_sid,
          }),
        });
      }
    }

    // Twilio expects 200 OK response
    return Response.json({ status: "ok", call_sid: callEvent.call_sid }, { status: 200 });
  } catch (error) {
    console.error("[TwilioInbound] Runtime error:", error.message);
    if (base44) {
      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          channel: "webhook",
          direction: "inbound",
          event_type: "webhook_error",
          provider: "twilio",
          status: "failed",
          subject: "[TWILIO] Webhook Processing Error",
          message_body: error.message,
          error_message: error.message,
          metadata_json: JSON.stringify({
            call_sid: callEvent.call_sid || "unknown",
            error_stage: "processing",
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (logErr) {
        console.error("[TwilioInbound] Failed to log error:", logErr.message);
      }
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────

async function logValidationError(
  base44,
  { error_code, error_message, payload_preview }
) {
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: "webhook",
      direction: "inbound",
      event_type: "webhook_validation_failed",
      provider: "twilio",
      status: "failed",
      subject: `[TWILIO] Validation Error: ${error_code}`,
      message_body: error_message,
      metadata_json: JSON.stringify({
        error_code,
        payload_preview,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error("[logValidationError] Failed:", err.message);
  }
}

async function findOrCreateLeadByPhone(base44, fromNumber) {
  // Deduplication: check if lead exists
  const existing = await base44.asServiceRole.entities.Leads.filter(
    { phone: fromNumber },
    "-created_date",
    1
  );

  if (existing?.length > 0) {
    console.log("[TwilioInbound] Found existing lead for phone:", fromNumber);
    return existing[0];
  }

  // Create new lead from incoming call
  console.log("[TwilioInbound] Creating new lead from inbound call");
  try {
    const newLead = await base44.asServiceRole.entities.Leads.create({
      full_name: "Unknown Caller",
      business_name: "Not provided",
      email: "",
      phone: fromNumber,
      business_type: "Unknown",
      problem: "Inbound phone call",
      source: "phone_call",
      status: "New",
      lead_score: 50,
      activation_priority: "High",
      intake_type: "call",
    });
    return newLead;
  } catch (error) {
    console.error("[TwilioInbound] Failed to create lead:", error.message);
    return null;
  }
}