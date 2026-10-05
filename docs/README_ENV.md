# Environment Variables - ClientSurge Systems
**#216** | Updated: 2026-05-21

Production variables are set in Base44 -> Settings -> Environment Variables. This file is the operator-facing checklist; `src/README_ENV.md` is the developer reference. Never paste real secret values into source control.

For pre-launch QA, use `docs/STAGING_ENVIRONMENT.md` and the Base44 test database / test workspace. Do not point staging tests at production customer records, live Stripe charges, or real customer SMS/email recipients.

## Required Production Secrets

| Variable | Used By | Description |
|---|---|---|
| `STRIPE_MODE` | Stripe checkout, billing, customer portal, health checks | Required explicit mode: `live` for launch, `test` for staging/local. |
| `STRIPE_LIVE_SECRET_KEY` | Stripe live checkout, billing, customer portal | Required live server-side Stripe key (`sk_live_...`) when `STRIPE_MODE=live`; keep server-side only. |
| `STRIPE_TEST_SECRET_KEY` | Stripe test checkout, billing, customer portal | Preferred test server-side key (`sk_test_...`) when `STRIPE_MODE=test`. |
| `STRIPE_SECRET_KEY` | Legacy/local Stripe fallback | Supported only as a local/test fallback. Do not rely on this for production live mode. |
| `STRIPE_PUBLISHABLE_KEY` | Stripe frontend checkout | Matching public Stripe key (`pk_live_...`). |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook handlers | Canonical webhook signing secret (`whsec_...`). |
| `RESEND_API_KEY` | Email functions and health checks | Resend API key (`re_...`). |
| `RESEND_FROM_EMAIL` | Email functions | Verified sender on an authenticated Resend domain. |
| `RESEND_FROM_LEADS` | Website lead confirmations, campaign sender fallback | Verified sender for public lead/audit confirmations. |
| `RESEND_REPLY_TO_LEADS` | Lead confirmations and admin alerts | Monitored reply-to inbox for lead replies. |
| `TWILIO_ACCOUNT_SID` | SMS/voice functions | Twilio account SID (`AC...`). |
| `TWILIO_AUTH_TOKEN` | SMS/voice functions and webhook validation | Twilio auth token. |
| `TWILIO_PHONE_NUMBER` | SMS/voice sends | Provisioned Twilio number in E.164 format. |
| `APP_URL` | Customer/admin links | Production URL: `https://clientsurgesystems.com`. |
| `ADMIN_EMAIL` | Admin notifications and reply-to fallback | Primary admin email. |
| `ADMIN_NOTIFICATION_EMAIL` | Alerts, digests, credential notices | Operational alert recipient. |
| `AUTOMATION_SHARED_SECRET` | Internal automation endpoints | Random high-entropy shared secret. |
| `EMAIL_DELIVERABILITY_PROOF_STATUS` | Direct/campaign email send gates | Must be `verified`, `passed`, or `production_verified` before non-test direct or campaign sends. |
| `EMAIL_CAMPAIGN_ENABLED` | `sendEmailCampaign` | Must be `true` before campaign sends; keep `false` until DNS/provider/unsubscribe/suppression proof is complete. |

## Webhook / Provider Secrets

| Variable | Used By | Description |
|---|---|---|
| `STRIPE_TEST_WEBHOOK_SECRET` | Stripe test webhooks | Staging/test-only signing secret. |
| `RESEND_WEBHOOK_SECRET` | Resend webhook/event tracking | Resend webhook signing secret. |
| `TWILIO_SMS_STATUS_CALLBACK_URL` | Twilio delivery tracking | Callback URL for `receiveTwilioSmsStatusCallback`. |
| `TWILIO_WEBHOOK_KEY` | Twilio webhook URLs | Optional shared callback key. |
| `TELEGRAM_BOT_TOKEN` | Internal Telegram alerts | Bot token for internal alerting functions. |
| `TELEGRAM_CHAT_ID` | Website click/session-tracking Worker | Telegram recipient/chat ID for the Cloudflare click and visitor session alert Worker. Store as a Worker secret and redact in reports. |
| `TELEGRAM_NOLAN_ID` | Internal Telegram alerts | Recipient/chat ID for internal alerting. |
| `ALLOWED_ORIGINS` | Website click/session-tracking Worker | Comma-separated origins allowed to post click and session events; production should be limited to `https://clientsurgesystems.com` and `https://www.clientsurgesystems.com`. |
| `TRACKING_SHARED_SECRET` | Website click-tracking Worker | Optional secret required by the diagnostic Telegram test endpoint. Do not expose to browser code. |
| `VISITOR_ALERT_ENABLED` | Website click/session-tracking Worker | Set to `false` only for an intentional pause of production click and session alerts. D1 session storage still accepts events. |
| `VISITOR_ALERT_IP_ALLOWLIST` | Website click/session-tracking Worker | Comma-separated internal IPs that should be ignored by visitor alerts and session capture. |
| `SESSION_FINALIZATION_BATCH_SIZE` | Website session-tracking Worker | Optional cron batch size for finalizing inactive sessions after 60 seconds without heartbeat; defaults to `25`, capped at `100`. |
| `ELEVENLABS_API_KEY` | Voice workflows | ElevenLabs API key. |
| `ELEVENLABS_WEBHOOK_SECRET` | ElevenLabs post-call webhook | Webhook validation secret. |

