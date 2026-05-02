# ClientSurge End-to-End Test Plan
**Environment:** Production  
**Date:** 2026-04-29  
**Version:** 1.0  

---

## HOW TO USE THIS PLAN

- Run tests in order (1→20) — later tests depend on earlier ones
- Check each checkbox as you verify
- Log failures with timestamp and error message
- "Entity Proof" = check in Admin Dashboard → relevant entity list
- "Logs to Check" = Dashboard → Code → Functions → [function name] → Logs

---

## PRE-TEST CHECKLIST

Before starting:

- [ ] TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER secrets set
- [ ] RESEND_API_KEY, RESEND_FROM_EMAIL secrets set
- [ ] ADMIN_NOTIFICATION_EMAIL secret set (your real inbox)
- [ ] STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET secrets set
- [ ] AdminSettings record exists with: `lead_notification_email`, `twilio_from_number`, `booking_link_default`
- [ ] Have a real phone number ready to receive SMS
- [ ] Have a real email inbox ready to receive emails
- [ ] processWebsiteLeadFollowUps automation is ACTIVE
- [ ] processMissedCallFollowUps automation is ACTIVE

---

## TEST 1 — Website Lead Form Submission

**Setup:**
- Navigate to `/leads/capture` or use the lead form on the homepage
- Have a unique email not previously submitted

**Action:**
- Fill in: Full Name, Business Name, Email, Phone (real number), Business Type, Problem
- Submit the form

**Expected Result:**
- Form shows success state
- No error toast

**Entity Proof:**
- [ ] `WebsiteLead` entity: new record exists with `lead_status: "new"`, `automation_enabled: true`, `source: "website_form"`
- [ ] `CommunicationEvent` entity: record with `event_type: "lead_created"`, `channel: "internal"`

**Logs to Check:**
- Function: `submitLeadCapture`
- Expected: `[SubmitLead] Admin notified of new lead {id}`

**Pass** ☐ | **Fail** ☐

---

## TEST 2 — Instant SMS Response

**Setup:**
- Requires Test 1 completed
- Phone number on the lead must be real and reachable

**Action:**
- Wait up to 90 seconds after form submission

**Expected Result:**
- SMS received: "Hi {first_name}, thanks for reaching out..."

**Entity Proof:**
- [ ] `WebsiteLead`: `initial_response_sent_at` is populated, `lead_status: "contacted"`
- [ ] `CommunicationEvent`: `event_type: "sms_sent"`, `provider: "twilio"`, `status: "sent"`, `context_type: "WebsiteLead"`

**Logs to Check:**
- Function: `sendInstantLeadResponseSms`
- Expected: `[InstantResponse] SMS send success — SID: SM...`
- Expected: `[InstantResponse] WebsiteLead updated — lead: {id}`

**Pass** ☐ | **Fail** ☐

---

## TEST 3 — Instant Email Response

**Setup:**
- Requires Test 1 completed
- Email address on the lead must be real and reachable

**Action:**
- Wait up to 90 seconds after form submission (same trigger as Test 2)

**Expected Result:**
- Email received with subject: "We received your request"
- Body: "Hi {first_name}, We received your request and will be reaching out shortly..."

**Entity Proof:**
- [ ] `CommunicationEvent`: `event_type: "instant_email_sent"`, `provider: "resend"`, `status: "sent"`

**Logs to Check:**
- Function: `sendInstantLeadResponseSms`
- Expected: `[InstantResponse] Email send success — id: re_...`

**Pass** ☐ | **Fail** ☐

---

## TEST 4 — Nurture Campaign Enrollment

**Setup:**
- Requires Test 1 completed
- Lead must have a valid email
- `startNurtureCampaign` must be wired (called from `submitLeadCapture`)

**Action:**
- Submit the lead form (from Test 1) — enrollment is automatic and async

**Expected Result:**
- Lead is enrolled in a 30-day nurture sequence

**Entity Proof:**
- [ ] `NurtureCampaign` entity: record with `status: "active"`, `lead_email` matching submitted email
- [ ] `CommunicationEvent`: `event_type: "workflow_triggered"` with nurture enrollment metadata

**Logs to Check:**
- Function: `startNurtureCampaign`
- Expected: `[NurtureCampaign] Enrolled {email}`
- Watch for: `[SubmitLead] Nurture enrollment failed:` (failure flag)

**Pass** ☐ | **Fail** ☐

---

