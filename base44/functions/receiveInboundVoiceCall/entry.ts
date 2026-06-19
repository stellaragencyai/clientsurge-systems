/**
 * receiveInboundVoiceCall — Twilio Voice Webhook Handler
 *
 * HARD RESET: Returns TwiML immediately with zero DB calls in the response path.
 * Logging is best-effort fire-and-forget AFTER TwiML is returned.
 *
 * Twilio Console: Phone Numbers → Voice & Fax → A Call Comes In → Webhook → POST
 * URL: https://clientsurgesystems.com/api/receiveInboundVoiceCall
 */

const TWIML_RESPONSE = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Welcome to ClientSurge Systems. We received your call.</Say>
</Response>`;

const TWIML_STATUS_ACK = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

// Fire-and-forget logging — runs after TwiML is returned, never blocks it.
async function logCallAsync(rawBody, contentType) {
  try {
    const { createClientFromRequest } = await import('npm:@base44/sdk@0.8.31');

    let params = {};
    try {
      const qs = new URLSearchParams(rawBody);
      if (qs.has('CallSid') || qs.has('From') || qs.has('AccountSid')) {
        params = Object.fromEntries(qs);
      } else {
        params = JSON.parse(rawBody || '{}');
      }
    } catch (_) {}

    const callSid = params.CallSid || params.call_sid || `LIVE_NO_SID_${Date.now()}`;
    const from = params.From || params.from || '';
    const callStatus = params.CallStatus || params.call_status || 'initiated';
    const isSmoke = callSid.startsWith('CA_TEST') || callSid.startsWith('SMOKE') || params._smoke === 'true';
    const now = new Date().toISOString();

    // Build a minimal fake request object so SDK can init in service-role mode.
    // We use asServiceRole so no user auth token is needed.
    const fakeReq = new Request('https://localhost/', { method: 'GET' });
    const base44 = createClientFromRequest(fakeReq);

    // Write CommunicationEvent
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: 'voice',
      direction: 'inbound',
      event_type: 'voice_call_initiated',
      provider: 'twilio',
      status: 'received',
      subject: isSmoke ? 'Voice webhook received (smoke)' : 'Live inbound call received',
      provider_message_id: callSid,
      metadata_json: JSON.stringify({
        call_sid: callSid,
        from,
        call_status: callStatus,
        received_at: now,
        content_type: contentType || 'unknown',
        smoke: isSmoke,
        live_call: !isSmoke,
        source_route: '/api/receiveInboundVoiceCall',
        account_sid_present: !!(params.AccountSid || params.account_sid),
      }),
    });

    // Update WebhookRegistration
    const regs = await base44.asServiceRole.entities.WebhookRegistration.filter(
      { source_name: 'twilio_voice' }, '-created_date', 1
    );
    if (regs?.length > 0) {
      await base44.asServiceRole.entities.WebhookRegistration.update(regs[0].id, {
        last_triggered_at: now,
        last_error: null,
        status: 'active',
      });
    }

    // WebsiteLead capture
    const digits = String(from).replace(/\D/g, '');
    const normalizedPhone = digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits[0] === '1' ? `+${digits}` : null;
    if (normalizedPhone) {
      const existing = await base44.asServiceRole.entities.WebsiteLead.filter(
        { phone_number: normalizedPhone }, '-created_date', 1
      );
      if (existing?.length > 0) {
        await base44.asServiceRole.entities.WebsiteLead.update(existing[0].id, {
          call_sid: callSid,
          last_engagement_type: 'call',
          last_engagement_at: now,
          call_summary: `Live inbound call received — status: ${callStatus}. Transcript pending.`,
        });
      } else {
        await base44.asServiceRole.entities.WebsiteLead.create({
          phone_number: normalizedPhone,
          full_name: 'Inbound Caller',
          source: 'elevenlabs_sarah_ai_receptionist',
          call_sid: callSid,
          last_engagement_type: 'call',
          last_engagement_at: now,
          lead_status: 'new',
          call_summary: `Live inbound call from ${from} via Twilio. Transcript pending.`,
          conversation_id: callSid,
        });
      }
    }

    console.log(`[receiveInboundVoiceCall] async log done: sid=${callSid} smoke=${isSmoke}`);
  } catch (err) {
    console.error('[receiveInboundVoiceCall] async log failed (non-fatal):', err?.message);
  }
}

Deno.serve(async (req) => {
  // GET: health check
  if (req.method === 'GET') {
    return new Response(
      'receiveInboundVoiceCall OK — POST this URL in Twilio Console for inbound voice.',
      { status: 200, headers: { 'Content-Type': 'text/plain' } }
    );
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Read body — must do before Response is sent (body can only be read once).
  let rawBody = '';
  let contentType = '';
  try {
    rawBody = await req.text();
    contentType = req.headers.get('content-type') || '';
  } catch (_) {}

  // Detect status callbacks (terminal call events) — return empty TwiML, then log.
  let isStatusCallback = false;
  try {
    const qs = new URLSearchParams(rawBody);
    const status = qs.get('CallStatus') || '';
    if (['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(status)) {
      isStatusCallback = true;
    }
  } catch (_) {}

  // ── Return TwiML IMMEDIATELY — no awaits before this point ──
  const twiml = isStatusCallback ? TWIML_STATUS_ACK : TWIML_RESPONSE;
  const response = new Response(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });

  // Fire-and-forget logging after response (Deno supports this pattern).
  // Never awaited — Twilio already has its 200 TwiML.
  logCallAsync(rawBody, contentType).catch(() => {});

  return response;
});