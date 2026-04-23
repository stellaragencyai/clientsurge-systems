import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  initializePaidOrderInstallPipeline,
  InstallLinkingError,
} from "../_shared/installPipeline.js";
import { syncSubscriptionFromStripe } from "../_shared/subscriptionSync.js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET"));
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const sessionId = session.id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    // Find the order and mark it paid
    const orderId = session.metadata?.order_id || "";
    const orders = orderId
      ? [await base44.asServiceRole.entities.Order.get(orderId).catch(() => null)].filter(Boolean)
      : await base44.asServiceRole.entities.Order.filter({ stripe_session_id: sessionId });
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
        console.log(`Order ${order.id} marked as paid`);
      } catch (error) {
        if (error instanceof InstallLinkingError) {
          console.warn(`Order ${order.id} paid but linking requires manual repair`, error.details);
        } else {
          throw error;
        }
      }
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
