# Area 2 — Routing, Auth, Access Control, and Public Exposure

## Scope

This area covers public/private route boundaries, generated Base44 page-directory exposure, noindex/sitemap controls, and app-shell route classification.

## 10 flaws fixed in this area

1. The live root can expose Base44's generated `Pages` directory before the real ClientSurge shell.
2. The generated directory guard inspected `#root` first, which can miss exposure rendered elsewhere in `document.body`.
3. The generated directory guard replaced the whole root too aggressively instead of first stripping only the generated directory block.
4. The generated directory guard disconnected after only 8 seconds, which is weak against late Base44 route-directory mutations.
5. Public marketing routes, auth utility routes, checkout routes, and private client/admin routes were not cleanly separated.
6. `/login`, `/register`, `/forgot-password`, and `/reset-password` were missing from the app-shell public utility route list.
7. Private generated-directory aliases such as `/AdminSettings`, `/AdminLeadDetail`, `/LeadIntelligence`, `/WebsiteSpecPreview`, and `/Dashboard` were not consistently present in route metadata aliases.
8. Admin/private classification missed hyphenless/camelcase aliases surfaced by generated Base44 routes.
9. Internal/generated route prefixes such as `/_generated`, `/pages`, `/motionlab`, and `/websitespecpreview` were not consistently treated as internal/noindex.
10. There was no focused Area 2 regression test to prove sitemap/public shell routes stay separate from private/auth/admin/internal surfaces.

## Files changed

- `src/lib/publicRouteMetadata.js`
- `src/lib/routeSecurity.js`
- `src/lib/publicPageDirectoryGuard.js`
- `tests/routeSecurityArea2.test.js`

## Live evidence

On 2026-07-08, `https://clientsurgesystems.com/` was observed rendering generated Base44 copy, including `ClientSurge Systems manages 5 data types including launch gates`, a `Pages` heading, and visible internal/admin/client/setup route names.

## Verification expectation

After merge and Base44/edge publish, the public root must not display generated route directory content, private route names, admin route names, or setup/client dashboard route names to anonymous visitors.
