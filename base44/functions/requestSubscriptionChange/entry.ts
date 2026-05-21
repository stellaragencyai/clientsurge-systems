import { secureJson } from "../_shared/response.ts";
/**
 * requestSubscriptionChange — #149 #207
 * Uses proration_behavior: "create_prorations" on Stripe plan change.
 * Also returns proration preview before committing.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { stripeRequest } from "../shared/stripeInit.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, new_price_id, preview_only = true } = await req.json();
    if (!order_id || !new_price_id) return secureJson({ error: "order_id and new_price_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order?.stripe_subscription_id) return secureJson({ error: "No Stripe subscription on order" }, { status: 400 });

    // Get current sub to find item ID
    const sub = await stripeRequest(`/subscriptions/${order.stripe_subscription_id}`, undefined, "GET");
    const itemId = sub?.items?.data?.[0]?.id;
    if (!itemId) return secureJson({ error: "No subscription item found" }, { status: 400 });

    if (preview_only) {
      // #207: proration preview
      const preview = await stripeRequest(
        `/invoices/upcoming?subscription=${order.stripe_subscription_id}&subscription_items[0][id]=${itemId}&subscription_items[0][price]=${new_price_id}&subscription_proration_behavior=create_prorations`,
        undefined, "GET"
      );
      const prorationAmount = (preview?.lines?.data || [])
        .filter((l: any) => l.proration)
        .reduce((s: number, l: any) => s + l.amount, 0);
      return secureJson({ success: true, preview: true, proration_cents: prorationAmount, proration_dollars: prorationAmount / 100 });
    }

    // Commit change
    const updated = await stripeRequest(
      `/subscriptions/${order.stripe_subscription_id}`,
      `items[0][id]=${itemId}&items[0][price]=${new_price_id}&proration_behavior=create_prorations`
    );

    return secureJson({ success: true, subscription_id: updated.id, status: updated.status });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
