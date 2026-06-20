# Dashboard Simplification Checklist

Specific, actionable steps to simplify each dashboard interface.

---

## ADMIN DASHBOARD

### Step 1: Add System Status Banner
- [ ] Create `SystemStatusBanner` component (shows health, alerts, opportunities)
- [ ] Add to top of AdminDashboard (above all other content)
- [ ] Refresh every 30 seconds via `getSystemHealth()`
- [ ] Show: Health score, active blockers, optimization count

**Component Location:** `components/admin/SystemStatusBanner.jsx`

**Usage:**
```javascript
import SystemStatusBanner from '@/components/admin/SystemStatusBanner';

<AdminDashboard>
  <SystemStatusBanner />
  {/* Rest of dashboard */}
</AdminDashboard>
```

### Step 2: Leads Tab Simplification
Current: Dense table with 15 columns (Name, Email, Phone, Status, Score, Stage, Stage_at, Next_Follow_Up, Assigned_To, Last_Contacted_At, Created_At, etc.)

New: 
```
┌─ Leads Overview ──────────────────────────────┐
│  [TIER 1] 2 Leads Awaiting Response           │
│           [Take Action] [Dismiss]             │
│                                               │
│  [TIER 2] Key Metrics                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 47 New   │  │ 8 Hot    │  │ 23 Follow │  │
│  │ This Week│  │ Leads    │  │ Up Soon   │  │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
│  [TIER 3] Recent Leads                        │
│  [Name] [Status] [Score] [Next Action]       │
│  - Alice Johnson | Qualified | 87 | Call     │
│  - Bob Smith | Replied | 72 | Follow-up SMS  │
│  - Carol Davis | New | 45 | Send Pitch       │
│                                               │
│  [Show More (25 loaded, pagination button)]  │
├──────────────────────────────────────────────┤
│  [▼] All Leads by Status (toggle expand)     │
│  [▼] Lead Activity (toggle expand)           │
│  [▼] Automation Status (toggle expand)       │
└───────────────────────────────────────────────┘
```

**Actions:**
- [ ] Remove multi-column table (keep 4 cols: Name, Email, Status, Score)
- [ ] Add MetricCard grid (New, Hot, Follow-up counts)
- [ ] Create `LeadsTable` component with pagination (25 default)
- [ ] Add row click → detail view (no inline editing)
- [ ] Hide columns: Stage_at, Created_At, Assigned_To (show in detail view)
- [ ] Add bulk toolbar (Select All, Bulk Assign, Export)
- [ ] Make activity logs expandable (Tier 3)

**Component Location:** `components/admin/LeadsTableSimplified.jsx`

### Step 3: Automations Tab Simplification
Current: Dense list with manual controls everywhere

New:
```
┌─ Automations ─────────────────────────────────┐
│  [TIER 1] 1 Automation Paused (error)         │
│           [Resume] [Review Error]             │
│                                               │
│  [TIER 2] Automation Performance              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 12 Active│  │ 2.3K     │  │ 847      │   │
│  │ Automations  │ Triggered  │ Successful    │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
│  [TIER 3] Recent Automations                  │
│  [Name] [Status] [Trigger Count] [Last Run]  │
│  - SMS on Lead | Active | 234 | 2 min ago    │
│  - Email Campaign | Active | 156 | 5 min ago │
│  - Booking Reminder | Active | 89 | 12 min ago
│                                               │
│  [▼] Failed Automations (if any)              │
│  [▼] Automation Rules (expand to edit)        │
│  [▼] System Logs (expand for full history)    │
└───────────────────────────────────────────────┘
```

**Actions:**
- [ ] Remove manual controls from list (move to detail view)
- [ ] Show only: Name, Status, Trigger Count, Last Run
- [ ] Create MetricCard grid (Active count, triggered this week, success rate)
- [ ] Move edit/pause/resume to detail view (click row)
- [ ] Collapse automation rules by default (Tier 3)
- [ ] Add error alert (Tier 1) if any paused

**Component Location:** `components/admin/AutomationsTableSimplified.jsx`

### Step 4: Revenue Tab Simplification
Current: Orders + Subscriptions + Invoices = 3 separate tabs with complex controls

