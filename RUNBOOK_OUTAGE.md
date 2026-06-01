# ClientSurge Systems Outage Runbook

## Twilio Outage

1. Confirm Twilio status page and recent delivery failures.
2. Pause non-critical outbound SMS automations if retry noise is rising.
3. Check `CommunicationEvent` failure volume and recent provider responses.
4. Notify operators that inbound replies and missed-call recovery may be delayed.
5. Resume automations after provider health returns.

## Resend Outage

1. Confirm Resend status and API response codes.
2. Check `CommunicationEvent` failures for email sends and webhooks.
3. Pause non-critical campaigns if retries are saturating queues.
4. Keep transactional sends queued for retry where possible.
5. Re-run failed transactional sends once delivery recovers.

## Stripe Outage

1. Confirm Stripe status and recent webhook or checkout failures.
2. Verify `createCheckoutSession` responses and `stripeWebhookOrders` delivery status.
3. Stop promoting paid checkout if sessions cannot be created.
4. Inspect `CommunicationEvent` and order/payment error logs for failed event handling.
5. Reconcile any delayed checkout or webhook events once Stripe recovers.

## Base44 / Deploy Outage

1. Confirm latest deploy status in Base44.
2. Verify critical functions are reachable:
   - `createCheckoutSession`
   - `stripeWebhookOrders`
   - `getClientPortalContext`
   - `webhookLeadCapture`
3. Check for stale frontend asset hashes versus the current local build.
4. Re-publish app and functions if production is serving an old build.

## Immediate Escalation Checklist

1. Capture the failing endpoint, timestamp, and affected customer flow.
2. Post the incident summary to the operator channel.
3. Preserve raw provider error payloads before retrying.
4. Re-test the affected path end to end after mitigation.
