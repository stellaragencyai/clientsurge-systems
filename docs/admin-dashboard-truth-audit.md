# Admin Dashboard Truth Audit

This pass checks whether admin dashboard data is verified, estimated, missing, or only advisory.

## Findings

1. `src/internal-pages/AdminDashboard.jsx` overview reads real sources: lead pipeline summary, paid `Order` records, and `OnboardingClient` records.
2. `src/components/admin/AdminDashboardCards.jsx` calculates Total LTV from order setup/monthly fields and elapsed months. That is an estimate, not verified collected revenue.
3. `ChurnRiskPanel` previously displayed “No churn risk detected” when no scores existed. Missing scores are not proof of low churn risk.
4. `Recent Paid Orders` did not clearly flag paid orders missing `client_project_id`, install timestamps, or workflow stage.

## Truth rules

- Missing records must be labeled as missing, not zero.
- Estimated values must say estimated.
- Advisory AI/system scores must say advisory.
- Paid orders missing provisioning proof must be surfaced on the admin overview.
