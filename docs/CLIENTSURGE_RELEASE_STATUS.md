# ClientSurge Release Status

Last updated: 2026-07-02

## Current release posture

Status: **GitHub-first hardening in progress. Base44 production publish is not yet approved.**

The active release objective is to make the public website forms, checkout handoff, Base44 sync path, and live smoke checks provable before additional feature work.

## Production targets

- Website: `https://clientsurgesystems.com`
- Base44 app: `ClientSurge Systems`
- Base44 app ID: `69dc4a79656fdba136d413d3`
- GitHub repo: `stellaragencyai/clientsurge-systems`
- Release tracking issue: `#1218`

## GitHub hardening completed

| Area | Status | Proof |
|---|---:|---|
| Shared input / Contact editability | Done | `bdfa8608dcaa3a49ab5c80b0a331047060c43aca` |
| Resource download email validation | Done | `373880206ca955355a63eafb8bc69c296d53c371` |
| Exit-intent popup validation | Done | `34843cff055d198014ba10d2c63627cba1aa1d62` |
| Lead capture modal validation | Done | `46d04e001857972c197c61d11979322c442f3512` |
| Med spa demo modal validation | Done | `3f495edeea6a35aaa0e8780d7b0b40ebec786d25` |
| Inline demo booking validation | Done | `05151ec17051a4d7b0514530dd635fe58adc33ad` |
| Opt-out preference validation | Done | `cfe162545ec21130a6ea45a7a880e36642fb9b52` |
| Start / installation intake validation | Done | `f145bff3515736be063e5501713592d83cbc12ea` |
| Forgot password email validation | Done | `518a1c863cd82279c5e121c7432bfa051e3b0ab0` |
| Reset password strength validation | Done | `486a6fa34f28c37531a72759d74b932b264f81e2` |
| Base44 sync workflow optional guard fix | Done | `d2ad6419201a22c7b66aa278ca728c83616c613c` |
| Build Proof workflow | Done | `766f5dbe7edc38ae9c8e96241b9224182614bb8c` |
| Public form safety scan | Done | `cf284ce69018c3a116fa66848bc42b3a326908cb` |
| Public form release checklist output | Done | `bcd6db297dbc880769909830a2d6036ea8667251` |

## Blocked or still pending

| File / Area | Status | Required action |
|---|---:|---|
| `src/pages/ProductSignup.jsx` | Blocked by GitHub tool safety layer | Patch locally or attempt smaller targeted diff. Revenue path; do not ignore. |
| `src/components/forms/IndustryQualificationForm.jsx` | Blocked by GitHub tool safety layer | Patch locally or smaller route. Needs trimmed submit payload and success check. |
| `src/components/landing/LeadCaptureForm.jsx` | Blocked by GitHub tool safety layer | Patch locally or smaller route. Multi-step hidden fields need final validation. |
| `src/components/forms/DemoBookingModal.jsx` | Pending | Review and patch if needed; current code already has meaningful validation. |
| Build Proof workflow visibility | Unknown | Confirm Actions produce visible pass/fail status. |
| Base44 publish | Not approved | Wait for GitHub proof and controlled sync. |
| Live production smoke test | Not complete | Run after Base44 controlled publish. |

## Current release rule

Do not treat a change as production-safe until this chain is true:

```text
GitHub commit -> Build Proof visible -> public form scan acceptable -> controlled Base44 sync/publish -> live smoke pass
```

## Base44 rule

No broad Base44 builder edits are approved while GitHub proof is incomplete. Base44 edits previously created instability, so Base44 should be used only through the controlled sync/publish path after GitHub proof.

## Immediate next actions

1. Classify open PR backlog.
2. Add production smoke-test script.
3. Add manual QA checklist.
4. Add rollback runbook.
5. Attempt remaining blocked files with smaller diffs or document local patch instructions.
6. Confirm Build Proof workflow status visibility.
7. Prepare controlled Base44 publish checklist.
