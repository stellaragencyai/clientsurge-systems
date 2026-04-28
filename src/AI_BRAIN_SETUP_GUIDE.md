# AI Brain Setup Guide - Complete Automation

## Status

```
✅ PHASE 1: AI CORE FUNCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ scoreLeadIntelligence        [DEPLOYED]
✅ classifyLeadIntent           [DEPLOYED]
✅ generateSmartResponse        [DEPLOYED]
✅ predictLeadOutcome           [DEPLOYED]
✅ decideNextAction             [DEPLOYED]
✅ routeToOptimalTeamMember     [DEPLOYED]
✅ predictChurnRisk             [DEPLOYED]
✅ automationOrchestrator       [DEPLOYED]
```

---

## The 7 AI Functions

### 1️⃣ **scoreLeadIntelligence** 
**What:** Scores leads 0-100 based on quality + engagement
**Input:** lead_id
**Output:** Score + Tier (Hot/Warm/Cold) + Next Action
**Triggers:** On lead creation, after each interaction

**Example Output:**
```
Score: 87 (Hot)
Reasoning: "Quick response (2 min), viewed booking page 3x, positive sentiment"
Signals: ["fast_replier", "high_intent", "engaged"]
Next Action: "Route to sales rep immediately"
```

---

### 2️⃣ **classifyLeadIntent**
**What:** Reads customer messages, detects their true intent
**Input:** lead_id + message_text
**Output:** Intent type + Confidence + Recommended Action

**10 Intent Types:**
- `ready_to_book` → Customer ready NOW
- `asking_question` → Wants clarification
- `price_concern` → Cost objection
- `uncertain` → Interested but hesitant
- `not_interested` → Losing interest
- `objection_timing` → "Not right now"
- `objection_fit` → "Not right for us"
- `requesting_info` → Wants proposal/case study
- `complaint` → Unhappy
- `already_scheduled` → Already booked elsewhere

**Example:**
```
Message: "Are you open Saturday?"
Intent: asking_question (confidence: 98%)
Recommended: "Answer specifically about Saturday hours + suggest booking now"
```

---

### 3️⃣ **generateSmartResponse**
**What:** Writes personalized SMS/email responses automatically
**Input:** lead_id + intent + message_type (sms/email)
**Output:** Personalized message + Tone + Personalization details

**Example:**
```
Input Intent: "price_concern"
Output SMS: "Sarah, I get it! Our Signature Facial is actually $89 cheaper than 
most places + includes a free consultation. Worth 15 mins? [LINK]"
```

---

### 4️⃣ **predictLeadOutcome**
**What:** Predicts if/when lead will book with probability
**Input:** lead_id + project_id
**Output:** Booking % + Timeline + Risk factors + Acceleration strategy

**Example:**
```
Booking Probability: 72%
Timeline: 3-4 days
Risk Factors: ["price_sensitivity", "comparing_competitors"]
Acceleration: "Send comparison chart + testimonial from similar business"
```

---

### 5️⃣ **decideNextAction**
**What:** Decides optimal next step for each lead
**Input:** lead_id + intent + score + booking_probability
**Output:** Action recommendation + Timing + Success metric

**10 Possible Actions:**
- `send_sms` - Send SMS with booking link
- `send_email` - Send email with case study
- `send_offer` - Send special offer/discount
- `schedule_call` - Suggest phone consultation
- `send_testimonial` - Send success story
- `ask_question` - Ask clarifying question
- `send_case_study` - Send relevant case study
- `re_engage` - Win-back message
- `move_to_nurture` - Add to nurture sequence
- `assign_to_sales` - Escalate to human rep

**Example Decision Tree:**
```
IF intent = "ready_to_book" AND score > 75
  → ACTION: send_sms with booking link
  → TIMING: Immediately
  → SUCCESS METRIC: "Booking within 1 hour"

IF intent = "price_concern" AND score > 50
  → ACTION: send_offer + case study
  → TIMING: Within 2 hours
  → SUCCESS METRIC: "Reply with renewed interest"

IF score < 30
  → ACTION: move_to_nurture
  → TIMING: Tomorrow
  → SUCCESS METRIC: "Engagement in 7 days"
```

