import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.21.0';

/**
 * syncBillingToAIAccess
 * Pulls live Stripe subscription status for every Subscription record that has a
 * stripe_subscription_id, updates the local Subscription entity (the AI access
 * record), and propagates the billing status to the linked Order. AI access is
 * derived from status: active = enabled, past_due = restricted, canceled = disabled.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const STRIPE_SECRET = Deno.env.get('STRIPE_LIVE_SECRET_KEY');
    if (!STRIPE_SECRET) {
      return Response.json({ error: 'Stripe secret not configured' }, { status: 500 });
    }

    const stripe = new Stripe(STRIPE_SECRET);

    const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
      { stripe_subscription_id: { $exists: true } },
      '-created_date',
      200
    );

    const summary = {
      total: subscriptions.length,
      synced: 0,
      unchanged: 0,
      errors: [],
      changes: [],
    };

    for (const sub of subscriptions) {
      if (!sub.stripe_subscription_id) continue;
      try {
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        const mappedStatus = mapStripeStatus(stripeSub.status);

        if (sub.status !== mappedStatus) {
          const periodStart = stripeSub.current_period_start
            ? new Date(stripeSub.current_period_start * 1000).toISOString()
            : undefined;
          const periodEnd = stripeSub.current_period_end
            ? new Date(stripeSub.current_period_end * 1000).toISOString()
            : undefined;

          await base44.asServiceRole.entities.Subscription.update(sub.id, {
            status: mappedStatus,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          });

          // Propagate billing status to the linked Order so access gating reads one source.
          if (sub.order_id) {
            await base44.asServiceRole.entities.Order.update(sub.order_id, {
              subscription_status: stripeSub.status,
              billing_status: mappedStatus,
            }).catch(() => null);
          }

          summary.synced++;
          summary.changes.push({
            subscription_id: sub.id,
            stripe_subscription_id: sub.stripe_subscription_id,
            client_id: sub.client_id,
            order_id: sub.order_id,
            old_status: sub.status,
            new_status: mappedStatus,
            ai_access: aiAccessLevel(mappedStatus),
          });
        } else {
          summary.unchanged++;
        }
      } catch (error) {
        summary.errors.push({
          subscription_id: sub.id,
          stripe_subscription_id: sub.stripe_subscription_id,
          error: error.message,
        });
      }
    }

    return Response.json({ success: true, summary });
  } catch (error) {
    console.error('[syncBillingToAIAccess] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Map Stripe subscription status to the local Subscription.status enum
 * (active | past_due | canceled). AI access is derived from this value.
 */
function mapStripeStatus(stripeStatus) {
  const map = {
    trialing: 'active',
    active: 'active',
    past_due: 'past_due',
    unpaid: 'past_due',
    canceled: 'canceled',
    incomplete: 'canceled',
    incomplete_expired: 'canceled',
    paused: 'past_due',
  };
  return map[stripeStatus] || 'canceled';
}

function aiAccessLevel(status) {
  if (status === 'active') return 'enabled';
  if (status === 'past_due') return 'restricted';
  return 'disabled';
}