# Area 15 — Mobile Security, App Store Compliance, and Cross-Platform Release Verification

## Scope

This area prepares ClientSurge Systems for an iOS/TestFlight/App Store path by adding repo-side guardrails for privacy disclosures, review notes, account/data requests, mobile security checks, and proof separation between GitHub, Base44 production, and iOS builds.

## Apple references

- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- TestFlight: https://developer.apple.com/testflight/
- Account deletion support: https://developer.apple.com/support/offering-account-deletion-in-your-app/

## What changed

- Clarified the existing privacy request form as an account/data request path.
- Added `request_type: "account_and_data_deletion"` to the request payload.
- Added stable form IDs and accessibility labels.
- Added an Account and Data Deletion section to the privacy page.
- Added `/account-deletion`, `/delete-account`, and `/data-deletion` route aliases.
- Added `mobile/ios-app-store-readiness.json`.
- Added `docs/IOS_APP_REVIEW_NOTES_TEMPLATE.md`.
- Added `scripts/audit-area15-ios-appstore.mjs`.
- Added `tests/area15IosAppStoreCompliance.test.js`.

## 10 flaws / risks addressed

1. The privacy page had a request form, but did not clearly label it for account/data requests.
2. The request payload did not identify the request type.
3. The request form fields lacked stable IDs for accessibility/testing.
4. There was no simple `/account-deletion` route alias.
5. There was no `/delete-account` fallback path for review/support.
6. There was no `/data-deletion` fallback path for privacy requests.
7. There was no structured iOS privacy-label candidate file listing linked user data and processors.
8. There was no review-notes template for demo account, backend status, privacy, support, and non-obvious feature explanations.
9. There was no release-proof rule separating GitHub merge, Base44 production publish, and TestFlight/iOS build proof.
10. There was no Area 15 regression test preventing mobile app readiness guardrails from being removed later.

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

Do not submit an iOS build to TestFlight external review or the App Store unless privacy URL, support URL, account/data request path, demo account or demo mode, live backend proof, App Store privacy details, screenshots, metadata, and release proof are all current and verified.

## Production/Base44 note

This PR changes frontend, route metadata, mobile readiness files, and tests in GitHub. It does not prove Base44 or iOS production/TestFlight has published anything. Production proof still depends on Area 12 release artifacts and later iOS/TestFlight build artifacts.
