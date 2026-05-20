import { handleCanonicalStripeWebhook } from "../_shared/stripeOrderWebhook.js";

Deno.serve((req) =>
  handleCanonicalStripeWebhook(req, {
    source: "stripeWebhookOrders",
  })
);
