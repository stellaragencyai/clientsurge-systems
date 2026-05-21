import { secureJson } from "../_shared/response.ts";
/**
 * retryFailedEvent
 * Re-processes a failed CommunicationEvent by replaying the underlying action.
 * Supports: sms (Twilio), email (Resend), stripe (re-invoke stripeWebhookOrders)
 *
 * Payload: { event_id: string }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resendFetch } from "../_shared/resendFetch.js";
import { appendSmsOptOut } from "../_shared/smsOptOut.js";
import { stripeFetch, twilioFetch } from "../_shared/providerFetch.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return secureJson({ error: 'Admin access required' }, { status: 403 });
    }

    const { event_id } = await req.json().catch(() => ({}));
    if (!event_id) return secureJson({ error: 'Missing event_id' }, { status: 400 });

    // Load the failed event
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter({ id: event_id });
    const evt = events?.[0];
    if (!evt) return secureJson({ error: 'Event not found' }, { status: 404 });
    if (evt.status !== 'failed') return secureJson({ error: 'Event is not in failed status' }, { status: 400 });

    console.log(`[retryFailedEvent] Retrying event ${event_id} — provider: ${evt.provider}, channel: ${evt.channel}`);

    let retryResult = null;

    // --- SMS retry via Twilio ---
    if (evt.channel === 'sms' && evt.provider === 'twilio') {
      const TWILIO_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
      const TWILIO_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
      const TWILIO_FROM = Deno.env.get('TWILIO_PHONE_NUMBER');

      if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
        return secureJson({ error: 'Twilio credentials not configured' }, { status: 500 });
      }

      // Get phone from lead if linked
      let toPhone = null;
      if (evt.lead_id) {
        const leads = await base44.asServiceRole.entities.Leads.filter({ id: evt.lead_id });
        toPhone = leads?.[0]?.phone;
      }
      if (!toPhone && evt.metadata_json) {
        try { toPhone = JSON.parse(evt.metadata_json)?.to; } catch {}
      }
      if (!toPhone) return secureJson({ error: 'Cannot determine destination phone number' }, { status: 400 });

      const body = evt.message_body;
      if (!body) return secureJson({ error: 'No message body to retry' }, { status: 400 });

      const formData = new URLSearchParams({ From: TWILIO_FROM, To: toPhone, Body: appendSmsOptOut(body) });
      const res = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Twilio error: ${data.message}`);
      retryResult = { provider_message_id: data.sid, status: 'sent' };
    }

    // --- Email retry via Resend ---
    else if (evt.channel === 'email' && evt.provider === 'resend') {
      const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
      const RESEND_FROM = Deno.env.get('RESEND_FROM_EMAIL');
      if (!RESEND_KEY || !RESEND_FROM) {
        return secureJson({ error: 'Resend credentials not configured' }, { status: 500 });
      }

      let toEmail = null;
      if (evt.lead_id) {
        const leads = await base44.asServiceRole.entities.Leads.filter({ id: evt.lead_id });
        toEmail = leads?.[0]?.email;
      }
      if (!toEmail && evt.metadata_json) {
        try { toEmail = JSON.parse(evt.metadata_json)?.to; } catch {}
      }
      if (!toEmail) return secureJson({ error: 'Cannot determine destination email' }, { status: 400 });

      const res = await resendFetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [toEmail],
          subject: evt.subject || '(No subject)',
          html: evt.message_body || '(No content)',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Resend error: ${data.message}`);
      retryResult = { provider_message_id: data.id, status: 'sent' };
    }

    // --- Stripe event re-invoke (via stripeWebhookOrders) ---
    else if (evt.provider === 'stripe') {
      // Re-fetch the Stripe event and re-process
      const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY');
      if (!STRIPE_KEY) return secureJson({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 });

      const stripeEventId = evt.provider_message_id;
      if (!stripeEventId) return secureJson({ error: 'No Stripe event ID stored — cannot retry' }, { status: 400 });

      const stripeRes = await stripeFetch(`https://api.stripe.com/v1/events/${stripeEventId}`, {
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
      return secureJson({ error: `No retry strategy for channel=${evt.channel} provider=${evt.provider}` }, { status: 400 });
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
    return secureJson({ success: true, result: retryResult });

  } catch (error) {
    console.error('[retryFailedEvent] Error:', error);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
