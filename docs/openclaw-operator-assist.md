# OpenClaw Operator Assist For Canonical Install Ops

This document describes the safe OpenClaw operating model for this repo as it exists today.

It is not a second admin system.
It is not autopilot.
It does not replace `/admin`.

OpenClaw is allowed to:
- read canonical install state
- summarize blockers and next actions
- generate advisory setup suggestions
- run validation harnesses
- call safe canonical backend endpoints

OpenClaw is not allowed to:
- write source-of-truth records directly
- bypass admin auth, backend guards, or `CommunicationEvent`
- make unattended `Live` decisions
- send uncontrolled production messaging

## Where OpenClaw Should Help

Best current uses:
- inspect a paid order and summarize blockers, readiness, and next actions
- summarize `CommunicationEvent` activity for an install
- run the canonical backend validation harness
- summarize provider readiness and latest provider tests
- suggest copy/defaults from canonical order context
- explain why a transition or runtime test is blocked

Best current non-writing workflows:
- post-purchase install checklist generation
- per-service setup summary for an operator
- "what should I do next?" summaries for the selected order
- surfacing machine-readable action recommendations for tooling

## What OpenClaw Should Not Do Yet

Do not use OpenClaw for:
- unattended `Move to Live`
- direct `Order`, `Order.items[]`, `Order.install_configuration`, or `CommunicationEvent` mutation
- direct entity writes from scripts or sidecars
- unsupervised production SMS/email sending
- pretending provider readiness or successful delivery exists when it has not been observed canonically
- inventing live scheduler behavior for placeholder runtimes

## Safe Operating Model

OpenClaw must follow this repo-specific model:

1. Read canonical state first.
   - Use `getInstallConfiguration`
   - Or use the OpenClaw-specific read-only assist endpoint `getOpenClawInstallAssist`

2. Make recommendations, not hidden changes.
   - Suggestions are advisory until an operator explicitly saves them in `/admin`

3. Use only canonical backend endpoints for writes.
   - `updateInstallConfiguration`
   - `updateInstallStatus`
   - canonical runtime test endpoints
   - provider test endpoints

4. Let backend rules stay authoritative.
   - Testing gates stay backend-enforced
   - Live gates stay backend-enforced
   - blocked transitions remain blocked

5. Keep all meaningful actions auditable.
   - successful and blocked runtime attempts must still land in `CommunicationEvent`
   - settings/provider tests must still log canonically

## Repo Support Added For OpenClaw

### 1. Read-only machine summary endpoint

Endpoint:
- `base44/functions/getOpenClawInstallAssist/entry.ts`

Purpose:
- return a concise, machine-readable operator assist payload for one paid order
- summarize command view, blockers, service readiness, provider readiness, timeline signals, and manual approval boundaries

Safety:
- admin auth required
- read-only
- no direct record mutation
- no alternate write path

### 2. Canonical install validation harness

Script:
- `scripts/openclaw/run-install-validation.mjs`

Package command:
- `npm run openclaw:validate-install`

Purpose:
- run the core canonical install/runtime/workspace/provider/webhook tests
- emit a concise summary for operator tooling
- support `--json` for machine consumption

This is the recommended first automation flow for OpenClaw in this repo.

## Recommended Local Setup

1. Work from the repo root:
   - `C:\Base44Projects\clientsurge-systems`

2. Use the same authenticated environment an admin operator would use.
   - OpenClaw should authenticate as an admin user for backend reads/writes

3. Prefer calling canonical backend functions instead of direct entity access.
   - Reads:
     - `getOpenClawInstallAssist`
     - `getInstallConfiguration`
     - `getIntegrationHealth`
     - `testProviderConnections`
   - Writes:
     - `updateInstallConfiguration`
     - `updateInstallStatus`
     - canonical runtime test endpoints only

4. Keep `/admin` as the human approval surface.
   - OpenClaw can suggest
   - the operator approves and executes high-risk actions

## Exact OpenClaw-Friendly Workflows

### Workflow A: Run canonical install validation

Command:

```bash
npm run openclaw:validate-install
```

JSON mode:

```bash
node scripts/openclaw/run-install-validation.mjs --json
```

What it does:
- runs the canonical install test suites
- summarizes pass/fail by file
- returns non-zero exit on failure

What it does not do:
- mutate install state
- call live providers
- bypass backend guards

### Workflow B: Inspect a paid order safely

Preferred endpoint:
- `getOpenClawInstallAssist`

Required input:
- `order_id`

What the assist payload gives OpenClaw:
- order summary
- command view
- blocker queue
- top backend-derived actions
- per-service readiness
- recent canonical timeline summary
- provider readiness snapshot
- explicit manual-approval-required boundaries

### Workflow C: Suggest next operator actions

OpenClaw should:
1. call `getOpenClawInstallAssist`
2. read `command_view`
3. read `blocker_queue`
4. summarize:
   - which service to configure first
   - which service can move to Testing
   - which service can go Live only with human approval
   - what exact blocker must be fixed first

## What Remains Manual

These actions still require explicit human approval:
- any `Move to Live`
- any production-facing outbound messaging decision
- provider credential setup
- Twilio phone assignment/verification
- final template review for compliance or brand quality
- any ambiguous linking/manual repair case
- any action taken while `pipeline_error` is present

## What Is Still Blocked By Twilio / EIN Restoration

OpenClaw cannot prove:
- real production SMS delivery
- full production missed-call behavior
- full Twilio account restoration

OpenClaw can still help with:
- canonical config review
- readiness summaries
- test harness validation
- blocked-state diagnosis

## How To Avoid Bypassing Canonical Behavior

Do:
- read from canonical backend functions
- write through canonical backend functions
- respect returned blockers and allowed transitions
- treat suggestions as advisory

Do not:
- script direct entity writes
- create new local state files as install truth
- infer readiness that the backend did not derive
- auto-promote to `Live`

## Recommended OpenClaw Prompt Shape

Good prompt:

> Inspect paid order `ORDER_ID` using canonical backend read models, summarize blockers and next actions, suggest config copy only where safe, and do not perform Live actions without explicit approval.

Bad prompt:

> Fully set up this client automatically and push everything live.
