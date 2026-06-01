# ClientSurge Systems - Environment Variables Reference

All production secrets are managed in Base44 Dashboard -> Settings -> Environment Variables.
Never commit real secret values to source control.

---

## Required Production Secrets

| Variable | Description | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe secret key. | Use `sk_live_...` in production and `sk_test_...` only in staging/local. |
| `STRIPE_LIVE_SECRET_KEY` | Optional explicit live Stripe key override. | Some billing paths prefer this before `STRIPE_SECRET_KEY`. |
| `STRIPE_PUBLISHABLE_KEY` | Client-side Stripe publishable key. | Use the matching `pk_live_...` or `pk_test_...` key for the environment. |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret. | Required for the canonical Stripe webhook endpoint. |
| `RESEND_API_KEY` | Resend API key. | Required for email sends and email health checks. |
| `RESEND_FROM_EMAIL` | Verified sender email. | Must be on a verified Resend domain before production launch. |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID. | Required for SMS and voice workflows. |
| `TWILIO_AUTH_TOKEN` | Twilio auth token. | Required for Twilio API calls and webhook signature validation. |
| `TWILIO_PHONE_NUMBER` | Twilio outbound phone number in E.164 format. | Must be registered for US commercial SMS before launch. |
| `APP_URL` | Public production app URL. | Production must be `https://clientsurgesystems.com`; localhost is local-only. |
| `ADMIN_EMAIL` | Primary admin email. | Used as fallback reply-to / admin recipient. |
| `ADMIN_NOTIFICATION_EMAIL` | Admin alert recipient. | Used by lead/order/digest/credentials alerts. |
| `AUTOMATION_SHARED_SECRET` | Shared secret for internal automation endpoints. | Use a random high-entropy value. |

---

## Webhooks And Provider Validation

| Variable | Description | Notes |
|---|---|---|
| `STRIPE_TEST_WEBHOOK_SECRET` | Stripe test-mode webhook signing secret. | Staging/test only. |
| `RESEND_WEBHOOK_SECRET` | Resend webhook signing secret. | Used by Resend webhook/event tracking handlers. |
| `TWILIO_SMS_STATUS_CALLBACK_URL` | Twilio message delivery callback URL. | Points to `receiveTwilioSmsStatusCallback`. |
| `TWILIO_WEBHOOK_KEY` | Shared key for Twilio webhook callback URLs where configured. | Do not expose publicly beyond provider configuration. |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for internal alerts. | External send behavior still requires operator approval when live. |
| `TELEGRAM_NOLAN_ID` | Telegram recipient/chat ID for internal alerts. | Store as config, not in source. |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for voice features. | Optional unless voice workflows are enabled. |
| `ELEVENLABS_WEBHOOK_SECRET` | ElevenLabs post-call webhook secret. | Optional unless ElevenLabs webhooks are enabled. |

---

## Feature-Specific Server Config

| Variable | Description | Notes |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key for AI generation/checks. | Server-side only. |
| `GOOGLE_MAPS_API_KEY` | Google Maps/Places key for `discoverLeads`. | If missing, lead discovery returns a clear 503. |
| `DEFAULT_BOOKING_LINK` | Fallback booking URL. | Used by booking/follow-up workflows. |
| `DEFAULT_BUSINESS_NAME` | Fallback business name in templates. | Defaults in code should not be treated as production configuration. |
| `ADMIN_NOTIFICATION_PHONE` | Admin phone for voice/SMS notification workflows. | E.164 format. |
| `CLIENTSURGE_CHECKOUT_CAPACITY_LIMIT` | Optional checkout capacity gate. | Leave unset for no capacity cap. |
| `STRIPE_PACKAGE_PRICE_OVERRIDES_JSON` | Optional package Stripe ID override map. | Staging/test only; each package override must include product, setup price, and monthly price IDs or checkout fails closed. Do not set in production. |
| `EXTERNAL_WEBHOOK_URL` | Optional outbound CRM/automation webhook target. | External delivery should be configured deliberately. |
| `WEBHOOK_URL` | Legacy/fallback outbound webhook target. | Prefer `EXTERNAL_WEBHOOK_URL` for new setup. |
| `N8N_WEBHOOK_URL` | Optional n8n onboarding webhook target. | Used by client onboarding access flow when configured. |
| `GITHUB_TOKEN` | Optional GitHub token for task sync tooling. | Keep scoped and server-side. |
| `BASE44_APP_ID` | Base44 app identifier. | Auto-injected by Base44 in hosted environments. |
| `APP_BASE_URL` | Optional app base URL for generated assets/sitemap. | Prefer `APP_URL` unless a function specifically needs this. |
| `SITE_URL` | Optional sitemap site URL override. | Used by sitemap generation. |

