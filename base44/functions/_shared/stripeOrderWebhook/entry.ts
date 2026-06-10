/**
 * Canonical Stripe webhook handler shared by all Stripe webhook entry points.
 *
 * Security guarantees:
 *  - Verifies Stripe-Signature using constructEventAsync (async SubtleCrypto)
 *  - Rejects any request that fails signature verification before touching the database
 *  - Idempotency: checks CommunicationEvent for processed stripe_event_id before acting
 *  - Logs every accepted and rejected event safely (no raw secrets, no card data)
 *  - Returns 200 for handled events, 400 for verification failures (Stripe retries on 5xx)
 *
 * Supported events:
 *  - checkout.session.completed
 *  - invoice.paid
 *  - invoice.payment_failed
 *  - customer.subscription.deleted
 *  - customer.subscription.updated
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import Stripe from "npm:stripe@14.21.0";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWebhookSecret() {
  // Support both live and test webhook secrets in the same deployment
  const secret =
    Deno.env.get("STRIPE_WEBHOOK_SECRET") ||
    Deno.env.get("STRIPE_TEST_WEBHOOK_SECRET");
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  return secret;
}

function safeLog(message, context = {}) {
  // Never log raw signatures, secret keys, or card data
  const safe = { ...context };
  delete safe.signature;
  delete safe.raw_body;
  delete safe.secret;
  console.log(message, JSON.stringify(safe));
}

function safeError(message, context = {}) {
  const safe = { ...context };
  delete safe.signature;
  delete safe.raw_body;
  delete safe.secret;
  console.error(message, JSON.stringify(safe));
}

/**
 * Check if a Stripe event has already been processed.
 * Uses CommunicationEvent with event_type=order_paid and provider_message_id=stripe_event_id.
 */
async function isEventAlreadyProcessed(base44, stripeEventId) {
  if (!stripeEventId) return false;
  try {
    const existing = await base44.asServiceRole.entities.CommunicationEvent.filter(
      {
        provider_message_id: stripeEventId,
        provider: "stripe",
      },
      "-created_date",
      1
    );
    return Boolean(existing?.length);
  } catch (err) {
    safeError("[stripeOrderWebhook] Idempotency check failed — proceeding", {
      error: err.message,
      stripe_event_id: stripeEventId,
    });
    return false; // fail-open: better to process twice than miss a payment
  }
}

/**
 * Record that a Stripe event was processed (idempotency guard).
 */
async function markEventProcessed(base44, stripeEvent, context = {}) {
  await base44.asServiceRole.entities.CommunicationEvent.create({
    channel: "webhook",
    direction: "inbound",
    event_type: "order_paid",
    provider: "stripe",
    status: "processed",
    provider_message_id: stripeEvent.id,
    subject: `Stripe event processed: ${stripeEvent.type}`,
    metadata_json: JSON.stringify({
      stripe_event_id: stripeEvent.id,
      stripe_event_type: stripeEvent.type,
      livemode: stripeEvent.livemode,
      ...context,
    }),
  }).catch((err) => {
    safeError("[stripeOrderWebhook] Failed to mark event processed", {
      error: err.message,
      stripe_event_id: stripeEvent.id,
    });
  });
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutSessionCompleted(base44, session, stripeEvent) {
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    safeError("[stripeOrderWebhook] checkout.session.completed missing order_id", {
      session_id: session.id,
      stripe_event_id: stripeEvent.id,
    });
    return { handled: false, reason: "missing_order_id" };
  }

  safeLog("[stripeOrderWebhook] checkout.session.completed", {
    session_id: session.id,
    order_id: orderId,
    stripe_event_id: stripeEvent.id,
    customer_email: session.customer_email,
    livemode: stripeEvent.livemode,
  });

  await base44.asServiceRole.entities.Order.update(orderId, {
    payment_status: "paid",
    order_status: "paid_setup_in_progress",
    stripe_session_id: session.id,
    stripe_customer_id: session.customer || undefined,
    stripe_subscription_id: session.subscription || undefined,
    subscription_id: session.subscription || undefined,
    stripe_event_id: stripeEvent.id,
    billing_status: "active",
    pipeline_status: "Paid",
    subscription_status: session.subscription ? "active" : undefined,
  }).catch((err) => {
    safeError("[stripeOrderWebhook] Failed to update Order after checkout", {
      error: err.message,
      order_id: orderId,
      stripe_event_id: stripeEvent.id,
    });
  });

  // Fire the post-payment orchestrator non-blocking
  base44.asServiceRole.functions.invoke("postPaymentOrchestrator", {
    order_id: orderId,
    stripe_session_id: session.id,
    stripe_event_id: stripeEvent.id,
    customer_email: session.customer_email,
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
  }).catch((err) => {
    safeError("[stripeOrderWebhook] postPaymentOrchestrator invoke failed (non-blocking)", {
      error: err.message,
      order_id: orderId,
    });
  });

  return { handled: true, order_id: orderId };
}

