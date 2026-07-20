# ClientSurge Phase C Customer Operations Foundations

## Scope

This branch creates static, reviewable Phase C foundations for:

- AI Workforce OS
- Client Timeline
- Communication Center
- Customer Success Workspace

No production route is mounted. No live adapter is connected. No production data is queried.

## Base And Branch

- Base: `origin/feature/phase-b-business-intelligence-foundations`
- Branch: `feature/phase-c-customer-operations-foundations`
- Review route: `/review/phase-c/`

## Binding Sources

- #1381 Phase C execution track
- #1371 Enterprise design governance
- #1372 Component acceptance library
- #1373 Global navigation and cross-module contract
- #1359 Cross-phase product contracts

## Route Map

The committed route is isolated under `review/phase-c/index.html` and loads `src/review/phase-c/phase-c-entry.jsx`.

Query parameters:

- `system=aiWorkforce|clientTimeline|communicationCenter|customerSuccess`
- `state=<fixture state>`
- `controls=0` to hide review controls for screenshot validation

Examples:

- `/review/phase-c/?system=aiWorkforce&state=healthy&controls=0`
- `/review/phase-c/?system=clientTimeline&state=restricted&controls=0`
- `/review/phase-c/?system=communicationCenter&state=failed&controls=0`
- `/review/phase-c/?system=customerSuccess&state=risk&controls=0`

## Component Inventory

- `CSCustomerOperationsGallery`
- `CSAIWorkforceOS`
- `CSClientTimeline`
- `CSCommunicationCenter`
- `CSCustomerSuccessWorkspace`
- `PhaseCSurface`
- `PhaseCSituationStrip`
- `PhaseCSection`
- `TruthIndicator`
- `FreshnessIndicator`
- `EvidenceCard`
- `OwnerBadge`
- `ActionCard`
- `RecommendationCard`
- `TimelineEvent`
- `WorkerCard`
- `ConversationCard`
- `RiskCard`
- `SuccessPlanList`
- `LoadingState`
- `UnavailableState`
- `RestrictedState`

## Five-Second Screen Contract

Every Phase C screen starts with:

- What is happening
- Needs attention
- Next action

This keeps current state and next action ahead of passive reporting on desktop, tablet, and mobile.

## Fixture Matrix

AI Workforce OS:

- loading
- current
- healthy
- degraded
- attention_required
- blocked
- paused
- offline
- unknown
- unavailable
- not_configured

Client Timeline:

- normal
- delayed
- restricted
- empty

Communication Center:

- unread
- failed
- escalated
- permission_restricted

Customer Success Workspace:

- healthy
- risk
- missing_data
- incomplete_setup

## Truth And Freshness Contract

Every non-control surface exposes:

- Source
- Source ID
- Truth
- Freshness
- Permission scope
- Explanation

Unknown is not healthy. Not configured is distinct from offline. Paused is not treated as an error. Sent, delivered, and read are represented as separate communication states.

## Permission And Role Matrix

Static fixtures represent these owner and visibility classes:

- customer
- ClientSurge staff
- AI worker
- external provider
- system
- unassigned

Restricted fixtures explain that content may exist without leaking protected titles, snippets, counts, or customer detail.

## Event And Source Contract

Timeline events include:

- Event ID
- Timestamp
- Source
- Actor
- Verification state
- Business summary
- Related object
- Permission scope
- Deep link

The normal timeline fixture includes customer, human, AI, system, communication, appointment, payment, website, configuration, status change, and support categories.

## Accessibility Contract

The browser validator checks:

- one page `h1`
- logical heading presence
- no duplicate IDs
- no horizontal overflow
- 44 by 44 minimum interactive targets
- reduced-motion browser context
- axe serious/critical findings on screenshot fixtures
- 200 percent text reflow at 390 and 375 widths
- changed-code console errors

## Validation Commands

Required validation:

```bash
npm ci
npx eslint src/components/customer-operations
git diff --check
npm run typecheck
npm run build
node scripts/validate-phase-c-customer-operations-browser.mjs
```

## Known Limitations

- This is a static foundation only.
- No production data adapters are included.
- No production route is mounted.
- No unsupported health score, revenue claim, ROI claim, or AI result is fabricated.
- Worker #3 still owns rendered UX, accessibility, responsive, and product-quality approval.
