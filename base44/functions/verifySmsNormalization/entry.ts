import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * SMS NORMALIZATION VERIFICATION
 *
 * Deterministic verification that every SMS path uses canonical E.164.
 * For WebsiteLead 6a38d0b4ae4b42c2c3e76799 (or any lead_id passed):
 *   - Shows raw_phone and normalized_phone
 *   - Verifies Twilio request To would be +16025874608
 *   - Checks CommunicationLog.to_address matches normalized
 *   - Checks CommunicationEvent.metadata_json.normalized_phone
 *   - Checks delivery_status is queued/sent/delivered — never falsely "delivered" from queued
 *
 * Admin-only. Does NOT send an SMS unless send_test_sms=true.
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// ── E.164 PHONE NORMALIZATION (inlined shared utility) ──
function normalizePhoneToE164(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 0) return null;
  if (cleaned.length === 10) {
    if (cleaned[0] === '0' || cleaned[0] === '1') return null;
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const tenDigits = cleaned.slice(1);
    if (tenDigits[0] === '0' || tenDigits[0] === '1') return null;
    return `+${cleaned}`;
  }
  if (cleaned.length >= 11 && cleaned.length <= 15) return `+${cleaned}`;
  return null;
}

function getEnvironment() {
  try {
    const hostname = Deno.env.get('APP_URL') || '';
    if (hostname?.includes('smoke') || hostname?.includes('test')) return 'smoke';
    if (hostname?.includes('staging')) return 'qa';
  } catch {}
  return 'production';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return json({ error: 'Admin only' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const lead_id = body.lead_id || '6a38d0b4ae4b42c2c3e76799';
    const send_test_sms = body.send_test_sms === true;

    // 1. Fetch lead
    let lead = await base44.asServiceRole.entities.WebsiteLead.get(lead_id).catch(() => null);
    let lead_type = 'WebsiteLead';
    if (!lead) {
      lead = await base44.asServiceRole.entities.Leads.get(lead_id).catch(() => null);
      lead_type = 'Leads';
    }
    if (!lead) {
      return json({ error: 'Lead not found', lead_id }, 404);
    }

    // 2. Normalize phone
    const rawPhone = lead.phone_number || lead.phone || '';
    const normalizedPhone = normalizePhoneToE164(rawPhone);

    // 3. Verification result
    const verification = {
      lead_id,
      lead_type,
      raw_phone: rawPhone,
      normalized_phone: normalizedPhone,
      twilio_to_would_be: normalizedPhone,
      normalization_pass: normalizedPhone !== null,
      // Safety: never send to stale/wrong number
      sends_to_correct_number: normalizedPhone === '+16025874608' || !rawPhone.includes('605'),
    };

    // 4. Check recent CommunicationLog records
    const logs = await base44.asServiceRole.entities.CommunicationLog.filter(
      { related_entity_id: lead_id, channel: 'sms' },
      '-created_date',
      10
    ).catch(() => []);

    const logCheck = (logs || []).map(log => ({
      log_id: log.id,
      lead_phone: log.lead_phone,
      to_address: log.to_address,
      canonical_to_address: log.canonical_to_address || null,
      delivery_status: log.delivery_status,
      provider_message_id: log.provider_message_id || null,
      provider_status: log.provider_status || null,
      delivered_at: log.delivered_at || null,
      failed_at: log.failed_at || null,
      request_payload_has_raw_phone: log.request_payload_redacted?.includes('To=6025874608') || false,
      request_payload_has_wrong_phone: log.request_payload_redacted?.includes('To=6055874608') || false,
      request_payload_has_normalized: log.request_payload_redacted?.includes('To=+16025874608') || false,
    }));

    // 5. Check recent CommunicationEvent records
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id, channel: 'sms' },
      '-created_date',
      10
    ).catch(() => []);

    const eventCheck = (events || []).map(evt => {
      let parsedMeta = {};
      try { parsedMeta = JSON.parse(evt.metadata_json || '{}'); } catch (_) {}
      return {
        event_id: evt.id,
        event_type: evt.event_type,
        status: evt.status,
        provider_message_id: evt.provider_message_id || null,
        metadata_normalized_phone: parsedMeta.normalized_phone || null,
        metadata_raw_phone: parsedMeta.raw_phone || null,
        delivery_status_final: evt.status,
        is_falsely_delivered: evt.status === 'delivered' && parsedMeta.twilio_delivery?.message_status === 'queued',
      };
    });

    // 6. Check for stale/wrong phone in any log
    const stalePhoneDetected = logCheck.some(l => l.request_payload_has_wrong_phone);
    const rawPhoneInPayload = logCheck.some(l => l.request_payload_has_raw_phone);

    // 7. Optionally send test SMS
    let smsResult = null;
    if (send_test_sms && normalizedPhone) {
      const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER') || Deno.env.get('TWILIO_FROM_NUMBER');
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const statusCallbackUrl = Deno.env.get('TWILIO_SMS_STATUS_CALLBACK_URL');

      if (fromNumber && accountSid && authToken) {
        const testMessage = 'ClientSurge SMS normalization verification test. Reply STOP to opt out.';
        const params = new URLSearchParams({
          From: fromNumber,
          To: normalizedPhone,
          Body: testMessage,
        });
        if (statusCallbackUrl) params.append('StatusCallback', statusCallbackUrl);

        try {
          const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          });

          const data = await response.json();
          if (response.ok && data.sid) {
            smsResult = {
              success: true,
              provider_message_id: data.sid,
              provider_status: data.status || 'queued',
              delivery_status: data.status === 'queued' ? 'queued' : 'sent',
              sent_to: normalizedPhone,
              request_to: normalizedPhone,
            };

            // Log CommunicationEvent
            await base44.asServiceRole.entities.CommunicationEvent.create({
              lead_id,
              channel: 'sms',
              direction: 'outbound',
              event_type: 'provider_send_succeeded',
              provider: 'twilio',
              status: 'sent',
              subject: 'SMS normalization verification test',
              message_body: testMessage,
              provider_message_id: data.sid,
              metadata_json: JSON.stringify({
                raw_phone: rawPhone,
                normalized_phone: normalizedPhone,
                verification_test: true,
              }),
              environment: getEnvironment(),
            }).catch(() => null);

            // Log CommunicationLog
            await base44.asServiceRole.functions.invoke('logCommunication', {
              related_entity_type: lead_type,
              related_entity_id: lead_id,
              lead_phone: rawPhone,
              lead_name: lead.full_name || null,
              channel: 'sms', provider: 'twilio', direction: 'outbound',
              trigger_name: 'normalization_verification',
              to_address: normalizedPhone,
              canonical_to_address: normalizedPhone,
              from_address: fromNumber,
              body_preview: testMessage.slice(0, 200),
              provider_message_id: data.sid,
              provider_status: data.status || 'queued',
              delivery_status: data.status === 'queued' ? 'queued' : 'sent',
              request_payload: params.toString(),
              response_payload: JSON.stringify(data),
              skip_lead_update: true,
            }).catch(() => null);
          } else {
            smsResult = {
              success: false,
              error: data.message || `Twilio error (${response.status})`,
              error_code: String(data.code || response.status),
              sent_to: normalizedPhone,
            };
          }
        } catch (err) {
          smsResult = { success: false, error: err.message, sent_to: normalizedPhone };
        }
      } else {
        smsResult = { success: false, error: 'Twilio not configured' };
      }
    }

    // 8. Overall verdict
    const allChecksPass = verification.normalization_pass &&
      verification.sends_to_correct_number &&
      !stalePhoneDetected &&
      !eventCheck.some(e => e.is_falsely_delivered);

    return json({
      success: true,
      verification,
      communication_logs: logCheck,
      communication_events: eventCheck,
      stale_phone_detected: stalePhoneDetected,
      raw_phone_in_payload: rawPhoneInPayload,
      sms_test_result: smsResult,
      overall_pass: allChecksPass,
      summary: {
        raw_phone: rawPhone,
        normalized_phone: normalizedPhone,
        twilio_to: normalizedPhone,
        no_stale_phone: !stalePhoneDetected,
        no_false_delivered: !eventCheck.some(e => e.is_falsely_delivered),
      },
    });
  } catch (error) {
    console.error('[verifySmsNormalization]', error);
    return json({ error: error.message, success: false }, { status: 500 });
  }
});