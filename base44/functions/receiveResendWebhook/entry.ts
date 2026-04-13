import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { type, data } = payload;
    const { id, email_id } = data || {};

    if (!email_id) {
      return Response.json({ error: 'No email_id in webhook' }, { status: 400 });
    }

    // Map Resend event types to internal status
    const statusMap = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.clicked': 'opened',
      'email.bounced': 'failed',
      'email.complained': 'failed',
    };

    const status = statusMap[type] || 'processed';

    // Find communication event by provider_message_id
    const events = await base44.entities.CommunicationEvent.filter({
      provider_message_id: email_id,
    });

    if (events.length > 0) {
      await base44.entities.CommunicationEvent.update(events[0].id, {
        status,
      });
    }

    return Response.json({ success: true, status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});