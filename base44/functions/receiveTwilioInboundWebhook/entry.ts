import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // Parse Twilio webhook (form-encoded)
    const formData = await req.formData();
    const from = formData.get('From');
    const body = formData.get('Body');
    const messageId = formData.get('MessageSid');

    if (!from || !body) {
      return Response.json({ error: 'Missing From or Body' }, { status: 400 });
    }

    // Find lead by phone number
    const leads = await base44.asServiceRole.entities.Lead.filter({ phone: from });

    if (leads.length === 0) {
      // Log but don't fail - unknown sender
      return Response.json({ success: true, message: 'No matching lead' });
    }

    const lead = leads[0];

    // Find or create conversation thread
    let thread = await base44.asServiceRole.entities.ConversationThread.filter({
      lead_id: lead.id,
      primary_channel: 'sms',
    });

    if (thread.length === 0) {
      thread = await base44.entities.ConversationThread.create({
        lead_id: lead.id,
        primary_channel: 'sms',
        thread_status: 'active',
      });
    } else {
      thread = thread[0];
      // Update thread activity
      await base44.entities.ConversationThread.update(thread.id, {
        thread_status: 'active',
        last_message_at: new Date().toISOString(),
        message_count: (thread.message_count || 0) + 1,
      });
    }

    // Create inbound communication event
    const event = await base44.entities.CommunicationEvent.create({
      lead_id: lead.id,
      channel: 'sms',
      direction: 'inbound',
      event_type: 'sms_received',
      provider: 'twilio',
      status: 'received',
      message_body: body,
      provider_message_id: messageId,
    });

    return Response.json({
      success: true,
      event_id: event.id,
      lead_id: lead.id,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});