# iOS App Review Notes Template — ClientSurge Systems

Use this before any TestFlight external review or App Store submission.

## Build Identity

- App name: ClientSurge Systems
- Bundle ID: `com.clientsurgesystems.app`
- SKU: `clientsurge-systems-ios`
- Marketing version:
- iOS build number:
- TestFlight build ID:
- Apple Developer Team ID:
- Signing/provisioning status:
- Build identity checklist reviewed: `mobile/ios-build-readiness.json`

## Review Account / Demo Mode

- Demo account or demo mode is active.
- Demo email:
- Demo password:
- Demo role:
- Demo data included:

## Backend Status

- Web production URL: https://clientsurgesystems.com
- Base44 app ID: 69dc4a79656fdba136d413d3
- GitHub commit SHA:
- Base44 publish proof artifact:
- Checkout smoke proof:
- Client portal smoke proof:
- Account/data deletion path works: https://clientsurgesystems.com/privacy#account-deletion

## Non-Obvious Features

- ClientSurge is a business automation platform for local service businesses.
- Workflow previews and setup states are not guaranteed revenue outcomes.
- SMS/email communications require consent and include opt-out handling.
- Admin/internal routes are not intended for public indexing.
- iOS build depends on the live ClientSurge/Base44 runtime unless a future fully native build path replaces it.

## Privacy Label Checklist

Review `mobile/ios-app-store-readiness.json` before submission.

Confirm App Store Connect privacy details match app behavior for name, email, phone, business info, messages, billing identifiers, account identifiers, analytics, diagnostics, processors, and tracking status.

## TestFlight Checklist

- Internal build tested on real iPhone.
- Build number is unique for this upload.
- Build identity matches `mobile/ios-build-readiness.json`.
- External review notes are complete.
- Crash logs reviewed.
- Tester feedback reviewed.
- Login/session persistence tested.
- Logout tested.
- Push notification permission flow tested if push is enabled.
- SMS/email consent disclosures tested.
- Web/Base44 production proof attached.

## App Store Submission Checklist

- Final build is not a beta placeholder.
- App metadata is accurate and complete.
- Screenshots match the actual iOS experience.
- Support URL works.
- Privacy Policy URL works.
- Terms URL works.
- Backend services are live for review.
- No unverified testimonials, live metrics, or revenue guarantees appear in screenshots or metadata.

## Source References

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Apple TestFlight: https://developer.apple.com/testflight/
- Apple Account Deletion Support: https://developer.apple.com/support/offering-account-deletion-in-your-app/
