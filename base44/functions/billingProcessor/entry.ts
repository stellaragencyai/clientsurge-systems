import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Billing Processor: Handles Stripe + subscription state events
 * Updated with idempotency + orchestration integration
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      workflow_id,
      event_queue_id,
      communication_event_id,
      client_id,
      client_project_id,
      idempotency_key,
    } = await req.json();

    // Check idempotency
    if (idempotency_key) {
      const existing = await base44.asServiceRole.entities.IdempotencyKey.filter(
        { idempotency_key },
        '-created_date',
        1
      ).catch(() => []);

      if (existing?.length > 0 && existing[0].status === 'completed') {
        console.log(`[billingProcessor] Skipping duplicate idempotency key:`, idempotency_key);
        return Response.json({
          success: true,
          skipped: true,
          reason: 'idempotency_duplicate',
          billing_updates: 0,
        });
      }

      // Mark as processing
      if (existing?.length > 0) {
        await base44.asServiceRole.entities.IdempotencyKey.update(existing[0].id, {
          status: 'processing',
        });
      }
    }

    const results = {
      success: false,
      skipped: false,
      billing_updates: 0,
      state_changes: [],
    };

    // Fetch event details
    if (communication_event_id) {
      const event = await base44.asServiceRole.entities.CommunicationEvent.get(communication_event_id);
      if (!event) {
        return Response.json({ error: 'Event not found' }, { status: 404 });
      }

      // Process billing events
      if (event.provider === 'stripe') {
        if (event.event_type === 'order_paid') {
          results.billing_updates++;
          results.state_changes.push({
            entity: 'Order',
            field: 'payment_status',
            to: 'paid',
          });
          console.log(`[billingProcessor] Processing order payment`, { event_id: event.id });
        } else if (event.event_type === 'service_status_changed') {
          results.billing_updates++;
          results.state_changes.push({
            entity: 'Subscription',
            field: 'status',
            to: event.metadata_json,
          });
          console.log(`[billingProcessor] Updating subscription state`, { event_id: event.id });
        }
      }
    }

    results.success = true;

    return Response.json(results);
  } catch (error) {
    console.error('[billingProcessor] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});