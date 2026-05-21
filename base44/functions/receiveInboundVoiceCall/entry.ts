/**
 * receiveInboundVoiceCall — USE CASE #3
 * PUBLIC WEBHOOK: Twilio Voice URL handler
 *
 * When someone calls your Twilio number:
 * 1. Returns TwiML that connects the caller to ElevenLabs AI receptionist
 * 2. Also handles the post-call status callback to create/update the Lead record
 *
 * Twilio Console setup (manual — one-time):
 *   Phone Numbers → Your Number → Voice → "A call comes in" → Webhook
 *   URL: [your-app]/api/receiveInboundVoiceCall
 *   HTTP: POST
 *
 * ElevenLabs setup (manual):
 *   Create an agent named "Receptionist" in ElevenLabs dashboard
 *   Get its agent_id → save to AdminSettings.elevenlabs_agent_ids.receptionist
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import crypto from 'node:crypto';

function validateTwilioSig(req, rawBody) {
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  if (!token) return false;
  const sig = req.headers.get('X-Twilio-Signature');
  if (!sig) return false;
  const url = new URL(req.url).toString();
  const params = new URLSearchParams(rawBody);
  const toSign = url + Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}${v}`).join('');
  const computed = crypto.createHmac('sha1', token).update(toSign).digest('base64');
  return computed === sig;
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `+${digits.length === 10 ? '1' : ''}${digits}`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { 'X-Frame-Options': 'DENY' },
    });
  }

  const rawBody = await req.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  // Validate Twilio signature
  if (!validateTwilioSig(req, rawBody)) {
    console.warn('[receiveInboundVoiceCall] Invalid Twilio signature — rejected');
    return new Response('Forbidden', {
      status: 403,
      headers: { 'X-Frame-Options': 'DENY' },
    });
  }

  const callSid = params.CallSid;
  const from = params.From;
  const callStatus = params.CallStatus;

  console.log(`[receiveInboundVoiceCall] Inbound call from ${from}, status=${callStatus}, sid=${callSid}`);

  // ── If this is a status callback (call ended), update the Lead record ──
  if (callStatus && callStatus !== 'ringing' && callStatus !== 'in-progress') {
    try {
      const base44 = createClientFromRequest(req);
      const normalizedPhone = normalizePhone(from);

      if (normalizedPhone) {
        // Find or create lead
        let lead = null;
        const existing = await base44.asServiceRole.entities.Leads.filter(
          { phone: normalizedPhone }, '-created_date', 1
        ).catch(() => []);

        if (existing?.length > 0) {
          lead = existing[0];
        } else if (callStatus === 'completed') {
          // Only create a lead if the call was actually answered
          lead = await base44.asServiceRole.entities.Leads.create({
            full_name: 'Inbound Caller',
            business_name: 'Unknown Business',
            email: `inbound_${Date.now()}@placeholder.com`,
            phone: normalizedPhone,
            business_type: 'Unknown',
            problem: 'Inbound call via AI receptionist',
            source: 'inbound_voice',
            status: 'New',
            activation_priority: 'Hot',
          });
          console.log(`[receiveInboundVoiceCall] Created new lead ${lead?.id} from inbound call`);
        }

        if (lead) {
          const outcome = callStatus === 'completed' ? 'answered'
            : callStatus === 'no-answer' ? 'no_answer'
            : callStatus === 'busy' ? 'busy'
            : 'failed';

          await base44.asServiceRole.entities.Leads.update(lead.id, {
            voice_call_attempted: true,
            voice_call_outcome: outcome,
            last_contacted_at: new Date().toISOString(),
          });

          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: lead.id,
            channel: 'voice',
            direction: 'inbound',
            event_type: outcome === 'answered' ? 'voice_call_answered' : 'voice_call_no_answer',
            provider: 'elevenlabs',
            status: outcome === 'answered' ? 'received' : 'failed',
            subject: `Inbound voice call — ${outcome}`,
            metadata_json: JSON.stringify({ call_sid: callSid, call_status: callStatus, from }),
          });

          console.log(`[receiveInboundVoiceCall] Updated lead ${lead.id} — outcome=${outcome}`);
        }
      }
    } catch (err) {
      console.error('[receiveInboundVoiceCall] Post-call update error:', err.message);
    }

    // Return empty TwiML for status callbacks
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml', 'X-Frame-Options': 'DENY' } }
    );
  }

  // ── Incoming call: load ElevenLabs agent ID and return TwiML ──
  let agentId = null;
  try {
    const base44 = createClientFromRequest(req);
    const [settings] = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
    agentId = settings?.elevenlabs_agent_ids?.receptionist
      || settings?.elevenlabs_agent_ids?.general
      || settings?.elevenlabs_agent_ids?.med_spa; // final fallback
  } catch (_) {}

  if (!agentId) {
    // Fallback: just say a message and hang up gracefully
    console.warn('[receiveInboundVoiceCall] No ElevenLabs receptionist agent_id configured — using fallback TwiML');
    const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hi! You've reached ClientSurge Systems. We're setting up our AI receptionist right now.
    Please leave a message by texting us, and we'll get back to you shortly. Thank you!
  </Say>
  <Pause length="1"/>
  <Hangup/>
</Response>`;
    return new Response(fallbackTwiML, {
      headers: { 'Content-Type': 'text/xml', 'X-Frame-Options': 'DENY' },
    });
  }

  // Connect call to ElevenLabs Conversational AI via <Connect>
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://api.elevenlabs.io/v1/convai/call?agent_id=${agentId}"/>
  </Connect>
</Response>`;

  console.log(`[receiveInboundVoiceCall] Connecting inbound call to ElevenLabs agent ${agentId}`);
  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml', 'X-Frame-Options': 'DENY' },
  });
});
