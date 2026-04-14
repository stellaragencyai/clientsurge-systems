import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const formData = await req.formData();

    const fromPhone = formData.get('From');
    const messageBody = formData.get('Body');
    const messageSid = formData.get('MessageSid');

    if (!fromPhone || !messageBody) {
      return new Response('Missing SMS data', { status: 400 });
    }

    // Find lead by phone
    const leads = await base44.entities.Leads.filter({ phone: fromPhone });
    if (!leads || leads.length === 0) {
      return new Response('Lead not found', { status: 404 });
    }

    const lead = leads[0];

    // Log inbound message
    await base44.entities.Messages.create({
      lead_id: lead.id,
      direction: 'inbound',
      channel: 'sms',
      message_text: messageBody,
      status: 'received',
    });

    // Update lead status
    await base44.entities.Leads.update(lead.id, {
      status: 'Replied',
    });

    // Log event
    await base44.entities.Events.create({
      lead_id: lead.id,
      event_type: 'sms_received',
      data: { messageSid },
    });

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Twilio webhook error:', error.message);
    return new Response('Error processing message', { status: 500 });
  }
});