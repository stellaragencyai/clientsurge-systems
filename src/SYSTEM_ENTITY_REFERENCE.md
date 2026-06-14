# ClientSurge Systems: Entity Reference Guide

**Quick reference for entity usage across all backend functions.**

---

## Entity Classification Matrix

| Entity | Status | Primary Use | Write Frequency | Read Frequency | Notes |
|--------|--------|------------|-----------------|----------------|-------|
| **Leads** | ✅ PRIMARY | CRM (all prospect/customer ops) | High | Very High | Use for all new CRM logic |
| **Lead** | ⚠️ LEGACY | (None - read-only) | None | Low | Deprecated; migrate to Leads |
| **CommunicationEvent** | ✅ PRIMARY | Audit log, activity tracking, analytics | Very High | High | Every system action |
| **Messages** | ✅ PRIMARY | Message content storage | High | Medium | Linked via ConversationThread |
| **ConversationThread** | ✅ PRIMARY | Conversation grouping | Medium | Medium | Only grouping structure for chats |
| **Events** | ⚠️ LEGACY | (None - read-only) | None | Very Low | Deprecated; use CommunicationEvent |
| **LeadAnalytics** | 📊 DERIVED | Reporting, dashboards | Low (async) | High | Read-only; aggregates from Leads |
| **MetricsSnapshot** | 📊 DERIVED | KPI snapshots, trends | Low (scheduled) | Medium | Read-only; reporting only |
| **Client** | ✅ SAAS | Account/organization | Low | High | Core multi-tenant |
| **ClientProject** | ✅ SAAS | Project workspace | Low | High | Core multi-tenant |
| **Subscription** | ✅ SAAS | Billing subscription | Low | Medium | Core multi-tenant |
| **Order** | ✅ SAAS | Purchase record | Medium | High | Core multi-tenant |
| **ClientInstallationOS** | ✅ SAAS | Installation workflow | Medium | Medium | Core multi-tenant |
| **AutomationRule** | ✅ PRIMARY | Automation definitions | Low | Medium | Primary automation system |
| **AutomationJob** | ✅ PRIMARY | Automation execution records | High | Medium | Primary automation system |
| **DripCampaign** | 📊 SECONDARY | Campaign orchestration | Low | Low | Secondary; integrate via AutomationRule |
| **EmailCampaign** | 📊 SECONDARY | Email sequences | Low | Low | Secondary; integrate via AutomationRule |
| **NurtureCampaign** | 📊 SECONDARY | Nurture sequences | Low | Low | Secondary; integrate via AutomationRule |
| **AdminSettings** | ✅ SAAS | System config | Low | High | Per-client settings |

---

## Usage Patterns by Function Type

### CRM Operations
```javascript
// ✅ CORRECT: Use Leads
const lead = await base44.entities.Leads.get(lead_id);
const qualified = await base44.entities.Leads.filter({ status: 'Qualified' });

// ❌ WRONG: Don't use Lead (legacy)
const lead = await base44.entities.Lead.get(lead_id); // Deprecated
```

### Event Tracking
```javascript
// ✅ CORRECT: Every system action → CommunicationEvent
await base44.entities.CommunicationEvent.create({
  lead_id: lead.id,
  event_type: 'sms_sent',
  channel: 'sms',
  status: 'sent',
  provider: 'twilio',
});

// ❌ WRONG: Don't write to Events
await base44.entities.Events.create(...); // Deprecated
```

### Message Storage
```javascript
// ✅ CORRECT: Store message content in Messages
await base44.entities.Messages.create({
  content: smsBody,
  message_type: 'sms',
  direction: 'outbound',
  conversation_thread_id: thread.id,
});

// ✅ CORRECT: Log the send event
await base44.entities.CommunicationEvent.create({
  lead_id: lead.id,
  event_type: 'sms_sent',
  channel: 'sms',
});
```

### Conversation Grouping
```javascript
// ✅ CORRECT: Group messages via ConversationThread
const thread = await base44.entities.ConversationThread.get(thread_id);
const messages = thread.messages; // Contains all messages in thread

// ❌ WRONG: Don't create parallel grouping structures
// Only ConversationThread groups conversations
```

