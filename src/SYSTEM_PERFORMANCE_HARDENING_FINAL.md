# System Performance Hardening — Final Phase

Complete stabilization of ClientSurge for high-volume, low-latency operation under stress.

---

## 1. EVENT QUEUE PRIORITY SYSTEM

### Priority Tiers

**HIGH (Immediate Processing)**
- `sms_sent` — SMS delivery confirmations
- `booking_confirmed` — Appointment bookings
- `checkout_completed` — Payment processing
- `inbound_sms_reply` — Customer responses
- `call_received` — Inbound voice events
- `payment_processed` — Revenue events

**MEDIUM (Normal Processing)**
- `email_sent` — Email delivery logs
- `lead_updated` — CRM record changes
- `automation_triggered` — Workflow events
- `sequence_started` — Campaign events
- `contact_attempted` — Outreach events

**LOW (Batch Processing)**
- `analytics_event` — Page views, clicks
- `optimization_signal_generated` — Growth insights
- `log_entry` — System logging
- `metric_computed` — Dashboard aggregations

### Queue Implementation Rules

```javascript
// ✅ DO: Priority-based batching
const eventBatch = {
  high_priority: events.filter(e => PRIORITY.HIGH.includes(e.type)),
  medium_priority: events.filter(e => PRIORITY.MEDIUM.includes(e.type)),
  low_priority: events.filter(e => PRIORITY.LOW.includes(e.type))
};

// Process HIGH first (max 100ms latency)
// Then MEDIUM (max 500ms latency)
// Then LOW (batch & defer to background, max 5min latency)

// ✅ DO: Async/await for non-blocking operations
const processHighPriority = async (events) => {
  await Promise.all(
    events.map(e => handleEvent(e))
  );
};

// ❌ DON'T: Synchronous blocking operations
const processEvents = (events) => {
  events.forEach(e => handleEvent(e)); // Blocks execution
};

// ❌ DON'T: Processing all events sequentially
events.forEach(async (e) => {
  await handleEvent(e); // Processes one at a time
});
```

---

## 2. WRITE AMPLIFICATION REDUCTION

### Single Source of Truth Pattern

**CommunicationEvent** is the canonical log for all outbound/inbound communication:

```
Text Message Sent
  ↓
CommunicationEvent (direction=outbound, channel=sms, status=sent)
  ↓
(Derived) Analytics aggregation (optional, batch-only)
(Derived) OutboundActivity summary (optional, cache-only)
```

### When to Write to New Entities

**Write to:**
- ✅ CommunicationEvent (always)
- ✅ RevenueTracking (when payment occurs)
- ✅ Leads (when lead status changes)
- ✅ ConversionTrackingEvent (when user converts)

**Don't write to:**
- ❌ OutboundActivity (derive from CommunicationEvent instead)
- ❌ EmailCampaignRecipient (read from EmailCampaign only)
- ❌ Events (deprecated; use CommunicationEvent)
- ❌ EventDedupLog (only when duplicate detected, not always)

### EventDedupLog Trigger Rules

Write to EventDedupLog **only when:**
1. Duplicate SMS detected (same phone + message within 5 min)
2. Duplicate email detected (same email + subject within 1 hour)
3. Duplicate form submission (same email + form within 30 sec)

```javascript
// ✅ DO: Conditional write
if (isDuplicate(incomingEvent)) {
  await base44.entities.EventDedupLog.create({
    original_event_id: firstEvent.id,
    duplicate_event_id: incomingEvent.id,
    reason: "same_sms_content_within_window"
  });
}

// ❌ DON'T: Always write
await base44.entities.EventDedupLog.create({ ... }); // Every event
```

---

## 3. ANALYTICS ENTITY BEHAVIOR

### ConversionTrackingEvent
**Input Stream:** Landing page interactions (page views, clicks, form submissions)
**Processing:** Real-time ingestion with async dedup
**Reads:** Used by dashboards, GTM system, optimization engine
**Writes:** Only from conversion tracking pixel

```javascript
// Ingestion pattern
const ingestEvent = async (event) => {
  // 1. Deduplicate by session_id + event_type + timestamp window
  const isDupe = await checkDuplicate(event);
  if (isDupe) return { status: 'skipped', reason: 'duplicate' };
  
  // 2. Async ingest (don't block)
  await base44.entities.ConversionTrackingEvent.create(event);
  
  // 3. Queue for async aggregation
  queueForAggregation(event);
  
  return { status: 'ingested' };
};
```

