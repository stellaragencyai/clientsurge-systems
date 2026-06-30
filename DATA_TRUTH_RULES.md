# ClientSurge Data Truth Rules

Purpose: keep fake, smoke, internal, duplicate, and orphan records out of production dashboards and launch proof.

## Truth hierarchy

1. Provider facts: Stripe, Twilio, Resend, GA4, and Base44 event/auth records.
2. Canonical Base44 entities: `Leads`, `WebsiteLead`, `Order`, `CommunicationEvent`, `CommunicationLog`, `AutomationJob`, `DeadLetterLog`, `ClientInstallationOS`, `AutomationChecklist`, and `ClientProject`.
3. Dashboard summaries derived from canonical rows.
4. Manual screenshots and notes as supporting evidence only.

Dashboards must never outrank source rows.

## Production-trusted rows

A row can support production proof only when it is clearly production, linked to real business context, and not marked test/internal/excluded. Provider activity must include provider evidence when available.

Useful trust fields:

- `environment`
- `dashboard_truth_status`
- `dashboard_excluded`
- `exclusion_reason`
- `source`
- `provider`
- `provider_message_id`
- `related_entity_id`
- `verified_at`
- `verified_by`

## Exclusion rules

Exclude a row from production proof when any of these are true:

- `dashboard_excluded=true`
- `is_sample=true`
- `dashboard_truth_status` is `blocked`, `internal`, or `excluded`
- email, source, business name, provider ID, or error text contains smoke/test/internal/backfill/proof patterns
- the row is orphaned and cannot be linked to lead, order, client, project, or provider context
- provider evidence is missing when provider proof is required

Excluded means not counted as production proof. It does not mean deleted.

## Duplicate rules

- Do not delete duplicates during release hardening.
- Do not merge duplicates unless keeper proof is explicit.
- The keeper should be the row with the strongest source/provider linkage, not automatically the newest row.
- Mark suspected duplicates for review before any destructive action.

## Messaging truth

- SMS `queued`, `accepted`, or `sent` is not delivery proof.
- SMS proof requires Twilio evidence plus delivery callback or manual recipient confirmation.
- Link click proof requires callback receipt and a `CommunicationEvent` row.
- If a click cannot be matched to a lead, record it as warning/unmatched, not trusted.
- Email proof requires provider evidence and manual inbox confirmation for launch-critical flows.
- Voice proof requires a real call result, not just a configured webhook URL.

## Stripe truth

- Pending Order is not revenue.
- Checkout session created is not revenue.
- Test-mode Stripe rows are not production revenue.
- Production payment proof requires paid status plus Stripe identity evidence.
- Live payment proof requires owner approval before execution.

## Dashboard truth

- Client-facing dashboards may show only production-trusted data.
- Admin dashboards may show excluded/internal rows only when clearly labeled.
- Production-linked failed/stuck jobs and dead letters are launch blockers until resolved or explicitly waived.
- Manual approval or waiver must not fabricate `proof_passed`.
