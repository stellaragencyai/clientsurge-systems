# ClientSurge Release Checklist

Purpose: make releases boring, provable, and reversible. This checklist is required before anything is considered launched on `https://clientsurgesystems.com`.

## Release authority

- Canonical candidate repo: `stellaragencyai/clientsurge-systems`.
- Deprecated / not source of truth: empty Base44 copy repos, including `stellaragencyai/clientsurgesystems-refined-export` unless explicitly repopulated and re-approved.
- Production Base44 app: `69dc4a79656fdba136d413d3`.
- Live site: `https://clientsurgesystems.com`.

GitHub is the source-controlled candidate. The release is not production until Base44 sync/publish proof exists.

## Pre-PR requirements

- Work happens on a named branch, never directly on `main`.
- The branch has one clear purpose.
- The PR description lists the affected surfaces: website, Base44 function, entity schema, Stripe, Twilio, Resend, dashboard truth, Cloudflare, docs, or tests.
- The PR states whether it changes production behavior.
- The PR states whether it touches live Stripe objects. Default answer must be `no`.

## Required local/source checks

Run the strongest applicable checks before merge:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm test
npm run test:node
npm run test:deno
```

If a command is unavailable or intentionally skipped, document why in the PR.

## Required proof by surface

### Public website

- Protected/internal routes are not public navigation destinations.
- `/pages` and generated/internal directories do not expose admin/setup/private routes.
- `robots.txt` and `sitemap.xml` contain only approved public route behavior.
- Pricing is crawlable and matches the canonical sales catalog.
- Legal pages cover analytics, SMS, AI voice, payments, email, cookies, and automation services.

### Stripe

- Test-mode checkout and webhook proof pass before live proof.
- Live proof requires explicit owner approval for package, amount, purchaser, refund/no-refund plan, and timing.
- A queued order is not payment proof.
- Stripe proof requires real Stripe identifiers on the Order: session, customer, subscription, or invoice evidence.

### Twilio / messaging

- Queued SMS is not delivery proof.
- SMS proof requires Twilio provider message ID and terminal provider status when available.
- Link-click proof requires callback receipt, CommunicationEvent logging, and lead match / unmatched warning handling.
- Voice proof requires a real inbound call and webhook/post-call record where applicable.

### Resend / email

- Queued internal notification is not delivery proof.
- Email proof requires provider evidence and manual recipient/inbox verification for launch-critical flows.

### CRM / lead truth

- Test, smoke, fake, internal, duplicate, and orphan records must be excluded from production dashboards.
- Do not delete production lead data in a release PR.
- Quarantine or mark test/fake records before deletion is even considered.
- Dedupe must preserve records unless keeper proof is explicit.

### Admin/dashboard truth

- Dashboard numbers must be tied to trusted production rows only.
- Manual approvals and waivers must not fabricate `proof_passed`.
- Truth gates must show blocker, proof status, and next action.

## Base44 sync/publish gate

Before marking a release done:

1. Confirm the merged commit SHA on `main`.
2. Confirm Base44 Builder sees the expected files/changes.
3. Publish through Base44 only after explicit approval for production-facing changes.
4. For public shell/routing changes, purge Cloudflare cache after publish.
5. Run live smoke checks against `https://clientsurgesystems.com`.
6. Record proof links/logs in the PR or linked release issue.

## Rollback process

1. Identify last known good commit and Base44 published state.
2. Freeze new merges except rollback PRs.
3. Revert the bad PR or apply a minimal forward-fix branch.
4. Publish the restored Base44 version.
5. Purge Cloudflare cache when routing/public shell changed.
6. Rerun P0 smoke: homepage, pricing, lead capture, checkout disabled/available state, login/admin protection, Stripe webhook endpoint, Twilio callback endpoint.
7. Document root cause before reopening normal releases.

## Definition of done

A release is done only when the PR is merged, Base44 sync/publish proof is recorded, production smoke proof exists, and rollback notes are current.
