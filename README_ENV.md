# ClientSurge Systems Environment Variables

This document lists the production environment variables the app and Base44 functions expect.

## Payments

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER_SYSTEM`
- `STRIPE_PRICE_GROWTH_SYSTEM`
- `STRIPE_PRICE_ELITE_SYSTEM`

## Messaging

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_SMS_STATUS_CALLBACK_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## AI / LLM

- `OPENAI_API_KEY`
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

## Notes

- Stripe production deploys should use live keys only.
- Twilio and Resend credentials must be set in the deployed Base44 environment, not just local dev.
- If a feature uses a vendor callback URL, the callback must point at the currently deployed Base44 function URL.
