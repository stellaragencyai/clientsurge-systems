import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * INSTANT SMS EXECUTION
 *
 * Fixes:
 * - Fetches lead directly (no dependency on non-existent job.recipient_phone)
 * - Normalizes phone to E.164 before calling Twilio
 * - Skips cleanly on invalid phone (sms_skipped event)
 * - Creates provider_send_attempted / provider_send_succeeded / provider_send_failed events
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
      // Log skip — lead not found
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: job.lead_id,
        channel: 'sms',
        direction: 'outbound',
        event_type: 'sms_skipped',
        provider: 'twilio',
        status: 'failed',
        subject: 'SMS skipped — lead not found',
        error_message: 'lead_not_found',
        metadata_json: JSON.stringify({ job_id }),
        environment: getEnvironment(),
      });
      return Response.json({ success: false, skipped: true, error: 'lead_not_found', job_id });
    }

    // 3. Get phone from lead and normalize to E.164
    const rawPhone = lead.phone_number || lead.phone || '';
    const normalizedPhone = normalizePhoneToE164(rawPhone);

    if (!normalizedPhone) {
      // Skip — invalid phone, do NOT call Twilio
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: job.lead_id,
        client_id: lead.client_id || null,
        client_project_id: lead.client_project_id || null,
        channel: 'sms',
        direction: 'outbound',
        event_type: 'sms_skipped',
        provider: 'twilio',
        status: 'failed',
        subject: 'SMS skipped — invalid phone number',
        error_message: 'invalid_phone_number',
        metadata_json: JSON.stringify({ job_id, raw_phone: rawPhone }),
        environment: getEnvironment(),
      });
      return Response.json({ success: false, skipped: true, error: 'invalid_phone_number', job_id, normalized_phone: null });
    }

    // 4. Get admin settings and template
    const settings = await base44.asServiceRole.entities.AdminSettings.list().then(s => s?.[0]);
    const fromNumber = settings?.twilio_from_number || Deno.env.get('TWILIO_PHONE_NUMBER') || Deno.env.get('TWILIO_FROM_NUMBER');

    if (!fromNumber) {
      return Response.json({ success: false, error: 'Twilio from number not configured', job_id, normalized_phone: normalizedPhone });
    }

    const template = settings?.sms_template || settings?.sms_template_instant ||
      'We received your inquiry! Our team will be in touch shortly with more details. Reply STOP to opt out.';

    // 5. Log provider_send_attempted
    const attemptEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: job.lead_id,
      client_id: lead.client_id || null,
      client_project_id: lead.client_project_id || null,
      channel: 'sms',
      direction: 'outbound',
      event_type: 'provider_send_attempted',
      provider: 'twilio',
      status: 'pending',
      subject: 'SMS send attempt via Twilio',
      message_body: template,
      metadata_json: JSON.stringify({ job_id, normalized_phone: normalizedPhone, from_number: fromNumber }),
      environment: getEnvironment(),
    });

    // 6. Send SMS via Twilio (always with normalized E.164 number)
    const twilioResult = await sendViaTwilio(fromNumber, normalizedPhone, template);

    // 7. Log success or failure
    const now = new Date().toISOString();
    if (twilioResult.success) {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: job.lead_id,
        client_id: lead.client_id || null,
        client_project_id: lead.client_project_id || null,
        channel: 'sms',
        direction: 'outbound',
        event_type: 'provider_send_succeeded',
        provider: 'twilio',
        status: 'sent',
        subject: 'SMS sent successfully',
        message_body: template,
        provider_message_id: twilioResult.message_id,
        metadata_json: JSON.stringify({ job_id, attempt_event_id: attemptEvent.id, normalized_phone: normalizedPhone, raw_phone: rawPhone }),
        environment: getEnvironment(),
      });

      // Also create CommunicationLog with canonical_to_address
      base44.asServiceRole.functions.invoke('logCommunication', {
        related_entity_type: lead_type,
        related_entity_id: job.lead_id,
        lead_phone: rawPhone,
        lead_name: lead.full_name || lead.business_name || null,
        channel: 'sms', provider: 'twilio', direction: 'outbound',
        trigger_name: 'instant_sms',
        to_address: normalizedPhone,
        canonical_to_address: normalizedPhone,
        from_address: fromNumber,
        body_preview: template.slice(0, 200),
        provider_message_id: twilioResult.message_id,
        provider_status: 'queued',
        delivery_status: 'queued',
        skip_lead_update: true,
      }).catch(() => {});

      // Update lead tracking
      const updateData = {
        sms_attempt_count: (lead.sms_attempt_count || 0) + 1,
        last_message_sent: now,
        last_engagement_type: 'sms',
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
        channel: 'sms',
        direction: 'outbound',
        event_type: 'provider_send_failed',
        provider: 'twilio',
        status: 'failed',
        subject: 'SMS send failed',
        message_body: template,
        error_message: twilioResult.error,
        metadata_json: JSON.stringify({ job_id, attempt_event_id: attemptEvent.id, normalized_phone: normalizedPhone, raw_phone: rawPhone, error_code: twilioResult.error_code }),
        environment: getEnvironment(),
      });

      // Also log failure to CommunicationLog
      base44.asServiceRole.functions.invoke('logCommunication', {
        related_entity_type: lead_type,
        related_entity_id: job.lead_id,
        lead_phone: rawPhone,
        lead_name: lead.full_name || lead.business_name || null,
        channel: 'sms', provider: 'twilio', direction: 'outbound',
        trigger_name: 'instant_sms',
        to_address: normalizedPhone,
        canonical_to_address: normalizedPhone,
        from_address: fromNumber,
        body_preview: template.slice(0, 200),
        delivery_status: 'failed',
        error_code: twilioResult.error_code || null,
        error_message: twilioResult.error,
        skip_lead_update: true,
      }).catch(() => {});

      // Update attempt count even on failure
      const updateData = { sms_attempt_count: (lead.sms_attempt_count || 0) + 1 };
      if (lead_type === 'WebsiteLead') {
        await base44.asServiceRole.entities.WebsiteLead.update(job.lead_id, updateData);
      } else {
        await base44.asServiceRole.entities.Leads.update(job.lead_id, updateData);
      }
    }

    return Response.json({
      success: twilioResult.success,
      job_id,
      message_id: twilioResult.message_id,
      error: twilioResult.error,
      normalized_phone: normalizedPhone,
      final_status: twilioResult.success ? 'sms_sent' : 'sms_failed',
    });
  } catch (error) {
    console.error('[executeInstantSms]', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});

// ── Phone normalization to E.164 ──
// Accepts: "6055874608", "(605) 587-4608", "+16055874608", "16055874608"
// Returns: "+16055874608" or null if invalid
function normalizePhoneToE164(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 0) return null;
  // US: 10 digits -> +1XXXXXXXXXX
  if (cleaned.length === 10) return `+1${cleaned}`;
  // US with country code: 11 digits starting with 1 -> +1XXXXXXXXXX
  if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
  // International: 11-15 digits -> +XXXXXXXXX
  if (cleaned.length >= 11 && cleaned.length <= 15) return `+${cleaned}`;
  return null;
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
      return { success: false, error: data.message || `Twilio API error (${response.status})`, error_code: String(data.code || response.status) };
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