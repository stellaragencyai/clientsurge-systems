# Base44 Exact-Artifact Deployment Automation — Phase 1

## Objective

Replace the unreliable pattern:

```text
GitHub merge -> hope Base44 synced -> publish whatever is in the editor
```

with an exact, provable release chain:

```text
Git commit -> build that commit -> stamp SHA into dist/release.json
-> deploy that dist artifact -> verify the same SHA is live
```

Phase 1 proves the mechanism against a non-production ClientSurge Base44 copy. It does **not** enable automatic production publishing.

## Why Phase 1 is staging-only

The production Base44 app is:

```text
69dc4a79656fdba136d413d3
```

The new deployer refuses that app unless two explicit production gates are supplied. The Phase 1 workflow and PowerShell runner reject it unconditionally.

This prevents an unproven CLI path, expired credential, bad output directory, or routing difference from affecting `clientsurgesystems.com`.

## Added components

### Exact release manifest

`scripts/release/write-release-manifest.mjs`

Writes `dist/release.json` after the Vite build. The file records the full 40-character Git SHA, repository, environment, target Base44 app, workflow, and timestamp.

### Exact live verification

`scripts/release/verify-live-release.mjs`

Polls the deployed app's `/release.json` with cache-busting headers. A release passes only when the live SHA exactly equals the source SHA.

### Guarded Base44 site deployer

`scripts/release/deploy-base44-exact-artifact.mjs`

Sequence:

1. Validate the target app and block accidental production deployment.
2. Run the mandatory release-gate Node tests unless explicitly skipped.
3. Build with Vite unless an existing `dist` is explicitly requested.
4. Write `dist/release.json` with the exact source SHA.
5. Authenticate the Base44 CLI from `~/.base44/auth/auth.json` or `BASE44_AUTH_JSON`.
6. Run the official Base44 CLI site deployment against the requested app.
7. Poll the staging URL until its live release SHA matches exactly.
8. Write a JSON proof artifact.

### Local Windows runner

`scripts/release/run-base44-staging-proof.ps1`

This is the fastest path while GitHub Actions issue #1271 remains unresolved.

### Manual GitHub staging workflow

`.github/workflows/base44-exact-artifact-staging-proof.yml`

This workflow is manual only, has one staging deployment lock, rejects the production app, and uploads both the deployment proof and release manifest.

### Regression tests

`tests/base44ExactArtifactDeploy.test.js`

Guards the production lock, full-SHA manifest, official CLI command, exact live verification, and staging-only workflow behavior.

## Local dry run

A dry run builds, tests, and stamps the exact artifact without contacting Base44:

```powershell
pwsh -File scripts/release/run-base44-staging-proof.ps1 `
  -StagingAppId <NON_PRODUCTION_APP_ID> `
  -DryRun
```

Expected files:

```text
dist/release.json
tmp/base44-exact-artifact-staging-proof.json
```

The SHA in `dist/release.json` must equal:

```powershell
git rev-parse HEAD
```

## Real staging proof

First authenticate the Base44 CLI on the publisher machine:

```powershell
npx base44@latest login
npx base44@latest whoami
```

Then run:

```powershell
pwsh -File scripts/release/run-base44-staging-proof.ps1 `
  -StagingAppId <NON_PRODUCTION_APP_ID> `
  -VerifyUrl <STAGING_PUBLISHED_URL>
```

The command is successful only when:

```text
<STAGING_PUBLISHED_URL>/release.json
```

reports the exact local Git SHA.

## GitHub workflow proof

After GitHub Actions execution is restored:

1. Open **Actions**.
2. Select **Base44 Exact Artifact Staging Proof**.
3. Select the branch/ref to test.
4. Enter a non-production Base44 app ID.
5. Enter that app's published URL.
6. Run first with `dry_run=true`.
7. Inspect the artifact.
8. Run with `dry_run=false` only after the dry run passes.

Required repository secret for a real GitHub-hosted deployment:

```text
BASE44_AUTH_JSON
```

The value must be valid Base44 CLI auth JSON. Do not commit it to the repository.

## Phase 1 acceptance criteria

All conditions must pass:

- Full build succeeds.
- Mandatory release-gate tests succeed.
- `dist/release.json` contains the exact source SHA.
- Base44 CLI authenticates.
- `base44 site deploy` accepts the staging target.
- Staging `/release.json` reports the exact source SHA.
- Staging homepage and critical public routes render correctly.
- No production app or production domain is modified.

## Phase 2 after staging proof

Only after Phase 1 passes:

1. Consolidate the two existing production publishers into one workflow.
2. Use exact-artifact deployment as the primary frontend path.
3. Retain the current deploy endpoint as fallback.
4. Retain the Playwright Publish-button clicker as last-resort fallback only.
5. Add one production concurrency lock.
6. Trigger only from a successful release gate on `main`.
7. Verify the exact production SHA before declaring success.
8. Run route and checkout smoke tests.
9. Record rollback SHA and release proof.
10. Send success/failure notification.

## Non-goals in Phase 1

- No production auto-publish.
- No automatic entity deletion or connector replacement.
- No blanket `base44 deploy -y` against production.
- No modification of Base44 production data.
- No disabling of the existing production workflow before the replacement path is proven.
