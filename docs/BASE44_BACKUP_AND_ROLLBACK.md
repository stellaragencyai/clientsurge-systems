# Base44 Backup And Rollback Runbook

Owner: ClientSurge Systems
Last updated: 2026-05-21
Signed: Neo

## Monthly Data Backup

1. Export paid `Order`, `Client`, `ClientProject`, `WebsiteLead`, `CommunicationEvent`, `AutomationJob`, `Reports`, and `Files` records from Base44.
2. Store the export in the private operations drive under `ClientSurge Backups/YYYY-MM`.
3. Name files with the entity and export date, for example `Order-2026-05-21.csv`.
4. Confirm each export opens, has headers, and contains more than zero rows unless the entity is intentionally empty.
5. Record completion in the launch log with the operator name, timestamp, and export location.

## Go-Live Rollback

1. Pause new ad traffic and hide launch CTAs if checkout or lead capture is failing.
2. Switch Stripe checkout back to test mode only after confirming no live customer is mid-checkout.
3. Disable scheduled lead follow-up automations before modifying Twilio or Resend webhooks.
4. Restore the last known-good Base44 deployment from the editor history.
5. Re-run the critical smoke path: homepage loads, lead capture creates `WebsiteLead`, checkout creates `Order`, Stripe webhook updates payment status, setup email sends, and admin notification fires.
6. Monitor `CommunicationEvent`, `AutomationJob`, Stripe webhook logs, Twilio logs, and Resend logs for 24 hours after rollback.

## Recovery Priorities

1. Preserve lead capture and checkout data first.
2. Keep paid-client setup status accurate.
3. Restore outbound SMS/email after webhook and consent checks are confirmed.
4. Re-enable non-critical visuals, analytics, and conversion experiments last.
