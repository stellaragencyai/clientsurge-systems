/**
 * DeploymentCardBuilder — Phase 3.3
 *
 * Builds the future Automation Center data model from ClientDeployment +
 * AutomationProofLog records.
 *
 * Each automation card contains:
 *   - automation_name
 *   - module_key
 *   - module_status (from deployment.module_installation_status)
 *   - package_availability (is this module in the client's package tier?)
 *   - proof_status (verified/stale/missing)
 *   - last_verified (timestamp from proof log)
 *   - current_state (client-safe display)
 *
 * Never shows "active" based only on configuration — proof is always required.
 */

import { getModuleCardDisplay } from "./deploymentStatusModel";

// ── Module display names ─────────────────────────────────────────
const MODULE_NAMES = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  lead_nurture: "14-Day Nurture Sequence",
  ai_booking_agent: "AI Booking Agent",
  daily_digest: "Daily Lead Digest",
  review_reactivation: "Review Request Engine",
};

// ── All known modules in the system ─────────────────────────────
const ALL_MODULE_KEYS = [
  "instant_lead_response",
  "missed_call_text_back",
  "lead_nurture",
  "ai_booking_agent",
  "daily_digest",
  "review_reactivation",
];

/**
 * Build automation center cards from a ClientDeployment + proof logs.
 *
 * @param {object} deployment - ClientDeployment record
 * @param {Array} proofLogs - AutomationProofLog records (already scoped)
 * @returns {Array} array of automation card objects
 */
export function buildAutomationCards(deployment, proofLogs = []) {
  if (!deployment) return [];

  const activatedModules = deployment.activated_modules || [];
  const moduleStatuses = deployment.module_installation_status || {};
  const packageTierKey = deployment.package_tier_key || "starter";

  return ALL_MODULE_KEYS.map((moduleKey) => {
    const proofResult = findProofForModule(proofLogs, moduleKey);
    const isActivated = activatedModules.includes(moduleKey);
    const installStatus = moduleStatuses[moduleKey] || "not_started";
    const cardDisplay = getModuleCardDisplay(installStatus, proofResult);

    return {
      module_key: moduleKey,
      automation_name: MODULE_NAMES[moduleKey] || moduleKey.replace(/_/g, " "),
      module_status: installStatus,
      package_available: isActivated,
      package_tier: packageTierKey,
      proof_status: cardDisplay.proof_status || "missing",
      proof_verified: cardDisplay.verified,
      last_verified: cardDisplay.last_verified,
      current_state: {
        label: cardDisplay.label,
        color: cardDisplay.color,
        verified: cardDisplay.verified,
      },
      is_live: cardDisplay.verified && isActivated,
      requires_verification: isActivated && !cardDisplay.verified,
    };
  });
}

/**
 * Find the most recent passing proof log for a given module key.
 * Matches against service_key field in AutomationProofLog.
 */
function findProofForModule(proofLogs, moduleKey) {
  if (!Array.isArray(proofLogs) || !moduleKey) return null;

  const matching = proofLogs
    .filter((p) => {
      const serviceKey = p?.service_key || p?.module_key;
      return serviceKey === moduleKey && p?.status === "pass";
    })
    .sort((a, b) => new Date(b.tested_at || b.created_date || 0) - new Date(a.tested_at || a.created_date || 0));

  if (matching.length === 0) return null;

  const proof = matching[0];
  const testedAt = proof.tested_at || proof.created_date;
  const testedDate = testedAt ? new Date(testedAt) : null;

  if (!testedDate || isNaN(testedDate.getTime())) {
    return { proof, isFresh: false, ageHours: null, testedAt: null };
  }

  const ageHours = (Date.now() - testedDate.getTime()) / (1000 * 60 * 60);
  const PROOF_FRESHNESS_HOURS = 24;
  const STALE_THRESHOLD_HOURS = 168;

  return {
    proof,
    isFresh: ageHours <= PROOF_FRESHNESS_HOURS,
    isStale: ageHours > STALE_THRESHOLD_HOURS,
    ageHours,
    testedAt: testedDate.toISOString(),
  };
}

/**
 * Build a summary of the deployment's automation coverage.
 */
export function buildAutomationSummary(deployment, proofLogs = []) {
  const cards = buildAutomationCards(deployment, proofLogs);

  const total = cards.length;
  const live = cards.filter((c) => c.is_live).length;
  const activated = cards.filter((c) => c.package_available).length;
  const needsVerification = cards.filter((c) => c.requires_verification).length;
  const notStarted = cards.filter((c) => c.module_status === "not_started").length;

  return {
    total_modules: total,
    live_modules: live,
    activated_modules: activated,
    needs_verification: needsVerification,
    not_started: notStarted,
    coverage_percent: total > 0 ? Math.round((live / total) * 100) : 0,
    all_verified: live === activated && activated > 0,
  };
}

/**
 * Get a client-safe summary message for the automation center.
 */
export function getAutomationSummaryMessage(summary) {
  if (summary.live_modules === 0 && summary.activated_modules === 0) {
    return "Your automation system is being prepared.";
  }
  if (summary.needs_verification > 0) {
    return `${summary.needs_verification} automation${summary.needs_verification > 1 ? "s" : ""} require verification.`;
  }
  if (summary.live_modules === summary.activated_modules && summary.activated_modules > 0) {
    return `All ${summary.live_modules} automations are live and verified.`;
  }
  return `${summary.live_modules} of ${summary.activated_modules} automations are live.`;
}