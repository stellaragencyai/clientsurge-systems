# Canonical Admin Operator Blueprint

This document describes the **current real remote-setup system in this repo**. It is not a future-state plan. It is grounded in the current canonical order-driven install architecture, current tracked services, current admin workspace, current backend gating, and current `CommunicationEvent` audit trail.

## Source Files Used

This blueprint and SOP were built from the current behavior in these files:

- `C:\Base44Projects\clientsurge-systems\base44\functions\_shared\installPipeline.js`
- `C:\Base44Projects\clientsurge-systems\base44\functions\_shared\installRuntime.js`
- `C:\Base44Projects\clientsurge-systems\base44\functions\_shared\remoteSetupWorkspace.js`
- `C:\Base44Projects\clientsurge-systems\base44\functions\getInstallConfiguration\entry.ts`
- `C:\Base44Projects\clientsurge-systems\src\components\admin\InstallOrderWorkspace.jsx`
- `C:\Base44Projects\clientsurge-systems\src\App.jsx`
- `C:\Base44Projects\clientsurge-systems\base44\functions\_shared\legacyQuarantine.js`

---

# Part 1 - Repo-Specific Operator Blueprint

## 1. Canonical Source Of Truth

The live install system in this repo uses these canonical records:

- `Order`
  - paid install record
  - primary setup work item
  - carries payment state, linked record ids, pipeline status, timeline pointers, and notes
- `Order.items[]`
  - per-service install state
  - canonical `install_status` for each purchased tracked service
- `Order.install_configuration`
  - canonical shared config and per-service config
- `CommunicationEvent`
  - canonical audit trail for:
    - payment/install initialization
    - config updates
    - blocked transitions
    - status changes
    - runtime attempts
    - provider send attempts
    - provider send successes/failures
    - service-specific simulated runtime events

Supporting mirrors exist but are **not** source of truth:

- `ClientProject`
- `OnboardingClient`

The admin workspace already warns operators not to use mirrored records for install truth.

## 2. Tracked Services Currently Supported

Current tracked install services from `installPipeline.js`:

1. `instant_lead_response`
   - Display name: `Instant Lead Response`
2. `missed_call_text_back`
   - Display name: `Missed Call Text-Back`
3. `nurture_sequence_14d`
   - Display name: `14-Day Nurture Sequence`
4. `ai_booking_agent`
   - Display name: `AI Booking Agent`
5. `lead_reactivation`
   - Display name: `Old Lead Reactivation`
6. `review_request`
   - Display name: `Review Request Automation`

## 3. Canonical Remote Setup Flow

Actual repo flow:

1. Stripe marks the order paid.
2. `initializePaidOrderInstallPipeline(...)` creates or safely links the canonical install structures.
3. The order enters the paid install queue.
4. Admin opens `/admin` and selects the order in `InstallOrderWorkspace`.
5. Workspace loads canonical state through `getInstallConfiguration`.
6. Operator resolves any order-level blockers:
   - unpaid order
   - missing linked records
   - `pipeline_error`
7. Operator completes shared config if the purchased services require it.
8. Operator completes service-specific config on `Order.install_configuration`.
9. Operator saves config through canonical backend config endpoints.
10. Operator moves a service from:
    - `Ready for Install` -> `Configuring`
    - `Configuring` -> `Testing`
11. Operator runs the canonical service test action.
12. Operator verifies success in `CommunicationEvent`.
13. Operator moves the service from `Testing` -> `Live` only if backend rules allow it.

No service should be considered live based on UI state or mirror fields alone.

## 4. Required Config Per Service

### Instant Lead Response

Required shared config:

- `twilio_business_phone`
- `business_hours`
- `after_hours_behavior`
- `consent_behavior`
- `opt_out_message`

Required service config:

- `sms_template`

### Missed Call Text-Back

Required shared config:

- `twilio_business_phone`
- `business_hours`
- `after_hours_behavior`
- `consent_behavior`
- `opt_out_message`