## TEST 5 — Follow-Up Automation (10-Minute SMS)

**Setup:**
- Requires Test 2 completed
- Lead must have `initial_response_sent_at` populated and `lead_status: "contacted"`
- processWebsiteLeadFollowUps runs every 5 minutes

**Action:**
- Wait 10–15 minutes after initial response sent

**Expected Result:**
- Second SMS received: "Quick follow-up — I saw you reached out about {service_interest}..."

**Entity Proof:**
- [ ] `WebsiteLead`: `follow_up_step: 1`, `last_message_sent` updated
- [ ] `CommunicationEvent`: `metadata_json` contains `"step_key":"website_follow_sms_10min"`, `status: "sent"`

**Logs to Check:**
- Function: `processWebsiteLeadFollowUps`
- Expected: `[processWebsiteLeadFollowUps] SMS sent to {id}...`

**Pass** ☐ | **Fail** ☐

---

## TEST 6 — SMS Reply Stops Automation

**Setup:**
- Requires Test 5 completed
- Lead must still be in `lead_status: "contacted"`, `reply_status: "none"`
- Twilio inbound SMS webhook must be configured (pointing to `receiveTwilioInboundSms`)

**Action:**
- Reply to the received SMS with any text (e.g., "Yes I'm interested")

**Expected Result:**
- No further follow-up SMS/email sent to this lead
- Lead status updated

**Entity Proof:**
- [ ] `WebsiteLead`: `reply_status: "responded"` OR `lead_status` changed to a non-automated state
- [ ] `CommunicationEvent`: inbound `sms_received` event logged

**Logs to Check:**
- Function: `receiveTwilioInboundSms`
- Expected: `[InboundSMS] Lead {id} reply received — stopping automation`
- Confirm: processWebsiteLeadFollowUps skips lead on next run

**Pass** ☐ | **Fail** ☐

---

## TEST 7 — Missed-Call Text-Back

**Setup:**
- Twilio missed-call webhook must be configured (pointing to `receiveTwilioMissedCallWebhook`)
- Have a phone number that can call your Twilio number and hang up

**Action:**
- Call the Twilio phone number and hang up before it answers (or let it ring and disconnect)

**Expected Result:**
- SMS text-back received within 60 seconds: "Missed Call" recovery message

**Entity Proof:**
- [ ] `Leads` entity: new record created (or existing found) with `status: "Contacted"`, `activation_priority: "Hot"`
- [ ] `CommunicationEvent`: `event_type: "sms_sent"`, `provider: "twilio"`, subject contains "missed"

**Logs to Check:**
- Function: `receiveTwilioMissedCallWebhook`
- Expected: `[MissedCall] SMS sent to {phone}`

**Pass** ☐ | **Fail** ☐

---

## TEST 8 — Missed-Call Follow-Up Sequence

**Setup:**
- Requires Test 7 completed
- Lead must exist with `status: "Contacted"`, `activation_priority: "Hot"`, `missed_call_step_sent: 0`
- processMissedCallFollowUps runs every 5 minutes

**Action:**
- Wait 2–5 minutes after missed-call SMS sent

**Expected Result:**
- Follow-up SMS received (Step 1: 2-minute nudge)
- Then email at ~10 minutes
- Then SMS at ~1 hour
- Then email at ~24 hours

**Entity Proof:**
- [ ] `Leads`: `missed_call_step_sent` increments (1, 2, 3, 4)
- [ ] `CommunicationEvent`: records for each step with correct `step_key`

**Logs to Check:**
- Function: `processMissedCallFollowUps`
- Expected: `[MissedCallFollowUp] Step {n} sent for lead {id}`

**Pass** ☐ | **Fail** ☐

---

## TEST 9 — Store Checkout

**Setup:**
- Navigate to `/store`
- Have Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC

**Action:**
- Select one or more services / a package
- Fill in customer details (use real email for notification test)
- Click "Checkout" → complete Stripe payment form

**Expected Result:**
- Redirected to `/order-success?session_id=cs_...`
- Success confirmation shown

**Entity Proof:**
- [ ] `Order` entity: record exists with `payment_status: "pending"`, `stripe_session_id` populated
- [ ] Order has correct `items`, `total_setup`, `total_monthly`

**Logs to Check:**
- Function: `createCheckoutSession`
- Expected: `[Checkout] Stripe session created: cs_... for order {id}`

**Pass** ☐ | **Fail** ☐

---

## TEST 10 — Stripe Webhook Marks Order Paid

