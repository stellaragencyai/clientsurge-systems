/**
 * PortalStateEngine — Phase 3.5 Complete Deployment Source-of-Truth Migration
 *
 * Pure normalization layer that converts raw portal context data into
 * proof-validated, environment-filtered, client-safe card states.
 *
 * Every card produces:
 *   { status, display_text, admin_diagnostics, proof_metadata,
 *     source_of_truth, deployment_id, module_key, proof_status, last_verified }
 *
 * Statuses:
 *   Live          — proof exists, fresh (<24h), production environment
 *   NeedsProof    — data exists but no proof log within freshness window
 *   Blocked       — blocking condition (failed events, missing links)
 *   SetupRequired — onboarding/quick-start not complete
 *   Syncing       — data stale or environment unknown
 *
 * Source-of-truth fallback hierarchy (Phase 3.5):
 *   1. ClientDeployment (activated_modules + module_installation_status)
 *   2. AutomationProofLog
 *   3. AutomationExecutionLog
 *   4. Legacy order.services (only if deployment unavailable)
 */

import {
  DEPLOYMENT_MODULE_MAP,
  isModuleActivated,
  getModuleInstallStatus,
  isModuleReady,
  isModuleFailed,
  findLatestExecutionLog,
  resolveModuleAvailability,
} from "@/lib/deploymentModuleMap";

// ── Constants ──────────────────────────────────────────────
const PROOF_FRESHNESS_HOURS = 24;
const STALE_THRESHOLD_HOURS = 168; // 7 days

const PRODUCTION_ENVS = new Set(["production"]);
const TRUSTED_SCOPE = new Set(["scoped"]);

// Words/phrases that must NEVER appear client-facing
const FORBIDDEN_TERMS = [
  "smoke", "internal", "test_record", "test record", "dead_letter", "dead letter",
  "stack_trace", "stack trace", "dashboard_truth_status", "unknown environment",
  "raw provider error", "undefined", "[object Object]", "null reference",
  "tenant_scope_status", "system_internal", "missing_client_id",
];

// ── Status enum ────────────────────────────────────────────
export const CARD_STATUS = {
  LIVE: "Live",
  NEEDS_PROOF: "NeedsProof",
  BLOCKED: "Blocked",
  SETUP_REQUIRED: "SetupRequired",
  SYNCING: "Syncing",
};

// ── Environment Filtering ─────────────────────────────────

export function filterProductionOnly(records) {
  if (!Array.isArray(records)) return [];
  return records.filter((r) => {
    if (!r) return false;
    const env = (r.environment || "").toLowerCase();
    const scope = (r.tenant_scope_status || "").toLowerCase();
    return PRODUCTION_ENVS.has(env) || TRUSTED_SCOPE.has(scope);
  });
}

export function isProductionTrusted(record) {
  if (!record) return false;
  const env = (record.environment || "").toLowerCase();
  const scope = (record.tenant_scope_status || "").toLowerCase();
  return PRODUCTION_ENVS.has(env) || TRUSTED_SCOPE.has(scope);
}

// ── Safe Language ─────────────────────────────────────────

export function sanitizeClientText(raw) {
  if (!raw || typeof raw !== "string") return "";
  let clean = raw;
  const replacements = {
    "dead_letter": "blocked",
    "dead letter": "blocked",
    "smoke": "system",
    "test_record": "sample",
    "test record": "sample",
    "stack_trace": "error detail",
    "stack trace": "error detail",
    "dashboard_truth_status": "status",
    "unknown environment": "pending setup",
    "tenant_scope_status": "status",
    "system_internal": "system",
    "missing_client_id": "pending setup",
    "raw provider error": "service unavailable",
  };
  for (const [bad, good] of Object.entries(replacements)) {
    clean = clean.replace(new RegExp(bad, "gi"), good);
  }
  for (const term of FORBIDDEN_TERMS) {
    if (clean.toLowerCase().includes(term.toLowerCase())) {
      clean = clean.replace(new RegExp(term, "gi"), "—");
    }
  }
  return clean.trim();
}

// ── Proof Freshness ───────────────────────────────────────

