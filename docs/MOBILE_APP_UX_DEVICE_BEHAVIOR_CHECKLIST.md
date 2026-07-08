# Mobile App UX and Device Behavior Checklist — ClientSurge Systems

Use this checklist before a mobile app build is considered ready for TestFlight users or customers.

## 1. Removable Section Safety

Future marketing sections may be removed or reorganized. Area 14 mobile behavior should not depend on any specific public marketing section remaining in place.

Validate behavior through canonical paths and app states instead:

- `/`
- `/pricing`
- `/contact`
- `/client-portal`
- `/setup/status`
- `/privacy#account-deletion`
- `/offline.html`

## 2. Mobile Navigation

- Safe-area top and bottom layout checked on iPhone.
- Back button behavior checked from public pages and authenticated pages.
- Bottom action bar does not overlap forms or CTAs.
- Tap targets are at least 44px where interactive.
- Focus states remain visible.
- Private routes stay noindex and route through auth when needed.

## 3. Session Behavior

- Login persists after app close/reopen.
- Logout clears the session and returns to public flow.
- Expired sessions route back to login without a blank screen.
- Client portal opens only for authorized users.
- Admin-heavy flows may remain desktop-preferred if clearly labeled.

## 4. Offline and Poor Connection

- Service worker caches `/offline.html`.
- Navigation fallback shows a clear offline page.
- Offline page includes Retry and Contact Support actions.
- Checkout, messaging, dashboards, and setup status are treated as network-required features.
- Poor connection does not leave users on an infinite spinner.

## 5. Notifications

Push notifications should remain disabled until there is a product decision and provider plan.

Before enabling notifications:

- Explain the value before prompting.
- Require user opt-in.
- Provide a preferences path.
- Do not block core app usage if permission is denied.
- Confirm App Store privacy disclosures are updated.

## 6. App Links

- Email links open the right route.
- Text links open the right route.
- Client portal links work for authorized users.
- Setup status links work for customers.
- App-unavailable fallback opens the web route.

## 7. Forms and Keyboard

- iOS keyboard does not hide critical errors or submit buttons.
- Input zoom prevention remains active.
- Autocomplete works for email, phone, and account fields.
- Form errors are clear and visible.
- File/photo upload behavior is reviewed if enabled later.

## 8. Release Proof

Record the following for every mobile behavior smoke run:

- GitHub commit SHA.
- Base44 publish proof artifact.
- iOS build number when applicable.
- Device model and iOS version.
- Offline smoke result.
- Session smoke result.
- App link smoke result.
- Notification setting status.
