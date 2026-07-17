# Admin dashboard real-source proof

This document records the Phase 3 dashboard source contract.

| Card | Canonical source | Proof-safe behavior |
|---|---|---|
| Install Status | `ClientInstallationOS` | Loads persisted install records, shows the source label, merges duplicate client rows, and renders explicit loading, error, and empty states. |
| Estimated LTV | Paid `Order` records | Uses setup and monthly values as an estimate only. The UI labels the value `Estimated LTV` and warns that Stripe reconciliation is required before treating it as collected revenue. |
| Churn Risk | Numeric `Order.churn_risk_score` only | Shows an unconfigured, neutral state when no instrumented score exists. It does not infer churn from order age, status, or missing activity. |

## Evidence fields

- `ClientInstallationOS.website_status`
- `ClientInstallationOS.activation_status`
- `ClientInstallationOS.workflow_stage`
- `Order.total_setup` or `Order.pricing_summary.total_setup`
- `Order.total_monthly` or `Order.pricing_summary.total_monthly`
- `Order.churn_risk_score`

## Enforcement

Regression coverage in `tests/adminDashboardRealSources.test.js` prevents removal of the source labels, estimate warning, neutral churn state, and canonical entity queries.
