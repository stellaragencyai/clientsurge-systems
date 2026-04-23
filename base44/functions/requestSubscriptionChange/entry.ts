import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";
import { buildSubscriptionSummary, requestSubscriptionChange } from "../_shared/subscriptionSync.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const requestType = payload?.request_type;
    const requestedPlanType = payload?.requested_plan_type || "";

    if (!["upgrade", "downgrade", "cancel"].includes(requestType)) {
      return Response.json({ error: "Valid request_type is required" }, { status: 400 });
    }

    const resolution = await resolveClientPortalAccess({
      base44,
      userEmail: user.email,
    });

    if (resolution.status !== "resolved" || !resolution.order) {
      return Response.json({ error: "No subscription-backed order found for this account" }, { status: 404 });
    }

    const order = resolution.order;
    const subscription =
      (order.subscription_id
        ? await base44.asServiceRole.entities.Subscription.get(order.subscription_id).catch(() => null)
        : null) ||
      ((order.stripe_subscription_id
        ? await base44.asServiceRole.entities.Subscription.filter({
            stripe_subscription_id: order.stripe_subscription_id,
          })
        : []) || [])[0] ||
      null;

    if (!subscription) {
      return Response.json({ error: "No active subscription record is linked to this order" }, { status: 404 });
    }

    const updated = await requestSubscriptionChange({
      base44,
      subscription,
      order,
      requestType,
      requestedPlanType,
      requestedByEmail: user.email,
    });

    return Response.json({
      success: true,
      subscription: buildSubscriptionSummary(updated),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to request subscription change";
    return Response.json({ error: message }, { status: 500 });
  }
});
