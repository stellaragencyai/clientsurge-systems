// Canonical Stripe webhook entrypoint.
// The previous main.ts created paid Order records without provisioning ClientProject,
// ClientInstallationOS, portal invite, or automation checklists. Keep all runtimes on
// the shared handler so checkout.session.completed uses the same full fulfillment path.

import { handleCanonicalStripeWebhook } from "../_shared/stripeOrderWebhook.js";

Deno.serve((req) => handleCanonicalStripeWebhook(req, { source: "stripeWebhookOrders.main" }));
