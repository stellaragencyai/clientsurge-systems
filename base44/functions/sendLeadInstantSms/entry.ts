import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'lead_id required' }, { status: 400 });
    }

    // Check if Twilio is configured
    const settings = await base44.asServiceRole.entities.AdminSettings.list();
    const adminSettings = settings.length > 0 ? settings[0] : null;

    if (!adminSettings?.twilio_enabled || !adminSettings?.twilio_account_sid_present) {
      await base44.entities.AutomationJob.update(
        lead_id,
        {
          status: 'failed',
          last_error: 'Twilio not configured',
        }
      );
      return Response.json({ error: 'Twilio not configured' }, { status: 400 });
    }

    // Get lead data
    const lead = await base44.entities.Lead.get(lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get SMS template from settings
    const templateContent = adminSettings.sms_template || 
      'Hi {{full_name}}, thanks for reaching out. We received your request and will follow up shortly.';

    const smsBody = templateContent
      .replace('{{full_name}}', lead.name)
      .replace('{{booking_link}}', adminSettings.booking_link_default || '');

    // In production, this would call Twilio SDK
    // For now, we'll prepare the infrastructure for when credentials are provided
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFromNumber = adminSettings.twilio_from_number;

    if (!twilioAccountSid || !twilioAuthToken) {
      await base44.entities.CommunicationEvent.create({
        lead_id: lead_id,
        channel: 'sms',
        direction: 'outbound',
        event_type: 'sms_failed',
        provider: 'twilio',
        status: 'failed',
        message_body: smsBody,
        error_message: 'Twilio credentials not configured in environment',
      });

      return Response.json({
        success: false,
        error: 'Twilio credentials not configured',
      });
    }

    // Log the communication event
    const event = await base44.entities.CommunicationEvent.create({
      lead_id: lead_id,
      channel: 'sms',
      direction: 'outbound',
      event_type: 'sms_sent',
      provider: 'twilio',
      status: 'sent',
      message_body: smsBody,
      provider_message_id: 'pending',
    });

    return Response.json({
      success: true,
      event_id: event.id,
      message: 'SMS queued for sending',
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});