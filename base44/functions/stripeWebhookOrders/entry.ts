import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

if (stripeSecretKey.startsWith("sk_test_")) {
  console.warn("[STRIPE] Running in TEST MODE. Switch to sk_live_ before going live.");
} else if (!stripeSecretKey) {
  console.error("[STRIPE] STRIPE_SECRET_KEY is not set.");
} else {
  console.info("[STRIPE] Live mode key detected.");
}

function maskSecret(secret = "") {
  if (!secret) return "missing";
  if (secret.length <= 8) return `${secret.slice(0, 2)}***`;
  return `${secret.slice(0, 7)}...${secret.slice(-4)}`;
}

async function resolveStripeAccountSummary() {
  if (!stripe) return { secret_present: false, livemode: null };
  try {
    const account = await stripe.accounts.retrieve();
    return {
      secret_present: true,
      secret_prefix: stripeSecretKey.startsWith("sk_test_") ? "sk_test_" : "sk_live_",
      secret_fingerprint: maskSecret(stripeSecretKey),
      livemode: Boolean(account?.livemode),
      account_id: account?.id || null,
    };
  } catch (error) {
    return {
      secret_present: true,
      livemode: null,
      account_lookup_error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Initialize paid order in the install pipeline
async function initializePaidOrder({ base44, order, stripeCustomerId }) {
  console.log(`[stripeWebhookOrders] Initializing order ${order.id}`);

  const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
    payment_status: "paid",
    stripe_customer_id: stripeCustomerId || null,
    pipeline_status: "Ready for Install",
    install_initialized_at: new Date().toISOString(),
  });

  // Create or link ClientProject
  let clientProject;
  const existing = await base44.asServiceRole.entities.ClientProject.filter(
    { order_id: order.id },
    "-created_date",
    1
  ).catch(() => []);

  if (existing?.length > 0) {
    clientProject = existing[0];
    console.log(`[stripeWebhookOrders] Linked to existing project ${clientProject.id}`);
  } else {
    clientProject = await base44.asServiceRole.entities.ClientProject.create({
      order_id: order.id,
      business_name: order.business_name,
      client_email: order.customer_email,
      client_name: order.customer_name,
      status: "Configuring",
      plan: order.plan_type || "Custom Services",
    });
    console.log(`[stripeWebhookOrders] Created project ${clientProject.id}`);
  }

  await base44.asServiceRole.entities.Order.update(order.id, {
    client_id: clientProject.id,
  });

  return { order: updatedOrder, project: clientProject };
}

// Sync subscription fields from Stripe to Order entity
async function syncSubscriptionFields({ base44, stripeSubscription, eventType, fallbackOrderId = "" }) {
  if (!stripeSubscription) return;
  const orderId = stripeSubscription.metadata?.order_id || fallbackOrderId;
  if (!orderId) {
    console.warn("[syncSubscription] No order_id in subscription metadata", { subscriptionId: stripeSubscription.id });
    return;
  }
  const order = await base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
  if (!order) {
    console.warn("[syncSubscription] Order not found", { orderId });
    return;
  }
  const updates = {
    stripe_subscription_id: stripeSubscription.id,
    subscription_status: eventType === "customer.subscription.deleted" ? "canceled" : stripeSubscription.status,
    billing_status: eventType === "customer.subscription.deleted" ? "canceled" : stripeSubscription.status,
    current_period_start: stripeSubscription.current_period_start
      ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
      : null,
    current_period_end: stripeSubscription.current_period_end
      ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
      : null,
  };
  await base44.asServiceRole.entities.Order.update(orderId, updates);
  console.log("[syncSubscription] Updated", { orderId, status: updates.subscription_status });
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!stripe) {
    console.error("[stripeWebhookOrders] Stripe not configured", { requestId });
    return new Response("Webhook Error: Stripe is not configured", { status: 500 });
  }

  if (!webhookSecret) {
    console.error("[stripeWebhookOrders] STRIPE_WEBHOOK_SECRET missing", { requestId });
    return new Response("Webhook Error: STRIPE_WEBHOOK_SECRET is missing", { status: 500 });
  }

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripeWebhookOrders] Signature error", { requestId, message: err instanceof Error ? err.message : String(err) });
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`, { status: 400 });
  }

  console.log("[stripeWebhookOrders] event received", {
    requestId,
    eventId: event.id,
    eventType: event.type,
    stripeAccount: await resolveStripeAccountSummary(),
  });

  const base44 = createClientFromRequest(req);

  // ── checkout.session.completed ───────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const sessionId = session.id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    const orderId = session.metadata?.order_id || "";
    const orders = orderId
      ? [await base44.asServiceRole.entities.Order.get(orderId).catch(() => null)].filter(Boolean)
      : await base44.asServiceRole.entities.Order.filter({ stripe_session_id: sessionId });

    console.log("[stripeWebhookOrders] checkout.session.completed lookup", {
      requestId, eventId: event.id, sessionId, orderId, customerId, subscriptionId,
      sessionLivemode: session.livemode,
      metadata: session.metadata || {},
      matchedOrderIds: (orders || []).map((o) => o.id),
    });

    if (orders && orders.length > 0) {
      const order = orders[0];
      try {
        const initialized = await initializePaidOrder({ base44, order, stripeCustomerId: customerId });

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price"],
          });
          await syncSubscriptionFields({
            base44, stripeSubscription: subscription, eventType: event.type,
            fallbackOrderId: initialized.order.id,
          });
        }

        console.log("[stripeWebhookOrders] order marked paid", {
          requestId, eventId: event.id, orderId: order.id, sessionId, subscriptionId,
        });

        // ── Customer confirmation email ────────────────────────────────────────
        try {
          await base44.asServiceRole.functions.invoke("sendLeadConfirmationEmail", {
            customer_email: session.customer_details?.email || order.customer_email,
            customer_name: session.metadata?.customer_name || order.customer_name,
            business_name: session.metadata?.business_name || order.business_name,
            order_id: order.id,
            items: order.items || [],
            total_setup: order.total_setup,
            total_monthly: order.total_monthly,
          });
          console.log("[stripeWebhookOrders] confirmation email sent", { orderId: order.id });
        } catch (emailError) {
          console.error("[stripeWebhookOrders] confirmation email failed", {
            orderId: order.id,
            error: emailError instanceof Error ? emailError.message : String(emailError),
          });
        }

        // ── Admin notification on new purchase ────────────────────────────────
        try {
          await base44.asServiceRole.functions.invoke("sendAdminLeadNotification", {
            lead: {
              full_name: session.metadata?.customer_name || order.customer_name,
              email: session.customer_details?.email || order.customer_email,
              phone: order.customer_phone || "",
              business_name: session.metadata?.business_name || order.business_name,
              source: "Stripe Checkout",
            },
            subject: `💰 New Purchase: ${session.metadata?.business_name || order.business_name}`,
            extra_context: `Order ID: ${order.id} | Setup: $${order.total_setup} | Monthly: $${order.total_monthly}/mo | Services: ${(order.items || []).map((i) => i.product_name).join(", ")}`,
          });
          console.log("[stripeWebhookOrders] admin notification sent", { orderId: order.id });
        } catch (adminErr) {
          console.error("[stripeWebhookOrders] admin notification failed", {
            orderId: order.id,
            error: adminErr instanceof Error ? adminErr.message : String(adminErr),
          });
        }

      } catch (error) {
        console.error("[stripeWebhookOrders] pipeline init failed", {
          requestId, eventId: event.id, orderId: order.id,
          error: error instanceof Error ? error.message : String(error),
        });
        // Don't throw — return 200 to prevent Stripe retry loop
      }
    } else {
      console.warn("[stripeWebhookOrders] no order matched checkout.session.completed", {
        requestId, eventId: event.id, sessionId, orderId, metadata: session.metadata || {},
      });
    }
  }

  // ── Subscription lifecycle ───────────────────────────────────────────────────
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await syncSubscriptionFields({ base44, stripeSubscription: event.data.object, eventType: event.type });
  }

  // ── Invoice payment events ───────────────────────────────────────────────────
  if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
        expand: ["items.data.price"],
      });
      await syncSubscriptionFields({
        base44, stripeSubscription: subscription, eventType: event.type,
        fallbackOrderId: invoice.metadata?.order_id || "",
      });
    }
  }

  return Response.json({ received: true });
});