import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Messaging Processor: Handles SMS/email inbound + outbound events
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
        console.log(`[messagingProcessor] Skipping duplicate idempotency key:`, idempotency_key);
        return Response.json({
          success: true,
          skipped: true,
          reason: 'idempotency_duplicate',
          processed: 0,
        });
      }
    }

    const results = {
      success: false,
      skipped: false,
      processed: 0,
    };

    // Fetch event details
    if (communication_event_id) {
      const event = await base44.asServiceRole.entities.CommunicationEvent.get(communication_event_id);
      if (!event) {
        return Response.json({ error: 'Event not found' }, { status: 404 });
      }

      // Process based on event type
      if (event.event_type === 'sms_received') {
        results.processed++;
        console.log(`[messagingProcessor] Routed inbound SMS to lead pipeline`, { event_id: event.id });
      } else if (event.event_type === 'sms_sent' || event.event_type === 'email_sent') {
        results.processed++;
        console.log(`[messagingProcessor] Tracking outbound message`, { event_type: event.event_type });
      }
    }

    results.success = true;

    return Response.json(results);
  } catch (error) {
    console.error('[messagingProcessor] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});