Required service config:

- `sms_template`

### 14-Day Nurture Sequence

Required shared config:

- `twilio_business_phone`
- `business_hours`
- `after_hours_behavior`
- `consent_behavior`
- `opt_out_message`

Required service config:

- at least one channel enabled:
  - `sms_enabled` or `email_enabled`
- at least 3 valid `steps`
- every step must have:
  - valid `day`
  - valid `channel`
  - `message_template`

### AI Booking Agent

Required service config:

- `booking_link`
- `booking_mode`
- `confirmation_template`
- `reminder_template` if `reminder_enabled = true`
- `intake_fields`

Current booking mode values:

- `external_link`
- `internal_placeholder`

### Old Lead Reactivation

Required service config:

- `target_segment`
- `message_template`
- `max_batch_size`

Current target segment values:

- `all_dormant`
- `contacted_no_reply`
- `qualified_unbooked`

### Review Request Automation

Required service config:

- `review_link`
- `trigger_event`
- `message_template`
- `channel`

Optional but validated:

- `send_delay_minutes`
- `fallback_internal_feedback_enabled`

Current trigger values:

- `appointment_completed`
- `order_completed`
- `manual_trigger`

Current channel values:

- `sms`
- `email`

## 5. What Blocks Testing

Testing is blocked by backend truth, not the UI, when any of these are true:

- order-level blockers exist
- required config is incomplete
- service is not in a valid prior lifecycle state
- a service-specific validation rule is not satisfied

Practical Testing blockers by service:

### Instant Lead Response

- missing shared SMS config
- missing `sms_template`
- Twilio business phone not saved
- Twilio/provider readiness surfaced as blocked or errored

### Missed Call Text-Back

- missing shared SMS config
- missing `sms_template`
- Twilio business phone not saved
- Twilio/provider readiness surfaced as blocked or errored

### 14-Day Nurture Sequence

- no channel enabled
- fewer than 3 steps
- invalid step definition
- first step channel cannot run with current provider readiness

### AI Booking Agent

- missing booking link
- missing booking mode
- missing confirmation template
- missing reminder template when reminders are enabled
- missing intake fields

### Old Lead Reactivation

- missing target segment
- missing message template

### Review Request Automation

- missing review link
- missing trigger event
- missing message template
- missing channel

## 6. What Blocks Live

All currently supported tracked services follow the same canonical high-level rule:

- config must be complete
- backend must consider the service ready for Live
- a successful canonical runtime test must already exist in `CommunicationEvent`

Live is blocked when:

- a service has not produced a successful canonical runtime test
- there are still blocking required actions
- a transition is not allowed from the current status

Important current nuance:

- `review_request`, `lead_reactivation`, and `ai_booking_agent` currently treat provider readiness as informational or placeholder-aware in some areas, but **Live is still blocked until successful canonical test success exists**
- `nurture_sequence_14d` uses actual enabled-channel/provider readiness in its go-live summary

## 7. What Is Proven By The System Today

The repo currently proves:

- paid order initialization into canonical install state
- tracked-service install state on `Order.items[]`
- canonical config storage on `Order.install_configuration`
- backend-enforced transitions through `installPipeline.js`
- backend-enforced runtime/test execution through `installRuntime.js`
- blocked transition consistency
- blocked runtime consistency
- deterministic required-actions derivation
- order-centric admin workspace in `/admin`
- provider health/provider test alignment through canonical admin endpoints
- webhook trust for Twilio status webhooks and Resend webhooks
- order-backed portal ownership resolution
- consistent `CommunicationEvent` audit logging across install/test flows

## 8. What Is Still Placeholder / Not Proven By Live Execution

These are intentionally honest placeholders right now:

### 14-Day Nurture Sequence

- scheduler preview exists
- no live cron/scheduler proof yet

### AI Booking Agent

- no real external booking creation
- no real calendar sync
- `internal_placeholder` is an explicit placeholder mode