### Analytics & Reporting
```javascript
// ✅ CORRECT: Read from derived entities for reporting
const snapshot = await base44.entities.MetricsSnapshot.list();
const analytics = await base44.entities.LeadAnalytics.filter({ lead_id });

// ✅ CORRECT: For real-time dashboards, aggregate from primary sources
const leads = await base44.entities.Leads.filter({ status: 'Hot' });
const events = await base44.entities.CommunicationEvent.filter({ lead_id });

// ❌ WRONG: Don't treat LeadAnalytics as source-of-truth
// It's a derived reporting layer, not authoritative
```

### Automation
```javascript
// ✅ CORRECT: Define rules via AutomationRule
await base44.entities.AutomationRule.create({
  rule_name: 'Hot Lead Router',
  trigger_type: 'lead_scored',
  conditions: [{ field: 'lead_score', operator: 'greater_than', value: '75' }],
  actions: [{ action_type: 'send_sms', params: { template: 'hot_lead' } }],
});

// ✅ CORRECT: Track executions via AutomationJob
await base44.entities.AutomationJob.create({
  automation_rule_id: rule.id,
  lead_id: lead.id,
  status: 'completed',
});

// ⚠️ OPTIONAL: Campaign entities available but secondary
// Use AutomationRule for new automation logic
```

---

## Common Function Patterns

### Pattern 1: Ingest Webhook → Create Lead → Log Event
```javascript
// Step 1: Deduplicate & create/retrieve Leads record
const existing = await base44.entities.Leads.filter({
  normalized_email: email.toLowerCase(),
  normalized_phone: phone,
});
const lead = existing.length > 0 ? existing[0] : await base44.entities.Leads.create({...});

// Step 2: Store message content if applicable
const message = await base44.entities.Messages.create({
  content: payload.message,
  conversation_thread_id: thread.id,
});

// Step 3: Log comprehensive event
await base44.entities.CommunicationEvent.create({
  lead_id: lead.id,
  event_type: 'lead_created',
  channel: 'webhook',
  status: 'received',
  message_body: payload.message,
});

// Step 4: Trigger automation
await base44.functions.invoke('automationOrchestrator', { lead_id: lead.id });
```

### Pattern 2: AI Response → Send → Log
```javascript
// Step 1: Generate AI response
const response = await base44.integrations.Core.InvokeLLM({ prompt });

// Step 2: Send via provider
const sendResult = await sendViaTwilio({ to: lead.phone, body: response });

// Step 3: Store message
await base44.entities.Messages.create({
  content: response,
  direction: 'outbound',
  conversation_thread_id: thread.id,
  status: sendResult.status,
});

// Step 4: Log event
await base44.entities.CommunicationEvent.create({
  lead_id: lead.id,
  event_type: 'sms_sent',
  channel: 'sms',
  status: sendResult.success ? 'sent' : 'failed',
  provider: 'twilio',
  metadata_json: JSON.stringify({ sid: sendResult.sid }),
});

// Step 5: Update lead state if needed
if (someCondition) {
  await base44.entities.Leads.update(lead.id, { status: 'Replied' });
}
```

### Pattern 3: Dashboard Query → Aggregate from Primary Sources
```javascript
// WRONG: Read from MetricsSnapshot directly
const snapshot = await base44.entities.MetricsSnapshot.list('-created_date', 1);
// This is stale; depends on batch job schedule

// CORRECT: Aggregate real-time from primary sources
const leads = await base44.entities.Leads.list('-updated_date', 100);
const hotLeads = leads.filter(l => l.lead_score > 75);

const recentEvents = await base44.entities.CommunicationEvent.filter({
  event_type: 'sms_sent',
  created_date: { $gte: '2026-06-14T00:00:00Z' },
}, '-created_date', 50);

const result = {
  hot_leads_count: hotLeads.length,
  sms_sent_today: recentEvents.length,
  timestamp: new Date().toISOString(),
};
```

---

## Deprecation Timeline

- **Phase 1 (Now):** Mark `Lead` and `Events` as legacy; no new writes
- **Phase 2 (Q3 2026):** Migrate all function references to primary entities; update docs
- **Phase 3 (Q4 2026):** Optional cleanup: archive `Lead` and `Events` entirely

---

## Questions?

Refer to `ARCHITECTURE_SYSTEM_OF_TRUTH.md` for full context and rationale.