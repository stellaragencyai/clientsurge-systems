# iOS App Review Notes Template — ClientSurge Systems

Use this before any TestFlight external review or App Store submission.

## Review Account / Demo Mode

- Provide an active demo account or approved demo mode.
- Demo account email:
- Demo account password:
- Demo account role:
- Client/project/demo data included:
- Features available without payments:

## Backend Status

- Web production URL: https://clientsurgesystems.com
- Base44 app ID: 69dc4a79656fdba136d413d3
- GitHub commit SHA:
- Base44 publish proof artifact:
- Checkout smoke proof:
- Client portal smoke proof:
- Account/data deletion path: https://clientsurgesystems.com/privacy#account-deletion

## Non-Obvious Features To Explain

- ClientSurge is a business automation platform for local service businesses.
- Some automation results are workflow previews or setup states, not guaranteed revenue outcomes.
- SMS/email communications require consent and include opt-out handling.
- Account and data deletion requests are available from the privacy page.
- Certain admin/internal routes are not intended for public indexing.

## Privacy Label Checklist

Review `mobile/ios-app-store-readiness.json` before submission.

Confirm App Store Connect privacy details match the current app behavior for:

- Name
- Email address
- Phone number
- Business information
- Message/support content
- Billing/purchase identifiers
- App account identifiers
- Usage analytics
- Crash/performance diagnostics
- Third-party processors
- Tracking status

## TestFlight Checklist

- Internal build tested on real iPhone.
- External TestFlight review notes are complete.
- Crash logs reviewed.
- Tester feedback reviewed.
- Login/session persistence tested.
- Logout tested.
- Account/data deletion request path tested.
- Push notification permission flow tested if push is enabled.
- SMS/email consent disclosures tested.
- Deep links tested if enabled.
- Web/Base44 production release proof attached.

## App Store Submission Checklist

- Final build is not a beta/demo placeholder.
- App metadata is accurate and complete.
- Screenshots match the actual iOS experience.
- Support URL works.
- Privacy Policy URL works.
- Terms URL works.
- Account deletion path works.
- Backend services are live for review.
- Demo account or demo mode is active.
- No unverified testimonials, live metrics, or revenue guarantees appear in screenshots or metadata.
- Reviewer notes explain anything that requires setup, external services, or admin approval.

## Source References

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Apple TestFlight: https://developer.apple.com/testflight/
- Apple Account Deletion Support: https://developer.apple.com/support/offering-account-deletion-in-your-app/
