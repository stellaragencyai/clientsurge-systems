# Area 9 — SEO, Legal, Public Trust, and Proof

## Scope

This area covers public route metadata, sitemap/robots behavior, legal page copy, SMS/privacy/refund/terms clarity, proof labels, testimonial/trust pages, and truthful public claims.

## What changed

- Made sitemap metadata explicit for every public directory route.
- Tightened public metadata for `/proof` and `/testimonials` so previews are not confused with verified testimonials.
- Added `/automation-roadmap` as a canonical alias to `/roadmap` in route metadata.
- Replaced overconfident legal badge language with truthful trust labels.
- Rebuilt the legal page copy around privacy, terms, refund, SMS consent, AI processing, data sharing, and support contact clarity.
- Relabeled the testimonial section as workflow scenarios and added a proof-label disclaimer.
- Added `scripts/audit-area9-seo-trust.mjs`.
- Added `tests/area9SeoLegalTrust.test.js`.

## 10 flaws / risks addressed

1. Sitemap metadata was only explicit for a subset of public pages.
2. `/testimonials` metadata could imply verified customer testimonials when the page currently shows workflow scenarios.
3. The testimonial component eyebrow said “Real Workflow Results,” which could be read as verified results.
4. Workflow scenario cards did not show a clear proof-label disclaimer before the card grid.
5. Legal trust badges included “10DLC SMS Compliant,” an overconfident claim unless current campaign registration proof is available.
6. Legal trust badges implied verified sender identity without public proof attached.
7. Legal copy update dates were stale relative to current Area 8/11 compliance and data-model hardening.
8. Legal page trust labels did not clearly distinguish operational guardrails from third-party certification.
9. Route metadata did not include `/automation-roadmap` as a canonical alias even though the app redirects it.
10. There was no Area 9 regression test preventing future unverified testimonial/compliance/SEO claim drift.

## Files changed

- `src/lib/siteDocuments.js`
- `src/lib/publicRouteMetadata.js`
- `src/internal-pages/LegalPage.jsx`
- `src/pages/TestimonialsPage.jsx`
- `src/components/landing/Testimonials.jsx`
- `scripts/audit-area9-seo-trust.mjs`
- `tests/area9SeoLegalTrust.test.js`
- `docs/AREA_9_SEO_LEGAL_PUBLIC_TRUST_AUDIT.md`

## How to run

```bash
node scripts/audit-area9-seo-trust.mjs --write
node --test tests/area9SeoLegalTrust.test.js
```

The `--write` option creates:

```text
tmp/area9-seo-trust-audit.json
```

## Operator rule

Do not publish verified-client language, revenue metrics, compliance certifications, or “live” proof language unless the supporting source exists and the public label says what is actually verified.

Allowed labels:

- Workflow scenario
- Target outcome
- Platform foundation
- Operational guardrail
- Verified customer quote
- Verified production metric
- Roadmap / planned

Unverified labels to avoid:

- Real customer result
- Guaranteed revenue
- Certified compliance
- Fully autonomous
- Live proof
- Verified sender identity

## Production/Base44 note

This PR changes public copy, route metadata, and tests in GitHub. It does not prove Base44 has published the changes live. Production proof still depends on Area 12 release artifacts after merge.