### Old Lead Reactivation

- no standalone live outbound campaign engine
- test path is canonical and real as an internal placeholder batch exercise

### Review Request Automation

- trigger simulation exists
- no live appointment/order trigger automation yet
- no real delayed-send scheduler yet
- no review scraping
- no reputation monitoring

## 9. What Is Blocked By EIN / Twilio Restoration

The repo can enforce SMS setup and test gating, but these real-world validations are still blocked or partially blocked by Twilio account/business restoration work:

- true production SMS delivery confirmation
- true production missed-call routing proof
- production phone-number restoration confidence
- production live carrier-route validation for SMS-based services

This directly affects live external proof for:

- Instant Lead Response
- Missed Call Text-Back
- SMS steps in 14-Day Nurture Sequence
- SMS channel in Review Request Automation

## 10. Old Systems / Surfaces That Are Quarantined And Must Not Be Used

### Quarantined Admin / Analytics Routes

From `App.jsx`:

- `/dashboard` -> redirects to `/admin`
- `/lead-intelligence` -> redirects to `/admin`
- `/medspa-dashboard` -> redirects to `/admin`

Canonical operator surface is:

- `/admin`

### Quarantined Legacy Backend Endpoints

From `legacyQuarantine.js`:

- `createLeadAndDispatch`
- `handleNewLead`
- `sendLeadInstantSms`
- `receiveTwilioSMS`
- `receiveTwilioInboundWebhook`
- `scheduleFollowUpEmails`
- `scheduleFollowUpSMS`
- `autoEndToEndTest`
- `autoSendWebhookInstructions`
- `autoProvisionTwilioNumber`

These return `legacy_endpoint_quarantined` and must not be used for setup or runtime operations.

### Deprecated Concepts Operators Should Avoid

- deprecated `Lead` model for active install/runtime work
- mirrored `ClientProject` and `OnboardingClient` progress fields as install truth
- any legacy lead-based dashboard surface
- any old Twilio handlers that bypass canonical order-backed runtime

---

# Part 2 - Internal Operator SOP

## General SOP For All Supported Services

### Step 1 - Open the paid order

Where to click:

- Go to `/admin`
- Use the paid install queue
- Open the client order in `InstallOrderWorkspace`

What to look for:

- `Client Setup Control Center`
- payment status is paid
- no `pipeline_error`
- linked records are present, or the workspace clearly says they need manual repair

Stop and fix first if:

- payment is not paid
- `pipeline_error` is shown
- linked records are missing and order-level required actions say `Verify linked records`

### Step 2 - Read Operator Focus first

Where to click:

- Top of the workspace

What to look for:

- `Operator Focus`
- `Next Best Actions`
- `Shared Config Progress`
- counts for blockers, ready for testing, ready for live

Use this before scrolling.

### Step 3 - Resolve order-level blockers

Where to click:

- `Required Actions Engine`
- `Order-level actions`

What confirms success:

- no order-level blockers remain

Stop and fix first if:

- order is unpaid
- linked records are missing
- `pipeline_error` is present

### Step 4 - Complete shared runtime setup if required

Where to click:

- `Remote Configuration`
- `Shared runtime setup`

What to enter:

- Twilio business phone
- business hours
- after-hours behavior
- consent behavior
- opt-out message

What confirms success:

- shared config blockers disappear
- `Shared Config Progress` becomes complete
- service-level missing shared fields disappear from required actions

### Step 5 - Complete service-specific config

Where to click:

- service config section in `Remote Configuration`

What to enter:

- service-specific required fields only

Operator tip:

- use `Use suggested copy` when available to reduce typing

What confirms success:

- service shows config complete
- missing config actions disappear
- operator summary no longer tells you to finish config first

### Step 6 - Save install config

Where to click:

- `Save Install Config`

What confirms success:

- success banner
- `CommunicationEvent` logs config update
- backend-derived required actions refresh

Stop and fix first if:

