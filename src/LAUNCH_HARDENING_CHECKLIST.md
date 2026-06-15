# Launch Hardening Checklist

## Pre-Launch Readiness Verification

Complete this checklist before releasing ClientSurge Systems to production. Total time: ~2 hours.

---

## 1. SYSTEM STABILITY LAYER

### Lead Ingestion
- [ ] Test lead submission under normal load (50 leads/minute)
- [ ] Verify Leads entity accepts all required fields
- [ ] Confirm funnel_identity_id is assigned on creation
- [ ] Test with special characters in names (é, ñ, etc.)
- [ ] Verify duplicate detection triggers appropriately

**Command to test**:
```bash
curl -X POST /api/functions/submitLeadCapture \
  -H "Content-Type: application/json" \
  -d '{"full_name":"John Smith","email":"john@example.com",...}'
```

### Message Delivery
- [ ] SMS delivery logged correctly in Messages entity
- [ ] Email delivery tracked in Messages entity
- [ ] Failed messages don't block subsequent sends
- [ ] Message status updates correctly (pending → sent → delivered)
- [ ] Retry logic works for failed messages

**Test with**:
```javascript
const result = await base44.functions.invoke('sendSMS', {
  lead_id: leadId,
  message_text: 'Test message'
});
assert(result.data.status === 'sent' || 'queued');
```

### Automation Flow
- [ ] Leads route to correct segment (HOT/WARM/COLD)
- [ ] Automation jobs queue in priority order
- [ ] Jobs execute without blocking other jobs
- [ ] State changes cascade correctly
- [ ] No automation job hangs or timeouts

**Test with**:
```javascript
const lead = await base44.entities.Leads.create({...});
await base44.functions.invoke('executeSegmentedLeadFlow', { lead_id: lead.id });
// Verify segment label set within 5 seconds
```

---

## 2. DUPLICATE SAFETY CONTROLS

### Lead Deduplication
- [ ] Exact email + phone matches detected
- [ ] Business name + phone matches detected
- [ ] Fuzzy name matching works (85%+ similarity)
- [ ] False positives rate < 2%
- [ ] Existing lead returned instead of creating duplicate

**Test**:
```javascript
const lead1 = await checkLeadDuplicate(base44, {
  full_name: 'John Smith',
  email: 'john@example.com',
  phone: '555-1234'
});

const lead2 = await checkLeadDuplicate(base44, {
  full_name: 'John Smith',
  email: 'john@example.com',
  phone: '5551234' // Same number, different format
});

assert(lead2.is_duplicate === true);
```

### Message Deduplication
- [ ] Same message to same lead within 5 min not sent twice
- [ ] Message storm detection prevents burst of 5+ in 5 min
- [ ] Failed messages can be retried without duplication
- [ ] Webhook retries don't create duplicate messages

**Test**:
```javascript
const gate1 = await checkMessageGate(base44, leadId, 'sms');
assert(gate1.gate_passed === true);

// Send message
await sendSMS(leadId, 'Test');

// Try again immediately
const gate2 = await checkMessageGate(base44, leadId, 'sms');
assert(gate2.gate_passed === false); // Storm detection
```

### Automation Loop Prevention
- [ ] Same automation action doesn't trigger twice in 60 seconds
- [ ] Do-not-contact flag respected
- [ ] Lead status "Closed" prevents outreach
- [ ] Unsubscribed flag blocks email sends

**Test**:
```javascript
const gate1 = await checkAutomationExecutionGate(base44, leadId, 'instant_sms');
assert(gate1.gate_passed === true);

// Execute action
await executeAction(leadId, 'instant_sms');

// Try immediately
const gate2 = await checkAutomationExecutionGate(base44, leadId, 'instant_sms');
assert(gate2.gate_passed === false); // Duplicate prevention
```

---

## 3. ERROR HANDLING IMPROVEMENTS