### LandingPageAnalytics
**Input Source:** Aggregated from ConversionTrackingEvent
**Update Frequency:** Batch (once per hour, or on-demand via dashboard)
**Processing:** Never computed on real-time requests
**Caching:** Cache results for 30 minutes

```javascript
// ✅ DO: Batch aggregation
const aggregateAnalytics = async (pageKey, dateRange) => {
  const cacheKey = `analytics_${pageKey}_${dateRange}`;
  
  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  // Compute from ConversionTrackingEvent
  const events = await base44.entities.ConversionTrackingEvent.filter({
    page_key: pageKey,
    timestamp: { $gte: dateRange.start, $lte: dateRange.end }
  });
  
  const aggregated = compute(events);
  
  // Cache for 30 minutes
  await cache.set(cacheKey, aggregated, 1800);
  
  return aggregated;
};

// ❌ DON'T: Real-time aggregation on dashboard load
const getAnalytics = async (pageKey) => {
  const events = await base44.entities.ConversionTrackingEvent.filter({
    page_key: pageKey
  });
  return events.reduce(...); // Blocks dashboard load
};
```

### ConversionFunnel
**Input Source:** Aggregated from ConversionTrackingEvent + RevenueTracking
**Update Frequency:** Batch (once per day)
**Processing:** Precomputed, never dynamic
**Materialized:** Updated in background job, read-only on dashboards

```javascript
// Background job (runs nightly)
const refreshFunnelAnalytics = async () => {
  const events = await base44.entities.ConversionTrackingEvent.list();
  const revenue = await base44.entities.RevenueTracking.list();
  
  const funnel = computeFunnel(events, revenue);
  
  await base44.entities.ConversionFunnel.update(funnelId, funnel);
};

// Dashboard query (read-only, cached)
const getFunnel = async (pageKey) => {
  return await base44.entities.ConversionFunnel.filter({
    page_key: pageKey
  });
};
```

---

## 4. ASYNC PROCESSING REQUIREMENTS

### ConversionTrackingEvent Ingestion
- **Latency Target:** <100ms
- **Pattern:** Fire-and-forget with async background work
- **Dedup:** Checked before write
- **Aggregation:** Queued, not immediate

```javascript
Deno.serve(async (req) => {
  try {
    const event = await req.json();
    
    // 1. Validate (sync, <10ms)
    if (!validateEvent(event)) {
      return Response.json({ error: 'invalid' }, { status: 400 });
    }
    
    // 2. Deduplicate (sync, <20ms)
    const isDupe = await checkDuplicate(event);
    if (isDupe) {
      return Response.json({ status: 'duplicate' });
    }
    
    // 3. Queue for async write (don't await)
    queueEventWrite(event);
    
    // 4. Queue for async aggregation (don't await)
    queueEventAggregation(event);
    
    // Return immediately
    return Response.json({ status: 'queued' }, { status: 202 });
  } catch (error) {
    console.error('Event ingestion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### GrowthOptimizationSignal Generation
- **Latency Target:** <2 seconds (can be async)
- **Pattern:** Triggered by ConversionTrackingEvent, processed asynchronously
- **Aggregation Window:** 1 hour (not real-time)
- **Dedup:** Handled internally, no duplicate signals

```javascript
// When ConversionTrackingEvent is ingested:
// 1. Queue signal generation (async)
// 2. Compute signals every hour, not on every event
// 3. Cache results for dashboard

const generateSignalsHourly = async () => {
  const lastHour = await base44.entities.ConversionTrackingEvent.filter({
    timestamp: { $gte: now - 3600000 }
  });
  
  const signals = computeSignals(lastHour);
  
  for (const signal of signals) {
    await base44.entities.GrowthOptimizationSignal.create(signal);
  }
};
```

### LandingPageAnalytics Aggregation
- **Latency Target:** N/A (batch only)
- **Update Frequency:** Hourly automatic, on-demand via button
- **Caching:** Always cached after compute
- **Real-time Dashboard:** Never used; always show cached results

---

## 5. DASHBOARD LAZY LOADING

### Table Implementation
- Initial load: Show 25 rows, sorted by recency
- Pagination: Button-triggered, not auto-scroll
- Filtering: Client-side only (no live search)
- Expansion: Click row to see full details

```javascript
// ✅ DO: Pagination with button
const [page, setPage] = useState(0);
const items = await fetch(`/api/items?page=${page}&limit=25`);

