# 💳 DOMAIN 01 — Stripe & Billing
> **Business Area:** Payment processing, subscriptions, checkout UX, billing portal  
> **~18 tasks** | Last updated: 2026-05-03  
> **Agents who touch this:** Agent B (backend), Agent C (portal/config)

---

## 🔴 CRITICAL

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 146 | ✅ | createCheckoutSession: add subscription_data.metadata.order_id | B | — | → C (portal order tracker) | Done |
| 147 | ✅ | stripeWebhookOrders: on invoice.payment_failed → set billing_status: "past_due" | B | — | → C (PaymentFailedBanner) | Done |
| 194 | ✅ | ClientPortal: show PaymentFailedBanner when billing_status === "past_due" | C | #147 | — | Done |
| 201 | 🔄 | Switch Stripe from Test Mode to Live Mode (sk_live_ / pk_live_ keys) | C | — | → B (update webhook URL) | ~2 hrs |
| 202 | 🔄 | Update Stripe webhook endpoint URL to production domain | C | #201 | → C (run E2E test #203) | ~30 min |
| 203 | 🔄 | Test full purchase flow end-to-end with real card on live domain | C | #202 | → ALL post in messages ✅ | ~1 hr |

---

## 🟠 HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 148 | ⏳ | stripeWebhookOrders: on payment_failed → send recovery email w/ payment update link | B | #147 ✅ | — | ~1 hr |
| 195 | 🔄 | BillingDashboard: "Cancel Subscription" → getStripeCustomerPortalUrl redirect | C | — | — | ~1 hr |
| 204 | ⏳ | Verify Stripe subscription renewal fires invoice.paid and is handled | C | #203 | — | ~30 min |
| 206 | 🔄 | getStripeCustomerPortalUrl: verify it returns working URL for all paid customers | C | — | → A (smoke test portal) | ~30 min |
| 208 | ⏳ | Verify Stripe metadata includes base44_app_id on all checkout sessions | C | — | — | ~20 min |
| 210 | ⏳ | Verify all Stripe webhook event types are handled (created, updated, deleted, failed) | B | — | — | ~1 hr |

---

## 🟡 MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 149 | ⏳ | requestSubscriptionChange: use proration_behavior: "create_prorations" | B | — | → C (#207 proration preview) | ~30 min |
| 196 | ⏳ | BillingDashboard: "Download Invoice PDF" using Stripe invoice_pdf URL | C | — | — | ~30 min |
| 205 | ⏳ | Add capacity limit: AdminSettings.max_active_onboarding — block checkout if exceeded | C | #227 | — | ~45 min |
| 207 | ⏳ | Stripe proration: implement preview before plan change in requestSubscriptionChange | C | #149 | — | ~1 hr |
| 209 | ⏳ | Add Stripe customer ID to ClientProject for portal billing lookups | C | — | — | ~30 min |

---

## ⚪ LOW

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 150 | ⏳ | Extract Stripe init + signature validation into _shared/stripeInit.js | B | — | — | ~30 min |

---

## ✅ COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| 146 | createCheckoutSession order_id metadata | Agent B | 2026-05-03 | Added `subscription_data.metadata.order_id` in `createCheckoutSession.js` |
| 147 | stripeWebhookOrders payment_failed billing_status | Agent B | 2026-05-03 | Sets `billing_status: "past_due"` on Order entity in `stripeWebhookOrders.js` |
| 194 | PaymentFailedBanner in ClientPortal | Agent C | 2026-05-03 | Added `PaymentFailedBanner` component; shown when `order.billing_status === "past_due"` |
| 101 | CartSidebar 12-second timeout fallback for Stripe redirect | Agent B | 2026-05-03 | Added 12s timeout + fallback message in `CartSidebar` before Stripe redirect |