**Setup:**
- Requires Test 9 completed
- Stripe webhook must be registered pointing to `stripeWebhookOrders`

**Action:**
- Complete the Stripe checkout (Test 9 action)
- Stripe fires `checkout.session.completed` event automatically

**Expected Result:**
- Order updated to paid within 30 seconds

**Entity Proof:**
- [ ] `Order`: `payment_status: "paid"`, `order_status: "paid_setup_in_progress"`

**Logs to Check:**
- Function: `stripeWebhookOrders`
- Expected: `Order {id} marked as paid`
- Expected: `Order {id} marked as paid and installation pipeline initialized`
- Watch for: `Webhook signature error:` (indicates misconfigured STRIPE_WEBHOOK_SECRET)

**Pass** ☐ | **Fail** ☐

---

## TEST 11 — installPipeline Creates ClientProject

**Setup:**
- Requires Test 10 completed
- `installPipeline` is called by `stripeWebhookOrders` after payment

**Action:**
- Automatic — triggered by webhook (no manual action needed)
- Wait up to 60 seconds after payment

**Expected Result:**
- ClientProject created for the customer

**Entity Proof:**
- [ ] `ClientProject` entity: record with matching `client_email`, `business_name`
- [ ] Project has `step_payment: "complete"`
- [ ] `Order`: `pipeline_status` updated (e.g., "Ready for Install")

**Logs to Check:**
- Function: `installPipeline`
- Expected: `[Pipeline] Project created for order {id}`
- Expected: `[Pipeline] Order {id} status → paid_setup_in_progress`

**Pass** ☐ | **Fail** ☐

---

## TEST 12 — initializeInstallOS Creates Checklist Steps

**Setup:**
- Requires Test 10 completed
- `initializeInstallOS` is called by `stripeWebhookOrders` after payment

**Action:**
- Automatic — triggered by webhook
- Wait up to 60 seconds after payment

**Expected Result:**
- `ClientInstallationOS` record created
- One `AutomationChecklist` per purchased service

**Entity Proof:**
- [ ] `ClientInstallationOS`: record with `order_id` matching, `workflow_stage: "intake_received"`, `activation_status: "not_ready"`
- [ ] `AutomationChecklist`: one record per service_key in the order (e.g., "instant_lead_response", "ai_booking_agent")
- [ ] `ClientInstallationOS.all_automations_checklists` array is populated with checklist IDs

**Logs to Check:**
- Function: `initializeInstallOS`
- Expected: `[Install OS] Checklist created for service_key: "instant_lead_response"`
- Expected: `[Install OS] Created successfully for order {id} with {n} automation checklists`
- Watch for: `[Install OS] Skipped duplicate service_key:` (dedup working)

**Pass** ☐ | **Fail** ☐

---

## TEST 13 — Client Onboarding Email

**Setup:**
- Requires Test 10 completed
- `sendClientWelcomeEmail` is called by `stripeWebhookOrders` after payment
- Customer email must be real and reachable

**Action:**
- Automatic — triggered by webhook

**Expected Result:**
- Customer receives onboarding/welcome email within 60 seconds of payment

**Entity Proof:**
- [ ] `CommunicationEvent`: `event_type` related to onboarding, `channel: "email"`, `status: "sent"`

**Logs to Check:**
- Function: `sendClientWelcomeEmail`
- Expected: `[WelcomeEmail] Sent to {email} for order {id}`
- Function: `stripeWebhookOrders`
- Expected: `[Webhook] Onboarding email sent successfully for order {id}`
- Watch for: `[Webhook] Onboarding email failed for order {id}:` (failure flag)

**Pass** ☐ | **Fail** ☐

---

## TEST 14 — Admin Order Notification

**Setup:**
- Requires Test 10 completed
- ADMIN_NOTIFICATION_EMAIL secret must be set and reachable

**Action:**
- Automatic — triggered by webhook after payment

**Expected Result:**
- Admin receives email: "✓ New Order — {business_name} ($X setup)"
- Email contains: customer name, email, business, order ID, services, setup total, monthly total

**Entity Proof:**
- No entity proof (direct email send — no entity logged by default)

**Logs to Check:**
- Function: `stripeWebhookOrders`
- Expected: `[Webhook] Admin notified of new order {id}`
- Watch for: `[Webhook] Admin notification failed for order {id}:` (failure flag)

**Pass** ☐ | **Fail** ☐

---

## TEST 15 — Admin Lead Notification

