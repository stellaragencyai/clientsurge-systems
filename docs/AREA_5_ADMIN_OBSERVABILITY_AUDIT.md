# Area 5 — Admin Dashboard, Mission Control, and Observability

## Scope

This area covers admin dashboard truthfulness, Mission Control system health, automation activity visibility, operational proof labels, stale/missing data handling, and internal confidence indicators.

## 10 flaws fixed in this area

1. `getSystemObservabilityMetrics` treated missing automation job data as a bad success rate instead of unknown evidence.
2. Messaging health could be labeled healthy when there were zero SMS/email events in the sampled records.
3. `getSystemObservabilityMetrics` allowed only `admin`, blocking `super_admin` from a top-level observability endpoint.
4. Observability responses did not include stable request IDs for support/debugging.
5. Observability responses did not expose data coverage by entity source.
6. The System Observability UI described the dashboard as real-time without clearly saying the numbers are posted-record samples.
7. Automation activity returned empty logs without warning that empty results are unknown coverage, not operational proof.
8. Automation activity did not report logs missing `client_deployment_id` or logs pointing to missing `ClientDeployment` records.
9. Automation activity UI said no action was needed / systems operational when no failed logs were visible in the filtered sample.
10. There were no Area 5 regression tests guarding against fake operational health claims.

## Files changed

- `base44/functions/getSystemObservabilityMetrics/entry.ts`
- `base44/functions/getAutomationActivity/entry.ts`
- `src/components/mission-control/SystemObservabilityDashboard.jsx`
- `src/components/admin/AutomationActivityPanel.jsx`
- `tests/area5ObservabilityContracts.test.js`

## Verification expectation

After merge and Base44 publish:

- System Observability should display a truth label: posted records only, not live provider proof.
- Missing job/event sources should render `Unknown`, not `Healthy` or `Issue` by default.
- Automation Activity should show data coverage and warnings when logs are missing, filtered, or orphaned.
- Empty automation samples must not display "all systems operational" language.
- Backend observability responses should include `request_id`, `data_coverage`, and `coverage_warnings`.
