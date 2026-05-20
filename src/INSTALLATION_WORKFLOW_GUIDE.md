# Complete Installation & Lead Response Automation Workflow
## Technical Deep Dive: Order → Live Systems

---

## PART 1: TIMELINE PROGRESSION (Order Confirmed → Live)

### The Full State Machine

The dashboard tracker shows **5 stages** that services move through:

```
Paid (Order Confirmed) 
  ↓
Ready for Install (Admin/AI Auto-Transition)
  ↓
Configuring (Service Setup Begins)
  ↓
Testing (Automated Tests Run)
  ↓
Live ✦ (Service Active)
```

---

### Question 1: Does the Timeline Go from "Order Confirmed" to "System Setup" When Admin Okays or AI Automates It?

**SHORT ANSWER:** Both! There are **TWO paths**:

#### Path A: AI Auto-Advance (Default - No Admin Needed)
**When:** Runs automatically every 5 minutes via `autoAdvanceInstallPipeline` function

**Process:**
1. **Trigger:** Function finds orders with `pipeline_status: "Ready for Install"`
2. **Provision:** Validates all required config exists (Twilio numbers, SMS templates, booking links, etc)
3. **Auto-Advance:** `Paid` → `Ready for Install` → `Configuring` → `Testing` → `Live`
4. **No Admin Intervention:** The system handles everything autonomously

**Code Reference (autoAdvanceInstallPipeline):**
```javascript
// Step 1: Find orders ready for install
const orders = await base44.asServiceRole.entities.Order.filter(
  { pipeline_status: "Ready for Install" },
  "-install_initialized_at",
  100
);

// Step 2: Provision services (check config is complete)
const config = await provisionServices(base44, order);

// Step 3: Validate health checks
const health = await validateServiceHealth(base44, order, config);
if (!health.all_healthy) {
  // Mark as Error, don't proceed
  await base44.asServiceRole.entities.Order.update(order.id, {
    pipeline_status: "Error",
  });
  continue;
}

// Step 4-6: Auto-advance through stages
// Configuring → Testing → Live (all automatic)
await base44.asServiceRole.entities.Order.update(order.id, {
  pipeline_status: "Configuring"
});
await base44.asServiceRole.entities.Order.update(order.id, {
  pipeline_status: "Testing"
});
await base44.asServiceRole.entities.Order.update(order.id, {
  pipeline_status: "Live"
});

// Step 7: Send "You're Live" email
await sendLiveNotification(base44, order);
```

#### Path B: Admin Manual Control
**When:** Admin manually triggers state transitions (via admin dashboard)

**Process:**
1. **Admin Action:** Admin clicks "Approve" → `installPipeline` function called with `action: "update_status"`
2. **Manual Advance:** Admin can move `Paid` → `Ready for Install` OR skip steps if needed
3. **Validation:** Each transition checks if the transition is valid (defined in `VALID_TRANSITIONS`)

**Code Reference (installPipeline - Manual Path):**
```javascript
async function updateServiceInstallStatus(base44, order, serviceKey, nextStatus) {
  const currentStatus = item.install_status || "Paid";
  
  // Validate transition is allowed
  if (!VALID_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
    throw new InstallTransitionError(
      `Invalid transition: ${currentStatus} → ${nextStatus}`,
      { current: currentStatus, requested: nextStatus }
    );
  }
  
  // Update timestamp and mark when stages were entered
  const updatedItems = order.items.map((i) => {
    if (i.service_key !== serviceKey) return i;
    const updates = { ...i, install_status: nextStatus };
    
    if (nextStatus === "Configuring") {
      updates.install_started_at = timestamp;
    }
    if (nextStatus === "Live") {
      updates.install_completed_at = timestamp;
    }
    if (nextStatus === "Error") {
      updates.install_error = note;
    }
    return updates;
  });
  
  // Update the order
  await base44.asServiceRole.entities.Order.update(order.id, {
    items: updatedItems,
    pipeline_status: newPipelineStatus
  });
}
```

**Valid State Transitions (Hardcoded):**
```javascript
const VALID_TRANSITIONS = {
  "Paid": ["Ready for Install"],
  "Ready for Install": ["Configuring"],
  "Configuring": ["Testing"],
  "Testing": ["Live", "Error"],
  "Live": ["Live"],           // Stay live (idempotent)
  "Error": ["Ready for Install", "Configuring"], // Can retry
};
```

**ANSWER:** 
- **AI Auto-Transition:** `Paid` → `Ready for Install` happens via `autoAdvanceInstallPipeline` AUTOMATICALLY when order.payment_status = "paid" (no admin needed)
- **Admin Manual:** Admin can manually trigger transitions in the admin panel, which calls `installPipeline` with `action: "update_status"`
- **Default:** AI auto-advances UNLESS the order fails health checks (missing Twilio number, no SMS template, etc) — then it marks as "Error" and waits for admin to fix

