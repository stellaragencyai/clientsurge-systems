import { handleCanonicalStripeWebhook } from "../_shared/stripeOrderWebhook.js";

/**
 * Legacy Stripe endpoint kept for deployed webhook compatibility.
 * All behavior lives in _shared/stripeOrderWebhook.js so idempotency,
 * fulfillment ledger writes, and retry semantics cannot drift.
 */
Deno.serve((req) =>
  handleCanonicalStripeWebhook(req, {
    source: "stripePaymentWebhook_legacy_wrapper",
  })
);
