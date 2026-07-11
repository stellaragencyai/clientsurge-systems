import { PACKAGE_OFFERS, getPackageOffer } from "./salesCatalog.js";

/**
 * Compatibility pricing registry.
 *
 * The authoritative package names, inclusions, Stripe IDs, and prices live in
 * salesCatalog.js. This module only preserves the older helper API so legacy
 * imports cannot create a second pricing source of truth.
 *
 * No annual discount, usage allowance, voice allowance, or guarantee is
 * published here unless it is explicitly added to the canonical sales catalog.
 */

function toLegacyTier(offer) {
  return {
    slug: offer.package_key.replace(/_system$/, ""),
    package_key: offer.package_key,
    name: offer.name,
    product_id: offer.stripe_product_id,
    setup_price: offer.setup_total,
    monthly_price: offer.monthly_total,
    annual_monthly_price: null,
    setup_price_id: offer.setup_price_id,
    monthly_price_id: offer.monthly_price_id,
    is_recommended: offer.package_key === "growth_system",
    max_leads_per_month: null,
    max_sms_per_month: null,
    automation_sequences: offer.included_service_keys.length,
    ai_voice_minutes: null,
    features: offer.included_services.map((service) => service.name),
  };
}

export const STRIPE_PRODUCTS = Object.fromEntries(
  PACKAGE_OFFERS.map((offer) => [offer.package_key.replace(/_system$/, ""), toLegacyTier(offer)])
);

export const PRICING_TIERS = Object.values(STRIPE_PRODUCTS);

export function getPricingTier(slug) {
  const normalized = String(slug || "").trim().toLowerCase();
  if (!normalized) return null;
  const canonicalOffer = getPackageOffer(normalized);
  return STRIPE_PRODUCTS[normalized] || (canonicalOffer ? toLegacyTier(canonicalOffer) : null);
}

export function getStripePriceId(slug, period = "monthly") {
  const tier = getPricingTier(slug);
  if (!tier) return null;
  if (period === "setup") return tier.setup_price_id;
  if (period === "monthly") return tier.monthly_price_id;
  return null;
}

export function getMonthlyPrice(slug, billingCycle = "monthly") {
  const tier = getPricingTier(slug);
  if (!tier || billingCycle !== "monthly") return null;
  return tier.monthly_price;
}

export function getSetupPrice(slug, discountPercent = 0) {
  const tier = getPricingTier(slug);
  if (!tier) return 0;
  const discount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  return Math.round(tier.setup_price * (1 - discount / 100));
}

export function formatPrice(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

/**
 * Scenario calculator only. It never supplies an unverified recovery rate.
 */
export function calculateROI(monthlyInquiries, missedResponseRate, avgTicketValue, recoveryRate = 0) {
  const inquiries = Math.max(0, Number(monthlyInquiries) || 0);
  const missedRate = Math.min(100, Math.max(0, Number(missedResponseRate) || 0)) / 100;
  const recoveredRate = Math.min(100, Math.max(0, Number(recoveryRate) || 0)) / 100;
  const ticket = Math.max(0, Number(avgTicketValue) || 0);
  const missed = Math.round(inquiries * missedRate);
  const recovered = Math.round(missed * recoveredRate);
  const monthlyRecovery = recovered * ticket;

  return {
    missed_leads: missed,
    recovered_leads: recovered,
    monthly_recovery: monthlyRecovery,
    annual_recovery: monthlyRecovery * 12,
    recovery_rate_assumption: recoveredRate * 100,
  };
}
