import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * classifyPurchasedPackage — #402 #402a #402c
 * FIX: TIER_SERVICE_MAP keys were completely wrong (used legacy aliases not canonical service_keys).
 * Now aligned with canonical service_keys from createCheckoutSession.js.
 */

// Canonical TIER_SERVICE_MAP aligned with salesCatalog canonical service_keys
export const TIER_SERVICE_MAP = {
  starter_system: [
    "instant_lead_response",
    "missed_call_text_back",
  ],
  growth_system: [
    "instant_lead_response",
    "missed_call_text_back",
    "nurture_sequence_14d",
    "ai_booking_agent",
  ],
  pro_system: [
    "instant_lead_response",
    "missed_call_text_back",
    "nurture_sequence_14d",
    "ai_booking_agent",
    "lead_reactivation",
    "review_request",
  ],
};

// Legacy tier aliases for backward compatibility
export const TIER_ALIASES = {
  starter: "starter_system",
  growth: "growth_system",
  elite: "pro_system",
  elite_system: "pro_system",
  pro: "pro_system",
};

export function classifyPackageFromServices(service_keys = []) {
  const keys = new Set(service_keys);
  const proSet = new Set(TIER_SERVICE_MAP.pro_system);
  const growthSet = new Set(TIER_SERVICE_MAP.growth_system);
  const starterSet = new Set(TIER_SERVICE_MAP.starter_system);
  const hasAll = (set) => [...set].every(k => keys.has(k));

  if (hasAll(proSet)) return "pro_system";
  if (hasAll(growthSet)) return "growth_system";
  if (hasAll(starterSet)) return "starter_system";

  // Fallback: score-based classification
  const proScore = [...proSet].filter(k => keys.has(k)).length;
  const growthScore = [...growthSet].filter(k => keys.has(k)).length;
  if (proScore >= 5) return "pro_system";
  if (growthScore >= 3) return "growth_system";
  return "starter_system";
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { order_id, service_keys } = body;

    let keys = Array.isArray(service_keys) ? service_keys : null;
    let derivedForOrder = false;

    if (!keys && order_id) {
      const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
      // Derive from items[].service_key or pricing_summary.selected_service_keys
      keys = order?.items?.map(i => i.service_key).filter(Boolean)
          || order?.pricing_summary?.selected_service_keys
          || [];

      // #401b: If package_key is missing, derive and write back to Order
      if (order && !order.package_key && keys.length > 0) {
        const derived = classifyPackageFromServices(keys);
        await base44.asServiceRole.entities.Order.update(order_id, { package_key: derived }).catch(() => {});
        derivedForOrder = true;
        console.log('[classifyPurchasedPackage] Derived + wrote package_key:', derived, 'for order:', order_id);
      }
    }

    const package_key = classifyPackageFromServices(keys || []);

    // #402c: Log classification decision for audit trail
    if (order_id) {
      base44.asServiceRole.entities.CommunicationEvent.create({
        channel: "internal",
        direction: "system",
        event_type: "status_update",
        provider: "internal",
        status: "processed",
        order_id,
        subject: `Package classified: ${package_key}`,
        message_body: `Service keys: ${(keys || []).join(", ")} | Auto-derived: ${derivedForOrder}`,
        environment: "production",
      }).catch(() => {});
    }

    return json({
      success: true,
      package_key,
      service_keys: keys,
      tier_services: TIER_SERVICE_MAP[package_key],
    });
  } catch (err) {
    console.error('[classifyPurchasedPackage]', err.message);
    return json({ error: err.message }, 500);
  }
});