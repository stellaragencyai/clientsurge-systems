/**
 * Legacy compatibility wrapper.
 * This endpoint is retained only so older webhook routes do not keep their own
 * invoice side effects.
 */
import { handleCanonicalStripeWebhook } from "../_shared/stripeOrderWebhook.js";

Deno.serve((req) =>
  handleCanonicalStripeWebhook(req, {
    source: "stripeInvoiceHandlers_legacy_wrapper",
  })
);
