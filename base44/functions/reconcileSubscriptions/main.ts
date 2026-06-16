/**
 * Task 5 (Data) — Billing sync reconciliation
 * Audits Stripe subscription status against local Order records
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Get all orders with subscriptions
    const orders = await base44.asServiceRole.entities.Order.filter({
      stripe_subscription_id: { $exists: true },
      payment_status: 'paid',
    }, '-created_date', 100);

    const mismatches = [];
    for (const order of orders) {
      if (!order.stripe_subscription_id) continue;
      try {
        const sub = await stripe.subscriptions.retrieve(order.stripe_subscription_id);
        const stripeStatus = sub.status;
        const localStatus = order.subscription_status;

        if (stripeStatus !== localStatus) {
          mismatches.push({ order_id: order.id, local: localStatus, stripe: stripeStatus });
          await base44.asServiceRole.entities.Order.update(order.id, {
            subscription_status: stripeStatus,
            billing_status: stripeStatus,
          });
        }
      } catch (e) {
        console.error(`Stripe lookup failed for order ${order.id}:`, e.message);
      }
    }

    return Response.json({ success: true, checked: orders.length, mismatches });
  } catch (error) {
    console.error('reconcileSubscriptions error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});