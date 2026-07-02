# Wave A Surface Inventory — Initial Audit

Date: 2026-07-02
Branch: `clientsurge-design-ops-system`

## Scope

This is the first audit pass for the ClientSurge Design & Operations System. It inventories source-level surfaces before mutating production UI.

No production data was changed. No Stripe live objects were touched. No pricing was changed.

## Current Open Workstream Conflicts

Several active PRs already overlap with this area:

- PR #1224 — Design & Operations System foundation
- PR #1225 — Unsupported public proof and trusted-by claims cleanup
- PR #1227 — 12 industry landing page system
- PR #1230 — Admin dashboard truth check banner component

### Risk

Do not make broad UI edits directly against `main` until these PRs are reviewed/merged or explicitly sequenced. Otherwise, we risk merge conflicts and duplicated/reverted design work.

## Public Website Inventory

Source evidence:

- Public route metadata is centralized in `src/lib/publicRouteMetadata.js`.
- App routes are declared in `src/App.jsx`.

### Public Core Pages

| Surface | Route | Source | Current Priority | Initial Assessment |
|---|---|---|---|---|
| Home | `/` | `src/pages/Home` | P0 | Main conversion surface. Needs screenshot/visual QA before mutation. |
| Pricing | `/pricing` | `PricingPage` | P0 | Revenue-critical. Must not change pricing without explicit approval. |
| Contact | `/contact` | `Contact` | P0 | Lead capture path. Must be tested live after any UI/function change. |
| Product Signup | `/product-signup` | `ProductSignup` | P0 | Checkout handoff path. Treat as high-risk. |
| Automations | `/automations` | `Automations` | P1 | Service education page. Should align with design tokens. |
| Industries | `/industries` | `Industries` | P1 | Directory page; overlaps PR #1227. |
| Blog | `/blog` | `Blog` | P2 | SEO/supporting surface. |
| Proof | `/proof` | `ProofPage` | P1 | Trust surface; must avoid unverified claims. |
| Legal | `/privacy`, `/terms`, `/sms-terms`, `/refund-policy` | Legal/SMS pages | P1 | Compliance/trust surfaces. |

### Public Route Governance Observations

- `PUBLIC_ROUTE_METADATA` only includes the core crawlable pages and legal pages.
- Static aliases redirect legacy/secondary routes like `/book`, `/book-demo`, `/store`, `/product`, `/about`, `/industries`, `/blog`, `/faq`, `/proof`, and `/library` toward canonical public targets.
- `NOINDEX_ROUTE_PREFIXES` explicitly noindexes auth, setup, hidden conversion, client, admin, and internal surfaces.

### Immediate Website Risks

1. There are many source-level public pages but only a smaller subset appears in `PUBLIC_DIRECTORY_PAGES`/sitemap metadata.
2. Industry pages are active routes, but a separate industry PR is already open, so do not duplicate that work here.
3. Proof/trust pages must be reviewed against the proof taxonomy before adding or restoring any claims.
4. Signup/checkout/contact paths should be smoke-tested before cosmetic redesign.

## Industry Page Inventory

Source evidence:

- `INDUSTRY_ROUTE_SLUGS` currently declares these public industry routes:
  - `med-spa`
  - `dental`
  - `hvac`
  - `plumbing`
  - `roofing`
  - `chiropractic`
  - `contractors`
  - `real-estate`
  - `personal-injury`
  - `property-services`
  - `veterinary`

### Assessment

Industry pages are already structurally present, and PR #1227 is actively building this system. This design/ops workstream should not edit industry page content until #1227 is reviewed.

Recommended next action: after PR #1227 settles, apply design tokens and proof rules to industry pages.

## Client Portal Inventory

Source evidence: `src/internal-pages/ClientPortal.jsx`.

### Current Modules Present

The portal already includes many modules:

