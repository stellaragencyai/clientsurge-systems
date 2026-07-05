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

// ── Finding #76: Circuit breaker for Twilio API calls ──
// 5 failures in 60s = open circuit, 30s cooldown before half-open retry
const circuit = { failures: 0, open: false, openedAt: null };
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_COOLDOWN_MS = 30_000;

function isCircuitOpen() {
  if (!circuit.open) return false;
  if (Date.now() - circuit.openedAt > CIRCUIT_COOLDOWN_MS) {
    circuit.open = false;
    circuit.failures = 0;
    return false;
  }
  return true;
}

function recordCircuitSuccess() {
  circuit.failures = 0;
  circuit.open = false;
  circuit.openedAt = null;
}

function recordCircuitFailure() {
  circuit.failures += 1;
  if (circuit.failures >= CIRCUIT_THRESHOLD) {
    circuit.open = true;
    circuit.openedAt = Date.now();
  }
}

// ── Finding #83: Retry with exponential backoff ──
// ── Finding #86: AbortController with 10-second timeout ──
const TWILIO_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const BACKOFF_DELAYS = [1000, 4000, 16000];

async function fetchTwilioWithRetry(url, options) {
  let response = null;
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TWILIO_TIMEOUT_MS);

      response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Success or client error (4xx) — don't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // 5xx — retry with backoff
      lastError = new Error(`Twilio returned ${response.status}`);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, BACKOFF_DELAYS[attempt] || 16000));
      }
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, BACKOFF_DELAYS[attempt] || 16000));
      }
    }
  }

  // Return last response (may be null if all retries failed)
  return response;
}

