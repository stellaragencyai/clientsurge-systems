# GA4 Setup Guide - ClientSurge Systems

ClientSurge production GA4 uses Measurement ID `G-H6QT342ZN9`.

## Canonical Flow

1. Store `GA4_API_SECRET` in Base44 backend secrets only.
2. Optionally store `GA4_MEASUREMENT_ID=G-H6QT342ZN9` in backend secrets or environment.
3. Open Admin Settings -> Analytics.
4. Click **Repair and verify GA4**.
5. The UI calls `setupGA4Configuration`, then `verifyGA4Configuration`.
6. `setup_status` becomes `active` only after entity integrity, backend secret availability, Measurement Protocol debug validation, real `ga4_verification` delivery, production-site health, and static deployed-code assertions pass.

## Browser Tag

Do not add a static GA4 script to `index.html`.

The React app installs GA4 once through `src/lib/ga4.js` with Consent Mode v2 defaults and `send_page_view: false`. React Router navigation emits explicit SPA `page_view` events.

## Canonical Events

Tracked events:

- `page_view`
- `scroll`
- `scroll_depth`
- `cta_click`
- `pricing_view`
- `link_click`
- `form_submit_attempt`
- `form_submit`
- `generate_lead`
- `contact_form_submit`
- `audit_request_started`
- `audit_request_submitted`
- `begin_checkout`
- `purchase`
- `purchase_client_confirmation`
- `demo_booked`
- `onboarding_complete`

GA4 key events:

- `generate_lead`
- `begin_checkout`
- `purchase`
- `demo_booked`

`purchase` is reserved for the server-verified Stripe webhook. Browser order-confirmation pages may emit `purchase_client_confirmation`, which must not be marked as a key event.

## Secret Rules

Never store `GA4_API_SECRET` or any API secret in `GA4Configuration`, frontend code, logs, notes, or documentation examples. Verification evidence should include only safe metadata such as the verification ID, timestamp, production-domain result, and Measurement Protocol statuses.
