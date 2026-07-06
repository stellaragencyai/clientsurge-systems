# ClientSurge Systems - Stripe Go-Live Checklist

Complete every item before switching from test to live Stripe payments.

## Canonical Webhook Endpoint

- **Canonical Stripe webhook URL (use this in Stripe Dashboard):** `https://clientsurgesystems.com/api/functions/stripeWebhookOrders`
- ⚠️ **WARNING:** The Stripe Dashboard webhook endpoint **must** point to the custom-domain URL above. Do **not** use the Base44 preview/testing URL as the active Stripe Dashboard endpoint.
- Base44 hostname (testing/fallback only — **never** use as the live Stripe Dashboard endpoint): `https://grinning-apex-flow-growth.base44.app/api/functions/stripeWebhookOrders`
- Stripe should deliver to the canonical custom-domain URL only.

## Required Stripe Events

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Legacy Stripe Endpoints to Remove or Disable

- `stripePaymentWebhook`
- `stripeInvoiceWebhook`
- `stripeInvoiceHandlers`

Those wrappers still exist for compatibility, but Stripe should not actively deliver to them.

## Verification Notes

- `GET https://clientsurgesystems.com/api/functions/stripeWebhookOrders` returns `400` with `Webhook Error: No webhook payload was provided.`
- That response confirms the deployed custom-domain function route exists and is serving the Stripe webhook handler.
- Live Stripe dashboard delivery and event replay are still **NOT VERIFIED** until one real Stripe test-mode delivery is observed in `CommunicationEvent`.

## Pre-Flight Checks

- [ ] All product prices created in live Stripe
- [ ] Stripe account identity verification complete
- [ ] Bank account connected and verified
- [ ] Payout schedule confirmed
- [ ] Statement descriptor confirmed
- [ ] Business address and tax info set in Stripe Dashboard
- [ ] `STRIPE_MODE=live`
- [ ] `STRIPE_LIVE_SECRET_KEY` is set and starts with `sk_live_`
- [ ] `STRIPE_PUBLISHABLE_KEY` is live and matches the live Stripe account
- [ ] `STRIPE_WEBHOOK_SECRET` matches the canonical live endpoint only
- [ ] `STRIPE_TEST_SECRET_KEY` and `STRIPE_TEST_WEBHOOK_SECRET` are staging/test only

## End-to-End Test Required Before Real Payments

- [ ] Place one Stripe test-mode checkout on the deployed site
- [ ] Confirm `checkout.session.completed` appears in `CommunicationEvent`
- [ ] Confirm `Order.payment_status = "paid"`
- [ ] Confirm `Order.client_id` and `Order.client_project_id` are both set
- [ ] Confirm `Order.install_configuration` and `Order.items[].install_status` initialize
- [ ] Confirm a one-time portal invite ledger entry is written
- [ ] Confirm a one-time order confirmation ledger entry is written
- [ ] Confirm `getClientPortalContext` returns canonical order/project/package/install state

## Rollback Plan

1. Disable the live Stripe webhook endpoint.
2. Revert Stripe API keys to test mode if a live key swap was performed.
3. Restore the test webhook signing secret.
4. Inspect `CommunicationEvent` for any partially processed live orders.
5. Notify affected customers if any real charges were created.