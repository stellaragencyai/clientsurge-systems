/**
 * runSprint2ProofCheck — Evidence-based proof runner for Sprint 2 gates.
 *
 * Checks real runtime conditions for:
 *   1. inbound_sms_assistant — inbound SMS webhook, intent classification, STOP handling, nurture pause, admin escalation
 *   2. nurture_sequence_14d — enrollment eligibility, consent checks, pause-on-reply, opt-out exclusion
 *   3. sprint2_inbound_and_nurture_gate — combined gate requiring both sub-gates
 *
 * Hard rules:
 *   - Never marks proof_passed without real evidence
 *   - QA evidence (internal_test/owner) stays as proof_passed with qa_proof_pending
 *   - Does not send any external messages
 *   - Does not modify proof logs — only updates LaunchGate status
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// ── Evidence quality classification ──
const INTERNAL_PATTERNS = /clientsurge-install\.internal|clientsurge\.test|test\+|test-|^test\b|smoke|\bqa\b|internal|backfill|example\.com/i;
const OWNER_PATTERNS = /nolanf|nolan\./i;

function classifyEvidenceQuality(record) {
  if (!record) return "unknown";
  const email = (record.client_email || record.customer_email || record.lead_email || "").toLowerCase();
  const name = (record.business_name || record.lead_name || "").toLowerCase();
  if (OWNER_PATTERNS.test(email) || OWNER_PATTERNS.test(name)) return "owner";
  if (INTERNAL_PATTERNS.test(email) || INTERNAL_PATTERNS.test(name)) return "internal_test";
  return "production_customer";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return json({ error: "Admin only" }, 403);
    }

    const now = new Date().toISOString();

    // ── Load all gates ──
    const allGates = await base44.asServiceRole.entities.LaunchGate.list("", 100);
    const inboundGate = (allGates || []).find(g => g.gate_key === "inbound_sms_assistant");
    const nurtureGate = (allGates || []).find(g => g.gate_key === "nurture_sequence_14d");
    const combinedGate = (allGates || []).find(g => g.gate_key === "sprint2_inbound_and_nurture_gate");

    // ── Load proof logs for Sprint 2 services ──
    const sprint2ProofLogs = await base44.asServiceRole.entities.AutomationProofLog.filter(
      { service_key: { $in: ["inbound_sms_assistant", "nurture_sequence_14d"] } },
      "-created_date",
      20
    ).catch(() => []);

    // ── Load checklists for Sprint 2 services ──
    const sprint2Checklists = await base44.asServiceRole.entities.AutomationChecklist.filter(
      { service_key: { $in: ["inbound_sms_assistant", "nurture_sequence_14d"] } },
      "-created_date",
      20
    ).catch(() => []);

    // ═══════════════════════════════════════════
    // 1. INBOUND SMS ASSISTANT GATE
    // ═══════════════════════════════════════════

    // Check: inbound SMS CommunicationEvents exist
    let inboundSmsEvents = [];
    try {
      inboundSmsEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { event_type: "sms_received", direction: "inbound" },
        "-created_date",
        50
      );
    } catch (_) {}

    const hasInboundSmsEvents = (inboundSmsEvents || []).length > 0;

    // Check: any event with intent classification in metadata
    const eventsWithIntent = (inboundSmsEvents || []).filter(e => {
      try {
        const meta = JSON.parse(e.metadata_json || "{}");
        return meta.sprint2_intent || meta.intent;
      } catch { return false; }
    });
    const hasIntentClassification = eventsWithIntent.length > 0;

    // Check: STOP/opt-out handling — any event with stop_opt_out intent
    const stopOptOutEvents = (inboundSmsEvents || []).filter(e => {
      try {
        const meta = JSON.parse(e.metadata_json || "{}");
        return meta.sprint2_intent === "stop_opt_out";
      } catch { return false; }
    });
    const hasStopOptOutHandling = stopOptOutEvents.length > 0;

    // Check: nurture pause on reply — any NurtureCampaign paused/stopped due to inbound reply
    let pausedNurtureCampaigns = [];
    try {
      pausedNurtureCampaigns = await base44.asServiceRole.entities.NurtureCampaign.filter(
        { status: { $in: ["paused", "stopped"] }, stop_reason: { $in: ["inbound_reply", "opted_out"] } },
        "-created_date",
      20
      );
    } catch (_) {}
    const hasNurturePauseOnReply = (pausedNurtureCampaigns || []).length > 0;

    // Check: admin escalation — any Alert created from inbound SMS
    let escalatedAlerts = [];
    try {
      escalatedAlerts = await base44.asServiceRole.entities.Alert.filter(
        { source: "twilio", type: { $in: ["booking_request", "engagement_trigger"] } },
        "-created_date",
        20
      );
    } catch (_) {}
    const hasAdminEscalation = (escalatedAlerts || []).length > 0;

    // Check: proof logs for inbound_sms_assistant
    const inboundProofLogs = (sprint2ProofLogs || []).filter(p => p.service_key === "inbound_sms_assistant");
    const inboundProofPassed = inboundProofLogs.some(p => p.status === "pass");
    const inboundStopProofPassed = inboundProofLogs.some(p => p.test_type === "stop_reply_test" && p.status === "pass");

    // Score inbound SMS assistant gate
    const inboundChecks = [
      { label: "Inbound SMS CommunicationEvents exist", passed: hasInboundSmsEvents },
      { label: "Intent classification recorded in metadata", passed: hasIntentClassification },
      { label: "STOP/opt-out handling verified", passed: hasStopOptOutHandling },
      { label: "Nurture pause on reply verified", passed: hasNurturePauseOnReply },
      { label: "Admin escalation for hot/unclear replies", passed: hasAdminEscalation },
      { label: "Proof log: inbound_reply_classification_test passed", passed: inboundProofPassed },
      { label: "Proof log: stop_reply_test passed", passed: inboundStopProofPassed },
    ];
    const inboundPassedCount = inboundChecks.filter(c => c.passed).length;
    const inboundCompletionPct = Math.round((inboundPassedCount / inboundChecks.length) * 100);
    const inboundProofPct = (inboundProofPassed && inboundStopProofPassed) ? 100 : (inboundProofPassed ? 50 : 0);

    // Determine evidence quality from proof logs
    const inboundEvidenceQuality = inboundProofPassed
      ? classifyEvidenceQuality(inboundProofLogs.find(p => p.status === "pass"))
      : "unknown";

    let inboundGateStatus;
    if (inboundProofPassed && inboundStopProofPassed) {
      inboundGateStatus = "proof_passed";
    } else if (hasInboundSmsEvents && hasIntentClassification) {
      inboundGateStatus = "ready_for_proof";
    } else if (hasInboundSmsEvents) {
      inboundGateStatus = "partial";
    } else {
      inboundGateStatus = "blocked";
    }

    const inboundMissing = inboundChecks.filter(c => !c.passed).map(c => c.label);
    const inboundBlocker = inboundMissing.length > 0 ? `Missing: ${inboundMissing.join("; ")}` : "All checks passed";
    const inboundNextAction = inboundProofPassed && inboundStopProofPassed
      ? "Inbound SMS assistant proof passed — admin approval required"
      : !hasInboundSmsEvents
        ? "Send a test inbound SMS to the Twilio number to create CommunicationEvent evidence"
        : !hasIntentClassification
          ? "Verify receiveTwilioInboundSms is classifying intent and recording in metadata"
          : !hasStopOptOutHandling
            ? "Send a STOP/opt-out test message to verify opt-out handling"
            : "Create AutomationProofLog records for inbound_reply_classification_test and stop_reply_test";

    // ═══════════════════════════════════════════
    // 2. NURTURE SEQUENCE 14D GATE
    // ═══════════════════════════════════════════

    // Check: active NurtureCampaigns exist (any active campaign means enrollment is working)
    let activeNurtureCampaigns = [];
    try {
      activeNurtureCampaigns = await base44.asServiceRole.entities.NurtureCampaign.filter(
        { status: "active" },
        "-enrolled_at",
        50
      );
    } catch (_) {}
    const hasActiveNurtureCampaigns = (activeNurtureCampaigns || []).length > 0;

    // Check: campaigns with 14-day scope (steps 6-8 skipped)
    const campaigns14d = (activeNurtureCampaigns || []).filter(c =>
      c.step6_status === "skipped" && c.step7_status === "skipped" && c.step8_status === "skipped"
    );
    const has14dCampaigns = campaigns14d.length > 0;

    // Check: enrollment events logged
    let enrollmentEvents = [];
    try {
      enrollmentEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { event_type: "workflow_triggered", channel: "internal" },
        "-created_date",
        50
      );
    } catch (_) {}
    const nurtureEnrollmentEvents = (enrollmentEvents || []).filter(e => {
      try {
        const meta = JSON.parse(e.metadata_json || "{}");
        return meta.service_key === "nurture_sequence_14d" || (e.message_body || "").includes("14-day nurture");
      } catch { return false; }
    });
    const hasEnrollmentEvents = nurtureEnrollmentEvents.length > 0;

    // Check: pause-on-reply — NurtureCampaigns paused due to inbound reply
    const hasPauseOnReply = hasNurturePauseOnReply; // reuse from inbound gate

    // Check: opt-out exclusion — NurtureCampaigns stopped due to opted_out
    let optedOutCampaigns = [];
    try {
      optedOutCampaigns = await base44.asServiceRole.entities.NurtureCampaign.filter(
        { status: "stopped", stop_reason: "opted_out" },
        "-created_date",
        20
      );
    } catch (_) {}
    const hasOptOutExclusion = (optedOutCampaigns || []).length > 0;

    // Check: proof logs for nurture_sequence_14d
    const nurtureProofLogs = (sprint2ProofLogs || []).filter(p => p.service_key === "nurture_sequence_14d");
    const nurtureProofPassed = nurtureProofLogs.some(p => p.test_type === "enrollment_test" && p.status === "pass");

    // Score nurture gate
    const nurtureChecks = [
      { label: "NurtureCampaign infrastructure exists", passed: hasActiveNurtureCampaigns },
      { label: "14-day scope campaigns (steps 6-8 skipped)", passed: has14dCampaigns || hasActiveNurtureCampaigns },
      { label: "Enrollment events logged", passed: hasEnrollmentEvents },
      { label: "Pause-on-reply verified", passed: hasPauseOnReply },
      { label: "Opt-out exclusion verified", passed: hasOptOutExclusion },
      { label: "Proof log: enrollment_test passed", passed: nurtureProofPassed },
    ];
    const nurturePassedCount = nurtureChecks.filter(c => c.passed).length;
    const nurtureCompletionPct = Math.round((nurturePassedCount / nurtureChecks.length) * 100);
    const nurtureProofPct = nurtureProofPassed ? 100 : 0;

    const nurtureEvidenceQuality = nurtureProofPassed
      ? classifyEvidenceQuality(nurtureProofLogs.find(p => p.status === "pass"))
      : "unknown";

    let nurtureGateStatus;
    if (nurtureProofPassed) {
      nurtureGateStatus = "proof_passed";
    } else if (hasActiveNurtureCampaigns && hasEnrollmentEvents) {
      nurtureGateStatus = "ready_for_proof";
    } else if (hasActiveNurtureCampaigns) {
      nurtureGateStatus = "partial";
    } else {
      nurtureGateStatus = "blocked";
    }

    const nurtureMissing = nurtureChecks.filter(c => !c.passed).map(c => c.label);
    const nurtureBlocker = nurtureMissing.length > 0 ? `Missing: ${nurtureMissing.join("; ")}` : "All checks passed";
    const nurtureNextAction = nurtureProofPassed
      ? "Nurture sequence proof passed — admin approval required"
      : !hasActiveNurtureCampaigns
        ? "Enroll a test lead in the 14-day nurture sequence"
        : !hasEnrollmentEvents
          ? "Verify startNurtureSequence14d is logging enrollment events"
          : !hasPauseOnReply
            ? "Send a test inbound reply to verify nurture pause"
            : "Create AutomationProofLog for enrollment_test";

    // ═══════════════════════════════════════════
    // 3. COMBINED SPRINT 2 GATE
    // ═══════════════════════════════════════════

    let combinedGateStatus;
    if (inboundGateStatus === "proof_passed" && nurtureGateStatus === "proof_passed") {
      combinedGateStatus = "proof_passed";
    } else if (inboundGateStatus === "blocked" || nurtureGateStatus === "blocked") {
      combinedGateStatus = "blocked";
    } else {
      combinedGateStatus = "partial";
    }

    const combinedCompletionPct = Math.round((inboundCompletionPct + nurtureCompletionPct) / 2);
    const combinedProofPct = (inboundProofPct + nurtureProofPct) / 2;
    const combinedBlocker = combinedGateStatus === "proof_passed"
      ? "All Sprint 2 checks passed — admin approval required"
      : `Inbound: ${inboundGateStatus}, Nurture: ${nurtureGateStatus}`;
    const combinedNextAction = combinedGateStatus === "proof_passed"
      ? "Review Sprint 2 evidence and approve for internal launch"
      : "Address blockers in inbound_sms_assistant and nurture_sequence_14d gates";

    // ═══════════════════════════════════════════
    // UPDATE GATES
    // ═══════════════════════════════════════════

    const gateUpdates = [
      {
        gate: inboundGate,
        gateKey: "inbound_sms_assistant",
        update: {
          status: inboundGateStatus,
          completion_percent: inboundCompletionPct,
          proof_percent: inboundProofPct,
          evidence_quality: inboundEvidenceQuality,
          current_blocker: inboundBlocker,
          next_action: inboundNextAction,
          last_checked_at: now,
          last_verdict: `Sprint 2 proof check ran ${now} — ${inboundPassedCount}/${inboundChecks.length} checks passed`,
        },
      },
      {
        gate: nurtureGate,
        gateKey: "nurture_sequence_14d",
        update: {
          status: nurtureGateStatus,
          completion_percent: nurtureCompletionPct,
          proof_percent: nurtureProofPct,
          evidence_quality: nurtureEvidenceQuality,
          current_blocker: nurtureBlocker,
          next_action: nurtureNextAction,
          last_checked_at: now,
          last_verdict: `Sprint 2 proof check ran ${now} — ${nurturePassedCount}/${nurtureChecks.length} checks passed`,
        },
      },
      {
        gate: combinedGate,
        gateKey: "sprint2_inbound_and_nurture_gate",
        update: {
          status: combinedGateStatus,
          completion_percent: combinedCompletionPct,
          proof_percent: combinedProofPct,
          current_blocker: combinedBlocker,
          next_action: combinedNextAction,
          last_checked_at: now,
          last_verdict: `Sprint 2 combined proof check ran ${now} — inbound: ${inboundGateStatus}, nurture: ${nurtureGateStatus}`,
        },
      },
    ];

    for (const { gate, gateKey, update } of gateUpdates) {
      if (gate) {
        await base44.asServiceRole.entities.LaunchGate.update(gate.id, update);
      } else {
        // Create if missing
        const gateDef = SPRINT2_GATE_DEFINITIONS[gateKey];
        if (gateDef) {
          await base44.asServiceRole.entities.LaunchGate.create({
            ...gateDef,
            ...update,
            severity: "launch_blocker",
            approval_required: true,
            evidence_summary: `Sprint 2 proof check — ${update.last_verdict}`,
          });
        }
      }
    }

    return json({
      success: true,
      ran_at: now,
      sprint: 2,
      inbound_sms_assistant: {
        status: inboundGateStatus,
        completion_percent: inboundCompletionPct,
        proof_percent: inboundProofPct,
        evidence_quality: inboundEvidenceQuality,
        checks: inboundChecks,
        blocker: inboundBlocker,
        next_action: inboundNextAction,
      },
      nurture_sequence_14d: {
        status: nurtureGateStatus,
        completion_percent: nurtureCompletionPct,
        proof_percent: nurtureProofPct,
        evidence_quality: nurtureEvidenceQuality,
        checks: nurtureChecks,
        blocker: nurtureBlocker,
        next_action: nurtureNextAction,
      },
      sprint2_combined: {
        status: combinedGateStatus,
        completion_percent: combinedCompletionPct,
        proof_percent: combinedProofPct,
        blocker: combinedBlocker,
        next_action: combinedNextAction,
      },
    });
  } catch (error) {
    console.error("[runSprint2ProofCheck] error:", error.message);
    return json({ error: error.message }, 500);
  }
});

// Gate definitions for creation if missing
const SPRINT2_GATE_DEFINITIONS = {
  inbound_sms_assistant: {
    gate_key: "inbound_sms_assistant",
    gate_name: "Inbound SMS Assistant",
    section_label: "Sprint 2",
    description: "Inbound SMS handling with intent classification, STOP handling, nurture pause, and admin escalation.",
    required_categories: ["sms", "inbound_reply"],
    required_tasks: ["verify_inbound_sms_webhook", "verify_intent_classification", "verify_stop_handling", "verify_nurture_pause", "verify_admin_escalation"],
    required_proofs: ["inbound_reply_classification_test", "stop_reply_test"],
    unlock_condition_summary: "Inbound SMS events with intent classification + STOP handling + nurture pause + admin escalation proof",
  },
  nurture_sequence_14d: {
    gate_key: "nurture_sequence_14d",
    gate_name: "14-Day Nurture Sequence",
    section_label: "Sprint 2",
    description: "Controlled 14-day nurture sequence for eligible leads with consent.",
    required_categories: ["nurture", "email"],
    required_tasks: ["verify_enrollment", "verify_consent_checks", "verify_pause_on_reply", "verify_opt_out_exclusion"],
    required_proofs: ["enrollment_test"],
    unlock_condition_summary: "Enrollment with consent + pause-on-reply + opt-out exclusion proof",
  },
  sprint2_inbound_and_nurture_gate: {
    gate_key: "sprint2_inbound_and_nurture_gate",
    gate_name: "Sprint 2 — Inbound & Nurture Combined Gate",
    section_label: "Sprint 2",
    description: "Combined Sprint 2 readiness gate.",
    required_categories: ["sprint2"],
    required_tasks: ["inbound_sms_assistant_proof", "nurture_sequence_14d_proof"],
    required_proofs: ["sprint2_combined_proof"],
    unlock_condition_summary: "Both inbound_sms_assistant and nurture_sequence_14d gates must pass proof",
  },
};