# ClientSurge Systems — Launch Proof Requirements

This file defines what counts as release evidence.

## Source of truth

Required:

- `package.json` exists in the primary repo.
- Public page source exists.
- Admin dashboard source exists.
- Base44 functions, entities, or configuration are present or documented.
- Build and install commands are documented.
- Release and rollback path are documented.

## Business proof

Required:

- Real production record evidence exists.
- Dashboard status matches the source records.
- Test, smoke, QA, and internal records are excluded from production metrics.

## Messaging proof

Required:

- Provider callback path is configured.
- Message logs store a real provider identifier.
- Final status is reconciled.
- Failed records store a reason.

## CRM proof

Required:

- Test and internal leads are excluded or quarantined.
- First-pass cleanup is non-destructive.
- Duplicate candidates preserve review evidence.
- Dashboard counts only trusted production records.

## Public website proof

Required:

- Public pages load on desktop and mobile.
- CTAs navigate correctly.
- Internal/admin routes are protected.
- Conversion events are verified.

## Final launch approval

Final approval requires all launch gates clear, the dashboard truth layer safe for launch, the primary repo confirmed, business proof recorded, messaging proof recorded, and public site source matching the approved branch.
