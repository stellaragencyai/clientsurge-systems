# ClientSurge Launch Gate Policy

Last updated: 2026-08-01

This policy governs the first-15 remediation lane. Its purpose is to keep security fixes, release proof, and production claims tied to evidence instead of assumptions.

## Required Branch Posture

- Remediation work happens on a feature branch or isolated clean clone.
- `main` is not changed directly unless the owner explicitly authorizes it.
- Dirty checkout noise must be classified before code changes are trusted.
- Known generated files and local evidence outputs must not be mixed into release commits unless they are intentional artifacts.

## Required Local Gates

Before review or publish, the branch must pass:

- `npm run lint`
- `npm run typecheck`
- Focused security tests for changed auth, RLS, and function-audit behavior.
- A production dependency audit with remaining risks documented.
- A local build or explicit build blocker report.

## Required Live Gates

Before any production-safe claim, the release chain must be proven:

```text
GitHub commit -> visible CI/check status -> controlled Base44 sync/publish -> clientsurgesystems.com live proof -> rollback path verified
```

Local tests, Base44 deployment success, or Cloudflare configuration visibility are not enough by themselves to claim the live site is fixed.

## Approval-Required Actions

These actions require explicit owner approval:

- Base44 production publish or environment change.
- Cloudflare DNS, Worker route, Custom Hostname, Transform Rule, or redirect change.
- GitHub merge to `main`.
- Real email, SMS, voice, campaign, or payment action.
- Credential, webhook secret, or provider configuration change.
- Any action that changes customer-visible production behavior.

## Function Security Rule

Externally callable backend functions must declare an obvious authorization pattern:

- Admin-only for operational actions.
- Owner-or-admin for customer-owned records.
- Signed webhook for provider callbacks.
- Admin-or-signed-internal only for internal service calls that may also need operator testing.

Functions without an obvious guard stay blocked from production trust until reviewed.

## Entity Write Rule

High-value entities that affect customers, money, provisioning, support, or operational truth must not allow broad user updates. User-facing write paths should flow through guarded functions or narrowly scoped create rules.

## Evidence Rule

Every completed gate must name the exact command, URL, screenshot, CI check, or provider proof used. If evidence is unavailable, the status is `blocked`, `partial`, or `not verified`.

## Rollback Rule

Every production release must include a rollback target:

- Git commit or PR to revert.
- Base44 publish state or prior artifact.
- Cloudflare Worker/version/route state if applicable.
- Known live smoke command to confirm rollback.
