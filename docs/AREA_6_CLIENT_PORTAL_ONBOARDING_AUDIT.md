# Area 6 — Client Portal, Onboarding, and Setup Status

## Scope

This area covers client-facing portal access, setup status, order linkage, onboarding routing, credential intake verification, support/debug references, and truth labels around setup progress.

## 10 flaws fixed in this area

1. `getClientPortalContext/entry.ts` and `main.ts` could drift as separate implementations.
2. Client portal context responses did not include stable request IDs for support/debugging.
3. Client portal context responses did not include data coverage or a proof label explaining the source of portal status.
4. Portal context did not clearly distinguish no paid order, direct project-only context, multiple paid businesses, missing canonical links, missing linked records, and fully linked portal access.
5. Client portal access loading/rendering errors could imply setup status changed instead of being clearly labeled as session/render problems.
6. Unauthenticated portal copy did not clearly state that portal data appears only after a paid order or client project is linked.
7. `/setup/status` could show generic setup progress even when the URL had no verified order ID.
8. `/setup/status` swallowed backend errors without giving the client a support reference.
9. `/setup/credentials` could redirect to pricing on verification failure instead of explaining the missing/unverified setup source.
10. `/setup` sent completed setup users toward admin paths instead of back to client portal progress.

## Files changed

- `base44/functions/getClientPortalContext/main.ts`
- `base44/functions/getClientPortalContext/entry.ts`
- `src/components/portal/ClientPortalAccess.jsx`
- `src/internal-pages/SetupStatus.jsx`
- `src/internal-pages/CredentialsSetup.jsx`
- `src/internal-pages/BusinessSetup.jsx`
- `tests/area6ClientPortalContracts.test.js`

## Verification expectation

After merge and Base44 publish:

- `/client-portal` should show stable private portal access messaging and never imply setup status changed due to auth/render delay.
- `getClientPortalContext` should return `request_id`, `portal_truth_label`, `data_coverage`, and explicit `link_status`.
- `/setup/status` should not show progress without a verified order ID.
- `/setup/credentials` should not silently redirect to pricing when verification fails.
- `/setup` completion should return the client to `/client-portal/progress`.
