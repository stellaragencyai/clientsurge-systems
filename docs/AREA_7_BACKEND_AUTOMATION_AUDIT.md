# Area 7 — Backend Functions, Automations, Twilio, Resend, and Base44 Integrations

## Scope

This area covers Base44 backend functions, scheduled automation processors, Twilio send/receive paths, Resend send/webhook paths, booking/review/digest functions, function source-of-truth drift, provider evidence, and observability guardrails.

## Important note

This audit does **not** assume the automations were broken. The goal is regression-proofing: make it harder for a future change to silently remove provider logging, webhook validation markers, deployed-source clarity, or traceability.

## What changed

- Added `scripts/audit-area7-functions.mjs`, a repo-level inventory scanner for every directory under `base44/functions`.
- Added `tests/area7BackendFunctionAudit.test.js`, a Node test that proves the scanner covers the whole functions directory and critical automation functions.
- Added this audit document to define Area 7 scope and known verification expectations.

## 10 flaws / risks addressed

1. There was no single automated inventory that scanned every Base44 function directory.
2. Critical automations were easy to audit by memory only, which risks missing less obvious functions.
3. `entry.ts` vs `main.ts` deployed-source ambiguity could cause edits to land in the wrong file.
4. Provider-touching functions were not automatically classified as Twilio, Resend/email, Stripe/billing, webhook, or scheduled processor.
5. Critical automation functions had no shared contract test proving they still exist in `base44/functions`.
6. Webhook functions had no repo-level static audit category for validation/signature markers.
7. Provider-touching functions had no repo-level static audit category for obvious live secret literals.
8. Traceability markers such as `request_id`, `metadata_json`, `context_id`, provider IDs, or communication logs were not inventoried consistently.
9. Observability markers such as `CommunicationEvent`, `logAutomationExecution`, `AutomationExecutionLog`, status callbacks, or deployment health recalculation were not inventoried consistently.
10. The audit process did not distinguish deployed source files from reference/stale source files.

## Critical functions covered by the Area 7 contract test

- `automationOrchestrator`
- `receiveTwilioMissedCallWebhook`
- `receiveResendWebhook`
- `sendInstantLeadResponseSms`
- `sendWebsiteLeadResponse`
- `processWebsiteLeadFollowUps`
- `processMissedCallFollowUps`
- `processNurtureCampaigns`
- `sendDailyDigest`
- `dailyDigestGate`
- `handleBookingTrigger`
- `triggerAutoReviewRequest`
- `sendReviewRequest`
- `scheduleFollowUpSMS`

## How to run the audit locally

```bash
node scripts/audit-area7-functions.mjs --write
node --test tests/area7BackendFunctionAudit.test.js
```

The `--write` option creates `tmp/area7-function-audit.json` with a function-by-function inventory, deployed source file, provider classification, and findings.

## Verification expectation after merge

- CI/node tests should include `tests/area7BackendFunctionAudit.test.js`.
- The audit should scan the full `base44/functions` directory, not only hand-picked automations.
- Critical automation functions should be explicitly inventoried.
- Provider functions should be classified without exposing live provider secrets.
- Future PRs that delete or rename critical backend automation functions should be caught by the contract test.

## Production/Base44 note

This patch adds audit/test coverage and documentation. It does not by itself prove Base44 has published anything live. A live Base44 publish must still be verified separately from the GitHub merge.
