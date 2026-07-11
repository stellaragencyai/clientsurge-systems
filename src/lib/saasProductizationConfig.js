import { PACKAGE_OFFERS, getPackageOffer } from "./salesCatalog.js";

/**
 * SaaS productization compatibility layer.
 *
 * Package pricing and included automations are derived from salesCatalog.js.
 * Usage limits, annual discounts, voice allowances, and guarantees are omitted
 * until they are explicitly approved and added to the canonical offer.
 */

export const PLAN_REGISTRY = Object.fromEntries(
  PACKAGE_OFFERS.map((offer, index) => [
    offer.package_key,
    {
      plan_type: offer.package_key,
      display_name: offer.name,
      tier_order: index + 1,
      setup_fee_usd: offer.setup_total,
      monthly_fee_usd: offer.monthly_total,
      description: offer.description,
      stripe_product_id: offer.stripe_product_id,
      setup_price_id: offer.setup_price_id,
      monthly_price_id: offer.monthly_price_id,
    },
  ])
);

export const PLAN_FEATURE_MAPPING = Object.fromEntries(
  PACKAGE_OFFERS.map((offer) => [
    offer.package_key,
    {
      plan_type: offer.package_key,
      feature_keys: [...offer.included_service_keys],
      feature_names: offer.included_services.map((service) => service.name),
      usage_limits: {},
    },
  ])
);

export const UPGRADE_LOGIC_RULES = [
  {
    rule_key: "starter_no_nurture",
    applies_to_plan: "starter_system",
    rule_type: "feature_blocked",
    blocked_feature_key: "nurture_sequence_14d",
    suggested_plan: "growth_system",
    message: "14-Day Nurture Sequence is included in the Growth System.",
    is_active: true,
  },
  {
    rule_key: "starter_no_booking",
    applies_to_plan: "starter_system",
    rule_type: "feature_blocked",
    blocked_feature_key: "ai_booking_agent",
    suggested_plan: "growth_system",
    message: "AI Booking Agent is included in the Growth System.",
    is_active: true,
  },
  {
    rule_key: "starter_no_reactivation",
    applies_to_plan: "starter_system",
    rule_type: "feature_blocked",
    blocked_feature_key: "lead_reactivation",
    suggested_plan: "pro_system",
    message: "Old Lead Reactivation is included in the Pro System.",
    is_active: true,
  },
  {
    rule_key: "starter_no_review",
    applies_to_plan: "starter_system",
    rule_type: "feature_blocked",
    blocked_feature_key: "review_request",
    suggested_plan: "pro_system",
    message: "Review Request Automation is included in the Pro System.",
    is_active: true,
  },
  {
    rule_key: "growth_no_reactivation",
    applies_to_plan: "growth_system",
    rule_type: "feature_blocked",
    blocked_feature_key: "lead_reactivation",
    suggested_plan: "pro_system",
    message: "Old Lead Reactivation is included in the Pro System.",
    is_active: true,
  },
  {
    rule_key: "growth_no_review",
    applies_to_plan: "growth_system",
    rule_type: "feature_blocked",
    blocked_feature_key: "review_request",
    suggested_plan: "pro_system",
    message: "Review Request Automation is included in the Pro System.",
    is_active: true,
  },
];

export const STRIPE_MAPPING_REFERENCE = PACKAGE_OFFERS.flatMap((offer) => [
  {
    stripe_product_id: offer.stripe_product_id,
    stripe_price_id: offer.setup_price_id,
    price_type: "one_time",
    amount_usd: offer.setup_total,
    mapped_plan: offer.package_key,
    notes: `${offer.name} setup and installation`,
  },
  {
    stripe_product_id: offer.stripe_product_id,
    stripe_price_id: offer.monthly_price_id,
    price_type: "recurring",
    amount_usd: offer.monthly_total,
    mapped_plan: offer.package_key,
    notes: `${offer.name} monthly support`,
  },
]);

export function getPlanFeatures(planType) {
  return PLAN_FEATURE_MAPPING[planType]?.feature_keys || [];
}

export function getPlanFeatureNames(planType) {
  return PLAN_FEATURE_MAPPING[planType]?.feature_names || [];
}

export function getPlanUsageLimits(planType) {
  return PLAN_FEATURE_MAPPING[planType]?.usage_limits || {};
}

export function isPlanFeatureEnabled(planType, featureKey) {
  return getPlanFeatures(planType).includes(featureKey);
}

export function getUpgradeRulesForPlan(planType) {
  return UPGRADE_LOGIC_RULES.filter(
    (rule) => rule.applies_to_plan === planType && rule.is_active
  );
}

export function getPlanFromStripeProduct(stripeProductId) {
  return PACKAGE_OFFERS.find((offer) => offer.stripe_product_id === stripeProductId)?.package_key || null;
}

export function getNextTierPlan(planType) {
  const current = getPackageOffer(planType);
  if (!current) return null;
  const currentIndex = PACKAGE_OFFERS.findIndex((offer) => offer.package_key === current.package_key);
  const next = PACKAGE_OFFERS[currentIndex + 1];
  return next ? PLAN_REGISTRY[next.package_key] : null;
}
