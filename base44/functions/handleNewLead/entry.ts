import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event } = await req.json();

    if (event.type !== 'create' || event.entity_name !== 'Leads') {
      return Response.json({ success: true });
    }

    const lead = event.data;

    if (!lead || !lead.id) {
      return Response.json({ error: 'Lead data missing' }, { status: 400 });
    }

    // Generate message
    const firstName = lead.full_name ? lead.full_name.split(' ')[0] : 'there';
    const message = `Hey ${firstName}, thanks for reaching out — what service were you interested in?`;

    // Send SMS if phone exists
    if (lead.phone) {
      await base44.functions.invoke('sendSMS', {
        phone: lead.phone,
        message,
        leadId: lead.id,
      });
    }

    // Send confirmation email if email exists
    if (lead.email) {
      const emailBody = `<p>Hi ${firstName},</p><p>${message}</p><p>Looking forward to helping you!</p>`;
      await base44.functions.invoke('sendEmail', {
        email: lead.email,
        subject: 'Thanks for Reaching Out!',
        body: emailBody,
        leadId: lead.id,
      });
    }

    // Update lead status
    await base44.entities.Leads.update(lead.id, {
      status: 'Contacted',
      last_contacted_at: new Date().toISOString(),
    });

    // Log automation event
    await base44.entities.Events.create({
      lead_id: lead.id,
      event_type: 'lead_created',
      data: { automated: true, sms_sent: !!lead.phone, email_sent: !!lead.email },
    });

    return Response.json({ success: true, leadId: lead.id });
  } catch (error) {
    console.error('handleNewLead error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});