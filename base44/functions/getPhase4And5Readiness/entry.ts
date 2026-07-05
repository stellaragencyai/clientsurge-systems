/**
 * getPhase4And5Readiness — Admin-only read function that audits Phase 4
 * (Client Onboarding + Installation OS) and Phase 5 (Client Portal +
 * Status Updates) readiness using existing entities.
 *
 * Does NOT send messages. Does NOT call providers. Does NOT modify records.
 * Does NOT fake completion. Returns truth-based status from linked records.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

// ── Onboarding stage model ──
const ONBOARDING_STAGES = [
  "order_received",
  "client_record_created",
  "onboarding_started",
  "intake_needed",
  "intake_received",
  "install_os_created",
  "automation_checklist_seeded",
  "configuration_in_progress",
  "proof_required",
  "internal_review",
  "client_approval_pending",
  "live",
  "blocked",
];

// ── Service keys for checklist seeding ──
const ACTIVE_SERVICE_KEYS = [
  "instant_lead_response",
  "missed_call_text_back",
  "inbound_sms_assistant",
  "nurture_sequence_14d",
];
const PARKED_SERVICE_KEYS = [
  "ai_booking_agent",    // Phase 3 — skipped by owner
  "review_request",       // parked unless later scope
  "ai_voice_receptionist", // parked unless later scope
];

function safeJsonParse(str, fallback) {
  if (!str || typeof str !== "string") return fallback;
  try { return JSON.parse(str); } catch { return fallback ?? str; }
}

function deriveOnboardingStage(linkage) {
  if (!linkage.order) return "order_received";
  if (!linkage.client) return "client_record_created";
  if (!linkage.onboardingClient) return "onboarding_started";
  const oc = linkage.onboardingClient;
  const missingFields = oc.onboarding_missing_fields || [];
  if (missingFields.length > 0 && (!oc.booking_link && !oc.twilio_number)) return "intake_needed";
  if (!linkage.installOS) return "install_os_created";
  if (!linkage.checklists || linkage.checklists.length === 0) return "automation_checklist_seeded";
  const hasProof = linkage.proofLogs && linkage.proofLogs.length > 0;
  const allChecklistsConfigured = linkage.checklists.every((c) => c.twilio_configured || c.resend_configured || c.lead_form_connected);
  if (!allChecklistsConfigured) return "configuration_in_progress";
  if (!hasProof) return "proof_required";
  const allProofPassed = linkage.proofLogs.every((p) => p.status === "pass");
  if (!allProofPassed) return "internal_review";
  const clientApproved = linkage.checklists.some((c) => c.client_approved);
  if (!clientApproved) return "client_approval_pending";
  const anyLive = linkage.checklists.some((c) => c.went_live_at);
  if (anyLive && allProofPassed && clientApproved) return "live";
  return "internal_review";
}

function gateStatusFromEvidence(hasRecords, hasProof, allPassed, clientApproved, isLive) {
  if (!hasRecords) return "blocked";
  if (isLive && allPassed && clientApproved) return "proof_passed";
  if (hasProof && allPassed) return "ready_for_proof";
  if (hasProof && !allPassed) return "proof_failed";
  if (hasRecords) return "partial";
  return "blocked";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const svc = base44.asServiceRole;

    // ── Fetch all relevant records (read-only) ──
    const [
      orders,
      clients,
      clientProjects,
      onboardingClients,
      installOSRecords,
      portals,
      allChecklists,
      allChecklistSteps,
      allProofLogs,
      existingGates,
    ] = await Promise.all([
      svc.entities.Order.list("", 500).catch(() => []),
      svc.entities.Client.list("", 500).catch(() => []),
      svc.entities.ClientProject.list("", 500).catch(() => []),
      svc.entities.OnboardingClient.list("", 500).catch(() => []),
      svc.entities.ClientInstallationOS.list("", 500).catch(() => []),
      svc.entities.ClientExperiencePortal.list("", 500).catch(() => []),
      svc.entities.AutomationChecklist.list("", 500).catch(() => []),
      svc.entities.AutomationChecklistStep.list("", 500).catch(() => []),
      svc.entities.AutomationProofLog.list("-created_date", 500).catch(() => []),
      svc.entities.LaunchGate.list("", 100).catch(() => []),
    ]);

    const now = new Date().toISOString();

    // ── Build linkage maps ──
    const ordersByEmail = new Map();
    const ordersByClientId = new Map();
    for (const o of (orders || [])) {
      if (o.customer_email) ordersByEmail.set(o.customer_email.toLowerCase().trim(), o);
      if (o.client_id) ordersByClientId.set(o.client_id, o);
    }

    const clientsByEmail = new Map();
    for (const c of (clients || [])) {
      if (c.email) clientsByEmail.set(c.email.toLowerCase().trim(), c);
    }

    const projectsByClientId = new Map();
    const projectsByOrderId = new Map();
    for (const p of (clientProjects || [])) {
      if (p.client_id) projectsByClientId.set(p.client_id, p);
      // Try to find order by client_email match
      if (p.client_email) {
        const order = ordersByEmail.get(p.client_email.toLowerCase().trim());
        if (order) projectsByOrderId.set(order.id, p);
      }
    }

    const onboardingByEmail = new Map();
    const onboardingByOrderId = new Map();
    for (const oc of (onboardingClients || [])) {
      if (oc.email) onboardingByEmail.set(oc.email.toLowerCase().trim(), oc);
      if (oc.order_id) onboardingByOrderId.set(oc.order_id, oc);
    }

    const installOSByOrderId = new Map();
    const installOSByClientId = new Map();
    for (const ios of (installOSRecords || [])) {
      if (ios.order_id) installOSByOrderId.set(ios.order_id, ios);
      if (ios.client_id) installOSByClientId.set(ios.client_id, ios);
    }

    const portalsByClientId = new Map();
    const portalsByOrderId = new Map();
    for (const p of (portals || [])) {
      if (p.client_id) portalsByClientId.set(p.client_id, p);
      if (p.order_id) portalsByOrderId.set(p.order_id, p);
    }

    const checklistsByOrderId = new Map();
    const checklistsByClientId = new Map();
    for (const c of (allChecklists || [])) {
      if (c.order_id) {
        if (!checklistsByOrderId.has(c.order_id)) checklistsByOrderId.set(c.order_id, []);
        checklistsByOrderId.get(c.order_id).push(c);
      }
      if (c.client_id) {
        if (!checklistsByClientId.has(c.client_id)) checklistsByClientId.set(c.client_id, []);
        checklistsByClientId.get(c.client_id).push(c);
      }
    }

    const proofLogsByOrderId = new Map();
    const proofLogsByClientId = new Map();
    for (const p of (allProofLogs || [])) {
      if (p.order_id) {
        if (!proofLogsByOrderId.has(p.order_id)) proofLogsByOrderId.set(p.order_id, []);
        proofLogsByOrderId.get(p.order_id).push(p);
      }
      if (p.client_id) {
        if (!proofLogsByClientId.has(p.client_id)) proofLogsByClientId.set(p.client_id, []);
        proofLogsByClientId.get(p.client_id).push(p);
      }
    }

    // ── Build per-order linkage chains ──
    const chains = [];
    for (const order of (orders || [])) {
      const email = (order.customer_email || "").toLowerCase().trim();
      const client = clientsByEmail.get(email) || (order.client_id ? (clients || []).find((c) => c.id === order.client_id) : null);
      const clientId = client?.id || order.client_id || "";

      const project = projectsByClientId.get(clientId) || projectsByOrderId.get(order.id) || (order.client_project_id ? (clientProjects || []).find((p) => p.id === order.client_project_id) : null);
      const onboardingClient = onboardingByEmail.get(email) || onboardingByOrderId.get(order.id) || (order.onboarding_client_id ? (onboardingClients || []).find((oc) => oc.id === order.onboarding_client_id) : null);
      const installOS = installOSByOrderId.get(order.id) || installOSByClientId.get(clientId) || null;
      const portal = portalsByClientId.get(clientId) || portalsByOrderId.get(order.id) || null;
      const checklists = checklistsByOrderId.get(order.id) || (clientId ? checklistsByClientId.get(clientId) : []) || [];
      const proofLogs = proofLogsByOrderId.get(order.id) || (clientId ? proofLogsByClientId.get(clientId) : []) || [];

      const linkage = { order, client, project, onboardingClient, installOS, portal, checklists, proofLogs };
      const stage = deriveOnboardingStage(linkage);

      chains.push({
        order_id: order.id,
        business_name: order.business_name || client?.business_name || "Unknown",
        customer_email: order.customer_email || "",
        has_order: true,
        has_client: !!client,
        has_project: !!project,
        has_onboarding_client: !!onboardingClient,
        has_install_os: !!installOS,
        has_portal: !!portal,
        has_checklists: checklists.length > 0,
        has_proof_logs: proofLogs.length > 0,
        onboarding_stage: stage,
        checklist_count: checklists.length,
        proof_log_count: proofLogs.length,
        proof_logs_passed: proofLogs.filter((p) => p.status === "pass").length,
        proof_logs_failed: proofLogs.filter((p) => p.status === "fail").length,
        client_approved: checklists.some((c) => c.client_approved),
        any_live: checklists.some((c) => c.went_live_at),
        missing_links: [
          ...(!client ? ["client"] : []),
          ...(!project ? ["project"] : []),
          ...(!onboardingClient ? ["onboarding_client"] : []),
          ...(!installOS ? ["install_os"] : []),
          ...(!portal ? ["portal"] : []),
          ...(checklists.length === 0 ? ["checklists"] : []),
          ...(proofLogs.length === 0 ? ["proof_logs"] : []),
        ],
      });
    }

    // ── Phase 4 aggregate ──
    const totalOrders = (orders || []).length;
    const clientsWithOrders = chains.filter((c) => c.has_client).length;
    const projectsLinked = chains.filter((c) => c.has_project).length;
    const onboardingClientsLinked = chains.filter((c) => c.has_onboarding_client).length;
    const installOSCreated = chains.filter((c) => c.has_install_os).length;
    const checklistsSeeded = chains.filter((c) => c.has_checklists).length;
    const proofLogsExist = chains.filter((c) => c.has_proof_logs).length;

    const phase4ReadinessScore = totalOrders > 0
      ? Math.round((clientsWithOrders + projectsLinked + onboardingClientsLinked + installOSCreated + checklistsSeeded) / (totalOrders * 5) * 100)
      : 0;

    const phase4Blockers = [];
    if (totalOrders > 0) {
      if (clientsWithOrders < totalOrders) phase4Blockers.push(`${totalOrders - clientsWithOrders} order(s) missing linked Client record`);
      if (projectsLinked < totalOrders) phase4Blockers.push(`${totalOrders - projectsLinked} order(s) missing linked ClientProject`);
      if (onboardingClientsLinked < totalOrders) phase4Blockers.push(`${totalOrders - onboardingClientsLinked} order(s) missing OnboardingClient`);
      if (installOSCreated < totalOrders) phase4Blockers.push(`${totalOrders - installOSCreated} order(s) missing ClientInstallationOS`);
      if (checklistsSeeded < totalOrders) phase4Blockers.push(`${totalOrders - checklistsSeeded} order(s) missing AutomationChecklist records`);
    }

    // ── Phase 4 gates ──
    const orderToClientLinkageGateStatus = totalOrders > 0 && clientsWithOrders === totalOrders ? "proof_passed" : "blocked";
    const installOSGateStatus = installOSCreated > 0 ? (installOSCreated === totalOrders ? "proof_passed" : "partial") : "blocked";
    const checklistSeedGateStatus = checklistsSeeded > 0 ? (checklistsSeeded === totalOrders ? "proof_passed" : "partial") : "blocked";
    const onboardingFlowGateStatus = phase4ReadinessScore === 100 ? "proof_passed" : phase4ReadinessScore > 0 ? "partial" : "blocked";

    // ── Phase 5 aggregate ──
    const totalPortals = (portals || []).length;
    const portalsActive = (portals || []).filter((p) => p.portal_status === "active").length;
    const portalsAccessEnabled = (portals || []).filter((p) => p.portal_access_enabled).length;
    const portalsWithLinkedProject = (portals || []).filter((p) => {
      return p.client_id && (clients || []).some((c) => c.id === p.client_id);
    }).length;
    const portalsWithInstallOS = (portals || []).filter((p) => {
      return p.client_id && (installOSRecords || []).some((ios) => ios.client_id === p.client_id);
    }).length;
    const portalsSafeToRender = (portals || []).filter((p) => {
      return p.portal_access_enabled && p.client_id && p.business_name;
    }).length;

    const phase5Blockers = [];
    if (totalPortals === 0) phase5Blockers.push("No ClientExperiencePortal records exist");
    if (totalPortals > 0 && portalsAccessEnabled < totalPortals) phase5Blockers.push(`${totalPortals - portalsAccessEnabled} portal(s) have access disabled`);
    if (totalPortals > 0 && portalsWithLinkedProject < totalPortals) phase5Blockers.push(`${totalPortals - portalsWithLinkedProject} portal(s) missing linked client/project`);
    if (totalPortals > 0 && portalsWithInstallOS < totalPortals) phase5Blockers.push(`${totalPortals - portalsWithInstallOS} portal(s) missing linked Install OS`);

    // ── Phase 5 gates ──
    const clientPortalGateStatus = totalPortals === 0 ? "blocked" : portalsSafeToRender === totalPortals ? "proof_passed" : "partial";
    const clientStatusUpdatesGateStatus = totalPortals === 0 ? "blocked" : portalsWithInstallOS > 0 ? "partial" : "blocked";
    const clientExperienceTruthGateStatus = totalPortals === 0 ? "blocked" : portalsSafeToRender > 0 ? "partial" : "blocked";

    // ── Phase 3 parked warning ──
    const phase3Parked = {
      service_key: "ai_booking_agent",
      status: "parked",
      reason: "Skipped by owner — booking conversion proof incomplete",
      impact: "Full platform cannot be 100% complete until booking conversion is addressed",
      booking_flow_gate: "parked",
    };

    // ── Checklist seed coverage ──
    const checklistCoverage = {};
    for (const sk of [...ACTIVE_SERVICE_KEYS, ...PARKED_SERVICE_KEYS]) {
      const count = (allChecklists || []).filter((c) => c.service_key === sk).length;
      const active = (allChecklists || []).filter((c) => c.service_key === sk && c.status === "active").length;
      const proofPassed = (allProofLogs || []).filter((p) => p.service_key === sk && p.status === "pass").length;
      const isParked = PARKED_SERVICE_KEYS.includes(sk);
      checklistCoverage[sk] = {
        total: count,
        active,
        proof_passed: proofPassed,
        parked: isParked,
      };
    }

    // ── Existing gates check ──
    const gateKeys = [
      "client_onboarding_flow_gate",
      "install_os_gate",
      "automation_checklist_seed_gate",
      "order_to_client_linkage_gate",
      "client_portal_gate",
      "client_status_updates_gate",
      "client_experience_truth_gate",
      "booking_flow_gate",
    ];
    const existingGateKeys = new Set((existingGates || []).map((g) => g.gate_key));

    // ── Determine combined status ──
    const phase4Complete = phase4ReadinessScore === 100 && phase4Blockers.length === 0;
    const phase5Complete = totalPortals > 0 && portalsSafeToRender === totalPortals && phase5Blockers.length === 0;
    const fullPlatform100 = phase4Complete && phase5Complete && false; // Always false until Phase 3 addressed

    return Response.json({
      success: true,
      checked_at: now,
      no_provider_calls: true,
      no_records_modified: true,
      phase_3_parked: phase3Parked,
      phase_4: {
        total_orders: totalOrders,
        clients_linked: clientsWithOrders,
        projects_linked: projectsLinked,
        onboarding_clients_linked: onboardingClientsLinked,
        install_os_created: installOSCreated,
        checklists_seeded: checklistsSeeded,
        proof_logs_exist: proofLogsExist,
        readiness_score: phase4ReadinessScore,
        onboarding_stage_distribution: ONBOARDING_STAGES.reduce((acc, stage) => {
          acc[stage] = chains.filter((c) => c.onboarding_stage === stage).length;
          return acc;
        }, {}),
        blockers: phase4Blockers,
        gates: {
          order_to_client_linkage_gate: orderToClientLinkageGateStatus,
          install_os_gate: installOSGateStatus,
          automation_checklist_seed_gate: checklistSeedGateStatus,
          client_onboarding_flow_gate: onboardingFlowGateStatus,
        },
        complete: phase4Complete,
        next_action: phase4Blockers.length > 0
          ? `Repair missing links: ${phase4Blockers[0]}`
          : "Phase 4 structure complete — proceed to proof generation",
      },
      phase_5: {
        total_portals: totalPortals,
        portals_active: portalsActive,
        portals_access_enabled: portalsAccessEnabled,
        portals_with_linked_project: portalsWithLinkedProject,
        portals_with_install_os: portalsWithInstallOS,
        portals_safe_to_render: portalsSafeToRender,
        blockers: phase5Blockers,
        gates: {
          client_portal_gate: clientPortalGateStatus,
          client_status_updates_gate: clientStatusUpdatesGateStatus,
          client_experience_truth_gate: clientExperienceTruthGateStatus,
        },
        complete: phase5Complete,
        next_action: phase5Blockers.length > 0
          ? `Repair portal gaps: ${phase5Blockers[0]}`
          : "Phase 5 portal infrastructure ready — proceed to safe render proof",
      },
      checklist_coverage: checklistCoverage,
      chains: chains.slice(0, 20),
      full_platform_100_percent: fullPlatform100,
      full_platform_impact: "Full platform cannot show 100% until Phase 3 (AI Booking Agent) booking conversion proof is addressed",
      gates_needing_creation: gateKeys.filter((k) => !existingGateKeys.has(k)),
    });
  } catch (error) {
    console.error("[getPhase4And5Readiness] error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});