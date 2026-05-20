# ClientSurge Production Launch Preflight

Generated: 2026-05-19 22:45 America/Phoenix
Last updated: 2026-05-19 23:56 America/Phoenix

## Current Verdict

ClientSurge is code-ready for the package activation workflow, but not yet full production-launch ready.

The website and Base44 app are reachable, GitHub PR conflicts are resolved, Base44 UI publish completed successfully, the first two automation readiness check passes, and Stripe CLI is authenticated. The remaining blockers are operational: live Stripe catalog alignment, controlled Stripe proof, and production Base44 backend deploy limitations for the current app ID.

## Verified Ready

- Base44 hosted app responds over HTTPS:
  - `https://client-surge-systems-copy-a9653cae.base44.app` returned `200 OK`.
  - `https://clientsurgesystems.com` returned `200 OK`.
  - `https://grinning-apex-flow-growth.base44.app` returned `200 OK`.
- Base44 production UI publish completed with success message: `Your app is published and live online!`
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
- Stripe CLI is authenticated to the live ClientSurge Systems account:
  - Account ID: `acct_1TSOFVBVGjsISdG0`
  - Test and live CLI keys are available locally until `2026-08-18`.

## Verification Commands Passed

- `npm run build`
- `npm run openclaw:basic-package-check`
- `node --test tests/salesCatalog.test.js tests/basicPackageActivation.test.js tests/installPipeline.test.js`
- Direct production `ClientProject` schema smoke via `base44 exec` with `client_email`, `client_name`, and `business_name`

## Current Blockers

### 1. Live Stripe Catalog Must Be Aligned With App Checkout Code

Stripe CLI is now installed and authenticated, but the first read-only Stripe audit found a catalog mismatch:

- Test mode has no products, prices, or webhook endpoints.
- Live mode has three package products:
  - `ClientSurge Systems — Starter`
  - `ClientSurge Systems — Growth`
  - `ClientSurge Systems — Elite`
- Live mode has package-level setup and monthly prices for those three packages.
- The current app checkout catalog still references older individual-service Stripe product/price IDs such as `prod_UNi5...` and `price_1TOwfi...`.

Required fix:

1. Decide whether checkout should use the current live package products/prices or recreate the old individual-service products/prices in Stripe.
2. Recommended path: update app checkout to use the current live package products/prices, while internally expanding the package into the correct automation service keys.
3. Mirror the live package products/prices into Stripe test mode so test-mode checkout can be proven without live charges.
4. Re-run a test-mode checkout/webhook proof.

### 2. Stripe Webhook Endpoint URL Needs Canonical Review

Live Stripe currently has one enabled webhook endpoint:

- `https://grinning-apex-flow-growth.base44.app/api/functions/stripePaymentWebhook`

The code/docs also reference `stripeWebhookOrders` as the canonical post-payment order handler. Before live payment proof, confirm whether `stripePaymentWebhook` is the intended wrapper/alias or whether the live endpoint should move to the canonical `stripeWebhookOrders` URL.

### 3. Production Base44 App Does Not Accept CLI Backend Deploys

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

### 4. Purchase-To-Onboarding Smoke Needs Production Backend Function Sync

After merging latest `main` and publishing the production app through the Base44 UI, local tests pass and the live domain is reachable, but the live Base44 smoke test still fails because the deployed `installPipeline` function behavior is not in sync with the branch:

- `npm run openclaw:purchase-onboarding-smoke` fails while creating/linking `ClientProject`.
- Failure details: `Error in field client_email: Field required` and `Error in field client_name: Field required`.
- A direct `ClientProject.create` smoke with `client_email`, `client_name`, and `business_name` succeeds, so the production entity schema itself is valid.
- The likely issue is the deployed production `installPipeline` function still creating/updating `ClientProject` using older field names or stale code.
- The function deploy needed to refresh that path is blocked by the production app type issue above.

Required fix:

1. Publish the resolved `installPipeline` backend changes through the correct Base44 production workflow.
2. Re-run `npm run openclaw:purchase-onboarding-smoke`.
3. Only then run Stripe webhook proof.

### 5. Base44 Functions List Read-Only Check Fails

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
6. Align the app checkout catalog with live Stripe package products/prices.
7. Mirror package products/prices in Stripe test mode.
8. Run Stripe checkout/webhook smoke test in test mode first.
9. Run one controlled production payment test only with explicit approval for amount, card, and refund/no-refund plan.
10. Confirm custom domain publish state for `clientsurgesystems.com`.
11. Run final end-to-end production launch checklist.

## Do Not Launch Until

- Stripe webhook proof passes.
- App checkout catalog matches the live Stripe package products/prices.
- Production Base44 backend/entity deployment path is confirmed.
- Purchase-to-onboarding live smoke passes after production backend sync.
- Base44 production publish target is explicitly confirmed.
