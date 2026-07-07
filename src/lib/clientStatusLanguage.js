/**
 * Client Status Language Map — Phase 4.1
 *
 * Centralized translation layer that converts internal system states
 * into premium, client-facing language.
 *
 * The portal must NEVER expose internal terms:
 *   NeedsProof, SetupRequired, deployment_status, module_key,
 *   proof_log_id, environment, internal diagnostics, database terminology.
 *
 * Every portal component MUST import from this file for status labels,
 * descriptions, colors, and next-action guidance.
 */

import {
  CheckCircle2, Clock, AlertCircle, Settings, RefreshCw,
  PauseCircle, Lock, ArrowUpCircle, Loader2,
} from "lucide-react";

// ── Internal → Client Status Translation Map ──────────────
// Maps every internal CARD_STATUS / deployment_status / execution_status
// to a client-safe { label, description, color, icon }.

export const CLIENT_STATUS_MAP = {
  // Internal: Live          → Client: Active
  Live: {
    label: "Active",
    description: "Your automation is running and verified.",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.06)",
    border: "rgba(34,197,94,0.18)",
    icon: CheckCircle2,
  },

  // Internal: NeedsProof    → Client: Verifying Connection
  NeedsProof: {
    label: "Verifying Connection",
    description: "We're verifying your connection is working correctly.",
    color: "#00AEEF",
    bg: "rgba(0,174,239,0.06)",
    border: "rgba(0,174,239,0.18)",
    icon: Clock,
  },

  // Internal: SetupRequired → Client: Setup in Progress
  SetupRequired: {
    label: "Setup in Progress",
    description: "Your system is being configured. Complete your setup to activate.",
    color: "#D4AF37",
    bg: "rgba(212,175,55,0.06)",
    border: "rgba(212,175,55,0.20)",
    icon: Settings,
  },

  // Internal: Syncing        → Client: Syncing Data
  Syncing: {
    label: "Syncing Data",
    description: "Your system is syncing data. Check back shortly.",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.06)",
    border: "rgba(99,102,241,0.18)",
    icon: RefreshCw,
  },

  // Internal: Blocked        → Client: Action Required
  Blocked: {
    label: "Action Required",
    description: "Action is needed to keep your system running. Our team is on it.",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.18)",
    icon: AlertCircle,
  },

  // Internal: Error           → Client: Needs Attention
  Error: {
    label: "Needs Attention",
    description: "This service needs attention. Our support team is ready to help.",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.18)",
    icon: AlertCircle,
  },

  // Internal: Paused          → Client: Temporarily Paused
  Paused: {
    label: "Temporarily Paused",
    description: "Your follow-up system is currently paused. Contact support to resume.",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.18)",
    icon: PauseCircle,
  },

  // Internal: Cancelled       → Client: Inactive
  Cancelled: {
    label: "Inactive",
    description: "This service is no longer active. Contact support to reactivate.",
    color: "#6B7280",
    bg: "rgba(107,114,128,0.06)",
    border: "rgba(107,114,128,0.18)",
    icon: AlertCircle,
  },

  // ── Future Automation Center states (Phase 5 prep) ──

  // Preparing — module is being installed but not yet ready for proof
  Preparing: {
    label: "Preparing",
    description: "We're preparing this automation for your account.",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.06)",
    border: "rgba(139,92,246,0.18)",
    icon: Loader2,
  },

  // Upgrade Available — module not in current tier
  UpgradeAvailable: {
    label: "Upgrade Available",
    description: "This automation is available in a higher plan. Upgrade to unlock.",
    color: "#00AEEF",
    bg: "rgba(0,174,239,0.06)",
    border: "rgba(0,174,239,0.18)",
    icon: ArrowUpCircle,
  },

  // Locked — module not in package
  Locked: {
    label: "Not in Your Plan",
    description: "This automation is not included in your current plan.",
    color: "#9CA3AF",
    bg: "rgba(156,163,175,0.06)",
    border: "rgba(156,163,175,0.18)",
    icon: Lock,
  },

  // Not Started — default for new modules
  NotStarted: {
    label: "Coming Soon",
    description: "This automation will be available after setup is complete.",
    color: "#9CA3AF",
    bg: "rgba(156,163,175,0.06)",
    border: "rgba(156,163,175,0.18)",
    icon: Clock,
  },
};

// ── Deployment Status Translation ─────────────────────────
// Maps ClientDeployment.deployment_status values to client-safe labels.
// These are used when the portal needs to show overall system status.

