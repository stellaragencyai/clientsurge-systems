import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // Parse Twilio status webhook
    const formData = await req.formData();
    const messageId = formData.get('MessageSid');
    const status = formData.get('MessageStatus');

    if (!messageId || !status) {
      return Response.json({ error: 'Missing MessageSid or MessageStatus' }, { status: 400 });
    }

    // Find the communication event by provider_message_id
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter({
      provider_message_id: messageId,
    });

    if (events.length === 0) {
      return Response.json({ success: true, message: 'Event not found' });
    }

    const event = events[0];

    // Map Twilio status to our status
    const statusMap = {
      queued: 'pending',
      sending: 'pending',
      sent: 'sent',
      delivered: 'delivered',
      failed: 'failed',
      undelivered: 'failed',
      received: 'received',
    };

    const mappedStatus = statusMap[status] || status;

    // Update the communication event
    await base44.entities.CommunicationEvent.update(event.id, {
      status: mappedStatus,
    });

    return Response.json({
      success: true,
      event_id: event.id,
      status: mappedStatus,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});