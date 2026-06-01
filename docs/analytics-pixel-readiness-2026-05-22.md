# ClientSurge Analytics And Pixel Readiness - 2026-05-22

Purpose: document the launch tracking state by name only. This does not install pixels, change provider accounts, edit secrets, or modify production config.

## Current Code Readiness

GA4 support is present in the frontend:

- `src/lib/ga4.js` installs the GA4 script when a valid measurement ID is available.
- Supported env names are `VITE_GA4_MEASUREMENT_ID`, `VITE_GOOGLE_ANALYTICS_ID`, and `VITE_GA_MEASUREMENT_ID`.
- `src/App.jsx` calls `installGa4()` when the public React app mounts.
- `src/components/landing/CookieConsent.jsx` stores consent in `cookie-consent` and calls `updateGa4Consent()` on accept/decline/dismiss.
- `src/lib/analytics.js` supports generic `cta_click` events through `trackCTA()`.
- `src/utils/analytics.js` includes named GA4 event helpers for `purchase`, `demo_booked`, `lead_submitted`, and `cta_click`.
- `src/utils/ga4Events.js` includes additional helpers for `begin_checkout`, `purchase`, `generate_lead`, `demo_booked`, `contact_form_submit`, and `onboarding_complete`.

## Environment Readiness

Known launch requirement:

- Production Base44/Vite environment needs one valid GA4 web stream measurement ID using `VITE_GA4_MEASUREMENT_ID` or one of the legacy aliases.

Not confirmed locally:

- Whether the deployed production app has a real GA4 measurement ID set.
- Whether the GA4 property/web stream exists and belongs to the final production domain.
- Whether Search Console property access exists for the final domain.
- Whether Meta Pixel should be installed before the first paid Meta test.
- Whether Google Ads conversion tracking should be installed before the first paid search test.

## Paid Traffic Hold Line

Do not launch paid traffic until Nolan approves:

- platform and budget
- audience and geography
- destination page
- final creative/copy
- final production-domain URLs
- analytics/pixel decision
- provider proof language, so ads do not overstate operational readiness

## Recommended Launch Tracking Order

1. Confirm the final production domain.
2. Confirm GA4 property and web stream ownership.
3. Set `VITE_GA4_MEASUREMENT_ID` in the deployed environment.
4. Load the deployed site, accept cookies, and verify the GA4 script loads.
5. Test `cta_click`, `lead_submitted`, `demo_booked`, and checkout intent events.
6. Add Search Console property and submit the updated sitemap after deployment.
7. Decide whether Meta Pixel is needed before paid Meta launch.
8. Decide whether Google Ads conversion tags are needed before paid search launch.

## Proof Needed Before Calling Tracking Complete

- Deployed page source or browser devtools confirms GA4 script with the correct `G-...` ID.
- GA4 DebugView or Realtime shows a page view after consent.
- At least one CTA click event appears.
- At least one lead/demo test event appears from a non-production or approved test submission.
- Search Console sitemap submission is accepted for the final domain.
- Paid pixels/tags are either installed and verified or explicitly deferred.

## Current Status

Tracking is code-ready but not production-proven. The next action is an approval-sensitive environment/account confirmation, not a code patch.
