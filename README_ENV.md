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
  - Fallback sender only. Prefer `TWILIO_MESSAGING_SERVICE_SID` for production SMS so Messaging Service add-ons apply.
- `TWILIO_MESSAGING_SERVICE_SID`
  - Production value should be the ClientSurge Production SMS - A2P Messaging Service SID.
  - Current Twilio service: `MG01671b8a8ce56066b9f36e9f50463cee`.
- `TWILIO_WEBHOOK_KEY`
  - Shared secret used on Twilio inbound/status/link-click callback URLs as `?twilio_webhook_key=...`.
- `TWILIO_LINK_CLICK_WEBHOOK_KEY`
  - Optional override for `receiveTwilioLinkClick`. If omitted, the function uses `TWILIO_WEBHOOK_KEY`.
- `TWILIO_SMS_STATUS_CALLBACK_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

### Twilio Link Click Callback

After the `receiveTwilioLinkClick` Base44 function is deployed, paste this URL into Twilio Link Shortening → Domain configuration → Click tracking callback URL:

`https://clientsurgesystems.com/api/functions/receiveTwilioLinkClick?twilio_webhook_key=YOUR_TWILIO_WEBHOOK_KEY`

The callback logs SMS link clicks into `CommunicationEvent` with `event_type=sms_link_clicked`, links the click to a WebsiteLead/Lead when possible, and updates lead engagement status.

## AI / LLM

- `OPENAI_API_KEY`
  - Server-side only. Required by chatBubbleAI, classifyLeadIntent, runSniperSearch, template generation, and lead magnet/website generation functions.
- `ELEVENLABS_API_KEY`

## Monitoring / Internal Ops

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
  - Cloudflare Worker secret for website click and visitor session alerts.
- `ALLOWED_ORIGINS`
  - Comma-separated production origins allowed to post click/session tracking events.
- `VISITOR_ALERT_ENABLED`
  - Set to `false` only for an intentional pause of Telegram visitor alerts.
- `VISITOR_ALERT_IP_ALLOWLIST`
  - Comma-separated internal IPs ignored by the Cloudflare visitor tracking Worker.
- `SESSION_FINALIZATION_BATCH_SIZE`
  - Optional inactive-session cron batch size. Default is `25`; the Worker caps it at `100`.
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
- The fallback is allowed to link only to public marketing, login, privacy, and terms routes.
- PWA/iOS app-shell behavior should stay disabled until there is a deliberate PWA release plan.
- After any public shell change, publish through Base44 and purge Cloudflare cache before judging the live domain.

## Notes

- Stripe production deploys should use live keys only.
- Twilio and Resend credentials must be set in the deployed Base44 environment, not just local dev.
- OpenAI keys must never be exposed to client-side code.
- If a feature uses a vendor callback URL, the callback must point at the currently deployed Base44 function URL.
