# Funnel Identity Implementation Checklist

## ✅ Phase 1: Core Infrastructure (COMPLETE)

### Entity Schemas
- [x] Add `funnel_identity_id` to Leads.json
- [x] Add `funnel_identity_id` to Messages.json
- [x] Add `funnel_identity_id` to Order.json
- [ ] Add `funnel_identity_id` to Subscription.json (optional, future)
- [ ] Add `funnel_identity_id` to CommunicationEvent.json (optional, future)

### Helper Functions
- [x] Create `lib/funnelIdentityHelpers.js` with:
  - [x] generateFunnelIdentityId()
  - [x] ensureFunnelIdentityInPayload()
  - [x] getFunnelIdentityFromLead()
  - [x] reconstructFunnelJourney()
  - [x] getAttributionSummary()

### Documentation
- [x] UNIFIED_FUNNEL_IDENTITY_SYSTEM.md (comprehensive guide)
- [x] FUNNEL_IDENTITY_INTEGRATION_GUIDE.md (quick reference)
- [x] FUNNEL_IDENTITY_ARCHITECTURE.md (visual diagrams)
- [x] This checklist

---

## 🚀 Phase 2: Core Function Integration (HIGH PRIORITY)

### Lead Capture / Creation
- [ ] `submitLeadCapture` 
  - [ ] Import helpers
  - [ ] Generate funnel_identity_id on lead creation
  - [ ] Include in created lead payload
  - [ ] Test: new lead has funnelId
  - [ ] Test: can query by funnelId

- [ ] `handleNewLead`
  - [ ] Ensure funnel_identity_id is preserved
  - [ ] Pass through to downstream systems

### Message Functions
- [ ] `sendSMS`
  - [ ] Get lead's funnel_identity_id
  - [ ] Pass to Messages.create()
  - [ ] Test: message inherits lead's funnelId

- [ ] `sendEmail`
  - [ ] Get lead's funnel_identity_id
  - [ ] Pass to Messages.create()
  - [ ] Test: message inherits lead's funnelId

- [ ] `receiveTwilioInboundSms`
  - [ ] Find lead by phone
  - [ ] Use lead's funnel_identity_id for inbound message
  - [ ] Test: inbound messages linked to funnel

- [ ] `receiveResendWebhook`
  - [ ] Look up message by provider_message_id
  - [ ] Get lead's funnel_identity_id
  - [ ] Update message status with funnelId context
  - [ ] Test: email events linked to funnel

### Order Functions
- [ ] `stripeWebhookOrders`
  - [ ] Extract lead_id from order metadata
  - [ ] Fetch lead's funnel_identity_id
  - [ ] Create order with funnel_identity_id
  - [ ] Test: orders inherit from leads
  - [ ] Test: direct orders get new funnelId

- [ ] `createCheckoutSession`
  - [ ] Include funnel_identity_id in metadata
  - [ ] Pass through to Order on payment
  - [ ] Test: checkout preserves funnelId

- [ ] `orchestrateOrderToOnboarding`
  - [ ] Preserve funnel_identity_id through workflow
  - [ ] Pass to subscription on creation
  - [ ] Test: end-to-end funnelId preservation

---

## 📊 Phase 3: Analytics & Attribution (MEDIUM PRIORITY)

### Funnel Metrics
- [ ] `computeConversionFunnel`
  - [ ] Update to group by funnel_identity_id
  - [ ] Add per-funnel attribution
  - [ ] Calculate journey duration per funnel
  - [ ] Test: metrics improve in accuracy

- [ ] `calculateLeadAnalytics`
  - [ ] Use funnel_identity_id for attribution
  - [ ] Link lead score to funnel ID
  - [ ] Test: analytics granularity improves

### Revenue Attribution
- [ ] `computeRevenueAttribution`
  - [ ] Trace order revenue back to funnel_identity_id
  - [ ] Calculate CAC per funnel
  - [ ] Test: revenue properly attributed

- [ ] `getRevenueAnalytics`
  - [ ] Add funnel_identity_id dimension
  - [ ] Show conversion rate by funnel
  - [ ] Test: revenue reports by funnel

### Dashboard Functions
- [ ] `getClientAnalytics`
  - [ ] Add funnel_identity_id data
  - [ ] Include journey metrics
  - [ ] Test: dashboard shows funnel data

- [ ] `getSystemVisibility`
  - [ ] Monitor funnel ID propagation health
  - [ ] Check for leads without funnelId
  - [ ] Alert on missing funnel attribution
  - [ ] Test: health checks work

---

## 🎯 Phase 4: Automation & Workflows (MEDIUM PRIORITY)

- [ ] `automationProcessor`
  - [ ] Carry funnel_identity_id through automations
  - [ ] Link automation events to funnel
  - [ ] Test: automations preserve context

- [ ] `leadPipelineOrchestrator`
  - [ ] Maintain funnelId through pipeline stages
  - [ ] Track stage transitions per funnel
  - [ ] Test: pipeline preserves funnelId

- [ ] `orchestrationController`
  - [ ] Ensure all workflow stages carry funnelId
  - [ ] Enforce ID propagation rules
  - [ ] Test: orchestration integrity

---

## 🖥️ Phase 5: Dashboard Integration (NICE TO HAVE)

### Frontend Components
- [ ] Create `components/funnel/FunnelTimeline.jsx`
  - Displays milestones for a funnel_identity_id
  - Shows: lead → messages → order → conversion

