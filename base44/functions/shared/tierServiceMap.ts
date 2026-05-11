/**
 * Canonical package → service mapping.
 * Accepts legacy aliases at runtime, but always resolves to the canonical
 * package keys used by salesCatalog.js and the checkout flow.
 */

export const CANONICAL_TIER_SERVICE_MAP: Record<string, string[]> = {
  starter_system: [
    "instant_lead_response",
    "ai_booking_agent",
  ],
  growth_system: [
    "instant_lead_response",
    "missed_call_text_back",
    "nurture_sequence_14d",
    "ai_booking_agent",
  ],
  elite_system: [
    "instant_lead_response",
    "missed_call_text_back",
    "nurture_sequence_14d",
    "ai_booking_agent",
    "lead_reactivation",
    "review_request",
  ],
};

const PACKAGE_KEY_ALIASES: Record<string, string> = {
  starter: "starter_system",
  starter_system: "starter_system",
  growth: "growth_system",
  growth_system: "growth_system",
  elite: "elite_system",
  elite_system: "elite_system",
  pro: "elite_system",
  pro_system: "elite_system",
};

export function normalizePackageKey(packageKey: string): string {
  const normalized = String(packageKey || "").trim().toLowerCase();
  return PACKAGE_KEY_ALIASES[normalized] || "starter_system";
}

export function getServicesForTier(package_key: string): string[] {
  return CANONICAL_TIER_SERVICE_MAP[normalizePackageKey(package_key)] ?? CANONICAL_TIER_SERVICE_MAP.starter_system;
}

export function isServiceAllowedForTier(service_key: string, package_key: string): boolean {
  return getServicesForTier(package_key).includes(service_key);
}