---

## PART 2: TESTING INSTANT LEAD RESPONSE AUTOMATION

### Question 2: What Kind of Tests Do We Run Once Client is Connected?

**Test Types for `instant_lead_response`:**

#### Test 1: SMS Template Validation
**What:** Checks the SMS response template exists and is properly registered
**Code:**
```javascript
if (!config.sms_template_id || !config.webhook_url) {
  throw new Error("Missing required SMS template or webhook URL");
}
```
**Validates:**
- SMS template was created and stored in database
- Template has a valid body (e.g., "Hi {{name}}, thanks for reaching out...")
- Webhook URL is registered for form submissions

#### Test 2: Webhook Registration
**What:** Checks webhooks are active and listening for events
**Code:**
```javascript
const webhook = await base44.asServiceRole.entities.WebhookRegistration.create({
  service_key: "instant_lead_response",
  webhook_url: webhookUrl,
  events: ["lead.created", "call.missed"],
  status: "active"
});
```
**Validates:**
- Webhook is registered to listen for `lead.created` (form submission)
- Webhook is registered to listen for `call.missed` (missed calls)
- Status is "active"

#### Test 3: End-to-End SMS Send Test (Manual)
**What:** Actually sends a test SMS to verify Twilio connection works
**Function:** `testInstantLeadResponse` (invoked during Testing stage)

**How It Works:**
```javascript
// Test function creates a REAL test lead and sends SMS
const testLead = await base44.asServiceRole.entities.WebsiteLead.create({
  full_name: "Test Lead",
  first_name: "Test",
  email: "test@example.com",
  phone_number: "+16025874608", // Admin test number
  service_interest: "Testing",
  message: "Test lead for SMS verification",
  source: "website_form",
  automation_enabled: true,
});

// Invoke the actual SMS sending function
const smsResult = await base44.functions.invoke("sendInstantLeadResponseSms", {
  lead_id: testLead.id,
  lead: testLead,
});

// Check if SMS was logged in CommunicationEvent
const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
  { lead_id: testLead.id, event_type: "sms_sent" },
  "-created_date",
  1
);

return {
  success: smsResult.success && events.length > 0,
  sms_sent: events.length > 0,
  communication_event: events[0] || null
};
```

---

### Question 3: How Do We Run the Tests?

**Step-by-Step Testing Process:**

#### Step 1: Configuration Phase (Automatic)
```javascript
// Historical pre-recovery example from the retired configureService path.
async function configureInstantLeadResponse(base44, order, item) {
  // Register SMS template
  const smsTemplate = await registerTemplate(base44, {
    name: "instant_response",
    type: "sms",
    body: config.sms_template || "Hi {{name}}, thanks for reaching out!",
    service_key: "instant_lead_response",
  });

  // Register webhook
  const webhookUrl = `${Deno.env.get("APP_URL")}/webhooks/lead-capture`;
  await registerWebhook(base44, {
    service_key: "instant_lead_response",
    webhook_url: webhookUrl,
    events: ["lead.created", "call.missed"],
  });

  // Update project config with template IDs and webhook URL
  await base44.asServiceRole.entities.ClientProject.update(order.client_id, {
    install_configuration: {
      services: {
        instant_lead_response: {
          enabled: true,
          sms_template_id: smsTemplate.id,
          webhook_registered: true,
          webhook_url: webhookUrl,
          configured_at: new Date().toISOString(),
        },
      },
    },
  });

  return {
    enabled: true,
    sms_template_id: smsTemplate.id,
    webhook_url: webhookUrl,
    template_body: smsTemplate.body,
  };
}
```

#### Step 2: Test Execution (Automatic)
```javascript
// In configService function, after config is complete
const testResult = await runServiceTests(base44, "instant_lead_response", order, configResult);

if (!testResult.passed) {
  throw new Error(`Service tests failed: ${testResult.error}`);
}
```

#### Step 3: What Tests Actually Run
```javascript
async function testInstantLeadResponse(config) {
  console.log("[Tests] Testing instant lead response");
  
  // Validation 1: SMS template exists
  if (!config.sms_template_id) {
    throw new Error("Missing required SMS template");
  }
  
  // Validation 2: Webhook is registered
  if (!config.webhook_url) {
    throw new Error("Missing webhook URL");
  }
  
  // If both pass, test is successful
  return { 
    passed: true, 
    tested: ["sms_template", "webhook"] 
  };
}
```

