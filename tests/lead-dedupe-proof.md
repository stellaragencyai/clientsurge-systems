# Lead Dedupe Proof

This checklist proves CRM lead truth without deleting real data.

## Non-destructive rule

Do not delete or merge leads during proof. Mark, quarantine, or exclude first.

## Required proof cases

1. Same email and same phone resolves to an existing canonical `Leads` row where expected.
2. Same phone with different formatting normalizes consistently.
3. Same email with different casing normalizes consistently.
4. WebsiteLead to Leads linkage stores the canonical CRM lead ID.
5. Fake/test/smoke leads are excluded from production dashboard totals.
6. Duplicate candidates are flagged for review with keeper evidence.
7. Lead status, CRM stage, and lead state do not contradict each other after automated updates.

## Keeper rules

A keeper must be chosen by evidence strength:

- provider-linked communication history
- real customer identity
- order/payment linkage
- consent evidence
- latest meaningful activity

Newest row alone is not enough.

## Pass condition

Lead dedupe passes only when duplicate submissions do not inflate production dashboard metrics and no real data is deleted.
