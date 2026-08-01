import { secureJson } from "../_shared/response.ts";
/**
 * cancelSubscription — #528
 * cancel_at_period_end=true on Stripe + notify client + Nolan.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";
import { stripeFetch } from "../_shared/providerFetch.js";
import { createSystemAuditLog } from "../_shared/billingAudit.js";
import { getStripeSecretKey, safeStripeError, StripeConfigurationError } from "../_shared/stripeInit.js";
import { AuthGuardError, requireOwnerOrAdmin } from "../_shared/authGuards.js";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function userOwnsOrder(user, order = {}) {
  const userEmail = normalizeEmail(user?.email);
  const userClientId = user?.client_id || user?.data?.client_id || user?.metadata?.client_id;
  const userClientProjectId = user?.client_project_id || user?.data?.client_project_id || user?.metadata?.client_project_id;

  return Boolean(
    (userEmail && [order.customer_email, order.client_email].map(normalizeEmail).includes(userEmail)) ||
    (userClientId && order.client_id === userClientId) ||
    (userClientProjectId && order.client_project_id === userClientProjectId)
  );
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, reason } = await req.json();
    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });

    await requireOwnerOrAdmin(base44, (user) => userOwnsOrder(user, order), {
      message: "Order access required",
      code: "order_access_required",
    });

    if (order.billing_status === "cancelling" || order.cancellation_requested_at) {
      return secureJson({
        success: true,
        duplicate: true,
        order_id,
        cancellation_requested_at: order.cancellation_requested_at || null,
      });
    }

    let stripeCancelled = false;

    // Cancel at period end on Stripe
    if (order.stripe_subscription_id) {
      let stripeKey = "";
      try {
        stripeKey = getStripeSecretKey();
      } catch (error) {
        if (!(error instanceof StripeConfigurationError)) {
          throw error;
        }
        const safeError = safeStripeError(error);
        console.error("[cancelSubscription] Stripe is not configured", {
          requestId,
          order_id,
          code: safeError.code,
        });
        return secureJson(
          { error: safeError.userMessage, code: safeError.code, request_id: requestId },
          { status: safeError.status }
        );
      }

      if (stripeKey) {
        const stripeRes = await stripeFetch(`https://api.stripe.com/v1/subscriptions/${order.stripe_subscription_id}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
            body: "cancel_at_period_end=true",
          }
        );
        if (!stripeRes.ok) {
          const stripeErrorText = await stripeRes.text().catch(() => "");
          console.error("[cancelSubscription] Stripe cancellation request failed", {
            requestId,
            order_id,
            status: stripeRes.status,
            stripe_error_present: Boolean(stripeErrorText),
          });
          return secureJson(
            {
              error: "Unable to schedule cancellation with Stripe. Please contact support.",
              code: "stripe_cancellation_failed",
              request_id: requestId,
            },
            { status: 502 }
          );
        }

        const stripeData = await stripeRes.json().catch(() => ({}));
        stripeCancelled = stripeData?.cancel_at_period_end === true;
        if (!stripeCancelled) {
          console.error("[cancelSubscription] Stripe did not confirm cancel_at_period_end", {
            requestId,
            order_id,
          });
          return secureJson(
            {
              error: "Unable to confirm cancellation with Stripe. Please contact support.",
              code: "stripe_cancellation_not_confirmed",
              request_id: requestId,
            },
            { status: 502 }
          );
        }
      }
    }

    // Update order
    const updatedOrder = await base44.asServiceRole.entities.Order.update(order_id, {
      billing_status: "cancelling",
      cancellation_requested_at: new Date().toISOString(),
      cancellation_reason: reason || "client_request",
    });
    await createSystemAuditLog(base44, {
      action: "subscription_cancellation_requested",
      entityName: "Order",
      recordId: updatedOrder.id,
      before: order,
      after: updatedOrder,
      source: "cancelSubscription",
      provider: "stripe",
      notes: {
        stripe_subscription_id: order.stripe_subscription_id || "",
        cancel_at_period_end: stripeCancelled,
      },
    });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    // Email client
    if (order.client_email && resendKey) {
      await resendFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "system@clientsurgesystems.com",
          reply_to: "nolan@clientsurgesystems.com",
          to: order.client_email,
          subject: "Subscription cancellation confirmed",
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 20px">
            <h2 style="color:#0A0F1E">Cancellation confirmed</h2>
            <p style="color:#374151">Hey ${order.client_name || "there"},</p>
            <p style="color:#374151">Your ClientSurge subscription will remain active until the end of your current billing period, then cancel automatically. You won't be charged again.</p>
            <p style="color:#374151">If you change your mind or want to discuss your experience, just reply to this email — Nolan will reach out personally.</p>
          </div>`,
        }),
      }).catch(() => {});
    }

    // Telegram Nolan
    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: "-1003533494424",
          text: `@trinity

🚨 <b>Cancellation Requested</b>
Client: ${order.client_name}
Tier: ${order.package_key}
Reason: ${reason || "not given"}
Stripe cancel_at_period_end: ${stripeCancelled}`,
          parse_mode: "HTML" }),
      }).catch(() => {});
    }

    return secureJson({ success: true, order_id, cancel_at_period_end: stripeCancelled });
  } catch (err: any) {
    if (err instanceof AuthGuardError) {
      return secureJson(
        { error: err.message, code: err.code, request_id: requestId },
        { status: err.status }
      );
    }

    const safeError = safeStripeError(err, "Unable to cancel the subscription. Please contact support.");
    console.error("[cancelSubscription] error", {
      requestId,
      code: safeError.code,
      message: safeError.internalMessage,
    });
    return secureJson(
      { error: safeError.userMessage, code: safeError.code, request_id: requestId },
      { status: safeError.status }
    );
  }
});
