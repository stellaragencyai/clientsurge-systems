# ClientSurge Proof & Status Taxonomy

ClientSurge must not display operational trust unless there is evidence.

## Status Values

| Status | Definition | Use When |
|---|---|---|
| `trusted` | Verified recently with direct evidence | System is confirmed working |
| `warning` | Working or partially working, but attention needed | Risk exists but workflow can continue |
| `blocked` | Cannot proceed safely | Required dependency or proof is missing |
| `unknown` | No current evidence | System has not been checked or data is unavailable |
| `stale` | Evidence exists but is too old | Last proof is outside acceptable freshness window |
| `pending` | Check or deployment is in progress | Awaiting async result |

## Required Proof Fields

Every proof-backed status should include:

- `id`
- `label`
- `category`
- `status`
- `source`
- `checkedAt`
- `evidence`
- `actionUrl`
- `owner`

## Categories

- `website`
- `stripe`
- `base44`
- `github`
- `resend`
- `twilio`
- `analytics`
- `client`
- `automation`
- `billing`
- `security`

## Freshness Rules

| Check Type | Trusted Freshness Window |
|---|---:|
| Website uptime | 15 minutes |
| Contact form | 24 hours after test |
| Stripe checkout | 24 hours after test |
| Base44 publish | Current deployed commit only |
| GitHub release status | Current main branch only |
| Resend domain health | 24 hours |
| Email delivery | Per message event |
| SMS delivery | Per message event |
| Twilio webhook | 24 hours after test |
| GA4/analytics | 24 hours |

## UI Requirements

Every proof/status UI must show:

1. Current status
2. Last checked timestamp
3. Source of truth
4. Evidence summary
5. Next action when not trusted

## Forbidden Patterns

- Hardcoded green checks
- Static “verified” text without evidence
- Hiding stale checks as trusted
- Showing queued SMS as delivered proof
- Showing email accepted by provider as opened/clicked
- Treating GitHub merge as Base44 production deployment proof
- Treating Stripe test checkout as live checkout proof

## Example

```ts
const proof = {
  id: "resend-domain-auth",
  label: "Resend Domain Authentication",
  category: "resend",
  status: "trusted",
  source: "Resend domain API",
  checkedAt: "2026-07-02T12:00:00Z",
  evidence: "DKIM/SPF/DMARC aligned for clientsurgesystems.com",
  actionUrl: "https://resend.com/domains",
  owner: "system",
};
```

## Principle

A status without proof is not a status. It is decoration. ClientSurge should not sell decoration.