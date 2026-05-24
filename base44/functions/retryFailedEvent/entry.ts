/**
 * retryFailedEvent
 * Re-processes a failed CommunicationEvent by replaying the underlying action.
 * Supports: sms (Twilio), email (Resend), stripe (re-invoke stripeWebhookOrders)
 *
 * Payload: { event_id: string }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import {
  sendCommunicationViaOutbox,
  sendResendEmailProvider,
  sendTwilioSmsProvider,
} from "../_shared/communicationOutbox.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { event_id } = await req.json().catch(() => ({}));
    if (!event_id) return Response.json({ error: 'Missing event_id' }, { status: 400 });

    // Load the failed event
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter({ id: event_id });
    const evt = events?.[0];
    if (!evt) return Response.json({ error: 'Event not found' }, { status: 404 });
    if (evt.status !== 'failed') return Response.json({ error: 'Event is not in failed status' }, { status: 400 });

    console.log(`[retryFailedEvent] Retrying event ${event_id} — provider: ${evt.provider}, channel: ${evt.channel}`);

    let retryResult = null;

    // --- SMS retry via Twilio ---
    if (evt.channel === 'sms' && evt.provider === 'twilio') {
      const TWILIO_FROM = Deno.env.get('TWILIO_PHONE_NUMBER');

      // Get phone from lead if linked
      let toPhone = null;
      let lead = null;
      if (evt.lead_id) {
        const leads = await base44.asServiceRole.entities.Leads.filter({ id: evt.lead_id });
        lead = leads?.[0] || null;
        toPhone = lead?.phone;
      }
      if (!toPhone && evt.metadata_json) {
        try { toPhone = JSON.parse(evt.metadata_json)?.to; } catch {}
      }
      if (!toPhone) return Response.json({ error: 'Cannot determine destination phone number' }, { status: 400 });

      const body = evt.message_body;
      if (!body) return Response.json({ error: 'No message body to retry' }, { status: 400 });

      const result = await sendCommunicationViaOutbox({
        base44,
        channel: "sms",
        provider: "twilio",
        recipient: toPhone,
        body,
        from: TWILIO_FROM,
        lead,
        leadId: evt.lead_id,
        source: "retryFailedEvent",
        sourceRecordId: event_id,
        templateKey: "retry_failed_event_sms",
        messageType: "transactional",
        consentBasis: "transactional_relationship",
        metadata: { retried_event_id: event_id },
        providerSend: (providerPayload) => sendTwilioSmsProvider({
          ...providerPayload,
          env: (name) => Deno.env.get(name),
          fetchImpl: fetch,
        }),
      });
      if (!result.success) throw new Error(`Twilio outbox retry failed: ${result.reason || result.error || result.status}`);
      retryResult = { provider_message_id: result.provider_message_id, status: 'sent', outbox_id: result.outbox?.id };
    }

    // --- Email retry via Resend ---
    else if (evt.channel === 'email' && evt.provider === 'resend') {
      const RESEND_FROM = Deno.env.get('RESEND_FROM_EMAIL');

      let toEmail = null;
      let lead = null;
      if (evt.lead_id) {
        const leads = await base44.asServiceRole.entities.Leads.filter({ id: evt.lead_id });
        lead = leads?.[0] || null;
        toEmail = lead?.email;
      }
      if (!toEmail && evt.metadata_json) {
        try { toEmail = JSON.parse(evt.metadata_json)?.to; } catch {}
      }
      if (!toEmail) return Response.json({ error: 'Cannot determine destination email' }, { status: 400 });

      const result = await sendCommunicationViaOutbox({
        base44,
        channel: "email",
        provider: "resend",
        recipient: toEmail,
        subject: evt.subject || '(No subject)',
        body: evt.message_body || '(No content)',
        html: evt.message_body || '(No content)',
        from: RESEND_FROM,
        lead,
        leadId: evt.lead_id,
        source: "retryFailedEvent",
        sourceRecordId: event_id,
        templateKey: "retry_failed_event_email",
        messageType: "transactional",
        consentBasis: "transactional_relationship",
        metadata: { retried_event_id: event_id },
        providerSend: (providerPayload) => sendResendEmailProvider({
          ...providerPayload,
          env: (name) => Deno.env.get(name),
          fetchImpl: fetch,
        }),
      });
      if (!result.success) throw new Error(`Resend outbox retry failed: ${result.reason || result.error || result.status}`);
      retryResult = { provider_message_id: result.provider_message_id, status: 'sent', outbox_id: result.outbox?.id };
    }

    // --- Stripe event re-invoke (via stripeWebhookOrders) ---
    else if (evt.provider === 'stripe') {
      // Re-fetch the Stripe event and re-process
      const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY');
      if (!STRIPE_KEY) return Response.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 });

      const stripeEventId = evt.provider_message_id;
      if (!stripeEventId) return Response.json({ error: 'No Stripe event ID stored — cannot retry' }, { status: 400 });

      const stripeRes = await fetch(`https://api.stripe.com/v1/events/${stripeEventId}`, {
        headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
      });
      if (!stripeRes.ok) {
        const err = await stripeRes.json();
        throw new Error(`Stripe fetch error: ${err.error?.message}`);
      }

      // Call stripeWebhookOrders via SDK — can't re-sign, so log it
      console.log(`[retryFailedEvent] Stripe event ${stripeEventId} fetched — manual reprocess required via Stripe Dashboard > Webhooks > Resend`);
      retryResult = {
        status: 'manual_required',
        message: `Stripe webhook re-signing not possible from backend. Use Stripe Dashboard → Developers → Webhooks → "Resend" to replay event ${stripeEventId}.`,
        stripe_event_id: stripeEventId,
      };
    }

    else {
      return Response.json({ error: `No retry strategy for channel=${evt.channel} provider=${evt.provider}` }, { status: 400 });
    }

    // Update the event status
    if (retryResult?.status === 'sent') {
      await base44.asServiceRole.entities.CommunicationEvent.update(event_id, {
        status: 'sent',
        provider_message_id: retryResult.provider_message_id || evt.provider_message_id,
        error_message: null,
      });
    }

    console.log(`[retryFailedEvent] Done. Result:`, retryResult);
    return Response.json({ success: true, result: retryResult });

  } catch (error) {
    console.error('[retryFailedEvent] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
