# ClientSurge Production Launch Preflight

Generated: 2026-05-19 22:45 America/Phoenix
Last updated: 2026-05-22 07:06 America/Phoenix

## Current Verdict

ClientSurge is code-ready for the package activation workflow, but not yet full production-launch ready.

The website and Base44 app are reachable, GitHub PR conflicts are resolved, Base44 UI publish completed successfully, the first two automation readiness check passes, and Stripe CLI is authenticated. The checkout source is now locally aligned to the live Stripe package catalog, Stripe test-mode package catalog resources exist, and the Stripe webhook URL has been verified as a legacy wrapper that delegates to the canonical order webhook handler. The remaining blockers are operational: configure/deploy the staging checkout price overrides in a confirmed staging/test Base44 target, run controlled Stripe proof, and resolve production Base44 backend deploy limitations for the current app ID.

Approval packet for the remaining live-provider gates: `docs/live-provider-approval-packet-2026-05-21.md`.

## Verified Ready

- Base44 hosted app responds over HTTPS:
  - `https://client-surge-systems-copy-a9653cae.base44.app` returned `200 OK`.
  - `https://clientsurgesystems.com` returned `200 OK`.
  - `https://grinning-apex-flow-growth.base44.app` returned `200 OK`.
- Base44 production UI publish completed with success message: `Your app is published and live online!`
- GitHub PR #1087 is mergeable after resolving conflicts with `main`.
- GitHub PR #1087 remains open, non-draft, and mergeable as of the 2026-05-20 morning check.
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
- Local checkout code now uses the live Stripe package products/prices:
  - Starter product `prod_UReWMpnZsCnfcL`
    - setup `price_1TSlDWBVGjsISdG0SyoWzAm3`
    - monthly `price_1TSlDWBVGjsISdG0Ej1O16ov`
  - Growth product `prod_UReWhZsWks1HuA`
    - setup `price_1TSlDXBVGjsISdG0eTWcARLM`
    - monthly `price_1TSlDXBVGjsISdG0X9unS4Qf`
  - Elite product `prod_UReW1LmsVbn4BZ`
    - setup `price_1TSlDYBVGjsISdG0l2rHzet1`
    - monthly `price_1TSlDXBVGjsISdG0Abdx85z3`
- Live Stripe webhook endpoint currently points to `stripePaymentWebhook`, and local source confirms that function delegates to the canonical `stripeWebhookOrders` shared handler.
- Test-mode Stripe now has package products, setup/monthly prices, and one enabled webhook endpoint. Safe app-path checkout proof now requires setting `STRIPE_PACKAGE_PRICE_OVERRIDES_JSON` in the staging/test Base44 environment before invoking checkout.

## Verification Commands Passed

- `npm run build`
- `npm run openclaw:basic-package-check`
- `node --test tests/salesCatalog.test.js tests/basicPackageActivation.test.js tests/installPipeline.test.js`
- Post-alignment targeted tests: `node --test tests/salesCatalog.test.js tests/basicPackageActivation.test.js tests/installPipeline.test.js` passed 42/42 on 2026-05-20.
- `base44 functions list` now succeeds as of 2026-05-22 04:27 America/Phoenix after repairing the invalid scheduled automation `repeat_interval` metadata for `monthlyClientReport`, `generateWeeklyReport`, and `generateSocialContent`.
- Direct production `ClientProject` schema smoke via `base44 exec` with `client_email`, `client_name`, and `business_name`

## Current Blockers

### 1. Live Stripe Catalog Alignment Must Be Deployed And Proven

Stripe CLI is now installed and authenticated, but the first read-only Stripe audit found a catalog mismatch:

- Test mode has package products, prices, and one enabled webhook endpoint as of the 2026-05-21 Gate A follow-up.
- Live mode has three package products:
  - `ClientSurge Systems — Starter`
  - `ClientSurge Systems — Growth`
  - `ClientSurge Systems — Elite`
- Live mode has package-level setup and monthly prices for those three packages.
- Previous app checkout code referenced older individual-service Stripe product/price IDs such as `prod_UNi5...` and `price_1TOwfi...`.
- Local source now maps Starter/Growth/Elite checkout line items to the live package-level Stripe prices while preserving internal per-automation order/service tracking.
- Add-on checkout is intentionally blocked until live Stripe add-on/package prices exist, so the app cannot accidentally create Checkout Sessions with stale individual-service price IDs.

Required fix:

1. Deploy/publish the updated checkout source through the correct Base44 production workflow.
2. Set `STRIPE_PACKAGE_PRICE_OVERRIDES_JSON` in the staging/test Base44 environment so checkout uses Stripe test-mode package resources.
3. Re-run a test-mode checkout/webhook proof.
4. Run one controlled production payment proof only with explicit approval for amount, card, and refund/no-refund plan.

### 2. Stripe Test-Mode Proof Requires Staging Checkout Overrides

Live Stripe must use the canonical custom-domain webhook endpoint:

