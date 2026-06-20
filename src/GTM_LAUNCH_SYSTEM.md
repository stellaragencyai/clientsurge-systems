# Go-To-Market Launch System (Lightweight)

Unified GTM orchestration layer connecting landing pages, pricing pages, campaigns, and revenue tracking into a measurable acquisition system.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GTMLaunchEngine                         │
│            (Central Orchestration & Tracking)               │
│  - Funnel health score                                      │
│  - Bottleneck identification                                │
│  - Revenue attribution                                      │
│  - Industry performance                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  AcquisitionCampaign                        │
│            (Per-Campaign Tracking & Metrics)                │
│  - Landing page → Pricing → Checkout → Onboarding          │
│  - Conversion rates, ROI, CPC, CPA                          │
│  - Revenue attribution per campaign                         │
│  - Performance vs. benchmarks                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌──────────────────────────────┐   ┌──────────────────────────────┐
│  Read-Only Integrations      │   │  Data Sources (No Writes)    │
├──────────────────────────────┤   ├──────────────────────────────┤
│ • ConversionTrackingEvent    │   │ • Traffic source             │
│ • LandingPageAnalytics       │   │ • Landing page behavior      │
│ • ConversionFunnel           │   │ • Pricing page views         │
│ • RevenueTracking            │   │ • Checkout conversions       │
│ • EmailCampaign              │   │ • Revenue per lead           │
│ • OutboundSequence           │   │ • Email engagement           │
└──────────────────────────────┘   └──────────────────────────────┘
```

---

## End-to-End Acquisition Flow

```
Traffic → Landing Page → Pricing → Checkout → Onboarding → Revenue → Optimization Loop
   ↓           ↓            ↓          ↓           ↓           ↓
  [1]         [2]          [3]        [4]         [5]         [6]
 Track      Measure      Identify   Convert    Activate    Attribute
 Sources    Engagement   Objections  Customers   Value       ROI
```

### Stage Details

**Stage 1 — Traffic (Acquisition)**
- Measure: sessions, clicks, cost
- Identify: source performance (organic, paid, email, referral)
- Optimize: bid strategy, audience targeting

**Stage 2 — Landing Page**
- Measure: bounce rate, scroll completion, time on page
- Identify: engagement bottlenecks (copy, CTA placement, design)
- Optimize: headline, value prop, CTA position

**Stage 3 — Pricing**
- Measure: pricing page views, abandonment, selection patterns
- Identify: pricing objections, tier confusion
- Optimize: tier positioning, social proof, guarantees

**Stage 4 — Checkout**
- Measure: conversion rate, cart abandonment, payment failures
- Identify: friction points (form length, trust signals)
- Optimize: checkout steps, security badges, exit-intent offers

**Stage 5 — Onboarding**
- Measure: activation rate, feature adoption, support tickets
- Identify: setup bottlenecks, missing guidance
- Optimize: onboarding flow, guided tours, help docs

**Stage 6 — Revenue & Optimization**
- Measure: revenue per lead, LTV, repeat purchase rate
- Identify: which campaigns drive highest-value customers
- Optimize: reinvest in winning campaigns, pause low-ROI ones

---

## Entities

### GTMLaunchEngine
Central tracking for acquisition performance and funnel health.

**Key Fields:**
- `gtm_id`: Unique identifier
- `client_project_id`: Associated project
- `status`: draft, active, scaling, paused
- `primary_industry`: Target vertical
- `traffic_sources`: [organic, paid, outbound, referral, email]
- `funnel_stage_bottleneck`: Identified friction point
- `conversion_rate`: Overall traffic-to-customer %
- `revenue_per_lead`: Average revenue per acquisition
- `funnel_score`: Overall health (0-100)
- `active_campaigns_count`: Number of running campaigns
- `total_traffic_this_month`: Session count
- `total_conversions_this_month`: Leads/customers acquired
- `attributed_revenue_this_month`: Campaign-driven revenue

**Usage:**
```javascript
// Fetch GTM health for a client project
const gtm = await base44.entities.GTMLaunchEngine.filter({
  client_project_id: "project-123",
  status: "active"
});

// Get current funnel score
console.log(gtm[0].funnel_score); // 0-100 health indicator
console.log(gtm[0].funnel_stage_bottleneck); // traffic | landing_page | pricing | checkout | onboarding
```

### AcquisitionCampaign
Tracks individual marketing campaigns across all channels.

**Key Fields:**
- `campaign_id`: Unique identifier
- `gtm_id`: Parent GTM instance
- `campaign_type`: landing_page, outbound, email, ads, retargeting, organic, referral
- `campaign_name`: Human-readable name
- `industry_target`: Target vertical
- `status`: draft, active, paused, completed, archived
- `landing_page_url`: Primary landing page
- `pricing_page_url`: Pricing destination
- `expected_conversion_rate`: Benchmark %
- `actual_conversion_rate`: Measured %
- `traffic_generated`: Session count
- `leads_generated`: Total leads
- `revenue_attributed`: Total revenue from campaign
- `cost`: Media spend
- `roi`: Return on investment %
- `cpc`: Cost per click
- `cpl`: Cost per lead
- `cpa`: Cost per acquisition
- `bounce_rate`: Landing page bounce %
- `avg_time_on_page`: Avg session duration
- `scroll_completion_rate`: % scrolled to bottom

**Usage:**
```javascript
// List active campaigns for an industry
const campaigns = await base44.entities.AcquisitionCampaign.filter({
  gtm_id: "gtm-123",
  status: "active",
  industry_target: "roofing"
});

