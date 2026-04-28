/**
 * Webhook: /webhooks/twilio-calls
 * Handles Twilio call events: missed calls, voicemails, status updates
 * Triggers missed call recovery SMS and logging
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  // Twilio sends form-encoded data, not JSON
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    // Parse form-encoded Twilio webhook
    const formData = await req.formData();
    const payload = Object.fromEntries(formData);

    console.log("[TwilioCalls] Received event:", payload.CallStatus);

    // Validate Twilio request signature (optional, but recommended)
    // const isValid = validateTwilioRequest(req, payload);
    // if (!isValid) return new Response("Unauthorized", { status: 403 });

    const callEvent = {
      call_sid: payload.CallSid || "",
      from_number: payload.From || "",
      to_number: payload.To || "",
      call_status: payload.CallStatus || "unknown",
      call_duration: payload.CallDuration || "0",
      recording_url: payload.RecordingUrl || null,
      timestamp: new Date().toISOString(),
    };

    console.log("[TwilioCalls] Parsed event:", callEvent);

    // 1. Find client project by phone number
    const project = await findProjectByPhoneNumber(base44, callEvent.to_number);
    if (!project) {
      console.warn("[TwilioCalls] No matching project for number:", callEvent.to_number);
      return new Response("OK", { status: 200 }); // Accept but don't process
    }

    // 2. Find or create lead by phone number
    const lead = await findOrCreateLeadByPhone(base44, callEvent.from_number, project);

    // 3. Log call event
    await logCallEvent(base44, lead, project, callEvent);

    // 4. Handle missed call (trigger SMS recovery if applicable)
    if (callEvent.call_status === "no-answer" || callEvent.call_status === "failed") {
      await handleMissedCall(base44, lead, project, callEvent);
    }

    // 5. Log recording if present
    if (callEvent.recording_url) {
      await logRecording(base44, lead, callEvent);
    }

    return new Response("OK", { status: 200 }); // Twilio expects 200 OK
  } catch (error) {
    console.error("[TwilioCalls] Error:", error.message);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────

async function findProjectByPhoneNumber(base44, toNumber) {
  // Format number consistently
  const formattedNumber = toNumber.replace(/\D/g, "");

  // Search for project with matching Twilio number
  const projects = await base44.asServiceRole.entities.ClientProject.filter(
    {},
    "-created_date",
    500
  );

  if (!projects) return null;

  // Check install_configuration for Twilio number
  for (const project of projects) {
    const config = project.install_configuration?.services?.missed_call_text_back;
    if (config?.twilio_number) {
      const projectNumber = config.twilio_number.replace(/\D/g, "");
      if (projectNumber === formattedNumber) {
        return project;
      }
    }
  }

  return null;
}

async function findOrCreateLeadByPhone(base44, fromNumber, project) {
  // Search for existing lead with this phone
  const existing = await base44.asServiceRole.entities.Leads.filter(
    { phone: fromNumber },
    "-created_date",
    1
  );

  if (existing?.length > 0) {
    return existing[0];
  }

  // Create new lead from phone number
  console.log("[TwilioCalls] Creating new lead from inbound call");

  const lead = await base44.asServiceRole.entities.Leads.create({
    full_name: "Unknown Caller",
    business_name: "Not provided",
    email: "",
    phone: fromNumber,
    business_type: "Unknown",
    problem: "Inbound call",
    source: "phone_call",
    status: "New",
    lead_score: 40,
    activation_priority: "High", // Phone calls are high priority
    intake_type: "call",
    assigned_to: project.owner_email,
    created_date: new Date().toISOString(),
  });

  return lead;
}

async function logCallEvent(base44, lead, project, callEvent) {
  console.log("[TwilioCalls] Logging call event");

  await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: lead.id,
    client_project_id: project.id,
    service_key: "missed_call_text_back",
    channel: "call",
    direction: "inbound",
    event_type:
      callEvent.call_status === "completed" ? "call_received" : "call_missed",
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
  console.log("[TwilioCalls] Handling missed call - triggering SMS recovery");

  // Get missed call config
  const config = project.install_configuration?.services?.missed_call_text_back;
  if (!config?.enabled) {
    console.warn("[TwilioCalls] Missed call recovery not enabled");
    return;
  }

  // Get SMS template
  const template = await base44.asServiceRole.entities.MessageTemplate.get(
    config.sms_template_id
  ).catch(() => null);

  if (!template) {
    console.warn("[TwilioCalls] SMS template not found");
    return;
  }

  // Fill template
  const messageBody = fillTemplate(template.body, {
    name: lead.full_name,
    days: project.business_hours || "Mon-Fri 9am-5pm",
    booking_link: project.booking_link || "https://calendly.com/",
  });

  // Queue SMS send
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

  // Log the SMS that will be sent
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

  // Update lead status
  await base44.asServiceRole.entities.Leads.update(lead.id, {
    status: "Contacted",
    last_contacted_at: new Date().toISOString(),
  });

  console.log("[TwilioCalls] Missed call SMS queued for:", lead.phone);
}

async function logRecording(base44, lead, callEvent) {
  console.log("[TwilioCalls] Logging call recording");

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
    metadata_json: JSON.stringify({
      recording_url: callEvent.recording_url,
    }),
  });
}

function fillTemplate(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  }
  return result;
}

// Optional: Validate Twilio request signature
// function validateTwilioRequest(req, payload) {
//   const signature = req.headers.get("X-Twilio-Signature");
//   const url = new URL(req.url).toString();
//   const token = Deno.env.get("TWILIO_AUTH_TOKEN");
//
//   // Implement Twilio signature validation
//   // See: https://www.twilio.com/docs/usage/security#validating-requests
//   return true; // Simplified for now
// }