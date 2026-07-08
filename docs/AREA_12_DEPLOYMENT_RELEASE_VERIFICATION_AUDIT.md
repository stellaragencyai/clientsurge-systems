# Area 12 — Deployment, GitHub/Base44 Publish, CI/CD, Cloudflare, and Production Verification

## Scope

This area covers GitHub release gates, Base44 auto-publish, publish proof artifacts, production route verification, checkout smoke proof, workflow traceability, and the operational difference between a GitHub merge and a live Base44 production update.

## Core problem addressed

Recent audit areas were merged into GitHub, but the available connector workflow lookup did not return visible workflow runs for the merge commits. That does not prove the publish failed, but it does mean we did not have enough durable proof in the repository workflow itself to say Base44 production was updated.

Area 12 changes make the release chain leave JSON artifacts and GitHub step summaries that can be inspected after every gate/publish run.

## 10 flaws / risks addressed

1. GitHub merge success could be mistaken for Base44 production success.
2. Base44 Auto Publish relied primarily on console output and step summary text instead of a durable JSON artifact.
3. ClientSurge Release Gate did not upload a commit-specific release proof artifact.
4. Base44 Auto Publish did not upload a release-chain preflight artifact tying workflow_run source SHA to publish job SHA.
5. Base44 publish helper did not support an explicit `--output` JSON proof path.
6. Publish proof did not consistently include GitHub run ID, run attempt, workflow name, event name, ref, and SHA.
7. Live signal-change verification was not persisted as structured proof.
8. Release summaries did not name the uploaded artifact that operators should inspect.
9. There was no Area 12 regression test preventing release proof artifact removal.
10. The release process did not clearly separate release-gate proof, Base44 publish proof, route proof, and checkout proof.

## Files changed

- `.github/workflows/clientsurge-release-gate.yml`
- `.github/workflows/base44-auto-publish.yml`
- `scripts/base44/publish-deploy-endpoint.mjs`
- `tests/area12ReleaseVerification.test.js`
- `docs/AREA_12_DEPLOYMENT_RELEASE_VERIFICATION_AUDIT.md`

## Verification artifacts now expected

### ClientSurge Release Gate

Artifact name pattern:

```text
clientsurge-release-gate-proof-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}
```

Expected file:

```text
tmp/release-gate-proof.json
```

### Base44 Auto Publish

Artifact name pattern:

```text
base44-release-proof-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}
```

Expected files:

```text
tmp/base44-publish-proof.json
tmp/release-chain-proof.json
```

## What the Base44 publish proof should include

- App ID
- GitHub repository
- GitHub SHA/ref
- Workflow name
- Event name
- Run ID
- Run attempt
- Before live signal
- Deploy endpoint status
- Verification attempt count
- Verification elapsed time
- Verification result/reason
- After live signal

## Operator rule

Do not claim production is updated from a GitHub merge alone.

A production claim requires one of the following:

1. A successful Base44 Auto Publish workflow run with uploaded proof artifacts; or
2. A manual Base44 publish with separately captured proof; and
3. Live route/checkout smoke evidence after publish.

## Current limitation

This patch improves future verification. It does not retroactively prove that earlier Area 1–7 merges published to Base44 production.
