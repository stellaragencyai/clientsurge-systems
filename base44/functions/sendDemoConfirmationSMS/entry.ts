import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone, full_name, scheduled_date, scheduled_time } = await req.json();

    if (!phone || !scheduled_date || !scheduled_time) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const message = `Hi ${full_name}! Your ApexFlow demo is confirmed for ${scheduled_date} at ${scheduled_time}. We'll send you the meeting link 24 hours before. Reply STOP to unsubscribe.`;

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: phone,
        Body: message,
      }).toString(),
    });

    const data = await response.json();
    if (response.status !== 201) {
      throw new Error(data.message || 'Failed to send SMS');
    }

    return Response.json({ success: true, message_sid: data.sid });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});