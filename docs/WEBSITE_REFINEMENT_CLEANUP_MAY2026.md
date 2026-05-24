# Website Refinement Cleanup - May 2026

This cleanup pass focused on removing inactive code from the active website and Base44 deploy surface while keeping every removal reversible.

## What Was Cleaned

### Base44 Functions

- Quarantined 57 deployable functions total.
- Current local deployable functions: 179.
- Function quarantine folders:
  - `base44/functions_quarantine/2026-05-first-pass`
  - `base44/functions_quarantine/2026-05-zero-reference-no-remote-automation`
  - `base44/functions_quarantine/2026-05-duplicate-unused`

See `docs/FUNCTION_PRUNE_FIRST_PASS_MAY2026.md` for the function-level list and restore notes.

### Frontend Components and Helpers

- Quarantined 123 zero-reference source files from active `src`.
- Quarantine folder:
  - `frontend_quarantine/2026-05-unused-zero-reference`

Selection rules:

- No non-documentation references in `src`, `tests`, `scripts`, or `base44`.
- Excluded shared UI primitives under `src/components/ui`.
- Excluded active routed pages and live imported modules.
- Used quarantine instead of hard deletion so Base44 visual work can restore any component if needed.

### Admin Copy Cleanup

- Updated the admin install checklist to reference `submitLeadCapture` instead of the retired `createLeadAndDispatch` endpoint.

### Dependencies

Removed unused direct dependencies:

- `@base44/vite-plugin`
- `@hello-pangea/dnd`
- `@hookform/resolvers`
- `@radix-ui/react-toast`
- `@stripe/react-stripe-js`
- `@stripe/stripe-js`
- `html2canvas`
- `jspdf`
- `lodash`
- `moment`
- `react-hot-toast`
- `react-leaflet`
- `react-quill`
- `zod`

Then ran `npm audit fix`, which resolved the remaining package advisories.

Current direct dependency count: 50.

## Verification

Passed:

- `npm run build`
- `npm run test:deno`
- `npm run base44:functions-check`
- `npm audit --audit-level=moderate`
- Targeted Node tests for setup instructions, legacy quarantine, and communication outbox migration.

## Follow-up Hardening Pass

- Updated the stale Blog route test to match the current lazy-loaded Blog page route.
- Narrowed `npm run typecheck` to typed source files so it now produces actionable signal instead of JSX migration noise.
- Added `npm run base44:automation-quarantine-audit` to confirm quarantined functions are not attached to remote Base44 automations.
- Archived 33 stale markdown/report files from `src` into `docs/archive/2026-05-src-reports`.
- Smoke-tested 10 core production routes locally: `/`, `/blog`, `/contact`, `/book`, `/store`, `/industries`, `/med-spa`, `/lead-capture-automation`, `/client-portal`, and `/admin`.

Additional passed checks:

- `npm run typecheck`
- `npm run base44:automation-quarantine-audit`
- `node --test tests/sixAutomations.test.js tests/pendingBacklogHardening.test.js`

## Restore Notes

Restore a frontend file by moving it back from `frontend_quarantine/2026-05-unused-zero-reference` to the same relative path under `src`.

Restore a function by moving it back from its `base44/functions_quarantine` folder to `base44/functions`.

After restoring anything, run:

```bash
npm run build
npm run test:deno
```
