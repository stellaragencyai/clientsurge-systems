import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Resend Webhook Receiver — fully self-contained (no local imports).
 *
 * Receives delivery status callbacks from Resend (email.sent, email.delivered,
 * email.bounced, email.opened, email.clicked, email.replied).
 *
 * Verifies Svix signature using Web Crypto API, then updates the matching
 * CommunicationLog record and logs a CommunicationEvent.
 */

// ── Svix signature verification (Resend uses Svix for webhook signing) ──
async function verifySvixSignature(rawPayload, headers, secret) {
  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return { ok: false, reason: 'Missing svix headers' };
  }

  // Reject stale timestamps (5-minute tolerance)
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

// ── Map Resend event type → CommunicationEvent fields ──
function mapEventType(resendType) {
  switch (resendType) {
    case 'email.sent':
      return { event_type: 'email_sent', status: 'sent' };
    case 'email.delivered':
      return { event_type: 'email_sent', status: 'delivered' };
    case 'email.bounced':
    case 'email.failed':
      return { event_type: 'email_failed', status: 'failed' };
    case 'email.opened':
      return { event_type: 'status_update', status: 'opened' };
    case 'email.clicked':
      return { event_type: 'status_update', status: 'processed' };
    case 'email.complained':
      return { event_type: 'email_failed', status: 'failed' };
    default:
      return { event_type: 'status_update', status: 'processed' };
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const rawPayload = await req.text();

    // ── Verify Svix signature (if secret is configured) ──
    const secret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    if (secret) {
      const verification = await verifySvixSignature(rawPayload, req.headers, secret);
      if (!verification.ok) {
        console.warn('[receiveResendWebhook] Rejected webhook:', verification.reason);
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('[receiveResendWebhook] No RESEND_WEBHOOK_SECRET set — skipping verification');
    }

    const payload = JSON.parse(rawPayload);
    const { type, data } = payload;
    const messageId = data?.email_id || data?.id || payload?.data?.email_id;

    console.info('[receiveResendWebhook] Received event:', { type, messageId });

    const { event_type, status } = mapEventType(type);

    // ── Update matching CommunicationLog record(s) ──
    if (messageId) {
      try {
        const logs = await base44.asServiceRole.entities.CommunicationLog.filter(
          { provider_message_id: messageId },
          '-created_date',
          5
        );

        for (const log of logs) {
          const updates = {
            provider_status: type.replace('email.', ''),
          };

          if (type === 'email.delivered') {
            updates.delivery_status = 'delivered';
            updates.delivered_at = new Date().toISOString();
          } else if (type === 'email.sent') {
            updates.delivery_status = 'sent';
          } else if (type === 'email.bounced' || type === 'email.failed') {
            updates.delivery_status = 'failed';
            updates.failed_at = new Date().toISOString();
            updates.error_message = data?.bounce?.message || data?.error || type;
          }

          if (updates.delivery_status && updates.delivery_status !== log.delivery_status) {
            await base44.asServiceRole.entities.CommunicationLog.update(log.id, updates);
            console.info('[receiveResendWebhook] Updated CommunicationLog:', {
              id: log.id,
              delivery_status: updates.delivery_status,
            });
          }
        }
      } catch (e) {
        console.warn('[receiveResendWebhook] Could not update CommunicationLog:', e.message);
      }
    }

    // ── Log CommunicationEvent ──
    try {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        channel: 'email',
        direction: 'system',
        event_type,
        provider: 'resend',
        status,
        provider_message_id: messageId || null,
        message_body: type,
        metadata_json: JSON.stringify({ type, data }),
      });
    } catch (e) {
      console.warn('[receiveResendWebhook] Could not log CommunicationEvent:', e.message);
    }

    return Response.json({ success: true, event: type });
  } catch (error) {
    console.error('[receiveResendWebhook] Error:', error.message);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Resend webhook processing failed' },
      { status: 500 }
    );
  }
});