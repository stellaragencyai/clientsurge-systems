/**
 * Deployment Module Map — Phase 3.5
 *
 * Migration map from ClientDeployment.activated_modules → Portal capability cards.
 *
 * For each module defines:
 *   - module_key:       Canonical key used in activated_modules + execution logs
 *   - portal_card:      The card_key in PortalStateEngine
 *   - proof_service_key: AutomationProofLog.service_key (may differ from module_key)
 *   - execution_module_key: AutomationExecutionLog.module_key
 *   - deployment_status_key: ClientDeployment.module_installation_status key (may differ)
 *   - failure_state:    The module_installation_status value that means "failed"
 *
 * Fallback hierarchy (per Phase 3.5 spec):
 *   1. ClientDeployment (activated_modules + module_installation_status)
 *   2. AutomationProofLog
 *   3. AutomationExecutionLog
 *   4. Legacy order.services (only if deployment unavailable)
 */

export const DEPLOYMENT_MODULE_MAP = {
  instant_lead_response: {
    portal_card: "lead_capture",
    proof_service_key: "instant_lead_response",
    execution_module_key: "instant_lead_response",
    deployment_status_key: "instant_lead_response",
    display_name: "Instant Lead Response",
    failure_state: "failed",
    legacy_matcher: (s) => s.service_key === "instant_lead_response",
  },
  missed_call_text_back: {
    portal_card: "missed_call_text_back",
    proof_service_key: "missed_call_text_back",
    execution_module_key: "missed_call_text_back",
    deployment_status_key: "missed_call_text_back",
    display_name: "Missed Call Text-Back",
    failure_state: "failed",
    legacy_matcher: (s) =>
      s.service_key === "missed_call_text_back" ||
      (s.display_name || "").toLowerCase().includes("missed call"),
  },
  ai_booking_agent: {
    portal_card: "ai_booking_agent",
    proof_service_key: "ai_booking_agent",
    execution_module_key: "ai_booking_agent",
    deployment_status_key: "ai_booking_agent",
    display_name: "AI Booking Agent",
    failure_state: "failed",
    legacy_matcher: (s) =>
      s.service_key === "ai_booking_agent" ||
      (s.display_name || "").toLowerCase().includes("booking"),
  },
  ai_voice_receptionist: {
    portal_card: "ai_voice_agent",
    proof_service_key: "ai_voice_receptionist",
    execution_module_key: "ai_voice_receptionist",
    deployment_status_key: null,
    display_name: "AI Voice Receptionist",
    failure_state: "failed",
    legacy_matcher: (s) =>
      s.service_key === "ai_voice_receptionist" ||
      (s.display_name || "").toLowerCase().includes("voice"),
  },
  nurture_sequence_14d: {
    portal_card: "nurture_sequence",
    proof_service_key: "nurture_sequence_14d",
    execution_module_key: "nurture_sequence_14d",
    deployment_status_key: "lead_nurture",
    display_name: "Nurture Sequence",
    failure_state: "failed",
    legacy_matcher: (s) =>
      s.service_key === "nurture_sequence_14d" ||
      (s.display_name || "").toLowerCase().includes("nurture"),
  },
  daily_digest: {
    portal_card: "daily_digest",
    proof_service_key: "daily_lead_digest",
    execution_module_key: "daily_digest",
    deployment_status_key: "daily_digest",
    display_name: "Daily Digest",
    failure_state: "failed",
    legacy_matcher: (s) =>
      s.service_key === "daily_lead_digest" ||
      (s.display_name || "").toLowerCase().includes("digest"),
  },
  lead_reactivation: {
    portal_card: "lead_reactivation",
    proof_service_key: "lead_reactivation",
    execution_module_key: "lead_reactivation",
    deployment_status_key: "review_reactivation",
    display_name: "Lead Reactivation",
    failure_state: "failed",
    legacy_matcher: (s) =>
      s.service_key === "lead_reactivation" ||
      (s.display_name || "").toLowerCase().includes("reactivation"),
  },
  review_request: {
    portal_card: "review_request",
    proof_service_key: "review_request",
    execution_module_key: "review_request",
    deployment_status_key: null,
    display_name: "Review Request",
    failure_state: "failed",
    legacy_matcher: (s) =>
      s.service_key === "review_request" ||
      (s.display_name || "").toLowerCase().includes("review"),
  },
};

