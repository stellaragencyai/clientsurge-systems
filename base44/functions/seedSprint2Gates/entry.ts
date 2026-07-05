/**
 * seedSprint2Gates — Seeds LaunchGate entries for Sprint 2.
 *
 * Creates three gates:
 *   1. inbound_sms_assistant — Inbound SMS Assistant
 *   2. nurture_sequence_14d — 14-Day Nurture Sequence
 *   3. sprint2_inbound_and_nurture_gate — Combined Sprint 2 gate
 *
 * All gates start as "blocked" — proof must be earned, never assumed.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

const SPRINT2_GATES = [
  {
    gate_key: "inbound_sms_assistant",
    gate_name: "Inbound SMS Assistant",
    section_label: "Sprint 2",
    description: "Inbound SMS handling: receive, match to lead, classify intent, handle STOP/opt-out, pause nurture, escalate hot/unclear replies to admin.",
    required_categories: ["sms", "inbound_reply"],
    required_tasks: [
      "verify_inbound_sms_webhook_active",
      "verify_lead_matching_by_phone",
      "verify_intent_classification_recorded",
      "verify_stop_opt_out_handling",
      "verify_nurture_pause_on_reply",
      "verify_admin_escalation_for_hot_or_unclear",
    ],
    required_proofs: [
      "inbound_reply_classification_test",
      "stop_reply_test",
    ],
  },
  {
    gate_key: "nurture_sequence_14d",
    gate_name: "14-Day Nurture Sequence",
    section_label: "Sprint 2",
    description: "Controlled 14-day nurture sequence for eligible leads with consent. Pauses on reply, stops on STOP/opt-out. Does not auto-send during build.",
    required_categories: ["nurture", "email"],
    required_tasks: [
      "verify_enrollment_eligibility_checks",
      "verify_consent_required",
      "verify_opt_out_exclusion",
      "verify_pause_on_reply",
      "verify_step_scheduling",
      "verify_no_fake_claims_in_templates",
    ],
    required_proofs: [
      "enrollment_test",
    ],
  },
  {
    gate_key: "sprint2_inbound_and_nurture_gate",
    gate_name: "Sprint 2 — Inbound & Nurture Combined Gate",
    section_label: "Sprint 2",
    description: "Combined Sprint 2 readiness gate. Both inbound_sms_assistant and nurture_sequence_14d must pass proof before this gate can advance.",
    required_categories: ["sprint2"],
    required_tasks: [
      "inbound_sms_assistant_proof_passed",
      "nurture_sequence_14d_proof_passed",
      "pause_on_reply_verified",
      "stop_opt_out_verified",
      "booking_cta_handoff_ready",
    ],
    required_proofs: [
      "sprint2_combined_proof",
    ],
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const existing = await base44.asServiceRole.entities.LaunchGate.list("", 100);
    const existingKeys = new Set((existing || []).map(g => g.gate_key));
    const seeded = [];
    const skipped = [];

    for (const gate of SPRINT2_GATES) {
      if (existingKeys.has(gate.gate_key)) {
        skipped.push(gate.gate_key);
        continue;
      }
      await base44.asServiceRole.entities.LaunchGate.create({
        gate_key: gate.gate_key,
        gate_name: gate.gate_name,
        section_label: gate.section_label,
        description: gate.description,
        status: "blocked",
        severity: "launch_blocker",
        completion_percent: 0,
        proof_percent: 0,
        required_categories: gate.required_categories,
        required_tasks: gate.required_tasks,
        required_proofs: gate.required_proofs,
        current_blocker: "Sprint 2 gate not yet verified — infrastructure may exist but proof has not been earned",
        next_action: "Run Sprint 2 proof check to evaluate infrastructure readiness",
        approval_required: true,
        last_checked_at: new Date().toISOString(),
        evidence_summary: "Sprint 2 gate seeded — awaiting first proof run",
        unlock_condition_summary: `All required tasks (${gate.required_tasks.length}) and proofs (${gate.required_proofs.length}) must pass with real or QA evidence`,
        last_verdict: "Seeded — blocked by default",
      });
      seeded.push(gate.gate_key);
    }

    return Response.json({
      success: true,
      seeded: seeded.length,
      skipped: skipped.length,
      seeded_keys: seeded,
      skipped_keys: skipped,
    });
  } catch (error) {
    console.error("[seedSprint2Gates] error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});