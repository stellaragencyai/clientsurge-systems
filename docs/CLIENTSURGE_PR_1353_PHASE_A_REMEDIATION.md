# PR #1353 Phase A Remediation Evidence

Branch: `feature/clientsurge-design-system-2-1-shell`

Scope: Foundation remediation for issue #1375 rows A-DS-01 through A-DS-10. This branch remains draft and is not merge-authorized.

## Engineering Corrections

- A-DS-01: Added duplicate-ID and `aria-controls` browser assertions in `scripts/validate-phase-a-foundation-review.mjs`.
- A-DS-02: Hardened `CSAppShell` mobile navigation labels, backdrop focus behavior, mounted `aria-controls`, and automated drawer focus/scroll/inert checks.
- A-DS-03: Updated `CSField` to generate stable fallback IDs through `React.useId()` and added a fixture omitting caller IDs.
- A-DS-04: Propagated required semantics to native controls, or `aria-required` for non-native controls.
- A-DS-05: Added `CSLoadingState` so skeleton decoration remains hidden behind one restrained loading announcement.
- A-DS-06: Added explicit empty-state reason classes: `verified_zero`, `filtered_zero`, `not_connected`, `unavailable`, `permission_restricted`, `incomplete_setup`, `unknown`, `query_error`, and `unsupported`.
- A-DS-07: Added configurable heading levels for reusable cards, empty states, and chart frames, plus nested fixtures.
- A-DS-08: Made `CSAlert` live-region behavior opt-in through `announce`.
- A-DS-09: Split interface, info, focus, and commerce-blue token aliases; commerce styling remains in pricing/storefront primitives.
- A-DS-10: Added committed development-only review harness at `/review/phase-a/`.

## Repeatable Commands

```powershell
npm ci
npx eslint src/components/design-system/CSAppShell.jsx src/components/design-system/CSProductPrimitives.jsx src/components/design-system/CSDataDisplayPrimitives.jsx src/components/design-system/CSDesignSystemGallery.jsx src/components/design-system/index.js src/review/phase-a/PhaseAFoundationReview.jsx src/review/phase-a/phase-a-entry.jsx scripts/validate-phase-a-foundation-review.mjs --quiet
git diff --check
npm run typecheck
npm run build
node scripts/validate-phase-a-foundation-review.mjs
```

## Browser Matrix

`node scripts/validate-phase-a-foundation-review.mjs` validates:

- 1440 x 900
- 1280 x 820
- 1024 x 768
- 768 x 900
- 390 x 844
- 375 x 667

Automated assertions include duplicate IDs, mounted `aria-controls`, mobile drawer focus containment, Escape close, focus restoration, inert background, scroll lock release, CSField fallback identity, required semantics, live-region restraint, 44px touch targets, reduced motion, 200% text zoom/reflow, no horizontal overflow, no changed-code console errors, and axe serious/critical violations on representative desktop/mobile views.

Generated screenshots are written to `work/phase-a-review/results` and are intentionally not committed.

## Latest Local Results

- Focused ESLint: passed.
- `git diff --check`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with the existing Vite large-chunk warning.
- `node scripts/validate-phase-a-foundation-review.mjs`: passed, 6/6 viewports.

## Remaining Manual Worker #3 Checks

- Screen-reader smoke review beyond automated axe checks.
- Visual polish and information hierarchy review.
- Mobile drawer interaction feel at 200% zoom on an actual device/browser.
- Confirmation that token separation matches Worker #2 design interpretation.
