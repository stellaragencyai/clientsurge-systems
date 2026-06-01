# ClientSurge Launch Execution Packet - 2026-05-22

Prepared: 2026-05-22 05:22 America/Phoenix
Last checked: 2026-05-22 07:38 America/Phoenix

## Current Verdict

ClientSurge is locally code-ready for the package checkout / activation path, and the production purchase-to-onboarding handoff has now passed. Production launch is still blocked by provider/payment proof gates:

1. Staging/test Base44 must use Stripe test-mode package IDs before checkout proof.
2. Stripe checkout/webhook proof must pass before any live payment proof.

Do not run live payment, SMS, email, DNS, or production publish actions from this packet without explicit approval for the exact action.

Latest continuation check: the local Base44 CLI is linked to app `69dc4a79656fdba136d413d3`, which is the known production app ID. Do not set `STRIPE_PACKAGE_PRICE_OVERRIDES_JSON` through this linked CLI context unless the target is explicitly changed to a staging/test app; otherwise production checkout could be pointed at Stripe test-mode package IDs.

## Evidence Already In Hand

- Local checkout catalog defaults to live Starter/Growth/Elite Stripe package IDs.
- Staging can override package Stripe IDs with `STRIPE_PACKAGE_PRICE_OVERRIDES_JSON`.
- Override parsing fails closed for malformed JSON or partial package definitions.
- Stripe test mode has Starter/Growth/Elite package products and setup/monthly prices.
- Base44 remote function auditability is restored: `base44 functions list` returns 237 functions.
- Base44 production app ID remains `69dc4a79656fdba136d413d3`.
- Current production app still needs a confirmed backend/entity publish workflow because earlier Backend Platform deploy commands were rejected for this app type.

## Safe Read-Only Checks Completed In This Pass

```text
git status --short --branch
base44 --help
base44 functions --help
base44 deploy --help
base44 entities --help
base44 site --help
base44 secrets --help
base44 functions list
base44 secrets list
```

Observed Base44 secret names include the live Stripe/Twilio/Resend/OpenAI names plus `STRIPE_TEST_WEBHOOK_SECRET`, but the staging package override itself has not been set from this pass.

2026-05-22 07:06 check: `base44/.app.jsonc` points at production app `69dc4a79656fdba136d413d3`; no Base44 secrets or production config were changed. Local gates still pass: `node --test tests/salesCatalog.test.js` passed 12/12, `npm run test:deno` passed 21/21, and `git diff --check` passed with line-ending warnings only. A deliberate global local `STRIPE_PACKAGE_PRICE_OVERRIDES_JSON` run makes one live-default admin-summary assertion fail because that test expects live package IDs; the dedicated override test still passes.

2026-05-22 07:38 check: `npm run openclaw:purchase-onboarding-smoke -- --json` passed 7/7 production handoff checks. The smoke runner now enables cleanup by default; it created temporary QA Order, OnboardingClient, ClientProject, Client, and CommunicationEvent records, then deleted all eight created records successfully.

## Required Staging Secret Values

Set these only in the intended staging/test Base44 environment:

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=<test webhook secret or Stripe CLI forwarding secret>
STRIPE_PACKAGE_PRICE_OVERRIDES_JSON={"starter_system":{"stripe_product_id":"prod_UYhtwNW8eVqQdI","setup_price_id":"price_1TZaTKBVGjsISdG0FYZuolxJ","monthly_price_id":"price_1TZaTLBVGjsISdG0dj7Y62fu"},"growth_system":{"stripe_product_id":"prod_UYhtW1TiATAaSS","setup_price_id":"price_1TZaTLBVGjsISdG0OLeOUdAH","monthly_price_id":"price_1TZaTMBVGjsISdG0FlG2VVWG"},"elite_system":{"stripe_product_id":"prod_UYhtICcoNgWC9d","setup_price_id":"price_1TZaTMBVGjsISdG0TtdrSHRP","monthly_price_id":"price_1TZaTNBVGjsISdG0t7w5I7gM"}}
```

`STRIPE_PACKAGE_PRICE_OVERRIDES_JSON` is not a secret by itself, but it is environment-routing config. Do not set it on production unless intentionally forcing production checkout to test-mode Stripe IDs.

## Next Approval-Sensitive Step

Recommended approval language:

```text
Approved: configure the intended staging/test Base44 environment for Stripe test-mode checkout proof by setting STRIPE_SECRET_KEY to the existing Stripe test key, STRIPE_WEBHOOK_SECRET to the existing Stripe test webhook secret, and STRIPE_PACKAGE_PRICE_OVERRIDES_JSON to the documented test package IDs. No live charges, no production publish, no live Stripe catalog edits, no Twilio/Resend sends.
```

After that is approved and configured in a confirmed staging/test Base44 target:

1. Run a test-mode package checkout session for Starter first.
2. Verify `checkout.session.completed` reaches `stripePaymentWebhook`.
3. Confirm the handler delegates into the canonical order webhook flow.
4. Confirm the expected test Order/install records are created in the intended test workspace.
5. Record Stripe event/session IDs and Base44 record IDs in `docs/production-launch-preflight-2026-05-19.md`.

## Production Hold Line

Production launch remains blocked until:

- The Base44 backend/entity publish path is confirmed for the current app-editor production app, or production is intentionally moved to a CLI-compatible Backend Platform app.
- `installPipeline` backend freshness is proven after publish. Completed for current deployed behavior on 2026-05-22.
- Purchase-to-onboarding smoke passes. Completed with cleanup-safe QA records on 2026-05-22.
- Stripe test-mode checkout/webhook proof passes.
- Nolan explicitly approves one controlled live payment proof with package, amount, card owner, test contact details, and refund/no-refund plan.
