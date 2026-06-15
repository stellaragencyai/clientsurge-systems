# HOT / WARM / COLD Revenue Execution System

## Overview

ClientSurge now has a **Segment-Based Revenue Execution Engine** that automatically routes leads into structured automation pipelines based on their HOT/WARM/COLD classification.

Every lead is scored and assigned a segment label that determines:
- **Execution priority** (immediate vs. batched)
- **Message frequency** (daily vs. weekly)
- **Contact cadence** (aggressive vs. nurture)
- **Revenue focus** (highest vs. lowest priority)

---

## System Architecture

### Segment Classification

```
SEGMENT    INTENT SCORE    RECENCY    PRIORITY    PROCESSING
═══════════════════════════════════════════════════════════════
HOT        80–100          Recent     Highest     Real-time
WARM       50–79           Mixed      Moderate    Every 2h
COLD       0–49            Old        Low         Daily
```

### Execution Pipeline Flow

```
Lead Created
     ↓
Calculate Segment (intent_score + recency_score)
     ↓
Determine Execution Config
     ↓
Route to Segment Pipeline
     ↓
Queue AutomationJobs
     ↓
Process by Priority (HOT → WARM → COLD)
```

---

## HOT Lead Execution (80–100)

**Profile**: High-intent, ready to book, recent engagement

**Revenue Priority**: `highest`

**Processing**: Real-time, immediate execution

**Action Sequence**:
```
Step 1: Instant SMS (2 min)
  └─ Hot booking prompt with intent confirmation

Step 2: Booking Link SMS (5 min)
  └─ Direct link to calendar

Step 3: Follow-up SMS (2–4 hours)
  └─ Social proof + offer reinforcement

Step 4: Email (Next morning, 6–8 AM)
  └─ Detailed proposal + testimonials
```

**Frequency Cap**: Up to 3 messages per day

**Message Templates**:
- `hot_lead_booking_prompt` — Intent confirmation
- `hot_lead_booking_link` — Calendar link
- `hot_lead_followup_value` — Social proof
- `hot_lead_email_proposal` — Full offer

**Priority Score**: 85–100

**Example**:
```javascript
Lead: HVAC contractor, replied to SMS, intent_score=92, recency_score=98
→ Segment: HOT
→ Priority Score: 95
→ Execution: Immediate SMS + booking link
→ Status: Revenue-ready
```

---

## WARM Lead Execution (50–79)

**Profile**: Moderate interest, evaluating options, needs nurture

**Revenue Priority**: `moderate`

**Processing**: Batched every 2 hours

**Action Sequence**:
```
Step 1: Welcome SMS (2 hours)
  └─ Brief relationship building

Step 2: Educational Email (6 hours)
  └─ Thought leadership content

Step 3: Engagement Check (Day 2)
  └─ "Any questions?" soft touch

Step 4: Booking Gentle (Day 3)
  └─ Soft CTA after engagement signals

Step 5: Nurture Email Series (Days 4–7)
  └─ Multi-part educational sequence
```

**Frequency Cap**: Max 1 message per day

**Message Templates**:
- `warm_lead_welcome` — Relationship opening
- `warm_lead_educational` — Value-add content
- `warm_lead_engagement_check` — Interest probe
- `warm_lead_booking_gentle` — Soft CTA
- `warm_lead_nurture_series` — Multi-part education

**Priority Score**: 50–79

**Example**:
```javascript
Lead: Dental office owner, opened email, intent_score=65, recency_score=70
→ Segment: WARM
→ Priority Score: 68
→ Execution: Welcome → Education → Engagement → Booking
→ Status: Nurture pipeline (5–7 days)
```

---

## COLD Lead Execution (0–49)

**Profile**: Low interest, old lead, needs reactivation

**Revenue Priority**: `low`

**Processing**: Daily batching during off-peak hours

**Action Sequence**:
```
Step 1: Reactivation SMS (Day 7)
  └─ Value proposition refresh

Step 2: Educational Email (Day 10)
  └─ Case study or success story

Step 3: Re-engagement SMS (Day 14)
  └─ Soft interest check

Step 4: Win-Back Email (Day 21)
  └─ Limited-time special offer
```

**Frequency Cap**: Max 1 message per week

