# ClientSurge Production Launch Preflight

Generated: 2026-05-19 22:45 America/Phoenix

## Current Verdict

ClientSurge is code-ready for the package activation workflow, but not yet full production-launch ready.

The website and Base44 app are reachable, the latest package activation work is deployed to Base44, and the purchase-to-onboarding smoke path passes. The remaining blockers are operational: Stripe webhook signing secret, Stripe CLI/auth setup, GitHub PR merge conflicts, and one Base44 CLI read-only functions-list schema issue.

## Verified Ready

- Base44 hosted app responds over HTTPS:
  - `https://client-surge-systems-copy-a9653cae.base44.app` returned `200 OK`.
  - `https://clientsurgesystems.com` returned `200 OK`.
- Latest Base44 deploys completed:
  - `createCheckoutSession` deployed successfully.
  - Site bundle deployed successfully.
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
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
- QA smoke path passed:
  - QA order created.
  - Onboarding client linked.
  - Pro package detected.
  - All six purchased service keys handed off.
  - Sam/onboarding next question generated.

## Verification Commands Passed

- `npm run build`
- `npm run openclaw:basic-package-check`
- `npm run openclaw:purchase-onboarding-smoke`
- `node --test tests/salesCatalog.test.js tests/basicPackageActivation.test.js tests/installPipeline.test.js`

## Current Blockers

### 1. Stripe Webhook Secret Missing

Base44 does not currently list `STRIPE_WEBHOOK_SECRET`.

This blocks full Stripe production proof because `base44/functions/stripeWebhookOrders/entry.ts` verifies incoming Stripe webhooks with `STRIPE_WEBHOOK_SECRET`. Without that secret, a real `checkout.session.completed` event may fail verification and not reliably initialize the install pipeline.

Required fix:

1. Create or confirm the Stripe webhook endpoint for the deployed `stripeWebhookOrders` URL.
2. Copy the endpoint signing secret from Stripe.
3. Set it in Base44 as `STRIPE_WEBHOOK_SECRET`.
4. Run a Stripe checkout/webhook smoke test.

### 2. Stripe CLI Is Installed But Not Authenticated

Stripe CLI is installed:

- `stripe version 1.40.9`

But it is not configured locally:

- Missing local Stripe config at `C:\Users\nolan\.config\stripe\config.toml`

Required fix:

1. Run `stripe login`, or configure a secure Stripe API key path.
2. Confirm webhook endpoint visibility from the CLI.
3. Use the CLI only for read-only verification or controlled test-mode proof unless Nolan explicitly approves a live charge.

### 3. GitHub PR Has Merge Conflicts

GitHub PR:

- `https://github.com/stellaragencyai/clientsurge-systems/pull/1087`

Current status:

- Branch pushed with latest package activation work.
- GitHub reports the PR as `CONFLICTING`.

Required fix:

1. Fetch latest `main`.
2. Resolve conflicts carefully.
3. Re-run build and targeted tests.
4. Push the resolved branch.

### 4. Base44 Functions List Read-Only Check Fails

`base44 functions list` currently fails with:

- `Invalid input -> at functions[40].automations[0]`

Deploys still worked, but this should be treated as a launch-readiness warning because it reduces our ability to audit deployed functions from the CLI.

Required fix:

1. Identify the malformed function automation metadata in Base44.
2. Correct or remove the invalid automation metadata.
3. Re-run `base44 functions list` until it succeeds.

## Production Launch Order

1. Resolve GitHub PR conflicts and re-run local gates.
2. Set `STRIPE_WEBHOOK_SECRET` in Base44.
3. Authenticate Stripe CLI or verify Stripe through a secure API-key path.
4. Run Stripe checkout/webhook smoke test in test mode first.
5. Run one controlled production payment test only with explicit approval for amount, card, and refund/no-refund plan.
6. Confirm custom domain publish state for `clientsurgesystems.com`.
7. Run final end-to-end production launch checklist.

## Do Not Launch Until

- Stripe webhook secret exists in Base44.
- Stripe webhook proof passes.
- PR conflicts are resolved or the live Base44 source of truth is intentionally accepted over GitHub.
- Base44 production publish target is explicitly confirmed.

