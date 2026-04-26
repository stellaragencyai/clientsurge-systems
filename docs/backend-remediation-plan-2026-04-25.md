# Backend Remediation Plan

Date: 2026-04-25
Repository: `stellaragencyai/clientsurge-systems`
Working copy: `C:\Base44Projects\clientsurge-systems-scan-20260425`

## Goal

Repair the previously identified backend flaws and easy fixes in controlled batches of 25 without introducing visual regressions or unintended cross-system behavior changes.

## Safety Rules

1. Restrict changes to backend function handlers, shared backend helpers, and backend-facing schemas only.
2. Do not make intentional UI, styling, layout, routing, or marketing-content changes.
3. Prefer the smallest safe fix over broad refactors.
4. Preserve existing data contracts unless a contract bug must be corrected.
5. Verify each batch before moving to the next one.
6. Record anything deferred because it needs more product or architectural decisions.

## Batch Plan

### Batch 1

Items 1-25

Primary focus:
- Authentication and authorization gaps
- Webhook trust and unsafe public service-role endpoints
- Billing and campaign correctness issues
- Duplicate declaration / compile blockers

### Batch 2

Items 26-50

Primary focus:
- Export and reporting safety issues
- Analytics and funnel correctness
- LLM result validation
- Lead insight and sentiment handler hardening

### Batch 3

Items 51-75

Primary focus:
- Call recording ingestion safety
- Win-back flow correctness
- Notification hardening
- Auditability and delivery tracking

### Batch 4

Items 76-100

Primary focus:
- Follow-up and nurture enrollment logic
- Portal email safety
- Lead/contact intake correctness
- Data hygiene and dedupe behavior

## Progress Log

### 2026-04-25

- Created remediation plan document.
- Pushed plan to GitHub on branch `codex/backend-remediation-2026-04-25`.
- Began Batch 1 implementation in the clean latest clone to avoid disturbing dirty local worktrees.
- Fixed the Stripe invoice webhook compile blocker and narrowed failed-payment campaign pauses to the affected customer email.
- Replaced fake invoice payment-link generation with real Stripe invoice URL retrieval plus ownership checks.
- Added client portal ownership checks to invoice retrieval and Stripe payment-update URL generation.
- Tightened subscription change validation to require a real target plan and avoid stale pending plan state.
- Added Resend webhook signature verification and JSON validation to email tracking.
- Made email campaign sends idempotent enough to reuse recipients safely and mark failed recipients correctly.
- Prevented drip and qualified follow-up runners from stamping send timestamps when delivery did not happen.
- Increased multiple analytics and campaign processing caps to reduce silent truncation.
- Added method guards and admin-or-automation gating to several automation-triggered handlers.
- Hardened call recording ingestion with Twilio signature verification, safer metadata storage, larger lead matching scope, and lead-status application from AI next-step recommendations.
- Hardened admin/client notification mailers with admin checks, lead-record validation, and communication audit events.
- Corrected lead and contact intake handling so real website fields are preserved, honeypots use dedicated fields, duplicate updates preserve prior context, and production email senders no longer use `@resend.dev`.
- Added optional `AUTOMATION_SHARED_SECRET` support for anonymous scheduled runners so cron-style endpoints can be locked down without breaking current behavior before the secret is configured.
- Replaced the custom lead pipeline summary implementation with the shared canonical `leadPipeline` snapshot builder used by the admin lead dashboard.
- Replaced the missed-call recovery metric heuristic with canonical missed-call runtime success events.
- Updated the portal welcome mailer to validate inputs, require admin access, use the current portal URL, and fail if the admin notification email send fails.
- Added explicit data-window and truncation metadata to admin analytics, lead scoring, client lead-flow metrics, and funnel/export responses so capped datasets no longer look complete.
- Continued reviewing remaining portal-scoping and scheduler-auth gaps for fixes that can be applied safely without changing UI behavior or inventing unsupported data relationships.

## Verification Approach

- Static review of changed handlers and helpers.
- Targeted syntax/test execution where the local environment supports it.
- Git diff review after each batch.

## Deferred / Needs Research

- Full per-client lead scoping for some portal metrics and exports is constrained by the current data model because `Leads` does not consistently carry a tenant/project ownership key.
- Full lock-down of anonymous scheduled endpoints depends on rolling out `AUTOMATION_SHARED_SECRET` (or another scheduler identity mechanism) in the deployment environment.
