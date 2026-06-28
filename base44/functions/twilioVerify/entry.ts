import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const raw = await req.json();

    // Support both direct calls ({ phone, action, code }) and entity-automation
    // payloads ({ event: { type, entity_name, entity_id }, data: { ...lead } }).
    const isEntityAutomation = !!(raw?.event?.entity_id || raw?.data?.id);
    const phone = raw?.phone || raw?.data?.phone || raw?.data?.customer_phone || '';
    const action = raw?.action || (isEntityAutomation ? 'send' : 'send');
    const code = raw?.code || '';

    if (!phone) {
      console.warn('[twilioVerify] No phone number found in payload');
      return Response.json({ error: 'Phone number required' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !verifyServiceSid) {
      return Response.json({ error: 'Twilio Verify not configured' }, { status: 500 });
    }

    const auth = btoa(`${accountSid}:${authToken}`);

    // Send OTP
    if (action === 'send') {
      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            Channel: 'sms',
          }).toString(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return Response.json({ error: 'Failed to send verification code', details: data }, { status: 500 });
      }

      return Response.json({ success: true, sid: data.sid, message: 'Verification code sent' });
    }

    // Check OTP
    if (action === 'check') {
      if (!code) {
        return Response.json({ error: 'Verification code required' }, { status: 400 });
      }

      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            Code: code,
          }).toString(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return Response.json({ error: 'Invalid verification code', details: data }, { status: 400 });
      }

      if (data.status === 'approved') {
        // Log verification in database
        const base44 = createClientFromRequest(req);
        await base44.entities.CommunicationEvent.create({
          channel: 'sms',
          direction: 'system',
          event_type: 'verification_code_approved',
          provider: 'twilio',
          status: 'processed',
          message_body: `Phone ${phone} verified successfully`,
          metadata_json: JSON.stringify({ phone_verified: true, verified_at: new Date().toISOString() }),
        });
        return Response.json({ success: true, verified: true, message: 'Phone number verified' });
      }

      return Response.json({ success: false, verified: false, message: 'Verification failed' });
    }

    return Response.json({ error: 'Invalid action. Use "send" or "check"' }, { status: 400 });
  } catch (error) {
    console.error('Twilio Verify Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});