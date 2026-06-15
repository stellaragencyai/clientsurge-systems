/**
 * CRITICAL ENHANCEMENT #1: Stripe-to-Install Reconciliation Controller
 * Runs every 60 minutes. Cross-references Stripe paid sessions against Orders.
 * If a paid order has no pipeline_status or has an Error status, auto-triggers
 * the orchestrateOrderToOnboarding function to recover the orphaned order.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both admin calls and scheduled automation calls
    const authHeader = req.headers.get('Authorization') || '';
    const isScheduled = authHeader.includes(Deno.env.get('AUTOMATION_SHARED_SECRET') || '');
    if (!isScheduled) {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const since = Math.floor((Date.now() - 60 * 60 * 1000) / 1000); // last 60 minutes

    // Step 1: Get recent Stripe payment_intent.succeeded events
    const stripeEvents = await stripe.events.list({
      type: 'checkout.session.completed',
      created: { gte: since },
      limit: 100,
    });

    const orphaned = [];
    const recovered = [];
    const errors = [];

    for (const event of stripeEvents.data) {
      const session = event.data.object;
      const sessionId = session?.id;
      const customerEmail = session?.customer_details?.email || session?.customer_email;

      if (!sessionId && !customerEmail) continue;

      // Find matching order
      let order = null;
      if (sessionId) {
        const bySession = await base44.asServiceRole.entities.Order.filter(
          { stripe_session_id: sessionId }, '-created_date', 1
        ).catch(() => []);
        order = bySession?.[0] || null;
      }
      if (!order && customerEmail) {
        const byEmail = await base44.asServiceRole.entities.Order.filter(
          { customer_email: customerEmail, payment_status: 'paid' }, '-created_date', 1
        ).catch(() => []);
        order = byEmail?.[0] || null;
      }

      if (!order) {
        orphaned.push({ stripe_event_id: event.id, session_id: sessionId, email: customerEmail, reason: 'no_order_found' });
        continue;
      }

      // Check if install pipeline was initialized
      const pipelineOk = order.pipeline_status && order.pipeline_status !== 'Error' && order.install_initialized_at;
      if (pipelineOk) continue;

      // Orphaned paid order — trigger recovery
      orphaned.push({ order_id: order.id, session_id: sessionId, email: customerEmail, pipeline_status: order.pipeline_status });

      try {
        await base44.asServiceRole.functions.invoke('orchestrateOrderToOnboarding', {
          order_id: order.id,
          trigger: 'orphan_reconciler',
          stripe_event_id: event.id,
        });

        // Log recovery event
        await base44.asServiceRole.entities.CommunicationEvent.create({
          channel: 'internal',
          direction: 'system',
          event_type: 'workflow_triggered',
          provider: 'internal',
          status: 'processed',
          order_id: order.id,
          client_id: order.client_id || null,
          subject: 'Orphan reconciler triggered install pipeline',
          message_body: `Order ${order.id} had no active pipeline. Auto-recovered via stripe_orphan_reconciler.`,
          provider_message_id: `orphan_recovery:${order.id}:${event.id}`,
          metadata_json: JSON.stringify({ stripe_event_id: event.id, session_id: sessionId }),
        }).catch(() => null);

        recovered.push(order.id);
      } catch (e) {
        console.error(`[orphan-reconciler] Recovery failed for order ${order.id}:`, e.message);
        errors.push({ order_id: order.id, error: e.message });
      }
    }

    console.log(`[orphan-reconciler] checked=${stripeEvents.data.length} orphaned=${orphaned.length} recovered=${recovered.length} errors=${errors.length}`);

    return Response.json({
      success: true,
      checked: stripeEvents.data.length,
      orphaned_count: orphaned.length,
      recovered,
      errors,
    });
  } catch (error) {
    console.error('[orphan-reconciler] Fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});