// Reverse lookup: portal_card_key → canonical module key
export const CARD_TO_MODULE_MAP = Object.entries(DEPLOYMENT_MODULE_MAP).reduce(
  (acc, [moduleKey, config]) => {
    acc[config.portal_card] = moduleKey;
    return acc;
  },
  {}
);

// ── Helpers ────────────────────────────────────────────────

/**
 * Check if a module is activated in a ClientDeployment.
 * @param {object|null} deployment
 * @param {string} moduleKey - canonical module key
 * @returns {boolean}
 */
export function isModuleActivated(deployment, moduleKey) {
  if (!deployment?.activated_modules || !Array.isArray(deployment.activated_modules))
    return false;
  return deployment.activated_modules.includes(moduleKey);
}

/**
 * Get the module installation status from a ClientDeployment.
 * @param {object|null} deployment
 * @param {string} moduleKey - canonical module key
 * @returns {string|null} - installation status or null if not tracked
 */
export function getModuleInstallStatus(deployment, moduleKey) {
  const config = DEPLOYMENT_MODULE_MAP[moduleKey];
  if (!config || !config.deployment_status_key) return null;
  const statusMap = deployment?.module_installation_status;
  if (!statusMap) return "not_started";
  return statusMap[config.deployment_status_key] || "not_started";
}

// Statuses that indicate the module is installed and verified
const READY_STATUSES = new Set([
  "verified",
  "installed",
  "ready",
  "tested",
  "connected",
]);

/**
 * Check if a module's installation status indicates it is ready.
 */
export function isModuleReady(deployment, moduleKey) {
  const status = getModuleInstallStatus(deployment, moduleKey);
  return READY_STATUSES.has(status);
}

/**
 * Check if a module's installation status indicates failure.
 */
export function isModuleFailed(deployment, moduleKey) {
  const status = getModuleInstallStatus(deployment, moduleKey);
  return status === "failed";
}

/**
 * Find the most recent execution log for a module.
 * @param {Array} executionLogs - AutomationExecutionLog records
 * @param {string} moduleKey - canonical module key
 * @returns {object|null} - { log, execution_status, completed_at, error_message }
 */
export function findLatestExecutionLog(executionLogs, moduleKey) {
  if (!Array.isArray(executionLogs) || !moduleKey) return null;
  const config = DEPLOYMENT_MODULE_MAP[moduleKey];
  const execKey = config?.execution_module_key || moduleKey;
  const matching = executionLogs
    .filter((e) => e?.module_key === execKey)
    .sort(
      (a, b) =>
        new Date(b.started_at || b.completed_at || 0) -
        new Date(a.started_at || a.completed_at || 0)
    );
  if (matching.length === 0) return null;
  const log = matching[0];
  return {
    log,
    execution_status: log.execution_status,
    completed_at: log.completed_at,
    error_message: log.error_message,
  };
}

/**
 * Resolve module availability from deployment (priority 1) or legacy services (fallback).
 *
 * @param {object|null} deployment
 * @param {Array} services - legacy order.services
 * @param {string} moduleKey - canonical module key
 * @returns {{ source: string, isAvailable: boolean, installStatus: string|null }}
 */
export function resolveModuleAvailability(deployment, services, moduleKey) {
  const config = DEPLOYMENT_MODULE_MAP[moduleKey];
  if (!config)
    return { source: "none", isAvailable: false, installStatus: null };

  // Priority 1: ClientDeployment
  if (deployment) {
    const isActivated = isModuleActivated(deployment, moduleKey);
    const installStatus = getModuleInstallStatus(deployment, moduleKey);
    return {
      source: "deployment",
      isAvailable: isActivated,
      installStatus: installStatus || "not_started",
    };
  }

  // Fallback: Legacy order.services
  const service = (services || []).find(config.legacy_matcher);
  return {
    source: "legacy",
    isAvailable: !!service,
    installStatus: service?.install_status || null,
  };
}