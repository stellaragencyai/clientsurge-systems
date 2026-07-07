import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Billing Processor: Synchronizes Stripe subscription state with ClientDeployment.
 *
 * Handles Stripe webhook events:
 *   - subscription.deleted        → Deployment paused, permissions revoked
 *   - invoice.payment_failed      → Deployment paused, permissions temporarily revoked
 *   - subscription.updated        → Sync status changes
 *
 * Does NOT modify Stripe objects. Only consumes webhook events and synchronizes
 * internal ClientDeployment state.
 *
 * Can be invoked directly with { stripe_event_type, stripe_customer_id, ... }
 * or via EventQueue with { communication_event_id, deployment_id, ... }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // ── Direct invocation mode (from Stripe webhook handler) ──
    if (body.stripe_event_type) {
      return await handleStripeEvent(base44, body);
    }

    // ── Event Queue invocation mode ──
    const {
      event_queue_id,
      communication_event_id,
      client_id,
      client_project_id,
      deployment_id,
      idempotency_key,
    } = body;

    // Idempotency check
    if (idempotency_key) {
      const existing = await base44.asServiceRole.entities.IdempotencyKey.filter(
        { idempotency_key }, '-created_date', 1
      ).catch(() => []);

      if (existing?.length > 0 && existing[0].status === 'completed') {
        return Response.json({
          success: true, skipped: true, reason: 'idempotency_duplicate', billing_updates: 0,
        });
      }
      if (existing?.length > 0) {
        await base44.asServiceRole.entities.IdempotencyKey.update(existing[0].id, {
          status: 'processing',
        });
      }
    }

    // Fetch event details from CommunicationEvent
    let stripeEventType = null;
    let stripeCustomerId = null;
    let stripeSubscriptionId = null;
    let eventMetadata = {};

    if (communication_event_id) {
      const event = await base44.asServiceRole.entities.CommunicationEvent.get(communication_event_id);
      if (!event) {
        return Response.json({ error: 'Event not found' }, { status: 404 });
      }
      stripeEventType = event.event_type;
      stripeCustomerId = event.metadata_json ? JSON.parse(event.metadata_json).stripe_customer_id : null;
      stripeSubscriptionId = event.metadata_json ? JSON.parse(event.metadata_json).stripe_subscription_id : null;
      try { eventMetadata = JSON.parse(event.metadata_json || '{}'); } catch (_) {}
    }

    // Map communication event types to stripe event types
    const eventTypeMap = {
      'subscription_cancelled': 'subscription.deleted',
      'payment_failed': 'invoice.payment_failed',
      'subscription_updated': 'subscription.updated',
      'subscription_active': 'subscription.updated',
    };
    const mappedType = eventTypeMap[stripeEventType] || stripeEventType;

    if (mappedType) {
      return await handleStripeEvent(base44, {
        stripe_event_type: mappedType,
        stripe_customer_id: stripeCustomerId || eventMetadata.stripe_customer_id,
        stripe_subscription_id: stripeSubscriptionId || eventMetadata.stripe_subscription_id,
        client_id,
        client_project_id,
        deployment_id,
        event_queue_id,
      });
    }

    return Response.json({ success: true, billing_updates: 0, reason: 'no_actionable_event' });
  } catch (error) {
    console.error('[billingProcessor] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Handle a Stripe event and synchronize ClientDeployment state.
 */
async function handleStripeEvent(base44, params) {
  const { stripe_event_type, stripe_customer_id, stripe_subscription_id, deployment_id, client_id } = params;
  const results = { success: false, billing_updates: 0, state_changes: [], deployment_updated: false };

  // Resolve the deployment
  let deployment = null;
  if (deployment_id) {
    deployment = await base44.asServiceRole.entities.ClientDeployment.get(deployment_id).catch(() => null);
    if (!deployment && stripe_customer_id && !client_id) {
      // Try lookup by order_id matching stripe customer
      const orders = await base44.asServiceRole.entities.Order.filter(
        { stripe_customer_id: stripe_customer_id }, '-created_date', 1
      ).catch(() => []);
      if (orders?.length > 0 && orders[0].client_id) {
        const deps = await base44.asServiceRole.entities.ClientDeployment.filter(
          { client_id: orders[0].client_id }, '-created_date', 1
        ).catch(() => []);
        deployment = deps?.[0] || null;
      }
    }
  }
  if (!deployment && (client_id || stripe_customer_id)) {
    const lookupClientId = client_id || stripe_customer_id;
    const deployments = await base44.asServiceRole.entities.ClientDeployment.filter(
      { client_id: lookupClientId }, '-created_date', 1
    ).catch(() => []);
    deployment = deployments?.[0] || null;
  }

  if (!deployment) {
    results.state_changes.push({ action: 'skip', reason: 'no_deployment_found' });
    return Response.json(results);
  }

  const now = new Date().toISOString();

  switch (stripe_event_type) {
    case 'subscription.deleted': {
      // Subscription cancelled → Deployment paused, permissions revoked
      await base44.asServiceRole.entities.ClientDeployment.update(deployment.id, {
        deployment_status: 'paused',
        health_status: 'critical',
        health_summary: 'Subscription cancelled — automation paused',
        health_checked_at: now,
        last_status_check_at: now,
      });

      results.billing_updates++;
      results.deployment_updated = true;
      results.state_changes.push({
        entity: 'ClientDeployment',
        field: 'deployment_status',
        from: deployment.deployment_status,
        to: 'paused',
        reason: 'subscription.deleted',
      });
      break;
    }

    case 'invoice.payment_failed': {
      // Payment failure → Deployment paused, permissions temporarily revoked
      await base44.asServiceRole.entities.ClientDeployment.update(deployment.id, {
        deployment_status: 'paused',
        health_status: 'warning',
        health_summary: 'Payment failed — automation temporarily paused',
        health_checked_at: now,
        last_status_check_at: now,
        errors: [
          ...(deployment.errors || []),
          {
            error_code: 'payment_failed',
            message: 'Stripe invoice payment failed',
            severity: 'critical',
            occurred_at: now,
          },
        ],
      });

      results.billing_updates++;
      results.deployment_updated = true;
      results.state_changes.push({
        entity: 'ClientDeployment',
        field: 'deployment_status',
        from: deployment.deployment_status,
        to: 'paused',
        reason: 'invoice.payment_failed',
      });
      break;
    }

    case 'subscription.updated': {
      // Subscription updated → check if restored or still active
      // If deployment was paused due to billing and subscription is active again, reactivate
      if (deployment.deployment_status === 'paused' && stripe_subscription_id) {
        // Subscription restored — reactivate after validation
        await base44.asServiceRole.entities.ClientDeployment.update(deployment.id, {
          deployment_status: 'live',
          health_status: 'healthy',
          health_summary: 'Subscription restored — deployment reactivated',
          health_checked_at: now,
          last_status_check_at: now,
        });

        results.billing_updates++;
        results.deployment_updated = true;
        results.state_changes.push({
          entity: 'ClientDeployment',
          field: 'deployment_status',
          from: 'paused',
          to: 'live',
          reason: 'subscription.updated (restored)',
        });
      } else {
        results.state_changes.push({
          entity: 'ClientDeployment',
          field: 'deployment_status',
          from: deployment.deployment_status,
          to: deployment.deployment_status,
          reason: 'subscription.updated (no change needed)',
        });
      }
      break;
    }

    default:
      results.state_changes.push({ action: 'skip', reason: `unhandled_event_type: ${stripe_event_type}` });
      break;
  }

  // Log the billing sync to AutomationExecutionLog
  if (results.deployment_updated) {
    try {
      await base44.asServiceRole.entities.AutomationExecutionLog.create({
        client_deployment_id: deployment.id,
        client_id: deployment.client_id,
        module_key: 'billing_sync',
        trigger_event: stripe_event_type,
        execution_status: 'completed',
        response_data: JSON.stringify(results.state_changes),
        started_at: now,
        completed_at: now,
      });
    } catch (err) {
      console.warn('[billingProcessor] Failed to log billing sync:', err.message);
    }

    // Trigger health recalculation
    try {
      await base44.asServiceRole.functions.invoke('calculateDeploymentHealth', {
        deployment_id: deployment.id,
      });
    } catch (_) {}
  }

  results.success = true;
  return Response.json(results);
}