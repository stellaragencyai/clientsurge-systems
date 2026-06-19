/**
 * receiveInboundVoiceCall — Twilio Voice Webhook Handler
 *
 * PUBLIC WEBHOOK — called by Twilio on every inbound voice event.
 *
 * Twilio Console setup:
 *   Phone Numbers → Your Number → Voice & Fax
 *   "A Call Comes In" → Webhook → POST → <appUrl>/api/receiveInboundVoiceCall
 *   "Call Status Changes" → same URL → POST (for status callbacks)
 *
 * What this does on every hit:
 *   1. Validates Twilio HMAC signature
 *   2. Creates an immutable CommunicationEvent (channel=voice, provider=twilio)
 *      using CallSid as idempotency key to prevent duplicate records on Twilio retries
 *   3. Creates/updates WebsiteLead keyed by normalized caller phone
 *   4. Updates WebhookRegistration.last_triggered_at
 *   5. Returns TwiML to connect caller to ElevenLabs AI receptionist (or fallback)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import crypto from 'node:crypto';

function validateTwilioSig(req, rawBody) {
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  if (!token) return false;
  const sig = req.headers.get('X-Twilio-Signature');
  if (!sig) return false;
  // Reconstruct the URL exactly as Twilio used it
  const url = req.url;
  const params = new URLSearchParams(rawBody);
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}${v}`)
    .join('');
  const toSign = url + sortedParams;
  const computed = crypto.createHmac('sha1', token).update(toSign).digest('base64');
  return computed === sig;
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `+${digits.length === 10 ? '1' : ''}${digits}`;
}

function callStatusToEventType(callStatus) {
  if (callStatus === 'completed') return 'voice_call_completed';
  if (callStatus === 'no-answer') return 'voice_call_no_answer';
  if (callStatus === 'ringing' || callStatus === 'in-progress') return 'voice_call_initiated';
  if (callStatus === 'initiated') return 'voice_call_initiated';
  return 'voice_call_initiated';
}

function callStatusToOutcome(callStatus) {
  if (callStatus === 'completed') return 'answered';
  if (callStatus === 'no-answer') return 'no_answer';
  if (callStatus === 'busy') return 'busy';
  if (callStatus === 'failed') return 'failed';
  return 'not_attempted';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody = await req.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  // Validate Twilio signature — skip in dev/test if env var not set
  const skipSigValidation = !Deno.env.get('TWILIO_AUTH_TOKEN');
  if (!skipSigValidation && !validateTwilioSig(req, rawBody)) {
    console.warn('[receiveInboundVoiceCall] Invalid Twilio signature — rejected');
    return new Response('Forbidden', { status: 403 });
  }

  const callSid = params.CallSid || '';
  const from = params.From || '';
  const to = params.To || '';
  const callStatus = params.CallStatus || 'initiated';
  const direction = params.Direction || 'inbound';
  const accountSid = params.AccountSid || '';
  const callDuration = params.CallDuration || null;
  const normalizedPhone = normalizePhone(from);
  const now = new Date().toISOString();

  console.log(`[receiveInboundVoiceCall] callSid=${callSid} from=${from} status=${callStatus}`);

  const base44 = createClientFromRequest(req);

  // ── Step 1: Idempotency check — dedupe on CallSid ──
  let existingEvent = null;
  try {
    // Only dedupe on terminal status callbacks (not the initial hit)
    if (callStatus === 'completed' || callStatus === 'no-answer' || callStatus === 'busy' || callStatus === 'failed') {
      const existing = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { provider_message_id: callSid, event_type: callStatusToEventType(callStatus) },
        '-created_date', 1
      );
      if (existing?.length > 0) {
        console.log(`[receiveInboundVoiceCall] Duplicate call event for CallSid ${callSid} — skipping`);
        return new Response(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }
    }
  } catch (err) {
    console.warn('[receiveInboundVoiceCall] Idempotency check failed:', err.message);
  }

  const sanitizedMetadata = {
    call_sid: callSid,
    from,
    to,
    call_status: callStatus,
    direction,
    account_sid: accountSid ? accountSid.substring(0, 8) + '...' : null,
    call_duration: callDuration,
    received_at: now,
  };

  // ── Step 2: Create CommunicationEvent immediately ──
  let commEventId = null;
  try {
    const commEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: 'voice',
      direction: 'inbound',
      event_type: callStatusToEventType(callStatus),
      provider: 'twilio',
      status: 'received',
      subject: `Inbound voice call — ${callStatus} from ${from}`,
      provider_message_id: callSid,
      metadata_json: JSON.stringify(sanitizedMetadata),
    });
    commEventId = commEvent?.id;
    console.log(`[receiveInboundVoiceCall] CommunicationEvent created: ${commEventId}`);
  } catch (err) {
    console.error('[receiveInboundVoiceCall] Failed to create CommunicationEvent:', err.message);
    // Attempt a failed event record
    try {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        channel: 'voice',
        direction: 'inbound',
        event_type: 'voice_call_initiated',
        provider: 'twilio',
        status: 'failed',
        subject: `Voice webhook error — ${callStatus}`,
        provider_message_id: callSid || 'unknown',
        error_message: err.message?.substring(0, 500),
        metadata_json: JSON.stringify({ call_sid: callSid, from, call_status: callStatus, error: err.message }),
      });
    } catch (_) {}
  }

  // ── Step 3: Update WebhookRegistration ──
  try {
    const webhookRegs = await base44.asServiceRole.entities.WebhookRegistration.filter(
      { source_name: 'twilio_voice' }, '-created_date', 1
    );
    if (webhookRegs?.length > 0) {
      const reg = webhookRegs[0];
      if (commEventId) {
        // Success path
        await base44.asServiceRole.entities.WebhookRegistration.update(reg.id, {
          last_triggered_at: now,
          last_error: null,
        });
      } else {
        // Failure path — increment failure_count
        await base44.asServiceRole.entities.WebhookRegistration.update(reg.id, {
          last_triggered_at: now,
          failure_count: (reg.failure_count || 0) + 1,
          last_error: 'CommunicationEvent creation failed',
        });
      }
    }
  } catch (err) {
    console.warn('[receiveInboundVoiceCall] WebhookRegistration update failed:', err.message);
  }

  // ── Step 4: Create/update WebsiteLead for caller ──
  if (normalizedPhone) {
    try {
      // Try WebsiteLead first
      const existingLeads = await base44.asServiceRole.entities.WebsiteLead.filter(
        { phone_number: normalizedPhone }, '-created_date', 1
      );

      if (existingLeads?.length > 0) {
        await base44.asServiceRole.entities.WebsiteLead.update(existingLeads[0].id, {
          call_sid: callSid,
          last_engagement_type: 'call',
          last_engagement_at: now,
          call_summary: existingLeads[0].call_summary || `Inbound call received — status: ${callStatus}. Transcript pending.`,
        });
      } else {
        // Create new WebsiteLead for this caller
        await base44.asServiceRole.entities.WebsiteLead.create({
          phone_number: normalizedPhone,
          full_name: 'Inbound Caller',
          source: 'elevenlabs_sarah_ai_receptionist',
          call_sid: callSid,
          last_engagement_type: 'call',
          last_engagement_at: now,
          lead_status: 'new',
          call_summary: `Inbound call received from ${from} via Twilio — status: ${callStatus}. Transcript pending.`,
          conversation_id: callSid,
        });
      }
    } catch (err) {
      console.warn('[receiveInboundVoiceCall] WebsiteLead upsert failed:', err.message);
    }

    // Also update canonical Leads record if one exists (by phone)
    try {
      const existingCanonical = await base44.asServiceRole.entities.Leads.filter(
        { normalized_phone: normalizedPhone }, '-created_date', 1
      );
      if (existingCanonical?.length > 0) {
        const outcome = callStatusToOutcome(callStatus);
        await base44.asServiceRole.entities.Leads.update(existingCanonical[0].id, {
          voice_call_attempted: true,
          voice_call_outcome: outcome,
          last_contacted_at: now,
          last_activity_at: now,
          last_engagement_type: 'call',
          last_engagement_at: now,
        });
      }
    } catch (_) {}
  }

  // ── Step 5: For status-callback hits, return empty TwiML ──
  const isStatusCallback = callStatus === 'completed' || callStatus === 'no-answer' ||
    callStatus === 'busy' || callStatus === 'failed' || callStatus === 'canceled';

  if (isStatusCallback) {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }

  // ── Step 6: Initial call hit — load ElevenLabs agent and return TwiML ──
  let agentId = Deno.env.get('ELEVENLABS_AGENT_ID') || null;

  if (!agentId) {
    try {
      const [settings] = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
      agentId = settings?.elevenlabs_agent_ids?.receptionist
        || settings?.elevenlabs_agent_ids?.general
        || null;
    } catch (_) {}
  }

  if (!agentId) {
    console.warn('[receiveInboundVoiceCall] No ElevenLabs agent_id — using fallback TwiML');
    const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hi! You've reached our office. We're setting up our AI receptionist. Please send us a text and we'll respond shortly. Thank you!</Say>
  <Hangup/>
</Response>`;
    return new Response(fallbackTwiML, { headers: { 'Content-Type': 'text/xml' } });
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://api.elevenlabs.io/v1/convai/call?agent_id=${agentId}"/>
  </Connect>
</Response>`;

  console.log(`[receiveInboundVoiceCall] Connecting to ElevenLabs agent ${agentId}`);
  return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
});