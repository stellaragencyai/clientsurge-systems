# Launch Gates And Proof Engine

ClientSurge does not launch because many tasks are done. ClientSurge launches only when critical gates pass with evidence and any risky action has the exact manual approval required for that action.

## Gate List

1. Business Foundation Gate
2. Website Production Gate
3. Domain / DNS Gate
4. Email / Resend Gate
5. Stripe / Payments Gate
6. CRM / Leads Gate
7. Booking / Calendar Gate
8. Outreach / Campaign Gate
9. Client Onboarding Gate
10. Security / Compliance Gate
11. Fulfillment / Support Gate
12. Command Center Gate
13. First 25-Lead Campaign Gate

## Gate Statuses

- `locked`: a critical gate has no passing proof evidence.
- `blocked`: a non-critical gate is waiting on proof or owner work.
- `partial`: some proofs passed, but the gate is not fully proven.
- `ready_for_proof`: the next safe action is a read-only scan, local test, or dry-run proof.
- `proof_running`: a proof check is in progress.
- `proof_failed`: a proof check failed and must be repaired before unlock.
- `proof_passed`: every required proof has passing evidence attached.
- `approved`: proof passed and a matching manual approval record exists.
- `waived`: a manual waiver exists with a reason. Waivers must be visible and cannot hide missing proof.

## Gate Severity

- `advisory`: useful readiness signal, but not a launch blocker by itself.
- `launch_blocker`: blocks the related launch lane until proof or waiver exists.
- `critical_blocker`: blocks the top launch verdict until proof, approval, or waiver exists.

## Approval-Required Actions

These actions require manual approval and must not be unlocked from assumptions:

- Production deploy
- Real campaign send
- CRM dedupe, merge, or delete
- Stripe live action
- DNS change
- Base44 production environment change
- Sending real customer email
- Changing checkout or payment logic
- Changing provider credentials
- Changing auth or security behavior

## Allowed Automatic Actions

The proof engine may support these actions without manual approval:

- Read-only scans
- Local tests
- Source audits
- Dry-run previews
- Creating GitHub issues
- Creating proof records
- Updating dashboard status from evidence

## Launch Verdict Rules

- `LAUNCH LOCKED`: any `critical_blocker` gate is not `proof_passed`, `approved`, or `waived`.
- `READY FOR 25-LEAD TEST`: Email, Booking, CRM, Outreach, Website, and Security gates are `proof_passed` or `approved`, with no critical blocker still locked.
- `READY FOR LIVE PAYMENTS`: Stripe gate is `proof_passed` and `approved`.
- `READY FOR FULL CAMPAIGN`: 25-lead and 50-lead campaign proof gates have passing evidence.

## Proof Source Rules

Proof can come from tests, scripts, provider dashboards, Base44 records, GitHub issues, or Google Drive proof artifacts, but a pass status without evidence is not a pass.

Examples:

- Website route proof should come from `scripts/public-route-smoke.mjs` or equivalent live route evidence.
- Email DNS proof should come from `scripts/email/dns-email-readiness.mjs` plus dashboard proof for provider-only checks.
- Stripe proof should include test checkout, webhook, Order, Client, OnboardingClient, and failed-payment evidence before any live payment proof.
- CRM proof should include schema verification, lead counts, usable lead counts, duplicate dry-run output, suppression fields, and a first 25-lead preview dry-run.
- Outreach proof should include segmentation, 50-recipient cap, DNC/unsubscribe/bounce/terminal suppression, List-Unsubscribe headers, and explicit approval before real sends.

## Manual Waiver Rules

A waiver must include `gate_key`, waiver actor, timestamp, and `waiver_reason`. Waivers are visible in the dashboard and should be used only when the owner accepts a known risk. A waiver does not create hidden proof and does not permit any separate approval-required action.

## Why Gates Cannot Be Marked Passed Without Evidence

The launch system controls actions that can affect money, customers, DNS, provider credentials, compliance, and live reputation. A green label without evidence would be more dangerous than no label because it would make risky work look safe. The proof engine therefore treats `proof_passed` without an evidence summary as blocked.

## Implementation Map

- Entity schema: `base44/entities/LaunchGate.jsonc`
- Approval schema: `base44/entities/LaunchApproval.jsonc`
- Read-only proof engine: `src/lib/launchGates.js`
- Dashboard surface: `src/components/admin/LaunchGatesPanel.jsx`
- Admin tab: `src/internal-pages/AdminDashboard.jsx?tab=launch-gates`
- Regression tests: `tests/launchGatesProofEngine.test.js`
