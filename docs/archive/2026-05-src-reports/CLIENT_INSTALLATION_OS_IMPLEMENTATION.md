# Client Installation Operating System (SMART MERGE)

## STEP 0 — SYSTEM DETECTION RESULTS

### ✅ REUSED STRUCTURES
1. **Order** — Already had:
   - `items[]` with service details
   - `install_status` (Paid, Ready for Install, Configuring, Testing, Live, Error)
   - `install_configuration` with service-specific settings
   - `notes` for admin tracking
   - **Action**: Minimal changes needed; added reference to `website_project_id`

2. **Client** — Already had:
   - Core profile (full_name, email, phone, business_name)
   - booking_link, business_hours
   - status enum (Onboarding, In Setup, Active, Completed)
   - **Action**: Maps naturally to install workflow

3. **AutomationChecklist** — Already existed:
   - Boolean flags (twilio_configured, resend_configured, etc.)
   - status enum (not_started, in_progress, active, failed, paused)
   - admin_notes field
   - **Action**: Extended with structured step tracking via new entity

### 🆕 EXTENDED STRUCTURES
1. **Order** (minimal extension):
   - Added: `website_project_id` (optional, links to ClientProject)
   - No breaking changes; backward compatible

2. **AutomationChecklist** (enhanced):
   - Old model: Boolean fields (simple)
   - New model: Links to `AutomationChecklistStep` entity for granular tracking
   - **Both coexist**: Legacy booleans still work; new steps override for admin UI

### 🎯 NEW ENTITIES & COMPONENTS

#### Entity: `AutomationChecklistStep`
- Tracks each checkbox with:
  - status (pending, in_progress, complete, failed)
  - completed_at (timestamp)
  - completed_by (admin email)
  - notes & error_message (context)
- Full audit trail per step

#### Entity: `ClientInstallationOS`
- Master workflow orchestrator
- Fields:
  - workflow_stage (intake_received → activated)
  - website_status (not_started, building, review, approved, live)
  - activation_eligible (computed from checklist completion)
  - activation_status (not_ready, ready_for_approval, activated, paused)
  - activation_override (with reason & approver)

#### Component: `InstallChecklistPanel`
- Admin UI showing all services & their steps
- Click steps to toggle status
- Progress bar per service
- Color-coded: pending (gray), in_progress (amber), complete (green), failed (red)

#### Component: `ActivationGate`
- Shows eligibility status
- "Activate Client" button (green) if eligible
- "Override & Activate" (amber) if not eligible + requires reason

#### Function: `initializeInstallOS`
- Called when order transitions to "paid"
- Creates ClientInstallationOS
- Creates AutomationChecklist for each service
- Initializes step tracking

---

## STEP 1-2 — CLIENT & ORDER PROFILE (REUSED)

**No changes needed.** Order entity already tracks:
- Customer info (email, name, phone, business_name)
- Services list (items[])
- Install status (pipeline_status enum)

**New field added to Order:**
```
website_project_id (string, optional) — Link to ClientProject if applicable
```

---

## STEP 3 — WEBSITE PROJECT WORKFLOW

**Existing:** `ClientProject` entity (if available) already handles website status.

**Integration:**
1. When admin updates website status in ClientProject
2. It syncs to `ClientInstallationOS.website_status`
3. Affects overall `workflow_stage` progression

**Status Flow:**
```
not_started → building → review → approved → live
```

---

## STEP 4 — AUTOMATION INSTALL CHECKLIST ENGINE

### How It Works

#### 1. Initialization (on order paid)
```javascript
// Admin calls or auto-triggered:
initializeInstallOS(order_id)
  → Creates ClientInstallationOS
  → Creates AutomationChecklist per service
  → Creates AutomationChecklistStep[] for each service
```

#### 2. Step Definitions
Defined in `lib/automationChecklistSteps.js`:

