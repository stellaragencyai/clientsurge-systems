/**
 * classifyPurchasedPackage — #402 #402a
 * Reads selected_service_keys[] from à la carte orders and maps to a package tier.
 * Also defines TIER_SERVICE_MAP canonical service key lists per tier.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

// #402a: TIER_SERVICE_MAP — canonical service keys per tier
export const TIER_SERVICE_MAP = {
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

// Classify which tier best matches a given set of service keys
export function classifyPackageFromServices(service_keys = []) {
  const keys = new Set(service_keys);
  const eliteKeys = new Set(TIER_SERVICE_MAP.elite);
  const growthKeys = new Set(TIER_SERVICE_MAP.growth);
  const starterKeys = new Set(TIER_SERVICE_MAP.starter);

  const hasAll = (set) => [...set].every(k => keys.has(k));

  if (hasAll(eliteKeys)) return "elite";
  if (hasAll(growthKeys)) return "growth";
  if (hasAll(starterKeys)) return "starter";
  // fallback: count matches
  const eliteScore = [...eliteKeys].filter(k => keys.has(k)).length;
  const growthScore = [...growthKeys].filter(k => keys.has(k)).length;
  if (eliteScore >= 5) return "elite";
  if (growthScore >= 3) return "growth";
  return "starter";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, service_keys } = await req.json();

    let keys = service_keys;
    if (!keys && order_id) {
      const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
      keys = order?.selected_service_keys || [];
      // #401b: fallback — if metadata.package_key missing, derive from service keys
      if (!order?.package_key && keys.length > 0) {
        const derived = classifyPackageFromServices(keys);
        await base44.asServiceRole.entities.Order.update(order_id, { package_key: derived });
        console.log('[classifyPurchasedPackage] Derived package_key:', derived, 'for order:', order_id);
      }
    }

    const package_key = classifyPackageFromServices(keys || []);
    return Response.json({ success: true, package_key, service_keys: keys, tier_services: TIER_SERVICE_MAP[package_key] });
  } catch (err) {
    console.error('[classifyPurchasedPackage]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
