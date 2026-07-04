/**
 * getProofWorkflowScaffolding — Admin-only proof workflow guidance.
 *
 * Returns step-by-step proof generation instructions for each first-launch
 * scope automation. Does NOT create proof records. Does NOT fabricate pass.
 *
 * A proof record may only be "pass" if:
 *   - Related CommunicationLog or CommunicationEvent exists
 *   - provider_message_id exists (real Twilio SID, not test prefix)
 *   - Final delivery/result proof exists (delivery_status=delivered)
 *   - Record is not internal/test/smoke unless explicitly labeled QA-only
 *
 * If evidence is incomplete, status remains "pending" or "fail", never "pass".
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

const PROOF_WORKFLOWS = {
  instant_lead_response: {
    label: "Instant Lead Response (Speed-to-Lead)",
    service_key: "instant_lead_response",
    test_type: "form_submission",
    steps: [
      "1. Ensure webhook routes are healthy (run verifyTwilioWebhookRouteHealth first).",
      "2. Submit a real lead through the website lead capture form.",
      "3. Wait for the instant_lead_response SMS to be sent (check CommunicationLog).",
      "4. Wait for Twilio delivery callback (delivery_status must become 'delivered').",
      "5. Verify CommunicationLog has a real provider_message_id (starts with SM, not CA_TEST).",
      "6. Verify delivery_status='delivered' and delivered_at is set.",
      "7. Only after all evidence exists, create an AutomationProofLog with status='pass'.",
      "8. If any evidence is missing, keep AutomationProofLog status='pending' or 'fail'.",
    ],
    required_evidence: {
      communication_log: {
        channel: "sms",
        provider: "twilio",
        direction: "outbound",
        environment: "production",
        dashboard_excluded: { $ne: true },
        provider_message_id_pattern: "^SM[a-zA-Z0-9]+$",
        delivery_status: "delivered",
        delivered_at_exists: true,
        failed_at_absent: true,
      },
      communication_event: {
        channel: "sms",
        provider: "twilio",
        direction: "outbound",
        event_type: "sms_sent",
        provider_message_id_pattern: "^SM[a-zA-Z0-9]+$",
      },
    },
    failure_conditions: [
      "No CommunicationLog found for outbound SMS",
      "provider_message_id is null or starts with CA_TEST/SMOKE",
      "delivery_status is 'queued' or 'sent' (not 'delivered')",
      "delivered_at is missing",
      "failed_at is present",
      "environment is not 'production'",
      "dashboard_excluded is true (test/smoke record)",
    ],
  },
  missed_call_text_back: {
    label: "Missed Call Text-Back",
    service_key: "missed_call_text_back",
    test_type: "missed_call_test",
    steps: [
      "1. Ensure missed-call webhook route is healthy (run verifyTwilioWebhookRouteHealth).",
      "2. Place a real missed call to the Twilio number (call and hang up).",
      "3. Wait for Twilio to fire the missed-call webhook (CallStatus=no-answer).",
      "4. Verify a CommunicationEvent exists for the inbound call (event_type=voice_call_initiated).",
      "5. Verify an outbound SMS CommunicationLog was created (text-back sent).",
      "6. Wait for Twilio delivery callback (delivery_status='delivered').",
      "7. Verify provider_message_id for both the CallSid and MessageSid are real.",
      "8. Only after all evidence exists, create an AutomationProofLog with status='pass'.",
      "9. If any evidence is missing, keep AutomationProofLog status='pending' or 'fail'.",
    ],
    required_evidence: {
      inbound_call_event: {
        channel: "voice",
        direction: "inbound",
        provider: "twilio",
        provider_message_id_pattern: "^CA[a-zA-Z0-9]+$",
      },
      outbound_sms_log: {
        channel: "sms",
        provider: "twilio",
        direction: "outbound",
        environment: "production",
        provider_message_id_pattern: "^SM[a-zA-Z0-9]+$",
        delivery_status: "delivered",
        delivered_at_exists: true,
        failed_at_absent: true,
      },
    },
    failure_conditions: [
      "No inbound voice CommunicationEvent found",
      "No outbound SMS CommunicationLog found",
      "CallSid starts with CA_TEST or SMOKE (not a real call)",
      "MessageSid is null or starts with CA_TEST/SMOKE",
      "delivery_status is 'queued' or 'sent' (not 'delivered')",
      "delivered_at is missing",
      "failed_at is present",
      "environment is not 'production'",
      "dashboard_excluded is true (test/smoke record)",
    ],
  },
};

function isRealSid(value, prefix) {
  if (!value || typeof value !== "string") return false;
  const pattern = new RegExp(`^${prefix}[a-zA-Z0-9]+$`);
  return pattern.test(value);
}

async function checkInstantLeadResponseEvidence(base44) {
  const result = {
    has_communication_log: false,
    has_communication_event: false,
    has_real_provider_message_id: false,
    is_delivered: false,
    has_delivered_at: false,
    no_failed_at: false,
    is_production: false,
    not_excluded: false,
    evidence_records: [],
    overall_status: "pending",
  };

  try {
    const logs = await base44.asServiceRole.entities.CommunicationLog.filter(
      {
        channel: "sms",
        provider: "twilio",
        direction: "outbound",
      },
      "-created_date",
      50
    );

    for (const log of logs || []) {
      const record = {
        id: log.id,
        provider_message_id: log.provider_message_id || null,
        delivery_status: log.delivery_status || null,
        delivered_at: log.delivered_at || null,
        failed_at: log.failed_at || null,
        environment: log.environment || "unknown",
        dashboard_excluded: log.dashboard_excluded === true,
        is_real_sid: isRealSid(log.provider_message_id, "SM"),
        is_delivered: log.delivery_status === "delivered",
        is_production: log.environment === "production",
      };

      if (
        record.is_real_sid &&
        record.is_delivered &&
        record.is_production &&
        !record.dashboard_excluded &&
        log.delivered_at &&
        !log.failed_at
      ) {
        result.has_communication_log = true;
        result.has_real_provider_message_id = true;
        result.is_delivered = true;
        result.has_delivered_at = true;
        result.no_failed_at = true;
        result.is_production = true;
        result.not_excluded = true;
        record.qualified = true;
        result.evidence_records.push(record);
      } else {
        record.qualified = false;
        result.evidence_records.push(record);
      }
    }

    // Check CommunicationEvent too
    try {
      const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
        {
          channel: "sms",
          provider: "twilio",
          direction: "outbound",
          event_type: "sms_sent",
        },
        "-created_date",
        10
      );
      result.has_communication_event = (events || []).some(
        (e) => isRealSid(e.provider_message_id, "SM")
      );
    } catch (_) {}

    // Determine overall status — never "pass" here; that requires admin to create AutomationProofLog
    if (result.has_communication_log && result.is_delivered && result.has_delivered_at) {
      result.overall_status = "ready_for_proof";
      result.guidance = "Real delivery evidence exists. Admin may create an AutomationProofLog with status='pass' after reviewing the evidence.";
    } else {
      result.overall_status = "pending";
      result.guidance = "No qualifying delivery evidence found. Send a real lead and wait for Twilio delivery callback before creating proof.";
    }
  } catch (err) {
    result.overall_status = "unknown";
    result.guidance = `Evidence check failed: ${err.message}`;
  }

  return result;
}

async function checkMissedCallEvidence(base44) {
  const result = {
    has_inbound_call_event: false,
    has_outbound_sms_log: false,
    has_real_call_sid: false,
    has_real_message_sid: false,
    is_delivered: false,
    has_delivered_at: false,
    is_production: false,
    not_excluded: false,
    call_events: [],
    sms_logs: [],
    overall_status: "pending",
  };

  try {
    // Check for inbound voice CommunicationEvent
    const callEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
      {
        channel: "voice",
        direction: "inbound",
        provider: "twilio",
      },
      "-created_date",
      10
    );

    for (const evt of callEvents || []) {
      const record = {
        id: evt.id,
        provider_message_id: evt.provider_message_id || null,
        event_type: evt.event_type || null,
        is_real_sid: isRealSid(evt.provider_message_id, "CA"),
      };

      if (record.is_real_sid) {
        result.has_inbound_call_event = true;
        result.has_real_call_sid = true;
        record.qualified = true;
      } else {
        record.qualified = false;
      }
      result.call_events.push(record);
    }

    // Check for outbound SMS CommunicationLog (text-back response)
    const smsLogs = await base44.asServiceRole.entities.CommunicationLog.filter(
      {
        channel: "sms",
        provider: "twilio",
        direction: "outbound",
      },
      "-created_date",
      50
    );

    for (const log of smsLogs || []) {
      const record = {
        id: log.id,
        provider_message_id: log.provider_message_id || null,
        delivery_status: log.delivery_status || null,
        delivered_at: log.delivered_at || null,
        failed_at: log.failed_at || null,
        environment: log.environment || "unknown",
        dashboard_excluded: log.dashboard_excluded === true,
        is_real_sid: isRealSid(log.provider_message_id, "SM"),
        is_delivered: log.delivery_status === "delivered",
        is_production: log.environment === "production",
      };

      if (
        record.is_real_sid &&
        record.is_delivered &&
        record.is_production &&
        !record.dashboard_excluded &&
        log.delivered_at &&
        !log.failed_at
      ) {
        result.has_outbound_sms_log = true;
        result.has_real_message_sid = true;
        result.is_delivered = true;
        result.has_delivered_at = true;
        result.is_production = true;
        result.not_excluded = true;
        record.qualified = true;
      } else {
        record.qualified = false;
      }
      result.sms_logs.push(record);
    }

    if (
      result.has_inbound_call_event &&
      result.has_outbound_sms_log &&
      result.is_delivered &&
      result.has_delivered_at
    ) {
      result.overall_status = "ready_for_proof";
      result.guidance = "Real missed-call + text-back delivery evidence exists. Admin may create an AutomationProofLog with status='pass' after reviewing.";
    } else if (result.has_inbound_call_event && !result.has_outbound_sms_log) {
      result.overall_status = "pending";
      result.guidance = "Inbound call event found but no delivered text-back SMS. Check if text-back was sent and delivery callback was received.";
    } else {
      result.overall_status = "pending";
      result.guidance = "No qualifying missed-call evidence found. Place a real missed call and wait for text-back delivery.";
    }
  } catch (err) {
    result.overall_status = "unknown";
    result.guidance = `Evidence check failed: ${err.message}`;
  }

  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    // Check for existing AutomationProofLog records
    let existingProofLogs = [];
    try {
      existingProofLogs = await base44.asServiceRole.entities.AutomationProofLog.list("-created_date", 50);
    } catch (_) {}

    const proofLogCount = existingProofLogs?.length || 0;
    const instantLeadProofLogs = existingProofLogs?.filter(
      (p) => p.service_key === "instant_lead_response"
    ) || [];
    const missedCallProofLogs = existingProofLogs?.filter(
      (p) => p.service_key === "missed_call_text_back"
    ) || [];

    // Check evidence for each service
    const instantLeadEvidence = await checkInstantLeadResponseEvidence(base44);
    const missedCallEvidence = await checkMissedCallEvidence(base44);

    return Response.json({
      success: true,
      checked_at: new Date().toISOString(),
      proof_log_count: proofLogCount,
      proof_logs_exist: proofLogCount > 0,
      workflows: {
        instant_lead_response: {
          ...PROOF_WORKFLOWS.instant_lead_response,
          evidence: instantLeadEvidence,
          existing_proof_logs: instantLeadProofLogs.map((p) => ({
            id: p.id,
            status: p.status,
            tested_at: p.tested_at,
            evidence_summary: p.evidence_summary,
          })),
          can_create_pass: instantLeadEvidence.overall_status === "ready_for_proof",
          warning: instantLeadEvidence.overall_status !== "ready_for_proof"
            ? "DO NOT create a pass record — qualifying evidence does not exist yet."
            : "Qualifying evidence found — admin may create a pass record after manual review.",
        },
        missed_call_text_back: {
          ...PROOF_WORKFLOWS.missed_call_text_back,
          evidence: missedCallEvidence,
          existing_proof_logs: missedCallProofLogs.map((p) => ({
            id: p.id,
            status: p.status,
            tested_at: p.tested_at,
            evidence_summary: p.evidence_summary,
          })),
          can_create_pass: missedCallEvidence.overall_status === "ready_for_proof",
          warning: missedCallEvidence.overall_status !== "ready_for_proof"
            ? "DO NOT create a pass record — qualifying evidence does not exist yet."
            : "Qualifying evidence found — admin may create a pass record after manual review.",
        },
      },
      truth_rules: [
        "A proof record may only be 'pass' if real CommunicationLog/CommunicationEvent exists.",
        "provider_message_id must be a real Twilio SID (SM... for SMS, CA... for calls).",
        "delivery_status must be 'delivered' — queued or sent is NOT proof.",
        "delivered_at must be present.",
        "failed_at must be absent.",
        "environment must be 'production'.",
        "dashboard_excluded must not be true (excludes test/smoke/internal records).",
        "If evidence is incomplete, status must be 'pending' or 'fail', never 'pass'.",
      ],
    });
  } catch (error) {
    console.error("[getProofWorkflowScaffolding] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});