**Example: Instant Lead Response**
```
[ ] Lead form connected
[ ] Phone field validated
[ ] Twilio number assigned
[ ] SMS template configured
[ ] sendInstantLeadResponseSms active
[ ] Test lead submitted
[ ] SMS received
[ ] Email received
[ ] CommunicationEvent logged
[ ] Duplicate prevention verified
```

All 6 services have pre-defined steps (see `CHECKLIST_STEPS_BY_SERVICE`).

#### 3. Admin Workflow

**In Admin Dashboard → Install Checklists:**

1. See all services as collapsible cards
2. Each service shows:
   - Progress bar (X/Y steps complete)
   - Service name & status
3. Click to expand → See all steps
4. Click step checkbox to:
   - pending → in_progress
   - in_progress → complete
5. Completed steps show:
   - Green checkmark
   - Date completed
   - Admin who completed it

#### 4. Checklist Status
Each step has 4 statuses:
- **pending** (gray) — Not started
- **in_progress** (amber) — Being worked on
- **complete** (green) — ✓ Done, verified
- **failed** (red) — Blocker; shows error message

---

## STEP 5 — TESTING DASHBOARD

**Implementation:** Use `AutomationChecklistStep` with service-specific test steps.

**Test Steps Example (per service):**

For **Instant Lead Response:**
```
[ ] Test lead created
[ ] Instant SMS sent
[ ] Instant email sent
[ ] Reply captured
[ ] Duplicate prevented
[ ] CommunicationEvent logged
```

**Admin can:**
1. Mark test steps as "in_progress" while running test
2. Mark as "complete" when verified
3. Mark as "failed" with error message if issues occur
4. Add notes per test step

**Test checklist is part of the 10-step flow** for each service.

---

## STEP 6 — ACTIVATION GATE

### Rules

**Activation is allowed if:**

**Option A: All Steps Complete**
- Every service has 100% steps complete
- → "Ready for Activation" (green)
- → Click "✓ Activate Client" button
- → Instantly sets `activation_status = "activated"`

**Option B: Admin Override**
- Some steps incomplete
- → "Not Ready for Activation" (amber)
- → Click "Override & Activate"
- → Popup asks for override reason (required)
- → Admin types reason
- → Confirms
- → Sets `activation_status = "activated"` with override flag
- → Logs: who, when, reason

### Data Captured on Activation

```javascript
{
  activation_status: "activated",
  activation_approved_at: "2026-04-29T14:30:00Z",
  activation_approved_by: "admin@company.com",
  activation_override: true/false,
  activation_override_reason: "Reason here if override",
  activation_override_by: "admin@company.com" (if override)
}
```

---

## STEP 7 — ADMIN UI BEHAVIOR

### Location: Admin Dashboard → "Install Checklists" Tab

### Layout (per client/order):

```
┌─────────────────────────────────────────┐
│ CLIENT INSTALLATION WORKFLOW             │
├─────────────────────────────────────────┤
│                                          │
│ SECTION 1: Client Info                  │
│ - Name, Email, Phone, Business         │
│ - Status: In Setup / Active             │
│                                          │
│ SECTION 2: Package & Billing            │
│ - Services ordered                       │
│ - Total setup / monthly                 │
│ - Payment status                        │
│                                          │
│ SECTION 3: Website Status               │
│ - Current: Not Started / Building, etc  │
│ - Link to website project               │
│                                          │
│ SECTION 4: Automation Checklists        │
│ ┌─── Instant Lead Response ──────────┐ │
│ │ ████░░░░░░ 6/10 steps complete    │ │
│ │ [Click to expand steps]             │ │
│ │ - [ ] Lead form connected          │ │
│ │ - [✓] Twilio configured           │ │
│ │ - [⚠] SMS template (in progress)  │ │
│ │ - [✗] Test failed (timeout)       │ │
│ │ ...                                 │ │
│ └─────────────────────────────────────┘ │
│ [Repeat for each service]                │
│                                          │
│ SECTION 5: Activation Gate              │
│ ┌──────────────────────────────────────┐│
│ │ ⚠️  Not Ready for Activation        ││
│ │ Complete all checklist items or     ││
│ │ use admin override.                 ││
│ │                                     ││
│ │ [Override & Activate] button        ││
│ └──────────────────────────────────────┘│
│                                          │
└─────────────────────────────────────────┘
```