async function handleInvoicePaid(base44, invoice, stripeEvent) {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  if (!subscriptionId && !customerId) {
    return { handled: false, reason: "no_subscription_or_customer" };
  }

  safeLog("[stripeOrderWebhook] invoice.paid", {
    invoice_id: invoice.id,
    subscription_id: subscriptionId,
    customer_id: customerId,
    stripe_event_id: stripeEvent.id,
    amount_paid: invoice.amount_paid,
    livemode: stripeEvent.livemode,
  });

  // Find order by subscription_id or stripe_customer_id
  const orderQuery = subscriptionId
    ? { stripe_subscription_id: subscriptionId }
    : { stripe_customer_id: customerId };

  const orders = await base44.asServiceRole.entities.Order.filter(
    orderQuery,
    "-created_date",
    1
  ).catch(() => []);

  if (orders?.length) {
    const order = orders[0];
    await base44.asServiceRole.entities.Order.update(order.id, {
      payment_status: "paid",
      billing_status: "active",
      subscription_status: "active",
      stripe_event_id: stripeEvent.id,
      current_period_start: invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : undefined,
      current_period_end: invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : undefined,
    }).catch((err) => {
      safeError("[stripeOrderWebhook] Failed to update Order on invoice.paid", {
        error: err.message,
        order_id: order.id,
      });
    });
    return { handled: true, order_id: order.id };
  }

  safeLog("[stripeOrderWebhook] invoice.paid — no matching order found", {
    subscription_id: subscriptionId,
    customer_id: customerId,
  });
  return { handled: true, warning: "no_matching_order" };
}

async function handleInvoicePaymentFailed(base44, invoice, stripeEvent) {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;

  safeLog("[stripeOrderWebhook] invoice.payment_failed", {
    invoice_id: invoice.id,
    subscription_id: subscriptionId,
    customer_id: customerId,
    stripe_event_id: stripeEvent.id,
    livemode: stripeEvent.livemode,
  });

  const orderQuery = subscriptionId
    ? { stripe_subscription_id: subscriptionId }
    : { stripe_customer_id: customerId };

  const orders = await base44.asServiceRole.entities.Order.filter(
    orderQuery,
    "-created_date",
    1
  ).catch(() => []);

  if (orders?.length) {
    const order = orders[0];
    await base44.asServiceRole.entities.Order.update(order.id, {
      payment_status: "failed",
      billing_status: "payment_failed",
      subscription_status: "past_due",
      stripe_event_id: stripeEvent.id,
      pipeline_error: `Payment failed — Stripe invoice ${invoice.id}`,
    }).catch((err) => {
      safeError("[stripeOrderWebhook] Failed to update Order on payment_failed", {
        error: err.message,
        order_id: order.id,
      });
    });

    // Log failure event for admin visibility
    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id: order.id,
      channel: "webhook",
      direction: "inbound",
      event_type: "order_paid",
      provider: "stripe",
      status: "failed",
      provider_message_id: stripeEvent.id,
      subject: `Payment failed — ${order.customer_email}`,
      error_message: `Stripe invoice ${invoice.id} payment failed`,
      metadata_json: JSON.stringify({
        stripe_event_id: stripeEvent.id,
        invoice_id: invoice.id,
        subscription_id: subscriptionId,
        customer_id: customerId,
        livemode: stripeEvent.livemode,
      }),
    }).catch(() => null);

    return { handled: true, order_id: order.id, payment_failed: true };
  }

  return { handled: true, warning: "no_matching_order" };
}

async function handleSubscriptionDeleted(base44, subscription, stripeEvent) {
  safeLog("[stripeOrderWebhook] customer.subscription.deleted", {
    subscription_id: subscription.id,
    customer_id: subscription.customer,
    stripe_event_id: stripeEvent.id,
    livemode: stripeEvent.livemode,
  });

  const orders = await base44.asServiceRole.entities.Order.filter(
    { stripe_subscription_id: subscription.id },
    "-created_date",
    1
  ).catch(() => []);

  if (orders?.length) {
    const order = orders[0];
    await base44.asServiceRole.entities.Order.update(order.id, {
      subscription_status: "canceled",
      billing_status: "canceled",
      stripe_event_id: stripeEvent.id,
    }).catch((err) => {
      safeError("[stripeOrderWebhook] Failed to update Order on subscription.deleted", {
        error: err.message,
        order_id: order.id,
      });
    });
    return { handled: true, order_id: order.id, canceled: true };
  }

  return { handled: true, warning: "no_matching_order" };
}

