import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// DRIFT-PROTECTION: This list MUST match lib/serviceRegistry.js CANONICAL_PRO_SERVICE_KEYS.
const CANONICAL_PRO_SERVICE_KEYS = [
  "instant_lead_response",
  "missed_call_text_back",
  "nurture_sequence_14d",
  "ai_booking_agent",
  "daily_lead_digest",
  "inbound_sms_assistant",
];

const PROOF_TEST_TYPES = {
  instant_lead_response: "form_submission",
  missed_call_text_back: "missed_call_test",
  nurture_sequence_14d: "enrollment_test",
  ai_booking_agent: "booking_cta_test",
  daily_lead_digest: "digest_delivery_test",
  inbound_sms_assistant: "inbound_reply_classification_test",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function isRealSid(value, prefix) {
  if (!value || typeof value !== "string") return false;
  return new RegExp(`^${prefix}[a-zA-Z0-9]+$`).test(value);
}

/**
 * Evidence verification: when status="pass", verifies that real delivery
 * evidence exists before allowing the proof record to be created.
 * Prevents fake/inflated proof — a pass record is only valid if backed by:
 *   - A CommunicationLog with a real Twilio SID (SM...)
 *   - delivery_status = "delivered" (not queued/sent)
 *   - delivered_at is present
 *   - failed_at is absent
 *   - environment is "production"
 *   - dashboard_excluded is not true
 */
async function verifyPassEvidence(base44, service_key, provider_message_id, communication_log_id) {
  const failures = [];

  if (!provider_message_id) {
    failures.push("provider_message_id is required for pass status");
    return { verified: false, failures };
  }

  // For SMS-based services, verify the SID is a real Twilio message SID
  if (service_key === "instant_lead_response" || service_key === "missed_call_text_back") {
    if (!isRealSid(provider_message_id, "SM")) {
      failures.push(`provider_message_id "${provider_message_id}" is not a real Twilio SMS SID (must start with SM)`);
    }
  }

  // Try to find the CommunicationLog by provider_message_id
  let log = null;
  try {
    const logs = await base44.asServiceRole.entities.CommunicationLog.filter(
      { provider_message_id: provider_message_id },
      "-created_date",
      5
    );
    log = (logs || []).find((l) =>
      l.delivery_status === "delivered" &&
      l.delivered_at &&
      !l.failed_at &&
      l.environment === "production" &&
      l.dashboard_excluded !== true
    ) || null;

    if (!log) {
      // Also try communication_log_id if provided
      if (communication_log_id) {
        const directLog = await base44.asServiceRole.entities.CommunicationLog.get(communication_log_id).catch(() => null);
        if (directLog) {
          log = (directLog.delivery_status === "delivered" &&
                 directLog.delivered_at &&
                 !directLog.failed_at &&
                 directLog.environment === "production" &&
                 directLog.dashboard_excluded !== true) ? directLog : null;
        }
      }
    }
  } catch (e) {
    failures.push(`CommunicationLog lookup failed: ${e.message}`);
  }

  if (!log) {
    failures.push("No qualifying CommunicationLog found with delivery_status=delivered, delivered_at set, no failed_at, environment=production, dashboard_excluded!=true");
    return { verified: false, failures };
  }

  // Verify delivery_status is delivered — never accept queued/sent as proof
  if (log.delivery_status !== "delivered") {
    failures.push(`CommunicationLog delivery_status is "${log.delivery_status}" — must be "delivered" (queued/sent is NOT proof)`);
  }

  if (!log.delivered_at) {
    failures.push("CommunicationLog has no delivered_at timestamp");
  }

  if (log.failed_at) {
    failures.push("CommunicationLog has failed_at set — cannot be pass evidence");
  }

  if (log.environment !== "production") {
    failures.push(`CommunicationLog environment is "${log.environment}" — must be "production" (excludes test/smoke)`);
  }

  if (log.dashboard_excluded === true) {
    failures.push("CommunicationLog dashboard_excluded is true — test/smoke/internal records cannot be proof");
  }

  return {
    verified: failures.length === 0,
    failures,
    evidence_log: log ? {
      id: log.id,
      provider_message_id: log.provider_message_id,
      delivery_status: log.delivery_status,
      delivered_at: log.delivered_at,
      environment: log.environment,
    } : null,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only — proof records control launch readiness
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return json({ error: "Admin access required" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const { order_id, service_key, status, evidence_summary, communication_event_id, communication_log_id, provider_message_id, tested_by, failure_reason, repair_action } = body;

    if (!order_id || !service_key) return json({ error: "order_id and service_key required" }, 400);
    if (!["pending", "pass", "fail"].includes(status)) return json({ error: "status must be pending/pass/fail" }, 400);

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return json({ error: "Order not found" }, 404);

    // ── EVIDENCE VERIFICATION FOR "pass" STATUS ──
    // Never allow a pass record without real delivery evidence.
    // This is the hard rule: no fake proof, no queued SMS counted as delivered.
    if (status === "pass") {
      const evidence = await verifyPassEvidence(base44, service_key, provider_message_id, communication_log_id);
      if (!evidence.verified) {
        return json({
          error: "Cannot create pass record — qualifying evidence not found",
          reason: "evidence_verification_failed",
          failures: evidence.failures,
          hint: "Send a real lead/call and wait for Twilio delivery callback (delivery_status=delivered) before creating a pass record.",
          safe_to_continue: true,
        }, 403);
      }
    }

    // Check for existing proof log (upsert)
    const existing = await base44.asServiceRole.entities.AutomationProofLog.filter(
      { order_id, service_key, test_type: PROOF_TEST_TYPES[service_key] || "form_submission" },
      "-created_date",
      1
    ).catch(() => []);

    const proofData = {
      order_id,
      client_id: order.client_id || "",
      client_project_id: order.client_project_id || "",
      service_key,
      test_type: PROOF_TEST_TYPES[service_key] || "form_submission",
      status,
      evidence_summary: evidence_summary || "",
      communication_event_id: communication_event_id || "",
      communication_log_id: communication_log_id || "",
      provider_message_id: provider_message_id || "",
      tested_at: new Date().toISOString(),
      tested_by: tested_by || user.email || "admin",
      failure_reason: failure_reason || "",
      repair_action: repair_action || "",
      business_name: order.business_name || "",
      client_email: order.customer_email || "",
    };

    let proof;
    if (existing?.length > 0) {
      proof = await base44.asServiceRole.entities.AutomationProofLog.update(existing[0].id, proofData);
    } else {
      proof = await base44.asServiceRole.entities.AutomationProofLog.create(proofData);
    }

    // ── SYNC AUTOMATION CHECKLIST FLAGS ONLY AFTER PROOF EXISTS ──
    // Do not set went_live_at until proof passes.
    if (status === "pass") {
      try {
        const checklists = await base44.asServiceRole.entities.AutomationChecklist.filter(
          { order_id, service_key },
          "-created_date",
          5
        );
        for (const cl of (checklists || [])) {
          const updates = {
            test_lead_sent: true,
            test_response_received: true,
            communication_event_logging_verified: true,
            status: "in_progress", // stays in_progress until client approves
            last_tested_at: new Date().toISOString(),
            // Do NOT set went_live_at here — only after client sign-off
          };
          await base44.asServiceRole.entities.AutomationChecklist.update(cl.id, updates).catch(() => {});
        }
      } catch (_) {}
    }

    return json({
      success: true,
      proof,
      evidence_verified: status === "pass",
      checklist_synced: status === "pass",
    });
  } catch (error) {
    console.error("[recordProofLog] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});