Deno.serve(async (req) => {
  try {
    const { phone, message, leadId } = await req.json();

    if (!phone || !message) {
      return json({ error: 'Phone and message required' }, 400);
    }

    // ── E.164 NORMALIZATION ──
    const rawPhone = phone;
    const normalizedPhone = normalizePhoneToE164(rawPhone);

    if (!normalizedPhone) {
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

    if (!accountSid || !authToken) {
      return json({ error: 'Twilio credentials not configured' }, 500);
    }

    const base44 = createClientFromRequest(req);
    let fromNumber = null;
    try {
      const settings = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
      if (settings?.[0]?.twilio_from_number) {
        fromNumber = settings[0].twilio_from_number;
      }
    } catch (e) {
      console.warn('[sendSMS] AdminSettings load failed:', e.message);
    }
    if (!fromNumber) {
      fromNumber = Deno.env.get('TWILIO_FROM_NUMBER') || Deno.env.get('TWILIO_PHONE_NUMBER');
    }
    if (fromNumber) {
      const digits = String(fromNumber).replace(/\D/g, '');
      if (digits.length === 10) fromNumber = `+1${digits}`;
      else if (digits.length === 11 && digits.startsWith('1')) fromNumber = `+${digits}`;
      else if (digits.length > 0) fromNumber = `+${digits}`;
      else fromNumber = null;
    }
    if (fromNumber === '+18778123630') {
      return json({ error: 'Twilio sender +18778123630 is BLOCKED. Use +16025843227. Update AdminSettings.twilio_from_number.' }, 500);
    }
    if (!fromNumber) {
      return json({ error: 'Twilio FROM number not configured. Set AdminSettings.twilio_from_number.' }, 500);
    }

    // Consent guard + tenant scope resolution
    let resolvedClientId = null;
    let resolvedClientProjectId = null;
    if (leadId) {
      try {
        const lead = await base44.asServiceRole.entities.Leads.get(leadId);
        if (lead) {
          resolvedClientId = lead.client_id || null;
          resolvedClientProjectId = lead.client_project_id || null;
          if (lead.do_not_contact === true) {
            return json({ error: 'Lead has do_not_contact flag', sms_sent: false, reason: 'do_not_contact', safe_to_continue: true }, 200);
          }
          if (lead.consent_given === false) {
            return json({ error: 'Lead has not given consent', sms_sent: false, reason: 'consent_not_given', safe_to_continue: true }, 200);
          }

          // ── Finding #142: SMS opt-out compliance ──
          // Check if the phone number is on the opt-out list
          try {
            const optOutRecords = await base44.asServiceRole.entities.Messages.filter(
              { direction: 'inbound', channel: 'sms', message_text: { $regex: /STOP|UNSUBSCRIBE|CANCEL|END|QUIT/i } },
              '-created_date',
              50
            );
            const optedOutPhones = new Set(
              (optOutRecords || []).map(m => normalizePhoneToE164(m.to_address || m.lead_phone || ''))
            );
            if (optedOutPhones.has(normalizedPhone)) {
              return json({ error: 'Phone number has opted out of SMS', sms_sent: false, reason: 'sms_opt_out', safe_to_continue: true }, 200);
            }
          } catch (_) {}
        }
      } catch (_) {}
    }

    // ── TENANT SCOPE GUARDRAIL ──
    if (!resolvedClientId) {
      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: leadId || undefined,
          channel: 'sms', direction: 'outbound', event_type: 'tenant_scope_blocked',
          provider: 'twilio', status: 'failed',
          error_message: 'missing_client_id_tenant_scope',
          metadata_json: JSON.stringify({ raw_phone: rawPhone, trigger_name: 'sendSMS' }),
        });
      } catch (_) {}
      return json({ error: 'Outbound SMS blocked: missing client_id tenant scope', sms_sent: false, reason: 'missing_client_id_tenant_scope', safe_to_continue: true }, 200);
    }
    const sendClientId = resolvedClientId;
    const sendClientProjectId = resolvedClientProjectId;

    // ── Finding #76: Circuit breaker check ──
    if (isCircuitOpen()) {
      if (leadId) {
        try {
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: leadId,
            client_id: sendClientId,
            client_project_id: sendClientProjectId,
            tenant_scope_status: 'scoped',
            channel: 'sms',
            direction: 'outbound',
            event_type: 'sms_skipped',
            provider: 'twilio',
            provider_from_number: fromNumber,
            status: 'failed',
            subject: 'SMS skipped — Twilio circuit breaker open',
            error_message: 'circuit_breaker_open',
            message_body: message,
            metadata_json: JSON.stringify({ reason: 'circuit_breaker_open', raw_phone: rawPhone, normalized_phone: normalizedPhone }),
          });
        } catch (_) {}
      }
      return json({ error: 'Twilio circuit breaker is open', sms_sent: false, reason: 'circuit_breaker_open', safe_to_continue: true }, 503);
    }

    const auth = btoa(`${accountSid}:${authToken}`);
    const statusCallbackUrl = Deno.env.get('TWILIO_SMS_STATUS_CALLBACK_URL');

    // ── Finding #83 + #86: Retry with exponential backoff + 10s timeout ──
    const response = await fetchTwilioWithRetry(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
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
      }
    );

    // Circuit breaker: record success/failure
    if (response && response.ok) {
      recordCircuitSuccess();
    } else {
      recordCircuitFailure();
    }

    if (!response || !response.ok) {
      let errorData = null;
      try { errorData = response ? await response.json() : null; } catch (_) {}
      if (leadId) {
        try {
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: leadId,
            client_id: sendClientId,
            client_project_id: sendClientProjectId,
            tenant_scope_status: 'scoped',
            channel: 'sms',
            direction: 'outbound',
            event_type: 'sms_failed',
            provider: 'twilio',
            provider_from_number: fromNumber,
            status: 'failed',
            message_body: message,
            error_message: errorData?.message || `Twilio error ${response?.status || 'timeout'}`,
            metadata_json: JSON.stringify({ raw_phone: rawPhone, normalized_phone: normalizedPhone, status_callback_url: statusCallbackUrl }),
          });
        } catch (_) {}
      }
      return json({ error: 'Failed to send SMS', details: errorData, normalized_phone: normalizedPhone }, 500);
    }

    const data = await response.json();

    // Log success
    if (leadId) {
      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: leadId,
          client_id: sendClientId,
          client_project_id: sendClientProjectId,
          tenant_scope_status: 'scoped',
          channel: 'sms',
          direction: 'outbound',
          event_type: 'sms_sent',
          provider: 'twilio',
          provider_from_number: fromNumber,
          status: 'sent',
          message_body: message,
          provider_message_id: data.sid || null,
          metadata_json: JSON.stringify({ raw_phone: rawPhone, normalized_phone: normalizedPhone, status_callback_url: statusCallbackUrl }),
        });

        await base44.asServiceRole.entities.Messages.create({
          lead_id: leadId,
          client_id: sendClientId,
          client_project_id: sendClientProjectId,
          tenant_scope_status: 'scoped',
          direction: 'outbound',
          channel: 'sms',
          message_text: message,
          status: 'sent',
          provider_from_number: fromNumber,
        });
      } catch (_) {}
    }

    return json({ success: true, messageSid: data.sid, normalized_phone: normalizedPhone });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});