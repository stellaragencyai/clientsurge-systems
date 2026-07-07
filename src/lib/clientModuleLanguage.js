/**
 * clientModuleLanguage — Translates internal automation module keys and statuses
 * into client-safe language. Never exposes internal error codes, deployment IDs,
 * module keys, or technical diagnostics to the client portal.
 *
 * Part 5 + Part 6: Client Portal Automation Status + Package Tier Upgrade Path
 */

export const MODULE_INFO = {
  instant_lead_response: {
    name: "Instant Lead Response",
    description: "Sends an automatic text to new leads within 60 seconds of receiving their inquiry.",
    icon: "Zap",
    minTier: "starter",
  },
  missed_call_text_back: {
    name: "Missed Call Text-Back",
    description: "When a call is missed, the system sends a text reply so the caller knows you received their message.",
    icon: "PhoneMissed",
    minTier: "starter",
  },
  lead_nurture: {
    name: "Lead Nurture Sequence",
    description: "A 30-day email sequence that keeps leads engaged until they're ready to book.",
    icon: "Mail",
    minTier: "growth",
  },
  ai_booking_agent: {
    name: "AI Booking Agent",
    description: "When a lead shows booking intent, the system sends your booking link to move them toward scheduling.",
    icon: "CalendarCheck",
    minTier: "growth",
  },
  daily_digest: {
    name: "Daily Lead Digest",
    description: "A daily email summary of your lead activity — new leads, hot leads, and follow-ups needed.",
    icon: "FileText",
    minTier: "starter",
  },
  review_reactivation: {
    name: "Review Reactivation",
    description: "Sends review requests to customers after completed service to build your online reputation.",
    icon: "Star",
    minTier: "pro",
  },
};

export const TIER_RANK = { starter: 1, growth: 2, pro: 3 };
export const TIER_LABELS = { starter: "Starter System", growth: "Growth System", pro: "Pro System" };

/**
 * Translates an internal module status into client-safe language.
 * Never exposes technical terms like "module_not_authorized" or "deployment_id".
 */
export function translateModuleStatus(moduleKey, installStatus, isAuthorized = true, currentTier = "starter") {
  const moduleInfo = MODULE_INFO[moduleKey];
  if (!moduleInfo) {
    return {
      label: "Not Available",
      description: "This automation is not available.",
      color: "#6B7280",
      showUpgrade: false,
    };
  }

  // Check if module is blocked due to package tier
  if (!isAuthorized) {
    const moduleTier = moduleInfo.minTier;
    const currentRank = TIER_RANK[currentTier] || 1;
    const requiredRank = TIER_RANK[moduleTier] || 1;

    if (currentRank < requiredRank) {
      return {
        label: "Upgrade Required",
        description: `This automation is included in the ${TIER_LABELS[moduleTier]}. You're currently on the ${TIER_LABELS[currentTier]}.`,
        color: "#D4AF37",
        showUpgrade: true,
        requiredTier: moduleTier,
        currentTier,
        moduleKey,
        moduleName: moduleInfo.name,
      };
    }
    // Not authorized for other reasons (e.g., not activated in deployment)
    return {
      label: "Not Activated",
      description: "This automation hasn't been activated for your account yet. Contact support to enable it.",
      color: "#6B7280",
      showUpgrade: false,
    };
  }

  // Map installation status to client-safe language
  const statusMap = {
    not_started: { label: "Not Started", description: "Setup hasn't begun yet.", color: "#6B7280" },
    needs_setup: { label: "Needs Setup", description: "Configuration is required before this can run.", color: "#D4AF37" },
    connected: { label: "Connected", description: "Connected and preparing to go live.", color: "#0088CC" },
    test_mode: { label: "In Test Mode", description: "Running in test mode — verifying everything works correctly.", color: "#0088CC" },
    tested: { label: "Tested", description: "Testing complete — ready to go live.", color: "#10B981" },
    failed: { label: "Needs Attention", description: "An issue was detected. Our team has been notified.", color: "#EF4444" },
    ready: { label: "Ready", description: "Ready and waiting to go live.", color: "#10B981" },
    installing: { label: "Setting Up", description: "Our team is configuring this automation.", color: "#D4AF37" },
    installed: { label: "Installed", description: "Installed and preparing to go live.", color: "#10B981" },
    verified: { label: "Active", description: "Running and verified.", color: "#10B981" },
  };

  return {
    label: "Active",
    description: moduleInfo.description,
    color: "#10B981",
    ...statusMap[installStatus] || { label: "Not Started", description: "Setup hasn't begun yet.", color: "#6B7280" },
    showUpgrade: false,
  };
}

/**
 * Returns upgrade path context for a blocked module.
 */
export function getUpgradeContext(moduleKey, currentTier) {
  const moduleInfo = MODULE_INFO[moduleKey];
  if (!moduleInfo) return null;

  return {
    moduleName: moduleInfo.name,
    requiredTier: moduleInfo.minTier,
    requiredTierLabel: TIER_LABELS[moduleInfo.minTier] || "Higher Plan",
    currentTier,
    currentTierLabel: TIER_LABELS[currentTier] || "Current Plan",
    moduleKey,
  };
}