### Color Scheme:

- **Pending** (gray) — `#9CA3AF`
- **In Progress** (amber) — `#F59E0B`
- **Complete** (green) — `#10B981`
- **Failed** (red) — `#EF4444`

---

## STEP 8 — STRICT NON-MODIFICATION RULES

### ✅ DO NOT TOUCH

1. **SMS sending logic** (sendInstantLeadResponseSms, etc.)
2. **Email sending logic** (Resend, Gmail functions)
3. **Stripe checkout** (checkout session creation)
4. **stripeWebhookOrders** (payment webhook handler)
5. **Store UI** (product cards, cart, pricing)
6. **Public website pages** (Home, Industries, etc.)
7. **AI Orchestrator** (automationOrchestrator function)
8. **Twilio webhook logic** (receiveTwilioMissedCallWebhook, etc.)
9. **Resend webhook logic** (receiveResendWebhook)

**These remain untouched.** The checklist system is purely **tracking & visibility**, not execution.

---

## STEP 9 — RISKS & MANUAL STEPS

### ✅ Fully Automated
- Checklist creation on order paid
- Step tracking & timestamps
- Activation gate logic
- Audit trail (who, when, what)

### ⚠️ Manual Admin Actions
1. **Marking steps complete** — Admin must manually verify each step
   - Solution: Create test runner functions for auto-verification (future)
2. **Updating website status** — Admin updates in ClientProject
   - Solution: Sync function to push to ClientInstallationOS (future)
3. **Override activation** — Requires admin judgment
   - Solution: Necessary for edge cases; log override reason

### 🚀 Future Automation (Out of Scope)
- Auto-test runner (run tests, mark steps)
- Webhook listeners (mark steps when SMS/email detected)
- CommunicationEvent listener (auto-mark "event_logged" step)
- Website project sync (auto-update website_status)

---

## STEP 10 — SUMMARY

| Component | Status | Purpose |
|-----------|--------|---------|
| Order | Reused | Tracks services & install config |
| Client | Reused | Client profile data |
| AutomationChecklist | Extended | Links to steps entity |
| **AutomationChecklistStep** | **NEW** | Individual step tracking |
| **ClientInstallationOS** | **NEW** | Master workflow orchestrator |
| **InstallChecklistPanel** | **NEW** | Admin UI for steps |
| **ActivationGate** | **NEW** | Activation eligibility & override |
| **initializeInstallOS** | **NEW** | Setup function |

### Admin Workflow Summary:

1. **Order paid** → initializeInstallOS auto-runs (or admin manually triggers)
2. **Admin navigates to Install Checklists** in Admin Dashboard
3. **For each service:**
   - Sees progress bar
   - Expands to see all steps
   - Clicks to mark steps as in_progress / complete / failed
   - Adds notes as needed
4. **When all steps complete** → "Ready for Activation" (green)
5. **Admin clicks "Activate"** → Client goes live
6. **If incomplete** → Can override with reason + approval

### No Code Changes Required To:
- SMS/Email/Stripe logic
- Website automation
- Public pages
- Lead capturing

Everything is **additive** and **non-invasive**.

---

## TESTING CHECKLIST

- [ ] Create test order
- [ ] Run initializeInstallOS
- [ ] Verify ClientInstallationOS created
- [ ] Verify AutomationChecklistStep records created for each service
- [ ] Open InstallChecklistPanel in Admin Dashboard
- [ ] Click steps to toggle status
- [ ] Verify completion timestamps recorded
- [ ] Check activation gate shows "Not Ready" (if steps incomplete)
- [ ] Mark all steps complete
- [ ] Verify activation gate shows "Ready"
- [ ] Click Activate Client
- [ ] Verify ClientInstallationOS.activation_status = "activated"
- [ ] Test override workflow
- [ ] Verify override reason required

---

Done. Ready for admin integration.