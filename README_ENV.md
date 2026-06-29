# ClientSurge Systems Environment Variables

This document lists the production environment variables the app and Base44 functions expect.

## Payments

- `STRIPE_MODE`
  - Required. Use `live` for production and `test` only for controlled test proofing.
- `STRIPE_LIVE_SECRET_KEY`
  - Required for production checkout/webhooks. Must start with `sk_live_`.
- `STRIPE_TEST_SECRET_KEY`
  - Required for test proofing. Must start with `sk_test_`.
- `STRIPE_SECRET_KEY`
  - Legacy fallback used by some older functions. Prefer explicit live/test keys above.
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_TEST_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER_SYSTEM`
- `STRIPE_PRICE_GROWTH_SYSTEM`
- `STRIPE_PRICE_ELITE_SYSTEM`

## Analytics

- `VITE_GA4_MEASUREMENT_ID`
  - Production value: `G-H6QT342ZN9`.
- `VITE_GOOGLE_ANALYTICS_ID`
  - Optional alias. Keep aligned with `VITE_GA4_MEASUREMENT_ID` if used.
- `VITE_GA_MEASUREMENT_ID`
  - Optional alias. Keep aligned with `VITE_GA4_MEASUREMENT_ID` if used.

## Messaging

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_SMS_STATUS_CALLBACK_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## AI / LLM

- `OPENAI_API_KEY`
  - Server-side only. Required by chatBubbleAI, classifyLeadIntent, runSniperSearch, template generation, and lead magnet/website generation functions.
- `ELEVENLABS_API_KEY`

## Monitoring / Internal Ops

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `BASE44_APP_ID`
- `HEALTHCHECK_URL`

## Optional / Feature-Specific

- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- `CALENDLY_SCHEDULING_URL`

## Public Shell Notes

- `index.html` must not include duplicate GA4 measurement IDs.
- The public shell should only reference `G-H6QT342ZN9` unless a future migration intentionally changes the production property.
- The static GA4 script should include `data-ga4-measurement-id` so React can detect it and avoid duplicate installs.
- The public fallback must not expose admin, mission-control, setup, reconciliation, observability, or other internal route names.
- PWA/iOS app-shell behavior should stay disabled until there is a deliberate PWA release plan.

## Notes

- Stripe production deploys should use live keys only.
- Twilio and Resend credentials must be set in the deployed Base44 environment, not just local dev.
- OpenAI keys must never be exposed to client-side code.
- If a feature uses a vendor callback URL, the callback must point at the currently deployed Base44 function URL.
