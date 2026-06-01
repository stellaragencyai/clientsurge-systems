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
pwsh -NoProfile -File scripts/sync/ensure-base44-sync-mirror.ps1 `
  -RepoUrl "https://github.com/stellaragencyai/clientsurge-systems.git" `
  -MirrorPath "C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror"
```

Install the mirror updater:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/sync/install-base44-sync-task.ps1 `
  -RepoPath "C:\Users\nolan\Code\ClientSurge\clientsurge-systems" `
  -MirrorPath "C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror" `
  -ActiveRef "merge/base44-69f-into-production-69dc" `
  -IntervalMinutes 15
```

Active feature branches never auto-pull. Use the overlap report in `logs/base44-sync/<machine>/` before merging `origin/main` into active work.

## Immediate production publish

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

Only one machine should run the production publisher. Desktop is primary; laptop is failover.

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