---

### 6️⃣ **routeToOptimalTeamMember**
**What:** Assigns leads to best closer based on historical performance
**Input:** lead_id + project_id
**Output:** Best team member + Confidence + Expected close time

**Routing Logic:**
- Match specialty to lead type
- Prioritize high conversion rate
- Balance workload (avoid overloading)
- Consider fastest closers for hot leads
- Consider thorough closers for complex leads

**Example:**
```
Lead: Med Spa, High Intent (85/100)
Team: John (40% close rate, 2 leads), Sarah (25% close rate, 12 leads)
Decision: Assign to John
Reasoning: "Highest conversion rate, available, med spa specialty"
Expected Close: 2 days
```

---

### 7️⃣ **predictChurnRisk**
**What:** Identifies existing customers at risk of leaving
**Input:** lead_id (must have booked before)
**Output:** Churn risk score (0-100) + Level + Re-engagement strategy

**Churn Levels:**
- `Low` (0-30) - Booking recently, engaged
- `Medium` (30-60) - Slightly overdue, inconsistent
- `High` (60-80) - Overdue by 30+ days, no engagement
- `Critical` (80-100) - Very overdue, ghost customer

**Example:**
```
Last Booking: 65 days ago
Typical Frequency: Every 45 days
Overdue: 20 days
Engagement: None in 14 days
Churn Risk: 72% (High)
Strategy: "Send special offer + win-back email today"
Offer: "Free upgrade on next booking if scheduled this week"
```

---

## Automation Orchestrator

**Function:** `automationOrchestrator`

Runs all 7 functions in sequence for complete AI workflow:

```
Lead Comes In
    ↓
Step 1: Score Lead (0-100)
    ↓
Step 2: Classify Intent (if message present)
    ↓
Step 3: Predict Outcome (booking %)
    ↓
Step 4: Decide Next Action
    ↓
Step 5: Generate Smart Response (if messaging needed)
    ↓
Step 6: Route to Team Member (if hot lead)
    ↓
Step 7: Analyze Churn Risk (if returning customer)
    ↓
✅ RESULT: Complete AI workflow decision tree
```

**Example Output:**
```json
{
  "score": 87,
  "intent": "ready_to_book",
  "booking_probability": 89,
  "next_action": "send_sms",
  "assigned_to": "John (Med Spa Expert)",
  "churn_risk": "Low"
}
```

---

## Integration Points

### Trigger 1: On Lead Capture (Webhook)
```javascript
// In webhookLeadCapture.js
const aiResult = await base44.functions.invoke("automationOrchestrator", {
  lead_id: createdLead.id,
  project_id: project.id,
  trigger_event: "lead_created"
});
```

### Trigger 2: On Lead Reply
```javascript
// When lead replies to SMS
const aiResult = await base44.functions.invoke("automationOrchestrator", {
  lead_id,
  project_id,
  trigger_event: "lead_replied"
});
```

### Trigger 3: Scheduled Daily (Score all leads)
```javascript
// Automated job runs 8am daily
await base44.functions.invoke("automationOrchestrator", {
  lead_id: eachLead.id,
  project_id,
  trigger_event: "daily_rescore"
});
```

---

## Cost Analysis

| Function | API Calls | Cost | Speed |
|----------|-----------|------|-------|
| scoreLeadIntelligence | 1 LLM | $0.01 | 2-3s |
| classifyLeadIntent | 1 LLM | $0.01 | 2-3s |
| generateSmartResponse | 1 LLM | $0.01 | 2-3s |
| predictLeadOutcome | 1 LLM | $0.01 | 2-3s |
| decideNextAction | 1 LLM | $0.01 | 2-3s |
| routeToOptimalTeamMember | 1 LLM | $0.01 | 2-3s |
| predictChurnRisk | 1 LLM | $0.01 | 2-3s |
| **Per Lead (Full Workflow)** | **7 LLM** | **$0.07** | **14-20s** |

**At scale:** 100 leads/day = $7/day = $210/month = Excellent ROI

---

## Next: 5 Optimization Steps

These 5 steps will organize and simplify automations per business.