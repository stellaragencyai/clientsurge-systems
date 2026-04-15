import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event } = await req.json();

    // Trigger: 15 minutes after lead creation
    if (event.type !== 'create' || event.entity_name !== 'Leads') {
      return Response.json({ success: true });
    }

    const lead = event.data;

    if (!lead || !lead.id || !lead.phone) {
      return Response.json({ success: true });
    }

    // Only send if status is still "Contacted" (no reply yet)
    if (lead.status !== 'Contacted') {
      return Response.json({ success: true });
    }

    // Check if follow-up already sent
    const existingFollowUp = await base44.entities.Messages.filter({
      lead_id: lead.id,
      channel: 'sms',
      message_text: 'Just checking — still interested?',
    });

    if (existingFollowUp.length > 0) {
      return Response.json({ success: true, skipped: true });
    }

    // Send follow-up SMS
    const firstName = lead.full_name ? lead.full_name.split(' ')[0] : 'there';
    const followUpMessage = 'Just checking — still interested?';

    await base44.functions.invoke('sendSMS', {
      phone: lead.phone,
      message: followUpMessage,
      leadId: lead.id,
    });

    return Response.json({ success: true, followUpSent: true });
  } catch (error) {
    console.error('scheduleFollowUpSMS error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});