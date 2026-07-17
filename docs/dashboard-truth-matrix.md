# Dashboard Truth Matrix

Every dashboard status must resolve to one of four canonical classifications.

| Classification | Required evidence | Disqualifiers | UI behavior |
|---|---|---|---|
| Trusted | Explicit `trusted` band, at least one persisted evidence source, no blockers, warnings, stale sources, missing sources, or legacy dependencies | Any blocker, warning, stale/missing source, no evidence, unsupported status, legacy source | Green label; may be treated as safe to trust |
| Unverified | Some evidence exists, but warnings, stale proof, legacy dependencies, unknown state, or unsupported optimistic status remain | Blocking condition or missing instrumentation | Amber label; display the reason; never imply production proof |
| Broken | Blocking condition or canonical blocked/broken status | None | Red label; display blocker count and remediation context |
| Needs Instrumentation | No evidence or one or more required proof sources are missing | Blocking condition takes precedence and becomes Broken | Blue label; identify missing proof sources |

## Enforcement rules

1. A blocker always prevents Trusted status.
2. No evidence always becomes Needs Instrumentation.
3. Missing required proof becomes Needs Instrumentation.
4. Warnings, stale evidence, unknown states, and legacy dependencies become Unverified.
5. Unsupported labels such as `healthy`, `active`, or `complete` are not trusted unless translated through canonical persisted evidence.
6. Manual or optimistic UI state never overrides `DashboardTruthCheck` evidence.

The executable classifier lives in `src/lib/dashboardTruthMatrix.js`. The admin scoring panel applies it to every returned truth-check row and exposes the classification reason.