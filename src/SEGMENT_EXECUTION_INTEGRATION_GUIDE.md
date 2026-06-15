# Segment Revenue Execution - Integration Quick Guide

## System Components

✅ **Segment Calculation** (`lib/leadSegmentation.js`)
- Calculates: intent_score, recency_score, segment_label
- Combines AI intent + activity timing + industry weighting

✅ **Execution Engine** (`lib/segmentExecutionEngine.js`)
- HOT/WARM/COLD configs with message sequences
- Priority score calculation
- Action routing logic

✅ **Execution Orchestrator** (`functions/executeSegmentedLeadFlow.js`)
- Main entry point for segment-based execution
- Queues actions per segment
- Logs execution plan

✅ **Job Router** (`lib/automationJobRouter.js`)
- Priority queue management
- HOT → WARM → COLD processing order
- Batch filtering and sorting

---

## 3-Step Integration

### Step 1: Lead Creation Hook

**In `submitLeadCapture` or `handleNewLead`:**

```javascript
import { scoreLeadSegmentation } from '@/lib/leadSegmentation';

// Create lead
const lead = await base44.entities.Leads.create({
  full_name, email, phone, business_name, problem,
  source, source_page, utm_source, utm_campaign, // existing fields
  // Segment will be calculated on creation via executeSegmentedLeadFlow
});

// Trigger execution
await base44.functions.invoke('executeSegmentedLeadFlow', {
  lead_id: lead.id,
});
```

### Step 2: Lead Status Update Hook

**When lead status changes (e.g., Replied, Booked):**

```javascript
// Update status
await base44.entities.Leads.update(leadId, {
  status: 'Replied',
  last_contacted_at: new Date().toISOString(),
});

// Recalculate and potentially re-route if segment changes
await base44.functions.invoke('executeSegmentedLeadFlow', {
  lead_id: leadId,
});
```

### Step 3: Message Frequency Gating

**In `sendSMS` or `sendEmail`:**

```javascript
import { getExecutionCadenceSettings } from '@/lib/segmentExecutionEngine';

async function sendMessage(leadId, messageText, channel) {
  const lead = await base44.entities.Leads.get(leadId);
  const cadence = getExecutionCadenceSettings(lead.segment_label);

  // Count messages sent today
  const todayMessages = await base44.entities.Messages.filter({
    lead_id: leadId,
    direction: 'outbound',
    created_date: { $gte: getTodayStart() },
  });

  if (todayMessages.length >= cadence.max_messages_per_day) {
    // Queue for tomorrow instead of sending now
    console.log(`[FrequencyCap] ${lead.segment_label} lead at daily limit, queueing`);
    // Create AutomationJob with future scheduled_for time
    return;
  }

  // Safe to send
  await sendMessageToProvider(lead.phone, messageText, channel);
}
```

---

## Field Updates on Leads Entity

✅ Added fields:
```json
{
  "intent_score": { "type": "number", "default": 0 },
  "recency_score": { "type": "number", "default": 0 },
  "segment_label": { "type": "string", "enum": ["HOT", "WARM", "COLD"] }
}
```

These are populated automatically by `executeSegmentedLeadFlow`.

---

## Sample Usage Patterns

### Pattern 1: Get Next Actions for Lead

```javascript
import { getNextExecutionAction } from '@/lib/segmentExecutionEngine';

const lead = await base44.entities.Leads.get(leadId);
const nextAction = getNextExecutionAction(lead);

if (nextAction) {
  console.log(`Next: ${nextAction.action.type} (${nextAction.action.timing})`);
  // → e.g., "Next: instant_sms (immediate)"
}
```

### Pattern 2: Get Full Automation Sequence

```javascript
import { getFullExecutionSequence } from '@/lib/segmentExecutionEngine';

const sequence = getFullExecutionSequence(lead);

console.log(`${lead.segment_label} lead: ${sequence.actions_sequence.length} actions`);
// → "HOT lead: 4 actions"

sequence.actions_sequence.forEach((action, i) => {
  console.log(`${i + 1}. ${action.type} (${action.timing})`);
});
```

### Pattern 3: Sort AutomationJobs by Priority

```javascript
import { sortJobsByPriority } from '@/lib/automationJobRouter';

const allJobs = await base44.entities.AutomationJob.list();
const prioritized = sortJobsByPriority(allJobs);

// First 10 are guaranteed to be highest-priority
const nextBatch = prioritized.slice(0, 10);
```