- Setup progress hub
- Support chat
- Plan manager
- Lead activity feed
- Payment failed banner
- Lead flow dashboard
- Notification bell
- Quick start wizard / inline quick start
- Deadlines panel
- Files panel
- Billing dashboard
- Referrals
- Settings
- Tasks dashboard
- Automation overview
- Automated responses log
- Automation checklist
- What's new
- Client order status
- Portal timeline
- System status badge
- Missing assets banner
- Getting started banner
- Launch readiness panel
- Active automations panel
- Recent system proof panel
- Recent issues panel

### Portal IA Problems

The portal is powerful but likely too fragmented.

Current tab list has 18+ tabs and several emoji-led labels:

- Setup Progress
- Timeline
- Quick Start
- Performance
- Lead Flow
- Tasks
- Checklist
- My Leads
- Deadlines
- Files & Docs
- Billing
- Referrals
- Support & Messaging
- My Plan
- Weekly Report
- What's New
- Settings
- Order Status

### Portal Risks

1. Too many tabs can make the client portal feel like an admin tool instead of a confidence center.
2. Emoji-led labels conflict with the new premium design direction.
3. Proof-related modules exist, but need to be normalized to the proof/status taxonomy.
4. Admin preview state still uses gold/brown visual treatment; this should be moved to the blue/black system.
5. Portal has many useful modules, but the first impression should be simplified into: status, next step, proof, support, billing.

### Recommended Portal 2.0 IA

Replace the 18+ tab experience with 6–8 grouped sections:

1. Overview
2. Setup Progress
3. Automations
4. Leads & Activity
5. Reports
6. Billing
7. Files & Credentials
8. Support

## Admin Dashboard Inventory

Source evidence: `src/internal-pages/AdminDashboard.jsx`.

### Current Admin Groups

The admin dashboard already groups navigation into:

- Leads & Intelligence
- Clients & Onboarding
- Automation
- Revenue & Funnels
- System Health
- Tools

### Admin Strengths

- Strong module coverage.
- Has existing health/proof concepts: Launch Proof, Launch Truth Sprint, Data Quality, Twilio Health, Integration Health, Communication Logs, Resend Diagnostics, Audit Log.
- Has tab-level error boundaries.
- Has unread/error counts for Inbox and CommunicationEvent failures.

### Admin Risks

1. Navigation is very large and can feel like a junk drawer.
2. Overview dashboard should become a mission-control layer, not another module list.
3. Status/proof displays must converge into the new taxonomy.
4. Some labels are tool-focused rather than outcome-focused.
5. Many features exist, but without a universal proof contract, green checks and status badges can drift.

### Recommended Admin Mission Control IA

Create one top-level overview with cards for:

- Revenue
- New leads
- Hot leads
- Stalled onboarding
- Failed automations
- Email health
- SMS/Twilio health
- Stripe checkout health
- Base44 publish status
- GitHub release status
- Analytics status

Each card must include status, checkedAt, source, evidence, and next action.

## Communications Inventory

This area is already advanced from Wave 1 and Wave 2 email system work.

Current state:

- Shared email design system exists from Wave 1.
- Wave 2 PR #1217 is open for sender identities, weekly/monthly/missing-credentials/direct-follow-up/nurture upgrades, QA guardrails, preview fixtures, and Resend configuration documentation.

### Recommendation

Do not duplicate communications edits in this PR. Merge/verify #1217 first, then apply the notification/proof engine model.

## Initial Priority Stack

### P0 — Do first

1. Sequence/merge open PRs to avoid collision.
2. Verify contact/signup/checkout paths still work after current PR stack.
3. Simplify client portal IA plan before touching UI.
4. Define proof data contract before adding more status cards.

### P1 — Do next

1. Convert portal tab labels away from emoji-led labels.
2. Collapse portal tabs into clearer grouped sections.
3. Add portal proof summary using the proof taxonomy.
4. Create admin mission-control overview requirements.

### P2 — Later

1. Trust center pages.
2. ClientSurge University.
3. Changelog/status page.
4. Broader component refactor.

## Ruthless Takeaway

The product already has a lot of pieces. The problem is not lack of features. The problem is fragmentation.

If we keep adding modules, the product will feel bigger but not better. The next high-leverage move is to reduce cognitive load and standardize proof, status, and design across the existing surfaces.