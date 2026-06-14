/**
 * stripeWebhookOrders — Stripe webhook handler (self-contained, no local imports)
 * Handles: checkout.session.completed, invoice.paid, invoice.payment_failed,
 *          customer.subscription.deleted, customer.subscription.updated
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import Stripe from "npm:stripe@14.21.0";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

function safeLog(msg, ctx = {}) {
  const safe = { ...ctx };
  delete safe.signature; delete safe.raw_body; delete safe.secret;
  console.log(msg, JSON.stringify(safe));
}

function safeError(msg, ctx = {}) {
  const safe = { ...ctx };
  delete safe.signature; delete safe.raw_body; delete safe.secret;
  console.error(msg, JSON.stringify(safe));
}

async function isAlreadyProcessed(base44, stripeEventId) {
  if (!stripeEventId) return false;
  try {
    const existing = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { provider_message_id: stripeEventId, provider: "stripe" }, "-created_date", 1
    );
    return Boolean(existing?.length);
  } catch {
    return false;
  }
}

async function handleCheckoutSessionCompleted(base44, session, event) {
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    safeError("[stripeWebhookOrders] checkout.session.completed missing order_id in metadata", {
      session_id: session.id, stripe_event_id: event.id,
    });
    // Try to find order by stripe_session_id as fallback
    const bySession = await base44.asServiceRole.entities.Order.filter(
      { stripe_session_id: session.id }, "-created_date", 1
    ).catch(() => []);
    if (!bySession?.length) {
      return { handled: false, reason: "missing_order_id_and_no_session_match" };
    }
    const order = bySession[0];
    safeLog("[stripeWebhookOrders] Found order by stripe_session_id fallback", { order_id: order.id });
    await base44.asServiceRole.entities.Order.update(order.id, {
      payment_status: "paid",
      order_status: "paid_setup_in_progress",
      stripe_customer_id: session.customer || undefined,
      stripe_subscription_id: session.subscription || undefined,
      subscription_id: session.subscription || undefined,
      stripe_event_id: event.id,
      billing_status: "active",
      pipeline_status: "Paid",
      subscription_status: session.subscription ? "active" : undefined,
    }).catch(err => safeError("[stripeWebhookOrders] Order update failed", { error: err.message, order_id: order.id }));
    base44.asServiceRole.functions.invoke("postPaymentOrchestrator", {
      order_id: order.id, stripe_session_id: session.id, stripe_event_id: event.id,
      customer_email: session.customer_email, stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
    }).catch(err => safeError("[stripeWebhookOrders] postPaymentOrchestrator invoke failed", { error: err.message }));
    return { handled: true, order_id: order.id, via: "session_id_fallback" };
  }

  safeLog("[stripeWebhookOrders] checkout.session.completed", {
    session_id: session.id, order_id: orderId, stripe_event_id: event.id, livemode: event.livemode,
  });

  await base44.asServiceRole.entities.Order.update(orderId, {
    payment_status: "paid",
    order_status: "paid_setup_in_progress",
    stripe_session_id: session.id,
    stripe_customer_id: session.customer || undefined,
    stripe_subscription_id: session.subscription || undefined,
    subscription_id: session.subscription || undefined,
    stripe_event_id: event.id,
    billing_status: "active",
    pipeline_status: "Paid",
    subscription_status: session.subscription ? "active" : undefined,
  }).catch(err => safeError("[stripeWebhookOrders] Order update failed", { error: err.message, order_id: orderId }));

  base44.asServiceRole.functions.invoke("postPaymentOrchestrator", {
    order_id: orderId, stripe_session_id: session.id, stripe_event_id: event.id,
    customer_email: session.customer_email, stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
  }).catch(err => safeError("[stripeWebhookOrders] postPaymentOrchestrator invoke failed", { error: err.message, order_id: orderId }));

  return { handled: true, order_id: orderId };
}

async function handleInvoicePaid(base44, invoice, event) {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  safeLog("[stripeWebhookOrders] invoice.paid", {
    invoice_id: invoice.id, subscription_id: subscriptionId, stripe_event_id: event.id,
  });
  const query = subscriptionId ? { stripe_subscription_id: subscriptionId } : { stripe_customer_id: customerId };
  const orders = await base44.asServiceRole.entities.Order.filter(query, "-created_date", 1).catch(() => []);
  if (orders?.length) {
    await base44.asServiceRole.entities.Order.update(orders[0].id, {
      payment_status: "paid", billing_status: "active", subscription_status: "active",
      stripe_event_id: event.id,
      current_period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : undefined,
      current_period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : undefined,
    }).catch(err => safeError("[stripeWebhookOrders] invoice.paid update failed", { error: err.message }));
    return { handled: true, order_id: orders[0].id };
  }
  return { handled: true, warning: "no_matching_order" };
}

async function handleInvoicePaymentFailed(base44, invoice, event) {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  safeLog("[stripeWebhookOrders] invoice.payment_failed", { invoice_id: invoice.id, stripe_event_id: event.id });
  const query = subscriptionId ? { stripe_subscription_id: subscriptionId } : { stripe_customer_id: customerId };
  const orders = await base44.asServiceRole.entities.Order.filter(query, "-created_date", 1).catch(() => []);
  if (orders?.length) {
    const order = orders[0];
    await base44.asServiceRole.entities.Order.update(order.id, {
      payment_status: "failed", billing_status: "payment_failed",
      subscription_status: "past_due", stripe_event_id: event.id,
      pipeline_error: `Payment failed — Stripe invoice ${invoice.id}`,
    }).catch(err => safeError("[stripeWebhookOrders] payment_failed update error", { error: err.message }));
    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id: order.id, channel: "webhook", direction: "inbound",
      event_type: "order_paid", provider: "stripe", status: "failed",
      provider_message_id: event.id,
      subject: `Payment failed — ${order.customer_email}`,
      error_message: `Stripe invoice ${invoice.id} payment failed`,
      metadata_json: JSON.stringify({ stripe_event_id: event.id, invoice_id: invoice.id }),
    }).catch(() => null);
    return { handled: true, order_id: order.id, payment_failed: true };
  }
  return { handled: true, warning: "no_matching_order" };
}

async function handleSubscriptionDeleted(base44, subscription, event) {
  safeLog("[stripeWebhookOrders] subscription.deleted", { subscription_id: subscription.id, stripe_event_id: event.id });
  const orders = await base44.asServiceRole.entities.Order.filter(
    { stripe_subscription_id: subscription.id }, "-created_date", 1
  ).catch(() => []);
  if (orders?.length) {
    await base44.asServiceRole.entities.Order.update(orders[0].id, {
      subscription_status: "canceled", billing_status: "canceled", stripe_event_id: event.id,
    }).catch(err => safeError("[stripeWebhookOrders] subscription.deleted update error", { error: err.message }));
    return { handled: true, order_id: orders[0].id, canceled: true };
  }
  return { handled: true, warning: "no_matching_order" };
}

async function handleSubscriptionUpdated(base44, subscription, event) {
  safeLog("[stripeWebhookOrders] subscription.updated", { subscription_id: subscription.id, status: subscription.status });
  const orders = await base44.asServiceRole.entities.Order.filter(
    { stripe_subscription_id: subscription.id }, "-created_date", 1
  ).catch(() => []);
  if (orders?.length) {
    await base44.asServiceRole.entities.Order.update(orders[0].id, {
      subscription_status: subscription.status, billing_status: subscription.status,
      stripe_event_id: event.id,
      current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : undefined,
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : undefined,
    }).catch(err => safeError("[stripeWebhookOrders] subscription.updated error", { error: err.message }));
    return { handled: true, order_id: orders[0].id };
  }
  return { handled: true, warning: "no_matching_order" };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let rawBody;
  try {
    rawBody = await req.text();
  } catch (err) {
    safeError("[stripeWebhookOrders] Failed to read body", { error: err.message });
    return json({ error: "Could not read request body" }, 400);
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || Deno.env.get("STRIPE_TEST_WEBHOOK_SECRET");
  if (!webhookSecret) {
    safeError("[stripeWebhookOrders] STRIPE_WEBHOOK_SECRET not configured");
    return json({ error: "Webhook secret not configured" }, 500);
  }

  let stripeEvent;
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), { apiVersion: "2023-10-16" });
    const signature = req.headers.get("stripe-signature");
    if (!signature) return json({ error: "Missing stripe-signature header" }, 400);
    stripeEvent = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    safeError("[stripeWebhookOrders] Signature verification failed", { error: err.message });
    return json({ error: "Webhook signature verification failed" }, 400);
  }

  safeLog("[stripeWebhookOrders] Event verified", {
    stripe_event_id: stripeEvent.id, type: stripeEvent.type, livemode: stripeEvent.livemode,
  });

  const base44 = createClientFromRequest(req);

  const alreadyProcessed = await isAlreadyProcessed(base44, stripeEvent.id);
  if (alreadyProcessed) {
    safeLog("[stripeWebhookOrders] Duplicate event skipped", { stripe_event_id: stripeEvent.id });
    return json({ received: true, duplicate: true });
  }

  let result = { handled: false };
  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed":
        result = await handleCheckoutSessionCompleted(base44, stripeEvent.data.object, stripeEvent);
        break;
      case "invoice.paid":
        result = await handleInvoicePaid(base44, stripeEvent.data.object, stripeEvent);
        break;
      case "invoice.payment_failed":
        result = await handleInvoicePaymentFailed(base44, stripeEvent.data.object, stripeEvent);
        break;
      case "customer.subscription.deleted":
        result = await handleSubscriptionDeleted(base44, stripeEvent.data.object, stripeEvent);
        break;
      case "customer.subscription.updated":
        result = await handleSubscriptionUpdated(base44, stripeEvent.data.object, stripeEvent);
        break;
      default:
        safeLog("[stripeWebhookOrders] Unhandled event type", { type: stripeEvent.type });
        result = { handled: false, reason: "unhandled_event_type" };
    }
  } catch (err) {
    safeError("[stripeWebhookOrders] Handler error", { error: err.message, stripe_event_id: stripeEvent.id });
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: "webhook", direction: "inbound", event_type: "order_paid",
      provider: "stripe", status: "failed",
      provider_message_id: stripeEvent.id,
      subject: `Stripe webhook handler error: ${stripeEvent.type}`,
      error_message: err.message,
      metadata_json: JSON.stringify({ stripe_event_id: stripeEvent.id, type: stripeEvent.type, error: err.message }),
    }).catch(() => null);
    return json({ received: true, error_logged: true });
  }

  // Idempotency record
  await base44.asServiceRole.entities.CommunicationEvent.create({
    channel: "webhook", direction: "inbound", event_type: "order_paid",
    provider: "stripe", status: "processed",
    provider_message_id: stripeEvent.id,
    subject: `Stripe event processed: ${stripeEvent.type}`,
    metadata_json: JSON.stringify({
      stripe_event_id: stripeEvent.id, type: stripeEvent.type,
      livemode: stripeEvent.livemode, handled: result.handled, order_id: result.order_id || null,
    }),
  }).catch(() => null);

  return json({ received: true, ...result });
});