function findLatestProof(proofLogs, serviceKey) {
  if (!Array.isArray(proofLogs) || !serviceKey) return null;
  const matching = proofLogs
    .filter((p) => p?.service_key === serviceKey && p?.status === "pass")
    .sort((a, b) => new Date(b.tested_at || 0) - new Date(a.tested_at || 0));
  if (matching.length === 0) return null;
  const proof = matching[0];
  const testedAt = proof.tested_at ? new Date(proof.tested_at) : null;
  if (!testedAt || isNaN(testedAt.getTime())) {
    return { proof, isFresh: false, isStale: false, ageHours: null };
  }
  const ageHours = (Date.now() - testedAt.getTime()) / (1000 * 60 * 60);
  return {
    proof,
    isFresh: ageHours <= PROOF_FRESHNESS_HOURS,
    isStale: ageHours > STALE_THRESHOLD_HOURS,
    ageHours,
    testedAt: testedAt.toISOString(),
  };
}

function buildProofMetadata(proofResult, fallbackEnv) {
  if (!proofResult) {
    return {
      has_proof: false,
      last_verified: null,
      proof_log_id: null,
      environment: fallbackEnv || "unknown",
      freshness: "none",
    };
  }
  return {
    has_proof: true,
    last_verified: proofResult.testedAt,
    proof_log_id: proofResult.proof?.id || null,
    environment: fallbackEnv || "unknown",
    freshness: proofResult.isFresh ? "fresh" : proofResult.isStale ? "stale" : "expired",
  };
}

// ── Phase 3.5: Unified Proof Resolver ─────────────────────

/**
 * Resolve proof for a module using the fallback hierarchy:
 *   1. AutomationProofLog (priority 2)
 *   2. AutomationExecutionLog (priority 3, only if completed)
 *
 * @param {Array} proofLogs - AutomationProofLog records
 * @param {Array} executionLogs - AutomationExecutionLog records
 * @param {string} moduleKey - canonical module key
 * @returns {object|null} - proof result with source field
 */
function resolveProof(proofLogs, executionLogs, moduleKey) {
  const config = DEPLOYMENT_MODULE_MAP[moduleKey];
  if (!config) return null;

  // Priority 2: AutomationProofLog
  const proofResult = findLatestProof(proofLogs, config.proof_service_key);
  if (proofResult) {
    return { ...proofResult, source: "proof_log" };
  }

  // Priority 3: AutomationExecutionLog (only if completed successfully)
  const execResult = findLatestExecutionLog(executionLogs, moduleKey);
  if (execResult && execResult.execution_status === "completed") {
    const completedAt = execResult.completed_at
      ? new Date(execResult.completed_at)
      : null;
    if (completedAt && !isNaN(completedAt.getTime())) {
      const ageHours = (Date.now() - completedAt.getTime()) / (1000 * 60 * 60);
      return {
        proof: { id: execResult.log?.id, status: "pass" },
        isFresh: ageHours <= PROOF_FRESHNESS_HOURS,
        isStale: ageHours > STALE_THRESHOLD_HOURS,
        ageHours,
        testedAt: completedAt.toISOString(),
        source: "execution_log",
      };
    }
  }

  return null;
}

// ── Card State Builder ────────────────────────────────────

/**
 * Build a normalized card state with Phase 3.5 source-of-truth metadata.
 */
