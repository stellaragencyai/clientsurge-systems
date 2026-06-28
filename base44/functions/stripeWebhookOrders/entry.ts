// #146 #201-#203 #308 #309 #310 — Full production-hardened Stripe webhook handler
// Handles: checkout.session.completed, invoice.payment_failed, customer.subscription.deleted, checkout.session.expired

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error('[stripeWebhookOrders] Missing Stripe config — STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set');
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(stripeSecretKey);
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error('[stripeWebhookOrders] Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 403 });
    }

    console.log(`[stripeWebhookOrders] Received event: ${event.type} (${event.id})`);

    // Idempotency check — skip already-processed events
    const existing = await base44.asServiceRole.entities.CommunicationEvent.filter({
      provider_message_id: event.id,
      provider: 'stripe',
    }, '-created_date', 1).catch(() => []);

    if (existing?.length > 0) {
      console.log(`[stripeWebhookOrders] Event ${event.id} already processed — skipping`);
      return Response.json({ received: true, processed: false, reason: 'duplicate' });
    }

    // Log receipt
    await base44.asServiceRole.entities.CommunicationEvent.create({
      provider_message_id: event.id,
      event_type: `stripe_${event.type}`,
      provider: 'stripe',
      channel: 'webhook',
      direction: 'inbound',
      status: 'processing',
    }).catch(() => {});

    // ─── Handle checkout.session.completed ───────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const orderData = {
        customer_email: session.customer_email || session.customer_details?.email || 'unknown',
        customer_name: session.customer_details?.name || session.metadata?.customer_name || 'Unknown',
        customer_phone: session.customer_details?.phone || session.metadata?.customer_phone || '',
        business_name: session.metadata?.business_name || 'Not provided',
        stripe_session_id: session.id,
        stripe_customer_id: session.customer || null,
        stripe_event_id: event.id,
        stripe_subscription_id: session.subscription || null,
        subscription_id: session.subscription || null,
        subscription_status: 'active',
        billing_status: 'active',
        payment_status: 'paid',
        payment_source: 'stripe',
        order_status: 'paid_setup_in_progress',
        selected_package_type: session.metadata?.package_key || session.metadata?.package_type || null,
        package_type: session.metadata?.package_key || session.metadata?.selected_package_type || null,
        plan_type: session.metadata?.plan_type || null,
        lead_id: session.metadata?.lead_id || '',
        items: [],
        total_setup: (session.amount_total || 0) / 100,
        total_monthly: 0,
        notes: `Recovery order from Stripe checkout session ${session.id} (no pre-created Order found)`,
      };

      // Try to find existing Order first (created by createCheckoutSession)
      let order;
      if (session.metadata?.order_id) {
        order = await base44.asServiceRole.entities.Order.get(session.metadata.order_id).catch(() => null);
        if (order) {
          await base44.asServiceRole.entities.Order.update(order.id, {
            payment_status: 'paid',
            payment_source: 'stripe',
            order_status: 'paid_setup_in_progress',
            stripe_session_id: session.id,
            stripe_customer_id: session.customer || null,
            stripe_subscription_id: session.subscription || null,
            subscription_id: session.subscription || null,
            subscription_status: 'active',
            billing_status: 'active',
            stripe_event_id: event.id,
            selected_package_type: session.metadata?.package_key || session.metadata?.package_type || order.selected_package_type || null,
            package_type: session.metadata?.package_key || session.metadata?.package_type || order.package_type || null,
            plan_type: session.metadata?.plan_type || order.plan_type || null,
          });
        }
      }

      if (!order) {
        // FIX #1-3: Order not found for this session — implement retry-loop before escalation
        let retryCount = 0;
        const maxRetries = 3;
        const retryDelayMs = 5000; // 5 second delay between retries

        while (retryCount < maxRetries && !order) {
          try {
            if (session.metadata?.order_id) {
              // Retry lookup for order
              order = await base44.asServiceRole.entities.Order.get(session.metadata.order_id).catch(() => null);
              if (order) {
                console.log(`[stripeWebhookOrders] Found Order on retry ${retryCount + 1}`);
                break;
              }
            }
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(r => setTimeout(r, retryDelayMs));
            }
          } catch (e) {
            console.warn(`[stripeWebhookOrders] Retry ${retryCount} failed: ${e.message}`);
            retryCount++;
          }
        }

        // If still not found, create recovery record
        if (!order) {
          order = await base44.asServiceRole.entities.Order.create(orderData);
          console.log(`[stripeWebhookOrders] Created recovery Order (orphan): ${order.id}`);

          // Notify admin of orphaned payment
          const adminEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || Deno.env.get('ADMIN_EMAIL');
          const resendKey = Deno.env.get('RESEND_API_KEY');
          const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'support@clientsurgesystems.com';
          if (resendKey && adminEmail && !session.metadata?.order_id) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: `ClientSurge Systems <${fromEmail}>`,
                to: [adminEmail],
                subject: `⚠️ Stripe Payment Received — No Matching Order Found (Recovery Created)`,
                html: `<p>A Stripe checkout completed but no matching Order record was found after 3 retry attempts.</p><p><strong>Session:</strong> ${session.id}<br><strong>Email:</strong> ${orderData.customer_email}<br><strong>Amount:</strong> $${orderData.total_setup}<br><strong>Recovery Order ID:</strong> ${order.id}</p><p>Please review and reconcile manually if needed.</p>`,
              }),
            }).catch(e => console.error('[stripeWebhookOrders] Admin orphan notification failed:', e.message));
          }
        }
      }

      console.log(`[stripeWebhookOrders] Order ${order.id} created/updated from checkout session ${session.id}`);

      // Initialize the full fulfillment chain (Client, ClientProject, OnboardingClient, AutomationChecklists, etc.)
      try {
        const installResult = await base44.functions.invoke("installPipeline", {
          action: "initialize",
          order_id: order.id,
        });
        const installData = installResult?.data || installResult || {};
        if (installData.success) {
          console.log(`[stripeWebhookOrders] Install pipeline initialized for order ${order.id}`, {
            client_id: installData.client?.id || null,
            client_project_id: installData.project?.id || null,
            onboarding_client_id: installData.onboarding_client?.id || null,
          });
        } else {
          console.error(`[stripeWebhookOrders] Install pipeline returned failure for order ${order.id}:`, installData.error || "Unknown error");
        }
      } catch (installError) {
        console.error(`[stripeWebhookOrders] Install pipeline failed for order ${order.id}:`, installError.message);
      }

      // PL-63: Send SMS confirmation to customer
      const customerPhone = session.customer_details?.phone || session.metadata?.customer_phone;
      if (customerPhone) {
        const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER');
        if (twilioSid && twilioToken && twilioFrom) {
          const smsBody = `Thanks for your order with ClientSurge Systems! Your automation setup is now in progress. We'll be in touch within 1 business day. Reply STOP to opt out.`;
          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ From: twilioFrom, To: customerPhone, Body: smsBody }).toString(),
          }).catch(e => console.error('[stripeWebhookOrders] SMS confirmation failed:', e.message));
        }
      }

      // PL-26: Send email confirmation
      const resendKey = Deno.env.get('RESEND_API_KEY');
      const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'support@clientsurgesystems.com';
      if (resendKey && (session.customer_email || session.customer_details?.email)) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `ClientSurge Systems <${fromEmail}>`,
            to: [session.customer_email || session.customer_details?.email],
            subject: 'Your Order Confirmed — AI Systems Activating',
            html: `<p>Hi ${orderData.customer_name},</p><p>Thank you for your order! Your AI automation systems are now being configured. You'll receive updates as each system goes live.</p><p>Login to your portal: <a href="https://clientsurgesystems.com/client-portal">client-portal</a></p><p>Questions? Reply to this email or call (602) 584-3227</p>`,
          }),
        }).catch(e => console.error('[stripeWebhookOrders] Email confirmation failed:', e.message));
      }

      // Mark as processed
      await base44.asServiceRole.entities.CommunicationEvent.create({
        provider_message_id: event.id,
        event_type: 'order_paid',
        provider: 'stripe',
        channel: 'webhook',
        direction: 'inbound',
        status: 'processed',
        context_id: order.id,
        order_id: order.id,
      }).catch(() => {});

      return Response.json({ received: true, processed: true, order_id: order.id });
    }

    // ─── Handle invoice.payment_failed ───────────────────────────────────────
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        const orders = await base44.asServiceRole.entities.Order.filter({
          stripe_subscription_id: subscriptionId,
        }, '-created_date', 1).catch(() => []);

        if (orders?.length > 0) {
          await base44.asServiceRole.entities.Order.update(orders[0].id, {
            billing_status: 'past_due',
            stripe_event_id: event.id,
          });

          // Send recovery email with Stripe payment update link
          const resendKey = Deno.env.get('RESEND_API_KEY');
          const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'support@clientsurgesystems.com';
          if (resendKey && invoice.customer_email) {
            const stripePortalUrl = `https://billing.stripe.com/p/login/`;
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: `ClientSurge Systems <${fromEmail}>`,
                to: [invoice.customer_email],
                subject: 'Action Required: Payment Failed',
                html: `<p>Hi,</p><p>We were unable to process your monthly subscription payment. To keep your AI systems active, please update your payment method:</p><p><a href="${invoice.hosted_invoice_url || stripePortalUrl}">Update Payment Method</a></p><p>If you need help, reply to this email or call (602) 584-3227</p>`,
              }),
            }).catch(e => console.error('[stripeWebhookOrders] Recovery email failed:', e.message));
          }

          console.log(`[stripeWebhookOrders] Order ${orders[0].id} marked past_due — recovery email sent`);
        }
      }

      await base44.asServiceRole.entities.CommunicationEvent.create({
        provider_message_id: event.id,
        event_type: 'payment_failed',
        provider: 'stripe',
        channel: 'webhook',
        direction: 'inbound',
        status: 'processed',
      }).catch(() => {});

      return Response.json({ received: true, processed: true });
    }

    // ─── Handle customer.subscription.deleted ────────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;

      const orders = await base44.asServiceRole.entities.Order.filter({
        stripe_subscription_id: subscription.id,
      }, '-created_date', 1).catch(() => []);

      if (orders?.length > 0) {
        await base44.asServiceRole.entities.Order.update(orders[0].id, {
          billing_status: 'cancelled',
          subscription_status: 'cancelled',
          stripe_event_id: event.id,
        });

        // Notify admin
        const adminEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || Deno.env.get('ADMIN_EMAIL');
        const resendKey = Deno.env.get('RESEND_API_KEY');
        const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'support@clientsurgesystems.com';
        if (resendKey && adminEmail) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: `ClientSurge Systems <${fromEmail}>`,
              to: [adminEmail],
              subject: `❌ Subscription Cancelled — ${orders[0].customer_email}`,
              html: `<p>Subscription cancelled for <strong>${orders[0].business_name || orders[0].customer_email}</strong>.</p><p>Order ID: ${orders[0].id}</p><p>MRR Impact: -$${orders[0].total_monthly || 0}/mo</p>`,
            }),
          }).catch(() => {});
        }

        console.log(`[stripeWebhookOrders] Order ${orders[0].id} marked cancelled`);
      }

      await base44.asServiceRole.entities.CommunicationEvent.create({
        provider_message_id: event.id,
        event_type: 'subscription_cancelled',
        provider: 'stripe',
        channel: 'webhook',
        direction: 'inbound',
        status: 'processed',
      }).catch(() => {});

      return Response.json({ received: true, processed: true });
    }

    // ─── Handle customer.subscription.created / updated ──────────────────────
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const subscriptionId = subscription.id;

      if (subscriptionId) {
        const orders = await base44.asServiceRole.entities.Order.filter({
          stripe_subscription_id: subscriptionId,
        }, '-created_date', 1).catch(() => []);

        if (orders?.length > 0) {
          const order = orders[0];
          const billingPatch = {};
          if (subscription.status) billingPatch.subscription_status = subscription.status;
          if (subscription.status) billingPatch.billing_status = subscription.status;
          if (subscription.current_period_start) {
            billingPatch.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
          }
          if (subscription.current_period_end) {
            billingPatch.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
          }
          billingPatch.stripe_event_id = event.id;

          await base44.asServiceRole.entities.Order.update(order.id, billingPatch);
          console.log(`[stripeWebhookOrders] Order ${order.id} subscription ${event.type}: ${subscription.status}`);
        }
      }

      await base44.asServiceRole.entities.CommunicationEvent.create({
        provider_message_id: event.id,
        event_type: `subscription_${event.type}`,
        provider: 'stripe',
        channel: 'webhook',
        direction: 'inbound',
        status: 'processed',
      }).catch(() => {});

      return Response.json({ received: true, processed: true });
    }

    // ─── Handle invoice.paid / invoice.payment_succeeded ─────────────────────
    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        const orders = await base44.asServiceRole.entities.Order.filter({
          stripe_subscription_id: subscriptionId,
        }, '-created_date', 1).catch(() => []);

        if (orders?.length > 0) {
          await base44.asServiceRole.entities.Order.update(orders[0].id, {
            billing_status: 'active',
            stripe_event_id: event.id,
            current_period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : undefined,
            current_period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : undefined,
          });
          console.log(`[stripeWebhookOrders] Order ${orders[0].id} invoice ${event.type}: billing active`);
        }
      }

      await base44.asServiceRole.entities.CommunicationEvent.create({
        provider_message_id: event.id,
        event_type: `invoice_${event.type}`,
        provider: 'stripe',
        channel: 'webhook',
        direction: 'inbound',
        status: 'processed',
      }).catch(() => {});

      return Response.json({ received: true, processed: true });
    }

    // ─── Handle checkout.session.expired ─────────────────────────────────────
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      if (session.metadata?.order_id) {
        await base44.asServiceRole.entities.Order.update(session.metadata.order_id, {
          payment_status: 'failed',
          order_status: 'pending_payment',
          pipeline_error: 'Stripe checkout session expired',
          stripe_event_id: event.id,
        }).catch(() => {});
      }

      await base44.asServiceRole.entities.CommunicationEvent.create({
        provider_message_id: event.id,
        event_type: 'checkout_expired',
        provider: 'stripe',
        channel: 'webhook',
        direction: 'inbound',
        status: 'processed',
      }).catch(() => {});

      return Response.json({ received: true, processed: true });
    }

    // All other events — just acknowledge
    await base44.asServiceRole.entities.CommunicationEvent.create({
      provider_message_id: event.id,
      event_type: `stripe_${event.type}`,
      provider: 'stripe',
      channel: 'webhook',
      direction: 'inbound',
      status: 'acknowledged',
    }).catch(() => {});

    return Response.json({ received: true, processed: false, event_type: event.type });

  } catch (error) {
    console.error('[stripeWebhookOrders] Error:', error.message);
    return Response.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
});