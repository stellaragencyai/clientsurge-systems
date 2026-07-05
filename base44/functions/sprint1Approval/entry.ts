/**
 * sprint1Approval — Admin-only approval workflow for Sprint 1 core Twilio automations.
 *
 * Handles three approval decisions:
 *   1. internal_qa_approval      — Approve QA proof for internal launch only
 *   2. production_proof_required  — Require clean production proof (keep pending)
 *   3. rejected_rerun_required    — Reject proof, rerun required
 *
 * Guardrails:
 *   - Does NOT change evidence_quality (preserves internal_test)
 *   - Does NOT set went_live_at (no public/client launch implication)
 *   - Does NOT modify LaunchReadinessState or full platform readiness
 *   - Does NOT send external communications
 *   - Does NOT create or delete proof records
 *   - Does NOT touch AI voice, review, referral, checkout, portal, analytics, onboarding gates
 *   - Only affects instant_lead_response and missed_call_text_back gates
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

const SPRINT1_GATE_KEYS = ["instant_lead_response", "missed_call_text_back"];

const APPROVAL_LABELS = {
  internal_qa_approval: "Internal Launch Approved — QA Evidence",
  production_proof_required: "Production Proof Required",
  rejected_rerun_required: "Rejected / Rerun Required",
};

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { gate_key, decision, note } = body;

    if (!SPRINT1_GATE_KEYS.includes(gate_key)) {
      return Response.json({ error: `Gate key must be one of: ${SPRINT1_GATE_KEYS.join(", ")}` }, { status: 400 });
    }

    if (!["internal_qa_approval", "production_proof_required", "rejected_rerun_required"].includes(decision)) {
      return Response.json({ error: "Invalid decision type" }, { status: 400 });
    }

    // Fetch the gate
    const gates = await base44.asServiceRole.entities.LaunchGate.list("", 50);
    const gate = (gates || []).find((g) => g.gate_key === gate_key);
    if (!gate) {
      return Response.json({ error: `LaunchGate not found for key: ${gate_key}` }, { status: 404 });
    }

    // Must be proof_passed to approve
    if (gate.status !== "proof_passed") {
      return Response.json({ error: `Gate must be in proof_passed state to approve. Current: ${gate.status}` }, { status: 400 });
    }

    const now = new Date().toISOString();
    const approverEmail = user.email || user.full_name || "admin";
    const verdictLabel = APPROVAL_LABELS[decision];
    const cleanNote = (note || "").trim();

    // Parse existing evidence_summary to append audit trail
    let evidenceData = {};
    try {
      evidenceData = gate.evidence_summary ? JSON.parse(gate.evidence_summary) : {};
    } catch {
      evidenceData = {};
    }

    // ── Build audit trail entry ──
    const auditEntry = {
      approval_type: decision,
      approved_by: approverEmail,
      approved_at: now,
      approval_note: cleanNote || null,
      label: verdictLabel,
    };

    // Merge into evidence_summary
    const updatedEvidence = {
      ...evidenceData,
      sprint1_approval: auditEntry,
    };

    // ── Gate updates per decision ──
    let gateUpdate;
    let checklistUpdate = null;

    if (decision === "internal_qa_approval") {
      gateUpdate = {
        status: "approved",
        approved_by: approverEmail,
        approved_at: now,
        approval_required: true,
        last_verdict: "Internal Launch Approved — QA Evidence",
        current_blocker: "Internal launch approved with QA evidence — production proof still required for public/client launch",
        next_action: "Rerun proof with production-customer evidence to clear for public/client launch",
        evidence_summary: JSON.stringify(updatedEvidence),
        last_checked_at: now,
      };
      // Do NOT set went_live_at anywhere
    } else if (decision === "production_proof_required") {
      gateUpdate = {
        status: "proof_passed", // keep as-is
        approval_required: true,
        last_verdict: "Production Proof Required — QA evidence not sufficient for public/client launch",
        current_blocker: "Production-quality proof required — rerun with non-test, non-owner, production-quality lead/call evidence",
        next_action: "Rerun proof with a real production customer lead/call",
        evidence_summary: JSON.stringify(updatedEvidence),
        last_checked_at: now,
      };
    } else {
      // rejected_rerun_required
      gateUpdate = {
        status: "proof_passed", // keep status but mark as rejected
        approval_required: true,
        last_verdict: "Rejected / Rerun Required — existing proof not accepted",
        current_blocker: "Proof rejected — rerun required with fresh evidence",
        next_action: "Rerun the full proof workflow from scratch with new evidence",
        evidence_summary: JSON.stringify(updatedEvidence),
        last_checked_at: now,
      };
    }

    // Update the LaunchGate
    await base44.asServiceRole.entities.LaunchGate.update(gate.id, gateUpdate);

    // ── Update AutomationChecklist for internal approval only ──
    if (decision === "internal_qa_approval") {
      try {
        const checklists = await base44.asServiceRole.entities.AutomationChecklist.filter(
          { service_key: gate_key },
          "-created_date",
          5
        );
        if (checklists && checklists.length > 0) {
          for (const cl of checklists) {
            await base44.asServiceRole.entities.AutomationChecklist.update(cl.id, {
              client_approved: true,
              // Do NOT set went_live_at — that implies public launch
              dashboard_truth_notes: "Internal launch approved — QA evidence only. Public/client launch NOT ready.",
            });
          }
        }
      } catch (err) {
        // Non-fatal — checklist update is secondary
        console.warn(`[sprint1Approval] Checklist update failed: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      gate_key,
      decision,
      label: verdictLabel,
      approved_by: approverEmail,
      approved_at: decision === "internal_qa_approval" ? now : null,
      evidence_quality_preserved: true,
      went_live_at_set: false,
      public_launch_ready: false,
      audit_trail: auditEntry,
    });
  } catch (error) {
    console.error("[sprint1Approval] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});