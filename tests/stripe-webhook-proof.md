# Stripe Webhook Proof

This checklist proves checkout and webhook handling without touching live Stripe objects unless explicitly approved.

## Required before live proof

- Stripe test mode keys are configured in the test/staging target.
- Webhook endpoint uses the correct test webhook secret.
- Checkout creates an `Order` row before redirect.
- Webhook processing updates the same `Order`, not a duplicate.

## Test-mode proof steps

1. Start checkout for Starter, Growth, and Pro package payloads.
2. Complete checkout in Stripe test mode.
3. Confirm `checkout.session.completed` is accepted only with a valid Stripe signature.
4. Confirm the Order becomes `paid` and stores Stripe session/customer/subscription identity.
5. Confirm install handoff records are linked when expected.
6. Confirm duplicate webhook delivery is idempotent.
7. Confirm failed or unmatched events create visible failure evidence.

## Live proof rules

Live proof requires explicit owner approval for package, amount, purchaser, refund/no-refund plan, and timing.

## Pass condition

Stripe passes only when paid status, Stripe identity evidence, webhook event evidence, and install handoff proof all exist.
