# ClientSurge Launch Hardening Audit — 2026-06-28

## Context

The app was reverted to a previous working Base44 version after the custom domain and editor preview were stuck loading. The current goal is to keep the stable rollback alive while removing launch blockers one at a time.

## Current confirmed state

- Base44 app id: `69dc4a79656fdba136d413d3`.
- Domain: `clientsurgesystems.com`.
- Root and `www` DNS have reached Base44/Render enough to return content.
- Base44 AdminSettings shows Twilio, Resend, and webhooks enabled.
- Base44 GA4Configuration shows production measurement id `G-H6QT342ZN9`, enabled, status `active`.
- `ConversionTrackingEvent` has recent homepage `page_view` and `form_submit` records.
- `WebsiteLead` records exist, and several have initial response timestamps.
- `CommunicationLog` shows Twilio and Resend send attempts, including delivered proof and some Twilio failures that need review.
- `Order` records exist with paid and pending statuses.

## Immediate GitHub changes made on branch `launch-hardening-audit`

1. `src/lib/ga4.js`
   - Changed the default GA4 fallback id from `G-XRYMZ1M31K` to `G-H6QT342ZN9` so React-side analytics matches the active Base44 GA4 configuration.

2. `src/main.jsx`
   - Stopped registering the service worker during launch hardening.
   - Unregisters existing service workers on load to prevent stale cached app shells from surviving rollback/publish events.

3. `README_ENV.md`
   - Added explicit production/test Stripe mode requirements.
   - Added analytics environment variable requirements and canonical production GA4 id.
   - Documented that `OPENAI_API_KEY` is server-side only and required by AI functions.
   - Added public shell rules for single GA4 property, duplicate install prevention, public-safe fallback, disabled PWA/iOS behavior, and Cloudflare purge after publish.

4. `index.html`
   - Removed the duplicate hardcoded GA4 property and kept only `G-H6QT342ZN9`.
   - Added `data-ga4-measurement-id` to the static GA4 script so the React GA4 installer can detect the existing script and avoid duplicate page views.
   - Removed PWA/iOS app shell meta and manifest tags from the public shell.
   - Replaced the large static route-directory fallback with a public-safe marketing fallback that excludes internal/admin routes.
   - Confirmed fallback links are limited to public marketing, login, privacy, and terms routes.
   - Kept the React/Vite entry script intact: `/src/main.jsx`.

## Remaining P0 launch blockers

1. Public app shell
   - Confirm the full React homepage loads, not only static fallback content.
   - Confirm Base44 no longer exposes internal page-directory output on the public domain.

2. Analytics
   - Confirm page view, CTA click, pricing view, checkout click, and form submit events appear in GA4 and Base44 `ConversionTrackingEvent`.
   - Confirm only `G-H6QT342ZN9` receives new production events.

3. Stripe checkout
   - Verify package price IDs in `src/lib/salesCatalog.js` match actual Stripe products/prices.
   - Verify `createCheckoutSession` creates a Stripe Checkout session for Starter, Growth, and Pro.
   - Verify success URL lands on `/order-success` and writes the paid order state after webhook processing.

4. Lead capture
   - Verify public forms create `WebsiteLead` or canonical `Leads` records.
   - Verify initial response email and SMS fire only for eligible leads.
   - Verify test/internal leads are not sent real customer-style outreach.

5. Messaging/webhooks
   - Verify Twilio SMS inbound URL: `https://clientsurgesystems.com/functions/receiveTwilioInboundSms`.
   - Verify Twilio voice URL: `https://clientsurgesystems.com/functions/receiveInboundVoiceCall`.
   - Review recent Twilio error code `30032` and the missing `params['to']` error in historical logs.

## Remaining P1/P2 launch hardening

- Validate `/`, `/pricing`, `/store`, `/automations`, `/contact`, `/product-signup`, `/order-success`, `/login`, and `/admin` manually.
- Confirm mobile scroll, nav close, checkout modal/sidebar, and forms do not lock body scroll.
- Confirm Cloudflare cache is purged after final publish.
- Confirm only one production analytics property is active.

## Recommendation

Do not merge broad UI/theme/publish changes directly to `main` until the branch is verified in Base44 preview. Keep fixes small, publish one batch, then verify the domain, app preview, GA4, Stripe checkout, and lead capture before moving to the next batch.