**Setup:**
- Requires Test 1 completed
- ADMIN_NOTIFICATION_EMAIL secret must be set and reachable

**Action:**
- Automatic — triggered by `submitLeadCapture` on new lead

**Expected Result:**
- Admin receives email: "🔔 New Lead — {full_name} ({business_name})"
- Email contains: name, email, phone, business, service interest, problem, lead ID

**Entity Proof:**
- No entity proof (direct email send)

**Logs to Check:**
- Function: `submitLeadCapture`
- Expected: `[SubmitLead] Admin notified of new lead {id}`
- Watch for: admin email error in logs (failure is non-blocking)

**Pass** ☐ | **Fail** ☐

---

## TEST 16 — Admin Review Request Manual Trigger

**Setup:**
- Navigate to Admin Dashboard → "Review Requests" tab
- Have a customer name, real phone, and Google review link ready
- Order must be created and have `install_configuration.services.review_request.review_link` set

**Action:**
- Fill in: Customer Name, Customer Phone, Business Name, Google Review Link
- Set Channel to "Both SMS & Email"
- Click "Send Review Request"

**Expected Result:**
- Success message: "Review request sent successfully"
- "✓ SMS sent (ID: SM...)" and "✓ Email sent (ID: re_...)" shown

**Entity Proof:**
- [ ] `CommunicationEvent`: `event_type: "review_request"`, `status: "sent"` for both SMS and email channels

**Logs to Check:**
- Function: `sendReviewRequest`
- Expected: `[ReviewRequest] SMS sent to {phone}`
- Expected: `[ReviewRequest] Email sent to {email}`
- Watch for: duplicate check log: `[ReviewRequest] Duplicate: review sent within 7 days`

**Pass** ☐ | **Fail** ☐

---

## TEST 17 — Auto Review Request on fully_live Order

**Setup:**
- Requires Test 9/10/11 completed (order exists and is paid)
- Order must have `install_configuration.services.review_request.review_link` set (e.g., "https://g.co/test")
- `triggerAutoReviewRequest` entity automation must be ACTIVE (confirmed in system audit)
- Customer phone/email must be real

**Action:**
- In Admin Dashboard → Client Projects or database:
- Update the Order's `order_status` field to `"fully_live"`

**Expected Result:**
- SMS and/or email review request sent to customer within 60 seconds

**Entity Proof:**
- [ ] `CommunicationEvent`: `event_type: "review_request"`, `status: "sent"`

**Logs to Check:**
- Function: `triggerAutoReviewRequest`
- Expected: `[AutoReviewRequest] Triggered for order {id}`
- Expected: `[AutoReviewRequest] Review request sent — SMS: true, Email: true`
- Watch for: `[AutoReviewRequest] Skipped — no google_review_link configured`
- Watch for: `[AutoReviewRequest] Skipped — not fully_live status` (condition not firing)

**Pass** ☐ | **Fail** ☐

---

## TEST 18 — Old Lead Reactivation Queue

**Setup:**
- A `LeadReactivation` entity record must exist with `status: "pending"` or `status: "reactivating"`
- Lead it references must have `phone` and `email` set
- Function `reactivateLeadOutreach` must be reachable

**Action:**
- Manually invoke `reactivateLeadOutreach` from Dashboard → Code → Functions with payload:
```json
{ "reactivation_id": "{id_of_LeadReactivation_record}" }
```

**Expected Result:**
- SMS and email queued/sent
- Reactivation record updated

**Entity Proof:**
- [ ] `AutomationJob`: 1-2 new records with `job_type: "reactivation_sms"` and `"reactivation_email"`, `status: "queued"`
- [ ] `LeadReactivation`: `attempts` incremented to 1, `reactivation_stage: "first_touch"`, `status: "reactivating"`
- [ ] `CommunicationEvent`: `event_type: "reactivation_attempt"` logged

**Logs to Check:**
- Function: `reactivateLeadOutreach`
- Expected: `[Reactivate] SMS queued for {phone}`
- Expected: `[Reactivate] Email queued for {email}`
- Expected: `[Reactivate] Outreach attempt 1 queued for {lead_id}`

**Pass** ☐ | **Fail** ☐

---

## TEST 19 — processAutomationJobs Sends Queued Jobs

**Setup:**
- Requires Test 18 completed (queued jobs exist)
- `processAutomationJobs` scheduled automation must be ACTIVE
- ⚠️ **Note:** This automation is currently MISSING — must be created first

