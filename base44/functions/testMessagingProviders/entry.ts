import { resendFetch } from "../_shared/resendFetch.js";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * DETERMINISTIC MESSAGING PROVIDER REGRESSION TEST
 *
 * Directly tests Twilio SMS and Resend email send paths for a single failed lead.
 * Bypasses the broken queue/orchestrator.
 *
 * Payload:
 * {
 *   lead_id: string,
 *   test_sms: boolean,
 *   test_email: boolean,
 *   sms_job_id?: string,
 *   email_job_id?: string,
 * }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only', success: false }, { status: 403 });
    }

    const { lead_id, test_sms, test_email, sms_job_id, email_job_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'Missing lead_id', success: false }, { status: 400 });
    }

    const test_run_id = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const results = { test_run_id, sms: null, email: null };

    // Load lead
    let lead = await base44.asServiceRole.entities.WebsiteLead.get(lead_id).catch(() => null);
    if (!lead) {
      lead = await base44.asServiceRole.entities.Leads.get(lead_id).catch(() => null);
    }
    if (!lead) {
      return Response.json({ error: 'Lead not found', success: false, lead_id }, { status: 404 });
    }

    // 1. Validate lead
    const validation = {
      raw_phone: lead.phone_number || lead.phone || null,
      email: lead.email || null,
      consent_given: lead.consent_given || false,
      sms_permission: lead.sms_permission || false,
      source_page: lead.source_page || null,
    };

    // 2. SMS test
    if (test_sms) {
      const smsResult = await testSmsSend(base44, lead, test_run_id);
      results.sms = smsResult;

      // Update job if provided
      if (sms_job_id) {
        const jobUpdate = {
          attempts: 1,
          processed_at: new Date().toISOString(),
          last_error: smsResult.success ? null : smsResult.error,
          result_metadata: JSON.stringify({
            test_run_id,
            normalized_phone: smsResult.normalized_phone,
            provider_message_id: smsResult.message_id,
            provider: 'twilio',
            attempt: 1,
            error: smsResult.success ? null : smsResult.error,
            success: smsResult.success,
          }),
          status: smsResult.success ? 'completed' : 'failed',
        };
        await base44.asServiceRole.entities.AutomationJob.update(sms_job_id, jobUpdate).catch(() => {});
      }
    }

    // 3. Email test
    if (test_email) {
      const emailResult = await testEmailSend(base44, lead, test_run_id);
      results.email = emailResult;

      // Update job if provided
      if (email_job_id) {
        const jobUpdate = {
          attempts: 1,
          processed_at: new Date().toISOString(),
          last_error: emailResult.success ? null : emailResult.error,
          result_metadata: JSON.stringify({
            test_run_id,
            recipient_email: emailResult.recipient_email,
            provider_message_id: emailResult.message_id,
            provider: 'resend',
            attempt: 1,
            error: emailResult.success ? null : emailResult.error,
            success: emailResult.success,
          }),
          status: emailResult.success ? 'completed' : 'failed',
        };
        await base44.asServiceRole.entities.AutomationJob.update(email_job_id, jobUpdate).catch(() => {});
      }
    }

    return Response.json({
      success: (test_sms ? results.sms?.success : true) && (test_email ? results.email?.success : true),
      test_run_id,
      lead_id,
      validation,
      results,
    });
  } catch (error) {
    console.error('[testMessagingProviders]', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});

// ── SMS Test ──
async function testSmsSend(base44, lead, test_run_id) {
  const rawPhone = lead.phone_number || lead.phone || '';
  const normalizedPhone = normalizePhoneToE164(rawPhone);

  if (!normalizedPhone) {
    const evt = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead.id,
      channel: 'sms',
      direction: 'outbound',
      event_type: 'sms_skipped',
      provider: 'twilio',
      status: 'failed',
      subject: 'SMS regression test skipped — invalid phone',
      error_message: 'invalid_phone_number',
      metadata_json: JSON.stringify({ test_run_id, raw_phone: rawPhone }),
      environment: 'test',
    }).catch(() => null);

    return {
      success: false,
      skipped: true,
      error: 'invalid_phone_number',
      normalized_phone: null,
      communication_event_id: evt?.id,
    };
  }

  // Send test SMS
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER') || Deno.env.get('TWILIO_FROM_NUMBER');
  if (!fromNumber) {
    return { success: false, error: 'Twilio not configured', normalized_phone: normalizedPhone };
  }

  const testMessage = 'ClientSurge internal SMS delivery test.';

  // Log attempt
  const attemptEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: lead.id,
    channel: 'sms',
    direction: 'outbound',
    event_type: 'provider_send_attempted',
    provider: 'twilio',
    status: 'pending',
    subject: 'SMS regression test attempt',
    message_body: testMessage,
    metadata_json: JSON.stringify({ test_run_id, normalized_phone: normalizedPhone }),
    environment: 'test',
  }).catch(() => null);

  // Send
  const twilioResult = await sendViaTwilio(fromNumber, normalizedPhone, testMessage);

  // Log result
  if (twilioResult.success) {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead.id,
      channel: 'sms',
      direction: 'outbound',
      event_type: 'provider_send_succeeded',
      provider: 'twilio',
      status: 'sent',
      subject: 'SMS regression test sent',
      message_body: testMessage,
      provider_message_id: twilioResult.message_id,
      metadata_json: JSON.stringify({ test_run_id, normalized_phone: normalizedPhone, attempt_event_id: attemptEvent?.id }),
      environment: 'test',
    }).catch(() => null);
  } else {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead.id,
      channel: 'sms',
      direction: 'outbound',
      event_type: 'provider_send_failed',
      provider: 'twilio',
      status: 'failed',
      subject: 'SMS regression test failed',
      message_body: testMessage,
      error_message: twilioResult.error,
      metadata_json: JSON.stringify({ test_run_id, normalized_phone: normalizedPhone, attempt_event_id: attemptEvent?.id, error_code: twilioResult.error_code }),
      environment: 'test',
    }).catch(() => null);
  }

  return {
    success: twilioResult.success,
    normalized_phone: normalizedPhone,
    message_id: twilioResult.message_id,
    error: twilioResult.error,
    error_code: twilioResult.error_code,
  };
}

