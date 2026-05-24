# Lead Intelligence & Discovery Agent - System Guide

## Overview

This is a production-ready lead generation engine with 4 integrated layers:

1. **Discovery Engine** - Finds new leads based on niche, location, and filters
2. **Enrichment Engine** - Adds data to leads (social presence, website quality, etc.)
3. **Scoring Engine** - Intelligent lead scoring (0-100) with quality labels
4. **Pipeline + Dashboard** - Full CRM with pipeline stages and analytics

---

## Quick Start

### 1. Access the Dashboard
Navigate to `/lead-intelligence` to open the Lead Intelligence Dashboard.

### 2. Discover Leads
In the "Discovery Engine" tab:
1. Select a **niche** (med spa, real estate, dental, hvac, etc.)
2. Enter **city** and **state**
3. Optional: Adjust radius, set website requirement, min rating
4. Click **"Start Discovery"**

The system will:
- Discover new leads
- Deduplicate against existing leads
- Enrich with scoring and insights
- Update analytics

### 3. Review Leads
In the "Lead Pipeline" tab:
- View all discovered leads in sortable table
- Filter by: niche, quality score, status, search terms
- See key metrics: business name, contact, score, status, presence
- Click eye icon to view full lead detail

### 4. Manage Leads
For each lead:
- Change pipeline status (New → Qualified → Contacted → Responded → Booked → Closed)
- View outreach intelligence (AI-generated insights)
- See missing systems (opportunities for pitch)
- Add internal notes

---

## Database Structure

### Lead Entity
Each lead contains:

**Core Info:**
- `business_name` - Business name
- `phone` - Phone number (unique, deduplicated)
- `email` - Email address
- `website` - Website URL (domain deduplicated)
- `address`, `city`, `state` - Location

**Discovery Data:**
- `niche` - Business category
- `social_links` - Array of social profiles (Instagram, Facebook, LinkedIn)
- `source` - Where lead came from (agent, manual, etc.)

**Enrichment:**
- `has_website` - Boolean
- `has_social` - Boolean
- `social_activity` - "active" | "inactive" | "unknown"
- `website_quality` - "high" | "medium" | "low" | "unknown"

**Scoring:**
- `lead_score` - 0-100 score (higher = better)
- `lead_quality_label` - "High" (80+) | "Medium" (50-79) | "Low" (<50)
- `estimated_responsiveness` - "high" | "medium" | "low" | "unknown"
- `missing_systems` - Array of opportunities (e.g., "No website", "Limited follow-up")
- `outreach_insight` - AI-generated summary for outreach

**Pipeline:**
- `status` - "New" | "Qualified" | "Contacted" | "Responded" | "Booked" | "Closed" | "Rejected"
- `contacted_at` - When first contacted
- `competitor_notes` - Internal notes

**Deduplication:**
- `phone_hash` - For duplicate detection
- `domain` - Website domain for duplicate detection
- `last_enriched_at` - Last enrichment timestamp

---

## Scoring Algorithm

Lead scores are calculated based on:

| Factor | Points | Logic |
|--------|--------|-------|
| Has website | +20 | Professional presence |
| Website quality (high) | +15 | Well-maintained site |
| Website quality (low) | +10 | Opportunity: needs modernization |
| Has social | +15 | Digital engagement |
| Social activity (active) | +25 | Recent engagement (highest weight) |
| Social activity (inactive) | +5 | Profile exists but stale |
| Limited follow-up systems | +10 | Opportunity: losing leads |
| No website | -10 | Negative signal |

**Score Range:**
- **High (80-100)**: Professional, active, multi-channel presence
- **Medium (50-79)**: Mixed signals, some modernization needed
- **Low (<50)**: Missing systems, inactive, poor digital presence

---

## Key Features

### 1. Deduplication
The system prevents duplicate leads using:
- **Phone number matching** - Extracts digits, prevents duplicate entries
- **Domain matching** - Extracts website domain, prevents duplicate entries

If a lead with same phone or domain exists:
- Updates existing record
- Doesn't create new entry
- Tracks update timestamp

### 2. Enrichment Engine
Each discovery automatically:
- Assesses website quality (heuristic-based)
- Evaluates social presence (platforms, followers)
- Generates outreach insights
- Identifies missing systems
- Scores responsiveness potential

### 3. Outreach Intelligence
For each lead, system generates a summary like:
```
"Active Instagram with 2.5K followers • Website quality needs modernization 
• Likely losing leads due to limited follow-up infrastructure"
```

