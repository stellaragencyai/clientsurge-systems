# OpenClaw / Seraph Access Setup

Status date: 2026-05-21

Host: `flashnode01` (`neo@192.168.0.194`)

## What Was Configured

- OpenClaw gateway SecretRefs were moved to file-backed providers under `~/.openclaw/secrets/` so CLI diagnostics and the systemd gateway can resolve them without printing values.
- Telegram approval routing was configured for owner `telegram:7776809236`.
- Telegram native exec approvals were enabled for approver `7776809236`, delivered by DM.
- Gateway was restarted and is reachable on loopback with token auth.
- Local CLI device scope was repaired for operator admin/pairing so gateway approval inspection works.
- Exec policy remains `security=allowlist`, `ask=on-miss`, `askFallback=deny`.
- Safe wrapper scripts were installed under `~/.openclaw/safe-bin/`.
- GitHub CLI is authenticated as `stellaragencyai`.
- Git global identity was set on `flashnode01` to `stellaragencyai <stellaragencyai@users.noreply.github.com>`.
- Browser audit tooling was installed locally and copied to `/home/neo/openclaw-workspace/clientsurge-systems/tools/browser-audit`.
- Playwright Chromium and required Debian browser libraries were installed on `flashnode01`.
- Bounded autonomy wrappers were added for workspace trash, scoped cloud copy, branch-limited Git push, and project build/test/audit commands.

## Approval-Gated

These actions still require explicit approval:

- Any command not matched by a safe wrapper allowlist entry.
- `git add`, `git commit`, and `git init` when requested through raw exec.
- Raw `git push`, force push, protected branch push, and repo publishing.
- `gh repo create`, repo publishing, or permission changes.
- Any `rclone` read/download/copy/sync/delete/upload action outside the bounded cloud-copy wrapper.
- Gmail message reads, sends, deletes, or modifications.
- OneDrive/Drive downloads, uploads, edits, deletes, or syncs outside the `OpenClawAutonomy` folder.
- Raw destructive filesystem operations outside the workspace trash wrapper.
- Deploys, payment actions, publishing, or email sending.

## Safe Allowlist Entries

OpenClaw allowlists executable patterns, not individual argument strings. To avoid overgranting raw `git`, `gh`, `rclone`, or `gcloud`, only these wrapper scripts are allowlisted:

- `/home/neo/.openclaw/safe-bin/oc-status-google`
- `/home/neo/.openclaw/safe-bin/oc-status-git`
- `/home/neo/.openclaw/safe-bin/oc-status-cli`
- `/home/neo/.openclaw/safe-bin/oc-openclaw-health`
- `/home/neo/.openclaw/safe-bin/oc-github-readonly`
- `/home/neo/.openclaw/safe-bin/oc-rclone-readonly-status`
- `/home/neo/.openclaw/safe-bin/oc-system-readonly-status`
- `/home/neo/.openclaw/safe-bin/oc-seraph-health-check`
- `/home/neo/.openclaw/safe-bin/oc-seraph-latest-health`
- `/home/neo/.openclaw/safe-bin/oc-browser-audit-page`
- `/home/neo/.openclaw/safe-bin/oc-browser-screenshot-page`
- `/home/neo/.openclaw/safe-bin/oc-browser-audit-site`
- `/home/neo/.openclaw/safe-bin/oc-workspace-trash`
- `/home/neo/.openclaw/safe-bin/oc-cloud-copy`
- `/home/neo/.openclaw/safe-bin/oc-git-autopush`
- `/home/neo/.openclaw/safe-bin/oc-project-command`
- `/home/neo/.openclaw/safe-bin/oc-autonomy-status`

The wrappers cover these harmless checks:

