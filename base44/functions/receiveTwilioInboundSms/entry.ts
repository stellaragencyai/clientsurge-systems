import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * TWILIO INBOUND SMS WEBHOOK HANDLER
 *
 * Architecture: Worker → CommunicationEvent → Leads
 * PRIMARY ENTITIES: Leads (CRM lookup), CommunicationEvent (message log)
 *
 * Flow:
 * 1. Verify Twilio signature (constant-time comparison)
 * 2. Normalize phone number (E.164 format)
 * 3. Find matching Leads record by phone
 * 4. Log to CommunicationEvent (inbound SMS event)
 * 5. Update Leads metadata (reply_status, last_engagement)
 *
 * System of Truth: Uses Leads (primary CRM), logs to CommunicationEvent (primary event log)
 * See: ARCHITECTURE_SYSTEM_OF_TRUTH.md, SYSTEM_ENTITY_REFERENCE.md
 */

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
      console.error('[SECURITY] Invalid Twilio signature attempt', {
        timestamp: new Date().toISOString(),
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      });
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
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

    // Find lead by normalized phone number (primary Leads entity)
    // Note: This currently queries WebsiteLead for backward compatibility.
    // Future: Query Leads directly once all inbound SMS matches Leads records.
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

    // Idempotency guard: check if this MessageSid was already processed
    const existingEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { provider_message_id: messageId, event_type: 'sms_received' },
      '-created_date',
      1
    );
    if (existingEvents && existingEvents.length > 0) {
      console.log(`[InboundSms] Duplicate MessageSid ${messageId} — already processed`);
      return Response.json({ received: true, matched: true, duplicate: true });
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

    // Update lead status — mark as responded, pause cadence
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
    // Log full error internally
    console.error('[INTERNAL_ERROR] receiveTwilioInboundSms:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    // Return generic error to client
    return Response.json(
      { error: 'An error occurred processing your request.' },
      { status: 500 }
    );
  }
});