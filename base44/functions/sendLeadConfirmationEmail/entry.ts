import { createClientFromRequest } from 'npm:@base44/sdk@0.8.34';

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return secureJson({ error: 'lead_id required' }, { status: 400 });
    }

    const lead = await base44.entities.Lead.get(lead_id);
    if (!lead) {
      return secureJson({ error: 'Lead not found' }, { status: 404 });
    }

    const settings = await base44.asServiceRole.entities.AdminSettings.list();
    const adminSettings = settings.length > 0 ? settings[0] : null;

    const templateContent = adminSettings?.email_confirmation_template || 
      `Hi {{full_name}},\n\nThanks for reaching out. We received your inquiry and will be in touch shortly.\n\nYou can also book a demo here: {{booking_link}}\n\nBest regards,\nThe ClientSurge Systems Team`;

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
        from_name: 'ClientSurge Systems',
      });
    } catch (err) {
      console.log('[sendLeadConfirmationEmail] Email send failed:', err.message);
      await base44.entities.CommunicationEvent.update(event.id, {
        status: 'failed',
        error_message: err.message,
      });
    }

    return secureJson({
      success: true,
      event_id: event.id,
    });
  } catch (error) {
    console.error('[sendLeadConfirmationEmail] Error:', error);
    return secureJson({ error: error.message }, { status: 500 });
  }
});