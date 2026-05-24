# External Launch Blockers Runbook

Signed: Neo

This repo is ready to keep testing, but the remaining red launch rows require external account access, deployed URLs, live credentials, or stakeholder approval. Do not mark those tasks complete until the live action has been performed and evidence is captured.

## One-Command Readiness Check

Run this before attempting the remaining live tasks:

```bash
npm run launch:external-blockers
```

The command prints JSON with:

- `ready_count`
- `blocked_count`
- each blocker id
- missing or invalid environment variables
- the next operator action

It exits nonzero while any live blocker remains unresolved.

## Required Operator Inputs

| Tasks | Required Inputs | Follow-Up |
|---|---|---|
| `152`, `PL-98` | `CLIENTSURGE_HEALTHCHECK_URL` plus UptimeRobot or Better Stack access | Register the deployed healthCheck URL in the monitor account and capture the monitor id/screenshot. |
| `201`, `PL-8`, `PL-21` | `STRIPE_LIVE_SECRET_KEY`, `STRIPE_LIVE_PUBLISHABLE_KEY` | Set live Stripe keys in Base44 production environment only. |
| `202`, `PL-59` | `STRIPE_WEBHOOK_PROOF_URL`, `STRIPE_WEBHOOK_SECRET` | Configure Stripe Dashboard webhook to the production endpoint, then run `node scripts/stripe/stripe-webhook-proof.mjs`. |
| `203`, `249` | `CLIENTSURGE_LIVE_PURCHASE_URL`, `CLIENTSURGE_LIVE_TEST_EMAIL`, live card/test payment authorization | Run one real purchase on the production domain and verify Order, email, SMS, and portal state. |
| `206` | `CLIENTSURGE_PAID_CUSTOMER_EMAIL` | Verify `getStripeCustomerPortalUrl` returns a working billing portal link for a real paid customer. |
| `219` | `CLIENTSURGE_LEAD_TEST_URL` pointing to local/staging | Run `npm run load-test:leads`; the harness refuses production-looking URLs. |
| `213b`, `245`, `AC-3`, `AC-4`, `AC-15` | Twilio toll-free verification or approved A2P 10DLC campaign/sender attachment | Live test recipient is saved and webhooks are configured, but Twilio returned 30032 for the configured toll-free sender and 30034 for the Messaging Service sender. Fix Twilio registration before outbound SMS and missed-call recovery can pass. |
| `AC-5` | Resend dashboard/log access or raw Resend API key for CLI login | Resend credentials and verified `clientsurgesystems.com` domain are present in production Base44; `base44 functions list` now includes `receiveResendWebhook`, but webhook proof remains blocked until Resend delivery/webhook logs are observable and captured. |
| `PL-97` | Production `APP_URL` environment access | Verify Base44 production has `APP_URL=https://clientsurgesystems.com` or the approved canonical production domain. |
| `AC-29` | `CLIENTSURGE_SMS_VOLUME_TEST_AUTHORIZED=true` and explicit staging/Twilio approval | Simulate high-volume inbound SMS only after account owners approve the traffic. |

## Evidence To Attach Back To Tracker

For each remaining red row, capture at least one of:

- command output JSON
- dashboard screenshot
- production entity id
- Stripe event id
- Twilio message/call sid
- Resend message id
- monitor id
- written stakeholder sign-off

After evidence is captured, update `src/MASTER_TASK_LIST_560.md`, mark the row `✅`, and sign it as `Neo` with the completion date.
