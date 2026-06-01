# ClientSurge Base44 Merge and Sync Runbook

Last updated: 2026-06-01

## Canonical source

- Production repo: `C:\Users\nolan\Code\ClientSurge\clientsurge-systems`
- GitHub source of truth: `https://github.com/stellaragencyai/clientsurge-systems`
- Production Base44 app: `69dc4a79656fdba136d413d3`
- Production domain: `https://clientsurgesystems.com`
- Donor/staging Base44 app: `69f959e2bc665e019e19840c`

`69dc4a79656fdba136d413d3` owns production. `69f959e2bc665e019e19840c` is a donor/staging mirror unless the production domain is intentionally moved.

## Merge policy

Keep these production assets authoritative:

- `base44/.app.jsonc` and local `.env.local`
- publish scripts in `scripts/base44/`
- tests, launch docs, security docs, public assets, and live-domain config
- email routing and production URL defaults

Import from the donor app only when a complete feature slice can be validated: entity/function metadata, backend function, UI route or component, dependency, and test coverage. Do not import donor files that downgrade tests, remove production security gates, change the app ID, or route production traffic to the donor app.

## Desktop and laptop setup

Each machine should have one active clone and one clean mirror:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/sync/bootstrap-base44-machine.ps1 `
  -RepoPath "C:\Users\nolan\Code\ClientSurge\clientsurge-systems" `
  -MirrorPath "C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror" `
  -PublisherRole MirrorOnly `
  -IntervalMinutes 1
```

Install the desktop as the primary publisher:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/sync/bootstrap-base44-machine.ps1 `
  -RepoPath "C:\Users\nolan\Code\ClientSurge\clientsurge-systems" `
  -MirrorPath "C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror" `
  -ActiveRef "merge/base44-69f-into-production-69dc-pushable" `
  -PublisherRole Primary `
  -PublishAfterUpdate `
  -IntervalMinutes 1
```

Install the laptop as failover, after `base44 login` succeeds on that laptop:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/sync/bootstrap-base44-machine.ps1 `
  -RepoPath "C:\Users\nolan\Code\ClientSurge\clientsurge-systems" `
  -MirrorPath "C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror" `
  -ActiveRef "merge/base44-69f-into-production-69dc-pushable" `
  -PublisherRole Failover `
  -PublishAfterUpdate `
  -FailoverDelayMinutes 3 `
  -IntervalMinutes 1
```

Active feature branches never auto-pull. Use the overlap report in `logs/base44-sync/<machine>/` before merging `origin/main` into active work.

Check the whole sync/publish posture from either machine:

```powershell
npm run sync:status
npm run sync:status -- --json
npm run sync:status -- --live-security
```

The status audit compares GitHub `origin/main`, the active checkout, the clean mirror, Base44 last-published SHA, production app access, scheduled task results, Cloudflare monitor state, and donor-app-ID leakage.

Repair local automation on either computer:

```powershell
npm run sync:doctor -- -ExpectedPublisherRole Primary
npm run sync:repair-automation -- -PublishAfterUpdate -PublisherRole Primary -StartTasks
```

On the laptop, use `-ExpectedPublisherRole Failover` for the doctor and `-PublisherRole Failover -FailoverDelayMinutes 3` for repair. The doctor writes `logs/base44-sync/<machine>/machine-doctor-latest.json` with tool versions, GitHub/Base44/Cloudflare auth state, active and mirror checkout state, scheduled task state, and sync-status evidence. The repair command reinstalls the Base44 sync/publish task, reinstalls the Cloudflare monitor, optionally starts both tasks to refresh Task Scheduler health, writes `logs/base44-sync/automation-repair-latest.json`, and runs `npm run sync:status`.

## Immediate production publish

Every push to GitHub `main` runs the `ClientSurge Release Gate` workflow. The desktop/laptop Base44 publisher waits for that workflow to pass for the exact `main` commit before it publishes production. This keeps GitHub `main` as the single source of truth while still allowing near-immediate Base44 deployment after CI is green.

Check the release gate for a specific commit:

```powershell
npm run github:wait-main-ci -- -Sha <main-commit-sha>
```

The guarded production publisher is:

```powershell
npm run base44:publish-api
```

For continuous desktop publishing after `origin/main` changes, run from the clean mirror worktree, not from an active feature branch:

```powershell
cd C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror
npm run base44:watch-main-publish
```

First-time Base44 login:

```powershell
node scripts/base44/publish-deploy-endpoint.mjs `
  --app-id 69dc4a79656fdba136d413d3 `
  --verify-url https://clientsurgesystems.com `
  --show-browser `
  --dry-run
```

Only one machine should publish immediately. Desktop runs `PublisherRole Primary`; laptop runs `PublisherRole Failover`, waits three minutes, checks the Base44 app `updated_date`, and only publishes if the primary did not already move production.

After production publishes, the default watcher also refreshes the donor/staging Base44 app from the same source. It writes `logs/base44-publish/last-published-all.json`, and `npm run sync:status` fails if that multi-app state does not match GitHub `main`.

For emergency manual publishing only, the watcher accepts `-SkipGitHubChecks`. Keep the scheduled desktop and laptop publishers on the default GitHub-gated path.

Check the production app/auth connection at any time:

```powershell
npm run base44:check-app -- --json
```

Publish production plus optional staging mirrors from the same source when you intentionally want both Base44 apps refreshed:

```powershell
npm run base44:publish-all
npm run base44:publish-all -- --dry-run --include-stellar-mirror
```

Production app `69dc4a79656fdba136d413d3` is required. Donor/staging app `69f959e2bc665e019e19840c` and Stellar mirror app `6a15f1424f4856ba4e9ed90b` are optional by default so a staging permission issue cannot block the live site.

## Cloudflare edge security

Base44 does not currently apply `public/_headers` or serve `/.well-known/security.txt` for this managed-source app. Cloudflare owns those production edge controls:

- Worker source: `cloudflare/clientsurge-security-edge-worker.mjs`
- Wrangler config: `wrangler.clientsurge-security.toml`
- Routes: `clientsurgesystems.com/*` and `www.clientsurgesystems.com/*`

Dry-run the Worker package:

```powershell
npm run cloudflare:security:dry-run
```

Deploy after Wrangler has access to the `clientsurgesystems.com` zone:

```powershell
npm run cloudflare:security:login
npm run cloudflare:security:release
```

Or install the monitor so this machine keeps checking and auto-releases as soon as Wrangler auth exists:

```powershell
npm run cloudflare:security:install-monitor
npm run cloudflare:security:monitor
```

The monitor writes its latest state to `logs/cloudflare-security/<machine>/latest-security-edge-status.json`. If production security already passes it records `verified`; if Wrangler is not logged in it records `auth_required` without marking the scheduled task failed; if Wrangler is logged in it runs the guarded release and verification sequence.

The Worker proxies Base44, injects CSP/Permissions-Policy/COOP, keeps Base44 editor `frame-ancestors` allowed, marks sensitive app routes `noindex` and `no-store`, serves `/.well-known/security.txt`, and redirects `www` to the canonical host.

## Required verification

Before publishing:

```powershell
npm run build
npm run test:node
npm run test:deno
node --test tests/base44PublishAutomation.test.js tests/adminLoginFlow.test.js
npm run smoke:public-routes
npm run verify:production-security
```

After publishing, verify:

- live asset hash or deploy timestamp moved
- `https://clientsurgesystems.com` serves the new UI
- production API traffic uses `69dc4a79656fdba136d413d3`
- `69f959e2bc665e019e19840c` does not leak into production output
