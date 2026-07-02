import { handleCanonicalStripeWebhook } from "../_shared/stripeOrderWebhook.js";

/**
 * Stripe order webhook entrypoint.
 *
 * This endpoint intentionally delegates to the canonical Stripe order webhook
 * handler so checkout.session.completed updates the pre-created pending Order
 * from createCheckoutSession instead of creating duplicate/incomplete Orders.
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

  return handleCanonicalStripeWebhook(req, { source: "stripeWebhookOrders" });
});
