/**
 * PortalStateEngine — Phase A.1 Truth Hardening
 *
 * Pure normalization layer that converts raw portal context data into
 * proof-validated, environment-filtered, client-safe card states.
 *
 * Every card produces:
 *   { status, display_text, admin_diagnostics, proof_metadata }
 *
 * Statuses:
 *   Live          — proof exists, fresh (<24h), production environment
 *   NeedsProof    — data exists but no proof log within freshness window
 *   Blocked       — blocking condition (failed events, missing links)
 *   SetupRequired — onboarding/quick-start not complete
 *   Syncing       — data stale or environment unknown
 */

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

/**
 * Filter a list of records to production-trusted only.
 * Excludes anything where environment != production OR tenant_scope_status != scoped.
 */
export function filterProductionOnly(records) {
  if (!Array.isArray(records)) return [];
  return records.filter((r) => {
    if (!r) return false;
    const env = (r.environment || "").toLowerCase();
    const scope = (r.tenant_scope_status || "").toLowerCase();
    return PRODUCTION_ENVS.has(env) || TRUSTED_SCOPE.has(scope);
  });
}

/**
 * Check if a single record is production-trusted.
 */
export function isProductionTrusted(record) {
  if (!record) return false;
  const env = (record.environment || "").toLowerCase();
  const scope = (record.tenant_scope_status || "").toLowerCase();
  return PRODUCTION_ENVS.has(env) || TRUSTED_SCOPE.has(scope);
}

// ── Safe Language ─────────────────────────────────────────

/**
 * Sanitize any raw text before it reaches the client.
 * Replaces forbidden backend terms with safe equivalents.
 */
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
  // Final safety: if any forbidden term remains, mask it
  for (const term of FORBIDDEN_TERMS) {
    if (clean.toLowerCase().includes(term.toLowerCase())) {
      clean = clean.replace(new RegExp(term, "gi"), "—");
    }
  }
  return clean.trim();
}

// ── Proof Freshness ───────────────────────────────────────

/**
 * Find the most recent passing proof log for a given service_key.
 * Returns { proof, isFresh, isStale } or null if no proof exists.
 */
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

/**
 * Build proof_metadata object for a card.
 */
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

// ── Card State Builder ────────────────────────────────────

/**
 * Build a normalized card state.
 * @param {string} cardKey - identifier for the card
 * @param {object} opts
 * @param {string} opts.liveText - client-facing text when Live
 * @param {string} opts.needsProofText - client-facing text when NeedsProof
 * @param {string} opts.blockedText - client-facing text when Blocked
 * @param {string} opts.setupText - client-facing text when SetupRequired
 * @param {string} opts.syncingText - client-facing text when Syncing
 * @param {object|null} opts.proofResult - result from findLatestProof
 * @param {string} opts.envTrust - "production" | "unknown"
 * @param {boolean} opts.setupComplete - whether setup prerequisites are met
 * @param {boolean} opts.hasBlockingCondition - whether a blocking condition exists
 * @param {string} opts.adminDetail - technical reason for the status
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
    adminDiagnostics = `${cardKey}: NeedsProof — no passing AutomationProofLog found`;
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

  return {
    card_key: cardKey,
    status,
    display_text: displayText,
    admin_diagnostics: adminDiagnostics,
    proof_metadata: proofMetadata,
  };
}

// ── Main Engine: normalizePortalState ─────────────────────

/**
 * Main entry point. Takes raw portal context + proof logs and returns
 * a normalized portal state object with card-level trust statuses.
 *
 * @param {object} rawContext - from getClientPortalContext
 * @param {Array} proofLogs - AutomationProofLog records (already scoped)
 * @returns {object} normalized portal state
 */
