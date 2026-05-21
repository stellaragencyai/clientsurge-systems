/**
 * resumeSubscription — #529
 * Admin-only Stripe pause_collection resume wrapper plus local audit state.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { buildCommunicationEvent } from "../_shared/installPipeline.js";
import { stripeRequest } from "../shared/stripeInit.ts";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function findSubscriptionRecord(base44: any, order: any) {
  if (order.subscription_id) {
    const byId = await base44.asServiceRole.entities.Subscription.get(order.subscription_id).catch(() => null);
    if (byId) return byId;
  }

  if (order.stripe_subscription_id) {
    const matches = await base44.asServiceRole.entities.Subscription.filter({
      stripe_subscription_id: order.stripe_subscription_id,
    }).catch(() => []);
    return matches?.[0] || null;
  }

  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await requireAdminUser(base44);
    const { order_id, note = "operator_resume" } = await req.json().catch(() => ({}));

    if (!order_id) {
      return Response.json({ error: "order_id required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.stripe_subscription_id) {
      return Response.json({ error: "No Stripe subscription on order" }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.set("pause_collection", "");

    const stripeSubscription = await stripeRequest(
      `/subscriptions/${order.stripe_subscription_id}`,
      params.toString()
    );
    const now = new Date().toISOString();
    const subscriptionRecord = await findSubscriptionRecord(base44, order);
    const nextStatus = stripeSubscription.status || order.subscription_status || "active";

    const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
      billing_status: nextStatus,
      subscription_status: nextStatus,
      subscription_pause_behavior: null,
      subscription_pause_reason: null,
      subscription_paused_at: null,
      subscription_pause_resumes_at: null,
      subscription_resumed_at: now,
      last_billing_event_at: now,
    });

    if (subscriptionRecord?.id) {
      await base44.asServiceRole.entities.Subscription.update(subscriptionRecord.id, {
        status: nextStatus,
        pause_collection_behavior: null,
        pause_collection_reason: null,
        pause_collection_resumes_at: null,
        paused_collection_at: null,
        resumed_collection_at: now,
        updated_at: now,
      });
    }

    await base44.asServiceRole.entities.CommunicationEvent.create(
      buildCommunicationEvent({
        order: updatedOrder,
        event_type: "status_update",
        provider: "stripe",
        status: "processed",
        subject: "Subscription payment collection resumed",
        message_body: `Admin ${user.email || user.id || "operator"} resumed payment collection.`,
        metadata: {
          context_type: "subscription_resume",
          stripe_subscription_id: order.stripe_subscription_id,
          note: cleanString(note) || "operator_resume",
        },
      })
    );

    return Response.json({
      success: true,
      order_id: order.id,
      stripe_subscription_id: order.stripe_subscription_id,
      stripe_status: nextStatus,
      pause_collection: stripeSubscription.pause_collection || null,
    });
  } catch (err: any) {
    if (err instanceof AuthGuardError) {
      return Response.json({ error: err.message, code: err.code }, { status: err.status });
    }

    return Response.json({ error: err.message }, { status: 500 });
  }
});
