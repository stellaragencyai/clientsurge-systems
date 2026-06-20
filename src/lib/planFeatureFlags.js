/**
 * SaaS Plan Feature Flags Utility
 * Determines feature availability based on client plan type.
 * All UI gating should use these helpers — never hardcode plan checks.
 */

export const PLAN_TIERS = {
  starter_system: 1,
  growth_system: 2,
  pro_system: 3,
  enterprise: 4,
  trial: 1,
};

/** Features available at each plan tier (minimum tier required) */
export const FEATURE_TIER_MAP = {
  // Available on all plans
  sms_enabled: 1,
  email_enabled: 1,
  basic_dashboard: 1,
  lead_tracking: 1,
  review_request_enabled: 1,

  // Growth and above
  ai_booking_agent_enabled: 2,
  lead_reactivation_enabled: 2,
  nurture_sequence_enabled: 2,
  advanced_analytics_enabled: 2,

  // Pro and above
  voice_calls_enabled: 3,
  ai_intelligence_enabled: 3,
  conversion_insights_enabled: 3,
  funnel_optimization_enabled: 3,
  assisted_operations_enabled: 3,
  api_access_enabled: 3,

  // Enterprise only
  command_center_enabled: 4,
  white_label_enabled: 4,
};

/**
 * Returns default feature flags for a given plan type.
 */
export function getDefaultFeatureFlags(planType) {
  const tier = PLAN_TIERS[planType] || 1;
  const flags = {};
  for (const [feature, minTier] of Object.entries(FEATURE_TIER_MAP)) {
    flags[feature] = tier >= minTier;
  }
  return flags;
}

/**
 * Returns default usage limits for a given plan type.
 */
export function getDefaultUsageLimits(planType) {
  const limits = {
    starter_system: {
      max_leads_per_month: 500,
      max_sms_per_month: 1000,
      max_emails_per_month: 2000,
      max_automations: 5,
    },
    growth_system: {
      max_leads_per_month: 2000,
      max_sms_per_month: 5000,
      max_emails_per_month: 10000,
      max_automations: 20,
    },
    pro_system: {
      max_leads_per_month: 10000,
      max_sms_per_month: 25000,
      max_emails_per_month: 50000,
      max_automations: 100,
    },
    enterprise: {
      max_leads_per_month: 999999,
      max_sms_per_month: 999999,
      max_emails_per_month: 999999,
      max_automations: 999999,
    },
    trial: {
      max_leads_per_month: 100,
      max_sms_per_month: 200,
      max_emails_per_month: 500,
      max_automations: 3,
    },
  };
  return limits[planType] || limits.starter_system;
}

/**
 * Check if a specific feature is enabled for a client config.
 * @param {object} clientConfig - ClientAccountConfig record
 * @param {string} featureKey - Feature key to check
 * @returns {boolean}
 */
export function isFeatureEnabled(clientConfig, featureKey) {
  if (!clientConfig) return false;

  // Check explicit feature_flags override first
  if (clientConfig.feature_flags && typeof clientConfig.feature_flags[featureKey] === 'boolean') {
    return clientConfig.feature_flags[featureKey];
  }

  // Fall back to plan-based defaults
  const planType = clientConfig.plan_type || 'starter_system';
  const defaults = getDefaultFeatureFlags(planType);
  return defaults[featureKey] ?? false;
}

/**
 * Returns the plan display label.
 */
export function getPlanLabel(planType) {
  const labels = {
    starter_system: 'Starter System',
    growth_system: 'Growth System',
    pro_system: 'Pro System',
    enterprise: 'Enterprise',
    trial: 'Free Trial',
  };
  return labels[planType] || planType;
}

/**
 * Returns plan badge color classes.
 */
export function getPlanBadgeClasses(planType) {
  const colors = {
    starter_system: 'bg-gray-100 text-gray-700',
    growth_system: 'bg-blue-100 text-blue-700',
    pro_system: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-green-100 text-green-700',
    trial: 'bg-orange-100 text-orange-700',
  };
  return colors[planType] || 'bg-gray-100 text-gray-600';
}