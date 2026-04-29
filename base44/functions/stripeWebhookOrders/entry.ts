import Stripe from "npm:stripe@14.21.0";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

import {
  handleCheckoutSessionCompleted,
  handleInvoiceLifecycleEvent,
} from "../_shared/stripeBillingWorkflow.js";
import { syncSubscriptionFromStripe } from "../_shared/subscriptionSync.js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-06-20",
});

function resolveWebhookSecret() {
  return Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
}

function hasHandledStripeEvent(base44, eventId) {
  if (!eventId) {
    return Promise.resolve(false);
  }

  return base44.asServiceRole.entities.CommunicationEvent
    .filter({ provider_message_id: eventId })
    .then((events) => Boolean(events?.length))
    .catch(() => false);
}

Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      resolveWebhookSecret()
    );
  } catch (error) {
    console.error("Webhook signature error:", error.message);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const base44 = createClientFromRequest(req);
  const alreadyHandled = await hasHandledStripeEvent(base44, event.id);

  try {
    if (alreadyHandled) {
      return Response.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleCheckoutSessionCompleted({
          base44,
          session,
          eventId: event.id,
          stripeSubscriptionLoader: (subscriptionId) =>
            stripe.subscriptions.retrieve(subscriptionId),
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object;
        await syncSubscriptionFromStripe({
          base44,
          stripeSubscription,
          eventType: event.type,
          sourceEventId: event.id,
        });
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const stripeInvoice = event.data.object;
        await handleInvoiceLifecycleEvent({
          base44,
          stripe,
          stripeInvoice,
          eventType: event.type,
          eventId: event.id,
        });
        break;
      }

      default:
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("stripeWebhookOrders processing error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
