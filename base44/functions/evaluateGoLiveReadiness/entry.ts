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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const order_id = url.searchParams.get("order_id");

    if (!order_id) return json({ error: "order_id required" }, 400);

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return json({ error: "Order not found" }, 404);

    // Fetch all proof logs for this order
    const proofLogs = await base44.asServiceRole.entities.AutomationProofLog.filter(
      { order_id }, "-created_date", 50
    ).catch(() => []);

    // Check each canonical Pro service key has a passing proof
    const proofByService = {};
    for (const key of CANONICAL_PRO_SERVICE_KEYS) {
      const latestProof = proofLogs.find((p) => p.service_key === key);
      proofByService[key] = latestProof || null;
    }

    const missingProofs = CANONICAL_PRO_SERVICE_KEYS.filter((key) => !proofByService[key] || proofByService[key].status !== "pass");
    const failedProofs = CANONICAL_PRO_SERVICE_KEYS.filter((key) => proofByService[key]?.status === "fail");
    const passedProofs = CANONICAL_PRO_SERVICE_KEYS.filter((key) => proofByService[key]?.status === "pass");

    // Check for admin override
    const installOSRecords = await base44.asServiceRole.entities.ClientInstallationOS.filter(
      { order_id }, "-created_date", 1
    ).catch(() => []);
    const installOS = installOSRecords?.[0] || null;

    const adminOverride = installOS?.activation_override === true;
    const adminOverrideReason = installOS?.activation_override_reason || "";
    const adminOverrideBy = installOS?.activation_override_by || "";

    const allProofsPassed = missingProofs.length === 0 && failedProofs.length === 0;
    const goLiveReady = allProofsPassed || (adminOverride && adminOverrideReason);

    // Check checklist completion
    const checklists = await base44.asServiceRole.entities.AutomationChecklist.filter(
      { order_id }, "-created_date", 50
    ).catch(() => []);

    const canonicalChecklists = CANONICAL_PRO_SERVICE_KEYS.map((key) => {
      const cl = checklists.find((c) => c.service_key === key);
      return { service_key: key, exists: !!cl, status: cl?.status || "missing" };
    });

    const allChecklistsExist = canonicalChecklists.every((c) => c.exists);

    return json({
      success: true,
      go_live_ready: goLiveReady,
      all_proofs_passed: allProofsPassed,
      all_checklists_exist: allChecklistsExist,
      passed_proofs: passedProofs,
      missing_proofs: missingProofs,
      failed_proofs: failedProofs,
      proof_by_service: proofByService,
      canonical_checklists: canonicalChecklists,
      admin_override: adminOverride,
      admin_override_reason: adminOverrideReason,
      admin_override_by: adminOverrideBy,
      blockers: [
        ...missingProofs.map((k) => `Missing proof: ${k}`),
        ...failedProofs.map((k) => `Failed proof: ${k}`),
        ...(!allChecklistsExist ? ["Not all six canonical checklists exist"] : []),
      ],
    });
  } catch (error) {
    console.error("[evaluateGoLiveReadiness] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});