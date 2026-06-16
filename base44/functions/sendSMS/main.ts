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
    const { phone, message, leadId } = await req.json();

    if (!phone || !message) {
      return json({ error: 'Phone and message required' }, 400);
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return json({ error: 'Twilio credentials not configured' }, 500);
    }

    // Consent guard: if leadId provided, check lead consent before sending
    if (leadId) {
      try {
        const base44 = createClientFromRequest(req);
        const lead = await base44.asServiceRole.entities.Leads.get(leadId);
        if (lead) {
          if (lead.do_not_contact === true) {
            return json({
              error: 'Lead has do_not_contact flag',
              sms_sent: false,
              reason: 'do_not_contact',
              safe_to_continue: true,
            }, 200);
          }
          if (lead.consent_given === false) {
            return json({
              error: 'Lead has not given consent',
              sms_sent: false,
              reason: 'consent_not_given',
              safe_to_continue: true,
            }, 200);
          }
        }
      } catch (_) {
        // Lead lookup failed — proceed with send (non-blocking guard)
      }
    }

    const auth = btoa(`${accountSid}:${authToken}`);
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: phone,
        Body: appendSmsOptOut(message),
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      // Log failed CommunicationEvent
      if (leadId) {
        try {
          const base44 = createClientFromRequest(req);
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: leadId,
            channel: 'sms',
            direction: 'outbound',
            event_type: 'sms_failed',
            provider: 'twilio',
            status: 'failed',
            message_body: message,
            error_message: data.message || `Twilio error ${response.status}`,
          });
        } catch (_) {}
      }
      return json({ error: 'Failed to send SMS', details: data }, 500);
    }

    // Log success
    if (leadId) {
      try {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: leadId,
          channel: 'sms',
          direction: 'outbound',
          event_type: 'sms_sent',
          provider: 'twilio',
          status: 'sent',
          message_body: message,
          provider_message_id: data.sid || null,
        });

        await base44.entities.Messages.create({
          lead_id: leadId,
          direction: 'outbound',
          channel: 'sms',
          message_text: message,
          status: 'sent',
        });
      } catch (_) {}
    }

    return json({ success: true, messageSid: data.sid });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});