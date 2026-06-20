/**
 * SaaS Productization Control Map — Static Configuration Layer
 * 
 * This is the single source of truth for:
 *   - Plan → feature key mappings
 *   - Plan → usage limits
 *   - Upgrade trigger rules
 *   - Stripe product/price → plan mappings
 * 
 * READ-ONLY. Do not import and mutate. Do not write from billing or onboarding flows.
 * Database entities (SaaSProductizationControlMap, PlanFeatureMapping, etc.) mirror this config.
 */

// ─── Plan Registry ────────────────────────────────────────────────────────────

export const PLAN_REGISTRY = {
  starter_system: {
    plan_type: 'starter_system',
    display_name: 'Starter System',
    tier_order: 1,
    setup_fee_usd: 797,
    monthly_fee_usd: 497,
    description: 'Core lead capture, instant response, and missed-call recovery for businesses getting started with automation.',
  },
  growth_system: {
    plan_type: 'growth_system',
    display_name: 'Growth System',
    tier_order: 2,
    setup_fee_usd: 1297,
    monthly_fee_usd: 997,
    description: 'Starter plus 14-day nurture sequence and AI booking agent for growing businesses.',
  },
  elite_system: {
    plan_type: 'elite_system',
    display_name: 'Elite System',
    tier_order: 3,
    setup_fee_usd: 2497,
    monthly_fee_usd: 1997,
    description: 'Growth plus review requests, lead reactivation, and full-stack AI automation for established businesses.',
  },
};

// ─── Plan → Feature Key Mappings ─────────────────────────────────────────────

export const PLAN_FEATURE_MAPPING = {
  starter_system: {
    plan_type: 'starter_system',
    feature_keys: [
      'instant_lead_response',
      'missed_call_text_back',
      'lead_capture_automation',
      'sms_follow_up',
      'email_follow_up',
      'client_portal_access',
      'basic_analytics',
    ],
    usage_limits: {
      leads_per_month: 200,
      sms_per_month: 500,
      email_per_month: 1000,
      automations_per_month: 3,
    },
  },
  growth_system: {
    plan_type: 'growth_system',
    feature_keys: [
      'instant_lead_response',
      'missed_call_text_back',
      'lead_capture_automation',
      'sms_follow_up',
      'email_follow_up',
      'client_portal_access',
      'basic_analytics',
      'nurture_sequence_14d',
      'ai_booking_agent',
      'advanced_analytics',
      'lead_intelligence',
    ],
    usage_limits: {
      leads_per_month: 500,
      sms_per_month: 1500,
      email_per_month: 3000,
      automations_per_month: 6,
    },
  },
  elite_system: {
    plan_type: 'elite_system',
    feature_keys: [
      'instant_lead_response',
      'missed_call_text_back',
      'lead_capture_automation',
      'sms_follow_up',
      'email_follow_up',
      'client_portal_access',
      'basic_analytics',
      'nurture_sequence_14d',
      'ai_booking_agent',
      'advanced_analytics',
      'lead_intelligence',
      'review_request_automation',
      'lead_reactivation',
      'ai_voice_agent',
      'command_center_access',
      'priority_support',
    ],
    usage_limits: {
      leads_per_month: 1500,
      sms_per_month: 5000,
      email_per_month: 10000,
      automations_per_month: 20,
    },
  },
};

// ─── Upgrade Logic Rules ──────────────────────────────────────────────────────

