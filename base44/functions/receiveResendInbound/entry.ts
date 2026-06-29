import { createClientFromRequest } from 'npm:@base44/sdk@0.8.34';

/**
 * Resend Inbound Handler — fully self-contained (no local imports).
 * Receives incoming email replies and engagement events from leads/customers.
 * Uses asServiceRole since webhooks have no user context.
 * Verifies Svix signature when RESEND_WEBHOOK_SECRET is configured.
 */

// ── Svix signature verification ──
async function verifySvixSignature(rawPayload, headers, secret) {
  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return { ok: false, reason: 'Missing svix headers' };
  }

  const now = Math.floor(Date.now() / 1000);
  const age = now - parseInt(svixTimestamp, 10);
  if (Math.abs(age) > 300) {
    return { ok: false, reason: 'Timestamp too old' };
  }

  const signedPayload = `${svixId}.${svixTimestamp}.${rawPayload}`;
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload));
  const expectedSig =
    'v1,' +
    Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

  const signatures = svixSignature.split(' ');
  const isValid = signatures.some((s) => s === expectedSig);

  return { ok: isValid, reason: isValid ? null : 'Signature mismatch' };
}

async function findLeadByEmail(base44, email) {
  try {
    const leads = await base44.asServiceRole.entities.Leads.filter(
      { normalized_email: email.toLowerCase().trim() },
      '-created_date',
      1
    );
    if (leads && leads.length > 0) return leads[0];

    // Fallback: try raw email
    const leads2 = await base44.asServiceRole.entities.Leads.filter(
      { email: email },
      '-created_date',
      1
    );
    return leads2 && leads2.length > 0 ? leads2[0] : null;
  } catch (e) {
    console.warn(`Could not find lead for email ${email}:`, e.message);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const rawPayload = await req.text();

    // ── Parse body first to distinguish webhook events from scheduled triggers ──
    // Resend delivers inbound replies via webhooks (not a polling API), so scheduled
    // calls have no event payload. We no-op those instead of failing.
    let body = {};
    if (rawPayload && rawPayload.trim() !== '') {
      try {
        body = JSON.parse(rawPayload);
      } catch {
        return Response.json({ success: true, event: 'scheduled_poll', message: 'Non-webhook trigger ignored.' });
      }
    }

    const { type, email, message_id, bounced, created_at } = body;

    // No Resend event type → scheduled/automation trigger, not a webhook → no-op
    if (!type) {
      return Response.json({ success: true, event: 'scheduled_poll', message: 'No webhook event — Resend inbound replies are delivered via webhook, not polling.' });
    }

    // ── Verify Svix signature for real webhook events ──
    // Any payload with a Resend event type must pass signature verification.
    const secret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    if (secret) {
      const verification = await verifySvixSignature(rawPayload, req.headers, secret);
      if (!verification.ok) {
        console.warn('[receiveResendInbound] Rejected webhook:', verification.reason);
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    if (!email && !body?.data?.to) {
      return Response.json({ success: true, event: type, message: 'No recipient email in webhook — ignored.' });
    }

    const recipientEmail = email || body?.data?.to;

    // Handle different Resend event types
    if (type === 'email.replied') {
      const lead = await findLeadByEmail(base44, recipientEmail);

      if (lead) {
        await base44.asServiceRole.entities.Leads.update(lead.id, {
          outreach_status: 'replied',
          last_contacted_at: new Date().toISOString(),
          activation_priority: 'Hot',
        });

        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: lead.id,
          channel: 'email',
          direction: 'inbound',
          event_type: 'sms_received',
          provider: 'resend',
          status: 'received',
          message_body: 'Lead replied to broadcast email',
          metadata_json: JSON.stringify({
            from_email: recipientEmail,
            message_id,
            received_at: created_at,
          }),
        });
      }

      return Response.json({ success: true, event: 'email_replied', lead_updated: !!lead });
    }

    if (type === 'email.bounced') {
      const lead = await findLeadByEmail(base44, recipientEmail);

      if (lead) {
        await base44.asServiceRole.entities.Leads.update(lead.id, {
          email_bounced: true,
          do_not_contact: true,
          outreach_status: 'bounced',
        });

        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: lead.id,
          channel: 'email',
          direction: 'system',
          event_type: 'email_failed',
          provider: 'resend',
          status: 'failed',
          metadata_json: JSON.stringify({ bounced_email: recipientEmail, bounced }),
        });
      }

      return Response.json({ success: true, event: 'email_bounced', lead_updated: !!lead });
    }

    if (type === 'email.opened') {
      const lead = await findLeadByEmail(base44, recipientEmail);

      if (lead) {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: lead.id,
          channel: 'email',
          direction: 'system',
          event_type: 'status_update',
          provider: 'resend',
          status: 'processed',
          metadata_json: JSON.stringify({ opened_at: created_at }),
        });
      }

      return Response.json({ success: true, event: 'email_opened' });
    }

    if (type === 'email.clicked') {
      const lead = await findLeadByEmail(base44, recipientEmail);

      if (lead) {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: lead.id,
          channel: 'email',
          direction: 'system',
          event_type: 'status_update',
          provider: 'resend',
          status: 'processed',
          metadata_json: JSON.stringify({ clicked_at: created_at }),
        });
      }

      return Response.json({ success: true, event: 'email_clicked' });
    }

    if (type === 'email.complained') {
      const lead = await findLeadByEmail(base44, recipientEmail);

      if (lead) {
        await base44.asServiceRole.entities.Leads.update(lead.id, {
          email_unsubscribed: true,
          do_not_contact: true,
          outreach_status: 'do_not_contact',
        });
      }

      return Response.json({ success: true, event: 'email_complained', lead_updated: !!lead });
    }

    return Response.json({ success: true, event: type, message: 'Webhook received' });
  } catch (error) {
    console.error('Resend Inbound Handler Error:', error.message);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Resend inbound processing failed' },
      { status: 500 }
    );
  }
});