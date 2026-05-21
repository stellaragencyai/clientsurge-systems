# Base44 Production Deploy Path - 2026-05-20

## Verdict

The next launch-critical blocker is not source code. The local repo is ahead of the deployed backend, but the current Base44 production app cannot be fully audited or deployed through the CLI until the Base44 app/deploy path is resolved.

## Confirmed State

- Current linked Base44 app ID: `69dc4a79656fdba136d413d3`.
- GitHub `main` is synced to the latest verified ClientSurge source.
- Local verification after the latest launch sprint is clean:
  - `npm run test:node` passed `182/182`
  - `npm run test:deno` passed `11/11`
  - `npm run build` passed with existing Vite warnings only
- `base44 whoami` works for `nolanfstrommer@gmail.com`.
- `base44 functions list` still fails before listing deployed functions because deployed function automation metadata is malformed.

## Current CLI Failure

`base44 functions list` fails with:

```text
Invalid input
  -> at functions[37].automations[0]
  -> at functions[99].automations[0]
  -> at functions[176].automations[0]
  -> at functions[176].automations[1]
  -> at functions[176].automations[2]
  -> at functions[176].automations[3]
  -> at functions[176].automations[4]
  -> at functions[176].automations[5]
  -> at functions[176].automations[6]
```

Based on local alphabetical function order, those likely correspond to:

- `createDemoCalendarEvent`
- `initializeInstallOS`
- `sendInstantLeadResponseSms`

This mapping is an inference from local ordering, not Base44 server confirmation, because the CLI fails before returning the function list.

## Why This Blocks Launch

The purchase-to-onboarding smoke previously failed because production backend behavior appeared stale against the current source. The local code has fixed and proven the activation path, but production needs the updated backend/entity behavior before Stripe checkout/webhook proof can be trusted.

## Safe Internal Work Completed

- Verified the CLI/auth state.
- Reconfirmed the deployed function listing blocker.
- Reconfirmed the production app ID.
- Identified the likely malformed automation attachment targets.
- Documented the exact production decision required before live deploy proof.

## Required Production Decision

Choose one path:

1. Keep current Base44 website app as production and use the Base44 UI/support-supported workflow to publish backend/entity changes.
2. Move production backend to a CLI-compatible Backend Platform app, then confirm domain/routing before switching `clientsurgesystems.com`.

## Approval-Sensitive Next Actions

These are production-facing and should be executed as one explicit deploy packet:

1. Fix or remove malformed Base44 automation metadata for the affected deployed functions.
2. Re-run `base44 functions list` until it succeeds.
3. Publish backend/entity changes through the chosen Base44 production workflow.
4. Re-run `npm run openclaw:purchase-onboarding-smoke`.
5. Only after that passes, proceed to Stripe test-mode catalog/webhook proof.

## Recommended Next Move

Use the Base44 UI first to inspect the automation attachments for `createDemoCalendarEvent`, `initializeInstallOS`, and `sendInstantLeadResponseSms`. The goal is to repair invalid automation metadata without changing runtime business logic. Once `base44 functions list` succeeds, the team can confirm the actual deploy surface instead of guessing.
