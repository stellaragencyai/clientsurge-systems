# OAuth Connectors

Setup status for Seraph/OpenClaw OAuth access to Gmail, Google Drive, and Microsoft OneDrive.

Safety rules:
- Do not print, commit, or log OAuth tokens, refresh tokens, client secrets, or provider secrets.
- Do not store secrets in this repository.
- Prefer each provider CLI secure config store. Use `~/.openclaw/secrets/*.env` with file mode `600` only if a CLI secure store is not available.
- Full-access scopes are approved for Gmail, Google Drive, and OneDrive as of 2026-05-21.
- Even with full-access OAuth grants, setup verification must remain non-destructive and metadata-only.
- Verification must use account/profile metadata or top-level file metadata only.

## Gmail

Status: tooling installed on `flashnode01`; Gmail OAuth consent still needed

Connector name: Gmail

Auth method: OAuth 2.0 user consent or device login, depending on selected tool.

Configured CLI/tool: `gcloud` on `flashnode01`.

Preferred setup path:
1. If a Google Workspace/Gmail CLI such as GAM is installed later, use that with full Gmail access.
2. If no workspace CLI is available, create a Google APIs OAuth client for OpenClaw and request full Gmail access.

Scopes requested:
- `https://mail.google.com/`

Verification command:
```powershell
# GAM example, after OAuth is configured:
gam info user

# Google API client example, after OAuth is configured:
# Run OpenClaw's metadata-only Gmail profile check once implemented.
```

Verification status: not run. Gmail OAuth consent did not complete in the browser.

Known limitations:
- `gcloud` is installed on `flashnode01`; no Gmail OAuth token is configured yet.
- Gmail email contents must not be read during setup verification.
- Full Gmail access can read, send, modify, and delete mailbox data. Use only after confirming Seraph/OpenClaw has guardrails for non-destructive operation.

Next safe action:
- Complete Gmail browser OAuth consent with `gcloud auth application-default login` using the approved full Gmail scope, then run only an account/profile or label metadata check.

## Google Drive

Status: configured on `flashnode01`

Connector name: Google Drive

Auth method: OAuth 2.0 via rclone remote, preferably browser or device login.

Configured CLI/tool: `rclone` on `flashnode01`.

Preferred setup path:
1. Install `rclone`.
2. Create a Google Drive remote with full Drive access.
3. Store OAuth credentials only in rclone's config store.

Scopes requested:
- `drive` / `https://www.googleapis.com/auth/drive`

Setup command:
```powershell
rclone config create gdrive drive scope drive
```

Verification command:
```powershell
rclone lsf gdrive: --max-depth 1 --dirs-only
```

Verification status: passed. `rclone lsf gdrive: --max-depth 1` listed top-level metadata only.

Known limitations:
- rclone may store OAuth refresh tokens in its local config. Do not commit `rclone.conf`.
- The verification command lists top-level metadata only and must not download file contents.
- Full Drive access can create, modify, upload, trash, and delete files. Do not perform those actions during setup verification.

Next safe action:
- Keep using `gdrive:` through rclone. Do not download, upload, edit, or delete files unless explicitly approved for a separate task.

## Microsoft OneDrive

Status: configured on `flashnode01`

Connector name: Microsoft OneDrive

Auth method: OAuth 2.0 via rclone remote, preferably browser or device login.

Configured CLI/tool: `rclone` and `onedrive` CLI on `flashnode01`.

Preferred setup path:
1. Install `rclone`.
2. Create a OneDrive remote using OAuth/device login.
3. Store OAuth credentials only in rclone's config store.

Scopes requested:
- Full OneDrive file access, such as `Files.ReadWrite.All` or rclone's closest full-access OneDrive equivalent.

Setup command:
```powershell
rclone config create onedrive onedrive
```

Verification command:
```powershell
rclone lsf onedrive: --max-depth 1
```

Verification status: passed. `rclone lsf onedrive: --max-depth 1` listed top-level metadata only.

Known limitations:
- Confirm the final Microsoft Graph consent screen shows the expected full file access before approving.
- The verification command lists top-level metadata only and must not download, upload, edit, or delete files.
- Full OneDrive access can create, modify, upload, and delete files. Do not perform those actions during setup verification.

Next safe action:
- Keep using `onedrive:` through rclone. Do not download, upload, edit, or delete files unless explicitly approved for a separate task.