New:
```
┌─ Revenue ─────────────────────────────────────┐
│  [TIER 1] 1 Order Awaiting Payment            │
│           [Send Invoice] [Manual Credit]      │
│                                               │
│  [TIER 2] Revenue Metrics (This Month)        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ $45.2K   │  │ 23 New   │  │ $1.96K   │   │
│  │ Revenue  │  │ Orders   │  │ Avg Deal │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
│  [TIER 3] Recent Orders                       │
│  [Client] [Amount] [Status] [Due Date]       │
│  - Acme Corp | $2,497 | Paid | Jan 15        │
│  - Tech LLC | $1,297 | Pending | Jan 20      │
│                                               │
│  [▼] Subscriptions (show summary + list)      │
│  [▼] Invoices (show summary + list)           │
│  [▼] Payment Failures (if any)                │
│  [▼] Revenue Attribution (by campaign)        │
└───────────────────────────────────────────────┘
```

**Actions:**
- [ ] Combine Orders, Subscriptions, Invoices into single view
- [ ] Show orders by default, subscriptions/invoices in Tier 3
- [ ] Create MetricCard grid (revenue, order count, avg deal)
- [ ] Add payment failure alert (Tier 1)
- [ ] Simplify order list (Client, Amount, Status, Due Date)
- [ ] Move invoice controls to detail view
- [ ] Add pagination (25 orders default)

**Component Location:** `components/admin/RevenueTableSimplified.jsx`

### Step 5: System Health Tab Simplification
Current: Unknown (may not exist or be confusing)

New:
```
┌─ System Health ──────────────────────────────┐
│  Overall Health: HEALTHY (98%)                │
│                                               │
│  [TIER 2] Component Status                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ API      │  │ Database │  │ Webhooks │   │
│  │ HEALTHY  │  │ HEALTHY  │  │ HEALTHY  │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Stripe   │  │ Twilio   │  │ Resend   │   │
│  │ HEALTHY  │  │ HEALTHY  │  │ HEALTHY  │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
│  [TIER 3] Detailed Status                     │
│  [▼] Event Pipeline (depth, latency)          │
│  [▼] Queue Metrics (processed, pending)       │
│  [▼] Recent Errors (last 24 hours)            │
│  [▼] Performance (API p99, DB queries)        │
│  [▼] Uptime (last 30 days, SLA tracking)      │
└───────────────────────────────────────────────┘
```

**Actions:**
- [ ] Create component showing system health score
- [ ] Show component status as StatusBadge grid (API, DB, webhooks, integrations)
- [ ] Detailed metrics in expandable panels (Tier 3)
- [ ] Refresh every 30 seconds
- [ ] Alert on degradation

**Component Location:** `components/admin/SystemHealthSimplified.jsx`

---

## CLIENT PORTAL

### Step 1: Add System Status Banner
- [ ] Same as Admin Dashboard
- [ ] Show client-specific health (setup progress, automation status)

### Step 2: Dashboard Overview
Current: Potentially overwhelming with too many sections

New:
```
┌─ Your Dashboard ──────────────────────────────┐
│  [TIER 1] Setup In Progress (Step 3/5)        │
│           [Continue Setup] [View Timeline]    │
│                                               │
│  [TIER 2] Your Performance (This Week)        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 12 New   │  │ 3 Booked │  │ $4.2K    │   │
│  │ Leads    │  │ Calls    │  │ Pipeline │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
│  [TIER 3] Additional Info                     │
│  [▼] Recent Leads (5 items)                   │
│  [▼] Active Automations (3 running)           │
│  [▼] Next Steps (onboarding tasks)            │
└───────────────────────────────────────────────┘
```

**Actions:**
- [ ] Show max 3 MetricCards (leads, booked, revenue)
- [ ] Add onboarding progress bar (Tier 1)
- [ ] Collapse activity feeds (Tier 3)
- [ ] Remove technical jargon
- [ ] Every screen has one clear CTA

### Step 3: Leads View (Client)
Simpler than Admin (client only sees their own leads):

```
┌─ Your Leads ──────────────────────────────────┐
│  [TIER 2] Lead Status Summary                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 12 New   │  │ 5 Replied│  │ 2 Booked │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
│  [TIER 3] Recent Leads                        │
│  [Name] [Status] [Next Action] [Days Old]    │
│  - Alice Johnson | Replied | Send Proposal | 2 days
│  - Bob Smith | New | Send Intro | 1 day      │
│                                               │
│  [Show More - Pagination]                    │
│  [▼] Lead Details (expand to see full info)   │
└───────────────────────────────────────────────┘
```

**Actions:**
- [ ] Show only 3 MetricCards (new, replied, booked)
- [ ] Simplify lead list (Name, Status, Next Action)
- [ ] Click row → detail view
- [ ] Hide internal scoring/segments
- [ ] Paginate (10 items, client-focused)

### Step 4: Automations View (Client)
Show client impact, not technical details:

