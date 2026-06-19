/**
 * receiveInboundVoiceCall — Twilio Voice Webhook Handler
 *
 * PUBLIC WEBHOOK — called by Twilio on every inbound voice event.
 *
 * Twilio Console setup:
 *   Phone Numbers → Your Number → Voice & Fax
 *   "A Call Comes In"      → Webhook → POST → <APP_URL>/api/receiveInboundVoiceCall
 *   "Call Status Changes"  → Webhook → POST → <APP_URL>/api/receiveInboundVoiceCall
 *
 * Root cause of prior 403 errors:
 *   Twilio signs the webhook using the PUBLIC URL (e.g. https://clientsurgesystems.com/api/...)
 *   but req.url inside Deno is the internal routing URL, so HMAC always mismatched.
 *   Fix: reconstruct the canonical URL from APP_URL env var for signature verification.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import crypto from 'node:crypto';

// ── Twilio HMAC-SHA1 signature validation ──
// Must use the exact public URL Twilio used (from APP_URL, not req.url which is internal).
function validateTwilioSig(authToken, rawBody, twilioSig, canonicalUrl) {
  if (!authToken || !twilioSig) return false;
  const params = new URLSearchParams(rawBody);
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}${v}`)
    .join('');
  const toSign = canonicalUrl + sortedParams;
  const computed = crypto.createHmac('sha1', authToken).update(toSign).digest('base64');
  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(twilioSig));
  } catch {
    return computed === twilioSig;
  }
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  if (digits.length > 11) return `+${digits}`;
  return null;
}

function callStatusToEventType(s) {
  if (s === 'completed') return 'voice_call_completed';
  if (s === 'no-answer' || s === 'busy' || s === 'failed' || s === 'canceled') return 'voice_call_no_answer';
  if (s === 'in-progress' || s === 'answered') return 'voice_call_answered';
  return 'voice_call_initiated'; // ringing, initiated, queued, or unknown
}

function callStatusToOutcome(s) {
  if (s === 'completed') return 'answered';
  if (s === 'no-answer') return 'no_answer';
  if (s === 'busy') return 'busy';
  if (s === 'failed') return 'failed';
  return 'not_attempted';
}

Deno.serve(async (req) => {
  // ── GET: health-check for monitoring / route verification ──
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        handler: 'receiveInboundVoiceCall',
        method_required: 'POST',
        description: 'Twilio inbound voice webhook handler. Configure this URL in Twilio Console → Phone Numbers → Voice → A Call Comes In → Webhook → POST.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── All other non-POST methods ──
  if (req.method !== 'POST') {
    return new Response('Method not allowed — use POST', { status: 405 });
  }

  // ── Read body once ──
  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch (_) {}

  // ── Parse — support form-encoded (Twilio default) and JSON fallback ──
  let params = {};
  try {
    const qs = new URLSearchParams(rawBody);
    if (qs.has('CallSid') || qs.has('From')) {
      params = Object.fromEntries(qs);
    } else {
      // Try JSON (e.g. internal smoke tests)
      params = JSON.parse(rawBody || '{}');
    }
  } catch (_) {
    params = {};
  }

  // ── Determine if this is a smoke/internal test payload ──
  const callSid = params.CallSid || params.call_sid || '';
  const isSmoke = callSid.startsWith('CA_TEST') || callSid.startsWith('SMOKE') || params._smoke === 'true';

  // ── Twilio signature validation ──
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioSig = req.headers.get('X-Twilio-Signature') || req.headers.get('x-twilio-signature');
  const appUrl = (Deno.env.get('APP_URL') || '').replace(/\/$/, '');
  const canonicalUrl = `${appUrl}/api/receiveInboundVoiceCall`;

  if (authToken && twilioSig && !isSmoke) {
    const valid = validateTwilioSig(authToken, rawBody, twilioSig, canonicalUrl);
    if (!valid) {
      console.warn('[receiveInboundVoiceCall] Invalid Twilio HMAC signature — rejected. canonicalUrl=' + canonicalUrl);
      return new Response('Forbidden', { status: 403 });
    }
  }
  // No authToken set, or smoke test, or no Twilio signature present → accept (dev/smoke mode)

  const from = params.From || params.from || '';
  const to = params.To || params.to || '';
  const callStatus = params.CallStatus || params.call_status || 'initiated';
  const direction = params.Direction || params.direction || 'inbound';
  const accountSid = params.AccountSid || params.account_sid || '';
  const callDuration = params.CallDuration || null;
  const normalizedPhone = normalizePhone(from);
  const now = new Date().toISOString();
  const effectiveCallSid = callSid || `VOICE_${Date.now()}`;

  console.log(`[receiveInboundVoiceCall] sid=${effectiveCallSid} from=${from} status=${callStatus} smoke=${isSmoke}`);

  const base44 = createClientFromRequest(req);

  // ── Step 1: Idempotency — dedupe on CallSid for terminal status events ──
  const isTerminal = ['completed', 'no-answer', 'busy', 'failed', 'canceled'].includes(callStatus);
  if (isTerminal && callSid) {
    try {
      const existing = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { provider_message_id: callSid, event_type: callStatusToEventType(callStatus) },
        '-created_date', 1
      );
      if (existing?.length > 0) {
        console.log(`[receiveInboundVoiceCall] Duplicate terminal event for ${callSid} — skipping creation`);
        // Still update last_triggered_at on the registration
        try {
          const regs = await base44.asServiceRole.entities.WebhookRegistration.filter({ source_name: 'twilio_voice' }, '-created_date', 1);
          if (regs?.length > 0) {
            await base44.asServiceRole.entities.WebhookRegistration.update(regs[0].id, { last_triggered_at: now, last_error: null });
          }
        } catch (_) {}
        return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
          headers: { 'Content-Type': 'text/xml' },
        });
      }
    } catch (err) {
      console.warn('[receiveInboundVoiceCall] Idempotency check error:', err.message);
    }
  }

  // ── Step 2: Create CommunicationEvent ──
  let commEventId = null;
  try {
    const sanitizedMetadata = {
      call_sid: effectiveCallSid,
      from,
      to,
      call_status: callStatus,
      direction,
      account_sid_present: !!accountSid,
      call_duration: callDuration,
      received_at: now,
      source_route: '/api/receiveInboundVoiceCall',
      is_smoke: isSmoke,
    };
    const commEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: 'voice',
      direction: 'inbound',
      event_type: callStatusToEventType(callStatus),
      provider: 'twilio',
      status: 'received',
      subject: 'ClientSurge OS voice webhook received',
      provider_message_id: effectiveCallSid,
      metadata_json: JSON.stringify(sanitizedMetadata),
    });
    commEventId = commEvent?.id;
    console.log(`[receiveInboundVoiceCall] CommunicationEvent created: ${commEventId}`);
  } catch (err) {
    console.error('[receiveInboundVoiceCall] CommunicationEvent create failed:', err.message);
    // Attempt a failure-record fallback
    try {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        channel: 'voice',
        direction: 'inbound',
        event_type: 'voice_call_initiated',
        provider: 'twilio',
        status: 'failed',
        subject: 'ClientSurge OS voice webhook received',
        provider_message_id: effectiveCallSid || 'unknown',
        error_message: err.message?.substring(0, 500),
        metadata_json: JSON.stringify({ call_sid: effectiveCallSid, from, call_status: callStatus, error: err.message, is_smoke: isSmoke }),
      });
    } catch (_) {}
  }

  // ── Step 3: Update WebhookRegistration ──
  try {
    const regs = await base44.asServiceRole.entities.WebhookRegistration.filter(
      { source_name: 'twilio_voice' }, '-created_date', 1
    );
    if (regs?.length > 0) {
      const patch = commEventId
        ? { last_triggered_at: now, last_error: null }
        : { last_triggered_at: now, failure_count: (regs[0].failure_count || 0) + 1, last_error: 'CommunicationEvent creation failed' };
      await base44.asServiceRole.entities.WebhookRegistration.update(regs[0].id, patch);
    }
  } catch (err) {
    console.warn('[receiveInboundVoiceCall] WebhookRegistration update failed:', err.message);
  }

  // ── Step 4: WebsiteLead upsert (caller capture) ──
  if (normalizedPhone) {
    try {
      const existingLeads = await base44.asServiceRole.entities.WebsiteLead.filter(
        { phone_number: normalizedPhone }, '-created_date', 1
      );
      if (existingLeads?.length > 0) {
        await base44.asServiceRole.entities.WebsiteLead.update(existingLeads[0].id, {
          call_sid: effectiveCallSid,
          last_engagement_type: 'call',
          last_engagement_at: now,
          call_summary: `Inbound call received — status: ${callStatus}. Transcript pending.`,
        });
      } else {
        await base44.asServiceRole.entities.WebsiteLead.create({
          phone_number: normalizedPhone,
          full_name: 'Inbound Caller',
          source: 'elevenlabs_sarah_ai_receptionist',
          call_sid: effectiveCallSid,
          last_engagement_type: 'call',
          last_engagement_at: now,
          lead_status: 'new',
          call_summary: `Inbound call received from ${from} via Twilio — status: ${callStatus}. Transcript pending.`,
          conversation_id: effectiveCallSid,
        });
      }
    } catch (err) {
      console.warn('[receiveInboundVoiceCall] WebsiteLead upsert failed:', err.message);
    }

    // Update canonical Leads record if matched by normalized phone
    try {
      const canonicalLeads = await base44.asServiceRole.entities.Leads.filter(
        { normalized_phone: normalizedPhone }, '-created_date', 1
      );
      if (canonicalLeads?.length > 0) {
        await base44.asServiceRole.entities.Leads.update(canonicalLeads[0].id, {
          voice_call_attempted: true,
          voice_call_outcome: callStatusToOutcome(callStatus),
          last_contacted_at: now,
          last_activity_at: now,
        });
      }
    } catch (_) {}
  }

  // ── Step 5: Return TwiML ──
  // Status callbacks get empty TwiML
  if (isTerminal) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Initial call: try ElevenLabs agent, fall back to safe Say
  let agentId = Deno.env.get('ELEVENLABS_AGENT_ID') || null;
  if (!agentId) {
    try {
      const [settings] = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
      agentId = settings?.elevenlabs_agent_ids?.receptionist || settings?.elevenlabs_agent_ids?.general || null;
    } catch (_) {}
  }

  if (!agentId) {
    console.warn('[receiveInboundVoiceCall] No ElevenLabs agent_id — returning safe fallback TwiML');
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thank you for calling ClientSurge Systems. Please hold while we connect your call.</Say>
  <Pause length="2"/>
  <Say voice="Polly.Joanna">We will follow up with you shortly. Goodbye!</Say>
  <Hangup/>
</Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://api.elevenlabs.io/v1/convai/call?agent_id=${agentId}"/>
  </Connect>
</Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  );
});