function buildCardState({
  cardKey,
  liveText,
  needsProofText,
  blockedText,
  setupText,
  syncingText,
  proofResult,
  envTrust,
  setupComplete,
  hasBlockingCondition,
  adminDetail,
  moduleKey = null,
  deployment = null,
  executionLog = null,
  sourceOfTruth = "none",
}) {
  const proofMetadata = buildProofMetadata(proofResult, envTrust);

  let status, displayText, adminDiagnostics;

  if (hasBlockingCondition) {
    status = CARD_STATUS.BLOCKED;
    displayText = sanitizeClientText(blockedText);
    adminDiagnostics = `${cardKey}: Blocked — ${adminDetail || "blocking condition detected"}`;
  } else if (!setupComplete) {
    status = CARD_STATUS.SETUP_REQUIRED;
    displayText = sanitizeClientText(setupText);
    adminDiagnostics = `${cardKey}: SetupRequired — onboarding/quick-start incomplete`;
  } else if (envTrust !== "production") {
    status = CARD_STATUS.SYNCING;
    displayText = sanitizeClientText(syncingText);
    adminDiagnostics = `${cardKey}: Syncing — environment is ${envTrust}, not production-trusted`;
  } else if (!proofResult) {
    status = CARD_STATUS.NEEDS_PROOF;
    displayText = sanitizeClientText(needsProofText);
    adminDiagnostics = `${cardKey}: NeedsProof — no passing proof found`;
  } else if (!proofResult.isFresh) {
    status = CARD_STATUS.SYNCING;
    displayText = sanitizeClientText(syncingText);
    const age = proofResult.ageHours ? `${Math.round(proofResult.ageHours)}h old` : "stale";
    adminDiagnostics = `${cardKey}: Syncing — proof is ${age} (exceeds ${PROOF_FRESHNESS_HOURS}h freshness window)`;
  } else {
    status = CARD_STATUS.LIVE;
    displayText = sanitizeClientText(liveText);
    adminDiagnostics = `${cardKey}: Live — proof verified at ${proofResult.testedAt}`;
  }

  // Resolve source_of_truth
  let resolvedSource = sourceOfTruth;
  if (deployment && moduleKey) {
    resolvedSource = "deployment";
  } else if (proofResult?.source === "proof_log") {
    resolvedSource = "proof_log";
  } else if (proofResult?.source === "execution_log") {
    resolvedSource = "execution_log";
  } else if (sourceOfTruth !== "none") {
    resolvedSource = sourceOfTruth;
  }

  return {
    card_key: cardKey,
    status,
    display_text: displayText,
    admin_diagnostics: adminDiagnostics,
    proof_metadata: proofMetadata,
    // Phase 3.5: Source-of-truth metadata
    source_of_truth: resolvedSource,
    deployment_id: deployment?.id || null,
    module_key: moduleKey,
    proof_status: proofResult?.proof?.status ||
      (executionLog ? executionLog.execution_status : null),
    last_verified: proofResult?.testedAt || executionLog?.completed_at || null,
  };
}

// ── Phase 3.5: Module Card Builder ────────────────────────

/**
 * Build a capability card using deployment-first resolution.
 *
 * Truth rules (Phase 3.5):
 *   - Blocked if deployment is paused OR module status is "failed"
 *   - SetupRequired if module not activated OR not verified in deployment
 *   - NeedsProof if module is ready but no proof/execution log exists
 *   - Live only when: module enabled AND proof exists AND proof is fresh
 *
 * @param {object} opts
 * @param {string} opts.moduleKey - canonical module key
 * @param {object|null} opts.deployment
 * @param {Array} opts.services - legacy order.services (fallback)
 * @param {Array} opts.proofLogs
 * @param {Array} opts.executionLogs
 * @param {object} opts.envTrust
 * @param {boolean} opts.hasBlockingCondition - global blocking condition
 * @param {boolean} opts.isPaused - deployment is paused
 * @param {object} opts.texts - { liveText, needsProofText, blockedText, setupText, syncingText }
 * @param {string} opts.cardKey - card key override (defaults to portal_card from map)
 */
