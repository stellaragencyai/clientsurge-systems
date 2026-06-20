# ClientSurge Base44 Sync Control System

This repo already had most of the Base44 mirror/publish machinery. The problem was not that the system was missing; the problem was that it needed to be made explicit, locked to the correct production app, and paired with a GitHub validation gate.

## Production target

- Base44 app name: ClientSurge Systems
- Base44 app ID: `69dc4a79656fdba136d413d3`
- Built-in URL: `grinning-apex-flow-growth.base44.app`
- Production URL: `https://clientsurgesystems.com`
- GitHub repo: `stellaragencyai/clientsurge-systems`
- Deployment branch: `main`

## What exists now

### 1. GitHub validation gate

Workflow added:

```text
.github/workflows/base44-sync-control.yml
```

It runs on pull requests and pushes to `main`:

1. Install dependencies.
2. Build the app.
3. Run Node tests.
4. Run Base44 publish automation safety tests.
5. Optionally run Deno tests from manual dispatch.
6. Optionally run live root-domain and `www` redirect smoke checks from manual dispatch.

This is not a live publish job. It is the gate that keeps bad commits from being treated as publish-ready.

### 2. Local production sync installer wrapper

Wrapper added:

```text
scripts/sync/install-clientsurge-base44-production-sync.ps1
```

It installs the existing scheduled sync task using the existing lower-level installer:

```text
scripts/sync/install-base44-sync-task.ps1
```

The wrapper locks the install to the production Base44 app and production URL before it installs the task.

## Why the local publisher exists

The existing Base44 publish implementation uses local Base44 authentication and/or the local browser profile. That is safer to run from Nolan's machine or a dedicated self-hosted publisher than to blindly store browser/session credentials in repo code.

The local publisher flow is:

```text
origin/main changes
→ clean mirror fast-forwards
→ GitHub checks are waited on
→ build/tests run locally
→ Base44 production app is published
→ clientsurgesystems.com is verified
```

## Install the production sync task

Run this from an elevated PowerShell session on the machine that should act as the publisher:

```powershell
cd C:\Users\nolan\Code\ClientSurge\clientsurge-systems
pwsh -File scripts\sync\install-clientsurge-base44-production-sync.ps1
```

Dry run first:

```powershell
pwsh -File scripts\sync\install-clientsurge-base44-production-sync.ps1 -DryRun
```

Install as failover publisher instead of primary:

```powershell
pwsh -File scripts\sync\install-clientsurge-base44-production-sync.ps1 -PublisherRole Failover -FailoverDelayMinutes 5
```

Mirror only, no publishing:

```powershell
pwsh -File scripts\sync\install-clientsurge-base44-production-sync.ps1 -PublisherRole MirrorOnly
```

## Manual one-time publish from a clean mirror

From a clean mirror on `main`:

```powershell
npm run base44:watch-main-publish -- -Once
```

Or direct API publish:

```powershell
npm run base44:publish-api
```

## Safety rules

Do not bring back the old reckless behavior:

```text
local change → immediate publish to live site
```

The allowed production pattern is:

```text
feature change → pull request → checks pass → merge to main → controlled Base44 sync/publish → smoke check
```

## DNS assumptions

Current production DNS pattern:

```text
clientsurgesystems.com       A      216.24.57.1         DNS only
www.clientsurgesystems.com   CNAME  base44.onrender.com Proxied
www redirect rule            www → https://clientsurgesystems.com
```

Do not proxy the root domain unless there is a deliberate Cloudflare edge strategy. The `www` hostname is proxied only so Cloudflare can redirect it before Base44 returns an internal error.

## Troubleshooting commands

Check the current sync task:

```powershell
Get-ScheduledTask | Where-Object TaskName -like '*Base44*'
```

Run the mirror update once:

```powershell
npm run sync:mirror -- -PublishAfterUpdate -PublisherRole Primary
```

Check Base44 app access:

```powershell
npm run base44:check-app
```

Check live routes:

```powershell
npm run smoke:public-routes -- --base-url=https://clientsurgesystems.com
```

Check root and www from PowerShell:

```powershell
curl.exe -I https://clientsurgesystems.com/
curl.exe -I https://www.clientsurgesystems.com/
```

Expected:

```text
clientsurgesystems.com      200 OK
www.clientsurgesystems.com  301/302 redirect to https://clientsurgesystems.com/
```

## What still requires a real machine

GitHub can validate the repository. The actual Base44 publish should run from a machine that has:

1. Git installed.
2. PowerShell available as `pwsh`.
3. Node dependencies installed.
4. Base44 CLI or persistent Base44 browser login already authenticated.
5. A clean mirror worktree.

If the local task fails, do not guess. Run:

```powershell
npm run sync:doctor
npm run sync:status
```
