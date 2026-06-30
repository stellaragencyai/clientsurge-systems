# GitHub Workflow Audit - 2026-06-30

## Workflow inventory

### ClientSurge Release Gate
Path: `.github/workflows/clientsurge-release-gate.yml`

Purpose: Main release confidence check before Base44 publishing.

Blocking checks:
- dependency install
- app build
- release-gate Node shard
- local preview startup

Advisory checks:
- Deno test audit
- full Node test audit
- public route smoke audit

Hardening applied:
- Node runtime moved to 22 to avoid Node 20 runner deprecation noise.

Status: healthy. This is the primary workflow to trust for routine release status.

### ClientSurge Base44 Sync Control
Path: `.github/workflows/base44-sync-control.yml`

Purpose: Build validation and Base44 sync guard.

Blocking checks:
- dependency install
- CRM release guard
- app build

Advisory and optional checks:
- function invocation audit
- theme drift scan
- full Node tests when manually requested
- Deno tests when manually requested
- live smoke when manually requested

Status: healthy. This workflow should not create routine false-failure noise.

### Public Copy Rewrite Build Check
Path: `.github/workflows/public-copy-rewrite-build.yml`

Purpose: lightweight build verification for copy and storefront changes.

Blocking checks:
- dependency install
- app build

Hardening applied:
- Node runtime moved to 22 to avoid Node 20 runner deprecation noise.

Status: safe but partly redundant because Release Gate and Base44 Sync Control also build pull requests.

## Operating rule

Use the latest head SHA and latest pull request run as the source of truth. Older red inbox entries are historical status records and may not represent the current repository state.

## Remaining risk

The full Node and Deno suites are still not clean enough to serve as hard release gates. They remain visible as advisory or manual checks until those suites are repaired.

## Next hardening recommendations

1. Keep Release Gate and Base44 Sync Control as the trusted release checks.
2. Leave Public Copy Rewrite Build Check lightweight unless it starts creating noise.
3. Repair legacy Node and Deno tests incrementally, then promote them back to blocking after repeated green runs.
4. Investigate only current-head failures first; use old failed runs only for historical diagnosis.