export function normalizePortalState(rawContext, proofLogs = []) {
  const ctx = rawContext || {};
  const project = ctx.project || null;
  const order = ctx.order || null;
  const subscription = ctx.subscription || null;
  const health = ctx.health || null;

  // ── Environment trust ──
  const envTrust = isProductionTrusted(order) || isProductionTrusted(project)
    ? "production"
    : "unknown";

  // ── Setup completion ──
  const setupComplete =
    (project?.quick_start_completed === true &&
      project?.onboarding_wizard_completed === true) ||
    (order?.services || []).every((s) => s.install_status === "Live");

  // ── Event filtering ──
  const rawEvents = filterProductionOnly(health?.recent_events || []);
  const failedEvents = rawEvents.filter(
    (e) => e.status === "failed" && !(e.event_type || "").includes("portal_login")
  );
  const hasBlockingCondition = failedEvents.length > 0 && !ctx.is_admin_preview;

  // ── Services ──
  const services = (order?.services || []).filter((s) => s != null);

  // ── Card: System Readiness ──
  const allServicesLive = services.length > 0 && services.every((s) => s.install_status === "Live");
  const systemReadinessProof = allServicesLive ? findLatestProof(proofLogs, "instant_lead_response") : null;

  const systemReadiness = buildCardState({
    cardKey: "system_readiness",
    liveText: "Your system is live and running.",
    needsProofText: "We're verifying your system before it goes live.",
    blockedText: "Your system needs attention. Our team is on it.",
    setupText: "Setup is in progress. Complete your Quick Start to activate.",
    syncingText: "Your system is syncing. Check back shortly.",
    proofResult: systemReadinessProof,
    envTrust,
    setupComplete: setupComplete || allServicesLive,
    hasBlockingCondition,
    adminDetail: failedEvents.length > 0 ? `${failedEvents.length} recent failed events` : null,
  });

  // ── Card: Installation Progress ──
  const installationProof = services.some((s) => s.install_status === "Live")
    ? findLatestProof(proofLogs, "instant_lead_response")
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
  });

  // ── Card: Automation Health ──
  const automationProof = findLatestProof(proofLogs, "instant_lead_response") ||
    findLatestProof(proofLogs, "missed_call_text_back");
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
    hasBlockingCondition,
    adminDetail: failedEvents.length > 0 ? `${failedEvents.length} failed automation events` : null,
  });

  // ── Card: Lead Capture ──
  const leadCaptureProof = findLatestProof(proofLogs, "instant_lead_response");
  const productionLeads = rawEvents.filter(
    (e) => e.event_type && e.event_type.includes("lead") && e.status !== "failed"
  );
  const leadCapture = buildCardState({
    cardKey: "lead_capture",
    liveText: productionLeads.length > 0
      ? `${productionLeads.length} leads captured.`
      : "Lead capture is active and ready.",
    needsProofText: "Waiting for your first verified lead.",
    blockedText: "Lead capture needs attention. Our team is on it.",
    setupText: "Lead capture will activate after setup is complete.",
    syncingText: "Lead data is syncing.",
    proofResult: leadCaptureProof,
    envTrust,
    setupComplete,
    hasBlockingCondition,
    adminDetail: null,
  });

  // ── Card: Missed Call Text-Back ──
  const missedCallProof = findLatestProof(proofLogs, "missed_call_text_back");
  const missedCallService = services.find(
    (s) => s.service_key === "missed_call_text_back" || s.display_name?.toLowerCase().includes("missed call")
  );
  const missedCallTextBack = buildCardState({
    cardKey: "missed_call_text_back",
    liveText: "Missed call text-back is active.",
    needsProofText: "Missed call text-back is being verified.",
    blockedText: "Missed call text-back needs attention.",
    setupText: "Missed call text-back will activate after setup.",
    syncingText: "Missed call text-back is syncing.",
    proofResult: missedCallProof,
    envTrust,
    setupComplete: setupComplete && !!missedCallService,
    hasBlockingCondition: false,
    adminDetail: null,
  });

  // ── Card: AI Booking Agent ──
  const bookingProof = findLatestProof(proofLogs, "ai_booking_agent");
  const bookingService = services.find(
    (s) => s.service_key === "ai_booking_agent" || s.display_name?.toLowerCase().includes("booking")
  );
  const aiBookingAgent = buildCardState({
    cardKey: "ai_booking_agent",
    liveText: "AI booking agent is active.",
    needsProofText: "AI booking agent is being verified.",
    blockedText: "AI booking agent needs attention.",
    setupText: "AI booking agent will activate after setup.",
    syncingText: "AI booking agent is syncing.",
    proofResult: bookingProof,
    envTrust,
    setupComplete: setupComplete && !!bookingService,
    hasBlockingCondition: false,
    adminDetail: null,
  });

  // ── Card: Nurture Sequence ──
  const nurtureProof = findLatestProof(proofLogs, "nurture_sequence_14d");
  const nurtureService = services.find(
    (s) => s.service_key === "nurture_sequence_14d" || s.display_name?.toLowerCase().includes("nurture")
  );
  const nurtureSequence = buildCardState({
    cardKey: "nurture_sequence",
    liveText: "Nurture sequence is active.",
    needsProofText: "Nurture sequence is being verified.",
    blockedText: "Nurture sequence needs attention.",
    setupText: "Nurture sequence will activate after setup.",
    syncingText: "Nurture sequence is syncing.",
    proofResult: nurtureProof,
    envTrust,
    setupComplete: setupComplete && !!nurtureService,
    hasBlockingCondition: false,
    adminDetail: null,
  });

  // ── Card: AI Voice Agent ──
  const voiceProof = findLatestProof(proofLogs, "ai_voice_receptionist");
  const voiceService = services.find(
    (s) => s.service_key === "ai_voice_receptionist" || s.display_name?.toLowerCase().includes("voice")
  );
  const aiVoiceAgent = buildCardState({
    cardKey: "ai_voice_agent",
    liveText: "AI voice agent is active.",
    needsProofText: "AI voice agent is being verified.",
    blockedText: "AI voice agent needs attention.",
    setupText: "AI voice agent will activate after setup.",
    syncingText: "AI voice agent is syncing.",
    proofResult: voiceProof,
    envTrust,
    setupComplete: setupComplete && !!voiceService,
    hasBlockingCondition: false,
    adminDetail: null,
  });

  // ── Card: Daily Digest ──
  const digestProof = findLatestProof(proofLogs, "daily_lead_digest");
  const digestService = services.find(
    (s) => s.service_key === "daily_lead_digest" || s.display_name?.toLowerCase().includes("digest")
  );
  const dailyDigest = buildCardState({
    cardKey: "daily_digest",
    liveText: "Daily digest is active.",
    needsProofText: "Daily digest is being verified.",
    blockedText: "Daily digest needs attention.",
    setupText: "Daily digest will activate after setup.",
    syncingText: "Daily digest is syncing.",
    proofResult: digestProof,
    envTrust,
    setupComplete: setupComplete && !!digestService,
    hasBlockingCondition: false,
    adminDetail: null,
  });

  // ── Card: Lead Reactivation ──
  const reactivationProof = findLatestProof(proofLogs, "lead_reactivation");
  const reactivationService = services.find(
    (s) => s.service_key === "lead_reactivation" || s.display_name?.toLowerCase().includes("reactivation")
  );
  const leadReactivation = buildCardState({
    cardKey: "lead_reactivation",
    liveText: "Lead reactivation is active.",
    needsProofText: "Lead reactivation is being verified.",
    blockedText: "Lead reactivation needs attention.",
    setupText: "Lead reactivation will activate after setup.",
    syncingText: "Lead reactivation is syncing.",
    proofResult: reactivationProof,
    envTrust,
    setupComplete: setupComplete && !!reactivationService,
    hasBlockingCondition: false,
    adminDetail: null,
  });

  // ── Card: Review Request ──
  const reviewProof = findLatestProof(proofLogs, "review_request");
  const reviewService = services.find(
    (s) => s.service_key === "review_request" || s.display_name?.toLowerCase().includes("review")
  );
  const reviewRequest = buildCardState({
    cardKey: "review_request",
    liveText: "Review request automation is active.",
    needsProofText: "Review request automation is being verified.",
    blockedText: "Review request automation needs attention.",
    setupText: "Review request automation will activate after setup.",
    syncingText: "Review request automation is syncing.",
    proofResult: reviewProof,
    envTrust,
    setupComplete: setupComplete && !!reviewService,
    hasBlockingCondition: false,
    adminDetail: null,
  });

  // ── Card: ROI / Revenue Impact ──
  const roiImpact = buildCardState({
    cardKey: "roi_revenue_impact",
    liveText: "Revenue tracking is active.",
    needsProofText: "Revenue impact data will appear after your first verified lead.",
    blockedText: "Revenue tracking is temporarily unavailable.",
    setupText: "Revenue tracking will begin after your system goes live.",
    syncingText: "Revenue data is syncing.",
    proofResult: allServicesLive ? systemReadinessProof : null,
    envTrust,
    setupComplete: setupComplete && allServicesLive,
    hasBlockingCondition,
    adminDetail: null,
  });

  // ── Card: Billing ──
  const billingBlocked =
    subscription?.status === "canceled" ||
    subscription?.status === "unpaid" ||
    subscription?.status === "incomplete_expired";
  const billing = buildCardState({
    cardKey: "billing",
    liveText: "Your subscription is active.",
    needsProofText: "Billing is being set up.",
    blockedText: billingBlocked ? "Your subscription needs attention." : "Billing is temporarily unavailable.",
    setupText: "Billing will be available after checkout is complete.",
    syncingText: "Billing information is syncing.",
    proofResult: subscription?.status === "active" ? { proof: { id: "subscription" }, isFresh: true, isStale: false, testedAt: new Date().toISOString() } : null,
    envTrust: "production",
    setupComplete: !!subscription,
    hasBlockingCondition: billingBlocked,
    adminDetail: billingBlocked ? `subscription status: ${subscription?.status}` : null,
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
  });

  // ── Card: Activity Log ──
  const activityLog = buildCardState({
    cardKey: "activity_log",
    liveText: "Activity log is up to date.",
    needsProofText: "No activity yet. Your log will appear here as leads come in.",
    blockedText: "Activity log is temporarily unavailable.",
    setupText: "Activity will appear after your system is live.",
    syncingText: "Activity log is syncing.",
    proofResult: rawEvents.length > 0 ? { proof: { id: "events" }, isFresh: true, isStale: false, testedAt: new Date().toISOString() } : null,
    envTrust,
    setupComplete,
    hasBlockingCondition: false,
    adminDetail: `${rawEvents.length} production-trusted events available`,
  });

  // ── Card: Support ──
  const support = buildCardState({
    cardKey: "support",
    liveText: "Support is available.",
    needsProofText: "Support is available.",
    blockedText: "Support is temporarily unavailable.",
    setupText: "Support is available — reach out anytime.",
    syncingText: "Support is available.",
    proofResult: { proof: { id: "always" }, isFresh: true, isStale: false, testedAt: new Date().toISOString() },
    envTrust: "production",
    setupComplete: true,
    hasBlockingCondition: false,
    adminDetail: "Support card is always available",
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
    setupComplete: setupComplete && allServicesLive,
    hasBlockingCondition: false,
    adminDetail: "No weekly report proof found",
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
    setupComplete: setupComplete && allServicesLive,
    hasBlockingCondition: false,
    adminDetail: "No recommendation proof found",
  });

  // ── Assemble normalized state ──
  return {
    meta: {
      generated_at: new Date().toISOString(),
      env_trust: envTrust,
      setup_complete: setupComplete,
      has_blocking_condition: hasBlockingCondition,
      proof_logs_count: proofLogs.length,
      production_events_count: rawEvents.length,
      is_admin_preview: ctx.is_admin_preview || false,
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

/**
 * Safely retrieve a card's normalized state.
 * Returns a Blocked fallback if the card key doesn't exist.
 */
export function getCardState(portalState, cardKey) {
  if (!portalState?.cards) {
    return {
      card_key: cardKey,
      status: CARD_STATUS.BLOCKED,
      display_text: "This section is temporarily unavailable.",
      admin_diagnostics: "Portal state not loaded",
      proof_metadata: { has_proof: false, last_verified: null, proof_log_id: null, environment: "unknown", freshness: "none" },
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
    };
  }
  return card;
}

// ── Helper: check if any card is Live ─────────────────────

export function hasAnyLiveCard(portalState) {
  if (!portalState?.cards) return false;
  return Object.values(portalState.cards).some((c) => c.status === CARD_STATUS.LIVE);
}