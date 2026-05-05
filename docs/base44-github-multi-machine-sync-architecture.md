# Base44 + GitHub + Desktop/Laptop Sync Architecture

Last updated: 2026-05-05 MST

## Executive Summary

The smartest, fastest, and safest sync architecture for this project is:

`Base44 app editor -> GitHub main -> dedicated sync mirror on each machine -> manual or semi-automated integration into active work branches`

Do not create a three-way direct sync between Base44, desktop, and laptop. That creates conflict loops and dirty-worktree risk. Use GitHub `main` as the only shared transport layer.

## Why This Is The Right Model

### Base44 facts that matter

- Base44 GitHub integration is the native two-way sync path for app-editor projects.
- Changes made in Base44 are synced to the connected GitHub repository automatically.
- Local changes only sync back to Base44 when they are merged into the `main` branch.
- After code is visible in Base44, you still need to click `Publish` in Base44 to make the changes live.

### Repo facts that matter

- This repo is connected to GitHub and currently points to `origin` at `https://github.com/stellaragencyai/clientsurge-systems.git`.
- The repo currently behaves like a Base44 GitHub-integrated app project, not a linked Base44 CLI backend project.
- There is no `.app.jsonc` file at the repo root.
- There is no `base44/config.jsonc` file.
- Because those CLI link files are missing, this repo should not be treated as a Base44 CLI deployment project unless we intentionally convert or recreate it that way.

### What this means

- Use GitHub integration as the primary sync path for this app.
- Do not rely on Base44 app automations for local machine sync. Base44 automations run backend work inside the app, not Git operations on your desktop or laptop.
- Do not use direct folder-sync tools like OneDrive, Dropbox, or Syncthing on the repo. They are dangerous for Git repos with active branches, worktrees, and build artifacts.

## Recommended Topology

### 1. Base44 remains the builder-side source for visual/editor work

If Base44 AI or the Base44 editor makes safe improvements, those changes flow into GitHub automatically through the built-in GitHub integration.

### 2. GitHub `main` is the cross-device source of truth

Both desktop and laptop should watch `origin/main`.

No machine should try to sync directly with the other machine.

### 3. Each machine gets its own dedicated sync mirror worktree

Each machine should have:

- one repo clone used for active feature work
- one clean mirror worktree that tracks `origin/main` only

Example mirror paths:

- Desktop mirror: `C:\Users\nolan\Desktop\clientsurge-systems-main-mirror`
- Laptop mirror: `C:\Users\nolan\Desktop\clientsurge-systems-main-mirror`

The exact path can differ by machine. The key rule is that the mirror worktree stays clean and disposable.

### 4. Active worktrees never auto-pull

Do not auto-pull into:

- `codex/sync-base44-main`
- `codex/launch-main-clean`
- any feature branch
- any dirty worktree

Those branches should only ingest changes intentionally after overlap review.

## What Should Be Automated

### Safe to automate

- `git fetch origin --prune`
- fast-forwarding a clean mirror worktree to `origin/main`
- logging the latest synced commit
- comparing `origin/main` against an active branch and reporting overlap

### Not safe to automate blindly

- auto-merging `origin/main` into a dirty or active feature branch
- publishing the Base44 app every time `main` changes
- pushing local unreviewed changes to `main`
- converting this repo into a CLI-linked backend project

## Scheduler Design

### Scheduler A: Per-machine mirror updater

Runs on each machine every 15 minutes:

1. Fetch `origin`
2. Fast-forward the dedicated mirror worktree to `origin/main`
3. Record the latest commit SHA and title in a local log
4. Stop immediately if the mirror worktree is dirty

### Scheduler B: Optional overlap classifier

Runs after mirror update:

1. Compare `origin/main` to the active branch
2. List changed files
3. Flag overlap if changes touch:
   - `src/App.jsx`
   - shared form components
   - auth/login paths
   - checkout paths
   - `base44/functions`
   - shared UI surfaces currently in flight
4. Output `safe`, `review`, or `conflict`

The current scripts now support this directly by passing an active branch reference into the mirror update cycle. The classifier report is written to:

- `logs/base44-sync/<machine>/latest-overlap.json`
- `logs/base44-sync/<machine>/latest-overlap.txt`

### Scheduler C: Optional reminder for Base44 publish

This should be a reminder, not an automatic publish.

Reason:

- Base44 docs confirm local changes become visible in Base44 after merge to `main`, but making them live still requires a Publish action in the Base44 UI.
- I did not find an official current publish API in the Base44 docs used for this research.

## Why We Should Not Rebuild This Around The Base44 CLI

Base44’s current CLI/backend service is powerful, but the official docs say CLI-created projects are not currently integrated with Base44’s app editor.

That means:

- if we eject or move to a CLI-native backend project, we gain code-defined deploy workflows
- but we lose the simple Base44 app-editor sync model as the primary operating mode

Because your site is already living in Base44 and tied to GitHub, the safest approach is:

- keep this app on the GitHub integration path
- automate around GitHub and local Git worktrees
- only consider a CLI-native backend split later if we decide to separate app-editor work from deeper backend infrastructure

## Current Recommended Operating Rules

1. Base44 changes flow into GitHub automatically.
2. GitHub `main` is the only branch that Base44 listens to for local-to-Base44 sync.
3. Every machine keeps one clean mirror worktree of `origin/main`.
4. Every machine may keep separate feature worktrees, but those never auto-pull.
5. Integration from mirror into active work branches is intentional, not forced.
6. Publishing from Base44 remains manual until an official publish API is confirmed.

## Security Note

If a Base44 API key was pasted into chat or documentation during planning, rotate it immediately and replace it in the Base44 dashboard. Do not reuse exposed keys.

## Files Added For This Architecture

- `scripts/sync/ensure-base44-sync-mirror.ps1`
- `scripts/sync/update-base44-sync-mirror.ps1`
- `scripts/sync/install-base44-sync-task.ps1`
- `scripts/sync/classify-base44-overlap.ps1`

These scripts are designed to support the mirror-based workflow on both desktop and laptop.

## Overlap Classifier Usage

Use the overlap classifier before ingesting new Base44 or GitHub changes into an active branch:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync\classify-base44-overlap.ps1 `
  -RepoPath "C:\path\to\repo" `
  -ActiveRef "codex/your-active-branch" `
  -IncomingRef "origin/main"
```

Classification meanings:

- `safe`: no incoming overlap and no critical-path review signal
- `review`: incoming changes need human review before ingestion
- `conflict`: incoming changes overlap active work in critical files

To install the scheduled task with overlap reports for an active branch:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync\install-base44-sync-task.ps1 `
  -RepoPath "C:\path\to\repo" `
  -MirrorPath "C:\path\to\mirror" `
  -ActiveRef "codex/launch-main-clean" `
  -IntervalMinutes 15
```