// ── Email Test ──
async function testEmailSend(base44, lead, test_run_id) {
  const recipientEmail = (lead.email || '').trim();

  if (!recipientEmail || !isValidEmail(recipientEmail)) {
    const evt = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead.id,
      channel: 'email',
      direction: 'outbound',
      event_type: 'email_skipped',
      provider: 'resend',
      status: 'failed',
      subject: 'Email regression test skipped — invalid address',
      error_message: 'invalid_email_address',
      metadata_json: JSON.stringify({ test_run_id, raw_email: recipientEmail }),
      environment: 'test',
    }).catch(() => null);

    return {
      success: false,
      skipped: true,
      error: 'invalid_email_address',
      recipient_email: recipientEmail,
      communication_event_id: evt?.id,
    };
  }

  const fromEmail = getSafeResendFrom();
  if (!fromEmail || !fromEmail.includes('@')) {
    return { success: false, error: 'Resend not configured', recipient_email: recipientEmail };
  }

  const testSubject = 'ClientSurge internal email delivery test';
  const testBody = 'This is a ClientSurge internal Resend delivery test.';

  // Log attempt
  const attemptEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: lead.id,
    channel: 'email',
    direction: 'outbound',
    event_type: 'provider_send_attempted',
    provider: 'resend',
    status: 'pending',
    subject: 'Email regression test attempt',
    message_body: testBody,
    metadata_json: JSON.stringify({ test_run_id, recipient_email: recipientEmail }),
    environment: 'test',
  }).catch(() => null);

  // Send
  const resendResult = await sendViaResend(fromEmail, recipientEmail, testSubject, testBody);

  // Log result
  if (resendResult.success) {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead.id,
      channel: 'email',
      direction: 'outbound',
      event_type: 'provider_send_succeeded',
      provider: 'resend',
      status: 'sent',
      subject: 'Email regression test sent',
      message_body: testBody,
      provider_message_id: resendResult.message_id,
      metadata_json: JSON.stringify({ test_run_id, recipient_email: recipientEmail, attempt_event_id: attemptEvent?.id }),
      environment: 'test',
    }).catch(() => null);
  } else {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead.id,
      channel: 'email',
      direction: 'outbound',
      event_type: 'provider_send_failed',
      provider: 'resend',
      status: 'failed',
      subject: 'Email regression test failed',
      message_body: testBody,
      error_message: resendResult.error,
      metadata_json: JSON.stringify({ test_run_id, recipient_email: recipientEmail, attempt_event_id: attemptEvent?.id, error_code: resendResult.error_code }),
      environment: 'test',
    }).catch(() => null);
  }

  return {
    success: resendResult.success,
    recipient_email: recipientEmail,
    message_id: resendResult.message_id,
    error: resendResult.error,
    error_code: resendResult.error_code,
  };
}

// ── Helpers ──
function normalizePhoneToE164(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 0) return null;
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
  if (cleaned.length >= 11 && cleaned.length <= 15) return `+${cleaned}`;
  return null;
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getSafeResendFrom() {
  const configured = String(Deno.env.get('RESEND_FROM_EMAIL') || '').trim();
  if (configured && configured.includes('@')) {
    if (configured.includes('<')) return configured;
    return `ClientSurge Systems <${configured}>`;
  }
  return 'ClientSurge Systems <system@clientsurgesystems.com>';
}

async function sendViaTwilio(fromNumber, toNumber, message) {
  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      return { success: false, error: 'Twilio credentials not set' };
    }

    const statusCallbackUrl = Deno.env.get('TWILIO_SMS_STATUS_CALLBACK_URL');
    const body = new URLSearchParams({
      From: fromNumber,
      To: toNumber,
      Body: message,
    });
    if (statusCallbackUrl) body.append('StatusCallback', statusCallbackUrl);

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
      return { success: false, error: data.message || `Twilio error (${response.status})`, error_code: String(data.code || response.status) };
    }

    return { success: true, message_id: data.sid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendViaResend(fromEmail, toEmail, subject, html) {
  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');

    if (!apiKey) {
      return { success: false, error: 'Resend API key not set' };
    }

    const response = await resendFetch('https://api.resend.com/emails', {
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
      return { success: false, error: data.message || `Resend error (${response.status})`, error_code: String(response.status) };
    }

    return { success: true, message_id: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}