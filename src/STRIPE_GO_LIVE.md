# ClientSurge Systems — Stripe Go-Live Checklist

Complete every item before switching from test to live Stripe payments.

---

## Pre-Flight Checks

- [ ] All product prices created in **live** Stripe dashboard (not just test)
- [ ] Stripe account identity verification complete (Stripe requires this before live charges)
- [ ] Bank account connected and verified in Stripe
- [ ] Business address and tax info set in Stripe Dashboard → Settings → Business details

---

## Step 1 — Swap API Keys ✅ DONE

1. ✅ `STRIPE_SECRET_KEY` → updated to `sk_live_...`
2. ✅ `STRIPE_PUBLISHABLE_KEY` → updated to `pk_live_...`
3. ✅ `STRIPE_WEBHOOK_SECRET` → live `whsec_...` already set

---

## Step 2 — Update the Webhook Endpoint ✅ DONE

1. ✅ Live webhook endpoint added in Stripe Dashboard
2. ✅ Pointed to `stripeWebhookOrders` function URL
3. ✅ Events subscribed:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. ✅ `STRIPE_WEBHOOK_SECRET` set to live signing secret

---

## Step 3 — Live Stripe Price IDs ← NEXT

- [ ] Confirm all `price_id` values in `lib/salesCatalog.js` use **live** Stripe price IDs (format: `price_live_...`)
- [ ] Test cards will NOT work in live mode — use a real card for verification

---

## Step 4 — End-to-End Test with Real Card

- [ ] Place a test order on the live domain with a real credit card
- [ ] Confirm `checkout.session.completed` webhook fires and is logged
- [ ] Confirm Order entity shows `payment_status: "paid"`
- [ ] Confirm customer confirmation email is received
- [ ] Confirm admin notification email is received
- [ ] Verify ClientProject is created and linked to the order
- [ ] Cancel and refund the test order in Stripe Dashboard

---

## Step 5 — Stripe Invoice Webhook (Subscriptions)

- [ ] Confirm `invoice.payment_succeeded` updates `subscription_status` on Order
- [ ] Confirm `invoice.payment_failed` sets `billing_status: "past_due"` on Order
- [ ] Confirm `PaymentFailedBanner` shows in client portal when `billing_status === "past_due"`

---

## Step 6 — Customer Portal URL

- [ ] Enable **Customer Portal** in [Stripe Dashboard → Settings → Billing → Customer portal](https://dashboard.stripe.com/settings/billing/portal)
- [ ] Test `getStripeCustomerPortalUrl` returns a working portal URL for a paid customer
- [ ] Confirm BillingDashboard "Manage Subscription" button redirects correctly

---

## Rollback Plan

If something breaks in live mode:
1. Revert `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` back to `sk_test_` / `pk_test_`
2. Disable the live webhook in Stripe Dashboard
3. Re-enable the test webhook
4. Revert `STRIPE_WEBHOOK_SECRET` to the test signing secret
5. Notify affected customers if any charges occurred

---

## Sign-Off

| Check | Person | Date |
|---|---|---|
| API keys swapped | ✅ | 2026-05-04 |
| Webhook updated | ✅ | 2026-05-04 |
| Price IDs updated | | |
| End-to-end purchase tested | | |
| Customer portal verified | | |
| Team sign-off | | |