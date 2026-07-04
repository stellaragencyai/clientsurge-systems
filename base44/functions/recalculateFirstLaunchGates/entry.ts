/**
 * recalculateFirstLaunchGates — Recalculates LaunchGate status for first-launch scope.
 *
 * Admin-only. Updates LaunchGate records with truth-based status:
 *
 *   instant_lead_response: blocked → partial only with real delivery evidence
 *   missed_call_text_back: blocked until route healthy AND evidence exists
 *   automation_delivery_gate: blocked while AutomationProofLog is empty
 *   twilio_webhook_route_health: blocked while any route returns non-200
 *
 * Route health is a blocker source — if routes return 404/405,
 * downstream gates cannot progress.
 *
 * Also checks AutomationChecklist truth: flags should not be true
 * until evidence exists.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function isRealSid(value, prefix) {
  if (!value || typeof value !== "string") return false;
  return new RegExp(`^${prefix}[a-zA-Z0-9]+$`).test(value);
}

async function checkRouteHealth(base44) {
  try {
    const gates = await base44.asServiceRole.entities.LaunchGate.list("", 50);
    const routeGate = gates?.find((g) => g.gate_key === "twilio_webhook_route_health");
    return {
      gate_exists: !!routeGate,
      status: routeGate?.status || "unknown",
      blocker: routeGate?.current_blocker || null,
      healthy: routeGate?.status === "proof_passed",
    };
  } catch (_) {
    return { gate_exists: false, status: "unknown", blocker: "Gate not found", healthy: false };
  }
}

async function checkInstantLeadEvidence(base44) {
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

    const qualified = (logs || []).filter(
      (log) =>
        isRealSid(log.provider_message_id, "SM") &&
        log.delivery_status === "delivered" &&
        log.delivered_at &&
        !log.failed_at &&
        log.environment === "production" &&
        log.dashboard_excluded !== true
    );

    return {
      has_evidence: qualified.length > 0,
      qualified_count: qualified.length,
      latest: qualified[0]
        ? {
            id: qualified[0].id,
            provider_message_id: qualified[0].provider_message_id,
            delivery_status: qualified[0].delivery_status,
            delivered_at: qualified[0].delivered_at,
          }
        : null,
    };
  } catch (_) {
    return { has_evidence: false, qualified_count: 0, latest: null };
  }
}

async function checkMissedCallEvidence(base44) {
  try {
    const callEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { channel: "voice", direction: "inbound", provider: "twilio" },
      "-created_date",
      10
    );
    const realCall = (callEvents || []).find((e) => isRealSid(e.provider_message_id, "CA"));

    const smsLogs = await base44.asServiceRole.entities.CommunicationLog.filter(
      {
        channel: "sms",
        provider: "twilio",
        direction: "outbound",
      },
      "-created_date",
      50
    );
    const deliveredSms = (smsLogs || []).find(
      (log) =>
        isRealSid(log.provider_message_id, "SM") &&
        log.delivery_status === "delivered" &&
        log.delivered_at &&
        !log.failed_at &&
        log.environment === "production" &&
        log.dashboard_excluded !== true
    );

    return {
      has_call_event: !!realCall,
      has_delivered_sms: !!deliveredSms,
      has_evidence: !!realCall && !!deliveredSms,
      call_sid: realCall?.provider_message_id || null,
      message_sid: deliveredSms?.provider_message_id || null,
    };
  } catch (_) {
    return { has_call_event: false, has_delivered_sms: false, has_evidence: false };
  }
}

async function checkAutomationProofLogs(base44) {
  try {
    const logs = await base44.asServiceRole.entities.AutomationProofLog.list("-created_date", 50);
    return {
      total: logs?.length || 0,
      passed: (logs || []).filter((p) => p.status === "pass").length,
      pending: (logs || []).filter((p) => p.status === "pending").length,
      failed: (logs || []).filter((p) => p.status === "fail").length,
      is_empty: !logs || logs.length === 0,
    };
  } catch (_) {
    return { total: 0, passed: 0, pending: 0, failed: 0, is_empty: true };
  }
}

async function checkAutomationChecklists(base44) {
  try {
    const checklists = await base44.asServiceRole.entities.AutomationChecklist.filter(
      {
        service_key: { $in: ["instant_lead_response", "missed_call_text_back"] },
      },
      "-created_date",
      20
    );
    return (checklists || []).map((cl) => ({
      id: cl.id,
      business_name: cl.business_name,
      service_key: cl.service_key,
      status: cl.status,
      twilio_configured: cl.twilio_configured,
      test_lead_sent: cl.test_lead_sent,
      test_response_received: cl.test_response_received,
      client_approved: cl.client_approved,
      went_live_at: cl.went_live_at,
      truth_warning:
        cl.status === "active" && !cl.test_response_received
          ? "Status is 'active' but test_response_received is false — should remain in_progress"
          : null,
    }));
  } catch (_) {
    return [];
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const now = new Date().toISOString();

    // Gather all evidence
    const routeHealth = await checkRouteHealth(base44);
    const instantLeadEvidence = await checkInstantLeadEvidence(base44);
    const missedCallEvidence = await checkMissedCallEvidence(base44);
    const proofLogs = await checkAutomationProofLogs(base44);
    const checklists = await checkAutomationChecklists(base44);

    const launchGates = await base44.asServiceRole.entities.LaunchGate.list("", 50);

    const results = {};

    // ── Gate 1: instant_lead_response ──
    {
      const gate = launchGates?.find((g) => g.gate_key === "instant_lead_response");
      let status, completion, proofPct, blocker, nextAction, verdict;

      if (!routeHealth.healthy) {
        status = "blocked";
        completion = 10;
        proofPct = 0;
        blocker = `Route health: ${routeHealth.blocker || "unhealthy"}`;
        nextAction = "Repair webhook routes (run verifyTwilioWebhookRouteHealth)";
        verdict = "Blocked by route health";
      } else if (!instantLeadEvidence.has_evidence) {
        status = "blocked";
        completion = 25;
        proofPct = 0;
        blocker = "No delivered Twilio SMS evidence found";
        nextAction = "Send a real lead and wait for delivery callback";
        verdict = "Routes healthy but no delivery evidence";
      } else {
        status = "partial";
        completion = 60;
        proofPct = 50;
        blocker = "Delivery evidence exists — AutomationProofLog pass still required";
        nextAction = "Review evidence, then create AutomationProofLog with status=pass if evidence qualifies";
        verdict = "Evidence found — awaiting proof log creation";
      }

      const updates = {
        status,
        completion_percent: completion,
        proof_percent: proofPct,
        current_blocker: blocker,
        next_action: nextAction,
        evidence_summary: JSON.stringify({
          route_healthy: routeHealth.healthy,
          delivery_evidence: instantLeadEvidence.has_evidence,
          qualified_count: instantLeadEvidence.qualified_count,
          latest_evidence: instantLeadEvidence.latest,
        }),
        last_checked_at: now,
        last_verdict: verdict,
      };

      if (gate) {
        await base44.asServiceRole.entities.LaunchGate.update(gate.id, updates);
        results.instant_lead_response = { gate_id: gate.id, ...updates };
      } else {
        const created = await base44.asServiceRole.entities.LaunchGate.create({
          gate_key: "instant_lead_response",
          gate_name: "Instant Lead Response",
          section_label: "Speed-to-Lead",
          severity: "launch_blocker",
          required_categories: ["sms"],
          required_tasks: ["verify_sms_route", "send_real_lead", "verify_delivery_callback"],
          required_proofs: ["delivered_sms_communication_log", "automation_proof_log_pass"],
          approval_required: true,
          ...updates,
          unlock_condition_summary: "Routes healthy + delivered SMS evidence + AutomationProofLog pass",
        });
        results.instant_lead_response = { gate_id: created.id, ...updates };
      }
    }

    // ── Gate 2: missed_call_text_back ──
    {
      const gate = launchGates?.find((g) => g.gate_key === "missed_call_text_back");
      let status, completion, proofPct, blocker, nextAction, verdict;

      if (!routeHealth.healthy) {
        status = "blocked";
        completion = 5;
        proofPct = 0;
        blocker = `Route health: ${routeHealth.blocker || "unhealthy"}`;
        nextAction = "Repair missed-call webhook route (404) first";
        verdict = "Blocked by route health";
      } else if (!missedCallEvidence.has_evidence) {
        status = "blocked";
        completion = 15;
        proofPct = 0;
        blocker = missedCallEvidence.has_call_event
          ? "Inbound call found but no delivered text-back SMS evidence"
          : "No real missed-call evidence (call + text-back delivery) found";
        nextAction = "Place a real missed call and wait for text-back delivery";
        verdict = "Routes healthy but no call/SMS evidence";
      } else {
        status = "partial";
        completion = 55;
        proofPct = 50;
        blocker = "Missed-call + delivery evidence exists — AutomationProofLog pass still required";
        nextAction = "Review evidence, then create AutomationProofLog with status=pass if evidence qualifies";
        verdict = "Evidence found — awaiting proof log creation";
      }

      const updates = {
        status,
        completion_percent: completion,
        proof_percent: proofPct,
        current_blocker: blocker,
        next_action: nextAction,
        evidence_summary: JSON.stringify({
          route_healthy: routeHealth.healthy,
          has_call_event: missedCallEvidence.has_call_event,
          has_delivered_sms: missedCallEvidence.has_delivered_sms,
          call_sid: missedCallEvidence.call_sid,
          message_sid: missedCallEvidence.message_sid,
        }),
        last_checked_at: now,
        last_verdict: verdict,
      };

      if (gate) {
        await base44.asServiceRole.entities.LaunchGate.update(gate.id, updates);
        results.missed_call_text_back = { gate_id: gate.id, ...updates };
      } else {
        const created = await base44.asServiceRole.entities.LaunchGate.create({
          gate_key: "missed_call_text_back",
          gate_name: "Missed Call Text-Back",
          section_label: "Missed Call Recovery",
          severity: "launch_blocker",
          required_categories: ["voice", "sms"],
          required_tasks: ["verify_missed_call_route", "place_real_missed_call", "verify_text_back_delivery"],
          required_proofs: ["inbound_call_comm_event", "delivered_sms_communication_log", "automation_proof_log_pass"],
          approval_required: true,
          ...updates,
          unlock_condition_summary: "Routes healthy + inbound call event + delivered text-back SMS + AutomationProofLog pass",
        });
        results.missed_call_text_back = { gate_id: created.id, ...updates };
      }
    }

    // ── Gate 3: automation_delivery_gate ──
    {
      const gate = launchGates?.find((g) => g.gate_key === "automation_delivery_gate");
      let status, completion, proofPct, blocker, nextAction, verdict;

      if (proofLogs.is_empty) {
        status = "blocked";
        completion = 0;
        proofPct = 0;
        blocker = "AutomationProofLog is empty — no proof records exist";
        nextAction = "Create proof records only from real evidence (see getProofWorkflowScaffolding)";
        verdict = "Blocked — zero proof logs";
      } else if (proofLogs.passed === 0) {
        status = "blocked";
        completion = 20;
        proofPct = 0;
        blocker = `${proofLogs.total} proof log(s) exist but 0 passed`;
        nextAction = "Review pending/failed proof logs — do not mark pass without real evidence";
        verdict = "Blocked — no passing proof logs";
      } else {
        status = "partial";
        completion = 60;
        proofPct = Math.round((proofLogs.passed / Math.max(proofLogs.total, 1)) * 100);
        blocker = `${proofLogs.passed} proof log(s) passed — manual approval still required`;
        nextAction = "Review passing proof logs and approve if evidence is real";
        verdict = "Partial — proof logs exist and some passed";
      }

      const updates = {
        status,
        completion_percent: completion,
        proof_percent: proofPct,
        current_blocker: blocker,
        next_action: nextAction,
        evidence_summary: JSON.stringify({
          total_proof_logs: proofLogs.total,
          passed: proofLogs.passed,
          pending: proofLogs.pending,
          failed: proofLogs.failed,
        }),
        last_checked_at: now,
        last_verdict: verdict,
      };

      if (gate) {
        await base44.asServiceRole.entities.LaunchGate.update(gate.id, updates);
        results.automation_delivery_gate = { gate_id: gate.id, ...updates };
      } else {
        const created = await base44.asServiceRole.entities.LaunchGate.create({
          gate_key: "automation_delivery_gate",
          gate_name: "Automation Delivery Gate",
          section_label: "Delivery Proof",
          severity: "critical_blocker",
          required_categories: ["proof"],
          required_tasks: ["create_proof_logs_from_real_evidence", "pass_proof_for_each_service"],
          required_proofs: ["automation_proof_log_pass_for_each_service"],
          approval_required: true,
          ...updates,
          unlock_condition_summary: "AutomationProofLog pass records exist for instant_lead_response and missed_call_text_back",
        });
        results.automation_delivery_gate = { gate_id: created.id, ...updates };
      }
    }

    // ── AutomationChecklist truth warnings ──
    const checklistWarnings = checklists
      .filter((cl) => cl.truth_warning)
      .map((cl) => ({
        id: cl.id,
        business_name: cl.business_name,
        service_key: cl.service_key,
        warning: cl.truth_warning,
      }));

    return Response.json({
      success: true,
      recalculated_at: now,
      route_health: routeHealth,
      instant_lead_evidence: instantLeadEvidence,
      missed_call_evidence: missedCallEvidence,
      proof_logs: proofLogs,
      checklist_warnings: checklistWarnings,
      gates: results,
      repair_actions: [
        !routeHealth.healthy ? "Repair webhook routes (run verifyTwilioWebhookRouteHealth)" : null,
        !instantLeadEvidence.has_evidence ? "Send a real lead and verify delivery callback" : null,
        !missedCallEvidence.has_evidence ? "Place a real missed call and verify text-back delivery" : null,
        proofLogs.is_empty ? "Create AutomationProofLog records only from real evidence" : null,
        checklistWarnings.length > 0
          ? `${checklistWarnings.length} checklist(s) have truth warnings — review before go-live`
          : null,
      ].filter(Boolean),
    });
  } catch (error) {
    console.error("[recalculateFirstLaunchGates] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});