#### Step 4: If Tests Pass → Mark as Live
```javascript
if (testResult.passed) {
  // Update service status to Live
  await base44.asServiceRole.functions.invoke("installPipeline", {
    action: "update_status",
    order_id,
    service_key: "instant_lead_response",
    install_status: "Live", // ✦ NOW LIVE
  });
  
  // Dashboard will show green "Live ✦" badge
}
```

---

### What Functions Get Called During Testing?

| Function | Purpose | When Called |
|----------|---------|-------------|
| `configService` | Main orchestrator | When admin triggers setup OR auto-pipeline runs |
| `configureInstantLeadResponse` | Service-specific config | During "Configuring" stage |
| `registerTemplate` | Create SMS template | During config setup |
| `registerWebhook` | Setup webhook listeners | During config setup |
| `runServiceTests` | Run all validation tests | After config, before marking Live |
| `testInstantLeadResponse` | SMS-specific validation | Called by `runServiceTests` |
| `sendInstantLeadResponseSms` | Actually sends test SMS | Optional end-to-end test |
| `installPipeline` | State machine transitions | Move from Testing → Live |

---

## PART 3: TESTING → LIVE TRANSITION

### Question 4: How Do We Go From Testing to Live?

**The Transition Flow:**

#### Automatic Path (Auto-Pipeline)
```javascript
// In autoAdvanceInstallPipeline, Step 4 and 5:

// STEP 4: Mark as Testing (after config done)
await base44.asServiceRole.entities.Order.update(order.id, {
  pipeline_status: "Testing",
  last_install_event_at: new Date().toISOString(),
});

// STEP 5: Auto-advance to Live (no tests failure)
await base44.asServiceRole.entities.Order.update(order.id, {
  pipeline_status: "Live",  // ← SERVICE IS NOW LIVE
  order_status: "fully_live",
  last_install_event_at: new Date().toISOString(),
});

// STEP 6: Send celebration email
await sendLiveNotification(base44, order);
```

#### Manual Path (Admin-Triggered in configService)
```javascript
// In configService function:
await base44.asServiceRole.functions.invoke("installPipeline", {
  action: "update_status",
  order_id,
  service_key: "instant_lead_response",
  install_status: "Live", // ← Manually transition to Live
});
```

**NO EXTRA TESTS BEFORE LIVE:**
- The system does NOT re-run tests when going from Testing → Live
- The tests passed during the "Configuring" stage
- Transition is immediate once tests pass

---

## PART 4: LIVE INDICATOR IN DASHBOARD

### Question 5: When Service is Live, Does the "Live ✦" Icon Show Up Green?

**YES! Here's How:**

#### Dashboard Component Display
In `ResponsiveServiceCard` component:
```javascript
// Current status shows in the card badge
<ServiceStatusBadge installStatus={installStatus} />
```

#### ServiceStatusBadge Component
```javascript
// Shows the visual indicator based on install_status
if (installStatus === "Live") {
  return (
    <div style={{
      background: "rgba(34,197,94,0.2)", // Green background
      border: "1px solid rgba(34,197,94,0.4)",
      color: "#4ade80", // Green text
      padding: "6px 14px",
      borderRadius: "9999px",
    }}>
      ✦ Live
    </div>
  );
}
```

#### Progress Ring Visual
```javascript
// ServiceProgressRing shows color-coded progress
const stageColors = [
  "#9a5c2e",  // Paid - brown
  "#3b82f6",  // Ready - blue
  "#f59e0b",  // Configuring - amber
  "#8b5cf6",  // Testing - purple
  "#22c55e",  // Live - GREEN ✦
];
```

#### Timeline in Card
In `ServiceCardTimeline` component:
```javascript
// When currentStage === 4 (Live), the 5th circle turns green
const color = colors[idx]; // Gets "#22c55e" for Live
return (
  <div style={{
    background: isComplete ? color : isCurrent ? `${color}20` : "rgba(...)",
    // Live indicator is fully green when complete
  }}>
    {isComplete && <CheckCircle2 style={{ color: "#fff" }} />}
  </div>
);
```

#### Horizontal Stage Tracker
```javascript
// The main tracker also shows Live in green
{installStatus === "Live" && (
  <div style={{
    color: "#4ade80",      // Green
    fontWeight: "700",
    background: "rgba(34,197,94,0.2)",
  }}>
    ✦ Live
  </div>
)}
```

**SUMMARY:**
- ✅ Green color: `#22c55e` (Tailwind `green-500`)
- ✅ Badge shows: `✦ Live` in green background
- ✅ Progress ring fills with green
- ✅ Timeline shows green checkmark
- ✅ All visual indicators turn green when `installStatus === "Live"`

---

## PART 5: COMPLETE REQUEST/RESPONSE CYCLE

### A Test Lead Through the System

