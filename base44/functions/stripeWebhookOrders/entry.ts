import { handleCanonicalStripeWebhook } from "./shared/stripeOrderWebhook.js";

/**
 * Legacy Stripe order webhook entrypoint.
 *
 * Keep this file as a thin wrapper around the canonical handler. Do not create
 * Orders directly here. The canonical handler resolves the pending Order created
 * by createCheckoutSession, marks it paid, syncs subscription data, initializes
 * install/onboarding, and records idempotent CommunicationEvent logs.
 */
Deno.serve((req) => {
  if (req.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      {
        status: 405,
        headers: {
          "Cache-Control": "no-store",
          "X-Frame-Options": "DENY",
        },
      }
    );
  }

  return handleCanonicalStripeWebhook(req, { source: "stripeWebhookOrders:legacyEntry" });
});
