# Provider Outage Runbook

Use this when Twilio, Resend, or Stripe is degraded or unavailable. This runbook is internal and does not require changing credentials, deploying code, or creating paid monitoring accounts.

## First 10 Minutes

1. Confirm the provider status page and capture the incident URL.
2. Check `/admin?tab=health`, `/admin?tab=logs`, and recent `CommunicationEvent` failures for scope.
3. Separate provider outage from app failure:
   - Provider outage: multiple failures with provider-specific errors and healthy app routes.
   - App failure: 5xx responses, auth failures, malformed payloads, or no `CommunicationEvent` records.
4. Add a short internal note to the launch log or incident thread with start time, provider, affected flows, and current mitigation.

## Twilio Down

Affected flows: inbound SMS replies, missed-call recovery, booking SMS, test SMS, voice-call webhooks.

Immediate actions:

- Pause non-critical manual SMS tests in admin.
- Use email follow-up for active lead conversations until delivery recovers.
- Watch failed `CommunicationEvent` records where `provider` is `twilio` or `channel` is `sms`.
- Do not retry large batches while the provider is still failing.

Recovery:

- Re-run only the missed critical sends from failed `CommunicationEvent` rows.
- Confirm one inbound SMS webhook and one outbound SMS send in test mode before resuming normal operations.
- Record provider incident URL, failed window, retry count, and any skipped sends.

## Resend Down

Affected flows: lead confirmations, booking confirmations, welcome emails, drip emails, weekly/monthly reports, admin notifications.

Immediate actions:

- Keep lead intake online; do not block form submission because email is degraded.
- Use admin logs to identify failed email events by `provider: resend` or `channel: email`.
- For urgent client-facing messages, draft a manual send outside the app only after Nolan approves the external message.

Recovery:

- Retry transactional emails first: welcome, booking confirmation, payment/order emails.
- Retry nurture/reporting emails only after transactional recovery is confirmed.
- Verify a single delivery/open event from Resend webhook before broad retry.

## Stripe Down

Affected flows: checkout, invoices, subscription changes, billing portal, invoice webhooks.

Immediate actions:

- Do not change Stripe keys, webhook secrets, or billing permissions during an outage.
- Check whether new checkout sessions fail or only webhook processing is delayed.
- Inspect recent `Order`, `Subscription`, and Stripe-related `CommunicationEvent` or AgentLog records.
- Avoid manual order activation unless payment is independently verified.

Recovery:

- Reconcile checkout sessions and invoices against Stripe after the incident clears.
- Confirm `checkout.session.completed`, `invoice.paid`, and `invoice.payment_failed` handlers caught up.
- For any paid order missing install initialization, run the normal admin recovery path and log the action.

## Communication Template

Internal status update format:

```text
Provider:
Start time:
Affected flows:
Current customer impact:
Mitigation:
Next check:
Incident URL:
```

## Closeout

- Confirm health dashboard is green or explain remaining degraded checks.
- Confirm no critical failed `CommunicationEvent` rows remain untriaged.
- Document which events were retried, skipped, or handled manually.
- Update the master task/work log if this revealed a recurring gap.
