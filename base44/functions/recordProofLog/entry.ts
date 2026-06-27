import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// DRIFT-PROTECTION: This list MUST match lib/serviceRegistry.js CANONICAL_PRO_SERVICE_KEYS.
// Deno functions cannot import from lib/, so this is duplicated intentionally.
// Run validateProActivationFoundation to verify consistency.
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { order_id, service_key, status, evidence_summary, communication_event_id, communication_log_id, provider_message_id, tested_by, failure_reason, repair_action } = body;

    if (!order_id || !service_key) return json({ error: "order_id and service_key required" }, 400);
    if (!["pending", "pass", "fail"].includes(status)) return json({ error: "status must be pending/pass/fail" }, 400);

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return json({ error: "Order not found" }, 404);

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
      tested_by: tested_by || "system",
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

    return json({ success: true, proof });
  } catch (error) {
    console.error("[recordProofLog] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});