export const DEPLOYMENT_STATUS_TRANSLATION = {
  pending:     { label: "Preparing Your System",   clientStatus: "Preparing" },
  onboarding:  { label: "Setup in Progress",      clientStatus: "SetupRequired" },
  configuring: { label: "Configuring Your System",  clientStatus: "SetupRequired" },
  ready:       { label: "Ready to Launch",         clientStatus: "NeedsProof" },
  live:        { label: "Active",                  clientStatus: "Live" },
  error:       { label: "Needs Attention",          clientStatus: "Error" },
  paused:      { label: "Temporarily Paused",       clientStatus: "Paused" },
  cancelled:   { label: "Inactive",                 clientStatus: "Cancelled" },
};

// ── Module Installation Status Translation ───────────────
// Maps ClientDeployment.module_installation_status values.

export const MODULE_INSTALL_TRANSLATION = {
  not_started:  { label: "Coming Soon",         clientStatus: "NotStarted" },
  needs_setup:  { label: "Setup in Progress",    clientStatus: "SetupRequired" },
  connected:    { label: "Verifying Connection", clientStatus: "NeedsProof" },
  test_mode:    { label: "Verifying Connection", clientStatus: "NeedsProof" },
  tested:       { label: "Verifying Connection", clientStatus: "NeedsProof" },
  failed:       { label: "Needs Attention",      clientStatus: "Error" },
  ready:        { label: "Active",              clientStatus: "Live" },
  installing:   { label: "Preparing",           clientStatus: "Preparing" },
  installed:    { label: "Verifying Connection", clientStatus: "NeedsProof" },
  verified:     { label: "Active",              clientStatus: "Live" },
};

// ── Forbidden Terms ───────────────────────────────────────
// Words/phrases that must NEVER appear in client-facing UI.
// These are internal/database terms that break the premium experience.

export const FORBIDDEN_CLIENT_TERMS = [
  "NeedsProof",
  "SetupRequired",
  "Syncing",
  "Blocked",
  "deployment_status",
  "module_key",
  "module_installation_status",
  "proof_log_id",
  "execution_log",
  "AutomationProofLog",
  "AutomationExecutionLog",
  "ClientDeployment",
  "PackageTier",
  "IndustryConfig",
  "AutomationModule",
  "dead_letter",
  "dead letter",
  "stack_trace",
  "stack trace",
  "dashboard_truth_status",
  "tenant_scope_status",
  "system_internal",
  "missing_client_id",
  "raw provider error",
  "smoke",
  "test_record",
  "test record",
  "unknown environment",
  "internal diagnostics",
];

// ── Translation Helpers ───────────────────────────────────

/**
 * Translate an internal status to a client-facing label.
 * Falls back to "Syncing Data" for unknown statuses.
 *
 * @param {string} internalStatus - CARD_STATUS value or deployment status
 * @returns {string} client-facing label
 */
export function translateStatus(internalStatus) {
  const entry = CLIENT_STATUS_MAP[internalStatus];
  return entry?.label || CLIENT_STATUS_MAP.Syncing.label;
}

/**
 * Get the full client-facing config for an internal status.
 * Includes label, description, color, icon.
 *
 * @param {string} internalStatus
 * @returns {object} { label, description, color, bg, border, icon }
 */
export function getClientStatusConfig(internalStatus) {
  return CLIENT_STATUS_MAP[internalStatus] || CLIENT_STATUS_MAP.Syncing;
}

/**
 * Translate a deployment_status value to a client-facing label.
 *
 * @param {string} deploymentStatus - ClientDeployment.deployment_status
 * @returns {string} client-facing label
 */
export function translateDeploymentStatus(deploymentStatus) {
  const entry = DEPLOYMENT_STATUS_TRANSLATION[deploymentStatus];
  return entry?.label || CLIENT_STATUS_MAP.Syncing.label;
}

/**
 * Translate a module_installation_status value to a client-facing label.
 *
 * @param {string} installStatus
 * @returns {string} client-facing label
 */
export function translateModuleInstallStatus(installStatus) {
  const entry = MODULE_INSTALL_TRANSLATION[installStatus];
  return entry?.label || CLIENT_STATUS_MAP.NotStarted.label;
}

