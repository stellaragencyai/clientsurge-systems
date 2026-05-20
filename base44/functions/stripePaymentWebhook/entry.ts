/**
 * Legacy compatibility wrapper.
 * This function no longer owns payment state. It delegates to the canonical
 * Stripe order lifecycle handler so duplicate endpoints cannot diverge.
 */
import { handleCanonicalStripeWebhook } from "../_shared/stripeOrderWebhook.js";

Deno.serve((req) =>
  handleCanonicalStripeWebhook(req, {
    source: "stripePaymentWebhook_legacy_wrapper",
  })
);
