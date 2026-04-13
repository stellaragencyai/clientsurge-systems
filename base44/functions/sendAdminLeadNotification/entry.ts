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

    if (!adminSettings?.lead_notification_email) {
      return Response.json({ error: 'Admin notification email not configured' }, { status: 400 });
    }

    const templateContent = adminSettings?.admin_notification_template || 
      `New Lead Submitted:\n\nName: {{full_name}}\nBusiness: {{business_name}}\nEmail: {{email}}\nPhone: {{phone}}\nNiche: {{niche}}\nMonthly Leads: {{monthly_leads}}\n\nBiggest Problem: {{problem}}`;

    const emailBody = templateContent
      .replace('{{full_name}}', lead.name)
      .replace('{{business_name}}', lead.business_name)
      .replace('{{email}}', lead.email)
      .replace('{{phone}}', lead.phone)
      .replace('{{niche}}', lead.niche || 'N/A')
      .replace('{{monthly_leads}}', lead.monthly_leads || 'N/A')
      .replace('{{problem}}', lead.notes || 'N/A');

    const event = await base44.entities.CommunicationEvent.create({
      lead_id: lead_id,
      channel: 'email',
      direction: 'outbound',
      event_type: 'email_sent',
      provider: 'internal',
      status: 'sent',
      subject: `New Lead: ${lead.business_name}`,
      message_body: emailBody,
    });

    try {
      await base44.integrations.Core.SendEmail({
        to: adminSettings.lead_notification_email,
        subject: `New Lead: ${lead.business_name}`,
        body: emailBody,
        from_name: 'ApexFlow System',
      });
    } catch (err) {
      console.log('Admin notification failed:', err.message);
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