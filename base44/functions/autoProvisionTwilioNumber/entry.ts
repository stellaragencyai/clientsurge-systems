import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_BASE = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}`;
const authHeader = 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

async function twilioRequest(path, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  if (body) {
    options.body = new URLSearchParams(body).toString();
  }
  const res = await fetch(`${TWILIO_BASE}${path}`, options);
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { entity_id, data: client } = payload;

    if (!client || !client.business_name) {
      return Response.json({ error: 'No client data' }, { status: 400 });
    }

    // Skip if client already has a Twilio number
    if (client.twilio_number) {
      return Response.json({ skipped: true, reason: 'Client already has a Twilio number' });
    }

    // Try area codes in order: 480 first, then 602
    const areaCodes = ['480', '602'];
    let purchasedNumber = null;

    for (const areaCode of areaCodes) {
      // Search for available local numbers
      const searchRes = await twilioRequest(
        `/AvailablePhoneNumbers/US/Local.json?AreaCode=${areaCode}&VoiceEnabled=true&SmsEnabled=true&Limit=1`
      );

      const available = searchRes?.available_phone_numbers;
      if (!available || available.length === 0) continue;

      const phoneNumber = available[0].phone_number;

      // Purchase the number
      const purchaseBody = {
        PhoneNumber: phoneNumber,
        FriendlyName: `ClientSurge — ${client.business_name}`,
        SmsUrl: `https://grinning-apex-flow-growth.base44.app/api/functions/receiveTwilioSMS`,
        SmsMethod: 'POST',
      };

      // If the client has a phone, forward calls to it
      if (client.phone) {
        purchaseBody.VoiceUrl = `https://grinning-apex-flow-growth.base44.app/api/functions/receiveTwilioSMS`;
        purchaseBody.StatusCallback = `https://grinning-apex-flow-growth.base44.app/api/functions/receiveTwilioStatusWebhook`;
      }

      const purchaseRes = await twilioRequest('/IncomingPhoneNumbers.json', 'POST', purchaseBody);

      if (purchaseRes.phone_number) {
        purchasedNumber = purchaseRes.phone_number;
        break;
      }
    }

    if (!purchasedNumber) {
      return Response.json({ error: 'No available numbers found in 480 or 602' }, { status: 500 });
    }

    // Save the number back to the client record
    await base44.asServiceRole.entities.OnboardingClient.update(entity_id, {
      twilio_number: purchasedNumber,
      step_twilio: false, // still needs config, just provisioned
    });

    // Send Nolan an email notification
    const emailBody = `
<p>Hi Nolan,</p>

<p>A new Twilio phone number has been automatically provisioned for a new client:</p>

<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
  <tr><td style="padding:6px 16px 6px 0;color:#888;font-weight:600;">Client</td><td style="padding:6px 0;">${client.business_name} (${client.owner_name})</td></tr>
  <tr><td style="padding:6px 16px 6px 0;color:#888;font-weight:600;">Assigned Number</td><td style="padding:6px 0;font-size:18px;font-weight:700;color:#9a5c2e;">${purchasedNumber}</td></tr>
  <tr><td style="padding:6px 16px 6px 0;color:#888;font-weight:600;">Client Phone</td><td style="padding:6px 0;">${client.phone || 'Not provided'}</td></tr>
  <tr><td style="padding:6px 16px 6px 0;color:#888;font-weight:600;">Industry</td><td style="padding:6px 0;">${client.industry || '—'}</td></tr>
</table>

<p>The number is saved to the client's record. Next step: configure Twilio messaging flows and mark Step 1 complete in the onboarding checklist.</p>

<p><a href="https://clientsurgesystems.com/admin/onboarding">View Client Onboarding →</a></p>

<p>— ClientSurge Systems Automation</p>
`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'nolan@clientsurgesystems.com',
      from_name: 'ClientSurge Systems',
      subject: `📱 Twilio Number Provisioned — ${client.business_name} (${purchasedNumber})`,
      body: emailBody,
    });

    return Response.json({ success: true, twilio_number: purchasedNumber });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});