/**
 * Translate a portal state card into client-safe display data.
 *
 * Takes a card object from normalizePortalState() and returns:
 *   { friendlyStatus, explanation, lastVerified, nextAction }
 *
 * The returned object contains NO internal terms — safe for direct UI rendering.
 *
 * @param {object} card - card state from portalStateEngine
 * @param {object} [moduleMeta] - optional module metadata for richer explanations
 * @returns {object} { friendlyStatus, explanation, lastVerified, nextAction }
 */
export function translateCard(card, moduleMeta = null) {
  if (!card) {
    return {
      friendlyStatus: CLIENT_STATUS_MAP.Syncing.label,
      explanation: CLIENT_STATUS_MAP.Syncing.description,
      lastVerified: null,
      nextAction: null,
    };
  }

  const config = getClientStatusConfig(card.status);
  const lastVerified = card.last_verified || card.proof_metadata?.last_verified || null;

  // Determine next action based on status
  let nextAction = null;
  switch (card.status) {
    case "Live":
      nextAction = null; // No action needed when active
      break;
    case "NeedsProof":
      nextAction = "We're verifying your connection — check back shortly.";
      break;
    case "SetupRequired":
      nextAction = "Complete your setup to activate this feature.";
      break;
    case "Syncing":
      nextAction = "Your data is syncing — no action needed.";
      break;
    case "Blocked":
    case "Error":
      nextAction = "Contact support if this persists.";
      break;
    case "Paused":
      nextAction = "Contact support to resume.";
      break;
    case "Cancelled":
      nextAction = "Contact support to reactivate.";
      break;
    default:
      nextAction = null;
  }

  // Use module-specific description if provided
  const explanation = moduleMeta?.description || config.description;

  return {
    friendlyStatus: config.label,
    explanation,
    lastVerified,
    nextAction,
    color: config.color,
    icon: config.icon,
  };
}

/**
 * Strip any forbidden terms from a text string.
 * Replaces them with client-safe alternatives.
 *
 * @param {string} text
 * @returns {string} sanitized text
 */
export function sanitizeForClient(text) {
  if (!text || typeof text !== "string") return "";
  let clean = text;
  const replacements = {
    "NeedsProof": "Verifying Connection",
    "SetupRequired": "Setup in Progress",
    "dead_letter": "blocked",
    "dead letter": "blocked",
    "smoke": "system",
    "test_record": "sample",
    "test record": "sample",
    "stack_trace": "error detail",
    "stack trace": "error detail",
    "dashboard_truth_status": "status",
    "tenant_scope_status": "status",
    "system_internal": "system",
    "missing_client_id": "pending setup",
    "unknown environment": "pending setup",
    "raw provider error": "service unavailable",
    "deployment_status": "status",
    "module_key": "feature",
    "module_installation_status": "status",
    "proof_log_id": "",
    "execution_log": "activity",
    "AutomationProofLog": "verification",
    "AutomationExecutionLog": "activity log",
    "ClientDeployment": "system",
    "PackageTier": "plan",
    "IndustryConfig": "configuration",
    "AutomationModule": "automation",
    "internal diagnostics": "status",
  };
  for (const [bad, good] of Object.entries(replacements)) {
    clean = clean.replace(new RegExp(bad, "gi"), good);
  }
  return clean.trim();
}

// ── Phase 5: Automation Center Data Structure ─────────────
//
// Prepares the data structure for a future Automation Center.
// Each module card supports:
//   name, icon, description, status, activity, last_verified,
//   action_button, package_tier, locked_state
//
// Future states: Active, Verifying, Preparing, Paused,
//                Action Required, Upgrade Available

export const AUTOMATION_CENTER_MODULES = [
  {
    module_key: "instant_lead_response",
    name: "Lead Capture",
    description: "Instantly responds to new leads via SMS and email within seconds.",
    card_key: "lead_capture",
    icon: "Zap",
    min_tier: "starter",
  },
  {
    module_key: "missed_call_text_back",
    name: "Missed Call Text-Back",
    description: "Automatically texts back customers who call when you can't answer.",
    card_key: "missed_call_text_back",
    icon: "Phone",
    min_tier: "starter",
  },
  {
    module_key: "ai_booking_agent",
    name: "AI Booking Agent",
    description: "Your AI assistant that books appointments automatically, 24/7.",
    card_key: "ai_booking_agent",
    icon: "Calendar",
    min_tier: "growth",
  },
  {
    module_key: "ai_voice_receptionist",
    name: "AI Voice Agent",
    description: "An AI voice receptionist that answers calls and schedules appointments.",
    card_key: "ai_voice_agent",
    icon: "Mic",
    min_tier: "pro",
  },
  {
    module_key: "nurture_sequence_14d",
    name: "Nurture Sequence",
    description: "Automated follow-up sequence that nurtures leads over 14 days.",
    card_key: "nurture_sequence",
    icon: "Flame",
    min_tier: "growth",
  },
  {
    module_key: "daily_digest",
    name: "Daily Digest",
    description: "A daily summary of your lead activity and system performance.",
    card_key: "daily_digest",
    icon: "Mail",
    min_tier: "starter",
  },
  {
    module_key: "lead_reactivation",
    name: "Lead Reactivation",
    description: "Reaches out to past leads who haven't responded to re-engage them.",
    card_key: "lead_reactivation",
    icon: "RotateCw",
    min_tier: "growth",
  },
  {
    module_key: "review_request",
    name: "Review Request",
    description: "Automatically asks satisfied customers for reviews after their visit.",
    card_key: "review_request",
    icon: "Star",
    min_tier: "pro",
  },
];