```
┌─ Your Automations ────────────────────────────┐
│  [TIER 2] Automation Activity (This Week)     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 3 Active │  │ 145      │  │ 89       │   │
│  │ Systems  │  │ Triggered│  │ Successful    │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
│  [TIER 3] Your Systems                        │
│  - Instant Lead Response | 145 sent, 98 replied
│  - Booking Agent | 34 bookings this week     │
│  - Review Requests | 23 sent, 12 completed   │
│                                               │
│  [▼] System Details (expand for controls)    │
│  [▼] Activity Log (expand for history)        │
└───────────────────────────────────────────────┘
```

**Actions:**
- [ ] Show business impact (leads, bookings, revenue)
- [ ] Hide technical configurations
- [ ] Move pause/resume to expanded detail view
- [ ] Collapse logs by default

---

## GTM DASHBOARD

### Step 1: Add System Status Banner
- [ ] Show GTM-specific health (campaign performance, funnel score)

### Step 2: GTM Overview
```
┌─ GTM Performance ────────────────────────────┐
│  Overall Funnel Score: 78/100                │
│                                               │
│  [TIER 2] Campaign Performance (This Month)  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ $45.2K   │  │ 3.2%     │  │ $324     │   │
│  │ Revenue  │  │ Conversion│ │ CPA      │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
│  [TIER 3] Active Campaigns                    │
│  [Campaign] [Traffic] [Leads] [ROI]          │
│  - Roofing Email Campaign | 4.2K | 89 | 262%
│  - HVAC Landing Page | 2.1K | 45 | 180%     │
│                                               │
│  [▼] Campaign Details (expand for metrics)   │
│  [▼] Funnel Analysis (expand for stages)     │
│  [▼] Optimization Opportunities              │
└───────────────────────────────────────────────┘
```

**Actions:**
- [ ] Show funnel health score (Tier 2)
- [ ] Show campaign MetricCards (revenue, conversion, CPA)
- [ ] List campaigns (name, traffic, leads, ROI only)
- [ ] Collapse detailed analysis (Tier 3)
- [ ] Pagination for campaigns (10 default)

---

## ANALYTICS DASHBOARD

### Step 1: Add System Status Banner

### Step 2: Analytics Overview
```
┌─ Analytics ───────────────────────────────────┐
│  [TIER 2] Funnel Performance (Last 30 Days)  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 24.5K    │  │ 3.2%     │  │ $1,847   │   │
│  │ Traffic  │  │ Conversion│ │ Revenue  │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
│  [TIER 3] Funnel Breakdown                    │
│  [Stage] [Visitors] [Conversion] [Drop-off]  │
│  Landing Page | 24.5K | 4.2% | 1.4K (5.7%)  │
│  Pricing | 4.2K | 3.2% | 1.3K (31%)         │
│  Checkout | 2.9K | 2.8% | 900 (30%)         │
│  Onboarding | 2.0K | 2.5% | 50 (2.5%)       │
│                                               │
│  [▼] Revenue Attribution (by campaign)       │
│  [▼] Industry Comparison (by vertical)       │
│  [▼] Detailed Event Logs (100 events)        │
└───────────────────────────────────────────────┘
```

**Actions:**
- [ ] Show key metrics in MetricCard grid
- [ ] Show funnel table (5 rows max, paginate for more)
- [ ] Collapse detailed analysis (Tier 3)
- [ ] Hide raw event logs by default

---

## IMPLEMENTATION PRIORITY ORDER

### Week 1 (Critical)
1. [ ] Add SystemStatusBanner globally
2. [ ] Simplify Admin Leads tab (remove dense table)
3. [ ] Simplify Admin Revenue tab
4. [ ] Unify sidebar navigation

### Week 2 (Important)
5. [ ] Simplify Client Portal dashboard
6. [ ] Simplify Admin Automations tab
7. [ ] Simplify Admin System Health tab
8. [ ] Add pagination to all lists

### Week 3 (Polish)
9. [ ] Simplify GTM Dashboard
10. [ ] Simplify Analytics Dashboard
11. [ ] Refine component usage
12. [ ] Final visual polish + testing

---

## TESTING CHECKLIST

For each dashboard:

- [ ] Load time < 2 seconds
- [ ] User identifies critical action in < 5 seconds
- [ ] All MetricCards display correct data
- [ ] Expandable sections collapse/expand smoothly
- [ ] Pagination works (25 items, load more button)
- [ ] Row click opens detail view
- [ ] Mobile responsive (sidebar collapses on mobile)
- [ ] System status banner refreshes every 30 sec
- [ ] No console errors
- [ ] Shared components (MetricCard, StatusBadge, etc.) render consistently