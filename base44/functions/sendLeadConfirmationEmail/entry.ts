import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'lead_id required' }, { status: 400 });
    }

    const lead = await base44.entities.Lead.get(lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const settings = await base44.asServiceRole.entities.AdminSettings.list();
    const adminSettings = settings.length > 0 ? settings[0] : null;

    const templateContent = adminSettings?.email_confirmation_template || 
      `Hi {{full_name}},\n\nThanks for reaching out. We received your inquiry and will be in touch shortly.\n\nYou can also book a demo here: {{booking_link}}\n\nBest regards,\nThe ApexFlow Team`;

    const emailBody = templateContent
      .replace('{{full_name}}', lead.name)
      .replace('{{booking_link}}', adminSettings?.booking_link_default || '');

    // Create communication event
    const event = await base44.entities.CommunicationEvent.create({
      lead_id: lead_id,
      channel: 'email',
      direction: 'outbound',
      event_type: 'email_sent',
      provider: 'resend',
      status: 'sent',
      subject: 'We received your inquiry',
      message_body: emailBody,
    });

    // Try to send via Resend integration if configured
    try {
      await base44.integrations.Core.SendEmail({
        to: lead.email,
        subject: 'We received your inquiry',
        body: emailBody,
        from_name: 'ApexFlow',
      });
    } catch (err) {
      console.log('Email send failed:', err.message);
      await base44.entities.CommunicationEvent.update(event.id, {
        status: 'failed',
        error_message: err.message,
      });
    }

    return Response.json({
      success: true,
      event_id: event.id,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});