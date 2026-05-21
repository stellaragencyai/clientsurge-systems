# ClientSurge Post-Launch Rollback Plan

Use this after a production launch, live checkout proof, or major Base44 publish. This is an operator runbook, not an approval to change live Stripe, Twilio, Resend, DNS, or Base44 production settings without Nolan's explicit go-ahead.

## Launch Preconditions

Do not start the launch window until these are true:

1. GitHub `main` is at the intended release commit and the working branch is pushed.
2. `npm run test:node` passes.
3. `npm run build` passes.
4. Base44 publish/deploy path is confirmed for the current production app.
5. Stripe package prices and webhook endpoint are confirmed for the target mode.
6. Twilio and Resend webhooks are configured and signature validation is enabled.
7. The operator has a rollback owner, current release commit, previous known-good commit, and 24-hour monitoring owner.

## Go-Live Proof Order

Run in this order so failures stop before customer-facing damage spreads:

1. Publish the intended frontend/backend release through the confirmed Base44 production workflow.
2. Open `https://clientsurgesystems.com` and confirm homepage, pricing/store, checkout entry, lead capture, privacy policy, and terms load.
3. Run the test checkout path first when test-mode catalog/webhook resources exist.
4. Confirm Stripe webhook processing creates or updates the expected Order and install pipeline records.
5. Confirm order confirmation email behavior using test/sandbox proof before any real customer send.
6. Run one controlled live checkout proof only after Nolan approves the amount, card, and refund/no-refund handling.
7. Confirm admin health, communication logs, and install queue after the payment proof.
8. Start the 24-hour monitoring window.

## Rollback Triggers

Rollback or pause launch if any of these occur:

- Checkout cannot create a Stripe session for the selected package.
- Stripe webhook creates no Order, duplicate Orders, wrong services, or stale package mapping.
- Paid order does not initialize canonical install pipeline records.
- Confirmation email fails for a paid order and no safe retry path is available.
- Lead capture stops working or creates malformed lead records.
- SMS/email automations send without consent, ignore STOP, or continue after a reply/booking pause condition.
- Base44 publish causes blank page, broken routing, auth failure, or admin access loss.
- Provider auth, webhook signature, or secret errors appear after launch.

## Rollback Steps

1. Stop new customer-facing launch activity.
   - Pause ads, launch announcements, and outbound promotion.
   - Do not delete orders, leads, or provider events.
2. Capture evidence.
   - Record release commit, timestamp, affected URL, provider event IDs, Base44 logs, Stripe session/invoice IDs, and CommunicationEvent IDs.
3. Restore the previous known-good app version.
   - Use the confirmed Base44 rollback or publish workflow.
   - If code rollback is required, revert with a new commit rather than rewriting history.
4. Disable only the affected automation path if rollback cannot be completed immediately.
   - Prefer service status/config flags over credential changes.
   - Do not rotate live secrets unless the incident is credential-related.
5. Reconcile data.
   - Match Stripe sessions/invoices to Orders.
   - Confirm paid orders have correct service bundles.
   - Park ambiguous or duplicate records for manual review.
6. Verify recovery.
   - Homepage, store/pricing, lead capture, privacy policy, terms.
   - Admin health and communication logs.
   - One safe test record through the failed path, using sandbox/test mode when available.
7. Log closeout.
   - Root cause, rollback action, customer impact, records reconciled, follow-up issue, and next monitoring check.

## Stripe-Specific Recovery

1. Do not change live Stripe keys, webhook secrets, or billing permissions during triage.
2. Confirm whether the issue is checkout session creation, webhook delivery, webhook processing, or order initialization.
3. Reconcile `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, and subscription events against local Order/Subscription state.
4. If a real charge occurred, decide refund/no-refund handling with Nolan before acting.
5. Do not manually activate an unpaid order unless payment is independently verified and approved.

## Email And SMS Recovery

1. Use `CommunicationEvent` rows to identify failed or duplicate sends.
2. Transactional emails take priority: order confirmation, welcome, booking confirmation, payment recovery.
3. SMS recovery must respect consent, STOP opt-out, quiet hours, reply pause, and booking pause conditions.
4. Retry one critical event first; avoid broad retries until provider status and templates are confirmed.

## 24-Hour Monitoring Checklist

Check at 15 minutes, 1 hour, 4 hours, 12 hours, and 24 hours after launch:

1. Public site and checkout routes still load.
2. Stripe dashboard has no failed webhook spike.
3. Orders created during the window have correct package/service bundles.
4. Install queue has no paid order stuck without an owner.
5. Resend has no bounce/failure spike for transactional emails.
6. Twilio has no unexpected SMS error spike or unmatched inbound reply spike.
7. Admin health and logs show no recurring provider/auth/signature failures.
8. GitHub issues are updated for any follow-up found during monitoring.

## Internal Status Template

```text
Launch/rollback status:
Release commit:
Previous known-good commit:
Start time:
Current phase:
Customer impact:
Evidence:
Action taken:
Next check:
Approval needed:
```
