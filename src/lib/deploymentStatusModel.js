/**
 * DeploymentStatusModel — Phase 3.2
 *
 * Unified deployment status model that maps internal ClientDeployment enum values
 * to client-safe language. No raw enum values are ever exposed to clients.
 *
 * This is the single source of truth for how deployment status is displayed
 * in the Client Portal and Admin Control Center.
 */

// ── Internal status enum (never shown to clients) ─────────────────
export const DEPLOYMENT_STATUS = {
  PENDING: "pending",
  ONBOARDING: "onboarding",
  CONFIGURING: "configuring",
  TESTING: "testing",
  READY: "ready",
  LIVE: "live",
  PAUSED: "paused",
  ERROR: "error",
  CANCELLED: "cancelled",
};

// ── Client-facing display mapping ────────────────────────────────
const CLIENT_DISPLAY = {
  [DEPLOYMENT_STATUS.PENDING]: {
    label: "Your system setup has started",
    short: "Getting Started",
    color: "#6B7280",
    bgColor: "rgba(107,114,128,0.08)",
    icon: "Clock",
    progress: 5,
  },
  [DEPLOYMENT_STATUS.ONBOARDING]: {
    label: "We are preparing your automation system",
    short: "Preparing",
    color: "#0088CC",
    bgColor: "rgba(0,136,204,0.08)",
    icon: "Settings",
    progress: 20,
  },
  [DEPLOYMENT_STATUS.CONFIGURING]: {
    label: "Your automations are being configured",
    short: "Configuring",
    color: "#0088CC",
    bgColor: "rgba(0,136,204,0.08)",
    icon: "Settings",
    progress: 45,
  },
  [DEPLOYMENT_STATUS.TESTING]: {
    label: "We are verifying your system",
    short: "Verifying",
    color: "#D4AF37",
    bgColor: "rgba(212,175,55,0.08)",
    icon: "ShieldCheck",
    progress: 70,
  },
  [DEPLOYMENT_STATUS.READY]: {
    label: "Your system is ready for activation",
    short: "Ready",
    color: "#D4AF37",
    bgColor: "rgba(212,175,55,0.08)",
    icon: "CheckCircle2",
    progress: 85,
  },
  [DEPLOYMENT_STATUS.LIVE]: {
    label: "Your automation system is live and verified",
    short: "Live",
    color: "#10B981",
    bgColor: "rgba(16,185,129,0.08)",
    icon: "Zap",
    progress: 100,
  },
  [DEPLOYMENT_STATUS.PAUSED]: {
    label: "Your system is temporarily paused",
    short: "Paused",
    color: "#F59E0B",
    bgColor: "rgba(245,158,11,0.08)",
    icon: "PauseCircle",
    progress: 0,
  },
  [DEPLOYMENT_STATUS.ERROR]: {
    label: "We need to review your setup",
    short: "Needs Review",
    color: "#EF4444",
    bgColor: "rgba(239,68,68,0.08)",
    icon: "AlertCircle",
    progress: 0,
  },
  [DEPLOYMENT_STATUS.CANCELLED]: {
    label: "Your subscription is inactive",
    short: "Inactive",
    color: "#6B7280",
    bgColor: "rgba(107,114,128,0.08)",
    icon: "XCircle",
    progress: 0,
  },
};

const FALLBACK_DISPLAY = CLIENT_DISPLAY[DEPLOYMENT_STATUS.PENDING];

/**
 * Get client-facing display info for a deployment status.
 * Never returns the raw enum value — always a safe, human-readable label.
 */
export function getDeploymentDisplayStatus(status) {
  const display = CLIENT_DISPLAY[status] || FALLBACK_DISPLAY;
  return {
    status,
    label: display.label,
    short_label: display.short,
    color: display.color,
    bg_color: display.bgColor,
    icon: display.icon,
    progress_percent: display.progress,
  };
}

/**
 * Check if a deployment status represents an active, billable state.
 */
export function isDeploymentActive(status) {
  return [
    DEPLOYMENT_STATUS.ONBOARDING,
    DEPLOYMENT_STATUS.CONFIGURING,
    DEPLOYMENT_STATUS.TESTING,
    DEPLOYMENT_STATUS.READY,
    DEPLOYMENT_STATUS.LIVE,
  ].includes(status);
}

/**
 * Check if a deployment status blocks automation execution.
 */
export function isDeploymentBlocked(status) {
  return [
    DEPLOYMENT_STATUS.PAUSED,
    DEPLOYMENT_STATUS.ERROR,
    DEPLOYMENT_STATUS.CANCELLED,
  ].includes(status);
}

/**
 * Check if deployment is fully live and verified.
 */
export function isDeploymentLive(status) {
  return status === DEPLOYMENT_STATUS.LIVE;
}

// ── Module installation status display ───────────────────────────
const MODULE_STATUS_DISPLAY = {
  not_started: { label: "Not Started", color: "#6B7280", verified: false },
  needs_setup: { label: "Setup Required", color: "#F59E0B", verified: false },
  connected: { label: "Connected", color: "#0088CC", verified: false },
  test_mode: { label: "In Test Mode", color: "#D4AF37", verified: false },
  tested: { label: "Tested", color: "#D4AF37", verified: false },
  failed: { label: "Failed", color: "#EF4444", verified: false },
  ready: { label: "Ready", color: "#D4AF37", verified: false },
  installing: { label: "Installing", color: "#0088CC", verified: false },
  installed: { label: "Installed", color: "#0088CC", verified: false },
  verified: { label: "Verified", color: "#10B981", verified: true },
};

/**
 * Get client-facing display for a module installation status.
 */
export function getModuleDisplayStatus(moduleStatus) {
  const display = MODULE_STATUS_DISPLAY[moduleStatus] || MODULE_STATUS_DISPLAY.not_started;
  return {
    status: moduleStatus,
    label: display.label,
    color: display.color,
    verified: display.verified,
  };
}

/**
 * Get client-facing display for a module, combining installation status
 * with proof log verification.
 *
 * If the module is "verified" but no proof log exists within freshness window,
 * the display status is downgraded to "Verification Required".
 */
export function getModuleCardDisplay(moduleStatus, proofResult) {
  const installDisplay = getModuleDisplayStatus(moduleStatus);

  // If installation says verified but proof is missing or stale, downgrade
  if (installDisplay.verified && (!proofResult || !proofResult.isFresh)) {
    return {
      ...installDisplay,
      label: "Verification Required",
      color: "#F59E0B",
      verified: false,
      proof_status: proofResult ? "stale" : "missing",
    };
  }

  // If proof is fresh, upgrade to verified regardless of installation status
  if (proofResult && proofResult.isFresh && proofResult.proof?.status === "pass") {
    return {
      ...installDisplay,
      label: "Live and Verified",
      color: "#10B981",
      verified: true,
      proof_status: "fresh",
      last_verified: proofResult.testedAt,
    };
  }

  return {
    ...installDisplay,
    proof_status: proofResult ? "stale" : "missing",
    last_verified: proofResult?.testedAt || null,
  };
}