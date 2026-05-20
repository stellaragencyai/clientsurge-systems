# ClientSurge Production Launch Preflight

Generated: 2026-05-19 22:45 America/Phoenix
Last updated: 2026-05-19 22:58 America/Phoenix

## Current Verdict

ClientSurge is code-ready for the package activation workflow, but not yet full production-launch ready.

The website and Base44 app are reachable, GitHub PR conflicts are resolved, and the first two automation readiness check passes. The remaining blockers are operational: Stripe CLI/auth setup, controlled Stripe proof, and production Base44 backend deploy limitations for the current app ID.

## Verified Ready

- Base44 hosted app responds over HTTPS:
  - `https://client-surge-systems-copy-a9653cae.base44.app` returned `200 OK`.
  - `https://clientsurgesystems.com` returned `200 OK`.
- GitHub PR #1087 is mergeable after resolving conflicts with `main`.
- Stripe-facing package mapping is aligned with the automation activation brain:
  - Starter/Basic: `instant_lead_response`, `missed_call_text_back`
  - Growth: Basic plus `nurture_sequence_14d`, `ai_booking_agent`
  - Pro: Growth plus `lead_reactivation`, `review_request`
- Base44 required core secrets are present for the first two automations:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
  - `TWILIO_WEBHOOK_KEY`
  - `TWILIO_SMS_STATUS_CALLBACK_URL`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
- Base44 Stripe base secrets are present:
  - `STRIPE_LIVE_SECRET_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
- Base44 Stripe webhook secret is present:
  - `STRIPE_WEBHOOK_SECRET`
- The 877 Twilio number is routed to the Base44 missed-call webhook with the matching `TWILIO_WEBHOOK_KEY`.

## Verification Commands Passed

- `npm run build`
- `npm run openclaw:basic-package-check`
- `node --test tests/salesCatalog.test.js tests/basicPackageActivation.test.js tests/installPipeline.test.js`

## Current Blockers

### 1. Stripe CLI Is Installed But Not Authenticated

Stripe CLI is installed:

- `stripe version 1.40.9`

But it is not configured locally:

- Missing local Stripe config at `C:\Users\nolan\.config\stripe\config.toml`

Required fix:

1. Run `stripe login`, or configure a secure Stripe API key path.
2. Confirm webhook endpoint visibility from the CLI.
3. Use the CLI only for read-only verification or controlled test-mode proof unless Nolan explicitly approves a live charge.

### 2. Production Base44 App Does Not Accept CLI Backend Deploys

The current production app ID in `base44/.app.jsonc` is:

- `69dc4a79656fdba136d413d3`

This app allows secret management, but rejects backend deploy/entity push commands:

- `base44 functions deploy ...` returns `This endpoint is only available for Backend Platform apps`.
- `base44 entities push` returns the same Backend Platform requirement.

The pre-merge CLI-linked Backend Platform app ID was:

- `69f4f3973cbf2c33a9653cae`

Required fix:

1. Decide whether production should remain on the current website app or move to the CLI-compatible Backend Platform app.
2. If staying on the current production app, publish backend/entity changes through the Base44 UI or Base44-supported production workflow.
3. If moving to the Backend Platform app, confirm domain/publish routing before switching `clientsurgesystems.com`.

### 3. Purchase-To-Onboarding Smoke Needs Production Backend Sync

After merging latest `main`, local tests pass, but the live Base44 smoke test currently fails because production backend behavior is not in sync with the branch:

- `npm run openclaw:purchase-onboarding-smoke` fails while creating/linking `ClientProject`.
- The function/entity deploy needed to refresh that path is blocked by the production app type issue above.

Required fix:

1. Publish the resolved backend/entity changes through the correct Base44 production workflow.
2. Re-run `npm run openclaw:purchase-onboarding-smoke`.
3. Only then run Stripe webhook proof.

### 4. Base44 Functions List Read-Only Check Fails

`base44 functions list` currently fails with multiple automation metadata schema errors:

Deploys still worked, but this should be treated as a launch-readiness warning because it reduces our ability to audit deployed functions from the CLI.

Required fix:

1. Identify the malformed function automation metadata in Base44.
2. Correct or remove the invalid automation metadata.
3. Re-run `base44 functions list` until it succeeds.

## Production Launch Order

1. Resolve GitHub PR conflicts and re-run local gates. Completed.
2. Restore missing `TWILIO_WEBHOOK_KEY` in production Base44. Completed.
3. Decide/fix the Base44 production backend deploy path.
4. Publish backend/entity changes through the correct Base44 production workflow.
5. Re-run purchase-to-onboarding smoke.
6. Authenticate Stripe CLI or verify Stripe through a secure API-key path.
7. Run Stripe checkout/webhook smoke test in test mode first.
8. Run one controlled production payment test only with explicit approval for amount, card, and refund/no-refund plan.
9. Confirm custom domain publish state for `clientsurgesystems.com`.
10. Run final end-to-end production launch checklist.

## Do Not Launch Until

- Stripe webhook proof passes.
- Production Base44 backend/entity deployment path is confirmed.
- Purchase-to-onboarding live smoke passes after production backend sync.
- Base44 production publish target is explicitly confirmed.
