import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { twilioFetch } from "../_shared/providerFetch.js";

Deno.serve(async (req) => {
  try {
    createClientFromRequest(req);
    const { phone, full_name, scheduled_date, scheduled_time } = await req.json();

    if (!phone || !scheduled_date || !scheduled_time) {
      return secureJson({ error: 'Missing required fields' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return secureJson({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    // Format date nicely e.g. "Monday, May 5"
    let friendlyDate = scheduled_date;
    try {
      const d = new Date(`${scheduled_date}T${scheduled_time}:00`);
      friendlyDate = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    } catch (_) {}

    const firstName = (full_name || 'there').split(' ')[0];
    const message = `Hi ${firstName}! ✅ Your ClientSurge demo is confirmed for ${friendlyDate} at ${scheduled_time} (AZ time). Nolan will call you directly at this number — keep it handy! Questions before then? Just reply here. Reply STOP to opt out.`;

    const response = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
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

    return secureJson({ success: true, message_sid: data.sid });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});
