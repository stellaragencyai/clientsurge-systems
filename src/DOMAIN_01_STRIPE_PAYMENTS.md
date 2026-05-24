# 💳 DOMAIN 01 — Stripe & Billing
> **Business Area:** Payment processing, subscriptions, checkout UX, billing portal
> **~18 tasks** | Last updated: 2026-05-21
> **Agents who touch this:** Agent B (backend), Agent C (portal/config)

---

## 📊 DOMAIN HEALTH: 🟡 Repo Ready / Live-Access Blocked
> ⚡ **Repo-side status:** Stripe metadata, proration, invoice, portal UI, webhook lifecycle handling, capacity checks, and shared Stripe helpers are complete in code.
> ⚠️ **Critical path:** #201 → #202 → #203 → #249 still requires Stripe Dashboard access, live keys, production webhook setup, and permission to run a real transaction.

---

## ⏱️ SPRINT SNAPSHOT — updated each session
| Metric | Value |
|---|---|
| 🔴 Unblocked Critical | 0 — remaining critical tasks require external Stripe/live-domain access |
| 🟠 Fastest Win (< 30 min, no deps) | Run `npm run launch:external-blockers` to confirm live Stripe inputs are present |
| 🧱 Longest Blocked Chain | #201 → #202 → #203 → #249 (4 deep, blocks go-live) |
| ✅ Done This Week | Repo-side Stripe tasks complete; live smoke tasks remain blocked |
| 🎯 Est. Hours to Domain Complete | ~4 hrs after Stripe/live-domain access is available |

---

## 🔴 CRITICAL

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 146 | ✅ | createCheckoutSession: add subscription_data.metadata.order_id | B | — | → C (portal order tracker) | 🧵 Stripe-Live | Done |
| 147 | ✅ | stripeWebhookOrders: on invoice.payment_failed → set billing_status: "past_due" | B | — | → C (PaymentFailedBanner) | 🧵 Payment-Recovery | Done |
| 194 | ✅ | ClientPortal: show PaymentFailedBanner when billing_status === "past_due" | C | #147 | — | 🧵 Payment-Recovery | Done |
| 201 | ❌ | Blocked: switch Stripe from Test Mode to Live Mode requires Stripe Dashboard access and live keys | C | — | → B (update webhook URL) | 🧵 Stripe-Live | External |
| 202 | ❌ | Blocked: update Stripe webhook endpoint URL requires Stripe Dashboard access and confirmed production webhook URL | C | #201 | → C (run E2E test #203) | 🧵 Stripe-Live | External |
| 203 | ❌ | Blocked: full purchase flow with real card requires live mode, production domain, and transaction approval | C | #202 | → ALL post in messages ✅ | 🧵 Stripe-Live | External |

---

## 🟠 HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 148 | ✅ | stripeWebhookOrders: on payment_failed → send recovery email w/ payment update link | B | #147 ✅ | — | 🧵 Payment-Recovery | Done |
| 195 | ✅ | BillingDashboard cancel/change paths redirect through getStripeCustomerPortalUrl where billing actions are delegated to Stripe | C | — | — | 🧵 Billing-Portal | Done |
| 204 | ✅ | Stripe subscription renewal invoice.paid handling verified in webhook lifecycle coverage | C | #203 | — | 🧵 Stripe-Live | Done |
| 206 | ❌ | Blocked: getStripeCustomerPortalUrl live verification requires at least one real paid Stripe customer/subscription | C | — | → A (smoke test portal) | 🧵 Billing-Portal | External |
| 208 | ✅ | Stripe checkout metadata includes base44_app_id on checkout sessions | C | — | — | 🧵 Stripe-Live | Done |
| 210 | ✅ | Stripe webhook lifecycle coverage verifies created, updated, deleted, and failed event handling | B | — | — | 🧵 Stripe-Live | Done |

---

## 🟡 MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 149 | ✅ | requestSubscriptionChange uses `proration_behavior: "create_prorations"` | B | — | → C (#207 proration preview) | 🧵 Billing-Portal | Done |
| 196 | ✅ | BillingDashboard exposes invoice PDF downloads from Stripe `invoice_pdf` URL | C | — | — | 🧵 Billing-Portal | Done |
| 205 | ✅ | AdminSettings.max_active_onboarding capacity limit blocks checkout when exceeded | C | #227 | — | — | Done |
| 207 | ✅ | Stripe proration preview implemented before plan changes | C | #149 | — | 🧵 Billing-Portal | Done |
| 209 | ✅ | Stripe customer ID is mirrored to ClientProject for portal billing lookups | C | — | — | 🧵 Billing-Portal | Done |

---

## ⚪ LOW

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 150 | ✅ | Extract Stripe init + signature validation into shared Stripe helpers | B | — | — | — | Done |

---

## ✅ COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| 146 | createCheckoutSession order_id metadata | Agent B | 2026-05-03 | Added `subscription_data.metadata.order_id` in `createCheckoutSession.js` |
| 147 | stripeWebhookOrders payment_failed billing_status | Agent B | 2026-05-03 | Sets `billing_status: "past_due"` on Order entity in `stripeWebhookOrders.js` |
| 194 | PaymentFailedBanner in ClientPortal | Agent C | 2026-05-03 | Added `PaymentFailedBanner` component; shown when `order.billing_status === "past_due"` |
| 101 | CartSidebar 12-second timeout fallback for Stripe redirect | Agent B | 2026-05-03 | Added 12s timeout + fallback message in `CartSidebar` before Stripe redirect |
| 149, 150, 196, 204, 205, 207, 208, 209, 210 | Repo-side Stripe hardening | Neo / prior agents | 2026-05-21 | Reconciled with master tracker; live-only items remain blocked on Stripe Dashboard and production-domain access. |
