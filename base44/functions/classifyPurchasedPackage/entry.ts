/**
 * classifyPurchasedPackage — #402 #402a #402b #402c
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
export function analyzePackageFromServices(service_keys = []) {
  const keys = new Set(service_keys);
  const eliteKeys = new Set(TIER_SERVICE_MAP.elite);
  const growthKeys = new Set(TIER_SERVICE_MAP.growth);
  const starterKeys = new Set(TIER_SERVICE_MAP.starter);
  const selectedCount = keys.size;

  const hasAll = (set) => [...set].every(k => keys.has(k));

  if (hasAll(eliteKeys)) {
    return {
      package_key: "elite",
      needs_admin_review: false,
      reasoning: "All Elite service keys are present.",
      selected_count: selectedCount,
    };
  }
  if (hasAll(growthKeys)) {
    return {
      package_key: "growth",
      needs_admin_review: false,
      reasoning: "All Growth service keys are present.",
      selected_count: selectedCount,
    };
  }
  if (hasAll(starterKeys) && selectedCount <= 2) {
    return {
      package_key: "starter",
      needs_admin_review: false,
      reasoning: "Starter service set is complete and no higher-tier services were selected.",
      selected_count: selectedCount,
    };
  }

  if (selectedCount === 5) {
    return {
      package_key: "elite",
      needs_admin_review: true,
      reasoning: "Five services selected: map to Elite minus one and flag for admin review.",
      selected_count: selectedCount,
    };
  }
  if (selectedCount === 3) {
    return {
      package_key: "growth",
      needs_admin_review: false,
      reasoning: "Three services selected: map to Growth as the nearest activation tier.",
      selected_count: selectedCount,
    };
  }

  // fallback: count matches
  const eliteScore = [...eliteKeys].filter(k => keys.has(k)).length;
  const growthScore = [...growthKeys].filter(k => keys.has(k)).length;
  if (eliteScore >= 5) {
    return {
      package_key: "elite",
      needs_admin_review: true,
      reasoning: `Matched ${eliteScore} Elite services; mapped to Elite and flagged for review because the selected set is incomplete.`,
      selected_count: selectedCount,
    };
  }
  if (growthScore >= 3) {
    return {
      package_key: "growth",
      needs_admin_review: false,
      reasoning: `Matched ${growthScore} Growth services; mapped to Growth.`,
      selected_count: selectedCount,
    };
  }
  return {
    package_key: "starter",
    needs_admin_review: false,
    reasoning: "Selected services are closest to Starter.",
    selected_count: selectedCount,
  };
}

export function classifyPackageFromServices(service_keys = []) {
  return analyzePackageFromServices(service_keys).package_key;
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
        const derived = analyzePackageFromServices(keys);
        await base44.asServiceRole.entities.Order.update(order_id, {
          package_key: derived.package_key,
          package_type: derived.package_key,
          package_classification_review_required: derived.needs_admin_review,
        });
        console.log('[classifyPurchasedPackage] Derived package_key:', derived.package_key, 'for order:', order_id);
      }
    }

    const analysis = analyzePackageFromServices(keys || []);

    if (order_id) {
      await base44.asServiceRole.entities.AgentLog.create({
        agent_name: "classifyPurchasedPackage",
        log_type: "info",
        summary: `Package classified as ${analysis.package_key}`,
        details: JSON.stringify({
          order_id,
          service_keys: keys || [],
          reasoning: analysis.reasoning,
          needs_admin_review: analysis.needs_admin_review,
        }),
        service: "stripe",
        requires_nolan: analysis.needs_admin_review,
        resolved: !analysis.needs_admin_review,
      }).catch(() => {});
    }

    return Response.json({
      success: true,
      package_key: analysis.package_key,
      package_type: analysis.package_key,
      service_keys: keys,
      tier_services: TIER_SERVICE_MAP[analysis.package_key],
      needs_admin_review: analysis.needs_admin_review,
      reasoning: analysis.reasoning,
    });
  } catch (err) {
    console.error('[classifyPurchasedPackage]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
