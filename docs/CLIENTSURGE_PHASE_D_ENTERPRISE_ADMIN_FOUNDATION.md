# ClientSurge OS Phase D - Enterprise Administration Foundation

Source: GitHub issue #1382, "Phase D architecture - Administration, billing, permissions, integrations, security, and support".

## Scope

This is a static review foundation only. It defines routeable enterprise administration surfaces, state contracts, RBAC semantics, safeguards, responsive behavior, and accessibility requirements. It does not claim live production integration, live billing state, or financial proof.

## Mounted Routes

| Route | System | Priority |
| --- | --- | --- |
| `/settings/organization` | Organization Settings | 1 |
| `/settings/team` | Team Management | 2 |
| `/settings/roles` | Roles and Permissions | 2 |
| `/settings/integrations` | Integration Center | 3 |
| `/settings/billing` | Billing and Subscription | 4 |
| `/settings/usage` | Usage and Entitlements | 5 |
| `/settings/notifications` | Notification Preferences | 6 |
| `/settings/security` | Security Activity | 7 |
| `/settings/audit` | Audit History | 7 |
| `/settings/support` | Support and Escalation Center | 8 |

`/settings` redirects to `/settings/organization`.

## Components

- `src/lib/enterpriseAdminFoundation.js`: route map, RBAC matrix, state contracts, panel fixtures, safeguards, acceptance, accessibility, and responsive validation.
- `src/pages/settings/EnterpriseSettingsPage.jsx`: reusable route component for every Phase D system.
- `src/App.jsx`: protected admin route wiring.
- `src/components/admin/AdminShell.jsx`: navigation entry for Enterprise Settings.
- `tests/phaseDEnterpriseAdminFoundation.test.js`: static route, RBAC, state, and accessibility contract checks.

## State Contracts

Review states: Loading, Empty, Current, Partial, Stale, Delayed, Unavailable, Restricted, Unknown, Recoverable Error.

Integrations: Connected, Verifying, Healthy, Degraded, Disconnected, Permission Required, Unknown, Stale, Unsupported.

Billing: Active, Trial, Past Due, Cancelled, Scheduled Change, Payment Failed, Incomplete, Unavailable, Permission Restricted.

Usage: Measured, Estimated, Delayed, Unavailable, Out Of Date.

Security and support states are defined in `enterpriseAdminFoundation.js` and must remain business-actionable, not raw provider error text.

## RBAC Contract

Roles: Owner, Admin, Manager, Sales, Marketing, Support, Analyst, Viewer.

Permissions: View, Create, Edit, Delete, Approve, Export, Manage.

Scopes: Organization, Client, Location.

Worker #3 should map the matrix in `ROLE_PERMISSION_MATRIX` to route guards, backend authorization checks, export gates, and destructive-action safeguards.

## Validation Packet

Required checks:

- Desktop: 1440x900
- Tablet: 768x900
- Mobile: 390x844
- Keyboard reachability and focus order
- ARIA current page, status, labelled landmarks, and table captions
- Screen reader captions for route map, state contracts, and RBAC matrix
- Reduced motion coverage for transitions and hover behavior
- No horizontal overflow

## Worker #3 Packet

1. Bind each route panel to canonical records without removing fixture/source semantics.
2. Enforce RBAC by role, permission, and scope across route guards, data access, and backend mutations.
3. Preserve actor, action, target, timestamp, source, and outcome on security and audit records.
4. Keep Commerce Blue reserved for purchase and commercial commitment actions.
5. Treat billing, integration, usage, and security values as unverified until live source checks pass.
6. Add mutation flows only after destructive-action safeguards and audit writes exist.
