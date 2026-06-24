import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function appendSmsOptOut(message) {
  if (!message) return "";
  const trimmed = message.trim();
  if (/\bSTOP\b/i.test(trimmed)) return trimmed;
  return `${trimmed}\n\nReply STOP to opt out.`;
}

// ── E.164 PHONE NORMALIZATION ──
// Inlined shared utility — every SMS path must call this before building
// the Twilio request payload. Returns null if invalid.
function normalizePhoneToE164(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 0) return null;
  // US 10-digit → +1 + 10 digits
  if (cleaned.length === 10) {
    if (cleaned[0] === '0' || cleaned[0] === '1') return null;
    return `+1${cleaned}`;
  }
  // US 11-digit starting with 1 → +1XXXXXXXXXX
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const tenDigits = cleaned.slice(1);
    if (tenDigits[0] === '0' || tenDigits[0] === '1') return null;
    return `+${cleaned}`;
  }
  // International 11–15 digits → +
  if (cleaned.length >= 11 && cleaned.length <= 15) return `+${cleaned}`;
  return null;
}

Deno.serve(async (req) => {
  try {
    const { phone, message, leadId } = await req.json();

    if (!phone || !message) {
      return json({ error: 'Phone and message required' }, 400);
    }

    // ── E.164 NORMALIZATION ──
    // Every SMS path must normalize before building the Twilio payload.
    const rawPhone = phone;
    const normalizedPhone = normalizePhoneToE164(rawPhone);

    if (!normalizedPhone) {
      // Invalid phone — do NOT call Twilio
      if (leadId) {
        try {
          const base44 = createClientFromRequest(req);
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: leadId,
            channel: 'sms',
            direction: 'outbound',
            event_type: 'sms_skipped',
            provider: 'twilio',
            status: 'failed',
            subject: 'SMS skipped — invalid phone number',
            error_message: 'invalid_phone_number',
            metadata_json: JSON.stringify({ raw_phone: rawPhone, normalized_phone: null }),
          });
        } catch (_) {}
      }
      return json({ error: 'Invalid phone number', sms_sent: false, reason: 'invalid_phone_number', raw_phone: rawPhone, normalized_phone: null }, 400);
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return json({ error: 'Twilio credentials not configured' }, 500);
    }

    // Consent guard: if leadId provided, check lead consent before sending
    if (leadId) {
      try {
        const base44 = createClientFromRequest(req);
        const lead = await base44.asServiceRole.entities.Leads.get(leadId);
        if (lead) {
          if (lead.do_not_contact === true) {
            return json({
              error: 'Lead has do_not_contact flag',
              sms_sent: false,
              reason: 'do_not_contact',
              safe_to_continue: true,
            }, 200);
          }
          if (lead.consent_given === false) {
            return json({
              error: 'Lead has not given consent',
              sms_sent: false,
              reason: 'consent_not_given',
              safe_to_continue: true,
            }, 200);
          }
        }
      } catch (_) {
        // Lead lookup failed — proceed with send (non-blocking guard)
      }
    }

    const auth = btoa(`${accountSid}:${authToken}`);
    const statusCallbackUrl = Deno.env.get('TWILIO_SMS_STATUS_CALLBACK_URL');
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: normalizedPhone,
        Body: appendSmsOptOut(message),
        ...(statusCallbackUrl && { StatusCallback: statusCallbackUrl }),
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      // Log failed CommunicationEvent
      if (leadId) {
        try {
          const base44 = createClientFromRequest(req);
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: leadId,
            channel: 'sms',
            direction: 'outbound',
            event_type: 'sms_failed',
            provider: 'twilio',
            status: 'failed',
            message_body: message,
            error_message: data.message || `Twilio error ${response.status}`,
            metadata_json: JSON.stringify({ raw_phone: rawPhone, normalized_phone: normalizedPhone, status_callback_url: statusCallbackUrl }),
             });
            } catch (_) {}
            }
            return json({ error: 'Failed to send SMS', details: data, normalized_phone: normalizedPhone }, 500);
    }

    // Log success
    if (leadId) {
      try {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: leadId,
          channel: 'sms',
          direction: 'outbound',
          event_type: 'sms_sent',
          provider: 'twilio',
          status: 'sent',
          message_body: message,
          provider_message_id: data.sid || null,
          metadata_json: JSON.stringify({ raw_phone: rawPhone, normalized_phone: normalizedPhone, status_callback_url: statusCallbackUrl }),
          });

          await base44.entities.Messages.create({
          lead_id: leadId,
          direction: 'outbound',
          channel: 'sms',
          message_text: message,
          status: 'sent',
        });
      } catch (_) {}
    }

    return json({ success: true, messageSid: data.sid, normalized_phone: normalizedPhone });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});