/**
 * Webhook: /webhooks/twilio-calls
 * Handles Twilio call events with robust validation & error logging
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import crypto from "node:crypto";

const CALL_STATUS_VALID = ["queued", "ringing", "in-progress", "completed", "failed", "busy", "no-answer", "canceled"];

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

    console.log("[TwilioCalls] Received event:", payload.CallStatus);

    // ─────────────────────────────────────────────────────
    // STEP 1: Validate Twilio signature
    // ─────────────────────────────────────────────────────
    const signature = req.headers.get("X-Twilio-Signature");
    const token = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (signature && token) {
      const url = new URL(req.url).toString();
      const data = new URLSearchParams(formData);
      const toSign = url + Array.from(data.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}${v}`)
        .join("");
      const computed = crypto.createHmac("sha1", token).update(toSign).digest("base64");
      if (computed !== signature) {
        console.warn("[TwilioCalls] Signature mismatch");
        await logValidationError(base44, {
          error_code: "INVALID_SIGNATURE",
          error_message: "Twilio signature mismatch",
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
    if (payload.CallStatus && !CALL_STATUS_VALID.includes(payload.CallStatus)) {
      errors.push(`CallStatus must be one of: ${CALL_STATUS_VALID.join(", ")}`);
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
      console.warn("[TwilioCalls] Validation errors:", errors);
      await logValidationError(base44, {
        error_code: "INVALID_PAYLOAD",
        error_message: errors.join("; "),
        payload_preview: { CallSid: payload.CallSid, From: payload.From },
      });
      return Response.json({ error: "Invalid payload", details: errors }, { status: 400 });
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

    console.log("[TwilioCalls] Validated event:", callEvent);

    // ─────────────────────────────────────────────────────
    // STEP 4: Find project & lead
    // ─────────────────────────────────────────────────────
    const project = await findProjectByPhoneNumber(base44, callEvent.to_number);
    if (!project) {
      console.warn("[TwilioCalls] No project for number:", callEvent.to_number);
      await logValidationError(base44, {
        error_code: "NO_PROJECT_FOUND",
        error_message: `No project matched phone ${callEvent.to_number}`,
        payload_preview: { CallSid: callEvent.call_sid, To: callEvent.to_number },
      });
      return new Response("OK", { status: 200 });
    }

    const lead = await findOrCreateLeadByPhone(base44, callEvent.from_number, project);

    // ─────────────────────────────────────────────────────
    // STEP 5: Log & process
    // ─────────────────────────────────────────────────────
    await logCallEvent(base44, lead, project, callEvent);

    if (callEvent.call_status === "no-answer" || callEvent.call_status === "failed") {
      await handleMissedCall(base44, lead, project, callEvent);
    }

    if (callEvent.recording_url) {
      await logRecording(base44, lead, callEvent);
    }

    // Log success
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead.id,
      channel: "webhook",
      direction: "inbound",
      event_type: "webhook_processed",
      provider: "twilio",
      status: "success",
      subject: `[TWILIO] Call ${callEvent.call_status}`,
      metadata_json: JSON.stringify({
        call_sid: callEvent.call_sid,
        from: callEvent.from_number,
        processed_at: new Date().toISOString(),
      }),
    });

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[TwilioCalls] Runtime error:", error.message);
    if (base44) {
      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          channel: "webhook",
          direction: "inbound",
          event_type: "webhook_processing_error",
          provider: "twilio",
          status: "failed",
          subject: "[TWILIO] Processing Error",
          message_body: error.message,
          error_message: error.message,
          metadata_json: JSON.stringify({
            call_sid: callEvent.call_sid || "unknown",
            error_stage: "processing",
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (logErr) {
        console.error("[TwilioCalls] Failed to log error:", logErr.message);
      }
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ─────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────

async function logValidationError(base44, { error_code, error_message, payload_preview }) {
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: "webhook",
      direction: "inbound",
      event_type: "webhook_validation_failed",
      provider: "twilio",
      status: "failed",
      subject: `[TWILIO] Validation Failed: ${error_code}`,
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

// ─────────────────────────────────────────────────────
// CORE HELPERS
// ─────────────────────────────────────────────────────

async function findProjectByPhoneNumber(base44, toNumber) {
  const formattedNumber = toNumber.replace(/\D/g, "");
  const projects = await base44.asServiceRole.entities.ClientProject.filter({}, "-created_date", 500);
  if (!projects) return null;

  for (const project of projects) {
    const config = project.install_configuration?.services?.missed_call_text_back;
    if (config?.twilio_number) {
      const projectNumber = config.twilio_number.replace(/\D/g, "");
      if (projectNumber === formattedNumber) return project;
    }
  }
  return null;
}

async function findOrCreateLeadByPhone(base44, fromNumber, project) {
  const existing = await base44.asServiceRole.entities.Leads.filter(
    { phone: fromNumber },
    "-created_date",
    1
  );

  if (existing?.length > 0) return existing[0];

  console.log("[TwilioCalls] Creating new lead from inbound call");
  return await base44.asServiceRole.entities.Leads.create({
    full_name: "Unknown Caller",
    business_name: "Not provided",
    email: "",
    phone: fromNumber,
    business_type: "Unknown",
    problem: "Inbound call",
    source: "phone_call",
    status: "New",
    lead_score: 40,
    activation_priority: "High",
    intake_type: "call",
    assigned_to: project.owner_email,
  });
}

async function logCallEvent(base44, lead, project, callEvent) {
  await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: lead.id,
    client_project_id: project.id,
    service_key: "missed_call_text_back",
    channel: "call",
    direction: "inbound",
    event_type: callEvent.call_status === "completed" ? "call_received" : "call_missed",
    provider: "twilio",
    status: callEvent.call_status,
    subject: `Inbound call from ${callEvent.from_number}`,
    message_body: `Call status: ${callEvent.call_status}, Duration: ${callEvent.call_duration}s`,
    provider_message_id: callEvent.call_sid,
    metadata_json: JSON.stringify({
      from_number: callEvent.from_number,
      to_number: callEvent.to_number,
      call_duration: callEvent.call_duration,
      recording_url: callEvent.recording_url,
    }),
  });
}

async function handleMissedCall(base44, lead, project, callEvent) {
  console.log("[TwilioCalls] Handling missed call");

  const config = project.install_configuration?.services?.missed_call_text_back;
  if (!config?.enabled) {
    console.warn("[TwilioCalls] Missed call recovery not enabled");
    return;
  }

  const template = await base44.asServiceRole.entities.MessageTemplate.get(
    config.sms_template_id
  ).catch(() => null);

  if (!template) {
    console.warn("[TwilioCalls] SMS template not found");
    return;
  }

  const messageBody = fillTemplate(template.body, {
    name: lead.full_name,
    days: project.business_hours || "Mon-Fri 9am-5pm",
    booking_link: project.booking_link || "https://calendly.com/",
  });

  await base44.asServiceRole.entities.AutomationJob.create({
    lead_id: lead.id,
    job_type: "instant_sms",
    trigger_event: "missed_call",
    status: "queued",
    scheduled_for: new Date().toISOString(),
    result_metadata: JSON.stringify({
      template_id: config.sms_template_id,
      recipient_phone: lead.phone,
      message_body: messageBody,
      triggered_by_call_sid: callEvent.call_sid,
    }),
  });

  await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: lead.id,
    client_project_id: project.id,
    service_key: "missed_call_text_back",
    channel: "sms",
    direction: "outbound",
    event_type: "sms_sent",
    provider: "twilio",
    status: "pending",
    message_body: messageBody,
    metadata_json: JSON.stringify({
      triggered_by: "missed_call",
      call_sid: callEvent.call_sid,
    }),
  });

  await base44.asServiceRole.entities.Leads.update(lead.id, {
    status: "Contacted",
    last_contacted_at: new Date().toISOString(),
  });

  console.log("[TwilioCalls] Missed call SMS queued for:", lead.phone);
}

async function logRecording(base44, lead, callEvent) {
  await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: lead.id,
    event_type: "call_recording",
    channel: "call",
    direction: "inbound",
    provider: "twilio",
    status: "recorded",
    subject: "Call recording available",
    message_body: callEvent.recording_url,
    provider_message_id: callEvent.call_sid,
    metadata_json: JSON.stringify({ recording_url: callEvent.recording_url }),
  });
}

function fillTemplate(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  }
  return result;
}