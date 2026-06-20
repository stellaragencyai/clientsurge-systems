import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * CONFIRMATION EMAIL EXECUTION
 * Sends email via Resend using AdminSettings template.
 * Logs CommunicationEvent for provider_send_attempted, provider_send_succeeded, or provider_send_failed.
 * Updates WebsiteLead/Leads tracking fields.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { job_id, recipient_email, template_key, context } = await req.json();

    if (!job_id || !recipient_email) {
      return Response.json({ error: 'Missing job_id or recipient_email' }, { status: 400 });
    }

    // 1. Get the job and lead info
    const job = await base44.asServiceRole.entities.AutomationJob.get(job_id);
    const lead = await (job.lead_type === 'WebsiteLead'
      ? base44.asServiceRole.entities.WebsiteLead.get(job.lead_id)
      : base44.asServiceRole.entities.Leads.get(job.lead_id)
    );

    // 2. Get admin settings
    const settings = await base44.asServiceRole.entities.AdminSettings.list().then(s => s?.[0]);
    const emailTemplate = settings?.email_confirmation_template || 
      'Thank you for reaching out! We received your inquiry and will get back to you shortly with more information.';
    const fromEmail = settings?.resend_from_email || Deno.env.get('RESEND_FROM_EMAIL');

    if (!fromEmail) {
      return Response.json({ error: 'Resend email not configured' }, { status: 400 });
    }

    // 3. Log provider_send_attempted
    const attemptEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: job.lead_id,
      client_id: job.client_id,
      client_project_id: job.client_project_id,
      channel: 'email',
      direction: 'outbound',
      event_type: 'provider_send_attempted',
      provider: 'resend',
      status: 'pending',
      subject: 'Confirmation email send attempt via Resend',
      message_body: emailTemplate,
      metadata_json: JSON.stringify({ job_id, recipient_email, template_key }),
      environment: getEnvironment(),
    });

    // 4. Send email via Resend
    const resendResult = await sendViaResend(
      fromEmail,
      recipient_email,
      'Thank You for Your Inquiry',
      emailTemplate
    );

    // 5. Log success or failure
    let finalStatus = 'email_sent';
    if (resendResult.success) {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: job.lead_id,
        client_id: job.client_id,
        client_project_id: job.client_project_id,
        channel: 'email',
        direction: 'outbound',
        event_type: 'provider_send_succeeded',
        provider: 'resend',
        status: 'sent',
        subject: 'Confirmation email sent successfully',
        message_body: emailTemplate,
        provider_message_id: resendResult.message_id,
        metadata_json: JSON.stringify({ job_id, attempt_event_id: attemptEvent.id }),
        environment: getEnvironment(),
      });

      // 6. Update WebsiteLead/Leads tracking
      const updateData = {
        email_attempt_count: (lead.email_attempt_count || 0) + 1,
        last_message_sent: new Date().toISOString(),
        last_engagement_type: 'email',
        last_engagement_at: new Date().toISOString(),
        initial_response_sent_at: lead.initial_response_sent_at || new Date().toISOString(),
      };

      if (job.lead_type === 'WebsiteLead') {
        await base44.asServiceRole.entities.WebsiteLead.update(job.lead_id, updateData);
      } else {
        await base44.asServiceRole.entities.Leads.update(job.lead_id, updateData);
      }
    } else {
      finalStatus = 'email_failed';
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: job.lead_id,
        client_id: job.client_id,
        client_project_id: job.client_project_id,
        channel: 'email',
        direction: 'outbound',
        event_type: 'provider_send_failed',
        provider: 'resend',
        status: 'failed',
        subject: 'Confirmation email send failed',
        message_body: emailTemplate,
        error_message: resendResult.error,
        metadata_json: JSON.stringify({ job_id, attempt_event_id: attemptEvent.id }),
        environment: getEnvironment(),
      });

      // Update attempt count even on failure
      const updateData = {
        email_attempt_count: (lead.email_attempt_count || 0) + 1,
      };
      if (job.lead_type === 'WebsiteLead') {
        await base44.asServiceRole.entities.WebsiteLead.update(job.lead_id, updateData);
      }
    }

    return Response.json({
      success: resendResult.success,
      job_id,
      message_id: resendResult.message_id,
      error: resendResult.error,
      final_status: finalStatus,
    });
  } catch (error) {
    console.error('[executeConfirmationEmail]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function sendViaResend(fromEmail, toEmail, subject, html) {
  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');

    if (!apiKey) {
      return { success: false, error: 'Resend API key not set' };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Resend API error' };
    }

    return { success: true, message_id: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getEnvironment() {
  const hostname = Deno.env.get('DENO_ENVIRONMENT') || 'production';
  if (hostname?.includes('smoke') || hostname?.includes('test')) return 'smoke';
  if (hostname?.includes('staging')) return 'qa';
  return 'production';
}