/**
 * Build an Automation Center module card data structure.
 * This is the future-facing structure for the Automation Center page.
 *
 * @param {string} moduleKey
 * @param {object} portalState - from normalizePortalState
 * @param {object} deployment - ClientDeployment record
 * @returns {object} { name, icon, description, status, activity, last_verified, action_button, package_tier, locked_state }
 */
export function buildAutomationCenterCard(moduleKey, portalState, deployment) {
  const moduleDef = AUTOMATION_CENTER_MODULES.find((m) => m.module_key === moduleKey);
  if (!moduleDef) return null;

  const cardState = portalState?.cards?.[moduleDef.card_key];
  const translated = translateCard(cardState);

  // Determine if module is in the client's package
  const activatedModules = deployment?.activated_modules || [];
  const isInPackage = activatedModules.includes(moduleKey);

  // Determine locked state
  let lockedState = "unlocked";
  let status = translated.friendlyStatus;

  if (!isInPackage) {
    lockedState = "locked";
    status = CLIENT_STATUS_MAP.Locked.label;
  } else if (deployment?.package_tier_key && moduleDef.min_tier) {
    const tierRank = { starter: 1, growth: 2, pro: 3 };
    const clientRank = tierRank[deployment.package_tier_key] || 0;
    const requiredRank = tierRank[moduleDef.min_tier] || 0;
    if (requiredRank > clientRank) {
      lockedState = "upgrade_available";
      status = CLIENT_STATUS_MAP.UpgradeAvailable.label;
    }
  }

  // Determine action button
  let actionButton = null;
  if (lockedState === "locked" || lockedState === "upgrade_available") {
    actionButton = { label: "Upgrade Plan", action: "upgrade" };
  } else if (cardState?.status === "SetupRequired") {
    actionButton = { label: "Complete Setup", action: "setup" };
  } else if (cardState?.status === "Paused") {
    actionButton = { label: "Contact Support", action: "support" };
  } else if (cardState?.status === "Blocked" || cardState?.status === "Error") {
    actionButton = { label: "Get Help", action: "support" };
  }

  return {
    name: moduleDef.name,
    icon: moduleDef.icon,
    description: moduleDef.description,
    status,
    activity: translated.explanation,
    last_verified: translated.lastVerified,
    action_button: actionButton,
    package_tier: moduleDef.min_tier,
    locked_state: lockedState,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// DEPLOYMENT STATUS MODEL (migrated from deploymentStatusModel.js — Phase 4.5)
// ════════════════════════════════════════════════════════════════════════════

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
const DEPLOYMENT_CLIENT_DISPLAY = {
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

const DEPLOYMENT_FALLBACK_DISPLAY = DEPLOYMENT_CLIENT_DISPLAY[DEPLOYMENT_STATUS.PENDING];

/**
 * Get client-facing display info for a deployment status.
 * Never returns the raw enum value — always a safe, human-readable label.
 */
export function getDeploymentDisplayStatus(status) {
  const display = DEPLOYMENT_CLIENT_DISPLAY[status] || DEPLOYMENT_FALLBACK_DISPLAY;
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
 */
export function getModuleCardDisplay(moduleStatus, proofResult) {
  const installDisplay = getModuleDisplayStatus(moduleStatus);

  if (installDisplay.verified && (!proofResult || !proofResult.isFresh)) {
    return {
      ...installDisplay,
      label: "Verification Required",
      color: "#F59E0B",
      verified: false,
      proof_status: proofResult ? "stale" : "missing",
    };
  }

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