- [ ] Create `components/funnel/AttributionCard.jsx`
  - Displays first touch + conversion path
  - Shows: source → channel → duration → revenue

- [ ] Create `components/funnel/JourneyMap.jsx`
  - Visual flowchart of customer journey
  - Interactive timeline

### Dashboard Tabs
- [ ] Mission Control: Add "Funnel Timeline" widget
- [ ] Lead Detail: Show "Related Interactions" by funnelId
- [ ] Order Detail: Show "Customer Journey" timeline
- [ ] Analytics: Add "Conversion by Funnel" view

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] generateFunnelIdentityId() produces unique IDs
- [ ] ensureFunnelIdentityInPayload() preserves existing ID
- [ ] getFunnelIdentityFromLead() returns lead's funnelId
- [ ] reconstructFunnelJourney() returns chronological milestones
- [ ] getAttributionSummary() calculates journey duration correctly

### Integration Tests
- [ ] Lead creation: new lead gets funnelId
- [ ] Message creation: message inherits lead's funnelId
- [ ] Order creation (with lead): order inherits funnelId
- [ ] Order creation (no lead): order gets new funnelId
- [ ] Message delivery webhook: uses original funnelId
- [ ] Lead deduplication: merged entities share funnelId

### End-to-End Tests
- [ ] Complete journey: lead → SMS → email → order → subscription
  - All entities linked by funnelId
- [ ] Multi-channel: SMS + email to same lead
  - Both messages share funnelId
- [ ] Conversion path: track first touch → order
  - Attribution accurate
- [ ] Analytics: ConversionFunnel by funnelId
  - Metrics improved
- [ ] Dashboard: Funnel timeline renders all events
  - UI displays correctly

### Regression Tests
- [ ] Existing queries still work (no breaking changes)
- [ ] Leads without funnelId don't break system
- [ ] Orders without lead still function
- [ ] CommunicationEvent unaffected
- [ ] Stripe webhooks still work

---

## 📋 Backfill Tasks (Optional, Future)

These are nice-to-have for historical data:

- [ ] Backfill funnel_identity_id for existing leads
  - [ ] Batch query all leads
  - [ ] Generate ID for each
  - [ ] Update in database
  - [ ] Validate completeness

- [ ] Migrate existing orders to new schema
  - [ ] Link orders to leads by email
  - [ ] Assign same funnel_identity_id
  - [ ] Validate attribution accuracy

- [ ] Migrate existing messages to funnelId
  - [ ] Query by lead_id
  - [ ] Update with lead's funnelId
  - [ ] Ensure messages → orders linked

---

## 📊 Success Criteria

### Technical Metrics
- [ ] 100% of new leads have funnel_identity_id
- [ ] 100% of messages have funnel_identity_id
- [ ] 100% of orders have funnel_identity_id
- [ ] funnel_identity_id propagation: 0 errors
- [ ] Query performance: <500ms for typical journey

### Business Metrics
- [ ] ConversionFunnel accuracy improves 20%+
- [ ] Attribution clarity improves 30%+
- [ ] Lead-to-order tracing: 100% successful
- [ ] Journey reconstruction: <2 seconds per funnel
- [ ] Dashboard adoption: >80% of team uses funnel views

### Quality Metrics
- [ ] Zero data loss from implementation
- [ ] Zero breaking changes to existing APIs
- [ ] 100% backward compatible
- [ ] 100% test coverage for new functions
- [ ] Zero impact on performance

---

## 📅 Timeline Estimate

| Phase | Tasks | Time | Status |
|-------|-------|------|--------|
| Phase 1 | Infrastructure | ✅ Done | COMPLETE |
| Phase 2 | Core Functions | ~12 hours | READY |
| Phase 3 | Analytics | ~8 hours | READY |
| Phase 4 | Automations | ~6 hours | READY |
| Phase 5 | Dashboard | ~10 hours | READY |
| Total | All Phases | ~36 hours | ON TRACK |

---

## 🎯 Next Steps

1. **Immediate** (Today)
   - [ ] Review UNIFIED_FUNNEL_IDENTITY_SYSTEM.md
   - [ ] Understand architecture via diagrams
   - [ ] Import helpers in existing code

2. **This Week** (Phase 2)
   - [ ] Integrate into `submitLeadCapture`
   - [ ] Integrate into `stripeWebhookOrders`
   - [ ] Test end-to-end lead → order funnel
   - [ ] Deploy to production

3. **Next Week** (Phase 3)
   - [ ] Update analytics functions
   - [ ] Improve ConversionFunnel metrics
   - [ ] Create attribution reports

4. **Following Week** (Phase 4 & 5)
   - [ ] Integrate with automations
   - [ ] Build dashboard components
   - [ ] Launch funnel views to team

---

## 🚨 Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Missed funnel_identity_id propagation | Add validation: fail if funnelId missing |
| Performance degradation | Monitor query times; add indexes if needed |
| Data inconsistency | Backfill script with validation |
| Team adoption | Dashboard incentives + documentation |
| Regression in existing queries | 100% regression test coverage |

---

## ✅ Sign-Off

- [ ] Product Owner reviewed
- [ ] Tech Lead approved architecture
- [ ] QA ready for testing
- [ ] Documentation complete
- [ ] Team briefed on changes

---

**Status**: Implementation Ready  
**Owner**: ClientSurge Platform Team  
**Last Updated**: 2026-06-15  
**Estimated Completion**: 2 weeks