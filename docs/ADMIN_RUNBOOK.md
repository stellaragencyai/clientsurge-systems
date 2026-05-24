# ClientSurge Admin Runbook

Internal operating guide for setup, configuration, troubleshooting, escalation, and recovery. Do not paste credentials into tickets, screenshots, chat, or markdown files.

## Daily Startup

1. Open `/admin?tab=health` and confirm Stripe, Twilio, Resend, webhook, and automation checks are healthy or intentionally disabled.
2. Open `/admin?tab=logs` and scan failed `CommunicationEvent` rows from the last 24 hours.
3. Open the install queue and confirm no paid order is stuck in `Configuring`, `Testing`, or `Error` without an owner.
4. Check `AutomationJob` failures and retry only jobs with clear transient provider errors.
5. Record unresolved blockers in the launch log with owner, severity, and next check time.

## Setup Checklist

1. Confirm required environment variables are configured in Base44 settings:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `OPENAI_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
2. Confirm `/admin?tab=settings` has company defaults, business hours, booking links, sender names, and notification recipients.
3. Confirm each paid Order has canonical `install_configuration.services` for purchased services.
4. Keep services in `Testing` until provider verification succeeds and the admin install workspace allows the `Live` transition.

## Webhook Setup

### Twilio SMS

1. Configure inbound SMS webhook to the deployed `receiveTwilioInboundSms` URL.
2. Ensure the request includes `X-Twilio-Signature`.
3. Confirm `TWILIO_AUTH_TOKEN` is present server-side.
4. Send one controlled test SMS only when Nolan approves live SMS testing.
5. Verify `WebsiteLead.reply_status` changes to `responded`, automation pauses, and a `CommunicationEvent` is created.

### Twilio Calls

1. Configure voice/missed-call webhook to the deployed call webhook URL.
2. Ensure signature validation is active.
3. For missed-call testing, confirm the same `CallSid` is processed once.
4. Verify recovery sequence events appear in communication logs before marking live.

### Resend

1. Configure Resend domain authentication before production sends.
2. Configure webhook events for delivered, bounced, opened, and failed events.
3. Verify webhook signature validation.
4. Confirm delivery/bounce events update canonical `CommunicationEvent` rows.

### Stripe

1. Configure Stripe checkout and invoice webhooks to the deployed Stripe webhook URL.
2. Enable `checkout.session.completed`, `invoice.paid`, `invoice.payment_succeeded`, `invoice.payment_failed`, and subscription lifecycle events.
3. Confirm session metadata includes `order_id` and `base44_app_id`.
4. Do not change live Stripe keys or webhook secrets without explicit approval.

## Troubleshooting: No SMS Sent

1. Check whether the lead has `automation_enabled=false`, `cadence_paused=true`, `reply_status=responded`, or `booking_status=booked`.
2. Check `/admin?tab=logs` for failed SMS `CommunicationEvent` rows.
3. Check `/admin?tab=health` for Twilio degraded status or recent failures.
4. Confirm the Order service is `Testing` or `Live` and has a valid SMS template.
5. Confirm `TWILIO_PHONE_NUMBER`, `TWILIO_ACCOUNT_SID`, and `TWILIO_AUTH_TOKEN` exist in Base44 environment settings.
6. If the error is transient provider failure, retry the failed job once from the failed jobs panel.
7. If the error is auth, phone compliance, consent, missing config, or unknown, escalate before retrying.

## Troubleshooting: Email Failed Or Bounced

1. Check `CommunicationEvent` rows with `provider=resend` or `channel=email`.
2. Confirm sender domain authentication in Resend.
3. Confirm the recipient email is present and syntactically valid.
4. For bounced addresses, do not retry until the address is corrected.
5. For 429 or 5xx provider errors, retry after the documented backoff window.

## Troubleshooting: Stripe Billing Issue

1. Match the Order by `stripe_session_id`, `stripe_subscription_id`, or metadata `order_id`.
2. Confirm `payment_status`, `billing_status`, and `subscription_status` are aligned.
3. For `invoice.payment_failed`, confirm the Order is marked `past_due`.
4. Use hosted invoice/payment update URLs only from Stripe responses.
5. Never manually activate an unpaid Order unless payment is independently verified and approved.

## Manual Lead Reassignment

1. Open `/admin?tab=logs` or the unmatched SMS modal.
2. Review phone number, message body, timestamp, and source provider ID.
3. Search candidate leads by normalized phone and recent lead activity.
4. Assign only when there is a clear match.
5. Log the reassignment with old lead ID, new lead ID, provider message ID, and operator.
6. Leave ambiguous messages unmatched and escalate with the exact candidates.

## Performance Tuning

1. Keep paginated admin views below 50 visible rows by default.
2. Prefer server-side filtering for `CommunicationEvent`, `WebsiteLead`, and Order-heavy views.
3. Watch p95 webhook processing time after bulk SMS reply tests.
4. Avoid retrying large failed batches during active provider incidents.
5. Use cached dashboards for summary cards where real-time precision is not required.

## Backup And Restore

Use `docs/DATA_BACKUP_STRATEGY.md` for the full Base44 entity backup cadence, monthly Google Sheets archive format, verification checklist, and restore-drill process.

1. Before bulk imports or large admin mutations, export affected Leads, Orders, and CommunicationEvents.
2. Preserve provider IDs: `MessageSid`, `CallSid`, Stripe event ID, invoice ID, and session ID.
3. Restore by creating compensating records or targeted updates, not broad overwrite scripts.
4. After restore, verify a small sample in admin views and communication logs.
5. Record the restore reason, affected entity IDs, operator, and verification result.

## Escalation

Escalate before action when the fix involves:

- Live Stripe keys, webhook secrets, billing permissions, or real card tests.
- Real outbound SMS, calls, or production customer emails.
- Security posture, admin auth, permissions, or public monitoring accounts.
- Spending money, deleting records, or public/client-facing communication.

Use this handoff format:

```text
Issue:
Severity:
Affected flows:
Evidence:
Recommended action:
Approval needed:
Next check:
```

## Closeout

1. Confirm health dashboard status is healthy or explain remaining degraded checks.
2. Confirm failed jobs are retried, parked, or escalated.
3. Confirm no ambiguous manual reassignment remains hidden.
4. Update the relevant GitHub issue, task checklist, or launch log with evidence.
