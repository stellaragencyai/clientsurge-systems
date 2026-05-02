import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  initializePaidOrderInstallPipeline,
  InstallLinkingError,
} from "../_shared/installPipeline.js";
import { syncSubscriptionFromStripe } from "../_shared/subscriptionSync.js";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Startup mode check
if (stripeSecretKey.startsWith("sk_test_")) {
  console.warn("[STRIPE] Running in TEST MODE. Real payments will not be processed. Switch to sk_live_ before going live.");
} else if (!stripeSecretKey) {
  console.error("[STRIPE] STRIPE_SECRET_KEY is not set. Webhook processing will fail.");
} else {
  console.info("[STRIPE] Live mode key detected.");
}

function maskSecret(secret = "") {
  if (!secret) return "missing";
  if (secret.length <= 8) return `${secret.slice(0, 2)}***`;
  return `${secret.slice(0, 7)}...${secret.slice(-4)}`;
}

async function resolveStripeAccountSummary() {
  if (!stripe) {
    return {
      secret_present: false,
      webhook_secret_present: Boolean(webhookSecret),
      secret_prefix: "missing",
      secret_fingerprint: "missing",
      webhook_fingerprint: maskSecret(webhookSecret),
      livemode: null,
      account_id: null,
      business_name: null,
    };
  }

  try {
    const account = await stripe.accounts.retrieve();
    return {
      secret_present: true,
      webhook_secret_present: Boolean(webhookSecret),
      secret_prefix: stripeSecretKey.startsWith("sk_test_") ? "sk_test_" : stripeSecretKey.startsWith("sk_live_") ? "sk_live_" : "unknown",
      secret_fingerprint: maskSecret(stripeSecretKey),
      webhook_fingerprint: maskSecret(webhookSecret),
      livemode: Boolean(account?.livemode),
      account_id: account?.id || null,
      business_name: account?.business_profile?.name || account?.settings?.dashboard?.display_name || null,
    };
  } catch (error) {
    return {
      secret_present: true,
      webhook_secret_present: Boolean(webhookSecret),
      secret_prefix: stripeSecretKey.startsWith("sk_test_") ? "sk_test_" : stripeSecretKey.startsWith("sk_live_") ? "sk_live_" : "unknown",
      secret_fingerprint: maskSecret(stripeSecretKey),
      webhook_fingerprint: maskSecret(webhookSecret),
      livemode: null,
      account_id: null,
      business_name: null,
      account_lookup_error: error instanceof Error ? error.message : String(error),
    };
  }
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!stripe) {
    console.error("[stripeWebhookOrders] Stripe is not configured", {
      requestId,
      secret_present: false,
      webhook_secret_present: Boolean(webhookSecret),
    });
    return new Response("Webhook Error: Stripe is not configured", { status: 500 });
  }

  if (!webhookSecret) {
    console.error("[stripeWebhookOrders] STRIPE_WEBHOOK_SECRET is missing", {
      requestId,
      stripeAccount: await resolveStripeAccountSummary(),
    });
    return new Response("Webhook Error: STRIPE_WEBHOOK_SECRET is missing", { status: 500 });
  }

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripeWebhookOrders] Webhook signature error", {
      requestId,
      message: err instanceof Error ? err.message : String(err),
      stripeAccount: await resolveStripeAccountSummary(),
    });
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`, { status: 400 });
  }

  console.log("[stripeWebhookOrders] event received", {
    requestId,
    eventId: event.id,
    eventType: event.type,
    stripeAccount: await resolveStripeAccountSummary(),
  });

  const base44 = createClientFromRequest(req);

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
      requestId,
      eventId: event.id,
      sessionId,
      orderId,
      customerId,
      subscriptionId,
      sessionLivemode: session.livemode,
      metadata: session.metadata || {},
      matchedOrderIds: (orders || []).map((order) => order.id),
    });

    if (orders && orders.length > 0) {
      const order = orders[0];
      try {
        const initialized = await initializePaidOrderInstallPipeline({
          base44,
          order,
          stripeCustomerId: customerId,
        });
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price"],
          });
          await syncSubscriptionFromStripe({
            base44,
            stripeSubscription: subscription,
            eventType: event.type,
            fallbackOrderId: initialized.order.id,
          });
        }
        console.log("[stripeWebhookOrders] order marked paid", {
          requestId,
          eventId: event.id,
          orderId: order.id,
          sessionId,
          subscriptionId,
        });
      } catch (error) {
        if (error instanceof InstallLinkingError) {
          console.warn("[stripeWebhookOrders] order paid but linking requires manual repair", {
            requestId,
            eventId: event.id,
            orderId: order.id,
            details: error.details,
          });
        } else {
          throw error;
        }
      }
    } else {
      console.warn("[stripeWebhookOrders] no order matched checkout.session.completed", {
        requestId,
        eventId: event.id,
        sessionId,
        orderId,
        metadata: session.metadata || {},
      });
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await syncSubscriptionFromStripe({
      base44,
      stripeSubscription: event.data.object,
      eventType: event.type,
    });
  }

  if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
        expand: ["items.data.price"],
      });
      await syncSubscriptionFromStripe({
        base44,
        stripeSubscription: subscription,
        eventType: event.type,
        fallbackOrderId: invoice.metadata?.order_id || "",
      });
    }
  }

  return Response.json({ received: true });
});