- `gcloud auth list --filter=status:ACTIVE --format='value(account)'`
- `command -v gws`
- `command -v rclone`
- `rclone listremotes`
- `git status --short --branch`
- `git diff --stat`
- `git log --oneline -5`
- `gh auth status`
- `command -v node`
- `command -v npm`
- `command -v gh`
- `command -v gcloud`
- `command -v gws`
- `command -v rclone`
- `command -v playwright`
- `command -v npx`
- `command -v git`
- `node -v`
- `npm -v`
- `npx playwright --version`
- A public rendered-page audit of `https://clientsurgesystems.com`
- OpenClaw gateway/Telegram status
- OpenClaw exec policy snapshot
- SecretRef audit summary
- System uptime, disk, memory, and OpenClaw service status
- GitHub read-only auth and remote/status checks
- Google Drive and OneDrive top-level metadata samples
- Recoverable delete by moving files under `/home/neo/openclaw-workspace` to `~/.openclaw/trash/`
- Upload/download through rclone only inside `gdrive:OpenClawAutonomy/` or `onedrive:OpenClawAutonomy/`
- Commit and push only from repos under `/home/neo/openclaw-workspace` and only on `codex/*`, `seraph/*`, or `automation/*` branches
- Project commands limited to status, install, test, build, lint, and browser audits

## Autonomous Schedule

A systemd user timer runs a safe health report hourly:

- Timer: `~/.config/systemd/user/seraph-health-check.timer`
- Service: `~/.config/systemd/user/seraph-health-check.service`
- Command: `/home/neo/.openclaw/safe-bin/oc-seraph-health-check`
- Reports: `~/.openclaw/reports/seraph-health/`
- Latest report: `~/.openclaw/reports/seraph-health/latest.md`

The scheduled job is read/status/report-only. The additional autonomy wrappers are available for explicit agent tasks, but the timer itself does not send messages, read Gmail contents, download cloud files, commit code, push repos, publish content, deploy, or delete anything.

## Autonomy Model

Seraph can do these without interrupting Neo:

- Check its own OpenClaw/gateway/Telegram health.
- Check CLI/tool availability.
- Check GitHub auth and local git status.
- Check rclone remotes and top-level cloud metadata.
- Run public browser audits against `https://clientsurgesystems.com`.
- Save local reports and screenshots.
- Summarize current blockers from local status reports.
- Move workspace files to recoverable trash.
- Upload/download files in the dedicated `OpenClawAutonomy` cloud folder.
- Run limited project commands such as build, test, lint, install, and browser audits.
- Push commits only from safe automation branches.

Seraph should request approval for:

- Any raw shell command outside `/home/neo/.openclaw/safe-bin/`.
- Any protected-branch Git action, force push, branch/repo creation, or raw Git command outside the wrapper.
- Any `gh repo create`, issue mutation, PR creation, or release action.
- Any file download, upload, copy, sync, move, or delete through raw rclone.
- Any Gmail message read, draft, send, label modification, archive, or delete.
- Any web automation involving login, forms, checkout, posting, or account changes.

Seraph must not do these without a new explicit task and approval:

- Send emails or messages.
- Delete files locally or remotely outside the recoverable workspace trash lane.
- Push public changes.
- Publish posts.
- Deploy production changes.
- Trigger payments, refunds, subscriptions, or billing actions.
- Change OpenClaw safeguards broadly.

## Gmail / Google Drive Status

Tools found:

- `gcloud`: installed at `/usr/local/bin/gcloud`
- `gws`: installed at `/usr/bin/gws`
- `rclone`: installed at `/usr/bin/rclone`

Status:

- Gmail: not authenticated for Gmail user-data access. Do not read messages until a separate OAuth task is completed and approved.
- Google Drive: rclone remote `gdrive:` is configured and verified by top-level metadata listing only.
- Google Drive scoped upload/download: verified inside `gdrive:OpenClawAutonomy/healthcheck`.

Verification commands:

