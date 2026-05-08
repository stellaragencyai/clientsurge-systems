/**
 * tierServiceMap.ts — #411a
 * TIER_SERVICE_MAP as a shared constant accessible by both installPipeline
 * and configureService. Single source of truth.
 */

export const TIER_SERVICE_MAP: Record<string, string[]> = {
  starter: [
    "instant_response",
    "missed_call_textback",
  ],
  growth: [
    "instant_response",
    "missed_call_textback",
    "followup_sequences",
    "appointment_booking_ai",
  ],
  elite: [
    "instant_response",
    "missed_call_textback",
    "followup_sequences",
    "appointment_booking_ai",
    "review_request_ai",
    "reactivation_campaign",
  ],
};

export function getServicesForTier(package_key: string): string[] {
  return TIER_SERVICE_MAP[package_key] ?? TIER_SERVICE_MAP.starter;
}

export function isServiceAllowedForTier(service_key: string, package_key: string): boolean {
  return getServicesForTier(package_key).includes(service_key);
}
