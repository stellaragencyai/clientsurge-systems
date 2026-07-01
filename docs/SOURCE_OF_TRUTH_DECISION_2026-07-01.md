# ClientSurge Systems Source of Truth Decision

Date: 2026-07-01

## Decision

Use this repository as the active production source-of-truth candidate for ClientSurge Systems:

`stellaragencyai/clientsurge-systems`

Retire this repository from production work:

`stellaragencyai/clientsurgesystems-refined-export`

## Evidence

This repo is the credible app repo because it contains:

- `package.json`
- Vite build scripts
- Base44 SDK/plugin dependencies
- Base44 publish/check/sync scripts
- Release proof scripts
- Public route smoke tests
- Stripe/email/Cloudflare/security validation scripts
- `.env.example`
- `base44/.app.jsonc`
- Source files referencing the live Base44 app ID `69dc4a79656fdba136d413d3`

## Remaining risk

Base44 still reports the live ClientSurge Systems app as `git_remote_source: s3`. That means this repository is the best source-of-truth candidate, but the deploy relationship still requires proof.

## Required proof before declaring complete

- Confirm a commit on `main` can be traced to Base44 preview/deploy.
- Confirm a harmless controlled change appears on `clientsurgesystems.com`.
- Confirm smoke tests pass for homepage, contact/free-audit form, pricing/checkout handoff, admin/dashboard route, and automation cards.
- Update the app/admin UI to identify this repo as the production repo candidate.
- Keep true launch blockers visible and do not mark gates trusted without evidence.

## Operational rule

No future fix is complete unless it is:

1. Committed in `stellaragencyai/clientsurge-systems`
2. Built successfully
3. Published or verified through Base44
4. Proven live on `clientsurgesystems.com`
