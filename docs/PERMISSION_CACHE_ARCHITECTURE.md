# Permission Cache Architecture Plan (Phase 5)

## Status: Design Only — Not Implemented

No Redis or external cache is deployed yet. This document defines the
architecture for when caching is needed to reduce permission-check latency.

---

## Cache Key

```
deploy_{deploymentId}_permissions
```

Example: `deploy_69dc4a79_permissions`

The key stores a JSON object mapping module_keys to authorization results:

```json
{
  "instant_lead_response": { "authorized": true, "checked_at": "2026-07-07T10:00:00Z" },
  "lead_nurture": { "authorized": false, "reason": "module_not_in_tier", "checked_at": "2026-07-07T10:00:00Z" }
}
```

---

## TTL

**300 seconds (5 minutes)**

Balances performance with freshness. Permission changes (package upgrade,
module activation) propagate within at most 5 minutes if invalidation
triggers fail.

---

## Invalidation Triggers

The cache MUST be invalidated on any of these events:

| Trigger | Action |
|---|---|
| Package upgrade | Delete `deploy_{deploymentId}_permissions` |
| Package downgrade | Delete `deploy_{deploymentId}_permissions` |
| Deployment status change | Delete `deploy_{deploymentId}_permissions` |
| Module activation | Delete `deploy_{deploymentId}_permissions` |
| Module removal | Delete `deploy_{deploymentId}_permissions` |
| Subscription cancelled/paused | Delete `deploy_{deploymentId}_permissions` |

Invalidation is performed by the function that modifies the deployment
(e.g., `billingProcessor`, `manageClientLifecycle`, admin update actions).

---

## Security Considerations

1. **Fail-closed on cache miss**: If the cache is unavailable, fall through
   to `checkModulePermission()` live lookup. Never default to `authorized: true`.

2. **No cross-tenant leakage**: Cache keys include `deploymentId` which is
   tenant-scoped. No global or shared cache entries.

3. **Read-only cache**: The cache stores permission *check results* only.
   It never stores credentials, tokens, or PII.

4. **Audit trail**: Every cache hit that allows execution must still log
   to `AutomationExecutionLog` with `trigger_event: 'permission_check_cached'`
   so the audit trail shows whether a decision was cached or live.

5. **Stale data risk**: A 5-minute TTL means a downgraded package could
   execute a now-unauthorized module for up to 5 minutes. This is
   mitigated by:
   - Explicit invalidation on package changes (primary defense)
   - TTL expiry (secondary defense)
   - Billing processor pausing the deployment on cancellation (blocks
     all execution regardless of cache state)

6. **Cache poisoning prevention**: Cache entries are only written by
   `checkModulePermission` or its authorized callers. No user-facing
   endpoint can write to the cache.

---

## Implementation Plan (When Needed)

1. Use Base44 entity `AutomationProofLog` or a dedicated `PermissionCache`
   entity as the cache store (avoids Redis dependency).
2. `checkModulePermission` checks cache first; on miss, performs full
   validation and writes result.
3. Deployment-modifying functions call a `invalidatePermissionCache(deploymentId)`
   helper after any state change.
4. Monitor cache hit rate and adjust TTL if needed.