async function handleSubscriptionUpdated(base44, subscription, stripeEvent) {
  safeLog("[stripeOrderWebhook] customer.subscription.updated", {
    subscription_id: subscription.id,
    status: subscription.status,
    stripe_event_id: stripeEvent.id,
    livemode: stripeEvent.livemode,
  });

  const orders = await base44.asServiceRole.entities.Order.filter(
    { stripe_subscription_id: subscription.id },
    "-created_date",
    1
  ).catch(() => []);

  if (orders?.length) {
    const order = orders[0];
    await base44.asServiceRole.entities.Order.update(order.id, {
      subscription_status: subscription.status,
      billing_status: subscription.status,
      stripe_event_id: stripeEvent.id,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : undefined,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : undefined,
    }).catch((err) => {
      safeError("[stripeOrderWebhook] Failed to update Order on subscription.updated", {
        error: err.message,
        order_id: order.id,
      });
    });
    return { handled: true, order_id: order.id };
  }

  return { handled: true, warning: "no_matching_order" };
}

// ---------------------------------------------------------------------------
// Main exported handler
// ---------------------------------------------------------------------------

export async function handleCanonicalStripeWebhook(req, options = {}) {
  const source = options.source || "stripeWebhookOrders";

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
    });
  }

  // ── Step 1: Read raw body BEFORE any JSON parsing (required for signature verification) ──
  let rawBody;
  try {
    rawBody = await req.text();
  } catch (err) {
    safeError(`[${source}] Failed to read request body`, { error: err.message });
    return new Response(JSON.stringify({ error: "Could not read request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
    });
  }

  // ── Step 2: Verify Stripe signature BEFORE touching any database ──
  let stripeEvent;
  try {
    const webhookSecret = getWebhookSecret();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      safeError(`[${source}] Missing stripe-signature header — rejecting`);
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
      apiVersion: "2023-10-16",
    });

    // MUST use async version — Deno uses SubtleCrypto (async), not Node crypto
    stripeEvent = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    safeError(`[${source}] Stripe signature verification failed — rejecting`, {
      error: err.message,
    });
    // Return 400 (not 500) so Stripe does NOT retry a rejected signature
    return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
    });
  }

  safeLog(`[${source}] Stripe signature verified`, {
    stripe_event_id: stripeEvent.id,
    stripe_event_type: stripeEvent.type,
    livemode: stripeEvent.livemode,
    source,
  });

  // ── Step 3: Idempotency check — skip already-processed events ──
  const base44 = createClientFromRequest(req);

  const alreadyProcessed = await isEventAlreadyProcessed(base44, stripeEvent.id);
  if (alreadyProcessed) {
    safeLog(`[${source}] Duplicate Stripe event skipped`, {
      stripe_event_id: stripeEvent.id,
      stripe_event_type: stripeEvent.type,
    });
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
    });
  }

  // ── Step 4: Route to event-specific handler ──
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
        safeLog(`[${source}] Unhandled Stripe event type`, {
          stripe_event_type: stripeEvent.type,
          stripe_event_id: stripeEvent.id,
        });
        result = { handled: false, reason: "unhandled_event_type" };
    }
  } catch (err) {
    safeError(`[${source}] Event handler threw an error`, {
      error: err.message,
      stripe_event_id: stripeEvent.id,
      stripe_event_type: stripeEvent.type,
    });
    // Do NOT return 500 — mark as processed to prevent Stripe retry loops on handler bugs
    // Admin can inspect CommunicationEvent logs for the error
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: "webhook",
      direction: "inbound",
      event_type: "order_paid",
      provider: "stripe",
      status: "failed",
      provider_message_id: stripeEvent.id,
      subject: `Stripe webhook handler error: ${stripeEvent.type}`,
      error_message: err.message,
      metadata_json: JSON.stringify({
        stripe_event_id: stripeEvent.id,
        stripe_event_type: stripeEvent.type,
        livemode: stripeEvent.livemode,
        source,
        error: err.message,
      }),
    }).catch(() => null);

    return new Response(JSON.stringify({ received: true, error_logged: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
    });
  }

  // ── Step 5: Mark event as processed (idempotency record) ──
  await markEventProcessed(base44, stripeEvent, {
    source,
    handled: result.handled,
    order_id: result.order_id || null,
    warning: result.warning || null,
  });

  return new Response(JSON.stringify({ received: true, ...result }), {
    status: 200,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}