This prepares leads for future automation or manual outreach.

### 4. Analytics Dashboard
Real-time metrics:
- **Total Leads** - All leads in system
- **New Leads (Today)** - Discovered today
- **High Quality %** - Percentage of high-quality leads
- **Avg Lead Score** - Average across all leads
- **Pipeline Distribution** - Breakdown by stage (New, Contacted, Booked, etc.)

---

## Backend Functions

### discoverLeads
Discovers and enriches leads from simulated data sources.

**Parameters:**
```json
{
  "niche": "med spa",
  "city": "Phoenix",
  "state": "AZ",
  "radius": 25,
  "require_website": false,
  "min_rating": 0
}
```

**Returns:**
- Job ID
- Leads discovered count
- New leads created
- Updated leads count

### enrichLead
Re-enriches a single lead with latest insights.

**Parameters:**
```json
{
  "lead_id": "uuid"
}
```

### calculateLeadAnalytics
Recalculates all metrics for today's analytics record.

---

## Automation Setup

### Daily Discovery (Inactive - Activate as Needed)
**Schedule:** Daily at 8 AM (Phoenix time)
**Function:** `discoverLeads`
**Default Params:** med spa, Phoenix, AZ, 25-mile radius

To activate:
1. Go to Dashboard → Code → Automations
2. Find "Daily Lead Discovery & Enrichment"
3. Enable automation
4. Update function_args with your preferred niche/location

---

## API Integration Points (Production Ready)

The system is structured for easy integration with real APIs:

### Discovery Engine
Replace simulation with:
- **Google Places API** - Local business discovery
- **Apollo.io** - B2B database
- **Clearbit** - Company enrichment
- **Hunter.io** - Email verification
- **Dex** - Business intelligence

### Enrichment Engine
- **Clearbit API** - Company insights
- **Instagram API** - Follower counts, engagement
- **Pitchbook** - Company data
- **SEMrush** - Website traffic

### Scoring Engine
Current heuristics can be replaced with:
- **Machine learning model** - Trained on conversion data
- **Custom API** - Your proprietary scoring model

---

## Future Automation Workflows

This system prepares leads for:

1. **Auto Outreach**
   - Send templated emails to new high-quality leads
   - Auto SMS follow-up sequences
   - Calendar booking triggers

2. **Enrichment Loops**
   - Update leads weekly
   - Re-score based on latest signals
   - Flag leads with status changes

3. **Conversion Tracking**
   - Monitor when leads become customers
   - Update analytics with conversion rates
   - Optimize scoring model

4. **Lead Rotation**
   - Distribute warm leads to sales team
   - Track assignment and response time
   - Auto-escalate if no action taken

---

## Dashboard Navigation

**Lead Intelligence** (`/lead-intelligence`)
- Main dashboard with all views
- 3 tabs: Discovery Engine, Lead Pipeline, Lead Details

**Discovery Engine Tab**
- Form to define search parameters
- Start discovery button
- Simulates real-world lead sources

**Lead Pipeline Tab**
- Table view of all leads
- Filters: search, niche, score, status
- Inline status updates
- Pagination and sorting

**Lead Details Tab**
- Full lead profile (modal)
- Contact information with copy buttons
- Digital presence assessment
- Outreach intelligence
- Status and notes management

---

## Best Practices

1. **Start Small** - Begin with one niche/location combo
2. **Quality > Quantity** - Focus on high-quality leads (80+)
3. **Regular Enrichment** - Re-score weekly for signal changes
4. **Clear Pipeline** - Move old "New" leads to "Rejected" or "Qualified"
5. **Track Results** - Monitor conversion rate per stage
6. **Update Scoring** - Adjust algorithm based on what actually converts

---

## Troubleshooting

**Discovery returns no results:**
- Check niche spelling
- Verify city/state are real locations
- Lower website requirement filter

**Duplicates appearing:**
- Check phone deduplication is working
- Verify domain extraction logic
- Manual merge if needed

**Score seems wrong:**
- Review scoring algorithm in functions
- Check enrichment ran successfully
- Verify data completeness

---

## Next Steps

1. ✅ Access `/lead-intelligence`
2. ✅ Run first discovery (med spa, your city)
3. ✅ Review leads and scores
4. ✅ Update lead statuses as you contact them
5. ✅ Setup daily automation
6. ✅ Integrate real APIs when ready

This system is now ready to become the backbone of your lead generation operation.