### SMS Provider Failures
- [ ] Failed SMS logged and doesn't crash lead flow
- [ ] Retry scheduled automatically
- [ ] Fallback to email if SMS fails 3x
- [ ] Error details logged for debugging
- [ ] User not alerted for transient failures

**Test failure case**:
```javascript
const result = await withErrorHandling('sendSMS', async () => {
  throw new Error('RATE_LIMITED');
}, { maxRetries: 3 });

assert(result.success === false);
assert(result.fallbackValue === null);
// Should have retried 3 times
```

### Email Provider Failures
- [ ] Failed email logged
- [ ] Retry with exponential backoff
- [ ] Fallback to SMS if email fails 3x
- [ ] Bounced emails marked and prevent future sends
- [ ] Unsubscribe links respected

### Webhook Failures
- [ ] Failed webhook logged with timestamp
- [ ] Message processing continues despite webhook failure
- [ ] Webhook signature validation never blocks legitimate requests
- [ ] Retry queue for failed webhooks

**Test webhook error**:
```javascript
const result = await handleWebhookFailure('sms_status', {
  error: 'Connection timeout'
});

assert(result.action === 'retry_scheduled');
assert(result.next_retry_at !== null);
```

---

## 4. DATA CONSISTENCY VALIDATION

### Funnel Identity Linkage
- [ ] All leads have funnel_identity_id on creation
- [ ] All messages inherit lead's funnel_identity_id
- [ ] All orders have funnel_identity_id matching lead
- [ ] All subscriptions have funnel_identity_id
- [ ] Audit finds < 0.1% inconsistencies

**Run consistency check**:
```javascript
const result = await validateLeadOrderConsistency(base44, leadId);
assert(result.valid === true);
```

### Attribution Chain
- [ ] Lead → Message → Order → Subscription chain is traceable
- [ ] Revenue attributed correctly to original funnel_identity_id
- [ ] No orphaned records (e.g., order without lead)
- [ ] Conversion metrics align with actual orders

**Validate chain**:
```javascript
const chain = await validateAttributionChain(base44, funnelId);
assert(chain.is_valid === true);
assert(chain.order !== null); // If order exists
```

### Normalization
- [ ] Email normalized (lowercase, trimmed)
- [ ] Phone normalized (digits only)
- [ ] Business names normalized (consistent spacing)
- [ ] All historical records pass normalization check

---

## 5. PERFORMANCE READINESS

### Query Performance
- [ ] Leads list (100 records): < 500ms
- [ ] Messages list (500 records): < 1000ms
- [ ] CommunicationEvent list (1000 records): < 2000ms
- [ ] Filter by funnel_identity_id: < 200ms

**Performance baseline**:
```javascript
const start = Date.now();
const leads = await base44.entities.Leads.list(undefined, 100);
const ms = Date.now() - start;
assert(ms < 500, `Leads query took ${ms}ms`);
```

### Bulk Operations
- [ ] Batch create 100 leads: < 5 seconds
- [ ] Batch send 50 messages: < 10 seconds
- [ ] Filter 1000 events by segment: < 2 seconds

### Memory Usage
- [ ] No memory leaks on repeated lead capture
- [ ] Batch processing doesn't exceed heap limits
- [ ] Dashboard queries remain responsive under load

---

## 6. SYSTEM OBSERVABILITY

### Logging
- [ ] Every lead creation logged with timestamp
- [ ] Every message send/failure logged
- [ ] Every automation execution logged
- [ ] Errors include stack traces for debugging
- [ ] No sensitive data (API keys, tokens) in logs

**Check logs**:
```javascript
// Should see:
// [Audit] Running system stability checks...
// [Audit] Running data consistency checks...
// etc.
```

### Monitoring Hooks
- [ ] Circuit breaker enabled for external services
- [ ] Failed message tracking active
- [ ] Duplicate detection logging enabled
- [ ] Performance metrics logged
- [ ] Daily health report generated

