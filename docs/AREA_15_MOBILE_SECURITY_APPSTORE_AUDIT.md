# Area 15 — Mobile Security, App Store Compliance, and Cross-Platform Release Verification

## Scope

This area prepares ClientSurge Systems for an iOS/TestFlight/App Store path by adding repo-side guardrails for privacy disclosures, App Review notes, account/data deletion, mobile security checks, and proof separation between GitHub, Base44 production, and iOS builds.

## Apple requirements referenced

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Apple TestFlight: https://developer.apple.com/testflight/
- Apple account deletion support: https://developer.apple.com/support/offering-account-deletion-in-your-app/

## What changed

- Clarified the existing deletion form as an account/data deletion request path.
- Added `request_type: "account_and_data_deletion"` to the deletion request payload.
- Added accessible labels/ids to the deletion request form fields.
- Added an explicit Account and Data Deletion section to the privacy page.
- Added `/account-deletion`, `/delete-account`, and `/data-deletion` aliases into public route metadata.
- Added `mobile/ios-app-store-readiness.json` as the machine-readable iOS readiness checklist.
- Added `docs/IOS_APP_REVIEW_NOTES_TEMPLATE.md` for TestFlight/App Review submission notes.
- Added `scripts/audit-area15-ios-appstore.mjs`.
- Added `tests/area15IosAppStoreCompliance.test.js`.

## 10 flaws / risks addressed

1. The privacy page had a deletion form, but did not clearly label it as account deletion for iOS review.
2. The deletion request payload did not identify the request as account/data deletion.
3. The deletion form fields lacked stable IDs for accessibility/testing.
4. Account deletion was not available through a simple `/account-deletion` path.
5. There was no `/delete-account` fallback path for App Review or user support.
6. There was no `/data-deletion` fallback path for privacy requests.
7. There was no structured iOS privacy-label candidate file listing linked user data and processors.
8. There was no App Review notes template for demo account, backend status, privacy, deletion, and non-obvious feature explanations.
9. There was no explicit cross-platform release proof rule separating GitHub merge, Base44 production publish, and TestFlight/iOS build proof.
10. There was no Area 15 regression test preventing iOS/App Store readiness guardrails from being removed later.

## Files changed

- `src/components/legal/DataDeletionRequestForm.jsx`
- `src/internal-pages/LegalPage.jsx`
- `src/lib/publicRouteMetadata.js`
- `mobile/ios-app-store-readiness.json`
- `docs/IOS_APP_REVIEW_NOTES_TEMPLATE.md`
- `scripts/audit-area15-ios-appstore.mjs`
- `tests/area15IosAppStoreCompliance.test.js`
- `docs/AREA_15_MOBILE_SECURITY_APPSTORE_AUDIT.md`

## How to run

```bash
node scripts/audit-area15-ios-appstore.mjs --write
node --test tests/area15IosAppStoreCompliance.test.js
```

The `--write` option creates:

```text
tmp/area15-ios-appstore-audit.json
```

## Operator rule

Do not submit an iOS build to TestFlight external review or the App Store unless all of these are true:

- Privacy Policy URL works.
- Support URL works.
- Account/data deletion path works.
- Demo account or approved demo mode exists.
- Backend services are live for Apple review.
- App Store privacy details match the real app behavior.
- Screenshots and metadata do not contain fake testimonials, unverified proof, or guaranteed revenue claims.
- Base44 production publish proof exists if the iOS build depends on the web app runtime.
- TestFlight build number, web commit SHA, and release proof are recorded together.

## Production/Base44 note

This PR changes frontend, route metadata, mobile readiness files, and tests in GitHub. It does not prove Base44 or iOS production/TestFlight has published anything. Production proof still depends on Area 12 release artifacts and later iOS/TestFlight build artifacts.