## Feature-Specific / Optional

| Variable | Used By | Description |
|---|---|---|
| `OPENAI_API_KEY` | AI generation and launch checks | Server-side OpenAI key. |
| `GOOGLE_MAPS_API_KEY` | discoverLeads, lead enrichment | Maps Places API key; missing key returns a clear 503. |
| `DEFAULT_BOOKING_LINK` | Booking and follow-up templates | Fallback scheduling URL. |
| `DEFAULT_BUSINESS_NAME` | SMS/email templates | Fallback business name. |
| `ADMIN_NOTIFICATION_PHONE` | Voice briefing / admin SMS paths | Admin phone in E.164 format. |
| `TEST_EMAIL_RECIPIENT` | Safe email test harness | Single approved test inbox only. Do not set to a customer or prospect recipient. |
| `EMAIL_TEST_MODE` | Safe email test harness and direct safe-test sends | Must be `true` for local safe test sends; keep `false` in ordinary production operation. |
| `CLIENTSURGE_CHECKOUT_CAPACITY_LIMIT` | Checkout capacity guard | Optional numeric capacity cap. |
| `STRIPE_PACKAGE_PRICE_OVERRIDES_JSON` | Staging Stripe checkout proof | Optional staging/test-only JSON map for package product/setup/monthly test price IDs. Each package override must include product, setup price, and monthly price IDs or checkout fails closed. Do not set in production. |
| `EXTERNAL_WEBHOOK_URL` | CRM / automation handoff | Preferred outbound webhook target. |
| `WEBHOOK_URL` | Legacy webhook handoff | Legacy fallback outbound webhook target. |
| `N8N_WEBHOOK_URL` | Client onboarding handoff | Optional n8n webhook target. |
| `GITHUB_TOKEN` | Task sync tooling | Optional scoped GitHub token. |
| `BASE44_APP_ID` | Base44 hosted functions | Base44 app identifier, normally platform-injected. |
| `APP_BASE_URL` | Sitemap/generated URLs | Optional generated URL base. |
| `SITE_URL` | Sitemap generation | Optional sitemap URL override. |

## Public Frontend Variables

These are public build-time values and must not contain secrets.

| Variable | Used By | Description |
|---|---|---|
| `VITE_BASE44_APP_ID` | Frontend Base44 params | Public Base44 app ID. |
| `VITE_BASE44_APP_BASE_URL` | Frontend Base44 params | Public Base44 app/backend base URL. |
| `VITE_BASE44_FUNCTIONS_VERSION` | Frontend Base44 params | Optional functions version selector. |
| `VITE_GA4_MEASUREMENT_ID` | Frontend analytics | Preferred GA4 measurement ID (`G-...`). |
| `VITE_GOOGLE_ANALYTICS_ID` | Frontend analytics | Legacy GA4 alias. |
| `VITE_GA_MEASUREMENT_ID` | Frontend analytics | Legacy GA4 alias. |

## Local Script Variables

| Variable | Used By | Description |
|---|---|---|
| `CLIENTSURGE_ADMIN_LOAD_LEADS` | Admin load-budget script | Synthetic lead count. |
| `CLIENTSURGE_ADMIN_LOAD_BUDGET_MS` | Admin load-budget script | Budget in milliseconds. |
| `CLIENTSURGE_AUTOMATION_NUMBER` | OpenClaw basic package check | Expected Twilio number. |
| `CLIENTSURGE_BASE44_HOST` | OpenClaw basic package check | Expected Base44 host. |
| `CLIENTSURGE_TWILIO_WEBHOOK_FUNCTION` | OpenClaw basic package check | Expected Twilio webhook function. |
| `CLIENTSURGE_LOAD_TEST_SELF_TEST` | Lead load-test script | Enables loopback self-test. |
| `CLIENTSURGE_LEAD_TEST_URL` | Lead load-test script | Target URL. |
| `CLIENTSURGE_LOAD_TEST_CONCURRENCY` | Lead load-test script | Concurrency value. |
| `CLIENTSURGE_LOAD_TEST_TIMEOUT_MS` | Lead load-test script | Timeout in milliseconds. |

## Notes

- Never commit secret keys to source control.
- Production `APP_URL` must be `https://clientsurgesystems.com`; localhost values are local development only.
- Server-side keys such as `sk_live_`, `re_`, `AC...` tokens, and API keys must not appear in frontend code.
- Stripe test keys (`sk_test_`) are staging/local only.
- Staging must use test-mode provider credentials, test-safe recipients, and the Base44 test database / test workspace.
- Twilio must have A2P 10DLC registration before production SMS goes live.
- Live provider configuration changes require explicit operator approval.