function buildModuleCard({
  moduleKey,
  deployment,
  services,
  proofLogs,
  executionLogs,
  envTrust,
  hasBlockingCondition: globalBlocking,
  isPaused,
  texts,
  cardKey,
}) {
  const config = DEPLOYMENT_MODULE_MAP[moduleKey];
  if (!config) {
    return buildCardState({
      cardKey: cardKey || moduleKey,
      ...texts,
      proofResult: null,
      envTrust,
      setupComplete: false,
      hasBlockingCondition: true,
      adminDetail: `Unknown module key: ${moduleKey}`,
    });
  }

  const resolvedCardKey = cardKey || config.portal_card;

  // Resolve module availability (deployment first, legacy fallback)
  const availability = resolveModuleAvailability(deployment, services, moduleKey);

  // Resolve proof (proof log first, execution log fallback)
  const proofResult = resolveProof(proofLogs, executionLogs, moduleKey);
  const execLog = findLatestExecutionLog(executionLogs, moduleKey);

  // Determine blocking conditions
  const moduleFailed = deployment
    ? isModuleFailed(deployment, moduleKey)
    : false;
  const isBlocked = isPaused || moduleFailed || (availability.installStatus === "failed");

  // Determine setup completion
  // Module is "setup complete" when:
  //   - Deployment exists: module is activated AND installation status is ready
  //   - No deployment (legacy): module service exists with non-Paid status
  let moduleSetupComplete;
  if (deployment) {
    moduleSetupComplete = availability.isAvailable && isModuleReady(deployment, moduleKey);
  } else {
    moduleSetupComplete = availability.isAvailable;
  }

  return buildCardState({
    cardKey: resolvedCardKey,
    liveText: texts.liveText,
    needsProofText: texts.needsProofText,
    blockedText: isPaused
      ? "This automation is paused. Contact support to resume."
      : texts.blockedText,
    setupText: texts.setupText,
    syncingText: texts.syncingText,
    proofResult,
    envTrust,
    setupComplete: moduleSetupComplete,
    hasBlockingCondition: isBlocked || globalBlocking,
    adminDetail: isPaused
      ? "Deployment is paused"
      : moduleFailed
        ? `Module '${moduleKey}' installation status is 'failed'`
        : availability.source === "deployment" && !availability.isAvailable
          ? `Module '${moduleKey}' not in activated_modules for this deployment`
          : null,
    moduleKey,
    deployment,
    executionLog: execLog,
    sourceOfTruth: availability.source,
  });
}

// ── Main Engine: normalizePortalState ─────────────────────

/**
 * Main entry point. Takes raw portal context + proof logs + execution logs
 * and returns a normalized portal state object with card-level trust statuses.
 *
 * @param {object} rawContext - from getClientPortalContext
 * @param {Array} proofLogs - AutomationProofLog records (already scoped)
 * @param {Array} executionLogs - AutomationExecutionLog records (already scoped)
 * @returns {object} normalized portal state
 */
