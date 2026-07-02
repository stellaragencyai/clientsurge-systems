# ClientSurge Systems — 12 Industry Landing Pages Buildout Audit

Date: 2026-07-01
Branch: `industry-pages-buildout-2026-07-01`
Base44 app ID: `69dc4a79656fdba136d413d3`
Repository: `stellaragencyai/clientsurge-systems`

## Scope

Audit the current ClientSurge industry landing page system and create the execution plan for building 12 buyer-specific, truthful, high-converting industry pages.

## Hard Rules

- Do not fabricate numbers.
- Do not publish fake testimonials.
- Do not display live-looking stats unless they are backed by real instrumentation or clearly labeled.
- Every proof block must be labeled as verified, unverified, or coming soon.
- Every industry page must connect to the real customer journey: page → CTA/form → pricing/package selection → checkout/onboarding handoff.

## Current Source-of-Truth Finding

GitHub currently contains the React route structure, shared industry template, industry data config, dedicated industry pages, navigation tests, and public industry index. Base44 app `69dc4a79656fdba136d413d3` exists and contains data models for leads, website leads, conversion tracking, landing page analytics, acquisition campaigns, and onboarding handoff.

Page changes should start in GitHub branch/PR first. Base44 edits should be used only after confirming how the app currently publishes from GitHub/source export.

## Existing Industry Routes Found

Template-backed industry routes:

- `/med-spa`
- `/dental`
- `/hvac`
- `/plumbing`
- `/roofing`
- `/chiropractic`
- `/contractors`
- `/property-services`
- `/veterinary`

Dedicated industry pages:

- `/real-estate`
- `/personal-injury`

Industry index currently shows 10 cards and does not show every route that exists. Property services exists as a route/config but is not listed on the visible industry index.

## Missing Target Pages

The requested 12-page set is not complete. Missing or partial pages:

- `/law-firms` — currently only `/personal-injury` exists, which is too narrow for general law firms.
- `/auto-services` — missing.
- `/cleaning-services` — missing.
- `/local-services` — missing.

## Major Audit Findings

1. The current shared template is useful but incomplete. It has hero, pain points, use cases, generic launch-focus metrics, optional proof/testimonials, features, qualification form, and final CTA. It does not yet fully satisfy the required 12-section page blueprint.
2. Shared proof is empty. That is good because it avoids fake testimonials, but the pages need a deliberately labeled trust/proof section instead of a silent empty area.
3. Shared metrics are generic outcome labels, not hard proof. Keep them as target outcomes or replace with truthful workflow examples.
4. Template pages set only `document.title`; they need proper metadata/canonical/schema support.
5. Dedicated pages have stronger SEO metadata, but still lack FAQ/schema/proof/form depth.
6. Industry index uses a "Live" badge for every visible card. That is risky because several pages are incomplete and some routes are not visible.
7. The qualification form has industry-specific questions for several existing industries, but missing coverage for property services, veterinary, law firms, auto services, cleaning services, and general local services.
8. Analytics and conversion schemas have enum/page-key coverage for current major pages, but will need expansion before new pages can be tracked cleanly.
9. Current test coverage checks only a subset of industry routes. It must be expanded to all approved live routes.
10. Property services config references an icon key that is not present in the template icon map, causing fallback behavior.

## Target 12-Page Set

1. Dental & Orthodontics — `/dental`
2. Med Spas & Aesthetic Clinics — `/med-spa`
3. Chiropractic & Physical Therapy — `/chiropractic`
4. HVAC — `/hvac`
5. Plumbing — `/plumbing`
6. Roofing & Restoration — `/roofing`
7. Contractors & Trades — `/contractors`
8. Law Firms — `/law-firms` target, `/personal-injury` existing sub-vertical
9. Real Estate / Property Services — `/real-estate` and `/property-services`
10. Auto Repair / Auto Services — `/auto-services`
11. Home Cleaning / Local Services — `/cleaning-services`
12. Other Service Businesses / General Local Service — `/local-services`

## First 3 Build Priorities

P1 pages:

1. HVAC — urgent demand, missed-call heavy, dispatch-driven, strong fit for AI receptionist and missed-call recovery.
2. Plumbing — emergency intent, booking/dispatch pain, strong fit for instant response and qualification.
3. Roofing & Restoration — high-intent storm/leak/inspection leads, strong fit for inspection booking and estimate follow-up.

Dental and med spa are also high value, but the first pass should prioritize urgent service categories where speed-to-lead, missed calls, and dispatch handoff are the clearest conversion levers.

## Standard Page Blueprint

Every target page should include:

1. Hero with industry-specific pain
2. Where leads are being lost
3. Automation system overview
4. AI receptionist / missed-call recovery section
5. Lead response workflow
6. Booking / follow-up workflow
7. Industry-specific ROI examples clearly labeled as examples, not proof
8. Trust/proof section labeled verified, unverified, or coming soon
9. FAQs
10. Pricing or package CTA
11. Final CTA
12. Schema/SEO metadata

## Phase Plan

### Phase 1 — Audit and Page Inventory

- [ ] Confirm route inventory.
- [ ] Confirm industry data config.
- [ ] Confirm index card coverage.
- [ ] Confirm CTA destinations.
- [ ] Confirm form submission path.
- [ ] Confirm analytics/page-key coverage.
- [ ] Confirm checkout/onboarding handoff.

### Phase 2 — Shared Template and Component Definition

- [ ] Add required blueprint sections to shared template or introduce a new industry page system component.
- [ ] Add SEO metadata support for template-backed pages.
- [ ] Add FAQ/schema support.
- [ ] Add truthful proof-state handling.
- [ ] Add package-fit CTA logic.
- [ ] Add per-industry qualification questions.

### Phase 3 — First 3 Pages

- [ ] Upgrade `/hvac`.
- [ ] Upgrade `/plumbing`.
- [ ] Upgrade `/roofing`.
- [ ] Add tests for each route.
- [ ] Validate CTA/form paths.

### Phase 4 — Next 3 Pages

- [ ] Upgrade `/dental`.
- [ ] Upgrade `/med-spa`.
- [ ] Upgrade `/chiropractic`.

### Phase 5 — Next 3 Pages

- [ ] Upgrade `/contractors`.
- [ ] Create `/law-firms` and keep `/personal-injury` as sub-vertical or cross-link.
- [ ] Fix `/real-estate` and `/property-services` relationship.

### Phase 6 — Final 3 Pages

- [ ] Create `/auto-services`.
- [ ] Create `/cleaning-services`.
- [ ] Create `/local-services`.

### Phase 7 — CTA/Checkout/Onboarding Validation

- [ ] Test every primary CTA.
- [ ] Test every secondary CTA.
- [ ] Test form submission attribution.
- [ ] Test pricing/package path.
- [ ] Test checkout/onboarding handoff.

### Phase 8 — SEO, Performance, QA Proof

- [ ] Metadata and canonical check.
- [ ] Schema check.
- [ ] Route regression tests.
- [ ] Mobile CTA check.
- [ ] Broken link check.
- [ ] Analytics page-key check.
- [ ] Final PR proof summary.

## Immediate Next Code Step

Start with `/hvac` because it already has the strongest industry-specific config and is the cleanest first page to bring up to the full blueprint standard. The first implementation should not invent metrics. It should add missing page sections, FAQ/schema/metadata support, CTA proof labels, and route tests.
