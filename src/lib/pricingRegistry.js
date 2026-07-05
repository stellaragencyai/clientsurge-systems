/**
 * Pricing Registry — Single Source of Truth
 * Fixes Audit Issue #1: Dual pricing source of truth
 *
 * All pricing displays and checkout flows should import from this file.
 * When Stripe prices change, update ONLY this file.
 *
 * Stripe Product IDs (Live Mode):
 * - Starter: prod_UReWMpnZsCnfcL — $797 setup + $497/month
 * - Growth:  prod_UReWhZsWks1HuA — $1,297 setup + $997/month
 * - Pro:     prod_UReW1LmsVbn4BZ — $2,497 setup + $1,997/month
 */

export const STRIPE_PRODUCTS = {
  starter: {
    slug: "starter",
    name: "Starter System",
    product_id: "prod_UReWMpnZsCnfcL",
    setup_price: 797,
    monthly_price: 497,
    annual_monthly_price: 398, // ~20% off
    setup_price_id: "price_1Ri5P500CH0JD3eZvQXfnJgY", // one-time $797
    monthly_price_id: "price_1Ri5P500CH0JD3eZvQXfnJgZ", // recurring $497/mo
    is_recommended: false,
    max_leads_per_month: 50,
    max_sms_per_month: 500,
    automation_sequences: 3,
    ai_voice_minutes: 0,
    color: "#6B7280",
    features: [
      "Up to 50 leads/month",
      "Instant lead response SMS",
      "Missed call text-back",
      "3 automation sequences",
      "Basic email follow-up",
      "Client portal access",
    ],
  },
  growth: {
    slug: "growth",
    name: "Growth System",
    product_id: "prod_UReWhZsWks1HuA",
    setup_price: 1297,
    monthly_price: 997,
    annual_monthly_price: 798,
    setup_price_id: "price_1Ri5P500CH0JD3eZvQXfnJgW",
    monthly_price_id: "price_1Ri5P500CH0JD3eZvQXfnJgX",
    is_recommended: true,
    max_leads_per_month: 250,
    max_sms_per_month: 2500,
    automation_sequences: 6,
    ai_voice_minutes: 120,
    color: "#00AEEF",
    features: [
      "Up to 250 leads/month",
      "Everything in Starter",
      "14-day nurture sequence",
      "AI booking agent",
      "Review request engine",
      "Lead reactivation",
      "2 hours AI voice/month",
    ],
  },
  pro: {
    slug: "pro",
    name: "Pro System",
    product_id: "prod_UReW1LmsVbn4BZ",
    setup_price: 2497,
    monthly_price: 1997,
    annual_monthly_price: 1598,
    setup_price_id: "price_1Ri5P500CH0JD3eZvQXfnJgU",
    monthly_price_id: "price_1Ri5P400CH0JD3eZvQXfnJgV",
    is_recommended: false,
    max_leads_per_month: 1000,
    max_sms_per_month: 10000,
    automation_sequences: 12,
    ai_voice_minutes: 500,
    color: "#003B8F",
    features: [
      "Up to 1,000 leads/month",
      "Everything in Growth",
      "AI voice receptionist",
      "Live call transcription",
      "Voice broadcasts",
      "Priority support",
      "10 hours AI voice/month",
    ],
  },
};

export const PRICING_TIERS = Object.values(STRIPE_PRODUCTS);

/**
 * Get a pricing tier by slug.
 * @param {string} slug - "starter", "growth", or "pro"
 * @returns {object|null}
 */
export function getPricingTier(slug) {
  return STRIPE_PRODUCTS[slug?.toLowerCase()] || null;
}

/**
 * Get the Stripe price ID for a given tier and billing period.
 * @param {string} slug - tier slug
 * @param {"setup"|"monthly"|"annual"} period
 * @returns {string|null}
 */
export function getStripePriceId(slug, period = "monthly") {
  const tier = getPricingTier(slug);
  if (!tier) return null;

  switch (period) {
    case "setup":
      return tier.setup_price_id;
    case "monthly":
      return tier.monthly_price_id;
    case "annual":
      return tier.monthly_price_id; // Uses annual_monthly_price with annual billing cycle
    default:
      return tier.monthly_price_id;
  }
}

/**
 * Get the monthly price for a tier, optionally with annual billing.
 * @param {string} slug
 * @param {"monthly"|"annual"} billingCycle
 * @returns {number}
 */
export function getMonthlyPrice(slug, billingCycle = "monthly") {
  const tier = getPricingTier(slug);
  if (!tier) return 0;
  return billingCycle === "annual" ? tier.annual_monthly_price : tier.monthly_price;
}

/**
 * Calculate the setup fee with optional promo discount.
 * @param {string} slug
 * @param {number} discountPercent - 0-100
 * @returns {number}
 */
export function getSetupPrice(slug, discountPercent = 0) {
  const tier = getPricingTier(slug);
  if (!tier) return 0;
  const discount = Math.min(100, Math.max(0, discountPercent));
  return Math.round(tier.setup_price * (1 - discount / 100));
}

/**
 * Format a price as USD currency.
 * @param {number} amount
 * @returns {string}
 */
export function formatPrice(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate projected monthly revenue recovery for ROI display.
 * @param {number} monthlyInquiries
 * @param {number} missedResponseRate - 0-100, % of inquiries that go unanswered
 * @param {number} avgTicketValue
 * @returns {object}
 */
export function calculateROI(monthlyInquiries, missedResponseRate, avgTicketValue) {
  const missed = Math.round(monthlyInquiries * (missedResponseRate / 100));
  const recovered = Math.round(missed * 0.78); // 78% recovery rate
  const monthlyRecovery = recovered * avgTicketValue;
  const annualRecovery = monthlyRecovery * 12;
  return {
    missed_leads: missed,
    recovered_leads: recovered,
    monthly_recovery: monthlyRecovery,
    annual_recovery: annualRecovery,
  };
}