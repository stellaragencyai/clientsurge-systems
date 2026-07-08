# iOS TestFlight Build Checklist — ClientSurge Systems

Use this checklist before creating or uploading an iOS/TestFlight build from Base44 or any iOS wrapper/export path.

## 1. Build Identity

- App name: ClientSurge Systems
- Bundle ID: `com.clientsurgesystems.app`
- SKU: `clientsurge-systems-ios`
- Marketing version: `1.0.0` initially, then semantic versioning.
- Build number: unique per TestFlight upload.
- Apple Developer Team ID: record before signing.
- Signing certificate: valid before upload.
- Provisioning profile: valid before upload.

## 2. Source Version Proof

Record these together for every build:

- GitHub commit SHA.
- Base44 app ID: `69dc4a79656fdba136d413d3`.
- Base44 publish proof artifact from Area 12.
- Production URL smoke result.
- iOS build number.
- TestFlight build ID.

Do not treat a GitHub merge as proof that the iOS app is ready. The iOS build depends on both the committed source and the live Base44/runtime state.

## 3. Required Assets

- App icon source prepared and checked against App Store requirements.
- Splash screen or launch screen prepared.
- No unverified metrics, fake testimonials, or guaranteed revenue claims in screenshots.
- Screenshots match the actual iOS experience.
- Safe-area layout checked on a real iPhone.

## 4. Real Device Smoke Test

Before external TestFlight review:

- Install on real iPhone.
- Open app from fresh install.
- Login works.
- Logout works.
- Session persistence works after closing/reopening.
- Privacy Policy opens.
- Terms open.
- Account/data deletion path opens.
- Contact/support path opens.
- Client portal route opens for authorized user.
- Pricing route opens.
- Product signup route opens.
- Poor connection/offline state is acceptable.
- Push notification permission flow is tested if push is enabled.

## 5. TestFlight External Review Notes

Fill out `docs/IOS_APP_REVIEW_NOTES_TEMPLATE.md` before external TestFlight review.

Include:

- Demo account or demo mode.
- Backend status.
- Non-obvious feature explanation.
- Privacy label confirmation.
- Live proof artifacts.
- Account/data deletion path.

## 6. App Store Submission Gate

Do not submit to App Store review unless:

- Internal TestFlight build passed.
- External TestFlight review notes are complete if external testing is used.
- Privacy details match `mobile/ios-app-store-readiness.json`.
- Build identity matches `mobile/ios-build-readiness.json`.
- Screenshots and metadata are truthful.
- Support, privacy, terms, SMS terms, and account deletion links work.
- Backend/Base44 publish proof exists.
