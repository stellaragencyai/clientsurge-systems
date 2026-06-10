/**
 * recoverStripeOrders — Admin-only manual recovery for stranded Orders
 * Checks Stripe for actual payment status on each pending order,
 * updates Order fields, then fires postPaymentOrchestrator for paid sessions.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import Stripe from "npm:stripe@14.21.0";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

function safeLog(msg, ctx = {}) {
  console.log(msg, JSON.stringify(ctx));
}

function safeError(msg, ctx = {}) {
  console.error(msg, JSON.stringify(ctx));
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== "admin") return json({ error: "Forbidden: Admin access required" }, 403);

    const body = await req.json().catch(() => ({}));
    // Allow targeting specific order IDs, or recover all pending
    const targetOrderIds = body?.order_ids || null;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), { apiVersion: "2023-10-16" });

    // Fetch all pending orders with a stripe_session_id
    const allPendingOrders = await base44.asServiceRole.entities.Order.filter(
      { payment_status: "pending" }, "-created_date", 50
    );

    const pendingWithSession = (allPendingOrders || []).filter(o =>
      o.stripe_session_id &&
      (!targetOrderIds || targetOrderIds.includes(o.id))
    );

    safeLog("[recoverStripeOrders] Found pending orders with session IDs", {
      total: pendingWithSession.length,
      order_ids: pendingWithSession.map(o => o.id),
    });

    const results = {
      recovered: [],
      already_paid: [],
      not_paid: [],
      errors: [],
      manual_review: [],
    };

    for (const order of pendingWithSession) {
      const orderId = order.id;
      const sessionId = order.stripe_session_id;

      try {
        safeLog(`[recoverStripeOrders] Checking session ${sessionId} for order ${orderId}`);

        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["subscription", "payment_intent"],
        });

        const stripePaymentStatus = session.payment_status; // "paid" | "unpaid" | "no_payment_required"
        const stripeStatus = session.status; // "complete" | "expired" | "open"
        const subscriptionId = session.subscription?.id || session.subscription || null;
        const customerId = session.customer || null;
        const subscriptionStatus = session.subscription?.status || null;
        const periodStart = session.subscription?.current_period_start
          ? new Date(session.subscription.current_period_start * 1000).toISOString()
          : null;
        const periodEnd = session.subscription?.current_period_end
          ? new Date(session.subscription.current_period_end * 1000).toISOString()
          : null;

        safeLog(`[recoverStripeOrders] Session ${sessionId}`, {
          order_id: orderId,
          stripe_payment_status: stripePaymentStatus,
          stripe_status: stripeStatus,
          subscription_id: subscriptionId,
          customer_id: customerId,
        });

        if (stripePaymentStatus === "paid" || stripeStatus === "complete") {
          // Payment confirmed — recover the order
          const recoveryEventId = `manual_recovery_${orderId}_${Date.now()}`;

          await base44.asServiceRole.entities.Order.update(orderId, {
            payment_status: "paid",
            order_status: "paid_setup_in_progress",
            stripe_customer_id: customerId || undefined,
            stripe_subscription_id: subscriptionId || undefined,
            subscription_id: subscriptionId || undefined,
            stripe_event_id: recoveryEventId,
            billing_status: "active",
            pipeline_status: "Paid",
            subscription_status: subscriptionStatus || (subscriptionId ? "active" : undefined),
            current_period_start: periodStart || undefined,
            current_period_end: periodEnd || undefined,
          });

          safeLog(`[recoverStripeOrders] Order ${orderId} updated to paid`);

          // Log recovery event
          await base44.asServiceRole.entities.CommunicationEvent.create({
            order_id: orderId,
            channel: "webhook",
            direction: "inbound",
            event_type: "order_paid",
            provider: "stripe",
            status: "processed",
            provider_message_id: recoveryEventId,
            subject: `Manual order recovery — session ${sessionId}`,
            metadata_json: JSON.stringify({
              recovery_type: "manual_session_lookup",
              session_id: sessionId,
              stripe_payment_status: stripePaymentStatus,
              stripe_status: stripeStatus,
              subscription_id: subscriptionId,
              customer_id: customerId,
              recovered_by: user?.email || "admin",
              recovered_at: new Date().toISOString(),
            }),
          }).catch(() => null);

          // Fire postPaymentOrchestrator
          base44.asServiceRole.functions.invoke("postPaymentOrchestrator", {
            order_id: orderId,
            stripe_session_id: sessionId,
            stripe_event_id: recoveryEventId,
            customer_email: order.customer_email,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          }).catch(err => safeError(`[recoverStripeOrders] postPaymentOrchestrator failed for ${orderId}`, { error: err.message }));

          results.recovered.push({
            order_id: orderId,
            session_id: sessionId,
            customer_email: order.customer_email,
            business_name: order.business_name,
            stripe_payment_status: stripePaymentStatus,
            stripe_status: stripeStatus,
            subscription_id: subscriptionId,
            recovery_event_id: recoveryEventId,
          });

        } else if (stripeStatus === "expired") {
          safeLog(`[recoverStripeOrders] Session ${sessionId} expired — no payment collected`);
          results.not_paid.push({
            order_id: orderId,
            session_id: sessionId,
            customer_email: order.customer_email,
            business_name: order.business_name,
            reason: "session_expired",
            stripe_status: stripeStatus,
          });
        } else if (stripeStatus === "open") {
          safeLog(`[recoverStripeOrders] Session ${sessionId} still open — customer has not completed checkout`);
          results.not_paid.push({
            order_id: orderId,
            session_id: sessionId,
            customer_email: order.customer_email,
            business_name: order.business_name,
            reason: "checkout_not_completed",
            stripe_status: stripeStatus,
          });
        } else {
          results.manual_review.push({
            order_id: orderId,
            session_id: sessionId,
            customer_email: order.customer_email,
            business_name: order.business_name,
            reason: "unknown_status",
            stripe_payment_status: stripePaymentStatus,
            stripe_status: stripeStatus,
          });
        }

      } catch (err) {
        safeError(`[recoverStripeOrders] Error checking order ${orderId}`, { error: err.message, session_id: sessionId });
        results.errors.push({
          order_id: orderId,
          session_id: sessionId,
          customer_email: order.customer_email,
          error: err.message,
        });
      }
    }

    const summary = {
      total_checked: pendingWithSession.length,
      recovered: results.recovered.length,
      not_paid: results.not_paid.length,
      errors: results.errors.length,
      manual_review: results.manual_review.length,
    };

    safeLog("[recoverStripeOrders] Recovery complete", summary);

    return json({
      success: true,
      summary,
      results,
    });

  } catch (error) {
    safeError("[recoverStripeOrders] Fatal error", { error: error.message });
    return json({ error: error.message }, 500);
  }
});