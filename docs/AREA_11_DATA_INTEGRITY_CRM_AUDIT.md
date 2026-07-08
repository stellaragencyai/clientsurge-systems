# Area 11 — Data Integrity, CRM, and Entity Relationships

## Scope

This area covers the core entity model that makes ClientSurge truthful: lead capture, CRM linkage, order records, client projects, deployments, automation execution logs, communication logs, message records, tenant scoping, dashboard truth labels, and runtime/schema alignment.

## What changed

- Updated `CommunicationEvent` schema to support compliance/guardrail events already written by automation/runtime code.
- Updated `Messages` schema to support outbound address fields and unmatched inbound message evidence.
- Added `scripts/audit-area11-data-integrity.mjs` to audit core entity contracts.
- Added `tests/area11DataIntegrityContracts.test.js` to lock CRM/order/deployment/log relationships.

## 10 flaws / risks addressed

1. Runtime code could write `sms_blocked`, but `CommunicationEvent.event_type` did not allow it.
2. Runtime code could write `email_blocked`, but `CommunicationEvent.event_type` did not allow it.
3. Runtime code could write `outbound_hold`, but `CommunicationEvent.event_type` did not allow it.
4. Runtime code could write providers such as `internal_guardrail` or `internal_compliance_guard`, but `CommunicationEvent.provider` did not allow them.
5. Runtime code could write `blocked` or `skipped` statuses, but `CommunicationEvent.status` did not allow them.
6. Outbound SMS code wrote `to_address`, but `Messages` did not define that field.
7. Message evidence could not cleanly represent unmatched inbound messages because `Messages` required `lead_id`.
8. `Messages` did not define provider/message-id/from/to metadata fields needed for stronger auditability.
9. There was no repo-level contract test ensuring Order → ClientProject → ClientDeployment → AutomationExecutionLog → CommunicationEvent relationship fields stay intact.
10. There was no data-integrity audit script to catch entity schema drift before dashboards or automations start lying.

## Files changed

- `base44/entities/CommunicationEvent.jsonc`
- `base44/entities/Messages.jsonc`
- `scripts/audit-area11-data-integrity.mjs`
- `tests/area11DataIntegrityContracts.test.js`
- `docs/AREA_11_DATA_INTEGRITY_CRM_AUDIT.md`

## Core contracts now audited

- `Order`
- `ClientProject`
- `ClientDeployment`
- `AutomationExecutionLog`
- `CommunicationEvent`
- `Messages`
- `WebsiteLead`

## How to run

```bash
node scripts/audit-area11-data-integrity.mjs --write
node --test tests/area11DataIntegrityContracts.test.js
```

The `--write` option creates:

```text
tmp/area11-data-integrity-audit.json
```

## Operator rule

If runtime code writes a new `CommunicationEvent.event_type`, `provider`, `status`, `Messages.status`, or message address/provider field, the entity schema must be updated in the same change. Otherwise dashboards, observability, and client portal proof can become inconsistent.

## Production/Base44 note

This PR changes entity schemas and tests in GitHub. It does not prove Base44 has published the entity schema updates live. Production proof still depends on Area 12 release artifacts after merge.
