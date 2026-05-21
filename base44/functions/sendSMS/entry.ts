import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { twilioFetch } from "../_shared/providerFetch.js";

Deno.serve(async (req) => {
  try {
    const { phone, message, leadId } = await req.json();

    if (!phone || !message) {
      return Response.json({ error: 'Phone and message required' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const auth = btoa(`${accountSid}:${authToken}`);
    const response = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: phone,
        Body: message.includes("Reply STOP") ? message : `${message}\n\nReply STOP to unsubscribe.`,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: 'Failed to send SMS', details: data }, { status: 500 });
    }

    // Log message in database
    const base44 = createClientFromRequest(req);
    if (leadId) {
      await base44.entities.Messages.create({
        lead_id: leadId,
        direction: 'outbound',
        channel: 'sms',
        message_text: message,
        status: 'sent',
      });
    }

    return Response.json({ success: true, messageSid: data.sid });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});