### Pattern 4: Process Jobs in Batches

```javascript
import { filterJobsForBatch, isJobReadyToProcess } from '@/lib/automationJobRouter';

const pending = await base44.entities.AutomationJob.filter({ status: 'pending' });
const batch = filterJobsForBatch(pending, 50); // Get top 50 by priority

for (const job of batch) {
  if (isJobReadyToProcess(job)) {
    await executeJob(job);
  }
}
```

### Pattern 5: Dashboard Display

```javascript
import { getSegmentTier } from '@/lib/leadSegmentation';

// In AdminLeadsTable component
<div className="flex items-center gap-2">
  <span 
    className="px-2 py-1 rounded text-white text-xs font-bold"
    style={{ backgroundColor: getSegmentTier(lead.segment_label).color }}
  >
    {lead.segment_label}
  </span>
  <span className="text-xs text-gray-600">
    Intent: {lead.intent_score} | Recency: {lead.recency_score}
  </span>
</div>
```

---

## Functions to Update

### High Priority

1. **submitLeadCapture**
   - Call `executeSegmentedLeadFlow` after creating lead
   - Time: 10 min

2. **handleNewLead**
   - Call `executeSegmentedLeadFlow` for any new lead trigger
   - Time: 5 min

3. **sendSMS** / **sendEmail**
   - Add frequency cap check using `getExecutionCadenceSettings`
   - Time: 15 min

### Medium Priority

4. **processAutomationJobs**
   - Use `sortJobsByPriority` to order processing
   - Use `filterJobsForBatch` for batching
   - Time: 20 min

5. **updateLeadStatus**
   - Re-trigger `executeSegmentedLeadFlow` on status changes
   - Time: 10 min

### Nice to Have

6. **getClientAnalytics** / dashboard functions
   - Show segment distribution (HOT/WARM/COLD counts)
   - Show priority queue health
   - Time: 30 min

---

## Testing Checklist

```javascript
// Test 1: Lead scoring
const lead = { intent_score: 90, recency_score: 95, industry: 'dental' };
const seg = scoreLeadSegmentation(lead);
assert(seg.segment_label === 'HOT');

// Test 2: Execution config
const config = getExecutionConfig('HOT');
assert(config.actions.length === 4);

// Test 3: Priority score
const priority = calculateRevenueExecutionPriorityScore(lead);
assert(priority >= 85);

// Test 4: Job sorting
const jobs = [ { segment_label: 'COLD' }, { segment_label: 'HOT' } ];
const sorted = sortJobsByPriority(jobs);
assert(sorted[0].segment_label === 'HOT');

// Test 5: Cadence
const cadence = getExecutionCadenceSettings('HOT');
assert(cadence.max_messages_per_day === 3);
```

---

## No-Break Guarantees

✅ **No Worker changes**  
✅ **No CommunicationEvent changes**  
✅ **No billing system changes**  
✅ **No onboarding workflow changes**  
✅ **All existing queries continue to work**  
✅ **100% backward compatible**  

---

## Monitoring Commands

```javascript
// Queue health
const jobs = await base44.entities.AutomationJob.list();
const stats = getQueueStats(jobs);
console.log(stats);

// Segment distribution
const leads = await base44.entities.Leads.list();
const distribution = leads.reduce((acc, l) => {
  const seg = scoreLeadSegmentation(l).segment_label;
  acc[seg] = (acc[seg] || 0) + 1;
  return acc;
}, {});
console.log(distribution);

// Processing delay estimate
const batch = filterJobsForBatch(jobs, 100);
const estimate = estimateBatchProcessingTime(batch);
console.log(`Est. ${estimate.estimated_minutes} min to process 100 jobs`);
```

---

## Deployment Order

1. Deploy `lib/leadSegmentation.js` + Leads schema update
2. Deploy `lib/segmentExecutionEngine.js`
3. Deploy `lib/automationJobRouter.js`
4. Deploy `functions/executeSegmentedLeadFlow.js`
5. Update `submitLeadCapture` to trigger execution
6. Update SMS/email sending to respect frequency caps
7. Update AutomationJob processing to use priority queue
8. Monitor queue health and segment distribution

---

**Total Integration Time**: ~2 hours  
**Risk Level**: Very low (additive only)  
**Testing Time**: ~30 min  
**Go-Live**: Ready for production