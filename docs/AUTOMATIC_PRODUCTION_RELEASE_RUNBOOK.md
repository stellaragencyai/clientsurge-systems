# ClientSurge Automatic Production Release

## Objective

After an approved pull request is merged into `main`, deploy the exact merged frontend artifact to Base44, verify the same Git commit is live on `clientsurgesystems.com`, run smoke checks, and preserve release proof without requiring a manual Publish click.

## Canonical chain

```text
PR merged into main
→ ClientSurge Release Gate succeeds for the exact main SHA
→ ClientSurge Production Release acquires the production lock
→ exact SHA is checked out
→ public/release.json is stamped with that SHA
→ app is built and release-gate tests run
→ Base44 CLI uploads dist with `base44 site deploy -y`
→ endpoint fallback is attempted only if CLI deployment fails
→ UI Publish click is available only as an explicitly enabled emergency fallback
→ /release.json must report the exact merged SHA
→ public routes and checkout smoke checks run
→ immutable proof artifacts are retained
```

## Safety properties

- Production releases only from `main`.
- Dirty worktrees are rejected.
- One concurrency group owns production deployment.
- The two historical publishers are manual-only fallbacks and no longer auto-trigger.
- A changed asset hash is not sufficient proof; the live `/release.json` SHA must equal the merged GitHub SHA.
- Failed deployment or verification does not advance the local last-published state.
- UI clicking is disabled by default.

## GitHub-hosted operation

Required repository secrets:

- `BASE44_AUTH_JSON` or `BASE_44_AUTH_JSON`: fresh Base44 CLI auth JSON.
- `BASE44_STORAGE_STATE_JSON`: only required when the emergency UI fallback is explicitly enabled.

Required environment:

- GitHub environment named `production`.
- Recommended: restrict environment deployment to `main` and add approval only during the initial proof period. Remove manual approval after two successful controlled releases.

Canonical workflow:

```text
.github/workflows/clientsurge-production-release.yml
```

Manual proof run:

1. Open GitHub Actions.
2. Select `ClientSurge Production Release`.
3. Run against a harmless commit already on `main`.
4. Keep `allow_ui_fallback` false.
5. Confirm the artifact contains `production-release-proof.json` and `live-release-sha-proof.json`.

## Windows always-on publisher

This path is the immediate fallback while GitHub Actions issue #1271 remains unresolved.

Prerequisites on the publisher machine:

- Git
- Node.js 22+
- PowerShell 7 (`pwsh`)
- Base44 CLI authentication completed once with `npx base44@latest login`
- A clean mirror at `C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror`

Install the one-minute scheduled publisher from an elevated PowerShell terminal:

```powershell
cd C:\Users\nolan\Code\ClientSurge\clientsurge-systems
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts\sync\install-exact-production-release-task.ps1 -StartNow
```

The task runs:

```text
scripts/base44/watch-main-exact-release.ps1
```

It fast-forwards the clean mirror, waits for the exact main release gate unless explicitly bypassed, deploys, verifies the live SHA, and only then records the commit as published.

One-time controlled execution:

```powershell
cd C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror
pwsh -NoProfile -File scripts\base44\watch-main-exact-release.ps1 -Once
```

Emergency execution while GitHub Actions cannot start jobs:

```powershell
pwsh -NoProfile -File scripts\base44\watch-main-exact-release.ps1 -Once -SkipGitHubChecks
```

Use `-SkipGitHubChecks` only after running the required build and release-gate tests independently.

## Release proof

The deployed build exposes:

```text
https://clientsurgesystems.com/release.json
```

Expected payload fields:

- `sha`
- `short_sha`
- `repository`
- `branch`
- `built_at`
- `app_id`

A release is successful only when the live `sha` equals the exact source commit.

## Rollout order

1. Merge this automation PR.
2. Repair GitHub Actions issue #1271 or install the Windows publisher.
3. Refresh Base44 authentication.
4. Run one harmless controlled release.
5. Confirm exact-SHA proof, homepage, pricing, automations, industries, product signup, and checkout smoke.
6. Keep the legacy endpoint and UI workflows manual-only.
7. After two successful releases, treat the canonical workflow as the normal production path.
