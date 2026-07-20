# ClientSurge Activation OS Phase A Validation

## Branch

- PR: #1355
- Branch: `feature/clientsurge-activation-os-shell`
- Original head before Prompt #2 rebase: `f91e61bb12f002359c42d9a3723af1a7cbbecffc`
- Intermediate head before second rebase: `d0478452e0c89c97b4cf3a9eb82b60c4b716fa64`
- Validated Design System base: `99bc81dc1c2be7f5eb8d24ab8d54e7ef604b5cf7`
- Validated code head before this report commit: `0bb2fec4fdedd356b3ad0b5ca7a9cf3775672953`

## Changed Files

- `docs/CLIENTSURGE_ACTIVATION_OS_SHELL_SPEC.md`
- `src/components/activation/CSActivationShell.jsx`
- `src/components/design-system/CSActivationPrimitives.jsx`
- `src/styles/clientsurge-os-activation.css`

## Rebase And Conflict Resolution

The branch was rebased onto the validated Design System branch. During the second rebase, PR #1353 had advanced from `542c7e8162435ff5425e4842730f3f03af877456` to `99bc81dc1c2be7f5eb8d24ab8d54e7ef604b5cf7` with shared activation primitives and activation stylesheet loading.

The activation branch was resolved by making `src/components/activation/CSActivationShell.jsx` a compatibility adapter around the shared Design System activation primitives. The local activation stylesheet conflict was resolved in favor of the shared stylesheet path while preserving activation-specific state styling for blocked and unavailable steps.

## Shared Design System Adoption

- `CSActivationShell.jsx` now delegates rendering to `CSActivationShell`, `CSActivationStepNav`, `CSActivationFooter`, and `CSAutosaveStatus` from the design-system boundary.
- Step data normalization remains activation-specific and preserves legacy prop compatibility.
- Blocked and unavailable steps remain focusable with `aria-disabled="true"` and visible helper text referenced by `aria-describedby`.
- Native `disabled` was removed from blocked step buttons so keyboard users can discover the blocked reason.
- Click handling prevents blocked-step navigation without bypassing container-level validation or persistence guards.

## Prompt #16D Accessibility Contract Repair

- Restored the approved `CSAlert` announcement contract from the Design System baseline.
- Static alerts now remain static unless the caller passes `announce=true`.
- Explicit announcements preserve the original tone-specific behavior: danger uses `role="alert"` with assertive live behavior, and non-danger uses `role="status"` with polite live behavior.
- Activation guidance remains static while autosave transition announcements continue to use the dedicated autosave owner.

## Commands Run

| Command | Result | Notes |
| --- | --- | --- |
| `npm ci` | Passed | npm reported 7 audit advisories and allow-scripts warnings for `core-js` and `esbuild`. |
| `npm run lint` | Failed, pre-existing baseline | 167 repository-wide errors outside the changed activation files, including known parse and unused-import debt. |
| `npx eslint src/components/activation/CSActivationShell.jsx src/components/design-system/CSActivationPrimitives.jsx --quiet` | Passed | Focused lint for changed activation code. |
| `git diff --check` | Passed | No whitespace errors. |
| `npm run typecheck` | Passed | Ran after the final rebase. |
| `npm run build` | Passed | Vite build completed with the existing large-chunk warning. |
| `node work/prompt2-browser/browser-validate.mjs --surface=activation --url=http://127.0.0.1:5174/work/prompt2-browser/activation.html` | Passed | Local scratch harness; not committed. |
| `node scripts/validate-phase-a-foundation-review.mjs` | Passed | Prompt #16D rerun on 2026-07-20; 6 viewport checks. Initial run timed out during Vite/browser warm-up before assertions. |
| `node scripts/validate-phase-a-activation-review.mjs` | Passed | Prompt #16D rerun on 2026-07-20; 38 checks across persistence states, viewport matrix, keyboard viewports, and transition evidence. |

## Browser Matrix

Validated viewport sizes:

- 1440 x 900
- 1280 x 820
- 1024 x 768
- 768 x 900
- 390 x 844
- 375 x 667

Validated behavior:

- Current, complete, available, upcoming, blocked, and unavailable step states render distinctly.
- Blocked "Payments" step remains keyboard-focusable.
- Blocked reason is visible and referenced by `aria-describedby`.
- DOM-dispatched blocked-step click does not call the selection handler.
- Activation shell does not create duplicate DOM IDs.
- No horizontal page overflow was detected in the tested viewport matrix.

## Accessibility Checks

- Named step navigation uses a `nav` landmark and ordered list.
- Current step uses `aria-current="step"`.
- Blocked and unavailable step controls use `aria-disabled`, not native `disabled`.
- Blocked-state reason text is exposed through `aria-describedby`.
- Save state uses shared autosave status semantics.
- Focus visibility and touch-target sizing were preserved by the shared design-system classes.
- Reduced-motion CSS remains present in the activation stylesheet path.

## Responsive Checks

- Desktop keeps the structural navy step rail and white guided workspace.
- Tablet and mobile use compact progress and single-column content.
- Sticky footer actions remain reachable.
- No desktop sidebar is forced into mobile.
- No clipping or horizontal overflow was found in the tested viewports.

## Known Limitations

### Pre-existing repository debt

- Full `npm run lint` remains blocked by repository-wide baseline debt outside this branch.
- Windows checkout still has the known case-only `Pagination.jsx` / `pagination.jsx` artifact.
- Local scratch harness files remain untracked and intentionally excluded from the PR.

### Infrastructure and control-plane issues

- Base44 Pages exposure, missing Cloudflare Worker/security headers, and sync drift are outside this branch.

### Phase A limitations

- This branch provides the activation shell foundation only.
- No production activation route is connected.
- No Base44 entity or persistence contract is changed.
- Autosave states are represented through props; production persistence remains a later adapter task.

## Recommendation

Ready for Worker #3 UX and accessibility review with documented non-blocking limitations. Do not merge until PR #1353 is accepted and the stacked PR order is confirmed.
