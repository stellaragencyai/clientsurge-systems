# Area 14 — Mobile App UX, Push, Device Behavior, Offline, and Session Handling

## Scope

This area covers mobile-app behavior after the iOS build/readiness work from Area 13 and the App Store/security work from Area 15. It focuses on the user experience inside a smartphone app or Base44 mobile wrapper: navigation, sessions, offline handling, notifications, app links, keyboard behavior, and release smoke proof.

This work is intentionally section-removal safe. Future marketing sections can be removed or reorganized without invalidating this audit, because the checks are based on canonical routes and app states rather than specific marketing sections.

## What changed

- Updated `public/sw.js` to cache and serve `/offline.html` for offline navigation fallback.
- Added `public/offline.html` as a mobile-safe offline page with retry and support actions.
- Added `mobile/mobile-app-behavior-readiness.json`.
- Added `docs/MOBILE_APP_UX_DEVICE_BEHAVIOR_CHECKLIST.md`.
- Added `scripts/audit-area14-mobile-behavior.mjs`.
- Added `tests/area14MobileAppBehavior.test.js`.
- Added this Area 14 audit report.

## 10 flaws / risks addressed

1. Offline navigation fallback could fall back to `/` without a clear offline explanation.
2. There was no dedicated offline page for mobile app users.
3. Offline state did not clearly explain that dashboards, setup status, checkout, messaging, and client portal require a connection.
4. Offline state did not provide both retry and support actions.
5. There was no machine-readable Area 14 behavior manifest for mobile UX, sessions, app links, notifications, keyboard, and release proof.
6. There was no explicit rule that mobile behavior checks must survive future removal of marketing sections.
7. Push/notification readiness did not have a repo-side rule requiring opt-in, value explanation, preference path, and non-blocking denial behavior before enablement.
8. App-link behavior did not have a repo-side requirement for email/text/client portal/setup status links and fallback to web.
9. Session behavior did not have a repo-side smoke requirement for app restart persistence, logout clearing, and expired-session redirect behavior.
10. There was no Area 14 regression test preventing mobile behavior readiness and offline fallback guardrails from being removed later.

## Files changed

- `public/sw.js`
- `public/offline.html`
- `mobile/mobile-app-behavior-readiness.json`
- `docs/MOBILE_APP_UX_DEVICE_BEHAVIOR_CHECKLIST.md`
- `scripts/audit-area14-mobile-behavior.mjs`
- `tests/area14MobileAppBehavior.test.js`
- `docs/AREA_14_MOBILE_APP_UX_DEVICE_BEHAVIOR_AUDIT.md`

## How to run

```bash
node scripts/audit-area14-mobile-behavior.mjs --write
node --test tests/area14MobileAppBehavior.test.js
```

The `--write` option creates:

```text
tmp/area14-mobile-behavior-audit.json
```

## Canonical routes/states to test

- `/`
- `/pricing`
- `/contact`
- `/client-portal`
- `/setup/status`
- `/privacy#account-deletion`
- `/offline.html`
- logged-in session
- logged-out session
- expired session
- offline navigation
- poor connection

## Operator rule

Do not enable push notifications, app-link campaigns, or customer-facing mobile app release claims unless:

- user value is explained before prompting,
- permission denial does not block core app usage,
- preferences/support path exists,
- real-device smoke tests pass,
- offline behavior is acceptable,
- Base44 production proof exists if the mobile app depends on live web runtime,
- screenshots and metadata remain truthful.

## Production/Base44/iOS note

This PR improves repo-side mobile behavior and web offline fallback. It does not prove Base44 publish completion, iOS TestFlight upload, or push notification provider readiness. Those still require Area 12 release artifacts and later real-device/TestFlight evidence.
