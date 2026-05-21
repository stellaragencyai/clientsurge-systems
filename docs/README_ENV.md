# Environment Variables — ClientSurge Systems
**#216** | Author: Agent Smith | May 8, 2026

All environment variables required for production. Set via Base44 → Settings → Environment Variables.

For pre-launch QA, use `docs/STAGING_ENVIRONMENT.md` and the Base44 test database / test workspace. Do not point staging tests at production customer records, live Stripe charges, or real customer SMS/email recipients.

## Required (system won't function without these)

| Variable | Used By | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe webhooks, subscription mgmt | Live secret key (sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | stripePaymentWebhook, stripeInvoiceHandlers | Webhook signing secret (whsec_...) |
| `RESEND_API_KEY` | All email functions | Resend API key (re_...) |
| `TWILIO_ACCOUNT_SID` | SMS functions | Twilio account SID (AC...) |
| `TWILIO_AUTH_TOKEN` | SMS functions | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | SMS send | Provisioned Twilio number (+1...) |
| `OPENAI_API_KEY` | AI generation functions | OpenAI secret key (sk-...) |
| `TELEGRAM_BOT_TOKEN` | All Telegram alerts | Bot token from @BotFather |

## Optional / Feature-specific

| Variable | Used By | Description |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | discoverLeads, lead enrichment | Maps Places API key |
| `RETELL_API_KEY` | triggerOutboundCall | Retell AI voice agent key |
| `ELEVENLABS_API_KEY` | voice clone generation | ElevenLabs API key |
| `APOLLO_API_KEY` | Apollo lead enrichment | Apollo.io API key |

## Notes
- Never commit secret keys to source control
- All `sk_live_` keys must be kept server-side only — run `python3 scripts/scanSecretKeyExposure.py` to verify
- Stripe test keys (`sk_test_`) are safe for staging only
- Staging must use test-mode provider credentials, test-safe recipients, and the Base44 test database / test workspace
- Twilio messaging service SID must have A2P 10DLC brand registered before SMS goes live
