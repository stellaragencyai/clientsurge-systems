# ClientSurge Design & Operations System

## Objective

Create one unified operating system for every ClientSurge customer/admin touchpoint: website, client portal, admin dashboard, email, SMS, reports, onboarding, support, billing, proof, and release health.

This is not a cosmetic redesign. The goal is operational consistency: every visual state, data claim, CTA, notification, and status indicator must follow one shared design language and one proof model.

## Non-negotiables

- Do not mutate Stripe live objects while building this system.
- Do not change pricing while building this system.
- Do not delete production data.
- Do not mark any status as trusted without proof.
- Do not create static green checks that are not backed by live evidence.
- Base44 production changes must sync/publish from GitHub main after review.

## Pillars

### 1. Shared Product Design System

Create one source of truth for:

- Colors
- Typography
- Cards
- Buttons
- Tables
- Badges
- Progress states
- Empty states
- Loading states
- Error states
- Alert banners
- Forms
- Modals
- Charts
- Status panels

Every customer-facing and admin-facing surface must inherit this system.

### 2. Client Portal 2.0

Upgrade the portal from a basic access point into a client confidence center.

Required modules:

- Setup progress timeline
- Active automation status
- Installation milestones
- Activity feed
- Documents and credentials center
- Billing section
- Support request section
- What happens next panel
- Launch readiness checklist
- Reports and performance section

### 3. Admin Mission Control

Upgrade admin from scattered tabs into a real operating dashboard.

Required modules:

- Lead operations
- Client operations
- Automation operations
- Revenue operations
- Email operations
- SMS/Twilio operations
- Resend operations
- Stripe operations
- AI agent operations
- System health
- Release status
- Proof center

### 4. Unified Notification Engine

Centralize customer/internal communication logic.

Supported channels:

- Email
- SMS
- Internal admin alerts
- Future: Slack
- Future: client portal notifications

Every notification should have:

- Sender identity
- Template version
- Category
- Channel
- Recipient
- Reply-to policy
- Delivery provider
- Event log
- Retry policy
- Proof trail

### 5. Proof & Health Layer

Every status claim must answer:

- What is being checked?
- Which system is source of truth?
- When was it last checked?
- What is the evidence?
- Is it trusted, blocked, warning, stale, or unknown?

Proof categories:

- Website uptime
- Contact form submission
- Stripe checkout
- Order creation
- Client account creation
- Onboarding submission
- Email delivery
- SMS delivery
- Twilio webhook status
- Resend domain health
- AI agent status
- Base44 publish status
- GitHub release status
- Analytics status

### 6. Trust Layer

Add credibility surfaces:

- Status page
- Changelog
- Release notes
- Security page
- Privacy center
- Infrastructure page
- Support center
- Known issues page
- Roadmap page

### 7. ClientSurge University

Create self-serve education:

- Setup guides
- Industry playbooks
- Automation explainer pages
- Video walkthroughs
- Troubleshooting docs
- FAQ
- Billing help
- Onboarding help

## Execution Waves

### Wave A — Audit & Inventory

Inventory all product surfaces and classify them by risk and customer impact.

Deliverables:

- Surface inventory
- Component inventory
- Status/proof inventory
- Broken brand inconsistency list
- High-impact quick wins

### Wave B — Design Tokens & Shared Components

Build or document reusable tokens/components before redesigning pages.

Deliverables:

- Design token file
- Component usage guide
- Shared status badges
- Shared proof panel model
- Shared empty/error/loading state model

### Wave C — Portal Confidence Upgrade

Start with client-facing portal because paying customers see it.

Deliverables:

- Portal progress timeline
- Portal automation status cards
- Portal activity feed
- Portal support/next-step block
- Portal proof summary

### Wave D — Admin Mission Control

Rebuild the admin as a real operations center.

Deliverables:

- Admin overview dashboard
- Health center
- Release center
- Email/SMS ops sections
- Revenue/client ops summaries

### Wave E — Notification & Proof Engine

Centralize event-driven communication and proof.

Deliverables:

- Notification event schema
- Proof check schema
- Health status taxonomy
- Admin proof center
- Communication history view

### Wave F — Trust + University

Add external trust and education surfaces.

Deliverables:

- Status page
- Changelog
- Security page
- Help center
- ClientSurge University starter docs

## Status Taxonomy

Use these consistently across website, admin, portal, emails, and reports.

| Status | Meaning | UI Treatment |
|---|---|---|
| trusted | Verified with current evidence | Green/positive badge |
| warning | Working but needs attention | Yellow/warning badge |
| blocked | Cannot proceed | Red/blocking badge |
| unknown | Not enough data | Gray/unknown badge |
| stale | Evidence is old | Amber/stale badge |
| pending | Waiting for async action | Blue/pending badge |

## Proof Object Model

Recommended shape:

```ts
export type ClientSurgeProofStatus = "trusted" | "warning" | "blocked" | "unknown" | "stale" | "pending";

export type ClientSurgeProofCheck = {
  id: string;
  label: string;
  category: "website" | "stripe" | "base44" | "github" | "resend" | "twilio" | "analytics" | "client" | "automation";
  status: ClientSurgeProofStatus;
  source: string;
  checkedAt: string;
  evidence?: string;
  actionUrl?: string;
  owner?: "system" | "support" | "admin" | "client";
};
```

## First Implementation Target

Start with a non-invasive foundation PR:

1. Add this blueprint.
2. Add design token documentation.
3. Add proof/status taxonomy documentation.
4. Add an audit checklist.
5. Do not mutate production app behavior yet.

Then begin Wave A audit before touching major UI components.