- `/home/neo/.openclaw/safe-bin/oc-status-google`
- `/home/neo/.openclaw/safe-bin/oc-cloud-copy upload gdrive: <workspace-source> gdrive:OpenClawAutonomy/<path>`
- `/home/neo/.openclaw/safe-bin/oc-cloud-copy download gdrive: gdrive:OpenClawAutonomy/<path> <workspace-cloud-inbox-dest>`
- `rclone lsf gdrive: --max-depth 1` was used previously for metadata-only verification.

## OneDrive Status

Tools found:

- `rclone`: installed at `/usr/bin/rclone`
- `onedrive`: installed at `/usr/bin/onedrive`

Status:

- OneDrive rclone remote `onedrive:` is configured and verified by top-level metadata listing only.
- The `onedrive` sync service is disabled so it does not modify files automatically.
- OneDrive scoped upload currently returns `unauthenticated` during write verification. Read/status checks still work; reconnect the `onedrive:` rclone remote before relying on autonomous upload/download.

Verification commands:

- `rclone listremotes`
- `rclone lsf onedrive: --max-depth 1` was used previously for metadata-only verification.
- `/home/neo/.openclaw/safe-bin/oc-cloud-copy upload onedrive: <workspace-source> onedrive:OpenClawAutonomy/<path>` was attempted and blocked by OneDrive authentication.

## GitHub Status

- `gh`: installed at `/usr/bin/gh`
- `gh auth status`: authenticated as `stellaragencyai`
- `git`: installed at `/usr/bin/git`
- `git user.name`: `stellaragencyai`
- `git user.email`: `stellaragencyai@users.noreply.github.com`

Allowed without extra approval:

- `/home/neo/.openclaw/safe-bin/oc-status-git`
- `/home/neo/.openclaw/safe-bin/oc-git-autopush <repo-under-openclaw-workspace> <message>` for branches named `codex/*`, `seraph/*`, or `automation/*`

Still approval-gated:

- Raw `git init`
- Raw `git add`
- Raw `git commit`
- Raw `git push`, protected branch push, or force push
- `gh repo create`

## Browser Tooling Status

Local repo tooling:

- `tools/browser-audit/package.json`
- `tools/browser-audit/scripts/audit-page.js`
- `tools/browser-audit/scripts/audit-site.js`
- `tools/browser-audit/scripts/audit-all-public-pages.js`
- `tools/browser-audit/scripts/crawl-site.js`
- `tools/browser-audit/scripts/screenshot-page.js`

Pi tooling:

- `/home/neo/openclaw-workspace/clientsurge-systems/tools/browser-audit`

Verification run:

- Local: `npm run audit:page -- --url https://clientsurgesystems.com --out reports/seraph-page-audit.json`
- Pi: `/home/neo/.openclaw/safe-bin/oc-browser-audit-page`

Reports:

- Local: `tools/browser-audit/reports/seraph-page-audit.json`
- Pi: `/home/neo/openclaw-workspace/clientsurge-systems/tools/browser-audit/reports/seraph-page-audit.json`

Screenshots:

- Local: `tools/browser-audit/screenshots/home-desktop-183acf1f.png`
- Local: `tools/browser-audit/screenshots/home-mobile-183acf1f.png`
- Pi: `/home/neo/openclaw-workspace/clientsurge-systems/tools/browser-audit/screenshots/home-desktop-183acf1f.png`
- Pi: `/home/neo/openclaw-workspace/clientsurge-systems/tools/browser-audit/screenshots/home-mobile-183acf1f.png`

## Remaining Notes

- `openclaw secrets audit` reports zero unresolved SecretRefs and one legacy OAuth residue in `auth-profiles.json`; that residue is out of scope for static SecretRef migration.
- Browser audit found the public page renders with HTTP 200, plus expected anonymous `401` from `/entities/User/me`, one blocked Unsplash image request, and automated accessibility/contrast findings.
- The Pi copy of `clientsurge-systems` under `/home/neo/openclaw-workspace/clientsurge-systems` is not currently a full Git repository, so `oc-git-autopush` needs a cloned repo or initialized repo before it can push.