export function normalizePortalState(rawContext, proofLogs = [], executionLogs = []) {
  const ctx = rawContext || {};
  const project = ctx.project || null;
  const order = ctx.order || null;
  const subscription = ctx.subscription || null;
  const health = ctx.health || null;
  const deployment = ctx.deployment || null;

  // ── Environment trust ──
  const envTrust = isProductionTrusted(order) || isProductionTrusted(project) ||
    (deployment && ["live", "ready", "onboarding", "configuring", "testing"].includes(deployment.deployment_status))
    ? "production"
    : "unknown";

  // ── Setup completion (global) ──
  const deploymentSetupComplete = deployment
    ? ["live", "ready", "testing"].includes(deployment.deployment_status)
    : false;
  const setupComplete =
    deploymentSetupComplete ||
    (project?.quick_start_completed === true &&
      project?.onboarding_wizard_completed === true) ||
    (order?.services || []).every((s) => s.install_status === "Live");

  // ── Deployment state ──
  const isPaused = deployment?.deployment_status === "paused";
  const deploymentIsBlocked = deployment && ["paused", "error", "cancelled"].includes(deployment.deployment_status);
  const deploymentIsLive = deployment?.deployment_status === "live";

  // ── Event filtering ──
  const rawEvents = filterProductionOnly(health?.recent_events || []);
  const failedEvents = rawEvents.filter(
    (e) => e.status === "failed" && !(e.event_type || "").includes("portal_login")
  );
  const hasGlobalBlockingCondition = failedEvents.length > 0 && !ctx.is_admin_preview;

  // ── Services (legacy fallback) ──
  const services = (order?.services || []).filter((s) => s != null);

  // ── Card: System Readiness ──
  const allServicesLive = services.length > 0 && services.every((s) => s.install_status === "Live");
  const systemReadinessProof = (allServicesLive || deploymentIsLive)
    ? resolveProof(proofLogs, executionLogs, "instant_lead_response")
    : null;

  const systemReadiness = buildCardState({
    cardKey: "system_readiness",
    liveText: "Your system is live and running.",
    needsProofText: "We're verifying your system before it goes live.",
    blockedText: deploymentIsBlocked
      ? `Your system is currently ${deployment.deployment_status === "paused" ? "paused" : "needs review"}. Our team is on it.`
      : "Your system needs attention. Our team is on it.",
    setupText: "Setup is in progress. Complete your Quick Start to activate.",
    syncingText: "Your system is syncing. Check back shortly.",
    proofResult: systemReadinessProof,
    envTrust,
    setupComplete: (deployment ? deploymentSetupComplete : false) || setupComplete || allServicesLive,
    hasBlockingCondition: deploymentIsBlocked || hasGlobalBlockingCondition,
    adminDetail: deploymentIsBlocked
      ? `Deployment status '${deployment.deployment_status}' blocks execution`
      : (failedEvents.length > 0 ? `${failedEvents.length} recent failed events` : null),
    moduleKey: "instant_lead_response",
    deployment,
    sourceOfTruth: deployment ? "deployment" : "legacy",
  });

  // ── Card: Installation Progress ──
  const installationProof = services.some((s) => s.install_status === "Live") || deploymentIsLive
    ? resolveProof(proofLogs, executionLogs, "instant_lead_response")
    : null;

  const installationProgress = buildCardState({
    cardKey: "installation_progress",
    liveText: "All services are installed and active.",
    needsProofText: "Installation is being verified.",
    blockedText: "Installation encountered an issue. Our team is resolving it.",
    setupText: "Your system is being set up. Complete onboarding to continue.",
    syncingText: "Installation status is syncing.",
    proofResult: installationProof,
    envTrust,
    setupComplete: services.length > 0 && services.every((s) => s.install_status !== "Paid" && s.install_status !== "Ready for Install"),
    hasBlockingCondition: false,
    adminDetail: null,
    moduleKey: "instant_lead_response",
    deployment,
    sourceOfTruth: deployment ? "deployment" : "legacy",
  });

  // ── Card: Automation Health ──
  const automationProof = resolveProof(proofLogs, executionLogs, "instant_lead_response") ||
    resolveProof(proofLogs, executionLogs, "missed_call_text_back");
  const automationHealth = buildCardState({
    cardKey: "automation_health",
    liveText: "Your automations are running smoothly.",
    needsProofText: "We're verifying your automations are working correctly.",
    blockedText: "Some automations need attention. Our team is working on it.",
    setupText: "Automations will activate after setup is complete.",
    syncingText: "Automation status is syncing.",
    proofResult: automationProof,
    envTrust,
    setupComplete,
    hasBlockingCondition: hasGlobalBlockingCondition,
    adminDetail: failedEvents.length > 0 ? `${failedEvents.length} failed automation events` : null,
    deployment,
    sourceOfTruth: deployment ? "deployment" : "legacy",
  });

  // ── Card: Lead Capture (Phase 2 migration) ──
  const leadCapture = buildModuleCard({
    moduleKey: "instant_lead_response",
    deployment,
    services,
    proofLogs,
    executionLogs,
    envTrust,
    hasBlockingCondition: hasGlobalBlockingCondition,
    isPaused,
    cardKey: "lead_capture",
    texts: {
      liveText: "Lead capture is active and ready.",
      needsProofText: "Waiting for your first verified lead.",
      blockedText: "Lead capture needs attention. Our team is on it.",
      setupText: "Lead capture will activate after setup is complete.",
      syncingText: "Lead data is syncing.",
    },
  });

  // ── Card: Missed Call Text-Back ──
  const missedCallTextBack = buildModuleCard({
    moduleKey: "missed_call_text_back",
    deployment,
    services,
    proofLogs,
    executionLogs,
    envTrust,
    hasBlockingCondition: false,
    isPaused,
    texts: {
      liveText: "Missed call text-back is active.",
      needsProofText: "Missed call text-back is being verified.",
      blockedText: "Missed call text-back needs attention.",
      setupText: "Missed call text-back will activate after setup.",
      syncingText: "Missed call text-back is syncing.",
    },
  });

  // ── Card: AI Booking Agent (Phase 3 migration) ──
  const aiBookingAgent = buildModuleCard({
    moduleKey: "ai_booking_agent",
    deployment,
    services,
    proofLogs,
    executionLogs,
    envTrust,
    hasBlockingCondition: false,
    isPaused,
    texts: {
      liveText: "AI booking agent is active.",
      needsProofText: "AI booking agent is being verified.",
      blockedText: "AI booking agent needs attention.",
      setupText: "AI booking agent will activate after setup.",
      syncingText: "AI booking agent is syncing.",
    },
  });

  // ── Card: AI Voice Agent (Phase 3 migration) ──
  const aiVoiceAgent = buildModuleCard({
    moduleKey: "ai_voice_receptionist",
    deployment,
    services,
    proofLogs,
    executionLogs,
    envTrust,
    hasBlockingCondition: false,
    isPaused,
    texts: {
      liveText: "AI voice agent is active.",
      needsProofText: "AI voice agent is being verified.",
      blockedText: "AI voice agent needs attention.",
      setupText: "AI voice agent will activate after setup.",
      syncingText: "AI voice agent is syncing.",
    },
  });

  // ── Card: Nurture Sequence (Phase 4 migration) ──
  const nurtureSequence = buildModuleCard({
    moduleKey: "nurture_sequence_14d",
    deployment,
    services,
    proofLogs,
    executionLogs,
    envTrust,
    hasBlockingCondition: false,
    isPaused,
    texts: {
      liveText: "Nurture sequence is active.",
      needsProofText: "Nurture sequence is being verified.",
      blockedText: "Nurture sequence needs attention.",
      setupText: "Nurture sequence will activate after setup.",
      syncingText: "Nurture sequence is syncing.",
    },
  });

  // ── Card: Daily Digest (Phase 4 migration) ──
  const dailyDigest = buildModuleCard({
    moduleKey: "daily_digest",
    deployment,
    services,
    proofLogs,
    executionLogs,
    envTrust,
    hasBlockingCondition: false,
    isPaused,
    texts: {
      liveText: "Daily digest is active.",
      needsProofText: "Daily digest is being verified.",
      blockedText: "Daily digest needs attention.",
      setupText: "Daily digest will activate after setup.",
      syncingText: "Daily digest is syncing.",
    },
  });

  // ── Card: Lead Reactivation (Phase 5 migration) ──
  const leadReactivation = buildModuleCard({
    moduleKey: "lead_reactivation",
    deployment,
    services,
    proofLogs,
    executionLogs,
    envTrust,
    hasBlockingCondition: false,
    isPaused,
    texts: {
      liveText: "Lead reactivation is active.",
      needsProofText: "Lead reactivation is being verified.",
      blockedText: "Lead reactivation needs attention.",
      setupText: "Lead reactivation will activate after setup.",
      syncingText: "Lead reactivation is syncing.",
    },
  });

  // ── Card: Review Request (Phase 5 migration) ──
  const reviewRequest = buildModuleCard({
    moduleKey: "review_request",
    deployment,
    services,
    proofLogs,
    executionLogs,
    envTrust,
    hasBlockingCondition: false,
    isPaused,
    texts: {
      liveText: "Review request automation is active.",
      needsProofText: "Review request automation is being verified.",
      blockedText: "Review request automation needs attention.",
      setupText: "Review request automation will activate after setup.",
      syncingText: "Review request automation is syncing.",
    },
  });

  // ── Card: ROI / Revenue Impact ──
  const roiProof = (allServicesLive || deploymentIsLive)
    ? systemReadinessProof
    : null;
  const roiImpact = buildCardState({
    cardKey: "roi_revenue_impact",
    liveText: "Revenue tracking is active.",
    needsProofText: "Revenue impact data will appear after your first verified lead.",
    blockedText: "Revenue tracking is temporarily unavailable.",
    setupText: "Revenue tracking will begin after your system goes live.",
    syncingText: "Revenue data is syncing.",
    proofResult: roiProof,
    envTrust,
    setupComplete: setupComplete && (allServicesLive || deploymentIsLive),
    hasBlockingCondition: hasGlobalBlockingCondition,
    adminDetail: null,
    deployment,
    sourceOfTruth: deployment ? "deployment" : "legacy",
  });

  // ── Card: Billing (Phase 6 migration) ──
  // Truth states: active subscription → "Your plan is active"
  //              payment issue → "Action required"
  //              cancelled → "Plan inactive"
  const subStatus = (subscription?.status || "").toLowerCase();
  const billingActive = subStatus === "active" || subStatus === "trialing";
  const billingPaymentIssue = ["past_due", "unpaid", "incomplete"].includes(subStatus);
  const billingCancelled = ["canceled", "cancelled", "incomplete_expired"].includes(subStatus);
  const deploymentCancelled = deployment?.deployment_status === "cancelled";

  const billing = buildCardState({
    cardKey: "billing",
    liveText: "Your plan is active.",
    needsProofText: "Billing is being set up.",
    blockedText: billingPaymentIssue ? "Action required — please update your payment method." : "Billing is temporarily unavailable.",
    setupText: "Billing will be available after checkout is complete.",
    syncingText: "Billing information is syncing.",
    proofResult: billingActive
      ? { proof: { id: "subscription" }, isFresh: true, isStale: false, testedAt: new Date().toISOString(), source: "proof_log" }
      : null,
    envTrust: "production",
    setupComplete: !!subscription,
    hasBlockingCondition: billingPaymentIssue || billingCancelled || deploymentCancelled,
    adminDetail: billingPaymentIssue
      ? `Subscription status: ${subStatus} — payment action required`
      : billingCancelled
        ? `Subscription status: ${subStatus} — plan inactive`
        : deploymentCancelled
          ? "Deployment status: cancelled"
          : null,
    deployment,
    sourceOfTruth: "deployment",
  });

  // ── Card: Website Scan ──
  const websiteScan = buildCardState({
    cardKey: "website_scan",
    liveText: "Website intelligence scan complete.",
    needsProofText: "Website scan is pending.",
    blockedText: "Website scan is temporarily unavailable.",
    setupText: "Website scan will run after setup is complete.",
    syncingText: "Website scan is syncing.",
    proofResult: null,
    envTrust,
    setupComplete,
    hasBlockingCondition: false,
    adminDetail: "No WebsiteIntelligenceScan proof log found",
    deployment,
    sourceOfTruth: deployment ? "deployment" : "none",
  });

  // ── Card: Timeline ──
  const timeline = buildCardState({
    cardKey: "timeline",
    liveText: "Your project timeline is up to date.",
    needsProofText: "Timeline is being populated.",
    blockedText: "Timeline is temporarily unavailable.",
    setupText: "Timeline will appear as your project progresses.",
    syncingText: "Timeline is syncing.",
    proofResult: null,
    envTrust,
    setupComplete: !!order,
    hasBlockingCondition: false,
    adminDetail: "Timeline derived from order/project events",
    deployment,
    sourceOfTruth: deployment ? "deployment" : "legacy",
  });

  // ── Card: Activity Log ──
  const activityLog = buildCardState({
    cardKey: "activity_log",
    liveText: "Activity log is up to date.",
    needsProofText: "No activity yet. Your log will appear here as leads come in.",
    blockedText: "Activity log is temporarily unavailable.",
    setupText: "Activity will appear after your system is live.",
    syncingText: "Activity log is syncing.",
    proofResult: rawEvents.length > 0
      ? { proof: { id: "events" }, isFresh: true, isStale: false, testedAt: new Date().toISOString(), source: "execution_log" }
      : null,
    envTrust,
    setupComplete,
    hasBlockingCondition: false,
    adminDetail: `${rawEvents.length} production-trusted events available`,
    deployment,
    sourceOfTruth: deployment ? "deployment" : "legacy",
  });

  // ── Card: Support ──
  const support = buildCardState({
    cardKey: "support",
    liveText: "Support is available.",
    needsProofText: "Support is available.",
    blockedText: "Support is temporarily unavailable.",
    setupText: "Support is available — reach out anytime.",
    syncingText: "Support is available.",
    proofResult: { proof: { id: "always" }, isFresh: true, isStale: false, testedAt: new Date().toISOString(), source: "proof_log" },
    envTrust: "production",
    setupComplete: true,
    hasBlockingCondition: false,
    adminDetail: "Support card is always available",
    sourceOfTruth: "none",
  });

  // ── Card: Reports ──
  const reports = buildCardState({
    cardKey: "reports",
    liveText: "Weekly reports are available.",
    needsProofText: "Reports will appear after your system is live.",
    blockedText: "Reports are temporarily unavailable.",
    setupText: "Reports will be generated after setup is complete.",
    syncingText: "Reports are syncing.",
    proofResult: null,
    envTrust,
    setupComplete: setupComplete && (allServicesLive || deploymentIsLive),
    hasBlockingCondition: false,
    adminDetail: "No weekly report proof found",
    deployment,
    sourceOfTruth: deployment ? "deployment" : "legacy",
  });

  // ── Card: Documents ──
  const documents = buildCardState({
    cardKey: "documents",
    liveText: "Your documents are available.",
    needsProofText: "No documents uploaded yet.",
    blockedText: "Documents are temporarily unavailable.",
    setupText: "Documents will be available as your project progresses.",
    syncingText: "Documents are syncing.",
    proofResult: null,
    envTrust,
    setupComplete: !!project,
    hasBlockingCondition: false,
    adminDetail: "No document proof found",
    deployment,
    sourceOfTruth: deployment ? "deployment" : "legacy",
  });

  // ── Card: Recommendations ──
  const recommendations = buildCardState({
    cardKey: "recommendations",
    liveText: "Personalized recommendations are available.",
    needsProofText: "Recommendations will appear after your system is live.",
    blockedText: "Recommendations are temporarily unavailable.",
    setupText: "Recommendations will be generated after setup.",
    syncingText: "Recommendations are syncing.",
    proofResult: null,
    envTrust,
    setupComplete: setupComplete && (allServicesLive || deploymentIsLive),
    hasBlockingCondition: false,
    adminDetail: "No recommendation proof found",
    deployment,
    sourceOfTruth: deployment ? "deployment" : "legacy",
  });

  // ── Assemble normalized state ──
  return {
    meta: {
      generated_at: new Date().toISOString(),
      env_trust: envTrust,
      setup_complete: setupComplete,
      has_blocking_condition: hasGlobalBlockingCondition,
      proof_logs_count: proofLogs.length,
      execution_logs_count: executionLogs.length,
      production_events_count: rawEvents.length,
      is_admin_preview: ctx.is_admin_preview || false,
      // Phase 3.5: Deployment source-of-truth metadata
      has_deployment: !!deployment,
      deployment_id: deployment?.id || null,
      deployment_status: deployment?.deployment_status || null,
      deployment_package_tier: deployment?.package_tier_key || null,
      deployment_industry: deployment?.industry_slug || null,
      deployment_is_paused: isPaused,
      deployment_activated_modules: deployment?.activated_modules || [],
      source_of_truth: deployment ? "deployment" : "legacy",
    },
    cards: {
      system_readiness: systemReadiness,
      installation_progress: installationProgress,
      automation_health: automationHealth,
      lead_capture: leadCapture,
      missed_call_text_back: missedCallTextBack,
      ai_booking_agent: aiBookingAgent,
      nurture_sequence: nurtureSequence,
      ai_voice_agent: aiVoiceAgent,
      daily_digest: dailyDigest,
      lead_reactivation: leadReactivation,
      review_request: reviewRequest,
      roi_revenue_impact: roiImpact,
      billing: billing,
      website_scan: websiteScan,
      timeline: timeline,
      activity_log: activityLog,
      support: support,
      reports: reports,
      documents: documents,
      recommendations: recommendations,
    },
  };
}