**Message Templates**:
- `cold_lead_reactivation_sms` — Value refresh
- `cold_lead_educational_email` — Case study
- `cold_lead_soft_reengagement` — Interest check
- `cold_lead_special_offer` — Win-back incentive

**Priority Score**: 0–49

**Example**:
```javascript
Lead: Roofing contractor, no activity in 60 days, intent_score=25, recency_score=5
→ Segment: COLD
→ Priority Score: 28
→ Execution: 7-day delay → reactivation sequence (21 days)
→ Status: Long-term nurture (3 weeks)
```

---

## Revenue Execution Priority Score

**Formula**:
```
base_score = segment tier (HOT: 85, WARM: 65, COLD: 30)

+ engagement_boost:
  - Replied: +10
  - Booked: +20

+ industry_boost:
  - High-value industries (Dental, Real Estate, Med Spa): +8

+ recency_boost:
  - Last activity <1 day ago: +5
  - Last activity <1 week ago: +3

= final_score (capped at 100)
```

**Usage**:
```javascript
import { calculateRevenueExecutionPriorityScore } from '@/lib/segmentExecutionEngine';

const lead = { ... };
const priorityScore = calculateRevenueExecutionPriorityScore(lead);

// Use for AutomationJob queue ordering
automationJobs.sort((a, b) => b.priority_score - a.priority_score);
```

---

## Automation Job Routing

### Priority Queue

```
Queue Processing Order:
1. HOT jobs (real-time, max 100 in queue)
2. WARM jobs (every 2 hours, max 500 in queue)
3. COLD jobs (daily off-peak, max 2000 in queue)
```

### Job Structure

```javascript
{
  lead_id: "lead_123",
  segment_label: "HOT",
  priority_score: 92,
  action_type: "instant_sms",
  message_template: "hot_lead_booking_prompt",
  scheduled_for: "2026-06-15T14:32:00Z",
  status: "pending",
  retry_count: 0,
  max_retries: 3,
  created_at: "2026-06-15T14:30:00Z"
}
```

### Job Routing Example

```javascript
import { sortJobsByPriority, filterJobsForBatch } from '@/lib/automationJobRouter';

// Sort all jobs by priority (HOT first)
const allJobs = await base44.entities.AutomationJob.list();
const sortedJobs = sortJobsByPriority(allJobs);

// Process top 50 in this batch
const batchToProcess = filterJobsForBatch(sortedJobs, 50);

// → Result: [ HOT_job1, HOT_job2, ..., WARM_job1, ..., COLD_job1, ... ]
```

---

## Integration Points

### 1. Lead Creation Flow

When a new lead is created:

```javascript
import { executeSegmentedLeadFlow } from '@/functions/executeSegmentedLeadFlow';

// On lead creation, trigger execution
const result = await base44.functions.invoke('executeSegmentedLeadFlow', {
  lead_id: newLead.id,
});

// → Automatically determines segment and queues actions
```

### 2. Lead Update Flow

When lead data changes (status update, new reply):

```javascript
// Recalculate segment
const segmentation = scoreLeadSegmentation(updatedLead);

// If segment changed (e.g., WARM → HOT), trigger re-execution
if (segmentation.segment_label !== oldSegment) {
  await base44.functions.invoke('executeSegmentedLeadFlow', {
    lead_id: updatedLead.id,
  });
}
```

### 3. Messaging System Integration

Respect segment frequency caps when sending:

```javascript
import { getExecutionCadenceSettings } from '@/lib/segmentExecutionEngine';

const cadence = getExecutionCadenceSettings(lead.segment_label);

if (messageCountToday < cadence.max_messages_per_day) {
  // Send message
} else {
  // Queue for tomorrow
}
```

### 4. Dashboard Display

Show segment on leads list:

```javascript
// In AdminLeadsTable or similar
<span className={getSegmentTier(lead.segment_label).color}>
  {lead.segment_label}
</span>
<span className="text-xs">{lead.intent_score} / {lead.recency_score}</span>
```

---

## System Safety

### ✅ Safe (Additive Layer Only)

- Segment routing logic (new)
- Priority queue management (new)
- AutomationJob routing (new)
- Execution helpers (new)
- No changes to Worker logic
- No changes to CommunicationEvent schema
- No changes to billing or onboarding systems