- **Canonical custom-domain endpoint (use this in Stripe Dashboard):** `https://clientsurgesystems.com/api/functions/stripeWebhookOrders`
- ⚠️ **WARNING:** The Stripe Dashboard webhook endpoint **must** point to the custom-domain URL above. Do **not** use the Base44 preview/testing URL as the active Stripe Dashboard endpoint.
- Base44 hostname (testing/fallback only — **never** use as the live Stripe Dashboard endpoint): `https://grinning-apex-flow-growth.base44.app/api/functions/stripePaymentWebhook`
- Required events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`.

Local source confirms `stripePaymentWebhook` is a legacy compatibility wrapper that delegates to the same canonical shared handler used by `stripeWebhookOrders`. Stripe test mode now has package products/prices and a webhook endpoint. The remaining Stripe blocker is making the app checkout path use the test-mode package IDs in a staging/test Base44 environment before completing the test checkout.

Required fix:

1. Configure `STRIPE_PACKAGE_PRICE_OVERRIDES_JSON` in a confirmed staging/test Base44 environment. Do not set it through the currently linked CLI context while `base44/.app.jsonc` points at production app `69dc4a79656fdba136d413d3`.
2. Confirm `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` point at test-mode values for that environment.
3. Run test-mode checkout/webhook proof before any live payment proof.

### 3. Production Base44 App Does Not Accept CLI Backend Deploys

The current production app ID in `base44/.app.jsonc` is:

- `69dc4a79656fdba136d413d3`

This app allows secret management, but rejects backend deploy/entity push commands:

- `base44 functions deploy ...` returns `This endpoint is only available for Backend Platform apps`.
- `base44 entities push` returns the same Backend Platform requirement.

Base44 CLI docs describe CLI projects as backend-service projects and note that projects created with the CLI are not currently integrated with the Base44 app editor. This matches the observed split: the current production app-editor ID can be published through the UI/site flow, while backend deploy/list commands require a Backend Platform app.

The pre-merge CLI-linked Backend Platform app ID was:

- `69f4f3973cbf2c33a9653cae`

Required fix:

1. Decide whether production should remain on the current website app or move to the CLI-compatible Backend Platform app.
2. If staying on the current production app, publish backend/entity changes through the Base44 UI or Base44-supported production workflow.
3. If moving to the Backend Platform app, confirm domain/publish routing before switching `clientsurgesystems.com`.

### 4. Purchase-To-Onboarding Smoke Needs Production Backend Function Sync

After merging latest `main` and publishing the production app through the Base44 UI, local tests pass and the live domain is reachable. The earlier live Base44 smoke failure has now been cleared by a controlled rerun:

- 2026-05-22 07:38 America/Phoenix: `npm run openclaw:purchase-onboarding-smoke -- --json` passed 7/7 checks against the linked production app.
- Proof IDs created during the smoke: Order `6a106a65868ec828ad8106e1`, OnboardingClient `6a106a69a427e01420e64336`, ClientProject `6a106a67a165bea451854b3c`, Client `6a106a67675fe7e39cd8a8c6`.
- Cleanup completed in the same run: 4 CommunicationEvent records plus the temporary OnboardingClient, ClientProject, Order, and Client were deleted successfully.
- The deployed production `installPipeline` now proves the full Order -> Client -> ClientProject -> OnboardingClient handoff for the package activation path.

Remaining hold:

1. Do not run live payment proof yet.
2. Configure/test the staging Stripe checkout path first, or explicitly approve one controlled live payment proof with package, amount, card owner, test contact details, and refund/no-refund plan.
3. Keep the Base44 production publish path documented because future backend/entity changes still need an explicit workflow.

### 5. Base44 Functions List Read-Only Check Restored

`base44 functions list` previously failed with multiple automation metadata schema errors.

Resolved on 2026-05-22:

- Repaired only invalid scheduled automation interval metadata.
- `base44 functions list` completed and listed 237 remote functions.
- Raw authenticated backend-functions read confirmed the affected functions no longer have null simple-schedule intervals.

## Production Launch Order

1. Resolve GitHub PR conflicts and re-run local gates. Completed.
2. Restore missing `TWILIO_WEBHOOK_KEY` in production Base44. Completed.
3. Approve Stripe test-mode catalog setup and test-mode checkout/webhook proof only. Completed approval.
4. Mirror package products/prices in Stripe test mode. Completed.
5. Restore Base44 CLI function-list auditability. Completed.
6. Configure staging checkout price overrides and run Stripe checkout/webhook smoke test in test mode first.
7. Decide/fix the Base44 production backend deploy path.
8. Publish backend/entity changes through the correct Base44 production workflow only after approval.
9. Re-run purchase-to-onboarding smoke. Completed 2026-05-22 with cleanup-safe QA records.
10. Deploy the locally aligned app checkout catalog that now uses live Stripe package products/prices.
11. Run one controlled production payment test only with explicit approval for amount, card, and refund/no-refund plan.
12. Confirm custom domain publish state for `clientsurgesystems.com`.
13. Run final end-to-end production launch checklist.

## Staging Requirement

Use `docs/STAGING_ENVIRONMENT.md` before production launch proof. All pre-launch checkout, activation, SMS, email, and provider proof should run through local fixtures, the Base44 test database / test workspace, Stripe test mode, and test-safe Twilio/Resend paths before any production publish or live customer-facing action.

## Rollback And 24-Hour Monitoring

Before any production launch window, use `docs/POST_LAUNCH_ROLLBACK_PLAN.md` as the operator rollback plan. It defines the go-live proof order, rollback triggers, Stripe/email/SMS recovery steps, and 15-minute/1-hour/4-hour/12-hour/24-hour monitoring checks.

## Do Not Launch Until

- Stripe webhook proof passes.
- The locally aligned checkout catalog is deployed and proven against Stripe.
- Production Base44 backend/entity deployment path is confirmed.
- Purchase-to-onboarding live smoke passes after production backend sync. Completed 2026-05-22 with cleanup-safe QA records.
- Base44 production publish target is explicitly confirmed.