---

## Client-Side Public Variables

These are public build-time variables. They are not secrets.

| Variable | Description | Notes |
|---|---|---|
| `VITE_BASE44_APP_ID` | Base44 frontend app ID. | Used by `src/lib/app-params.js`. |
| `VITE_BASE44_APP_BASE_URL` | Base44 frontend/backend base URL. | Used by app params and sitemap helpers. |
| `VITE_BASE44_FUNCTIONS_VERSION` | Optional functions version selector. | Used when Base44 passes versioned function context. |
| `VITE_GA4_MEASUREMENT_ID` | GA4 web stream measurement ID. | Preferred analytics variable, e.g. `G-XXXXXXXXXX`. |
| `VITE_GOOGLE_ANALYTICS_ID` | Legacy GA4 measurement alias. | Supported fallback. |
| `VITE_GA_MEASUREMENT_ID` | Legacy GA4 measurement alias. | Supported fallback. |

---

## Local Verification Variables

These are for local scripts and should not be required in Base44 production unless explicitly needed.

| Variable | Used By | Description |
|---|---|---|
| `CLIENTSURGE_ADMIN_LOAD_LEADS` | `scripts/verify-admin-load-budget.mjs` | Synthetic lead count for admin load-budget checks. |
| `CLIENTSURGE_ADMIN_LOAD_BUDGET_MS` | `scripts/verify-admin-load-budget.mjs` | Local performance budget in milliseconds. |
| `CLIENTSURGE_AUTOMATION_NUMBER` | `scripts/openclaw/basic-package-activation-check.mjs` | Expected Twilio number for local validation. |
| `CLIENTSURGE_BASE44_HOST` | `scripts/openclaw/basic-package-activation-check.mjs` | Expected Base44 host for local validation. |
| `CLIENTSURGE_TWILIO_WEBHOOK_FUNCTION` | `scripts/openclaw/basic-package-activation-check.mjs` | Expected Twilio webhook function path. |
| `CLIENTSURGE_LOAD_TEST_SELF_TEST` | `scripts/load-test-lead-submissions.mjs` | Enables loopback self-test mode. |
| `CLIENTSURGE_LEAD_TEST_URL` | `scripts/load-test-lead-submissions.mjs` | Target URL for lead load tests. |
| `CLIENTSURGE_LOAD_TEST_CONCURRENCY` | `scripts/load-test-lead-submissions.mjs` | Lead load-test concurrency. |
| `CLIENTSURGE_LOAD_TEST_TIMEOUT_MS` | `scripts/load-test-lead-submissions.mjs` | Lead load-test timeout. |

---

## Switching To Live Mode

1. Set Stripe live keys: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`.
2. Confirm `APP_URL=https://clientsurgesystems.com`.
3. Confirm Resend domain authentication and `RESEND_FROM_EMAIL`.
4. Confirm Twilio number ownership, SMS webhook URLs, and A2P 10DLC registration.
5. Confirm `OPENAI_API_KEY`, provider keys, webhook secrets, and admin notification targets are production-safe.
6. Run the launch readiness checks without exposing secret values.

---

## Local Development

For local dev, create a `.env.local` file and never commit it:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=test@yourdomain.com
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
APP_URL=http://localhost:5173
ADMIN_EMAIL=you@example.com
VITE_BASE44_APP_ID=...
VITE_BASE44_APP_BASE_URL=...
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

`APP_URL=http://localhost:5173` is local development only. Do not use localhost values in the Base44 production environment.

Production APP_URL must be `https://clientsurgesystems.com`.
