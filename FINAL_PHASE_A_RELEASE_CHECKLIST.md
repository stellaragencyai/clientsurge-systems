# Final Phase A Release Checklist

Date: 2026-07-20

## PR Order

1. Merge PR #1353: `feature/clientsurge-design-system-2-1-shell` at `0bcd0b4b5ec5945b4ef8436978a5ec247a72d781`.
2. Merge PR #1355: `feature/clientsurge-activation-os-shell` at `d3e94c16a937fa120ca892a3a2920c1740c555cc`.
3. Merge PR #1356: `feature/clientsurge-command-center-foundation` after it contains PR #1355.

## Required Checks

- Confirm PR #1355 still has PR #1353 as its merge base.
- Confirm PR #1356 contains PR #1355 by ancestry.
- Confirm GitHub Actions status for #1353, #1355, and #1356.
- Confirm Worker #3 final UX/accessibility approval.
- Confirm Worker #2 merge authorization before pressing any merge button.

## Local Validation

Run from the final aligned stack:

```powershell
node scripts/validate-phase-a-foundation-review.mjs
node scripts/validate-phase-a-activation-review.mjs
node scripts/validate-phase-a-command-center-review.mjs
```

Required results:

- Foundation: PASS.
- Activation: PASS.
- Command Center: PASS.

## Contract Checks

- Static `CSAlert` usage must not create `role="alert"`, `role="status"`, or `aria-live`.
- Only explicit `announce=true` creates live announcement behavior.
- Activation autosave transitions must not duplicate live announcement text.
- Command Center must preserve unverified defaults such as `Data not verified` and `Action queue not verified`.

## Rollback

- If #1356 causes a post-merge issue, revert the #1356 merge commit first.
- If #1355 causes a post-merge issue, revert #1356 first if already merged, then revert #1355.
- If #1353 causes a post-merge issue, revert #1356 and #1355 first if already merged, then revert #1353.
- Prefer forward revert commits. Do not force push or rewrite shared branch history.

## Out Of Scope

- Do not add Phase B-F behavior.
- Do not connect production Activation persistence.
- Do not connect production Command Center data adapters.
- Do not change Base44 authentication, bootstrap, entity, or persistence contracts.
