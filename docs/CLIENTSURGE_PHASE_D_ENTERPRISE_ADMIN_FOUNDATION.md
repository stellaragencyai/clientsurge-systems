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
- `src/lib/enterpriseRbac.js`: reusable RBAC evaluator with `can(role, permission, scope)`, deny reasons, aliases, and RBAC audit contract fields.
- `src/lib/enterpriseOrganizationSettingsReadModel.js`: pure read-only Organization Settings adapter for AdminSettings, ClientProject, and runtime host snapshots.
- `src/lib/enterpriseOrganizationSettingsSource.js`: Base44 read-only source loader. It lists records only and does not create, update, delete, invoke functions, or save settings.
- `src/lib/enterpriseTeamManagementReadModel.js`: pure read-only Team Management adapter for User, ClientProject, and AuditLog snapshots with fixture fallback for canonical Team, Invite, and Assignment records.
- `src/lib/enterpriseTeamManagementSource.js`: Base44 read-only Team source loader. It lists User, ClientProject, and AuditLog only and does not invite, create, update, delete, or invoke functions.
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

`enterpriseRbac.js` is the first enforcement primitive. Use `can(role, permission, scope)` for boolean checks and `evaluateEnterprisePermission({ role, permission, scope })` when a denial reason and audit-ready metadata are required. Permission changes must preserve actor, action, target, timestamp, source, outcome, reason, role, permission, and scope.

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

1. Organization Settings now has a read-only source binding. Worker #3 should promote approved AdminSettings, ClientProject, runtime host, and future Organization fields into canonical Organization records without removing fixture/source semantics.
2. Team Management now has a read-only source binding. Worker #3 should promote approved User, ClientProject, AuditLog, future Team, Invite, and Assignment fields into canonical team records without opening writes first.
3. Enforce RBAC by role, permission, and scope across route guards, data access, backend mutations, exports, and destructive-action safeguards using `enterpriseRbac.js`.
4. Preserve actor, action, target, timestamp, source, outcome, reason, role, permission, and scope on permission changes and team assignment records.
5. Keep Commerce Blue reserved for purchase and commercial commitment actions.
6. Treat billing, integration, usage, and security values as unverified until live source checks pass.
7. Add mutation flows only after destructive-action safeguards and audit writes exist.
8. Keep Organization Settings and Team Management writes disabled until audited mutation paths exist.
