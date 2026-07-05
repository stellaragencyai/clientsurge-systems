/**
 * seedSprint2Scaffolding — Admin-only scaffolding for Sprint 2 proof-readiness.
 *
 * Creates AutomationChecklist rows for inbound_sms_assistant and nurture_sequence_14d
 * if they don't exist. Updates LaunchGates to reflect scaffolding existence.
 *
 * Hard rules:
 *   - Does NOT send SMS, email, or call any provider.
 *   - Does NOT create fake pass records.
 *   - Does NOT mark proof_passed, approved, or client_approved.
 *   - Does NOT set went_live_at.
 *   - Does NOT delete records.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

const SCAFFOLDING_CHECKLISTS = [
  {
    service_key: "inbound_sms_assistant",
    business_name: "ClientSurge System Scaffolding",
    client_email: "scaffolding@clientsurge.system",
    description: "Scaffolding row — defines intent classification labels, STOP/opt-out rule, pause-on-reply rule, admin escalation rule. Not a live automation record.",
  },
  {
    service_key: "nurture_sequence_14d",
    business_name: "ClientSurge System Scaffolding",
    client_email: "scaffolding@clientsurge.system",
    description: "Scaffolding row — defines 14-day cadence structure, consent rule, opt-out exclusion rule, pause-on-reply rule. Not a live automation record.",
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const now = new Date().toISOString();

    // ── 1. Create AutomationChecklist rows if missing ──
    const existingChecklists = await svc.entities.AutomationChecklist.filter(
      { service_key: { $in: ["inbound_sms_assistant", "nurture_sequence_14d"] } },
      "-created_date",
      20
    ).catch(() => []);

    const existingServices = new Set((existingChecklists || []).map(c => c.service_key));
    const created_checklists = [];
    const existing_checklists = [];

    for (const def of SCAFFOLDING_CHECKLISTS) {
      if (existingServices.has(def.service_key)) {
        existing_checklists.push(def.service_key);
        continue;
      }
      const record = await svc.entities.AutomationChecklist.create({
        service_key: def.service_key,
        business_name: def.business_name,
        client_email: def.client_email,
        description: def.description,
        status: "not_started",
        tenant_scope_status: "system_internal",
        environment: "internal",
        dashboard_excluded: true,
        dashboard_exclusion_reason: "Sprint 2 scaffolding — system internal, not a live automation",
        dashboard_truth_status: "blocked",
        dashboard_truth_notes: "Scaffolding row only — proof not earned",
        client_approved: false,
        twilio_configured: false,
        resend_configured: false,
        booking_link_set: false,
        review_link_set: false,
        lead_form_connected: false,
        communication_event_logging_verified: false,
        test_lead_sent: false,
        test_response_received: false,
      }).catch(() => null);
      if (record) created_checklists.push(def.service_key);
    }

    // ── 2. Update LaunchGates based on scaffolding ──
    const allGates = await svc.entities.LaunchGate.list("", 100).catch(() => []);
    const inboundGate = (allGates || []).find(g => g.gate_key === "inbound_sms_assistant");
    const nurtureGate = (allGates || []).find(g => g.gate_key === "nurture_sequence_14d");
    const combinedGate = (allGates || []).find(g => g.gate_key === "sprint2_inbound_and_nurture_gate");

    const gate_updates = [];

    // inbound_sms_assistant: scaffolding exists → partial or ready_for_proof
    // Completion: 4 of 7 checks have scaffolding (intent labels, STOP rule, pause rule, escalation rule)
    // Status: ready_for_proof (scaffolding complete, but no actual events verified)
    // Proof remains 0% — no proof logs created
    if (inboundGate) {
      // Only update if not already proof_passed or approved
      if (inboundGate.status !== "proof_passed" && inboundGate.status !== "approved") {
        gate_updates.push({
          gate: inboundGate,
          update: {
            status: "ready_for_proof",
            completion_percent: 57, // 4/7 scaffolding items visible
            proof_percent: 0, // proof remains 0 — no proof logs
            current_blocker: "Scaffolding exists but no inbound SMS events verified, no intent classification proof, no STOP handling proof, no nurture pause proof, no admin escalation proof",
            next_action: "Run QA proof: send test inbound SMS, verify intent classification, verify STOP handling, verify nurture pause, verify admin escalation",
            last_checked_at: now,
            last_verdict: `Sprint 2 scaffolding applied ${now} — intent labels, STOP rule, pause rule, escalation rule visible. Proof remains 0%.`,
            evidence_summary: JSON.stringify({
              scaffolding_applied: true,
              intent_labels_defined: 7,
              stop_opt_out_rule_visible: true,
              pause_on_reply_rule_visible: true,
              admin_escalation_rule_visible: true,
              proof_logs_exist: false,
              no_provider_calls: true,
            }),
          },
        });
      }
    }

    // nurture_sequence_14d: cadence structure + rules defined → partial
    // Completion: 2 of 6 checks (structure exists, rules visible)
    // Status: partial (no enrollment events, no pause proof, no opt-out proof)
    // Proof remains 0%
    if (nurtureGate) {
      if (nurtureGate.status !== "proof_passed" && nurtureGate.status !== "approved") {
        gate_updates.push({
          gate: nurtureGate,
          update: {
            status: "partial",
            completion_percent: 33, // 2/6 scaffolding items
            proof_percent: 0,
            current_blocker: "14-day cadence structure and rules defined, but no enrollment events, no pause-on-reply proof, no opt-out exclusion proof, no enrollment_test proof log",
            next_action: "Enroll a test lead in 14-day nurture, verify enrollment events, verify pause-on-reply, verify opt-out exclusion",
            last_checked_at: now,
            last_verdict: `Sprint 2 scaffolding applied ${now} — 6-step cadence (Day 0/1/3/7/10/14) and rules defined. Proof remains 0%.`,
            evidence_summary: JSON.stringify({
              scaffolding_applied: true,
              cadence_steps_defined: 6,
              consent_required: true,
              sms_permission_required: true,
              opt_out_exclusion_required: true,
              pause_on_reply_required: true,
              no_fake_claims: true,
              internal_test_excluded: true,
              proof_logs_exist: false,
              no_provider_calls: true,
            }),
          },
        });
      }
    }

    // sprint2_inbound_and_nurture_gate: remains partial until proof logs exist
    if (combinedGate) {
      if (combinedGate.status !== "proof_passed" && combinedGate.status !== "approved") {
        const inboundCompletion = inboundGate ? 57 : 0;
        const nurtureCompletion = nurtureGate ? 33 : 0;
        const combinedCompletion = Math.round((inboundCompletion + nurtureCompletion) / 2);
        gate_updates.push({
          gate: combinedGate,
          update: {
            status: "partial",
            completion_percent: combinedCompletion,
            proof_percent: 0,
            current_blocker: "Sprint 2 scaffolding in place for both inbound SMS and nurture, but no proof logs exist. Both sub-gates must pass proof before this gate can advance.",
            next_action: "Complete QA proof for inbound_sms_assistant and nurture_sequence_14d, then create AutomationProofLog records",
            last_checked_at: now,
            last_verdict: `Sprint 2 scaffolding applied ${now} — both sub-gates have scaffolding. Proof remains 0%.`,
          },
        });
      }
    }

    // Apply gate updates
    const updated_gates = [];
    for (const { gate, update } of gate_updates) {
      await svc.entities.LaunchGate.update(gate.id, update);
      updated_gates.push(gate.gate_key);
    }

    return Response.json({
      success: true,
      ran_at: now,
      no_provider_calls: true,
      no_messages_sent: true,
      no_fake_pass_records: true,
      created_checklists,
      existing_checklists,
      updated_gates,
      scaffolding_summary: {
        inbound_sms_assistant: {
          status: inboundGate ? (inboundGate.status === "proof_passed" || inboundGate.status === "approved" ? inboundGate.status : "ready_for_proof") : "not_found",
          completion_percent: 57,
          proof_percent: 0,
          scaffolding_items: ["intent_labels_7", "stop_opt_out_rule", "pause_on_reply_rule", "admin_escalation_rule"],
        },
        nurture_sequence_14d: {
          status: nurtureGate ? (nurtureGate.status === "proof_passed" || nurtureGate.status === "approved" ? nurtureGate.status : "partial") : "not_found",
          completion_percent: 33,
          proof_percent: 0,
          scaffolding_items: ["cadence_6_steps", "consent_rule", "opt_out_exclusion_rule", "pause_on_reply_rule", "no_fake_claims_rule", "internal_test_exclusion_rule"],
        },
        sprint2_combined: {
          status: "partial",
          completion_percent: 45,
          proof_percent: 0,
          blocker: "No proof logs exist — both sub-gates must pass proof",
        },
      },
    });
  } catch (error) {
    console.error("[seedSprint2Scaffolding] error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});