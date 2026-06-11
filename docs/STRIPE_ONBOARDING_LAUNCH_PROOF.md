# Stripe / Onboarding Launch Proof

## Overall Status

PARTIAL.

Code-level Stripe/onboarding readiness is stronger after Project 7 repair, but launch is not PASS until provider proof is completed in Stripe test mode and Base44 test/staging records are verified. No live charges, live cards, production deploys, live dashboard edits, or real customer onboarding were performed in this pass.

## Stripe Mode Safety

- `base44/functions/_shared/stripeInit.js` centralizes Stripe client creation.
- `STRIPE_MODE=live` requires `STRIPE_LIVE_SECRET_KEY` and rejects non-`sk_live_` keys.
- `STRIPE_MODE=test` uses `STRIPE_TEST_SECRET_KEY` or the legacy local `STRIPE_SECRET_KEY` fallback and rejects `sk_live_` keys.
- Production-like runtimes fail closed when `STRIPE_MODE` is missing.
- Stripe-facing entrypoints import the shared helper instead of constructing raw clients.

## Required Environment Variables

- `STRIPE_MODE`
- `STRIPE_LIVE_SECRET_KEY` for live mode
- `STRIPE_TEST_SECRET_KEY` for test mode
- `STRIPE_SECRET_KEY` only as local/test fallback
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_TEST_WEBHOOK_SECRET` for test-mode webhook proof
- `STRIPE_PUBLISHABLE_KEY`
- `APP_URL=https://clientsurgesystems.com` in production
- `STRIPE_PACKAGE_PRICE_OVERRIDES_JSON` only for staging/test package price IDs

## Package Metadata Standard

Internal package keys:

- `starter_system`
- `growth_system`
- `pro_system`

Legacy alias:

- `elite_system` maps to `pro_system`

Customer-facing names:

- Starter System
- Growth System
- Pro System

Checkout metadata required:

- `package_type`
- `selected_package_type`
- `package_key`
- `plan_type`
- `crm_lead_id`
- `customer_email` is carried through the Checkout customer email field, not as a secret.
- `source_page` and `checkout_origin` are optional follow-up metadata if frontend attribution is expanded.

OWNER_CONFIRMATION_REQUIRED: final live package pricing and AI voice packaging remain owner-confirmation items already flagged in the catalog.

## Checkout Proof Checklist

- Confirm Base44 target is a staging/test app, not production app `69dc4a79656fdba136d413d3`.
- Configure `STRIPE_MODE=test`.
- Configure a test-prefixed Stripe secret key.
- Configure test webhook signing secret.
- Configure `STRIPE_PACKAGE_PRICE_OVERRIDES_JSON` with test-mode package product/setup/monthly price IDs.
- Run `node scripts/stripe/verify-test-checkout.mjs` only after setting `CLIENTSURGE_STRIPE_TEST_CHECKOUT_URL` and `CLIENTSURGE_STRIPE_TEST_CREATE_CHECKOUT=true`.
- Review `artifacts/stripe/stripe-test-checkout-proof.json`.

## Webhook Proof Checklist

PROVIDER_DASHBOARD_REQUIRED:

- Test webhook endpoint exists for the test/staging Base44 function URL.
- Required events include `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.paid`, `invoice.payment_failed`, and `payment_intent.payment_failed`.
- Stripe dashboard shows successful delivery for the test checkout event.
- Duplicate event resend does not duplicate Order, Client, ClientProject, OnboardingClient, portal invite, or confirmation events.

## Onboarding Record Checklist

- Paid checkout creates or updates `Order`.
- Paid checkout initializes or links `Client`.
- Paid checkout initializes or links `ClientProject`.
- Paid checkout initializes or links `OnboardingClient`.
- `initializeInstallOS` is invoked idempotently.
- `AutomationChecklist` / `AutomationChecklistStep` path remains covered by `initializeInstallOS` and install-pipeline tests.
- Missing Resend records a failed/skipped communication event and does not crash paid onboarding.

## Failed Payment Checklist

- `invoice.payment_failed` marks billing/payment failure and sends or records payment recovery status.
- `payment_intent.payment_failed` marks payment failure and does not initialize onboarding.
- Checkout sessions that do not complete remain `pending_payment`.
- Canceled or expired checkout sessions do not have a code path that initializes onboarding.
- Refund/chargeback handling remains FOLLOW_UP_IMPLEMENTATION_REQUIRED unless Stripe dispute/refund events are added.

