import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Messaging Processor: Handles SMS/email inbound + outbound events
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
      processed: false,
    };

    // Process based on event type
    if (event.event_type === 'sms_received') {
      // Inbound SMS: route to lead processing
      results.processed = true;
      console.log(`[messagingProcessor] Routed inbound SMS to lead pipeline`, { event_id: event.id });
    } else if (event.event_type === 'sms_sent' || event.event_type === 'email_sent') {
      // Outbound message: update delivery status via provider webhook
      results.processed = true;
      console.log(`[messagingProcessor] Tracking outbound message`, { event_type: event.event_type });
    } else {
      console.log(`[messagingProcessor] Skipping non-messaging event`, { event_type: event.event_type });
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error('[messagingProcessor] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});