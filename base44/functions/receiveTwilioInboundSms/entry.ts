import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Phone normalization helper
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  return phone;
}

// **PHASE 2 FIX: Constant-time signature comparison**
async function verifyTwilioSignature(body, signature, token) {
  const crypto = await import('crypto');
  
  // Recreate the signature
  const encoded = new TextEncoder().encode(body + token);
  const hashBuffer = await crypto.subtle.digest('SHA-1', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computed = Buffer.from(hashArray).toString('base64');
  
  // Use timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const signature = req.headers.get('x-twilio-signature');
    const token = Deno.env.get('TWILIO_WEBHOOK_KEY');

    // Verify signature
    const isValid = await verifyTwilioSignature(body, signature, token);
    if (!isValid) {
      console.error('Invalid Twilio signature');
      return Response.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Parse body
    const params = new URLSearchParams(body);
    const from = normalizePhone(params.get('From'));
    const to = params.get('To');
    const message = params.get('Body');
    const messageId = params.get('MessageSid');

    if (!from || !message || !messageId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find lead by normalized phone number
    // Query all leads and find by normalized phone
    const allLeads = await base44.asServiceRole.entities.WebsiteLead.list('-created_date', 1000);
    const lead = allLeads.find(l => {
      const normalizedLeadPhone = normalizePhone(l.phone_number);
      return normalizedLeadPhone === from;
    });

    if (!lead) {
      console.log(`No lead found for phone ${from}`);
      return Response.json({
        received: true,
        matched: false,
      });
    }

    // Log the SMS
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead.id,
      channel: 'sms',
      direction: 'inbound',
      event_type: 'sms_received',
      provider: 'twilio',
      status: 'processed',
      message_body: message,
      provider_message_id: messageId,
    });

    // Update lead status
    await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
      reply_status: 'responded',
      last_engagement_type: 'sms',
      last_engagement_at: new Date().toISOString(),
      cadence_paused: true, // Pause cadence on reply
    });

    console.log(`SMS received from ${from} (lead: ${lead.id}): ${message}`);

    return Response.json({
      received: true,
      matched: true,
      lead_id: lead.id,
    });
  } catch (error) {
    console.error('receiveTwilioInboundSms error:', error);
    return Response.json(
      { error: error.message || 'Processing failed' },
      { status: 500 }
    );
  }
});