### Alerts
- [ ] Critical error alert when > 5% failures in hour
- [ ] Warning alert for message storm detected
- [ ] Notification for duplicate lead detected
- [ ] Health check runs every 4 hours

---

## 7. SAFETY GATES VERIFICATION

### Do Not Contact
- [ ] Leads marked "Do Not Contact" get no messages
- [ ] Flag persists across sessions
- [ ] Verified in compliance audit

### Frequency Caps
- [ ] HOT leads: max 3 messages/day
- [ ] WARM leads: max 1 message/day
- [ ] COLD leads: max 1 message/week
- [ ] Caps enforced before send, not just logged

### Compliance
- [ ] SMS opt-out link working
- [ ] Email unsubscribe link working
- [ ] Bounced emails not retried
- [ ] GDPR compliance verified

---

## Pre-Launch Checklist (Final 48 Hours)

### 24 Hours Before Launch
- [ ] Run `runLaunchHardeningAudit` function
- [ ] Review audit report for any failures
- [ ] Confirm all leads have segment labels
- [ ] Verify message queue is empty or healthy
- [ ] Check error logs for patterns

**Run audit**:
```bash
curl -X POST /api/functions/runLaunchHardeningAudit
```

### 12 Hours Before Launch
- [ ] Verify database backups are recent
- [ ] Test restore procedure
- [ ] Confirm monitoring dashboards are active
- [ ] Alert channels verified (email, Slack)
- [ ] On-call procedures documented

### 2 Hours Before Launch
- [ ] Test end-to-end flow: Form submission → Lead created → Automation queued
- [ ] Verify Stripe webhook is connected and healthy
- [ ] Confirm SMS/email providers are connected
- [ ] Test a real booking flow
- [ ] Communication team briefed on known issues (if any)

### 30 Minutes Before Launch
- [ ] Final consistency check on database
- [ ] Verify all systems green on monitoring dashboard
- [ ] Confirm deployment is complete and stable
- [ ] Ready team members on standby

---

## Launch Day Monitoring

### First Hour
- [ ] Monitor lead ingestion rate
- [ ] Check message delivery success rate
- [ ] Review error logs in real-time
- [ ] Verify automation jobs are processing

### First Day
- [ ] Track conversion metrics
- [ ] Monitor system performance metrics
- [ ] Review all error patterns
- [ ] Validate duplicate prevention is working
- [ ] Check message delivery rates (SMS, email)

### First Week
- [ ] Daily health report review
- [ ] Weekly data consistency audit
- [ ] Performance trend analysis
- [ ] Customer feedback review
- [ ] Optimization opportunities identified

---

## Rollback Plan

If critical issues arise post-launch:

1. **Immediate** (< 5 min): Kill new lead creation (disable form)
2. **Short-term** (5–15 min): Stop automation execution (pause jobs)
3. **Medium-term** (15–60 min): Roll back recent changes if identified
4. **Full rollback**: Restore from pre-launch snapshot

**Rollback commands**:
```bash
# Stop accepting leads
UPDATE AdminSettings SET form_enabled = false;

# Stop automation jobs
UPDATE AutomationJob SET status = 'paused' WHERE status = 'pending';
```

---

## Success Criteria

✅ **READY FOR LAUNCH** when:
- All 7 hardening layers passing
- < 0.1% data inconsistencies
- < 5% message failure rate
- Zero orphaned records
- Duplicate detection working
- Error handling active
- Observability enabled
- Safety gates enforced

❌ **NOT READY** if:
- Any critical check failing
- > 1% duplicate rate
- Unresolved data inconsistencies
- Message delivery < 85%
- Automation loops detected
- Safety gates not enforced

---

**Status**: Pre-Launch Hardening Complete  
**Date Completed**: 2026-06-15  
**Launch Approved**: [ ] Yes / [ ] No  
**Approved By**: ________________  
**Date**: ________________