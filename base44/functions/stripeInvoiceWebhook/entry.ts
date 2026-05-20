/**
 * Legacy compatibility wrapper.
 * Canonical Stripe invoice and subscription mutations now flow through the
 * shared Stripe order lifecycle handler.
 */
import { handleCanonicalStripeWebhook } from "../_shared/stripeOrderWebhook.js";

Deno.serve((req) =>
  handleCanonicalStripeWebhook(req, {
    source: "stripeInvoiceWebhook_legacy_wrapper",
  })
);
