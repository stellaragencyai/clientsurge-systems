# ClientSurge Staging Environment

Use this runbook for all pre-launch QA that needs realistic app behavior without touching live clients, live payments, or production messaging.

## Current Verdict

ClientSurge does not treat production as the default test surface. Pre-launch testing must run against one of these safe targets:

1. Local app with mocked or fixture-backed data.
2. Base44 test database / test workspace.
3. Stripe test mode, Resend test-safe recipients, and Twilio test credentials or approved sandbox numbers.

Production Base44, live Stripe, real SMS, real customer email, DNS, security permissions, and provider credentials remain approval-sensitive.

## Staging Targets

| Layer | Staging Target | Production Boundary |
|---|---|---|
| Frontend | Local Vite server or Base44 preview URL | Do not publish to `clientsurgesystems.com` for QA-only changes. |
| Database | Base44 test database / test workspace records | Do not seed, mutate, or delete production customer records for pre-launch QA. |
| Stripe | Stripe test mode package catalog and webhook proof | Do not run live charges without explicit payment-proof approval. |
| Email | Preview mode, test inboxes, or Resend sandbox-safe recipients | Do not send customer-facing production campaigns while testing. |
| SMS / Voice | Twilio test credentials, sandbox, or explicitly approved test numbers | Do not send real customer SMS/calls during staging tests. |
| Monitoring | Local logs, Base44 test logs, and dry-run reports | Do not enable paid/live monitoring or alert routing without approval. |

## Required Staging Configuration

Create a staging `.env.local` or Base44 test environment with non-production values:

```text
VITE_BASE44_APP_ID=<base44 test app id>
VITE_BASE44_APP_BASE_URL=<base44 test/preview app url>
APP_URL=<staging or local url>
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... from test-mode webhook or Stripe CLI forwarding
STRIPE_PACKAGE_PRICE_OVERRIDES_JSON={"starter_system":{"stripe_product_id":"prod_UYhtwNW8eVqQdI","setup_price_id":"price_1TZaTKBVGjsISdG0FYZuolxJ","monthly_price_id":"price_1TZaTLBVGjsISdG0dj7Y62fu"},"growth_system":{"stripe_product_id":"prod_UYhtW1TiATAaSS","setup_price_id":"price_1TZaTLBVGjsISdG0OLeOUdAH","monthly_price_id":"price_1TZaTMBVGjsISdG0FlG2VVWG"},"elite_system":{"stripe_product_id":"prod_UYhtICcoNgWC9d","setup_price_id":"price_1TZaTMBVGjsISdG0TtdrSHRP","monthly_price_id":"price_1TZaTNBVGjsISdG0t7w5I7gM"}}
RESEND_API_KEY=<test-safe key or restricted key>
RESEND_FROM_EMAIL=<verified test sender>
TWILIO_ACCOUNT_SID=<test/sandbox account sid>
TWILIO_AUTH_TOKEN=<test/sandbox auth token>
TWILIO_PHONE_NUMBER=<test/sandbox number>
OPENAI_API_KEY=<restricted project key for staging>
TELEGRAM_BOT_TOKEN=<test bot token, if Telegram staging alerts are enabled>
```

Never commit actual values. Use Base44 environment settings or local ignored env files.

`STRIPE_PACKAGE_PRICE_OVERRIDES_JSON` contains Stripe resource IDs, not secrets. Use it only in staging/test environments so checkout sessions point at Stripe test-mode prices while production keeps the live catalog IDs baked into the default source catalog. Each package override must include `stripe_product_id`, `setup_price_id`, and `monthly_price_id`; malformed JSON or partial package overrides fail closed instead of mixing test and live Stripe IDs.

## QA Data Rules

- Prefix staging records with `QA`, `STAGING`, or `TEST`.
- Use disposable internal test emails only when the email provider allows it.
- Use Nolan-approved test phone numbers only.
- Keep `preview_only`, `dry_run`, `persist_records: false`, or cleanup options enabled unless the test explicitly requires durable staging data.
- Delete or archive test records only inside the test workspace/database.

## Pre-Launch Test Order

1. Run local source gates: `npm run lint`, `node --test`, and `npm run build`.
2. Run route and UI checks locally or in Base44 preview.
3. Run package activation smoke against Base44 test database records.
4. Run Stripe test-mode checkout and webhook proof.
5. Run Resend preview/test-recipient proof.
6. Run Twilio sandbox/test-number webhook proof.
7. Record results in the launch preflight doc before any production publish or live provider proof.

## Promotion Gate

Only promote from staging to production when:

- GitHub `main` contains the exact commit tested.
- Base44 test database smoke passes.
- Stripe test-mode checkout/webhook proof passes.
- Resend/Twilio tests used test-safe recipients or approved test numbers.
- `docs/POST_LAUNCH_ROLLBACK_PLAN.md` is current for the intended launch window.
- Nolan explicitly approves production publish, live payment proof, live SMS/email proof, or credential/routing changes.

## Known Current Gap

Base44 production backend deploy/audit path is still documented separately in `docs/base44-production-deploy-path-2026-05-20.md`. Until that is resolved, staging can validate source behavior and test-database workflows, but it cannot prove production backend freshness by itself.