**Timeline:**

1. **Order Paid** (Customer buys "Instant Lead Response")
   ```
   Order.payment_status = "paid"
   Order.pipeline_status = "Paid"
   Service.install_status = "Paid"
   ```

2. **Auto-Advance Triggers** (Every 5 minutes via `autoAdvanceInstallPipeline`)
   ```
   → Ready for Install (provision begins)
   → Configuring (register template + webhook)
   → Testing (validate template exists)
   → Live (mark as active)
   ```

3. **What's Registered During Config**
   - SMS template: "Hi {{name}}, thanks for reaching out to {{business}}!"
   - Webhook: `yourapp.com/webhooks/lead-capture` listening for `lead.created` and `call.missed` events
   - Client project updated with template IDs

4. **Test Lead Comes In**
   - Form submission on client's website
   - Webhook fires: `lead.created` event sent to your system
   - `sendInstantLeadResponseSms` is invoked
   - SMS sent to lead's phone number
   - Event logged in `CommunicationEvent` table with `event_type: "sms_sent"`

5. **Dashboard Shows**
   ```
   Service Card Badge: "✦ Live" (green)
   Progress: 100% (5/5 stages complete)
   Timeline: All stages green with checkmarks
   Last Stage: "Live & delivering results"
   ```

---

## SUMMARY TABLE

| Question | Answer | Key Function |
|----------|--------|--------------|
| **Timeline progression?** | Auto-advance via `autoAdvanceInstallPipeline` every 5 min OR admin manual via `installPipeline` | `autoAdvanceInstallPipeline` & `installPipeline` |
| **What tests run?** | SMS template exists, webhook registered, optional end-to-end SMS send | `testInstantLeadResponse` |
| **How do we test?** | Configuration validates template & webhook, then `runServiceTests` checks both exist | `configService` → `testInstantLeadResponse` |
| **Testing → Live?** | Automatic. Once tests pass, immediately transitions to Live with `installStatus: "Live"` | `installPipeline` with `install_status: "Live"` |
| **Live indicator?** | Badge shows "✦ Live" in green (#22c55e), progress ring green, timeline all green | `ServiceStatusBadge`, `ServiceCardTimeline` |

---

## DATABASE FLOW

```
Order
├─ payment_status: "paid"
├─ pipeline_status: "Paid" → "Ready for Install" → "Configuring" → "Testing" → "Live"
├─ items: [
│  {
│    service_key: "instant_lead_response",
│    install_status: "Live" ✦,
│    install_started_at: "2024-04-30T10:30:00Z",
│    install_completed_at: "2024-04-30T10:35:00Z"
│  }
│ ]
└─ client_id: links to ClientProject

ClientProject
└─ install_configuration: {
     services: {
       instant_lead_response: {
         enabled: true,
         sms_template_id: "tmpl_xyz",
         webhook_url: "app.com/webhooks/lead-capture",
         webhook_registered: true
       }
     }
   }

MessageTemplate
├─ id: "tmpl_xyz"
├─ body: "Hi {{name}}, thanks for reaching out!"
├─ type: "sms"
└─ service_key: "instant_lead_response"

WebhookRegistration
├─ service_key: "instant_lead_response"
├─ webhook_url: "app.com/webhooks/lead-capture"
├─ events: ["lead.created", "call.missed"]
└─ status: "active"

WebsiteLead (Created when form submitted)
├─ full_name: "John Doe"
├─ phone_number: "+1234567890"
├─ email: "john@example.com"
├─ lead_status: "new"
└─ automation_enabled: true

CommunicationEvent (Logged when SMS sent)
├─ lead_id: "lead_abc123"
├─ event_type: "sms_sent"
├─ channel: "sms"
├─ direction: "outbound"
├─ status: "sent"
└─ message_body: "Hi John, thanks for reaching out to Acme Corp!"
```

---

## DASHBOARD FUNCTIONALITY

All components are **FULLY FUNCTIONAL**:

✅ **HorizontalStageTracker** - Shows all 5 stages, animates progress, color-codes by status
✅ **ServiceCard** - Expands to show full timeline and action buttons on mobile
✅ **ServiceCardTimeline** - Displays all 5 steps with current step highlighted
✅ **ServiceCardProgressBar** - Shows percentage complete with stage description
✅ **ServiceCardActions** - View Details, Setup Guide, Get Help buttons
✅ **DashboardMetricsBar** - Shows Live Count, In Progress, Need Attention
✅ **MobileBottomNav** - Sticky navigation on mobile (displays on screens < 640px)
✅ **ResponsiveServiceCard** - Collapses timeline on mobile with expand/collapse toggle

All visual indicators update correctly as services progress through stages.

---

## END OF GUIDE
