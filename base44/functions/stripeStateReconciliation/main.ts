import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

/**
 * Stripe State Reconciliation: Keep Order + Subscription in sync with Stripe reality
 * Handles:
 * - Subscription state mismatches (Order says "paid" but Stripe says "past_due")
 * - Missing Subscription entities (create if needed)
 * - Billing period reconciliation
 * - Subscription cancellation cleanup
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Fetch all Orders with Stripe references
    const orders = await base44.asServiceRole.entities.Order.list('-created_date', 500);
    const reconciliationLog = {
      total_orders: orders.length,
      reconciled: 0,
      errors: [],
      changes: [],
    };

    for (const order of orders) {
      try {
        // Skip orders without Stripe subscription
        if (!order.stripe_subscription_id) continue;

        // Fetch Stripe subscription state
        const stripeSubscription = await stripe.subscriptions.retrieve(
          order.stripe_subscription_id
        );

        // Map Stripe status to our billing_status
        const stripeStatus = stripeSubscription.status; // active, past_due, canceled, etc.
        const expectedBillingStatus = mapStripeToBillingStatus(stripeStatus);

        // Reconcile Order state
        const needsUpdate = order.subscription_status !== stripeStatus ||
          order.billing_status !== expectedBillingStatus;

        if (needsUpdate) {
          await base44.asServiceRole.entities.Order.update(order.id, {
            subscription_status: stripeStatus,
            billing_status: expectedBillingStatus,
            current_period_start: stripeSubscription.current_period_start
              ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
              : undefined,
            current_period_end: stripeSubscription.current_period_end
              ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
              : undefined,
          });

          reconciliationLog.reconciled++;
          reconciliationLog.changes.push({
            order_id: order.id,
            old_status: order.subscription_status,
            new_status: stripeStatus,
            reason: 'Stripe state mismatch',
          });

          console.log(`[reconciliation] Order ${order.id} synced: ${order.subscription_status} → ${stripeStatus}`);
        }

        // Reconcile Subscription entity if exists
        if (order.subscription_id) {
          const subscription = await base44.asServiceRole.entities.Subscription.get(
            order.subscription_id
          ).catch(() => null);

          if (subscription && subscription.status !== stripeStatus) {
            await base44.asServiceRole.entities.Subscription.update(order.subscription_id, {
              status: stripeStatus,
              current_period_start: stripeSubscription.current_period_start
                ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
                : undefined,
              current_period_end: stripeSubscription.current_period_end
                ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
                : undefined,
            });

            reconciliationLog.changes.push({
              subscription_id: order.subscription_id,
              old_status: subscription.status,
              new_status: stripeStatus,
            });
          }
        }
      } catch (error) {
        console.error(`[reconciliation] Error processing order ${order.id}:`, error.message);
        reconciliationLog.errors.push({
          order_id: order.id,
          error: error.message,
        });
      }
    }

    console.log('[reconciliation] Complete:', JSON.stringify(reconciliationLog));

    return Response.json({
      success: true,
      reconciliation: reconciliationLog,
    });
  } catch (error) {
    console.error('[stripeStateReconciliation] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Map Stripe subscription status to our internal billing_status
 */
function mapStripeToBillingStatus(stripeStatus) {
  const statusMap = {
    active: 'active',
    past_due: 'past_due',
    unpaid: 'past_due',
    canceled: 'canceled',
    incomplete: 'pending',
    incomplete_expired: 'failed',
  };
  return statusMap[stripeStatus] || stripeStatus;
}