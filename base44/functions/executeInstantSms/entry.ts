import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * INSTANT SMS EXECUTION
 * Sends SMS via Twilio using AdminSettings template.
 * Logs CommunicationEvent for provider_send_attempted, provider_send_succeeded, or provider_send_failed.
 * Updates WebsiteLead/Leads tracking fields.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { job_id, recipient_phone, template_key, context } = await req.json();

    if (!job_id || !recipient_phone) {
      return Response.json({ error: 'Missing job_id or recipient_phone' }, { status: 400 });
    }

    // 1. Get the job and lead info
    const job = await base44.asServiceRole.entities.AutomationJob.get(job_id);
    const lead = await (job.lead_type === 'WebsiteLead'
      ? base44.asServiceRole.entities.WebsiteLead.get(job.lead_id)
      : base44.asServiceRole.entities.Leads.get(job.lead_id)
    );

    // 2. Get admin settings and template
    const settings = await base44.asServiceRole.entities.AdminSettings.list().then(s => s?.[0]);
    const template = settings?.sms_template || settings?.sms_template_instant || 
      'We received your inquiry! Our team will be in touch shortly with more details. Reply STOP to opt out.';

    // 3. Log provider_send_attempted
    const attemptEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: job.lead_id,
      client_id: job.client_id,
      client_project_id: job.client_project_id,
      channel: 'sms',
      direction: 'outbound',
      event_type: 'provider_send_attempted',
      provider: 'twilio',
      status: 'pending',
      subject: 'SMS send attempt via Twilio',
      message_body: template,
      metadata_json: JSON.stringify({ job_id, recipient_phone, template_key }),
      environment: getEnvironment(),
    });

    // 4. Send SMS via Twilio
    const twilioResult = await sendViaTwilio(
      settings.twilio_from_number,
      recipient_phone,
      template
    );

    // 5. Log success or failure
    let finalStatus = 'sms_sent';
    if (twilioResult.success) {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: job.lead_id,
        client_id: job.client_id,
        client_project_id: job.client_project_id,
        channel: 'sms',
        direction: 'outbound',
        event_type: 'provider_send_succeeded',
        provider: 'twilio',
        status: 'sent',
        subject: 'SMS sent successfully',
        message_body: template,
        provider_message_id: twilioResult.message_id,
        metadata_json: JSON.stringify({ job_id, attempt_event_id: attemptEvent.id }),
        environment: getEnvironment(),
      });

      // 6. Update WebsiteLead/Leads tracking
      const updateData = {
        sms_attempt_count: (lead.sms_attempt_count || 0) + 1,
        last_message_sent: new Date().toISOString(),
        last_engagement_type: 'sms',
        last_engagement_at: new Date().toISOString(),
        initial_response_sent_at: lead.initial_response_sent_at || new Date().toISOString(),
      };

      if (job.lead_type === 'WebsiteLead') {
        await base44.asServiceRole.entities.WebsiteLead.update(job.lead_id, updateData);
      } else {
        await base44.asServiceRole.entities.Leads.update(job.lead_id, updateData);
      }
    } else {
      finalStatus = 'sms_failed';
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: job.lead_id,
        client_id: job.client_id,
        client_project_id: job.client_project_id,
        channel: 'sms',
        direction: 'outbound',
        event_type: 'provider_send_failed',
        provider: 'twilio',
        status: 'failed',
        subject: 'SMS send failed',
        message_body: template,
        error_message: twilioResult.error,
        metadata_json: JSON.stringify({ job_id, attempt_event_id: attemptEvent.id }),
        environment: getEnvironment(),
      });

      // Update attempt count even on failure
      const updateData = {
        sms_attempt_count: (lead.sms_attempt_count || 0) + 1,
      };
      if (job.lead_type === 'WebsiteLead') {
        await base44.asServiceRole.entities.WebsiteLead.update(job.lead_id, updateData);
      }
    }

    return Response.json({
      success: twilioResult.success,
      job_id,
      message_id: twilioResult.message_id,
      error: twilioResult.error,
      final_status: finalStatus,
    });
  } catch (error) {
    console.error('[executeInstantSms]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function sendViaTwilio(fromNumber, toNumber, message) {
  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      return { success: false, error: 'Twilio credentials not set' };
    }

    const body = new URLSearchParams({
      From: fromNumber,
      To: toNumber,
      Body: message,
    });

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Twilio API error' };
    }

    return { success: true, message_id: data.sid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getEnvironment() {
  try {
    const hostname = Deno.env.get('APP_URL') || '';
    if (hostname?.includes('smoke') || hostname?.includes('test')) return 'smoke';
    if (hostname?.includes('staging')) return 'qa';
  } catch {}
  return 'production';
}