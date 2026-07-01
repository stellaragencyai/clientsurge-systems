# Production Release Proof Runbook

Purpose: separate GitHub completion from live Base44 production completion.

A release is not considered live until there is evidence for all four layers:

1. GitHub main contains the target commit.
2. Required GitHub checks passed for that exact commit.
3. The Base44 production publisher ran after that commit landed on main.
4. The live domain serves a healthy app shell and mobile admin has been visually verified.

## Production identity

- GitHub repo: stellaragencyai/clientsurge-systems
- Branch: main
- Base44 production app: 69dc4a79656fdba136d413d3
- Live domain: https://clientsurgesystems.com

## Standard proof sequence

Run this from the clean publisher mirror, not an active feature branch:

```powershell
cd C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror
git fetch origin
$sha = git rev-parse origin/main
npm run github:wait-main-ci -- -Sha $sha
npm run base44:watch-main-publish -- -Once
npm run proof:production-release -- --expected-sha=$sha
```

The proof command writes:

- logs/release-proof/latest-production-release-proof.json
- logs/release-proof/latest-production-release-proof.md

## Manual screenshots required

Attach these to the release note or PR comment:

- Desktop live homepage after hard refresh.
- Mobile live homepage after hard refresh.
- Mobile admin after hard refresh.
- Mobile settings tab screen after hard refresh.
- Mobile leads screen showing card-mode rows.

## Pass criteria

The release is trusted only when:

- GitHub checks are green for the target SHA.
- Base44 publish/sync ran after the target SHA reached main.
- The production release proof command passes for the target SHA.
- No donor/staging Base44 app IDs appear in live HTML.
- The live admin mobile screenshots match the intended release.

## Failure handling

If the proof command fails:

1. Do not call the release done.
2. Save the JSON/Markdown report.
3. Run the sync status audit.
4. Verify Base44 app access.
5. If the live domain is stale, re-run the guarded publisher after GitHub checks pass.
