# Client Portal Merge-Readiness Report

Date: 2026-07-17
Branch: `fix/client-dashboard-25-flaws`
PR: #1235

## Mergeability fix applied

The PR branch was re-anchored onto the current `main` commit instead of carrying an old divergent branch forward.

The final intended merge set is intentionally narrow:

1. `cloudflare/clientsurge-production-safe-entry.mjs`
   - Allows `/client-portal` to recover to the sanitized SPA app shell instead of failing closed as a private edge route.
   - Redirects legacy `/client-dashboard` and `/ClientDashboard` to `/client-portal`.
   - Keeps admin/internal routes private and fail-closed.
   - Applies `noindex,nofollow` to the client portal shell response.

2. `tests/cloudflareProductionSafeEntry.test.js`
   - Adds regression coverage for `/client-portal` app shell recovery.
   - Adds regression coverage for `/client-dashboard` canonical redirect.
   - Keeps private `/admin` fail-closed coverage.

## Why the PR was narrowed

Current `main` already contains newer premium portal components and broader app work. The earlier PR branch was stale and overwrote newer main-branch portal files, producing large deletions and failing checks. The merge-ready path is to preserve current `main` and only add the missing production edge fixes needed for the portal release gate.

## Remaining release checks after merge

- Confirm GitHub Actions pass on the re-anchored PR head.
- Merge by squash only.
- Let the Cloudflare deploy workflow publish the active worker.
- Smoke-test live:
  - `/client-portal` returns the app shell, not 403.
  - `/client-dashboard` redirects to `/client-portal`.
  - `/admin` remains blocked.
  - The homepage no longer exposes generated Base44 Pages directory content.

## Release decision

Merge only after the checks on the re-anchored PR head are green or intentionally accepted by the repository admin.
