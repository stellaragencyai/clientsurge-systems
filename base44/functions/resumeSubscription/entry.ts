import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAuthenticatedUser } from "../_shared/authGuards.js";
import {
  buildResumeCollectionParams,
  canManageBillingOrder,
} from "../_shared/subscriptionPauseResume.js";

async function stripeUpdateSubscription(subscriptionId, params) {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Stripe subscription resume failed (${response.status})`);
  }
  return data;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await requireAuthenticatedUser(base44);
    const payload = await req.json().catch(() => ({}));
    const { order_id, reason = "client_request" } = payload;

    if (!order_id) {
      return Response.json({ error: "order_id required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }
    if (!canManageBillingOrder({ user, order })) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!order.stripe_subscription_id) {
      return Response.json({ error: "Order has no Stripe subscription" }, { status: 400 });
    }

    const stripeSubscription = await stripeUpdateSubscription(
      order.stripe_subscription_id,
      buildResumeCollectionParams()
    );
    const now = new Date().toISOString();
    const nextStatus = stripeSubscription.status || "active";

    await base44.asServiceRole.entities.Order.update(order_id, {
      billing_status: nextStatus,
      subscription_status: nextStatus,
      subscription_resumed_at: now,
      subscription_pause_resumes_at: null,
    });

    if (order.subscription_id) {
      await base44.asServiceRole.entities.Subscription.update(order.subscription_id, {
        status: nextStatus === "active" || nextStatus === "trialing" ? "active" : nextStatus,
        resumed_at: now,
        pause_resumes_at: null,
        updated_at: now,
      }).catch(() => null);
    }

    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id,
      client_id: order.client_id || null,
      context_type: "billing",
      context_id: order_id,
      channel: "internal",
      direction: "system",
      event_type: "status_update",
      provider: "stripe",
      status: "processed",
      subject: "Subscription payment collection resumed",
      message_body: "Subscription payment collection resumed for future invoices.",
      metadata_json: JSON.stringify({
        stripe_subscription_id: order.stripe_subscription_id,
        stripe_status: stripeSubscription.status || null,
        reason,
        actor_email: user.email || null,
      }),
    }).catch(() => null);

    return Response.json({
      success: true,
      order_id,
      stripe_subscription_id: order.stripe_subscription_id,
      billing_status: nextStatus,
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[resumeSubscription] Error:", error.message);
    return Response.json({ error: error.message || "Failed to resume subscription" }, { status: 500 });
  }
});
