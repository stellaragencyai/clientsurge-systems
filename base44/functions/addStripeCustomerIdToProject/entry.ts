import { secureJson } from "../_shared/response.ts";
/**
 * addStripeCustomerIdToProject.ts — #209
 * Ensures ClientOnboarding (ClientProject) has stripe_customer_id
 * from the linked Order for portal billing lookups.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order?.stripe_customer_id || !order?.client_email) {
      return secureJson({ skipped: true, reason: "No stripe_customer_id or email on order" });
    }

    const projects = await base44.asServiceRole.entities.ClientOnboarding
      .filter({ email: order.client_email }).catch(() => []);

    let updated = 0;
    for (const p of (projects || [])) {
      if (!p.stripe_customer_id) {
        await base44.asServiceRole.entities.ClientOnboarding.update(p.id, {
          stripe_customer_id: order.stripe_customer_id,
        }).catch(() => {});
        updated++;
      }
    }

    return secureJson({ success: true, updated, order_id });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