**Action:**
- Either:
  - (A) Wait for scheduled automation to run (if created), OR
  - (B) Manually invoke `processAutomationJobs` from Dashboard → Code → Functions with payload: `{}`

**Expected Result:**
- Queued reactivation SMS and email are dispatched
- Job records updated to `status: "completed"`

**Entity Proof:**
- [ ] `AutomationJob`: `status: "completed"`, `processed_at` populated
- [ ] `CommunicationEvent`: new `sms_sent` / `email_sent` events for the reactivation

**Logs to Check:**
- Function: `processAutomationJobs`
- Expected: `[AutomationJobs] Processing job {id} — type: reactivation_sms`
- Expected: `[AutomationJobs] Job {id} completed`
- Watch for: Twilio/Resend credential errors

**Pass** ☐ | **Fail** ☐

---

## TEST 20 — Daily Digest Email

**Setup:**
- AdminSettings must have `lead_notification_email` set (or ADMIN_NOTIFICATION_EMAIL secret set)
- At least some leads must exist in the `Leads` entity
- `sendDailyDigest` scheduled automation must be ACTIVE
- ⚠️ **Note:** This automation is currently MISSING — must be created first

**Action:**
- Either:
  - (A) Wait for scheduled automation to run at 8 AM Phoenix time, OR
  - (B) Manually invoke `sendDailyDigest` from Dashboard → Code → Functions with payload: `{}`

**Expected Result:**
- Admin receives email: "Daily Lead Digest — {N} new, {N} hot, {N} overdue"
- Email contains 4 stat blocks: New today, Hot leads, Overdue follow-ups, Replied
- Top 5 hot leads table shown (if any exist)

**Entity Proof:**
- No entity proof (direct email send)

**Logs to Check:**
- Function: `sendDailyDigest`
- Expected: `[sendDailyDigest] Resolved notification email from: {source}`
- Expected: `[sendDailyDigest] Preparing digest — total leads: {N}, new today: {N}, hot: {N}...`
- Expected: `[sendDailyDigest] ✓ Digest sent successfully to {email}`
- Watch for: `[sendDailyDigest] ✗ SendEmail failed:`
- Watch for: `No admin notification email configured`

**Pass** ☐ | **Fail** ☐

---

## MISSING AUTOMATIONS — CREATE BEFORE RUNNING TESTS 19 & 20

### Create: processAutomationJobs (Every 5 minutes)
```
Type: Scheduled
Function: processAutomationJobs
Interval: 5 minutes
Required for: Test 19
```

### Create: sendDailyDigest (Daily 8 AM Phoenix)
```
Type: Scheduled
Function: sendDailyDigest
Time: 08:00 Phoenix (= 15:00 UTC)
Repeat: Daily
Required for: Test 20
```

---

## POST-TEST SUMMARY SHEET

| # | Test | Pass | Fail | Notes |
|---|------|------|------|-------|
| 1 | Lead Form Submission | ☐ | ☐ | |
| 2 | Instant SMS Response | ☐ | ☐ | |
| 3 | Instant Email Response | ☐ | ☐ | |
| 4 | Nurture Enrollment | ☐ | ☐ | |
| 5 | 10-Min Follow-Up SMS | ☐ | ☐ | |
| 6 | SMS Reply Stops Automation | ☐ | ☐ | |
| 7 | Missed-Call Text-Back | ☐ | ☐ | |
| 8 | Missed-Call Follow-Up Sequence | ☐ | ☐ | |
| 9 | Store Checkout | ☐ | ☐ | |
| 10 | Stripe Webhook → Order Paid | ☐ | ☐ | |
| 11 | installPipeline → ClientProject | ☐ | ☐ | |
| 12 | initializeInstallOS → Checklists | ☐ | ☐ | |
| 13 | Client Onboarding Email | ☐ | ☐ | |
| 14 | Admin Order Notification | ☐ | ☐ | |
| 15 | Admin Lead Notification | ☐ | ☐ | |
| 16 | Manual Review Request | ☐ | ☐ | |
| 17 | Auto Review Request → fully_live | ☐ | ☐ | |
| 18 | Lead Reactivation Queue | ☐ | ☐ | |
| 19 | processAutomationJobs | ☐ | ☐ | |
| 20 | Daily Digest Email | ☐ | ☐ | |

**Total Passed:** ___/20  
**Total Failed:** ___/20  
**Tester:** _______________  
**Date Run:** _______________