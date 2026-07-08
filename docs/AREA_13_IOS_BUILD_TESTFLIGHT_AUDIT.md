# Area 13 — iOS Build, TestFlight, and App Store Readiness

## Scope

This area covers the actual iOS packaging/readiness layer before a downloadable smartphone app is tested or submitted: bundle identity, signing prerequisites, version/build number discipline, app icon and splash assets, TestFlight smoke paths, App Store metadata, and cross-platform release proof.

Area 15 covers compliance/security. Area 13 covers whether the iOS build itself is ready to package, upload, test, and explain.

## What changed

- Added `mobile/ios-build-readiness.json` as the machine-readable iOS build manifest.
- Added `docs/IOS_TESTFLIGHT_BUILD_CHECKLIST.md`.
- Updated `docs/IOS_APP_REVIEW_NOTES_TEMPLATE.md` with build identity, TestFlight build ID, signing/provisioning, and build proof fields.
- Added `scripts/audit-area13-ios-build.mjs`.
- Added `tests/area13IosBuildReadiness.test.js`.
- Added this Area 13 audit document.

## 10 flaws / risks addressed

1. There was no dedicated iOS build manifest separate from privacy/compliance readiness.
2. Bundle ID, SKU, display name, and versioning expectations were not locked in repo.
3. There was no explicit rule requiring a unique iOS build number per TestFlight upload.
4. There was no explicit link between iOS build release notes, web commit SHA, and Base44 publish proof.
5. App icon and splash-screen readiness were not tracked before TestFlight.
6. Screenshot rules did not explicitly ban fake metrics, unverified testimonials, or guaranteed revenue claims.
7. Real-device TestFlight smoke paths were not listed as a required build gate.
8. App Review notes did not ask for iOS build number, TestFlight build ID, signing status, or provisioning status.
9. The iOS build dependency on the live ClientSurge/Base44 runtime was not separated from GitHub merge proof.
10. There was no Area 13 regression test preventing iOS build readiness fields from being removed later.

## Files changed

- `mobile/ios-build-readiness.json`
- `docs/IOS_TESTFLIGHT_BUILD_CHECKLIST.md`
- `docs/IOS_APP_REVIEW_NOTES_TEMPLATE.md`
- `scripts/audit-area13-ios-build.mjs`
- `tests/area13IosBuildReadiness.test.js`
- `docs/AREA_13_IOS_BUILD_TESTFLIGHT_AUDIT.md`

## How to run

```bash
node scripts/audit-area13-ios-build.mjs --write
node --test tests/area13IosBuildReadiness.test.js
```

The `--write` option creates:

```text
tmp/area13-ios-build-audit.json
```

## Operator rule

Do not upload a TestFlight build unless all of these are recorded together:

- iOS build number
- TestFlight build ID after upload
- GitHub commit SHA
- Base44 publish proof artifact
- production URL smoke result
- app icon/splash readiness
- real-device smoke test status
- privacy/support/account deletion link status

## Production/Base44/iOS note

This PR prepares the repo for iOS build discipline. It does not create a native iOS binary, upload to TestFlight, or prove Base44 production publish. Those require the Base44 iOS build/export/testing flow and Apple Developer/TestFlight actions outside this GitHub-only change.
