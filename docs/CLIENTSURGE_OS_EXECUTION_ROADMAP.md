# ClientSurge OS Execution Roadmap

## Program goal

Transform the existing ClientSurge Systems application into a coherent AI-powered business transformation platform without breaking production contracts.

## Delivery method

- GitHub is the development and documentation source of truth.
- Work is divided into small, reviewable pull requests.
- New modules follow the target architecture.
- Legacy modules remain operational until replacements pass contract and smoke tests.
- No large-bang rewrite is permitted.

## Workstream A — Program control and architecture

### A1. Establish branch and PR dependency map

- Inventory all open redesign, activation, release, Twilio, and data-quality PRs.
- Identify stacked branches and merge order.
- Mark superseded work.
- Prevent parallel edits to the same route or contract without an explicit owner.

**Exit criteria:** one documented merge sequence and no ambiguous competing implementation branch.

### A2. Create architecture decision records

Required decisions:

- Existing-app modernization instead of greenfield rebuild.
- GitHub as source of truth.
- White-dominant application design.
- Customer-facing language standard.
- Route modularization without URL changes.
- Platform adapter strategy.
- Single production release authority.

**Exit criteria:** every major architectural choice has rationale, consequences, and rollback considerations.

### A3. Introduce module ownership boundaries

Define owners for purchase, activation, Command Center, customer modules, admin, platform integrations, and release engineering.

**Exit criteria:** every changed file can be mapped to one workstream.

## Workstream B — Design System 2.1

### B1. Finalize semantic tokens

- White workspace and neutral surface hierarchy.
- Navy navigation and brand panels.
- Electric-blue action and attention hierarchy.
- Semantic success, warning, danger, and information colors.
- Typography, spacing, radii, shadows, focus rings, and motion.

### B2. Build product primitives

- Buttons and links.
- Inputs, selects, toggles, radio cards, and upload zones.
- Cards, metric cards, status panels, and empty states.
- Alerts, toasts, dialogs, drawers, and progress indicators.
- Tables, filters, tabs, timelines, and activity feeds.
- Chart palette and formatting rules.

### B3. Build the application shell

- Navy sidebar.
- White main workspace.
- Top bar and account controls.
- Mobile navigation.
- Page header and breadcrumb patterns.
- Global loading, error, unauthorized, and offline states.

**Exit criteria:** authentication, activation, Command Center, billing, and admin can be assembled from shared primitives without introducing new visual systems.

## Workstream C — Purchase experience

### C1. Package contract

- Lock Starter, Growth, and Pro entitlements.
- Define setup and recurring pricing.
- Define website option compatibility.
- Define add-ons, limits, upgrades, downgrades, and billing timing.
- Ensure the server computes authoritative price and package data.

### C2. Selection experience

- Package comparison.
- Website path selection.
- Optional add-on selection.
- Persistent order summary.
- Back navigation without state loss.
- Clear estimated activation window.

### C3. Checkout reliability

- Server-side price validation.
- Idempotent checkout session creation.
- Duplicate-order protection.
- Payment failure recovery.
- Abandoned-checkout recovery.
- Confirmation email and event logging.

**Exit criteria:** a production smoke test can purchase every valid package and website-path combination without losing query or selection state.

## Workstream D — Authentication and account creation

- Instant account creation after purchase.
- Existing-account resolution.
- Correct client/admin role routing.
- Password recovery and reset.
- Session security and logout.
- Clear unavailable, ineligible, expired-link, and support states.

**Exit criteria:** a paid customer reaches activation directly with one identity and no repeated onboarding data.

## Workstream E — Guided activation

### Activation steps

1. Business Profile.
2. Website and Domain.
3. Brand and Content.
4. Lead Preferences.
5. Booking Preferences.
6. Communication Channels.
7. Connected Services.
8. Review and Submit.

### Required behaviors

- Autosave every completed field group.
- Resume across devices.
- Pre-fill order and known business data.
- Explain why sensitive information is required.
- Store credentials securely and separately.
- Validate connections where possible.
- Show blockers and estimated completion impact.

**Exit criteria:** all three website paths and all package tiers produce a complete activation payload and initialize the installation pipeline.

## Workstream F — Installation operating system

### Lifecycle

```text
new_order
payment_verified
activation_started
information_complete
website_work
service_installation
integration_testing
quality_assurance
ready_for_launch
live
monitoring
blocked
cancelled
```

### Customer tracker

- Current phase.
- Completed work.
- Next action.
- Customer blockers.
- Estimated completion range.
- Support access.

### Internal operations

- Assigned installer.
- Package and website path.
- Service checklist.
- Credential health.
- Test evidence.
- QA approval.
- Launch authorization.
- Audit trail.