export const UPGRADE_LOGIC_RULES = [
  // Usage limit warnings
  {
    rule_key: 'starter_leads_80pct',
    applies_to_plan: 'starter_system',
    rule_type: 'usage_limit',
    metric_key: 'leads_per_month',
    threshold_percent: 80,
    suggested_plan: 'growth_system',
    message: "You've used 80% of your monthly lead limit. Upgrade to Growth to handle more volume.",
    is_active: true,
  },
  {
    rule_key: 'starter_sms_80pct',
    applies_to_plan: 'starter_system',
    rule_type: 'usage_limit',
    metric_key: 'sms_per_month',
    threshold_percent: 80,
    suggested_plan: 'growth_system',
    message: "You're approaching your SMS limit. Upgrade to Growth for 3× more messages.",
    is_active: true,
  },
  {
    rule_key: 'growth_leads_80pct',
    applies_to_plan: 'growth_system',
    rule_type: 'usage_limit',
    metric_key: 'leads_per_month',
    threshold_percent: 80,
    suggested_plan: 'elite_system',
    message: "You've used 80% of your monthly lead limit. Upgrade to Elite for 3× more capacity.",
    is_active: true,
  },
  // Feature-blocked rules
  {
    rule_key: 'starter_no_nurture',
    applies_to_plan: 'starter_system',
    rule_type: 'feature_blocked',
    blocked_feature_key: 'nurture_sequence_14d',
    suggested_plan: 'growth_system',
    message: '14-Day Nurture Sequence is available on the Growth plan. Upgrade to activate automated follow-up sequences.',
    is_active: true,
  },
  {
    rule_key: 'starter_no_booking',
    applies_to_plan: 'starter_system',
    rule_type: 'feature_blocked',
    blocked_feature_key: 'ai_booking_agent',
    suggested_plan: 'growth_system',
    message: 'AI Booking Agent is available on the Growth plan. Upgrade to automate appointment scheduling.',
    is_active: true,
  },
  {
    rule_key: 'starter_no_review',
    applies_to_plan: 'starter_system',
    rule_type: 'feature_blocked',
    blocked_feature_key: 'review_request_automation',
    suggested_plan: 'elite_system',
    message: 'Review Request Automation is available on the Elite plan.',
    is_active: true,
  },
  {
    rule_key: 'starter_no_reactivation',
    applies_to_plan: 'starter_system',
    rule_type: 'feature_blocked',
    blocked_feature_key: 'lead_reactivation',
    suggested_plan: 'elite_system',
    message: 'Lead Reactivation is available on the Elite plan. Upgrade to win back old opportunities.',
    is_active: true,
  },
  {
    rule_key: 'growth_no_review',
    applies_to_plan: 'growth_system',
    rule_type: 'feature_blocked',
    blocked_feature_key: 'review_request_automation',
    suggested_plan: 'elite_system',
    message: 'Review Request Automation is available on the Elite plan.',
    is_active: true,
  },
  {
    rule_key: 'growth_no_reactivation',
    applies_to_plan: 'growth_system',
    rule_type: 'feature_blocked',
    blocked_feature_key: 'lead_reactivation',
    suggested_plan: 'elite_system',
    message: 'Lead Reactivation is available on the Elite plan. Upgrade to unlock win-back campaigns.',
    is_active: true,
  },
  {
    rule_key: 'growth_no_voice',
    applies_to_plan: 'growth_system',
    rule_type: 'feature_blocked',
    blocked_feature_key: 'ai_voice_agent',
    suggested_plan: 'elite_system',
    message: 'AI Voice Agent is available on the Elite plan for inbound call handling and missed-call triaging.',
    is_active: true,
  },
];

// ─── Stripe → Plan Reference ─────────────────────────────────────────────────

export const STRIPE_MAPPING_REFERENCE = [
  // Starter System
  { stripe_product_id: 'prod_UReWMpnZsCnfcL', price_type: 'one_time',  amount_usd: 797,  mapped_plan: 'starter_system', notes: 'Starter one-time setup fee' },
  { stripe_product_id: 'prod_UReWMpnZsCnfcL', price_type: 'recurring', amount_usd: 497,  mapped_plan: 'starter_system', notes: 'Starter monthly retainer' },
  // Growth System
  { stripe_product_id: 'prod_UReWhZsWks1HuA', price_type: 'one_time',  amount_usd: 1297, mapped_plan: 'growth_system',  notes: 'Growth one-time setup fee' },
  { stripe_product_id: 'prod_UReWhZsWks1HuA', price_type: 'recurring', amount_usd: 997,  mapped_plan: 'growth_system',  notes: 'Growth monthly retainer' },
  // Elite System (prod_UReW1LmsVbn4BZ maps to elite — same as "Pro" in Stripe catalog)
  { stripe_product_id: 'prod_UReW1LmsVbn4BZ', price_type: 'one_time',  amount_usd: 2497, mapped_plan: 'elite_system',   notes: 'Elite one-time setup fee' },
  { stripe_product_id: 'prod_UReW1LmsVbn4BZ', price_type: 'recurring', amount_usd: 1997, mapped_plan: 'elite_system',   notes: 'Elite monthly retainer' },
];

// ─── Helper utilities ─────────────────────────────────────────────────────────

/** Returns feature keys for a given plan_type */
export function getPlanFeatures(planType) {
  return PLAN_FEATURE_MAPPING[planType]?.feature_keys || [];
}

/** Returns usage limits for a given plan_type */
export function getPlanUsageLimits(planType) {
  return PLAN_FEATURE_MAPPING[planType]?.usage_limits || {};
}

/** Checks if a feature_key is available on a given plan_type */
export function isPlanFeatureEnabled(planType, featureKey) {
  return getPlanFeatures(planType).includes(featureKey);
}

/** Returns active upgrade rules for a given plan_type */
export function getUpgradeRulesForPlan(planType) {
  return UPGRADE_LOGIC_RULES.filter(r => r.applies_to_plan === planType && r.is_active);
}

/** Returns the canonical plan_type for a given Stripe product ID */
export function getPlanFromStripeProduct(stripeProductId) {
  const match = STRIPE_MAPPING_REFERENCE.find(r => r.stripe_product_id === stripeProductId);
  return match?.mapped_plan || null;
}

/** Returns the upgrade path from one plan to the next tier */
export function getNextTierPlan(planType) {
  const current = PLAN_REGISTRY[planType];
  if (!current) return null;
  return Object.values(PLAN_REGISTRY).find(p => p.tier_order === current.tier_order + 1) || null;
}