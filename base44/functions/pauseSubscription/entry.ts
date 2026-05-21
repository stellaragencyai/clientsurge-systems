import { secureJson } from "../_shared/response.ts";
/**
 * pauseSubscription — #529
 * Admin-only pause-collection wrapper for Stripe subscriptions plus local audit state.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { buildCommunicationEvent } from "../_shared/installPipeline.js";
import { stripeRequest } from "../shared/stripeInit.ts";

const PAUSE_BEHAVIORS = new Set(["void", "keep_as_draft", "mark_uncollectible"]);

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePauseBehavior(value: unknown): string {
  const normalized = cleanString(value) || "void";
  return PAUSE_BEHAVIORS.has(normalized) ? normalized : "";
}

function normalizeResumesAt(value: unknown): { unix: string; iso: string | null } {
  if (!value) {
    return { unix: "", iso: null };
  }

  const date = typeof value === "number"
    ? new Date(value * 1000)
    : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return { unix: "", iso: null };
  }

  return {
    unix: String(Math.floor(date.getTime() / 1000)),
    iso: date.toISOString(),
  };
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
    const {
      order_id,
      reason = "operator_pause",
      behavior,
      resumes_at,
    } = await req.json().catch(() => ({}));

    if (!order_id) {
      return secureJson({ error: "order_id required" }, { status: 400 });
    }

    const pauseBehavior = normalizePauseBehavior(behavior);
    if (!pauseBehavior) {
      return secureJson({ error: "Invalid pause behavior" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) {
      return secureJson({ error: "Order not found" }, { status: 404 });
    }

    if (!order.stripe_subscription_id) {
      return secureJson({ error: "No Stripe subscription on order" }, { status: 400 });
    }

    const resumeAt = normalizeResumesAt(resumes_at);
    const params = new URLSearchParams();
    params.set("pause_collection[behavior]", pauseBehavior);
    if (resumeAt.unix) {
      params.set("pause_collection[resumes_at]", resumeAt.unix);
    }

    const stripeSubscription = await stripeRequest(
      `/subscriptions/${order.stripe_subscription_id}`,
      params.toString()
    );
    const now = new Date().toISOString();
    const subscriptionRecord = await findSubscriptionRecord(base44, order);

    const orderPatch = {
      billing_status: "paused_collection",
      subscription_status: stripeSubscription.status || order.subscription_status || "active",
      subscription_pause_behavior: pauseBehavior,
      subscription_pause_reason: cleanString(reason) || "operator_pause",
      subscription_paused_at: now,
      subscription_pause_resumes_at: resumeAt.iso,
      last_billing_event_at: now,
    };

    const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, orderPatch);

    if (subscriptionRecord?.id) {
      await base44.asServiceRole.entities.Subscription.update(subscriptionRecord.id, {
        status: stripeSubscription.status || subscriptionRecord.status || "active",
        pause_collection_behavior: pauseBehavior,
        pause_collection_reason: cleanString(reason) || "operator_pause",
        pause_collection_resumes_at: resumeAt.iso,
        paused_collection_at: now,
        updated_at: now,
      });
    }

    await base44.asServiceRole.entities.CommunicationEvent.create(
      buildCommunicationEvent({
        order: updatedOrder,
        event_type: "status_update",
        provider: "stripe",
        status: "processed",
        subject: "Subscription payment collection paused",
        message_body: `Admin ${user.email || user.id || "operator"} paused payment collection using ${pauseBehavior}.`,
        metadata: {
          context_type: "subscription_pause",
          stripe_subscription_id: order.stripe_subscription_id,
          behavior: pauseBehavior,
          reason: cleanString(reason) || "operator_pause",
          resumes_at: resumeAt.iso,
        },
      })
    );

    return secureJson({
      success: true,
      order_id: order.id,
      stripe_subscription_id: order.stripe_subscription_id,
      stripe_status: stripeSubscription.status || null,
      pause_collection: stripeSubscription.pause_collection || {
        behavior: pauseBehavior,
        resumes_at: resumeAt.unix || null,
      },
    });
  } catch (err: any) {
    if (err instanceof AuthGuardError) {
      return secureJson({ error: err.message, code: err.code }, { status: err.status });
    }

    return secureJson({ error: err.message }, { status: 500 });
  }
});
