# ClientSurge Systems: Single Source of Truth Architecture

**Status:** Active | **Last Updated:** 2026-06-14 | **Compliance:** Zero Breaking Changes

## Overview
This document establishes the canonical data architecture for ClientSurge Systems. All new integrations, functions, and features must adhere to this hierarchy. Existing systems remain backward-compatible; legacy entities are maintained for migration purposes only.

---

## 1. PRIMARY ENTITIES (Source of Truth)

### CRM Layer
- **Primary Entity:** `Leads` (CRM records for all prospect/customer lifecycle)
  - Used by: All AI agents, scoring engines, routing logic, automation
  - Key fields: `full_name`, `email`, `phone`, `status`, `lead_score`, `crm_stage`
  - Uniqueness: Deduplicated by normalized `email` + `phone` combo
  - Update flow: `Leads` → derived `LeadAnalytics`

- **Legacy Entity:** `Lead` (deprecated, retained for backward compatibility only)
  - Status: Read-only; no new writes
  - Migration: Existing `Lead` records remain; treat as archive
  - Note: Do not create new `Lead` records in any new function

### Messaging & Events Layer
- **Primary Entity:** `CommunicationEvent` (all system activity)
  - Records: Webhook ingestion, SMS/email sends, intent classifications, workflow triggers
  - Used by: Mission Control dashboard, audit logs, analytics, conversation context
  - Key fields: `lead_id`, `channel`, `direction`, `event_type`, `status`, `provider`, `message_body`
  - Write frequency: Every significant system action

- **Primary Entity:** `Messages` (canonical message content storage)
  - Records: Full SMS/email bodies, transcripts, AI-generated replies
  - Used by: Conversation display, enrichment, sentiment analysis
  - Key fields: `content`, `message_type`, `direction`, `status`, `conversation_thread_id`
  - Uniqueness: Linked to CommunicationEvent by implicit join

- **Primary Entity:** `ConversationThread` (conversation grouping only)
  - Purpose: Group related `Messages` by lead + channel
  - Fields: `lead_id`, `primary_channel`, `thread_status`, `message_count`, `last_message_at`
  - Immutable: Does not store message content; references only

- **Legacy Entity:** `Events` (deprecated, no new writes)
  - Status: Archived; migrate existing read references to `CommunicationEvent`

### Conversation Context
- **Primary Entity:** `ConversationThread` (single grouping structure)
  - Do not create parallel conversation tracking elsewhere
  - Linked via: `ConversationThread.lead_id` ↔ `Leads.id`

---

## 2. SECONDARY ENTITIES (Derived / Reporting)

These entities are **read-primarily**, updated asynchronously from primary data.

- **LeadAnalytics** (derived from `Leads` + `CommunicationEvent` aggregates)
  - Purpose: Dashboards, trends, historical snapshots
  - Update: Async job refreshes hourly
  - Dependency: Must not be treated as source-of-truth for lead state

- **MetricsSnapshot** (derived from `Order` + `CommunicationEvent` + `Leads`)
  - Purpose: Performance reporting, KPI tracking
  - Update: Scheduled daily/weekly
  - Dependency: Reflects aggregates only; primary data lives in source entities

---

## 3. SAAS LAYER (Core Multi-Tenant Structure)
**Not modified; primary structure preserved.**

- `Client` — Account/organization
- `ClientProject` — Project/workspace within client
- `Subscription` — Billing subscription
- `Order` — Purchase record
- `ClientInstallationOS` — Installation workflow state
- `AdminSettings` — System configuration (per-client)

---

## 4. AUTOMATION SYSTEM
**Primary automation execution system:**

- `AutomationRule` — Declarative rule definitions (conditions + actions)
- `AutomationJob` — Execution records (runs triggered by rules)

**Secondary automation entities (available but non-primary):**
- `DripCampaign`, `EmailCampaign`, `EmailDripCampaign` — Legacy campaign management (read-only for now)
- `NurtureCampaign` — Campaign sequences (integrated via `AutomationRule`)

---

## 5. DATA FLOW: THE AUTHORITATIVE PIPELINE

```
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SOURCES                                           │
│  • Twilio (SMS/calls)                                       │
│  • Resend (emails)                                          │
│  • ElevenLabs (voice calls)                                 │
│  • Webhook registrations (client forms)                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  WORKER / INGESTION LAYER                                   │
│  • Cloudflare Workers (real-time processing)                │
│  • webhookLeadCapture, receiveTwilioInboundSms, etc.        │
│  • Signature validation, normalization, deduplication       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────────┐           ┌──────────────────────┐
│  CommunicationEvent  │           │  Leads (CRM Primary) │
│  • Every action      │           │  • Lead state        │
│  • Audit trail       │           │  • Scores, stages    │
│  • Activity log      │           │  • Assignments       │
└──────────────────────┘           └──────────────────────┘
        │                                   │
        │                                   │
        ▼                                   ▼
┌──────────────────────┐           ┌──────────────────────┐
│  Messages            │           │  ConversationThread  │
│  • Full content      │           │  • Group messages    │
│  • Transcripts       │           │  • Thread metadata   │
│  • AI generations    │           │  • Channel tracking  │
└──────────────────────┘           └──────────────────────┘
        │
        │
        ▼
┌──────────────────────────────────────────────┐
│  ANALYTICS & REPORTING (Async, Derived)      │
│  • LeadAnalytics (aggregate metrics)          │
│  • MetricsSnapshot (snapshot reporting)       │
│  • Dashboard queries (aggregates over primary)│
└──────────────────────────────────────────────┘
```

**Key Rules:**
1. Never read `Lead` entity for active CRM operations; use `Leads`
2. Every system action must create a `CommunicationEvent` record
3. Conversation grouping always via `ConversationThread`
4. Analytics always derived from `Leads` + `CommunicationEvent`, never source-of-truth
5. Automations triggered via `AutomationRule` → `AutomationJob`

---

## 6. BACKWARD COMPATIBILITY GUARANTEE

- All existing `Lead` records remain intact and readable
- Existing Twilio/Resend webhook flows continue unchanged
- Cloudflare Worker integrations unmodified
- Legacy entity `Events` remains available but deprecated
- No breaking changes to public function signatures or entity schemas

---

## 7. MIGRATION PATH (For Future Cleanup)

When ready, legacy cleanup steps (not required; optional):
1. Migrate remaining `Lead` references to `Leads`
2. Archive `Events` entity entirely
3. Consolidate `LeadAnalytics` refresh to depend only on `Leads` + `CommunicationEvent`
4. Update all function documentation to reference primary entities only

---

## 8. IMPLEMENTATION CHECKLIST

- [x] Define primary entities: `Leads`, `CommunicationEvent`, `Messages`, `ConversationThread`
- [x] Mark secondary: `LeadAnalytics`, `MetricsSnapshot`
- [x] Mark legacy: `Lead`, `Events`
- [x] Preserve SaaS layer: `Client`, `ClientProject`, `Subscription`, `Order`, `ClientInstallationOS`
- [x] Confirm `AutomationRule` + `AutomationJob` as primary automation system
- [x] Document data flow pipeline
- [x] Zero breaking changes (backward compatibility verified)
- [ ] Update all backend function comments to reference primary entities
- [ ] Add entity usage guidance to function docstrings

---

## 9. QUESTIONS & ESCALATION

For architectural decisions not covered here, escalate to **system architect** with:
- Current entity being queried
- Intended use case
- Data freshness requirements (real-time vs. eventual)