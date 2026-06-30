# Lead Quality Backfill Runbook

## Purpose

This runbook covers the non-destructive lead quality backfill added after the trusted dashboard and intake guardrail work.

The backfill exists because the dashboard cleanup controls protect views going forward, but historical fake/test/smoke/raw-import rows may still exist in Base44. The backfill scans existing `Leads` and `WebsiteLead` rows and applies safe review markings so the existing database becomes easier to manage.

## What it does

### Leads

For obvious fake, internal, test, raw-import, or duplicate-marker records, it marks the canonical `Leads` row as one of:

- `quality_review_status: quarantine_candidate`
- `quality_review_status: duplicate_candidate`

It also writes:

- `quality_reason`
- `quality_reason_codes`
- `quality_confidence`
- `audited_at`

### WebsiteLead

For obvious fake/internal/test WebsiteLead rows, it applies:

- `archived: true`
- `lead_status: ignored`
- `automation_enabled: false`
- `cadence_paused: true`
- `quality_notes`

## What it does not do

- It does not delete records.
- It does not touch Stripe.
- It does not touch Twilio configuration.
- It does not send SMS or email.
- It does not change records with booking, reply, conversion, payment, or engagement evidence.

## Admin usage

Open:

`Admin → Lead Quality Control`

Use the new buttons in the blue guardrail banner:

1. `Dry-Run Existing Backfill`
2. Review the result summary and samples.
3. If the results are correct, click `Apply Non-Destructive Backfill`.
4. Type `BACKFILL JUNK` when prompted.
5. Re-open Leads / Website Leads and confirm trusted views changed as expected.

## Function usage

Function name:

`backfillLeadQualityGuards`

Dry run payload:

```json
{
  "scope": "both",
  "apply": false,
  "page_size": 500,
  "max_pages": 10
}
```

Apply payload:

```json
{
  "scope": "both",
  "apply": true,
  "confirm_phrase": "BACKFILL JUNK",
  "page_size": 500,
  "max_pages": 10
}
```

## Safe rollout order

1. Dry-run only.
2. Check counts and sample names.
3. Apply non-destructive backfill.
4. Run Lead Quality Control audit.
5. Export flagged rows.
6. Use `Delete Verified Junk` only after the backfill has stabilized and only in small batches.
