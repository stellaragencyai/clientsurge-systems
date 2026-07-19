# PR #1355 Phase A Remediation Evidence

Branch: `feature/clientsurge-activation-os-shell`

Scope: Activation OS remediation for issue #1375 rows A-ACT-01 through A-ACT-06. This branch remains draft and is not merge-authorized.

## Engineering Corrections

- A-ACT-01: Blocked steps remain keyboard-focusable with `aria-disabled="true"` and `aria-describedby`. The reason text now includes why it is blocked, the missing requirement, the unlock action, and where the action occurs.
- A-ACT-02: Autosave states now distinguish `dirty`, `saving`, `saved_local`, `saved_remote`, `offline`, and `error`; local persistence is not labeled as service persistence.
- A-ACT-03: Autosave live-region behavior is restrained. `dirty`, `saving`, and `saved_local` do not repeatedly announce; `saved_remote`, `offline`, and `error` announce meaningful transitions.
- A-ACT-04: Added `CSSafeResumeNotice` to explain preservation scope, resume location, and loss risk.
- A-ACT-05: Mobile footer actions use fixed safe-area-aware positioning at narrow widths. Validator covers 390 x 520 and 375 x 500 virtual-keyboard-like reduced heights.
- A-ACT-06: Added review fixture support for nine-step comprehension with stage summary, completed-step context, and mobile blocker summary without changing the underlying step architecture.

## Repeatable Commands

```powershell
npx eslint src/components/activation/CSActivationShell.jsx src/components/design-system/CSActivationPrimitives.jsx src/components/design-system/index.js src/review/phase-a-activation/ActivationReviewHarness.jsx src/review/phase-a-activation/activation-entry.jsx scripts/validate-phase-a-activation-review.mjs --quiet
git diff --check
npm run typecheck
npm run build
node scripts/validate-phase-a-activation-review.mjs
```

## Review Harness

Development-only harness:

```text
/review/phase-a-activation/?state=dirty
/review/phase-a-activation/?state=saving
/review/phase-a-activation/?state=saved_local
/review/phase-a-activation/?state=saved_remote
/review/phase-a-activation/?state=offline
/review/phase-a-activation/?state=error&keyboard=1
```

This harness is committed under `review/phase-a-activation/` and `src/review/phase-a-activation/`. It is not mounted in production navigation.

## Latest Local Results

- Focused ESLint: passed.
- `git diff --check`: passed.
- `node scripts/validate-phase-a-activation-review.mjs`: passed, 38 checks.

The validator covers 1440 x 900, 1280 x 820, 1024 x 768, 768 x 900, 390 x 844, 375 x 667, plus 390 x 520 and 375 x 500 reduced-height mobile cases.

Generated screenshots are written to `work/phase-a-activation-review/results` and are intentionally not committed.

## Remaining Manual Worker #3 Checks

- Screen-reader smoke review beyond automated axe checks.
- Whether the nine-step grouping and blocker summary feel understandable to an owner.
- Mobile keyboard behavior on a real browser/device.
- Final UX/polish scoring.