// ❌ DON'T: Infinite scroll / auto-load on scroll
useEffect(() => {
  window.addEventListener('scroll', () => {
    if (scrollNearBottom) loadMore(); // Creates load storms
  });
});
```

### Expansion Pattern
- List view shows 3-5 key metrics
- Click "View Details" to see full record
- Details load async, don't block list

```javascript
const LeadRow = ({ lead, onExpand }) => (
  <tr>
    <td>{lead.name}</td>
    <td>{lead.status}</td>
    <td>{lead.lead_score}</td>
    <td>
      <button onClick={() => onExpand(lead.id)}>
        View Details
      </button>
    </td>
  </tr>
);
```

### Event Log Behavior
- Show last 100 events by default
- Older events: Fetch on-demand via "Load More"
- Never auto-load full event history
- Always paginate with explicit buttons

---

## 6. LEAD SCORING BACKGROUND PROCESSING

### Current Pattern (BROKEN)
```javascript
// ❌ DON'T: Real-time scoring on lead update
const updateLead = async (leadId, data) => {
  const lead = await base44.entities.Leads.update(leadId, data);
  const score = calculateScore(lead); // Blocks request
  await base44.entities.Leads.update(leadId, { lead_score: score });
  return lead;
};
```

### Fixed Pattern
```javascript
// ✅ DO: Async background scoring
const updateLead = async (leadId, data) => {
  // 1. Update lead immediately (don't compute score)
  const lead = await base44.entities.Leads.update(leadId, data);
  
  // 2. Queue score computation (don't await)
  queueLeadScoring(leadId);
  
  // 3. Return immediately
  return lead;
};

// Background job (runs every 5 minutes)
const updateLeadScores = async () => {
  const leads = await base44.entities.Leads.filter({
    lead_score_stale: true
  });
  
  for (const lead of leads) {
    const newScore = calculateScore(lead);
    await base44.entities.Leads.update(lead.id, {
      lead_score: newScore,
      lead_score_stale: false
    });
  }
};
```

---

## 7. CACHE STRATEGY

### What to Cache
- ✅ Dashboard metric cards (30 min TTL)
- ✅ Funnel data (1 hour TTL)
- ✅ Industry benchmarks (24 hour TTL)
- ✅ User navigation structure (session TTL)

### What NOT to Cache
- ❌ Real-time lead lists (always fresh)
- ❌ Conversation threads (always fresh)
- ❌ Payment data (always fresh)
- ❌ System health status (refresh every 30 sec)

### Cache Invalidation
```javascript
// When lead updates
await cache.invalidate(`leads_list_${userId}`);
await cache.invalidate(`lead_detail_${leadId}`);

// When revenue tracked
await cache.invalidate(`revenue_metrics_*`);
await cache.invalidate(`funnel_data_*`);

// When analytics event ingested
// Don't invalidate (batch aggregation will update)
```

---

## 8. LOAD TESTING TARGETS

System should handle:

- **Traffic:** 10,000 session/day (peak: 500/hour)
- **Events:** 50,000 events/day (peak: 5,000/hour)
- **Leads:** 1,000 lead updates/day (peak: 200/hour)
- **Dashboard Queries:** 100 concurrent admin dashboards

**Target Performance:**
- Event ingestion: <100ms p99
- Dashboard load: <2 seconds p99
- Lead detail: <500ms p99
- Funnel computation: <10 seconds (batch job)

---

## 9. MONITORING & ALERTS

### Key Metrics
- Event queue depth (alert if > 10,000)
- Dashboard load time (alert if > 3 seconds)
- Lead score staleness (alert if > 30 min)
- Cache hit rate (should be > 70%)

### Automated Actions
- Queue depth > 10k → Auto-scale event workers
- Dashboard slow → Increase cache TTL
- Lead scores stale → Run immediate batch
- Cache hit < 60% → Investigate popular queries

---

## 10. IMPLEMENTATION CHECKLIST

- [ ] EventQueue supports priority-based batching
- [ ] HIGH priority events processed in <100ms
- [ ] ConversionTrackingEvent uses async dedup + queue
- [ ] GrowthOptimizationSignal computed hourly, not real-time
- [ ] LandingPageAnalytics is batch-derived only, cached
- [ ] ConversionFunnel is precomputed nightly
- [ ] Lead scoring moved to background jobs
- [ ] All dashboards use lazy loading + pagination
- [ ] Event logs show 100 by default, paginate on demand
- [ ] Cache strategy implemented for metrics
- [ ] EventDedupLog only written on duplicates
- [ ] Monitoring & alerts configured
- [ ] Load tests confirm <100ms event latency