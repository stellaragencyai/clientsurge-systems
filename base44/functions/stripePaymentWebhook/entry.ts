/**
 * stripePaymentWebhook — #446 / #468
 * Receives Stripe webhook events and triggers the installation pipeline.
 *
 * #468: Validates Stripe-Signature header using STRIPE_WEBHOOK_SECRET
 * #446: On checkout.session.completed → activateAllServices
 *
 * Events handled:
 *   - checkout.session.completed → initialize install pipeline
 *   - invoice.payment_succeeded  → update billing status
 *   - invoice.payment_failed     → flag order as past_due
 *   - customer.subscription.deleted → mark order cancelled
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

async function verifyStripeSignature(body: string, sigHeader: string, secret: string): Promise<boolean> {
  if (!secret || !sigHeader) return false;
  try {
    const parts = Object.fromEntries(sigHeader.split(",").map(p => p.split("=")));
    const timestamp = parts["t"];
    const signature = parts["v1"];
    if (!timestamp || !signature) return false;

    const payload = `${timestamp}.${body}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, "0")).join("");
    return expected === signature;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  const body = await req.text();
  const sigHeader = req.headers.get("stripe-signature") || "";

  // #468 — Signature verification
  if (STRIPE_WEBHOOK_SECRET) {
    const valid = await verifyStripeSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET);
    if (!valid) {
      console.error("[stripePaymentWebhook] Invalid signature");
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn("[stripePaymentWebhook] STRIPE_WEBHOOK_SECRET not set — skipping verification");
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);
  const eventType = event.type as string;
  const data = (event.data as Record<string, unknown>)?.object as Record<string, unknown>;

  console.log(`[stripePaymentWebhook] Event: ${eventType}`);

  try {
    if (eventType === "checkout.session.completed") {
      const orderId = (data?.metadata as Record<string, string>)?.order_id;
      const customerId = data?.customer as string;
      const subscriptionId = data?.subscription as string;
      const amountTotal = data?.amount_total as number;

      if (!orderId) {
        console.warn("[stripePaymentWebhook] No order_id in metadata — skipping");
        return Response.json({ received: true, skipped: "no order_id" });
      }

      // Update order payment status
      await base44.asServiceRole.entities.Order.update(orderId, {
        payment_status: "paid",
        billing_status: "active",
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        amount_paid: amountTotal ? amountTotal / 100 : undefined,
        paid_at: new Date().toISOString(),
      });

      // #446 — Trigger installation pipeline
      await base44.functions.invoke("installPipeline", { action: "initialize", order_id: orderId });

      // Trigger service activation
      await base44.functions.invoke("activateAllServices", { order_id: orderId });

      console.log(`[stripePaymentWebhook] Order ${orderId} activated ✅`);
    }

    if (eventType === "invoice.payment_succeeded") {
      const subscriptionId = data?.subscription as string;
      if (subscriptionId) {
        const orders = await base44.asServiceRole.entities.Order.filter({ stripe_subscription_id: subscriptionId }, "-created_date", 1);
        if (orders?.length > 0) {
          await base44.asServiceRole.entities.Order.update(orders[0].id, {
            billing_status: "active",
            last_payment_at: new Date().toISOString(),
          });
        }
      }
    }

    if (eventType === "invoice.payment_failed") {
      const subscriptionId = data?.subscription as string;
      if (subscriptionId) {
        const orders = await base44.asServiceRole.entities.Order.filter({ stripe_subscription_id: subscriptionId }, "-created_date", 1);
        if (orders?.length > 0) {
          await base44.asServiceRole.entities.Order.update(orders[0].id, { billing_status: "past_due" });
        }
      }
    }

    if (eventType === "customer.subscription.deleted") {
      const subscriptionId = data?.id as string;
      if (subscriptionId) {
        const orders = await base44.asServiceRole.entities.Order.filter({ stripe_subscription_id: subscriptionId }, "-created_date", 1);
        if (orders?.length > 0) {
          await base44.asServiceRole.entities.Order.update(orders[0].id, {
            billing_status: "cancelled",
            cancelled_at: new Date().toISOString(),
          });
        }
      }
    }

    return Response.json({ received: true, event_type: eventType });
  } catch (err) {
    console.error("[stripePaymentWebhook] Handler error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
