# PR 1353 Validation Checkpoint

Branch: `feature/clientsurge-design-system-2-1-shell`
Start SHA: `461833bd76f1f3c42d911a1cd6d1c1e7729fa072`
Environment: Windows 11 Pro 10.0.26200 x64, Node `v24.18.0`, npm `11.16.0`

## Commands Run

| Command | Result | Notes |
| --- | --- | --- |
| `git fetch --all --prune` | Passed | Remote branch refreshed before validation. |
| `git checkout feature/clientsurge-design-system-2-1-shell` | Passed | Branch set to track `origin/feature/clientsurge-design-system-2-1-shell`. |
| `git pull --ff-only origin feature/clientsurge-design-system-2-1-shell` | Passed | Already up to date. |
| `npm ci` | Passed | npm reported 7 audit advisories and allow-scripts warnings for `core-js` and `esbuild`. |
| `npm run lint` | Failed, pre-existing baseline | 167 errors across 100 files; none of the lint-error files were in the PR changed-file set. |
| `npx eslint src/components/design-system/CSInteractionPrimitives.jsx src/components/design-system/CSDataControls.jsx --quiet` | Passed | Focused lint for changed design-system files. |
| `npm run typecheck` | Passed | `tsc -p ./jsconfig.json`. |
| `npm run build` | Passed | Vite build succeeded; existing large chunk warning remains. |
| `npm run test:release-gate:node` | Wrapper passed; advisory shard failed | Wrapper exits 0. Advisory `tests/websiteLeadsDashboard.test.js` fails because `buildWebsiteLeadQuery("all")` now returns `{ archived: { $ne: true } }` while the test expects `{}`. Test/source are outside this PR. |
| `npm run smoke:clientsurge-production` | Passed | 8/8 live public route checks passed, including `www` redirect. |
| `npm run smoke:public-routes -- --base-url=http://127.0.0.1:5173` | Failed, pre-existing baseline | Script expects inline static-route metadata literals not present in the current index contract. |
| `npm run smoke:public-routes -- --base-url=http://127.0.0.1:4173` | Failed, pre-existing baseline | Same static-route metadata contract failure under Vite preview. `origin/main:index.html` also lacks `routeMap`, `aliases`, and `noindexPrefixes`. |
| `npm run proof:production-release` | Failed, pre-existing live infrastructure | 11/11 live routes failed for generated Base44 Pages directory exposure. |
| `npm run sync:status -- --json` | Failed, pre-existing control-plane/workstation | Active PR branch, Windows case-collision dirty state, stale dirty main mirror, Base44 SHA mismatch, donor-app access failure, disabled/failing sync task, missing Cloudflare task. |
| `npm run verify:production-security` | Failed, pre-existing live infrastructure | `missing_worker_headers`; CSP and COOP missing; sensitive routes returned 200 without noindex/no-store. |
| `node work\pr-1353-validation\browser-validation.mjs` | Passed | Scratch Playwright harness: 24 auth route/viewport checks passed, auth forms passed, interaction/accessibility checks passed. Scratch harness is not committed. |

## Fixes Made

- `src/components/design-system/CSInteractionPrimitives.jsx`
  - Fixed overlay focus restoration after modal/drawer close.
  - Added deterministic dropdown ArrowUp/ArrowDown/Home/End/Escape keyboard behavior and focus return.
  - Safe because it only tightens focus behavior in the new Design System 2.1 interaction primitives.

- `src/components/design-system/CSDataControls.jsx`
  - Bounded `CSPagination` rendering without allocating every page.
  - Hardened zero/invalid `page`, `pageCount`, and `pageSize` values.
  - Safe because public API stays the same while edge cases no longer render misleading ranges or giant page lists.

- `index.html`
  - Guarded the Telegram tracker so it loads only on `clientsurgesystems.com` / `www.clientsurgesystems.com`.
  - Safe because production tracking is preserved while local auth-route validation no longer gets third-party CORS console errors.

## Browser And Accessibility Validation

Validated locally at `375`, `768`, `1024`, and `1440` widths:

- `/login`
- `/login?from_url=/client-portal`
- `/forgot-password`
- `/reset-password?token=test`
- `/reset-password`
- `/register`

Result: all loaded without blank screen, missing imports, console errors, React warnings, or horizontal overflow. Keyboard focus reached visible controls. Login `from_url` auto-opened the existing portal login modal and Escape closed it.

Auth form behavior validated:

- Forgot-password invalid email shows a generic validation error without account enumeration.
- Reset-password empty/mismatched password errors render correctly.
- Register invalid email error renders correctly.

Design-system interaction harness validated:

- Modal and drawer: `role="dialog"`, `aria-modal`, initial focus, Tab trap, Escape close, scroll unlock, focus restoration.
- Dropdown: Arrow open, Arrow navigation, Escape close, trigger focus restoration.
- Tabs: ArrowRight selection.
- Search: clear behavior.
- Pagination: large page count bounded to 4 rendered page buttons; zero state stable.
- Confirmation dialog: loading state prevents duplicate confirmation.
- Toast: status announcement renders.

No dedicated public `/unauthorized` or `/session-expired` route exists in `App.jsx`; protected-route unauthorized/session-expired states remain internal route states.

## Remaining Blockers

- Full lint is blocked by pre-existing baseline errors outside this PR.
- Public route smoke is blocked by pre-existing script/index static metadata contract drift.
- Live production release proof is blocked by generated Base44 Pages directory exposure.
- Live production security is blocked by missing Cloudflare Worker headers.
- Base44 sync status is blocked by pre-existing control-plane/workstation drift.
- Advisory website-leads test expectation is stale relative to current archived-lead filtering behavior.
- Windows checkout remains affected by pre-existing `src/components/ui/Pagination.jsx` and `src/components/ui/pagination.jsx` case-only collision already present in `origin/main`.

## Recommendation

Ready except for documented pre-existing infrastructure failure.