## CRM Won Bridge Checklist

- `updateLeadStatus` now has a real `_shared/crmWonBridge.js` import target.
- `crmWonBridge` callable function exists and requires admin access.
- CRM Won without a paid/manual-paid order becomes `Won Pending Payment`.
- Invoice-pending does not create onboarding records.
- Manual paid bridge can create a manual-paid order and initialize onboarding only from the explicit admin function.
- `attachAdminOnboardingOrder` now routes through the paid-order helper and refuses unpaid orders.
- `installPipeline` direct initialize action refuses unpaid orders.

## Customer Portal Checklist

- `getStripeCustomerPortalUrl` uses the shared Stripe helper and refuses missing Stripe customer IDs.
- `getStripePaymentUpdateUrl` resolves portal ownership and refuses missing Stripe customer IDs.
- `getStripeBillingData` falls back to internal invoices when Stripe customer/config is unavailable.
- `cancelSubscription` fails closed when Stripe config is missing and does not print secrets.

## Invoice Payment Link Checklist

- `createInvoicePaymentLink` requires authentication and invoice ownership for non-admin users.
- It refuses already-paid invoices.
- It refuses invoices not linked to Stripe.
- It retrieves hosted invoice URLs from Stripe instead of creating live invoice links from scratch.

## Manual Stripe Dashboard Checklist

Stripe Test Mode:

- Products/prices configured or inline `price_data` verified.
- Webhook endpoint configured for the test/staging Base44 function URL.
- Webhook signing secret copied into test env.
- Required events enabled.
- Checkout success/cancel URLs verified.
- Customer Portal test settings verified.
- Test card flow verified.
- Failed payment flow verified.
- Expired checkout behavior verified.

Stripe Live Mode:

- Live products/prices configured if used.
- Live webhook endpoint configured.
- Live webhook signing secret configured.
- Live success/cancel URLs verified.
- Customer Portal live settings verified.
- Branding verified.
- Tax settings reviewed.
- Receipts reviewed.
- Payment methods reviewed.
- Fraud/Radar basics reviewed.

## Base44 Production Env Checklist

PROVIDER_DASHBOARD_REQUIRED:

- `STRIPE_MODE` configured in the correct environment.
- Test/live keys configured in the correct environment.
- Webhook secret configured.
- Checkout function URL configured for proof harness only against test/staging.
- No test keys in live mode.
- No live keys in test mode.
- Do not set `STRIPE_PACKAGE_PRICE_OVERRIDES_JSON` on production unless deliberately forcing test-mode prices for an approved staging target.

## Test Mode Proof Instructions

PowerShell example for a staging/test target only:

```powershell
$env:STRIPE_MODE = "test"
$env:STRIPE_TEST_SECRET_KEY = "<sk_test value from local safe storage>"
$env:STRIPE_TEST_WEBHOOK_SECRET = "<whsec test value from local safe storage>"
$env:CLIENTSURGE_STRIPE_TEST_CHECKOUT_URL = "https://<test-base44-app>/api/functions/createCheckoutSession"
$env:CLIENTSURGE_STRIPE_TEST_CREATE_CHECKOUT = "true"
$env:CLIENTSURGE_STRIPE_TEST_PACKAGE_KEY = "starter_system"
node scripts/stripe/verify-test-checkout.mjs
```

The script writes `artifacts/stripe/stripe-test-checkout-proof.json` and never prints secret values.

## Live Payment Blocker List

- PROVIDER_DASHBOARD_REQUIRED: Stripe test-mode checkout/webhook delivery proof.
- PROVIDER_DASHBOARD_REQUIRED: Base44 staging/test env confirmation without exposing values.
- PRODUCTION_SAFE_TEST_REQUIRED: controlled production-safe proof before real client payments.
- OWNER_CONFIRMATION_REQUIRED: final package pricing, AI voice packaging, refund/cancellation terms.
- FOLLOW_UP_IMPLEMENTATION_REQUIRED: refund/chargeback lifecycle handlers if those must be launch gates.

## Owner Decisions Still Required

- OWNER_CONFIRMATION_REQUIRED: approve the exact staging/test Base44 target for test checkout proof.
- OWNER_CONFIRMATION_REQUIRED: approve whether manual paid order creation is enabled for launch admins.
- OWNER_CONFIRMATION_REQUIRED: approve live pricing and Stripe catalog naming before live customer payments.
