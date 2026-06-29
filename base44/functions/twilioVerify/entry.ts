import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function normalizePhoneToE164(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+') && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;

  return null;
}

function getRequestedPhone(body: Record<string, any>): string | null {
  const entityData = body?.data || {};
  return normalizePhoneToE164(
    body?.phone_e164 ||
    body?.phone ||
    body?.phone_number ||
    body?.customer_phone ||
    entityData?.phone_e164 ||
    entityData?.phone ||
    entityData?.phone_number ||
    entityData?.customer_phone ||
    entityData?.normalized_phone ||
    entityData?.canonical_phone ||
    ''
  );
}

async function callTwilio(accountSid: string, authToken: string, serviceSid: string, endpoint: 'Verifications' | 'VerificationCheck', params: Record<string, string>) {
  const auth = btoa(`${accountSid}:${authToken}`);
  const response = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function writeVerificationLog(req: Request, phoneE164: string, status: string, details: Record<string, any> = {}) {
  try {
    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: 'sms',
      direction: 'system',
      event_type: 'status_update',
      provider: 'twilio',
      status: status === 'approved' ? 'processed' : status === 'failed' ? 'failed' : 'pending',
      subject: 'Phone check status',
      message_body: `Twilio phone check status: ${status}`,
      context_type: 'phone_check',
      context_id: phoneE164,
      metadata_json: JSON.stringify({ phone_e164: phoneE164, twilio_status: status, ...details }),
    });
  } catch (error) {
    console.warn('[twilioVerify] Audit log failed:', error?.message || error);
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const phoneE164 = getRequestedPhone(body);
    const requestedAction = String(body?.action || 'start').toLowerCase();
    const action = requestedAction === 'send' ? 'start' : requestedAction;
    const code = String(body?.code || body?.verification_code || '').trim();

    // Entity automations fire on every Lead create — not all leads have a valid
    // US-format phone. Gracefully skip instead of failing the automation.
    if (!phoneE164) {
      console.log('[twilioVerify] Skipping — no valid phone number in payload');
      return Response.json({ success: true, skipped: true, reason: 'no_valid_phone', message: 'Lead has no valid phone number — verification skipped.' });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const serviceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !serviceSid) {
      console.warn('[twilioVerify] Skipping — TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_VERIFY_SERVICE_SID not set');
      return Response.json({ success: true, skipped: true, reason: 'not_configured', message: 'Twilio Verify not configured — set TWILIO_VERIFY_SERVICE_SID to enable.' });
    }

    if (action === 'start') {
      const { response, data } = await callTwilio(accountSid, authToken, serviceSid, 'Verifications', {
        To: phoneE164,
        Channel: 'sms',
      });

      if (!response.ok) {
        await writeVerificationLog(req, phoneE164, 'failed', { twilio_error: data });
        return Response.json({
          success: false,
          approved: false,
          phone_verified: false,
          phone_e164: phoneE164,
          status: 'failed',
          error: 'Could not send the phone check message',
          details: data,
        }, { status: 502 });
      }

      await writeVerificationLog(req, phoneE164, data?.status || 'pending', { twilio_sid: data?.sid || null });
      return Response.json({
        success: true,
        approved: false,
        phone_verified: false,
        phone_e164: phoneE164,
        status: data?.status || 'pending',
        sid: data?.sid || null,
        message: 'Phone check started',
      });
    }

    if (action === 'check') {
      if (!code) {
        return Response.json({ error: 'Code required' }, { status: 400 });
      }

      const { response, data } = await callTwilio(accountSid, authToken, serviceSid, 'VerificationCheck', {
        To: phoneE164,
        Code: code,
      });

      if (!response.ok) {
        await writeVerificationLog(req, phoneE164, data?.status || 'failed', { twilio_error: data });
        return Response.json({
          success: false,
          approved: false,
          verified: false,
          phone_verified: false,
          phone_e164: phoneE164,
          status: data?.status || 'failed',
          error: 'Code was not accepted',
          details: data,
        }, { status: 400 });
      }

      const approved = data?.status === 'approved';
      await writeVerificationLog(req, phoneE164, data?.status || 'unknown', { twilio_sid: data?.sid || null });

      return Response.json({
        success: approved,
        approved,
        verified: approved,
        phone_verified: approved,
        phone_e164: phoneE164,
        status: data?.status || 'unknown',
        checked_at: new Date().toISOString(),
        message: approved ? 'Phone number approved' : 'Phone number not approved',
      }, { status: approved ? 200 : 400 });
    }

    return Response.json({ error: 'Invalid action. Use "start" or "check".' }, { status: 400 });
  } catch (error) {
    console.error('[twilioVerify] Error:', error?.message || error);
    return Response.json({ error: error?.message || 'Twilio Verify failed' }, { status: 500 });
  }
});