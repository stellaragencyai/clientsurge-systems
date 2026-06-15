import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Billing Processor: Handles Stripe + subscription state events
 * Part of Scale Architecture processing pipeline
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event_queue_id, communication_event_id, client_id, client_project_id } = await req.json();

    // Fetch event details
    const event = await base44.asServiceRole.entities.CommunicationEvent.get(communication_event_id);
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    const results = {
      event_queue_id,
      communication_event_id,
      billing_updates: 0,
    };

    // Process billing events
    if (event.provider === 'stripe') {
      if (event.event_type === 'order_paid') {
        // Trigger onboarding
        results.billing_updates++;
        console.log(`[billingProcessor] Processing order payment`, { event_id: event.id });
      } else if (event.event_type === 'service_status_changed') {
        // Update subscription state
        results.billing_updates++;
        console.log(`[billingProcessor] Updating subscription state`, { event_id: event.id });
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error('[billingProcessor] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});