- save fails
- required actions do not refresh

### Step 7 - Move the service to Configuring

Where to click:

- service card
- `Move to Configuring`

What confirms success:

- status badge changes
- timeline logs `service_status_changed`

Stop and fix first if:

- backend blocks transition
- timeline logs `service_transition_blocked`

### Step 8 - Move the service to Testing

Where to click:

- service card
- `Move to Testing`

What confirms success:

- status changes to `Testing`
- timeline logs `service_status_changed`

Stop and fix first if:

- transition is blocked
- backend response includes missing labels
- timeline logs `service_transition_blocked`

### Step 9 - Run the canonical service test

Where to click:

- `Remote Test Targets`
- confirm test phone/email
- service card runtime button

What confirms success:

- runtime success banner
- timeline logs:
  - `runtime_attempt_started`
  - service-specific simulation event if applicable
  - `provider_send_attempted`
  - `provider_send_succeeded`

Stop and fix first if:

- runtime banner reports blocked/failed
- timeline logs `runtime_attempt_blocked`
- timeline logs `provider_send_failed`

### Step 10 - Inspect Go-Live Readiness

Where to click:

- service card
- `Go-Live Readiness`

What to look for:

- `Config Complete = Yes`
- `Successful Test = Yes`
- recommended next action says move live or no action required
- no live blockers

### Step 11 - Move the service to Live

Where to click:

- `Move to Live`

What confirms success:

- status badge changes to `Live`
- timeline logs `service_status_changed`
- order rollup stays aligned

Stop and fix first if:

- Live transition is blocked
- backend says successful test is missing
- timeline logs `service_transition_blocked`

---

## Service-Specific SOPs

## Instant Lead Response

Where to click:

- service card: `Instant Lead Response`
- runtime button: `Send Test Lead`

What to enter:

- shared SMS runtime fields
- `sms_template`

What success looks like:

- `Send Test Lead` succeeds
- timeline shows:
  - `runtime_attempt_started`
  - `provider_send_attempted`
  - `provider_send_succeeded`

Stop and fix first if:

- shared config missing
- Twilio phone missing
- Twilio readiness shows blocked/error
- transition/runtime returns missing `sms_template`

## Missed Call Text-Back

Where to click:

- service card: `Missed Call Text-Back`
- runtime button: `Simulate Missed Call`

What to enter:

- shared SMS runtime fields
- `sms_template`

What success looks like:

- `Simulate Missed Call` succeeds
- timeline shows:
  - `runtime_attempt_started`
  - `provider_send_attempted`
  - `provider_send_succeeded`

Stop and fix first if:

- shared config missing
- Twilio phone missing
- Twilio readiness shows blocked/error
- runtime is not in `Testing` or `Live`

## 14-Day Nurture Sequence

Where to click:

- service card: `14-Day Nurture Sequence`
- builder inside `Remote Configuration`
- runtime button: `Run Nurture Sequence Test`

What to enter:

- shared SMS runtime fields if SMS is enabled
- enable SMS and/or Email
- at least 3 steps
- every step needs:
  - day
  - channel
  - message template

What success looks like:

- runtime succeeds on first configured step
- timeline shows:
  - `runtime_attempt_started`
  - `provider_send_attempted`
  - `provider_send_succeeded`

Stop and fix first if:

- no enabled channel
- fewer than 3 steps
- invalid step template
- first step channel lacks valid recipient/provider support
- email-first test has no test email

## AI Booking Agent

Where to click:

- service card: `AI Booking Agent`
- runtime button: `Run Booking Agent Test`

What to enter:

- booking link
- booking mode
- confirmation template
- reminder template if reminders enabled
- intake fields

What success looks like:

- runtime succeeds
- timeline shows:
  - `runtime_attempt_started`
  - `booking_simulation_created`
  - `provider_send_attempted`
  - `provider_send_succeeded`

What this means today:

- canonical booking placeholder test passed
- it does **not** prove real external calendar sync

