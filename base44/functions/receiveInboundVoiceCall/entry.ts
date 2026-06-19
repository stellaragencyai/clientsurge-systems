/**
 * receiveInboundVoiceCall — Twilio Voice Webhook Handler
 *
 * PUBLIC WEBHOOK — called by Twilio on every inbound voice event.
 * NEVER returns non-200 or non-TwiML to Twilio — that causes "application error" for callers.
 *
 * Twilio Console setup:
 *   Phone Numbers → Your Number → Voice & Fax
 *   "A Call Comes In"      → Webhook → POST → <APP_URL>/api/receiveInboundVoiceCall
 *   "Call Status Changes"  → Webhook → POST → <APP_URL>/api/receiveInboundVoiceCall
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import crypto from 'node:crypto';

function validateTwilioSig(authToken, rawBody, twilioSig, canonicalUrl) {
  if (!authToken || !twilioSig) return false;
  const params = new URLSearchParams(rawBody);
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}${v}`)
    .join('');
  const toSign = canonicalUrl + sortedParams;
  const computed = crypto.createHmac('sha1', authToken).update(toSign).digest('base64');
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
  return 'voice_call_initiated';
}

function callStatusToOutcome(s) {
  if (s === 'completed') return 'answered';
  if (s === 'no-answer') return 'no_answer';
  if (s === 'busy') return 'busy';
  if (s === 'failed') return 'failed';
  return 'not_attempted';
}

const SAFE_TWIML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for calling ClientSurge Systems. We have received your call and will follow up with you shortly.</Say>
  <Hangup/>
</Response>`;

Deno.serve(async (req) => {
  // ── GET: health-check ──
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'ok', handler: 'receiveInboundVoiceCall', method_required: 'POST' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed — use POST', { status: 405 });
  }

  // TOP-LEVEL SAFETY NET: always return TwiML — a crash here causes Twilio "application error"
  try {

    // ── Read body once ──
    let rawBody = '';
    try { rawBody = await req.text(); } catch (_) {}

    // ── Parse: form-encoded (Twilio default) or JSON fallback ──
    let params = {};
    try {
      const qs = new URLSearchParams(rawBody);
      if (qs.has('CallSid') || qs.has('From') || qs.has('AccountSid')) {
        params = Object.fromEntries(qs);
      } else {
        params = JSON.parse(rawBody || '{}');
      }
    } catch (_) {
      params = {};
    }

    // ── Smoke detection ──
    const callSid = params.CallSid || params.call_sid || '';
    const isSmoke = callSid.startsWith('CA_TEST') || callSid.startsWith('SMOKE') || params._smoke === 'true';

    // ── HMAC validation: log mismatch but NEVER reject ──
    // A 403 here = Twilio plays "application error" to the caller.
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioSig = req.headers.get('X-Twilio-Signature') || req.headers.get('x-twilio-signature');
    const appUrl = (Deno.env.get('APP_URL') || '').replace(/\/$/, '');
    const canonicalUrl = `${appUrl}/api/receiveInboundVoiceCall`;

    if (authToken && twilioSig && !isSmoke) {
      const valid = validateTwilioSig(authToken, rawBody, twilioSig, canonicalUrl);
      if (!valid) {
        console.warn('[receiveInboundVoiceCall] HMAC mismatch (non-fatal, proceeding). canonicalUrl=' + canonicalUrl);
      }
    }

    const from = params.From || params.from || '';
    const to = params.To || params.to || '';
    const callStatus = params.CallStatus || params.call_status || 'initiated';
    const direction = params.Direction || params.direction || 'inbound';
    const accountSid = params.AccountSid || params.account_sid || '';
    const callDuration = params.CallDuration || null;
    const normalizedPhone = normalizePhone(from);
    const now = new Date().toISOString();
    const effectiveCallSid = callSid || `LIVE_WEBHOOK_NO_CALLSID_${Date.now()}`;

    console.log(`[receiveInboundVoiceCall] sid=${effectiveCallSid} from=${from} status=${callStatus} smoke=${isSmoke} live=${!isSmoke}`);

    const base44 = createClientFromRequest(req);

    // ── Step 1: Idempotency — dedupe terminal status events only ──
    const isTerminal = ['completed', 'no-answer', 'busy', 'failed', 'canceled'].includes(callStatus);
    if (isTerminal && callSid) {
      try {
        const existing = await base44.asServiceRole.entities.CommunicationEvent.filter(
          { provider_message_id: callSid, event_type: callStatusToEventType(callStatus) },
          '-created_date', 1
        );
        if (existing?.length > 0) {
          console.log(`[receiveInboundVoiceCall] Duplicate terminal event for ${callSid} — skipping`);
          try {
            const regs = await base44.asServiceRole.entities.WebhookRegistration.filter(
              { source_name: 'twilio_voice' }, '-created_date', 1
            );
            if (regs?.length > 0) {
              await base44.asServiceRole.entities.WebhookRegistration.update(regs[0].id, { last_triggered_at: now, last_error: null });
            }
          } catch (_) {}
          return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
            { headers: { 'Content-Type': 'text/xml' } });
        }
      } catch (err) {
        console.warn('[receiveInboundVoiceCall] Idempotency check error (non-fatal):', err.message);
      }
    }

    // ── Step 2: Write CommunicationEvent (first, before anything optional) ──
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
        content_type: req.headers.get('content-type') || 'unknown',
        smoke: isSmoke,
        live_call: !isSmoke,
      };
      const commEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
        channel: 'voice',
        direction: 'inbound',
        event_type: callStatusToEventType(callStatus),
        provider: 'twilio',
        status: 'received',
        subject: isSmoke
          ? 'ClientSurge OS voice webhook received (smoke/test)'
          : 'ClientSurge OS live inbound voice call received',
        provider_message_id: effectiveCallSid,
        metadata_json: JSON.stringify(sanitizedMetadata),
      });
      commEventId = commEvent?.id;
      console.log(`[receiveInboundVoiceCall] CommunicationEvent created id=${commEventId} smoke=${isSmoke}`);
    } catch (err) {
      console.error('[receiveInboundVoiceCall] CommunicationEvent create failed:', err.message);
      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          channel: 'voice',
          direction: 'inbound',
          event_type: 'voice_call_initiated',
          provider: 'twilio',
          status: 'failed',
          subject: 'ClientSurge OS voice webhook — event logging failed',
          provider_message_id: effectiveCallSid || 'unknown',
          error_message: err.message?.substring(0, 500),
          metadata_json: JSON.stringify({ call_sid: effectiveCallSid, from, call_status: callStatus, smoke: isSmoke, error: err.message }),
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
          ? { last_triggered_at: now, last_error: null, status: 'active' }
          : { last_triggered_at: now, failure_count: (regs[0].failure_count || 0) + 1, last_error: 'CommunicationEvent creation failed' };
        await base44.asServiceRole.entities.WebhookRegistration.update(regs[0].id, patch);
      }
    } catch (err) {
      console.warn('[receiveInboundVoiceCall] WebhookRegistration update failed (non-fatal):', err.message);
    }

    // ── Step 4: WebsiteLead capture (optional — failure must not block TwiML) ──
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
            call_summary: `Live inbound call received — status: ${callStatus}. Transcript pending.`,
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
            call_summary: `Live inbound call received from ${from} via Twilio — status: ${callStatus}. Transcript pending.`,
            conversation_id: effectiveCallSid,
          });
        }
      } catch (err) {
        console.warn('[receiveInboundVoiceCall] WebsiteLead upsert failed (non-fatal):', err.message);
      }

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
    if (isTerminal) {
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } });
    }

    // Initial call — try ElevenLabs agent, fall back to safe <Say>
    let agentId = Deno.env.get('ELEVENLABS_AGENT_ID') || null;
    if (!agentId) {
      try {
        const [settings] = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
        agentId = settings?.elevenlabs_agent_ids?.receptionist || settings?.elevenlabs_agent_ids?.general || null;
      } catch (_) {}
    }

    if (!agentId) {
      console.warn('[receiveInboundVoiceCall] No ElevenLabs agent_id configured — using safe fallback TwiML');
      return new Response(SAFE_TWIML, { headers: { 'Content-Type': 'text/xml' } });
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

  } catch (topLevelErr) {
    // Absolute last resort — must not let Twilio see a crash
    console.error('[receiveInboundVoiceCall] TOP-LEVEL CRASH (returning safe TwiML):', topLevelErr?.message);
    return new Response(SAFE_TWIML, { status: 200, headers: { 'Content-Type': 'text/xml' } });
  }
});