### ❌ Untouched

- Cloudflare Worker execution
- CommunicationEvent immutability
- Idempotency enforcement
- Event deduplication
- Webhook signature validation
- Stripe integration
- Onboarding workflow

---

## Example: Complete Lead Journey

### Scenario: Dental Office Owner — HOT Lead

```
Time 0:00 — Lead submits contact form
  → intent_score = 90 (booking_ready)
  → recency_score = 100 (just now)
  → segment_label = HOT
  → priority_score = 92

Time 0:02 — Instant SMS sent
  "Hi Sarah! Ready to see a demo? Click here → [link]"

Time 0:05 — Booking link SMS sent
  "Book your 15-min demo with our team → [calendar]"

Time 2:30 — Follow-up SMS sent
  "350+ dental practices use ClientSurge. You're in good company!"

Time 24:00 — Morning email sent
  "Your Automation Blueprint Proposal (PDF attached)"

RESULT: Booked demo by Time 6:00 (next day) → CONVERSION
```

### Scenario: HVAC Contractor — WARM Lead

```
Time 0:00 — Lead clicks "Learn More" link
  → intent_score = 65 (pricing_interest)
  → recency_score = 95 (recent click)
  → segment_label = WARM
  → priority_score = 68

Time 2:00 — Welcome SMS
  "Thanks for your interest! Here's what HVAC companies save..."

Time 6:00 — Educational email
  "Case Study: How TechHVAC got 23 leads/week"

Time 24:00 — Engagement check
  "Do you have any questions about the system?"

Time 48:00 — Booking prompt (if engaged)
  "Let's find a time for your personalized demo"

Time 72:00–168:00 — Nurture email sequence
  "How booking automation works", "ROI calculator", "FAQ guide"

RESULT: Booked by Day 5 OR moved to passive nurture
```

### Scenario: Roofing Company — COLD Lead

```
Time 0:00 — Old lead from 90 days ago
  → intent_score = 25 (unsure)
  → recency_score = 0 (very old)
  → segment_label = COLD
  → priority_score = 28

Time 168 hours (Day 7) — Reactivation SMS
  "We've helped 100+ roofers get 15+ leads/week"

Time 240 hours (Day 10) — Case study email
  "Commercial Roof Co: From 2 to 12 qualified leads"

Time 336 hours (Day 14) — Soft re-engagement
  "Curious if you'd be a fit for ClientSurge?"

Time 504 hours (Day 21) — Special win-back offer
  "50% off first month if you sign up this week"

RESULT: Reactivation sequence runs 3 weeks; if interest signals, upgrade to WARM
```

---

## Monitoring & Observability

### Job Queue Health

```javascript
import { getQueueStats } from '@/lib/automationJobRouter';

const jobs = await base44.entities.AutomationJob.list();
const stats = getQueueStats(jobs);

// → {
//   total_jobs: 1250,
//   pending_count: 843,
//   hot_count: 45,
//   warm_count: 312,
//   cold_count: 1893,
//   oldest_pending_age_minutes: 2
// }
```

### Segment Distribution

```javascript
import { scoreLeadSegmentation } from '@/lib/leadSegmentation';

const allLeads = await base44.entities.Leads.list();
const segments = allLeads.reduce((acc, lead) => {
  const seg = scoreLeadSegmentation(lead).segment_label;
  acc[seg] = (acc[seg] || 0) + 1;
  return acc;
}, {});

console.log(`HOT: ${segments.HOT}, WARM: ${segments.WARM}, COLD: ${segments.COLD}`);
```

---

## Next Steps

1. **Deploy executeSegmentedLeadFlow** to production
2. **Update submitLeadCapture** to call executeSegmentedLeadFlow on new leads
3. **Integrate segment-based frequency caps** into SMS/email sending systems
4. **Update AutomationJob processing** to use priority queue
5. **Add segment display** to leads dashboard
6. **Monitor queue health** via observability dashboards

---

**Status**: Production Ready  
**Architecture**: Additive execution layer, zero breaking changes  
**Integration Time**: ~4 hours  
**Safety Level**: High (no core logic modifications)