// ── Helper: get card by key safely ───────────────────────

export function getCardState(portalState, cardKey) {
  if (!portalState?.cards) {
    return {
      card_key: cardKey,
      status: CARD_STATUS.BLOCKED,
      display_text: "This section is temporarily unavailable.",
      admin_diagnostics: "Portal state not loaded",
      proof_metadata: { has_proof: false, last_verified: null, proof_log_id: null, environment: "unknown", freshness: "none" },
      source_of_truth: "none",
      deployment_id: null,
      module_key: null,
      proof_status: null,
      last_verified: null,
    };
  }
  const card = portalState.cards[cardKey];
  if (!card) {
    return {
      card_key: cardKey,
      status: CARD_STATUS.BLOCKED,
      display_text: "This section is temporarily unavailable.",
      admin_diagnostics: `Unknown card key: ${cardKey}`,
      proof_metadata: { has_proof: false, last_verified: null, proof_log_id: null, environment: "unknown", freshness: "none" },
      source_of_truth: "none",
      deployment_id: null,
      module_key: null,
      proof_status: null,
      last_verified: null,
    };
  }
  return card;
}

// ── Helper: check if any card is Live ─────────────────────

export function hasAnyLiveCard(portalState) {
  if (!portalState?.cards) return false;
  return Object.values(portalState.cards).some((c) => c.status === CARD_STATUS.LIVE);
}