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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone, full_name, scheduled_date, scheduled_time } = await req.json();

    if (!phone || !scheduled_date || !scheduled_time) {
      return json({ error: 'Missing required fields' }, 400);
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return json({ error: 'Twilio credentials not configured' }, 500);
    }

    let friendlyDate = scheduled_date;
    try {
      const d = new Date(`${scheduled_date}T${scheduled_time}:00`);
      friendlyDate = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    } catch (_) {}

    const firstName = (full_name || 'there').split(' ')[0];
    const message = `Hi ${firstName}! Your ClientSurge Free Automation Audit is confirmed for ${friendlyDate} at ${scheduled_time} (AZ time). Nolan will call you directly at this number. Questions before then? Just reply here. Reply STOP to opt out.`;

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: phone,
        Body: appendSmsOptOut(message),
      }).toString(),
    });

    const data = await response.json();

    if (response.status !== 201) {
      throw new Error(data.message || 'Failed to send SMS');
    }

    return json({ success: true, message_sid: data.sid });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});