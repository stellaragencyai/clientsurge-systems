import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FOLLOW_UP_MESSAGE = 'Just checking — still interested?';

async function sendTwilioSMS(phone, message) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  const auth = btoa(`${accountSid}:${authToken}`);
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: fromNumber, To: phone, Body: message }).toString(),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Twilio error: ${data.message || JSON.stringify(data)}`);
  return data.sid;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const twentyMinAgo = new Date(now.getTime() - 20 * 60 * 1000).toISOString();

    const leads = await base44.asServiceRole.entities.Leads.filter({ status: 'Contacted' });

    const eligibleLeads = leads.filter(lead => {
      if (!lead.phone || !lead.created_date) return false;
      const created = new Date(lead.created_date).toISOString();
      return created >= twentyMinAgo && created <= tenMinAgo;
    });

    let sent = 0;

    for (const lead of eligibleLeads) {
      const existing = await base44.asServiceRole.entities.Messages.filter({
        lead_id: lead.id,
        channel: 'sms',
        message_text: FOLLOW_UP_MESSAGE,
      });

      if (existing.length > 0) continue;

      await sendTwilioSMS(lead.phone, FOLLOW_UP_MESSAGE);

      await base44.asServiceRole.entities.Messages.create({
        lead_id: lead.id,
        direction: 'outbound',
        channel: 'sms',
        message_text: FOLLOW_UP_MESSAGE,
        status: 'sent',
      });

      sent++;
    }

    return Response.json({ success: true, sent, eligible: eligibleLeads.length });
  } catch (error) {
    console.error('scheduleFollowUpSMS error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});