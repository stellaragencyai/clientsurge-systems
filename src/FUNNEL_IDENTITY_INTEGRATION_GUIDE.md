# Funnel Identity Integration Quick Reference

## 3-Minute Integration Summary

### 1. Import Helpers
```javascript
import { 
  generateFunnelIdentityId, 
  reconstructFunnelJourney,
  getAttributionSummary 
} from '@/lib/funnelIdentityHelpers';
```

### 2. On Lead Creation
```javascript
const lead = await base44.entities.Leads.create({
  full_name, email, phone, business_name, problem,
  funnel_identity_id: generateFunnelIdentityId(), // ← Add this
  source: 'website_form',
});
```

### 3. On Message Creation
```javascript
const lead = await base44.entities.Leads.get(leadId);
await base44.entities.Messages.create({
  lead_id: leadId,
  funnel_identity_id: lead.funnel_identity_id, // ← Inherit
  message_text, channel, direction,
});
```

### 4. On Order Creation
```javascript
const lead = leadId ? await base44.entities.Leads.get(leadId) : null;
await base44.entities.Order.create({
  customer_email, customer_name, business_name, items,
  lead_id: leadId,
  funnel_identity_id: lead?.funnel_identity_id || generateFunnelIdentityId(),
});
```

### 5. Query Customer Journey
```javascript
// Get full journey timeline
const journey = await reconstructFunnelJourney(base44, funnelId, projectId);

// Get attribution (first touch → conversion)
const attribution = await getAttributionSummary(base44, funnelId);
```

---

## Entity Schema Changes (DONE)

✅ **Leads**: Added `funnel_identity_id` field  
✅ **Messages**: Added `funnel_identity_id` field  
✅ **Order**: Added `funnel_identity_id` field  

---

## Functions to Update (Next Phase)

### High Priority
1. `submitLeadCapture` — Generate funnel_identity_id on lead capture
2. `sendSMS` — Inherit funnel_identity_id from lead
3. `sendEmail` — Inherit funnel_identity_id from lead
4. `stripeWebhookOrders` — Set funnel_identity_id on order
5. `receiveTwilioInboundSms` — Inherit from lead's funnel_identity_id

### Medium Priority
6. `computeConversionFunnel` — Group by funnel_identity_id
7. `calculateLeadAnalytics` — Use funnel_identity_id for attribution
8. `orchestrateOrderToOnboarding` — Carry funnel_identity_id through

### Nice to Have
9. Create `reconstructFunnelJourney` backend function
10. Create `getAttributionReport` for dashboards

---

## Testing Checklist

```javascript
// Test 1: Lead gets funnel_identity_id
const lead = await base44.entities.Leads.create({ ... });
assert(lead.funnel_identity_id, 'Lead missing funnel_identity_id');

// Test 2: Message inherits from lead
const msg = await base44.entities.Messages.create({ lead_id: lead.id, ... });
assert(msg.funnel_identity_id === lead.funnel_identity_id, 'Message funnelId mismatch');

// Test 3: Order inherits from lead
const order = await base44.entities.Order.create({ lead_id: lead.id, ... });
assert(order.funnel_identity_id === lead.funnel_identity_id, 'Order funnelId mismatch');

// Test 4: Can reconstruct journey
const journey = await reconstructFunnelJourney(base44, lead.funnel_identity_id, projectId);
assert(journey.milestones.length > 0, 'No journey milestones');
```

---

## Query Patterns

```javascript
// Get all messages for a customer
const messages = await base44.entities.Messages.filter({ 
  funnel_identity_id: 'fid_...' 
});

// Get all orders for a customer
const orders = await base44.entities.Order.filter({ 
  funnel_identity_id: 'fid_...' 
});

// Get customer's first touch
const leads = await base44.entities.Leads.filter({ 
  funnel_identity_id: 'fid_...' 
});

// Get conversion metrics by funnel
const allLeads = await base44.entities.Leads.list();
const conversionsByFunnel = {};
for (const lead of allLeads) {
  const orders = await base44.entities.Order.filter({ 
    funnel_identity_id: lead.funnel_identity_id 
  });
  conversionsByFunnel[lead.funnel_identity_id] = orders.length > 0;
}
```

---

## Dashboard Integration

### Journey Timeline Component
```javascript
async function FunnelTimeline({ funnelId }) {
  const journey = await reconstructFunnelJourney(base44, funnelId, projectId);
  
  return (
    <div>
      {journey.milestones.map(m => (
        <div key={m.timestamp} className="milestone">
          <span>{m.type}</span>
          <time>{new Date(m.timestamp).toLocaleString()}</time>
        </div>
      ))}
    </div>
  );
}
```

### Attribution Card
```javascript
async function AttributionCard({ funnelId }) {
  const attr = await getAttributionSummary(base44, funnelId);
  
  return (
    <div>
      <p>First Touch: {attr.first_touch.source}</p>
      <p>Days to Convert: {attr.journey_days}</p>
      <p>Revenue: ${attr.conversion?.total_revenue || 0}</p>
    </div>
  );
}
```

---

## Error Scenarios

### Scenario: Lead without funnel_identity_id
```javascript
const lead = await base44.entities.Leads.get(leadId);
if (!lead.funnel_identity_id) {
  // Backfill: assign one retroactively
  await base44.entities.Leads.update(leadId, {
    funnel_identity_id: generateFunnelIdentityId(),
  });
}
```

### Scenario: Order with no lead
```javascript
const order = await base44.entities.Order.create({
  ...data,
  lead_id: null,
  funnel_identity_id: generateFunnelIdentityId(), // Generate new
});
```

### Scenario: Duplicate leads
```javascript
// Merge: Update all B's messages/orders to use A's funnel_identity_id
const leadA = await base44.entities.Leads.get(primaryLeadId);
const leadB = await base44.entities.Leads.get(duplicateLeadId);

const messagesB = await base44.entities.Messages.filter({ lead_id: leadB.id });
for (const msg of messagesB) {
  await base44.entities.Messages.update(msg.id, {
    funnel_identity_id: leadA.funnel_identity_id,
  });
}
```

---

## No-Touch Items

❌ **Do NOT change**:
- CommunicationEvent schema (can add funnel_identity_id later if needed)
- Stripe webhook signature validation
- Idempotency key enforcement
- Event deduplication logic
- Cloudflare Worker execution

✅ **Purely additive**:
- New funnel_identity_id field
- Helper functions
- Query patterns
- Dashboard views

---

## Success Criteria

✅ Every new lead has funnel_identity_id  
✅ Every message inherits lead's funnel_identity_id  
✅ Every order inherits lead's funnel_identity_id (or generates if no lead)  
✅ Can query all entities by funnel_identity_id  
✅ Can reconstruct complete customer journey from funnelId  
✅ ConversionFunnel metrics improve in accuracy  

---

**Status**: Ready for integration  
**Lines of Code**: ~100 (helpers) + ~10 per function that propagates ID  
**Breaking Changes**: None  
**Rollback**: Trivial (remove funnel_identity_id from payloads if needed)