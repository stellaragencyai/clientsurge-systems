# SEO Index Cleanup Plan - 2026-06-05

Purpose: prepare the cleanup step for URLs that may already have leaked into search results before the current route-metadata and sitemap fixes are fully live on `clientsurgesystems.com`.

## Why this exists

- The route and sitemap logic is now cleaner locally, but the public domain has shown mixed production behavior.
- That means search engines may already know about old alias URLs, auth-adjacent URLs, or generic fallback pages that should not stay indexed long term.
- This document is the cleanup playbook to use after the public domain is confirmed on the newer build.

## Likely cleanup candidates

### Legacy alias and duplicate URLs

- `/pricing`
- `/faq`
- `/our-system`
- `/testimonials`
- `/Blog`
- `/IndustriesPage`
- `/IndustryTemplate`
- `/Roofing`
- `/HVAC`
- `/Dental`
- `/MedSpa`
- `/Chiropractic`
- `/Contractors`
- `/legal/privacy`
- `/legal/terms`
- `/industries/roofing`
- `/industries/hvac`
- `/industries/dental`
- `/industries/med-spa`
- `/industries/chiropractic`
- `/industries/contractors`

### URLs that should stay non-indexable

- `/login`
- `/order-success`
- `/success`
- `/thank-you`
- `/client-portal`
- `/client-dashboard`
- `/onboarding`
- `/setup`
- `/setup/credentials`
- `/setup/status`
- `/setup/preview`
- `/admin`
- `/admin/leads`
- `/admin/automations`
- `/admin/onboarding`
- `/admin/install-guide`
- `/admin/ai-sales`
- `/admin/performance-wars`
- `/dashboard`
- `/admin-settings`
- `/lead-intelligence`
- `/sam`
- `/medspa-dashboard`

## Desired end state

- Canonical public URLs resolve with distinct route metadata.
- Alias-only URLs either redirect cleanly or canonicalize back to the intended destination.
- Login, thank-you, portal, setup, and admin surfaces stay excluded from sitemap coverage and crawler indexing.
- Search results stop surfacing weak or duplicate entry points.

## Cleanup sequence

1. Reconfirm the public domain is on the newer route-metadata build.
2. Re-run `scripts/public-route-smoke.mjs --base-url=https://clientsurgesystems.com`.
3. Re-run `scripts/audit-raw-route-html.mjs`.
4. Manually fetch the cleanup-candidate URLs and capture:
   - HTTP status
   - canonical
   - robots
   - whether the page is a redirect, alias shell, or protected route
5. Separate each candidate into one of these buckets:
   - `keep indexed`
   - `canonical cleanup only`
   - `redirect cleanup`
   - `request temporary removal`
6. Only after the live build is confirmed, submit removals or validation requests through the search-console workflow.

## Recommended first removal set

If search results currently expose bad URLs, the safest first temporary-removal set is:

- legacy uppercase alias routes
- `/pricing`, `/faq`, `/our-system`, `/testimonials`
- `/login`
- any `/admin*`, `/setup*`, `/client-portal*`, or `/thank-you` result that appears publicly

## Notes

- Do not request removals before the canonical live fix is confirmed, or search engines may re-crawl the same broken patterns.
- Prefer fixing crawl instructions first, then doing search-console cleanup second.
- This plan is internal prep only; it does not assume that any external cleanup request has been submitted yet.
