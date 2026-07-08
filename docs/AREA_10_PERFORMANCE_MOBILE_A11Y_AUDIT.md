# Area 10 — Performance, Mobile UX, Accessibility, and Loading States

## Scope

This area covers mobile web behavior, iOS safe areas, tap targets, reduced-motion support, app-load failure states, mobile contact actions, route-level lazy loading guardrails, and regression coverage for accessibility/performance basics.

## What changed

- Imported `src/area10-mobile-a11y.css` from `src/main.jsx`.
- Added accessible fatal-load screen semantics in `src/main.jsx`:
  - `role="alert"`
  - `aria-live="assertive"`
  - `100svh` mobile height
  - safe-area padding
  - labeled refresh/home actions
- Updated `src/components/landing/MobileCallBar.jsx`:
  - changed wrapper from generic `div` to labeled `nav`
  - added explicit call/action labels
  - added dialog semantics for the planning modal button
  - added `type="button"`
  - hid decorative icons from assistive tech
- Added `src/area10-mobile-a11y.css`:
  - mobile safe-area left/right padding
  - 44px minimum mobile action targets
  - narrow-phone font/padding protection
  - reduced-motion override for decorative animation-heavy classes
- Added `scripts/audit-area10-mobile-a11y.mjs`.
- Added `tests/area10MobileA11yPerformance.test.js`.

## 10 flaws / risks addressed

1. The fatal-load fallback was visible but not announced as an alert to assistive technology.
2. The fatal-load fallback used `100vh`-style sizing instead of `100svh`, which is less stable on mobile browser chrome.
3. The fatal-load fallback did not include explicit safe-area padding for iPhone notch/home-indicator conditions.
4. Fatal-load actions did not have explicit accessibility labels.
5. The mobile call bar was a generic `div` instead of a labeled navigation region.
6. The phone call action did not expose a specific assistive label with the phone number.
7. The modal-opening mobile action did not expose dialog semantics.
8. Decorative mobile action icons were not explicitly hidden from assistive technology.
9. The project had reduced-motion rules, but no Area 10-specific guardrail for high-motion premium UI classes and mobile actions.
10. There was no Area 10 regression audit preventing mobile/a11y/performance guardrails from being removed later.

## Files changed

- `src/main.jsx`
- `src/components/landing/MobileCallBar.jsx`
- `src/area10-mobile-a11y.css`
- `scripts/audit-area10-mobile-a11y.mjs`
- `tests/area10MobileA11yPerformance.test.js`
- `docs/AREA_10_PERFORMANCE_MOBILE_A11Y_AUDIT.md`

## How to run

```bash
node scripts/audit-area10-mobile-a11y.mjs --write
node --test tests/area10MobileA11yPerformance.test.js
```

The `--write` option creates:

```text
tmp/area10-mobile-a11y-audit.json
```

## Operator rule

Do not add fixed mobile UI, loading states, animated proof components, or mobile CTAs unless they satisfy:

- keyboard focus visibility
- 44px touch target where interactive
- safe-area compatibility for iOS
- reduced-motion behavior
- explicit labels for icon-heavy controls
- no blocking of scroll or content on small screens

## Production/Base44 note

This PR changes frontend files and tests in GitHub. It does not prove Base44 has published the changes live. Production proof still depends on Area 12 release artifacts after merge.
