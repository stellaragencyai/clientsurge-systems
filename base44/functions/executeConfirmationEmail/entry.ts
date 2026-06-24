import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * CONFIRMATION EMAIL EXECUTION
 *
 * Fixes:
 * - Fetches lead directly (no dependency on non-existent job.recipient_email)
 * - Uses safe canonical sender: "ClientSurge Systems <system@clientsurgesystems.com>"
 * - Validates from address before sending
 * - Skips cleanly on invalid email (email_skipped event)
 * - Never constructs from address from business_name or user input
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { job_id } = await req.json();

    if (!job_id) {
      return Response.json({ error: 'Missing job_id', success: false }, { status: 400 });
    }

    // 1. Get the job
    const job = await base44.asServiceRole.entities.AutomationJob.get(job_id);
    if (!job) {
      return Response.json({ error: 'Job not found', success: false, job_id }, { status: 404 });
    }

    // 2. Fetch lead — try WebsiteLead first, then Leads (job.lead_type doesn't exist in schema)
    let lead = null;
    let lead_type = 'WebsiteLead';
    lead = await base44.asServiceRole.entities.WebsiteLead.get(job.lead_id).catch(() => null);
    if (!lead) {
      lead = await base44.asServiceRole.entities.Leads.get(job.lead_id).catch(() => null);
      lead_type = 'Leads';
    }
    if (!lead) {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: job.lead_id,
        channel: 'email',
        direction: 'outbound',
        event_type: 'email_skipped',
        provider: 'resend',
        status: 'failed',
        subject: 'Email skipped — lead not found',
        error_message: 'lead_not_found',
        metadata_json: JSON.stringify({ job_id }),
        environment: getEnvironment(),
      });
      return Response.json({ success: false, skipped: true, error: 'lead_not_found', job_id });
    }

    // 3. Get email from lead and validate
    const recipientEmail = (lead.email || '').trim();

    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: job.lead_id,
        client_id: lead.client_id || null,
        client_project_id: lead.client_project_id || null,
        channel: 'email',
        direction: 'outbound',
        event_type: 'email_skipped',
        provider: 'resend',
        status: 'failed',
        subject: 'Email skipped — invalid email address',
        error_message: 'invalid_email_address',
        metadata_json: JSON.stringify({ job_id, raw_email: recipientEmail }),
        environment: getEnvironment(),
      });
      return Response.json({ success: false, skipped: true, error: 'invalid_email_address', job_id, recipient_email: recipientEmail });
    }

    // 4. Get safe canonical sender — never construct from business_name or user input
    const fromEmail = getSafeResendFrom();
    if (!fromEmail || !fromEmail.includes('@')) {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: job.lead_id,
        client_id: lead.client_id || null,
        client_project_id: lead.client_project_id || null,
        channel: 'email',
        direction: 'outbound',
        event_type: 'email_skipped',
        provider: 'resend',
        status: 'failed',
        subject: 'Email skipped — invalid sender address',
        error_message: 'invalid_resend_from_address',
        metadata_json: JSON.stringify({ job_id }),
        environment: getEnvironment(),
      });
      return Response.json({ success: false, skipped: true, error: 'invalid_resend_from_address', job_id });
    }

    // 5. Get admin settings and template
    const settings = await base44.asServiceRole.entities.AdminSettings.list().then(s => s?.[0]);
    const emailTemplate = settings?.email_confirmation_template ||
      'Thank you for reaching out! We received your inquiry and will get back to you shortly with more information.';

    // 6. Log provider_send_attempted
    const attemptEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: job.lead_id,
      client_id: lead.client_id || null,
      client_project_id: lead.client_project_id || null,
      channel: 'email',
      direction: 'outbound',
      event_type: 'provider_send_attempted',
      provider: 'resend',
      status: 'pending',
      subject: 'Confirmation email send attempt via Resend',
      message_body: emailTemplate,
      metadata_json: JSON.stringify({ job_id, recipient_email: recipientEmail, from_address: fromEmail }),
      environment: getEnvironment(),
    });

    // 7. Send email via Resend
    const resendResult = await sendViaResend(fromEmail, recipientEmail, 'Thank You for Your Inquiry', emailTemplate);

    // 8. Log success or failure
    const now = new Date().toISOString();
    if (resendResult.success) {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: job.lead_id,
        client_id: lead.client_id || null,
        client_project_id: lead.client_project_id || null,
        channel: 'email',
        direction: 'outbound',
        event_type: 'provider_send_succeeded',
        provider: 'resend',
        status: 'sent',
        subject: 'Confirmation email sent successfully',
        message_body: emailTemplate,
        provider_message_id: resendResult.message_id,
        metadata_json: JSON.stringify({ job_id, attempt_event_id: attemptEvent.id, recipient_email: recipientEmail }),
        environment: getEnvironment(),
      });

      // Update lead tracking
      const updateData = {
        email_attempt_count: (lead.email_attempt_count || 0) + 1,
        last_message_sent: now,
        last_engagement_type: 'email',
        last_engagement_at: now,
        initial_response_sent_at: lead.initial_response_sent_at || now,
      };
      if (lead_type === 'WebsiteLead') {
        await base44.asServiceRole.entities.WebsiteLead.update(job.lead_id, updateData);
      } else {
        await base44.asServiceRole.entities.Leads.update(job.lead_id, updateData);
      }
    } else {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: job.lead_id,
        client_id: lead.client_id || null,
        client_project_id: lead.client_project_id || null,
        channel: 'email',
        direction: 'outbound',
        event_type: 'provider_send_failed',
        provider: 'resend',
        status: 'failed',
        subject: 'Confirmation email send failed',
        message_body: emailTemplate,
        error_message: resendResult.error,
        metadata_json: JSON.stringify({ job_id, attempt_event_id: attemptEvent.id, recipient_email: recipientEmail, error_code: resendResult.error_code }),
        environment: getEnvironment(),
      });

      // Update attempt count even on failure
      const updateData = { email_attempt_count: (lead.email_attempt_count || 0) + 1 };
      if (lead_type === 'WebsiteLead') {
        await base44.asServiceRole.entities.WebsiteLead.update(job.lead_id, updateData);
      } else {
        await base44.asServiceRole.entities.Leads.update(job.lead_id, updateData);
      }
    }

    return Response.json({
      success: resendResult.success,
      job_id,
      message_id: resendResult.message_id,
      error: resendResult.error,
      recipient_email: recipientEmail,
      final_status: resendResult.success ? 'email_sent' : 'email_failed',
    });
  } catch (error) {
    console.error('[executeConfirmationEmail]', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});

// ── Safe canonical Resend sender ──
// Always uses display-name + email format. Falls back to system@clientsurgesystems.com.
// Never constructs from address from business_name or user input.
function getSafeResendFrom() {
  const configured = String(Deno.env.get('RESEND_FROM_EMAIL') || '').trim();
  if (configured && configured.includes('@')) {
    if (configured.includes('<')) return configured;
    return `ClientSurge Systems <${configured}>`;
  }
  return 'ClientSurge Systems <system@clientsurgesystems.com>';
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

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
      return { success: false, error: data.message || `Resend API error (${response.status})`, error_code: String(response.status) };
    }

    return { success: true, message_id: data.id };
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