// Get campaign ROI
campaigns.forEach(c => {
  console.log(`${c.campaign_name}: ROI ${c.roi}%, CPA $${c.cpa}`);
});

// Identify highest-performing campaign
const topCampaign = campaigns.reduce((best, c) => 
  c.roi > best.roi ? c : best
);
```

---

## Integration Rules

### Read-Only Data Sources
GTM system pulls metrics from these entities — **NO WRITES TO THESE**:

1. **ConversionTrackingEvent** — individual conversion events (page views, CTA clicks, form submits)
2. **LandingPageAnalytics** — page-level metrics (impressions, bounce rate, scroll depth, CTR)
3. **ConversionFunnel** — funnel stage data (drop-off per stage)
4. **RevenueTracking** — revenue attribution and order data
5. **EmailCampaign** — email campaign performance and engagement
6. **OutboundSequence** — outbound campaign results

### No Cross-System Modifications
- GTM **never modifies** CRM, billing, automation, or lead management systems
- GTM is **read-only** from all existing systems
- GTM **only writes** to GTMLaunchEngine and AcquisitionCampaign entities

---

## Safety Rules

✅ **ALLOWED:**
- Create and update GTMLaunchEngine and AcquisitionCampaign records
- Read from ConversionTrackingEvent, LandingPageAnalytics, RevenueTracking, etc.
- Compute derived metrics (ROI, CPA, funnel scores)
- Track campaign performance and attribution

❌ **NOT ALLOWED:**
- Modify lead records in the Leads entity
- Change automation rules or sequences
- Alter billing or subscription records
- Delete or modify existing campaigns after completion (archive instead)

---

## Success Criteria

System is successful when:

✅ Acquisition performance **can be tracked per campaign**
- Every campaign has measurable: traffic, leads, revenue, ROI

✅ Funnel bottlenecks **are visible per industry**
- GTMLaunchEngine.funnel_stage_bottleneck identifies where to optimize
- Can slice metrics by industry to compare roofing vs. HVAC vs. dental

✅ Revenue attribution **is connected to campaigns**
- Each campaign tracks attributed revenue
- ROI, CPA, and LTV are measurable and optimizable

✅ System **remains lightweight and scalable**
- No duplicate data; read-only from existing entities
- Minimal schema: 2 entities, clean separation of concerns
- Can handle 100+ simultaneous campaigns without performance degradation

---

## Example: Tracking a Roofing Campaign

```javascript
// 1. Create GTM Engine for roofing vertical
const gtm = await base44.entities.GTMLaunchEngine.create({
  gtm_id: "gtm-roofing-2026",
  client_project_id: "project-456",
  status: "active",
  primary_industry: "roofing",
  traffic_sources: ["paid", "organic", "referral"],
  funnel_stage_bottleneck: "pricing"
});

// 2. Create campaign for storm response outreach
const campaign = await base44.entities.AcquisitionCampaign.create({
  campaign_id: "camp-roofing-storm-q2",
  gtm_id: "gtm-roofing-2026",
  campaign_name: "Roofing Storm Response Q2",
  campaign_type: "landing_page",
  industry_target: "roofing",
  status: "active",
  landing_page_url: "https://clientsurge.com/roofing",
  pricing_page_url: "https://clientsurge.com/pricing",
  expected_conversion_rate: 2.5,
  start_date: "2026-01-15"
});

// 3. Pull metrics from ConversionTrackingEvent (read-only)
const events = await base44.entities.ConversionTrackingEvent.filter({
  session_id: { $exists: true },
  page_key: "roofing"
});

// 4. Update campaign with measured performance
await base44.entities.AcquisitionCampaign.update(campaign.id, {
  traffic_generated: 4280,
  leads_generated: 89,
  actual_conversion_rate: 2.08,
  revenue_attributed: 45320,
  cost: 12500,
  roi: 262.56,
  cpc: 2.92,
  cpl: 140.45,
  cpa: 509.11
});

// 5. Identify bottleneck and update GTM health
await base44.entities.GTMLaunchEngine.update(gtm.id, {
  funnel_score: 78,
  conversion_rate: 2.08,
  revenue_per_lead: 509.11,
  active_campaigns_count: 1,
  funnel_stage_bottleneck: "pricing" // 15% of visitors hit pricing, 8% convert
});
```

---

## Dashboard Integration

The GTM system feeds metrics to:

1. **Admin Mission Control** — See GTM health score, active campaigns, revenue trends
2. **Client Portal** — View campaign performance, ROI, and attribution
3. **Conversion Insights Dashboard** — Detailed funnel analysis per campaign
4. **Growth Optimization Engine** — Identify high-ROI campaigns for scaling

No changes to these dashboards required — they simply read GTMLaunchEngine and AcquisitionCampaign data.

---

## Next Steps

1. ✅ Create GTMLaunchEngine and AcquisitionCampaign entities
2. 📊 Build GTM metrics sync (reads from existing entities, writes aggregated metrics)
3. 📈 Create GTM dashboard card in Admin/Client portals
4. 🔄 Set up scheduled automation to refresh campaign metrics daily
5. 🎯 Build campaign performance comparison reports