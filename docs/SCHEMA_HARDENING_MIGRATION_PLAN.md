# ClientSurge Schema Hardening Migration Plan

Parent: #1308
Tracking: #1325

## Objective
Remove ambiguous production data states by adding explicit truth metadata, strict classifications, and traceable analytics fields without breaking existing records.

## Migration Order

1. Additive schema expansion
- Add new fields first.
- Preserve existing records.
- Avoid destructive enum changes until backfill is complete.

2. WebsiteLead hardening

Required fields:
- environment
- dashboard_excluded
- dashboard_exclusion_reason
- dashboard_truth_status
- quality_reason_codes
- quality_reviewed_at
- quality_reviewed_by
- duplicate_of_lead_id
- submission_count
- first_submission_at
- last_submission_at

Controlled values:

lead_quality:
- unreviewed
- valid
- suspicious
- internal_test
- duplicate
- disqualified

follow_up_priority:
- urgent
- high
- normal
- low
- none

3. ConversionTrackingEvent hardening

Add:
- environment
- client_id
- page_url
- route
- consent_state
- release_version
- tracking_version
- dashboard_excluded
- dashboard_truth_status

Require event_id idempotency.

4. LandingPageAnalytics proof fields

Add:
- source_event_count
- source_event_first_at
- source_event_last_at
- calculation_version
- calculated_at
- calculated_by
- proof_status

Every aggregate must map back to trusted source events.

5. OnboardingOrchestration governance

Canonical state remains:
- unified_stage

Secondary statuses become derived projections.

6. Backfill sequence

Run in this order:
1. Classify environment
2. Repair unknown records
3. Assign dashboard truth status
4. Populate lineage fields
5. Verify analytics reconciliation
6. Enable enforcement guards

## Safety Rules

- No fake verification records.
- No automatic promotion of unknown data to production.
- No deletion of ambiguous legitimate records.
- All repairs produce audit evidence.
