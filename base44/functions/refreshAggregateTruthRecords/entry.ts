/**
 * refreshAggregateTruthRecords — Refreshes stale top-level truth records so
 * they reflect the current Sprint 1 proof results instead of old July 4
 * blocked/no_go state.
 *
 * Admin-only. Does NOT delete old records — creates new ones (history preserved).
 *
 * Refreshes:
 *   1. LaunchGate: twilio_sms_gate (aggregate SMS capability)
 *   2. LaunchGate: dashboard_truth_gate (aggregate truth layer)
 *   3. DashboardTruthCheck: new record with current evidence
 *   4. LaunchReadinessState: new record with current gate states
 *
 * The overall app remains "not fully launch-safe" until broader gates are
 * repaired, but Sprint 1 core Twilio is shown as materially improved.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SPRINT1_SERVICE_KEYS = ["instant_lead_response", "missed_call_text_back"];

const NON_SPRINT1_GATES_PARKED = [
  "ai_voice_receptionist",
  "review_request",
  "lead_reactivation",
  "nurture_sequence_14d",
  "ai_booking_agent",
  "daily_lead_digest",
  "inbound_sms_assistant",
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return json({ error: "Admin only" }, { status: 403 });
    }

    const now = new Date().toISOString();

    // ── Gather current evidence ──
    const launchGates = await base44.asServiceRole.entities.LaunchGate.list("", 100);
    const proofLogs = await base44.asServiceRole.entities.AutomationProofLog.list("-created_date", 50);

    const allProofs = proofLogs || [];
    const passedProofs = allProofs.filter((p) => p.status === "pass");
    const sprint1Passed = passedProofs.filter((p) => SPRINT1_SERVICE_KEYS.includes(p.service_key));

    // Route health gate
    const routeGate = launchGates?.find((g) => g.gate_key === "twilio_webhook_route_health");
    const routesHealthy = routeGate?.status === "proof_passed";

    // Sprint 1 individual gates
    const instantLeadGate = launchGates?.find((g) => g.gate_key === "instant_lead_response");
    const missedCallGate = launchGates?.find((g) => g.gate_key === "missed_call_text_back");
    const automationDeliveryGate = launchGates?.find((g) => g.gate_key === "automation_delivery_gate");

    const sprint1ProofPassed =
      instantLeadGate?.status === "proof_passed" && missedCallGate?.status === "proof_passed";

    // ── Calculate Sprint 1 score ──
    let sprint1Score = 0;
    if (routesHealthy) sprint1Score += 25;
    if (instantLeadGate?.status === "proof_passed") sprint1Score += 30;
    if (missedCallGate?.status === "proof_passed") sprint1Score += 30;
    if (automationDeliveryGate?.status === "partial" || automationDeliveryGate?.status === "proof_passed") sprint1Score += 15;

    // ── Calculate broader system score ──
    // Non-Sprint-1 gates are parked → they don't contribute to full launch readiness
    const parkedGates = (launchGates || []).filter((g) =>
      NON_SPRINT1_GATES_PARKED.includes(g.gate_key)
    );
    const allParked = parkedGates.every(
      (g) => g.status === "locked" || g.status === "blocked" || !g.status
    );

    // Full launch requires Sprint 1 + broader gates
    const fullLaunchReady = sprint1ProofPassed && allParked === false
      ? false // broader gates still need work
      : false;

    // ── Determine overall truth status ──
    let overallTruthStatus = "blocked";
    let safeToLaunch = false;

    if (sprint1ProofPassed) {
      // Sprint 1 core is proven but broader system not ready
      overallTruthStatus = "warning";
      safeToLaunch = false;
    } else if (routesHealthy && sprint1Score > 0) {
      overallTruthStatus = "warning";
      safeToLaunch = false;
    } else {
      overallTruthStatus = "blocked";
      safeToLaunch = false;
    }

    // ── Build blockers list ──
    const blockers = [];
    const warnings = [];

    if (!routesHealthy) {
      blockers.push({
        code: "BLOCK_WEBHOOK_ROUTES",
        severity: "critical_blocker",
        message: "Twilio webhook routes not all healthy",
        fix_action: "Run verifyTwilioWebhookRouteHealth",
      });
    }

    if (instantLeadGate && instantLeadGate.status !== "proof_passed") {
      blockers.push({
        code: "BLOCK_INSTANT_LEAD_PROOF",
        severity: "launch_blocker",
        message: `Instant lead response: ${instantLeadGate.status} — ${instantLeadGate.current_blocker || "not proven"}`,
        fix_action: instantLeadGate.next_action || "Send real lead, verify delivery, create proof log",
      });
    }

    if (missedCallGate && missedCallGate.status !== "proof_passed") {
      blockers.push({
        code: "BLOCK_MISSED_CALL_PROOF",
        severity: "launch_blocker",
        message: `Missed call text-back: ${missedCallGate.status} — ${missedCallGate.current_blocker || "not proven"}`,
        fix_action: missedCallGate.next_action || "Place real missed call, verify text-back delivery, create proof log",
      });
    }

    if (automationDeliveryGate && automationDeliveryGate.status === "partial") {
      warnings.push({
        code: "WARN_MANUAL_APPROVAL_PENDING",
        severity: "launch_blocker",
        message: "Sprint 1 proof logs passed — manual approval still required for go-live",
        fix_action: "Review passing proof logs and approve if evidence is real",
      });
    }

    // Non-Sprint-1 areas are parked → advisory warning
    if (parkedGates.length > 0) {
      warnings.push({
        code: "WARN_NON_SPRINT1_PARKED",
        severity: "advisory",
        message: `${parkedGates.length} non-Sprint-1 gates are parked (AI voice, review, referral, nurture, booking) — not part of Sprint 1 scope`,
        fix_action: "Address in subsequent sprints; do not unblock until independently proven",
      });
    }

    // ── Update aggregate gate: twilio_sms_gate ──
    const twilioSmsGateResults = {};
    {
      const existing = launchGates?.find((g) => g.gate_key === "twilio_sms_gate");
      let status, completion, proofPct, blocker, nextAction, verdict;

      if (!routesHealthy) {
        status = "blocked";
        completion = 10;
        proofPct = 0;
        blocker = `Route health: ${routeGate?.current_blocker || "unhealthy"}`;
        nextAction = "Repair webhook routes first";
        verdict = "Blocked by route health";
      } else if (sprint1ProofPassed) {
        status = "proof_passed";
        completion = Math.round(sprint1Score);
        proofPct = 100;
        blocker = "Sprint 1 SMS proof passed — broader system approval pending";
        nextAction = "Obtain client sign-off for went_live_at on AutomationChecklist";
        verdict = "Sprint 1 core SMS proof passed";
      } else {
        status = "partial";
        completion = Math.round(sprint1Score);
        proofPct = sprint1ProofPassed ? 100 : Math.round(sprint1Score / 2);
        blocker = "Sprint 1 SMS partially proven — some gates still need work";
        nextAction = "Complete remaining Sprint 1 proof gates";
        verdict = "Partial — Sprint 1 SMS in progress";
      }

      const updates = {
        status,
        completion_percent: completion,
        proof_percent: proofPct,
        current_blocker: blocker,
        next_action: nextAction,
        evidence_summary: JSON.stringify({
          routes_healthy: routesHealthy,
          instant_lead_status: instantLeadGate?.status || "unknown",
          missed_call_status: missedCallGate?.status || "unknown",
          sprint1_score: sprint1Score,
          sprint1_proofs_passed: sprint1Passed.length,
        }),
        last_checked_at: now,
        last_verdict: verdict,
      };

      if (existing) {
        await base44.asServiceRole.entities.LaunchGate.update(existing.id, updates);
        twilioSmsGateResults.gate_id = existing.id;
      } else {
        const created = await base44.asServiceRole.entities.LaunchGate.create({
          gate_key: "twilio_sms_gate",
          gate_name: "Twilio SMS Aggregate Gate",
          section_label: "Sprint 1 — Core SMS",
          severity: "critical_blocker",
          required_categories: ["sms", "voice"],
          required_tasks: ["verify_routes", "prove_instant_lead", "prove_missed_call"],
          required_proofs: ["instant_lead_response_pass", "missed_call_text_back_pass"],
          approval_required: true,
          ...updates,
          unlock_condition_summary: "All Sprint 1 SMS gates proof_passed + manual approval",
        });
        twilioSmsGateResults.gate_id = created.id;
      }
      Object.assign(twilioSmsGateResults, updates);
    }

    // ── Update aggregate gate: dashboard_truth_gate ──
    const dashboardTruthGateResults = {};
    {
      const existing = launchGates?.find((g) => g.gate_key === "dashboard_truth_gate");
      const updates = {
        status: overallTruthStatus === "trusted" ? "proof_passed" : overallTruthStatus === "warning" ? "partial" : "blocked",
        completion_percent: Math.round(sprint1Score * 0.7),
        proof_percent: sprint1ProofPassed ? 70 : Math.round(sprint1Score / 2),
        current_blocker: sprint1ProofPassed
          ? "Sprint 1 proven but broader system gates remain parked/blocked"
          : "Sprint 1 core SMS/missed-call proof incomplete",
        next_action: sprint1ProofPassed
          ? "Obtain manual approval for Sprint 1 go-live; address non-Sprint-1 gates in subsequent sprints"
          : "Complete Sprint 1 proof: routes, instant lead, missed-call text-back",
        evidence_summary: JSON.stringify({
          overall_truth: overallTruthStatus,
          sprint1_proof_passed: sprint1ProofPassed,
          sprint1_score: sprint1Score,
          routes_healthy: routesHealthy,
          non_sprint1_gates_parked: parkedGates.length,
          safe_to_launch: safeToLaunch,
          refreshed_from_stale: true,
          previous_stale_date: "2026-07-04",
        }),
        last_checked_at: now,
        last_verdict: sprint1ProofPassed
          ? "Sprint 1 improved — broader system not fully ready"
          : "Sprint 1 in progress — dashboard truth still blocked",
      };

      if (existing) {
        await base44.asServiceRole.entities.LaunchGate.update(existing.id, updates);
        dashboardTruthGateResults.gate_id = existing.id;
      } else {
        const created = await base44.asServiceRole.entities.LaunchGate.create({
          gate_key: "dashboard_truth_gate",
          gate_name: "Dashboard Truth Gate",
          section_label: "Aggregate Truth Layer",
          severity: "critical_blocker",
          required_categories: ["truth"],
          required_tasks: ["refresh_dashboard_truth_check", "refresh_launch_readiness_state"],
          required_proofs: ["dashboard_truth_check_record_current", "launch_readiness_state_record_current"],
          approval_required: true,
          ...updates,
          unlock_condition_summary: "DashboardTruthCheck + LaunchReadinessState refreshed with current evidence",
        });
        dashboardTruthGateResults.gate_id = created.id;
      }
      Object.assign(dashboardTruthGateResults, updates);
    }

    // ── Create new DashboardTruthCheck record (history preserved) ──
    const dashboardTruthRecord = await base44.asServiceRole.entities.DashboardTruthCheck.create({
      scope: "mission_control",
      truth_status: overallTruthStatus,
      safe_to_show_client: overallTruthStatus !== "blocked",
      safe_to_show_admin: true,
      safe_to_launch: safeToLaunch,
      blocker_count: blockers.length,
      warning_count: warnings.length,
      blockers,
      warnings,
      evidence_summary: `Sprint 1 refresh: routes=${routesHealthy ? "healthy" : "unhealthy"}, instant_lead=${instantLeadGate?.status || "unknown"}, missed_call=${missedCallGate?.status || "unknown"}, sprint1_proofs=${sprint1Passed.length}/${SPRINT1_SERVICE_KEYS.length} passed, non_sprint1_parked=${parkedGates.length}. Overall: ${overallTruthStatus} — not fully launch-safe until broader gates repaired.`,
      source_records: {
        route_health_gate: { status: routeGate?.status, last_checked_at: routeGate?.last_checked_at },
        instant_lead_gate: { status: instantLeadGate?.status, completion: instantLeadGate?.completion_percent },
        missed_call_gate: { status: missedCallGate?.status, completion: missedCallGate?.completion_percent },
        automation_delivery_gate: { status: automationDeliveryGate?.status, proof: automationDeliveryGate?.proof_percent },
        proof_logs: { total: allProofs.length, passed: passedProofs.length, sprint1_passed: sprint1Passed.length },
        twilio_sms_gate: { status: twilioSmsGateResults.status, completion: twilioSmsGateResults.completion_percent },
      },
      last_checked_at: now,
      created_at: now,
      updated_at: now,
      description: `Sprint 1 truth refresh — replaces stale July 4 record. Sprint 1 core Twilio materially improved; broader app remains not fully launch-safe.`,
    });

    // ── Create new LaunchReadinessState record (history preserved) ──
    const systemHealthScore = Math.round(
      (routesHealthy ? 25 : 0) +
      (instantLeadGate?.status === "proof_passed" ? 25 : 0) +
      (missedCallGate?.status === "proof_passed" ? 25 : 0) +
      (automationDeliveryGate?.status === "partial" || automationDeliveryGate?.status === "proof_passed" ? 15 : 0)
    );

    const launchReadinessRecord = await base44.asServiceRole.entities.LaunchReadinessState.create({
      launch_id: `sprint1-refresh-${Date.now()}`,
      overall_readiness_score: Math.round((systemHealthScore + sprint1Score) / 2),
      system_status: sprint1ProofPassed ? "degraded" : "not_ready",
      critical_blockers: blockers.map((b) => b.message),
      warning_items: warnings.map((w) => w.message),
      system_checks: {
        stripe_active: false,
        stripe_live_keys: false,
        ga4_active: false,
        landing_pages_live: false,
        pricing_page_live: false,
        event_pipeline_healthy: false,
        automation_healthy: sprint1ProofPassed,
        onboarding_ready: false,
        client_portal_live: false,
        twilio_provisioned: routesHealthy,
      },
      system_health_score: systemHealthScore,
      gtm_health_score: 0,
      funnel_health_score: 0,
      ops_health_score: 0,
      go_no_go_decision: sprint1ProofPassed ? "conditional_go" : "no_go",
      last_evaluated_at: now,
      next_evaluation_at: new Date(Date.now() + 3600000).toISOString(),
      notes: `Sprint 1 refresh — replaces stale July 4 state. Routes ${routesHealthy ? "healthy" : "unhealthy"}. Instant lead: ${instantLeadGate?.status || "unknown"}. Missed call: ${missedCallGate?.status || "unknown"}. ${sprint1Passed.length}/${SPRINT1_SERVICE_KEYS.length} Sprint 1 proofs passed. ${parkedGates.length} non-Sprint-1 gates parked. Overall: ${sprint1ProofPassed ? "conditional_go for Sprint 1 core only" : "no_go"} — broader app NOT fully launch-safe.`,
    });

    return json({
      success: true,
      refreshed_at: now,
      sprint1_status: {
        routes_healthy: routesHealthy,
        instant_lead_response: instantLeadGate?.status || "unknown",
        missed_call_text_back: missedCallGate?.status || "unknown",
        automation_delivery: automationDeliveryGate?.status || "unknown",
        proofs_passed: `${sprint1Passed.length}/${SPRINT1_SERVICE_KEYS.length}`,
        sprint1_score: sprint1Score,
        proof_passed: sprint1ProofPassed,
      },
      aggregate_gates: {
        twilio_sms_gate: twilioSmsGateResults,
        dashboard_truth_gate: dashboardTruthGateResults,
      },
      overall: {
        truth_status: overallTruthStatus,
        safe_to_launch: safeToLaunch,
        go_no_go: sprint1ProofPassed ? "conditional_go" : "no_go",
        message: sprint1ProofPassed
          ? "Sprint 1 core Twilio materially improved — broader app remains not fully launch-safe until non-Sprint-1 gates are addressed"
          : "Sprint 1 in progress — core SMS/missed-call proof incomplete",
      },
      new_records: {
        dashboard_truth_check_id: dashboardTruthRecord.id,
        launch_readiness_state_id: launchReadinessRecord.id,
        history_preserved: true,
      },
      parked_non_sprint1: NON_SPRINT1_GATES_PARKED,
      blockers_count: blockers.length,
      warnings_count: warnings.length,
    });
  } catch (error) {
    console.error("[refreshAggregateTruthRecords] Error:", error.message);
    return json({ error: error.message }, { status: 500 });
  }
});