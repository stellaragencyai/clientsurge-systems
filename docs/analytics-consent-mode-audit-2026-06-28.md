# Analytics + Consent Mode Audit — 2026-06-28

## Verdict

Do not mark analytics/privacy launch-ready yet. The repo has partial cookie consent and GA4 support, but it was not Consent Mode v2 complete before this audit.

## Evidence found

- `src/components/CookieConsent.jsx` exists and persists a legacy `cs_cookie_consent` value.
- `src/components/landing/CookieConsent.jsx` exists and avoids overlap with the mobile call bar.
- `src/lib/ga4.js` exists and installs GA4, but before this audit it only handled `analytics_storage` and `ad_storage`.
- `src/App.jsx` imports `installGa4()` and initializes analytics on app load.
- Base44 app data shows GA4Configuration active for `G-H6QT342ZN9` and recent ConversionTrackingEvent records for page view, CTA click, and pricing view.

## Patch applied in GitHub

- Hardened `src/lib/ga4.js` for Consent Mode v2 defaults.
- Default measurement ID is now `G-H6QT342ZN9` instead of the old fallback.
- Consent default now includes:
  - `analytics_storage`
  - `ad_storage`
  - `ad_user_data`
  - `ad_personalization`
- Consent default is denied unless stored consent exists.
- GA4 config now uses `send_page_view: false` to reduce duplicate page view risk because the app separately tracks conversion events.

## Still missing / not proven

- Cookie banner still needs the full UI upgrade: Accept All, Reject Non-Essential, Manage Preferences.
- Need production proof that Consent Mode v2 updates are received in Google Tag Assistant.
- Need Google-side internal traffic rules.
- Need Google-side unwanted referral exclusions for Stripe checkout/customer portal domains.
- Need Google-side cross-domain configuration for:
  - `clientsurgesystems.com`
  - `www.clientsurgesystems.com`
  - `checkout.clientsurgesystems.com` if verified in Stripe
- Need Stripe dashboard proof for custom checkout domain verification.
- Need Resend dashboard proof for sender/domain authentication.
- Need production proof events for form submit, checkout click, demo booking, and paid purchase/order success.

## Do not check off yet

Do not check off Asana tasks for SMS consent, Stripe domain verification, internal traffic, referral exclusions, cross-domain tracking, or launch readiness until runtime proof exists.
