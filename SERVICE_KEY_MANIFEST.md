# Service Key Manifest

This manifest records connector configuration names and local config locations only. It must never contain actual token, refresh token, client secret, private key, API key, or password values.

## Gmail

Service name: Gmail

Config file location:
- Provider CLI secure store, if using GAM or another approved Gmail CLI.
- `~/.openclaw/secrets/google-gmail.env`, only if no secure CLI store is available.

Environment variable names:
- `GOOGLE_GMAIL_CLIENT_ID`
- `GOOGLE_GMAIL_CLIENT_SECRET`
- `GOOGLE_GMAIL_REFRESH_TOKEN`
- `GOOGLE_GMAIL_SCOPES`

Status: tooling installed on `flashnode01`; Gmail OAuth consent needed

Approved access level: full Gmail access

## Google Drive

Service name: Google Drive

Config file location:
- `~/.config/rclone/rclone.conf` for the `gdrive` remote.
- `~/.openclaw/secrets/google-drive.env`, only if no secure CLI store is available.

Environment variable names:
- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REFRESH_TOKEN`
- `GOOGLE_DRIVE_SCOPES`
- `RCLONE_CONFIG_GDRIVE_TYPE`

Status: rclone remote `gdrive` configured on `flashnode01`

Approved access level: full Google Drive access

Autonomous lane:
- `/home/neo/.openclaw/safe-bin/oc-cloud-copy`
- Remote prefix: `gdrive:OpenClawAutonomy/`

## Microsoft OneDrive

Service name: Microsoft OneDrive

Config file location:
- `~/.config/rclone/rclone.conf` for the `onedrive` remote.
- `~/.openclaw/secrets/microsoft-onedrive.env`, only if no secure CLI store is available.

Environment variable names:
- `MICROSOFT_ONEDRIVE_CLIENT_ID`
- `MICROSOFT_ONEDRIVE_CLIENT_SECRET`
- `MICROSOFT_ONEDRIVE_REFRESH_TOKEN`
- `MICROSOFT_ONEDRIVE_SCOPES`
- `RCLONE_CONFIG_ONEDRIVE_TYPE`

Status: rclone remote `onedrive` configured on `flashnode01`; write/upload verification currently needs OneDrive reconnect

Approved access level: full Microsoft OneDrive file access

Autonomous lane:
- `/home/neo/.openclaw/safe-bin/oc-cloud-copy`
- Remote prefix: `onedrive:OpenClawAutonomy/`

## OpenClaw Gateway

Service name: OpenClaw Gateway

Config file location:
- `~/.openclaw/openclaw.json`
- `~/.openclaw/secrets/gateway-token.secret`
- `~/.openclaw/secrets/openclaw.env`

Environment variable names:
- `OPENCLAW_GATEWAY_TOKEN`

Status: file-backed SecretRef configured on `flashnode01`

## Telegram Approvals

Service name: Telegram exec approvals

Config file location:
- `~/.openclaw/openclaw.json`
- `~/.openclaw/secrets/telegram-bot-token.secret`
- `~/.openclaw/secrets/telegram.env`

Environment variable names:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Status: file-backed SecretRef configured on `flashnode01`

## GitHub CLI

Service name: GitHub CLI

Config file location:
- `~/.config/gh/hosts.yml`
- `~/.gitconfig`

Environment variable names:
- `GH_TOKEN`
- `GITHUB_TOKEN`

Status: authenticated on `flashnode01`; values not stored in this manifest

## Browser Audit Tooling

Service name: Browser audit / Playwright

Config file location:
- `tools/browser-audit/package.json`
- `/home/neo/openclaw-workspace/clientsurge-systems/tools/browser-audit/package.json`
- `/home/neo/.cache/ms-playwright/`

Environment variable names:
- `PLAYWRIGHT_BROWSERS_PATH`

Status: installed locally and on `flashnode01`

## Seraph Autonomy Wrappers

Service name: Seraph bounded autonomy wrappers

Config file location:
- `~/.openclaw/exec-approvals.json`
- `~/.openclaw/safe-bin/oc-workspace-trash`
- `~/.openclaw/safe-bin/oc-cloud-copy`
- `~/.openclaw/safe-bin/oc-git-autopush`
- `~/.openclaw/safe-bin/oc-project-command`
- `~/.openclaw/safe-bin/oc-autonomy-status`
- `~/.openclaw/logs/autonomy/actions.log`
- `~/.openclaw/trash/`

Environment variable names:
- None

Status: configured on `flashnode01`; workspace/cloud/git autonomy is bounded by wrapper paths and branch/prefix checks

## Seraph Health Timer

Service name: Seraph autonomous health check

Config file location:
- `~/.config/systemd/user/seraph-health-check.service`
- `~/.config/systemd/user/seraph-health-check.timer`
- `~/.openclaw/safe-bin/oc-seraph-health-check`
- `~/.openclaw/reports/seraph-health/latest.md`

Environment variable names:
- None

Status: enabled on `flashnode01`; timer is read/status/report-only
