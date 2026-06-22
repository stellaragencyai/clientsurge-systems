import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // **PHASE 1 FIX: Idempotency Check**
    // Check if we already processed this event
    const existingEvent = await base44.asServiceRole.entities.CommunicationEvent.filter({
      provider_message_id: event.id,
      event_type: 'order_paid',
      provider: 'stripe',
    }, '-created_date', 1);

    if (existingEvent && existingEvent.length > 0) {
      console.log(`Event ${event.id} already processed. Returning success.`);
      return Response.json({
        received: true,
        processed: false,
        reason: 'duplicate_webhook',
      });
    }

    // Handle only checkout.session.completed events
    if (event.type !== 'checkout.session.completed') {
      console.log(`Ignoring event type: ${event.type}`);
      return Response.json({ received: true });
    }

    const session = event.data.object;

    // Log the webhook processing attempt
    await base44.asServiceRole.entities.CommunicationEvent.create({
      provider_message_id: event.id,
      event_type: 'order_paid',
      provider: 'stripe',
      channel: 'webhook',
      direction: 'inbound',
      status: 'processing',
      metadata_json: JSON.stringify({
        session_id: session.id,
        customer_email: session.customer_email,
        amount: session.amount_total,
      }),
    }).catch(err => {
      console.error('Failed to log webhook event:', err.message);
      // Don't fail the whole function for logging failure
    });

    // Process order
    const orderData = {
      customer_email: session.customer_email || 'unknown',
      customer_name: session.customer_details?.name || 'Unknown',
      customer_phone: session.customer_details?.phone || '',
      business_name: session.metadata?.business_name || 'Not provided',
      stripe_session_id: session.id,
      stripe_customer_id: session.customer || null,
      stripe_event_id: event.id, // Idempotency key
      payment_status: 'paid',
      payment_source: 'stripe',
      order_status: 'paid_setup_in_progress',
      items: [],
      total_setup: (session.amount_total || 0) / 100, // Convert cents to dollars
      total_monthly: 0,
    };

    // Create order
    const order = await base44.asServiceRole.entities.Order.create(orderData);

    // PL-63: Send SMS confirmation to customer after checkout
    const customerPhone = session.customer_details?.phone;
    if (customerPhone) {
      try {
        const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER');
        if (twilioSid && twilioToken && twilioFrom) {
          const smsBody = `Thanks for your order with ClientSurge Systems! Your automation setup is now in progress. We'll reach out within 1 business day to get your systems configured. Reply STOP to opt out.`;
          const auth = btoa(`${twilioSid}:${twilioToken}`);
          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ From: twilioFrom, To: customerPhone, Body: smsBody }).toString(),
          }).catch(e => console.error('[stripeWebhookOrders] SMS confirmation failed:', e.message));
        }
      } catch (smsErr) {
        console.error('[stripeWebhookOrders] SMS post-checkout error:', smsErr.message);
      }
    }

    // Mark webhook as processed
    await base44.asServiceRole.entities.CommunicationEvent.create({
      provider_message_id: event.id,
      event_type: 'order_paid',
      provider: 'stripe',
      channel: 'webhook',
      direction: 'inbound',
      status: 'processed',
      metadata_json: JSON.stringify({
        session_id: session.id,
        order_id: order.id,
        amount: session.amount_total,
      }),
    }).catch(err => console.error('Failed to log processed event:', err.message));

    console.log(`Order created: ${order.id} from Stripe session ${session.id}`);

    return Response.json({
      received: true,
      processed: true,
      order_id: order.id,
    });
  } catch (error) {
    console.error('stripeWebhookOrders error:', error);
    return Response.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
});