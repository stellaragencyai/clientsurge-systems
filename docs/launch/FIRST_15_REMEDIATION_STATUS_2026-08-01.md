# First 15 Remediation Status

Last updated: 2026-08-01

Branch: `codex/first-15-remediation-clean-20260801`

## Completed Locally

- Created an isolated remediation clone and branch from `origin/main`.
- Removed the Windows-hostile tracked case collision for the unused `src/components/ui/Pagination.jsx`; the lowercase `src/components/ui/pagination.jsx` remains the referenced UI component.
- Added a first-15 GitHub issue seed file for review before creating external tracker state.
- Added a launch gate policy covering local gates, live gates, approval-required actions, evidence, and rollback.
- Expanded `npm run typecheck` from a narrow page/component subset to all `src/**/*.js` and `src/**/*.jsx`.
- Kept unused-import cleanup as a warning under the existing `eslint . --quiet` gate so release-proof marker imports are not deleted by automated cleanup.
- Fixed React prop casing for `fetchPriority` in image components.
- Converted `src/lib/formProtection.js` JSX output to `createElement` so the `.js` parser path is valid.
- Added shared backend guards for admin, owner-or-admin, signed-internal, and admin-or-signed-internal function access.
- Guarded `cancelSubscription` with owner-or-admin order access.
- Guarded `sendSMS`, `sendInstantLeadResponseSms`, and `triggerVoiceCallToLead` with admin-or-signed-internal access.
- Restricted `Order`, `Subscription`, and `ClientInstallationOS` update RLS to admins.
- Expanded the Area 7 backend function audit with authorization buckets.
- Added regression tests for auth guards, external send function guards, function audit authorization classification, and authoritative entity RLS.
- Refreshed vulnerable production lockfile entries for `dompurify`, `engine.io-client`, `ws`, `postcss`, and `nanoid`.

## Verification

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `node --test tests/authGuards.test.js tests/externalSendFunctionAuth.test.js tests/authoritativeEntityRls.test.js tests/area7BackendFunctionAudit.test.js`: 18 pass, 0 fail.
- `npx vite build --outDir C:\Users\nolan\Documents\Codex\2026-08-01\files-mentioned-by-the-user-clientsurge\work\build-first15 --emptyOutDir`: pass.
- `npm audit --omit=dev --audit-level=high`: pass.
- `node scripts/audit-area7-functions.mjs --write`: pass and writes `tmp/area7-function-audit.json`.

## Remaining Blockers

- `npm audit --omit=dev` still reports two moderate React Router findings. The fix path requires a React Router v7 migration decision and should be handled as its own compatibility task.
- Full `node --test --test-reporter=dot` still fails with 141 broader repository readiness failures. These are outside the first-15 security patch and include public-route, SEO/legal, metadata, Cloudflare wrapper, mobile/nav, and older audit expectation failures.
- The function audit still reports 233 functions with no obvious auth guard and 442 functions with findings. This branch creates the matrix and fixes the first targeted critical send/cancel paths; it does not complete all backend hardening.
- No Base44 publish, Cloudflare mutation, GitHub push, merge, or live production change has been performed.

## Next Safe Actions

- Review the branch diff and split it into a PR.
- Decide whether to create the GitHub issues from `docs/launch/FIRST_15_REMEDIATION_ISSUE_SEED_2026-08-01.md`.
- Start the React Router v7 migration plan as a separate dependency/security task.
- Continue backend auth hardening by prioritizing the unauthenticated provider-touching functions from `tmp/area7-function-audit.json`.