Stop and fix first if:

- booking link missing
- booking mode missing
- intake fields missing
- reminder enabled without reminder template

## Old Lead Reactivation

Where to click:

- service card: `Old Lead Reactivation`
- runtime button: `Run Reactivation Test`

What to enter:

- target segment
- message template
- max batch size

What to look for before testing:

- `Target Size`
- `Target Lead Preview`

What success looks like:

- test runs on 1 to 3 canonical `Leads`
- timeline shows:
  - `runtime_attempt_started`
  - `provider_send_attempted` per selected lead
  - `provider_send_succeeded` per selected lead
  - `lead_reactivation_batch_completed`

Stop and fix first if:

- segment missing
- message template missing
- target size is 0

## Review Request Automation

Where to click:

- service card: `Review Request Automation`
- runtime button: `Run Review Request Test`

What to enter:

- review link
- trigger event
- message template
- channel
- optional send delay
- optional internal feedback fallback

What success looks like:

- test succeeds via selected channel
- timeline shows:
  - `runtime_attempt_started`
  - `review_request_trigger_simulated`
  - `provider_send_attempted`
  - `provider_send_succeeded`

What this means today:

- canonical trigger simulation and channel test passed
- it does **not** prove live delayed scheduling or live appointment/order trigger automation

Stop and fix first if:

- review link missing
- trigger event missing
- message template missing
- channel missing

---

## Troubleshooting Guidance

## Blocked Transition

What it means:

- backend refused the status move

Where to look:

- service feedback banner
- timeline entry `service_transition_blocked`
- required actions list

What to do:

1. Read the missing labels in the error
2. Read the service required actions
3. Save missing config
4. Retry transition

Do not force the service forward in a mirror record.

## Blocked Runtime Attempt

What it means:

- backend refused the test run

Where to look:

- runtime feedback banner
- timeline entry `runtime_attempt_blocked`

Common causes:

- service not in `Testing` or `Live`
- missing recipient phone/email
- required config still incomplete
- provider/channel cannot support the test

What to do:

1. Check the runtime target fields at the top of `Remote Configuration`
2. Confirm the service is in `Testing`
3. Confirm required actions are cleared
4. Re-run the test only after the blocker is gone

## Failed Provider Send

What it means:

- runtime started but outbound send failed

Where to look:

- timeline entry `provider_send_failed`
- event error message
- provider readiness cards

What to do:

1. Read the exact failure on the event
2. Confirm provider readiness state
3. Confirm the destination phone/email is usable
4. Re-run only after the provider issue is fixed

## Ambiguous Linking / Manual Repair

What it means:

- canonical linking was not safely resolvable
- system failed closed instead of guessing

Where to look:

- `pipeline_error` on the order
- order-level blocker:
  - `Resolve pipeline linking error`
  - `Verify linked records`

What to do:

1. Stop configuration work
2. Do not create freeform mirror records
3. Use the canonical admin attach/manual repair flow tied to the paid order
4. Re-open the order after linking is corrected

## When To Stop Immediately

Stop and repair before proceeding if any of these are true:

- order is not paid
- order has `pipeline_error`
- linked records are missing and unresolved
- a transition is blocked by config or missing successful test
- a runtime attempt is blocked
- provider send failed and the failure reason is unresolved

---

## Remaining Real-World Validation Steps Before Production Client Use

1. Restore Twilio business/EIN/account state and verify live SMS delivery on production numbers.
2. Verify real missed-call webhook routing on a restored production Twilio number.
3. Run full live operator setup on at least one internal or pilot client for:
   - Instant Lead Response
   - Missed Call Text-Back
4. Verify live SMS-channel behavior for:
   - nurture SMS first step
   - review-request SMS
5. Verify real outbound provider behavior for any service currently using placeholder or simulated runtime steps.
6. Confirm operators follow `/admin` only and do not use quarantined dashboards or legacy endpoints.