**Exit criteria:** no customer can be marked ready or live without required service tests and launch evidence.

## Workstream G — Six AI services

Each service specification must include trigger, inputs, outputs, customer-visible outcome, prerequisites, consent rules, status model, retries, failure handling, observability, test procedure, and deactivation behavior.

1. Instant Lead Response.
2. Missed-Call Text-Back.
3. Fourteen-Day Lead Nurture.
4. AI Booking Agent.
5. Daily Business Digest.
6. Inbound Communication Handling.

**Exit criteria:** each service can be independently activated, tested, monitored, and reported while still appearing as one coordinated customer system.

## Workstream H — Command Center

### Primary panels

- Business Pulse.
- Growth Snapshot.
- AI Service Activity.
- Website Intelligence.
- Attention and Opportunities.

### Data principles

- Show outcomes before configuration.
- Distinguish live data, estimated data, and unavailable data.
- Never display fabricated metrics.
- Show source and time range where material.
- Provide drill-down to leads, conversations, bookings, and service events.

**Exit criteria:** a customer can answer “What happened, what did ClientSurge do, what result did it create, and what needs me?” within ten seconds.

## Workstream I — Customer modules

### Leads

Unified lead record, source, status, qualification, contact details, conversation history, booking, follow-up, notes, tags, search, and filters.

### Conversations

SMS, email, chat, calls, summaries, handoff, reply, contact context, and appointment context.

### Bookings

Upcoming, completed, cancelled, rescheduled, no-show, source, appointment details, and attribution.

### Website

Preview, domain, form health, tracking health, performance, edit requests, and conversion activity.

### AI Services

Status, recent outcomes, settings, connection health, test controls, and escalation rules.

### Performance

Traffic, leads, appointments, conversion, response time, channels, trends, and period comparison.

## Workstream J — Billing, support, and settings

- Current system and add-ons.
- Subscription and invoices.
- Payment method and failed-payment recovery.
- Upgrade, downgrade, cancellation, and retention.
- Value reporting.
- Help center and support requests.
- Users, roles, notifications, security, and connected services.

## Workstream K — Admin operating system

- Admin Command Center.
- Orders and customers.
- Activation and installation queues.
- Website projects.
- Service health and failures.
- Support and incidents.
- Revenue and subscription operations.
- Audit logs and reconciliation.

## Workstream L — Platform architecture

### Adapters

Create stable interfaces around:

- Data entities.
- Authentication.
- Payments.
- SMS and voice.
- Email.
- Calendar and booking.
- Analytics.
- File storage.

Application modules must not scatter direct provider calls when an adapter can own authorization, validation, retries, logging, and error normalization.

### Data and events

Define canonical IDs, tenant ownership, statuses, event names, timestamps, idempotency keys, retention, and audit requirements.

## Workstream M — Security and compliance

- Tenant isolation.
- Role-based access.
- Secret and credential storage.
- Webhook signature verification.
- Rate limiting and input validation.
- Consent and opt-out enforcement.
- Data retention and deletion.
- Admin auditability.
- Incident response.

## Workstream N — QA and release

### Automated gates

- Build, lint, typecheck.
- Unit and integration tests.
- Contract tests.
- Accessibility checks.
- Responsive route checks.
- Security and secret-leak guards.
- Checkout and activation smoke tests.
- Service-specific smoke tests.

### Release policy

- One production workflow owns deployment.
- Deploy an exact built artifact.
- Stamp and verify the full source SHA.
- Run post-deploy smoke tests.
- Retain immutable release evidence.
- Maintain a tested rollback path.

## Recommended first twelve pull requests

1. Product Bible and current-state audit.
2. Open-PR dependency and merge-order cleanup.
3. Design System 2.1 semantic token correction.
4. Shared application shell foundation.
5. Route registry extraction by domain.
6. Authentication component migration.
7. Package contract and selection-state consolidation.
8. Checkout contract hardening.
9. Activation data model and autosave contract.
10. Activation tracker and installation status model.
11. Command Center shell with truthful empty states.
12. First end-to-end purchase-to-Command-Center test.

## Program metrics

- Time from first visit to completed checkout.
- Checkout completion rate.
- Time from payment to activation start.
- Activation completion rate.
- Median time to ready-for-launch.
- Percentage of eligible customers live within promised window.
- Service activation success rate.
- Lead-response latency.
- Missed-call recovery rate.
- Appointment conversion rate.
- Percentage of customers with no unresolved blockers.
- Support contacts per activation.
- Release failure and rollback rate.

## Definition of done

The program is complete when ClientSurge provides a simple, reliable path from package selection to a live AI-powered business system, with truthful performance visibility, operational controls, automated quality gates, and a maintainable GitHub-owned architecture.