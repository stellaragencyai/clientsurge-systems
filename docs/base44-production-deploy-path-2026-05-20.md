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
- `base44 functions list` now succeeds after the 2026-05-22 automation metadata repair.
- 2026-05-22 07:16 America/Phoenix: pulled the deployed `installPipeline` function into a throwaway temp Base44 project, not the repo, and inspected the remote bundle. The deployed function now includes the required `ClientProject` create/update fields: `client_email`, `contact_email`, `client_name`, and `business_name`.

## Resolved CLI Auditability Failure

Before the repair, `base44 functions list` failed with:

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

Raw authenticated API inspection on 2026-05-22 confirmed those indices correspond to:

- `functions[37]`: `monthlyClientReport`
- `functions[99]`: `generateWeeklyReport`
- `functions[176]`: `generateSocialContent`

The malformed field was the scheduled-simple automation payload shape. The deployed records included `repeat_interval: null`, while Base44 CLI `0.0.51` validates `repeat_interval` as optional but, when present, requires a positive integer.

Resolved on 2026-05-22 04:27 America/Phoenix through the Base44 editor automation API, not the Backend Platform `backend-functions` deploy endpoint:

- `monthlyClientReport`: monthly schedule set to interval `1`.
- `generateWeeklyReport`: weekly null schedule set to interval `1`; existing valid weekly schedule stayed interval `1`.
- `generateSocialContent`: weekly schedules set to interval `1`; the two "Bi-Weekly" schedules set to interval `2`.

Verification:

- `base44 functions list` completed and listed 237 remote functions.
- Raw authenticated backend-functions read confirmed no remaining `repeat_interval: null` scheduled-simple automations on `monthlyClientReport`, `generateWeeklyReport`, or `generateSocialContent`.

## Why This Blocks Launch

The purchase-to-onboarding smoke previously failed because production backend behavior appeared stale against the current source. The latest deployed-code inspection suggested the specific `ClientProject` required-field mismatch may now be fixed remotely, and the controlled behavioral proof has now confirmed it.

2026-05-22 07:38 America/Phoenix: `npm run openclaw:purchase-onboarding-smoke -- --json` passed 7/7 production handoff checks. The smoke created temporary QA Order, Client, ClientProject, OnboardingClient, and CommunicationEvent records, then deleted all eight created records successfully in the same run.

## Safe Internal Work Completed

- Verified the CLI/auth state.
- Reconfirmed the deployed function listing blocker.
- Reconfirmed the production app ID.
- Identified the exact malformed automation attachment targets via raw authenticated Base44 API read.
- Repaired only the invalid automation `repeat_interval` metadata through the editor automation endpoint.
- Verified `base44 functions list` succeeds.
- Pulled deployed `installPipeline` into a temp project for read-only comparison and confirmed the remote bundle contains the required `ClientProject` fields.
- Revised the OpenClaw purchase-to-onboarding smoke runner so cleanup is enabled by default and can be disabled with `--no-cleanup`.
- Ran the cleanup-safe production purchase-to-onboarding smoke and confirmed the deployed Order -> Client -> ClientProject -> OnboardingClient handoff passes.
- Documented the exact production decision required before live deploy proof.

## Required Production Decision

Choose one path:

1. Keep current Base44 website app as production and use the Base44 UI/support-supported workflow to publish backend/entity changes.
2. Move production backend to a CLI-compatible Backend Platform app, then confirm domain/routing before switching `clientsurgesystems.com`.

## Approval-Sensitive Next Actions

These are production-facing and should be executed as one explicit deploy packet:

1. Keep the current Base44 production deploy decision documented for future backend/entity changes.
2. Proceed to Stripe test-mode checkout/webhook proof in a confirmed staging/test Base44 target.
3. Do not run a live payment proof until Nolan approves package, amount, card owner, test contact details, and refund/no-refund plan.

## Recommended Next Move

Proceed to Stripe test-mode checkout/webhook proof in a confirmed staging/test Base44 target. CLI auditability is restored and the deployed `installPipeline` behavior has been proven, so the remaining launch proof is provider-path validation rather than another Base44 source inspection.
