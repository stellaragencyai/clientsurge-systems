import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import crypto from 'node:crypto';

const DEFAULT_TOLL_FREE_NUMBER = '+18778123630';
const PROHIBITED_FORWARDING_NUMBERS = new Set([
  '+18778123630',
  '+16025843227',
]);
const GREETING = 'Thank you for calling ClientSurge Systems. Please hold while we connect your call.';
const UNAVAILABLE = 'Thank you for calling ClientSurge Systems. We are unable to connect your call right now. Please try again shortly.';

function validateTwilioSig(req, rawBody) {
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  if (!token) return false;
  const sig = req.headers.get('X-Twilio-Signature');
  if (!sig) return false;
  const url = new URL(req.url).toString();
  const params = new URLSearchParams(rawBody);
  const toSign = url + Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}${value}`)
    .join('');
  const computed = crypto.createHmac('sha1', token).update(toSign).digest('base64');
  return computed === sig;
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function twiml(inner) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'DENY',
    },
  });
}

async function loadForwardingNumber(req) {
  try {
    const base44 = createClientFromRequest(req);
    const [settings] = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
    return normalizePhone(settings?.voice_forwarding_phone);
  } catch (error) {
    console.warn('[receiveInboundVoiceCall] Could not load forwarding number:', error?.message);
    return null;
  }
}

async function logForwardedCall(req, params, callerId, forwardingNumber) {
  try {
    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: 'voice',
      direction: 'inbound',
      event_type: 'voice_call_forwarded',
      provider: 'twilio',
      status: 'received',
      provider_message_id: params.CallSid || undefined,
      subject: 'Inbound call forwarded',
      message_body: `Inbound call from ${params.From || 'unknown'} to ${callerId}; forwarded to configured destination.`,
      metadata_json: JSON.stringify({
        call_sid: params.CallSid || null,
        from: params.From || null,
        to: params.To || null,
        caller_id_used: callerId,
        forwarding_number: forwardingNumber,
        source_route: '/functions/receiveInboundVoiceCall',
      }),
    });
  } catch (error) {
    console.warn('[receiveInboundVoiceCall] Forwarding log failed:', error?.message);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return twiml('<Say voice="alice">Voice forwarding webhook is online.</Say>');
  }

  const rawBody = await req.text();
  if (!validateTwilioSig(req, rawBody)) {
    console.warn('[receiveInboundVoiceCall] Invalid Twilio signature — rejected');
    return new Response('Forbidden', { status: 403, headers: { 'X-Frame-Options': 'DENY' } });
  }

  const params = Object.fromEntries(new URLSearchParams(rawBody));
  const callStatus = params.CallStatus || 'initiated';

  if (['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(callStatus)) {
    return twiml('');
  }

  const calledNumber = normalizePhone(params.To);
  const callerId = calledNumber || DEFAULT_TOLL_FREE_NUMBER;
  const forwardingNumber = await loadForwardingNumber(req);

  if (!forwardingNumber || PROHIBITED_FORWARDING_NUMBERS.has(forwardingNumber)) {
    console.error('[receiveInboundVoiceCall] Missing or unsafe forwarding number');
    return twiml(`<Say voice="alice">${escapeXml(UNAVAILABLE)}</Say><Hangup/>`);
  }

  logForwardedCall(req, params, callerId, forwardingNumber).catch(() => {});

  return twiml(
    `<Say voice="alice">${escapeXml(GREETING)}</Say>` +
    `<Dial callerId="${escapeXml(callerId)}" answerOnBridge="true" timeout="25">${escapeXml(forwardingNumber)}</Dial>`
  );
});
