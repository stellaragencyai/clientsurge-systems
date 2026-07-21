# ClientSurge OS Phase F - Worker 2 Integration Packet

Source: Phase F Platform Integration Foundation, "connect all existing systems into one operating system".

## Scope

This packet is for Worker #2 to continue integration from the Phase F foundation. The current branch creates shared contracts and routeable review surfaces; it does not claim live production integration, live Base44 persistence, provider events, billing truth, or Cloudflare launch proof.

Worker #2 should connect existing systems to the shared contracts rather than adding standalone modules.

## Branch

- Branch: `feature/platform-integration-foundation`
- Foundation commit: `f43950c5 Add platform integration foundation`
- Primary contract: `src/lib/platformIntegrationFoundation.js`
- Admin review route: `/admin/platform`

## Systems Connected

| System | Foundation artifact | Worker #2 continuation |
| --- | --- | --- |
| Global navigation | `PLATFORM_NAVIGATION_SECTIONS`, `PLATFORM_ROUTES` | Confirm every existing admin, settings, CRM, AI, billing, support, and account route has canonical metadata. |
| Universal search | `PLATFORM_SEARCH_SOURCES`, `buildPlatformSearchResults` | Bind missing live adapters for AI workers, documents, timeline events, and settings records. |
| Notifications | `PLATFORM_NOTIFICATION_CONTRACT` | Select canonical persistence, delivery channels, lifecycle states, read/unread semantics, and escalation ownership. |
| Activity and events | `PLATFORM_ACTIVITY_EVENT_CONTRACT` | Bind live event ingestion and preserve actor, action, target, timestamp, source, outcome, and provenance. |
| Customer context | `CUSTOMER_CONTEXT_CONTRACT` | Map customer identity, lead/account linkage, health, activity, billing, automation, and support context to real entities. |
| Permissions | `PLATFORM_PERMISSION_CONTRACT`, `evaluatePlatformPermission` | Enforce route, source, export, destructive-action, and backend mutation gates with Phase D role/scope semantics. |
| Truth layer | `PLATFORM_TRUTH_LAYER` | Keep Unknown, Estimated, No Data, and Connected from being promoted to live truth without source proof. |
| Validation | `scripts/validate-platform-integration.mjs` | Keep contract validation as the required preflight before UI or data expansion. |

## Decisions Already Made

- `src/lib/platformIntegrationFoundation.js` is the shared Phase F contract source for routes, search, notifications, activity, customer context, permissions, truth rules, validation, and Worker #3 handoff.
- `/admin/platform` is a protected admin route used to review the integration foundation in one place.
- Universal search uses one adapter layer with safe missing-entity behavior. Missing sources should degrade to an unavailable source, not crash the shell.
- Permission checks use role, permission, and scope language aligned with Phase D enterprise administration.
- Truth semantics explicitly block unsafe promotion from `Unknown` to `Healthy`, `Estimated` to `Verified`, `No Data` to `Zero`, and `Connected` to `Operational`.
- Navigation is grouped around the operating system categories: Command Center, Intelligence, Operations, Customers, Communications, AI Workforce, Administration, and Account.

## Acceptance Criteria

Worker #2 is done when all of these are true:

- Every mounted admin/system route has a `path`, `title`, `description`, navigation section, permission metadata, and deep-link behavior.
- Universal search covers the required source categories and returns stable result fields: id, title, description, source, route, status, and metadata.
- Notification records have a stable lifecycle, severity, audience, source, destination, read state, and escalation path.
- Activity records preserve actor, action, target, timestamp, source, outcome, visibility, and provenance.
- Customer context exposes identity, lifecycle, health, revenue/package, automation, communication, support, recent activity, and truth metadata.
- Permissions distinguish restricted, unauthorized, unavailable, and allowed states in both UI and backend paths.
- Truth labels are visible wherever data is partial, estimated, stale, unavailable, or fixture-backed.
- `npm run verify:platform-integration -- --json` passes after any contract change.
- Focused tests for `adminGlobalSearch` and `platformIntegrationFoundation` pass.

## Validation Evidence

Completed for the foundation commit:

- `npm run test -- tests/adminGlobalSearch.test.js tests/platformIntegrationFoundation.test.js` - passed, 7/7 tests.
- `npm run verify:platform-integration -- --json` - passed, 46 routes, 8 search sources, 6 notification sources, 7 activity sources.
- `npx eslint src/App.jsx src/components/admin/AdminGlobalSearch.jsx src/components/admin/AdminShell.jsx src/internal-pages/AdminDashboard.jsx src/pages/admin/PlatformIntegrationFoundation.jsx --quiet` - passed.
- `npm run typecheck` - passed.
- `npm run build` - passed with the existing Vite large-chunk warning.
- Viewport screenshots captured for 1440x900, 1280x900, 1024x768, 768x900, 390x844, and 375x667.

## Product Decisions Needed

- Choose the canonical live source for each search source and route-backed system.
- Decide whether `/admin/platform` remains a permanent operator surface or becomes review-only.
- Confirm the Base44 entities and permissions for AI workers, documents, timeline events, settings, and notification records.
- Define final user-facing copy for restricted access, request-access, stale data, and unavailable data states.
- Decide where generated notifications, activity events, and customer-context snapshots are persisted.
- Decide which event categories are customer-visible, admin-only, support-only, or internal-only.

## Known Limitations

- The foundation is contract-first and UI-routable, not live-provider proof.
- Screenshot proof is local browser proof only; it does not prove production Cloudflare headers, Base44 publish state, or live data freshness.
- Some search sources intentionally use safe unavailable states until Worker #2 binds canonical live adapters.
- The current Windows checkout reports a case-colliding pagination file already tracked by the repo; this packet does not touch or stage that file.
