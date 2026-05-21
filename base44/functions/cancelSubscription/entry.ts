import { secureJson } from "../_shared/response.ts";
/**
 * cancelSubscription — #528
 * cancel_at_period_end=true on Stripe + notify client + Nolan.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";
import { stripeFetch } from "../_shared/providerFetch.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, reason } = await req.json();
    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    let stripeCancelled = false;

    // Cancel at period end on Stripe
    if (stripeKey && order.stripe_subscription_id) {
      const stripeRes = await stripeFetch(`https://api.stripe.com/v1/subscriptions/${order.stripe_subscription_id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: "cancel_at_period_end=true",
        }
      );
      const stripeData = await stripeRes.json();
      stripeCancelled = stripeData?.cancel_at_period_end === true;
    }

    // Update order
    await base44.asServiceRole.entities.Order.update(order_id, {
      billing_status: "cancelling",
      cancellation_requested_at: new Date().toISOString(),
      cancellation_reason: reason || "client_request",
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
    return secureJson({ error: err.message }, { status: 500 });
  }
});
