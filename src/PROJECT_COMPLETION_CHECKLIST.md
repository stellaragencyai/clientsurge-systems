# CLIENTSURGE WEBSITE LEAD AUTOMATION — PROJECT COMPLETION CHECKLIST

**Project Status:** ~60% Complete | Last Updated: 2026-04-28

---

## PRIORITY 1: WEBHOOK & INTEGRATION SETUP (5 tasks) — CRITICAL PATH

### [ ] Task 1: Configure Twilio Webhook for Inbound SMS Replies
- **Component:** `receiveTwilioInboundSms` function
- **Details:** Set webhook URL in Twilio console → Phone Numbers → [Your Number] → Messaging → "A message comes in"
- **URL:** `https://[your-published-app]/api/receiveTwilioInboundSms` (POST)
- **Acceptance:** Webhook registered in Twilio, status: active
- **Effort:** 15 min (manual configuration only)
- **Blocker:** Yes (required for Task 14)
- **Notes:** Requires published app domain

### [ ] Task 2: Configure Twilio Webhook for Inbound Calls
- **Component:** `twilioinbound` function
- **Details:** Set webhook URL in Twilio console → Phone Numbers → [Your Number] → Voice → "A call comes in"
- **URL:** `https://[your-published-app]/api/twilioinbound` (POST)
- **Acceptance:** Webhook registered, receives ringing/no-answer events
- **Effort:** 15 min
- **Blocker:** Yes (required for Task 15)
- **Notes:** Existing function already built

### [ ] Task 3: Test Live SMS Reply Capture with Real Twilio Number
- **Component:** Full `receiveTwilioInboundSms` + WebsiteLead update flow
- **Details:** Send SMS from personal phone to Twilio number, verify lead marked as "responded"
- **Acceptance Criteria:**
  - ✓ WebsiteLead.reply_status = "responded"
  - ✓ WebsiteLead.automation_enabled = false
  - ✓ WebsiteLead.next_follow_up_at = null
  - ✓ CommunicationEvent created with event_type = "sms_received"
  - ✓ No SMS/email follow-ups sent after
- **Effort:** 30 min
- **Blocker:** Yes (Task 1 must complete first)
- **Notes:** Test with fixture from `testInboundSmsReply`

### [ ] Task 4: Test Live Missed Call Recovery Workflow End-to-End
- **Component:** `twilioinbound` → `processMissedCallFollowUps` → Leads automation
- **Details:** Simulate missed call, verify 2min SMS → 10min email → 1hr SMS → 24hr email
- **Acceptance Criteria:**
  - ✓ Call marked as missed (status: no-answer)
  - ✓ Lead created or matched
  - ✓ SMS sent within 2 min
  - ✓ Email sent within 10 min
  - ✓ Subsequent SMS/emails on schedule
- **Effort:** 45 min
- **Blocker:** Yes (Task 2 must complete first)
- **Notes:** Use `testWebsiteLeadAutomation` fixtures

### [ ] Task 5: Validate Resend Email Delivery + Bounce Handling
- **Component:** `sendWebsiteLeadResponse`, `processWebsiteLeadFollowUps`
- **Details:** Send test emails, check Resend logs for delivery/bounce status
- **Acceptance Criteria:**
  - ✓ Emails delivered (status: success)
  - ✓ Bounce webhook logged (event_type: email_failed)
  - ✓ Invalid emails do not crash system
  - ✓ Hard bounces logged for review
- **Effort:** 30 min
- **Blocker:** No (independent)
- **Notes:** Monitor Resend dashboard for bounces

---

## PRIORITY 2: COMMUNICATION LOGS & TROUBLESHOOTING (4 tasks)

### [ ] Task 6: Test Communication Logs Panel with Failed Webhook Events
- **Component:** CommunicationLogsPanel.jsx
- **Details:** Filter logs by "failed", verify error messages and context display
- **Acceptance Criteria:**
  - ✓ Failed SMS/email events visible with red highlight
  - ✓ Error messages displayed clearly
  - ✓ Filter controls working (all/failed/unmatched/received)
  - ✓ Expandable detail view shows metadata
- **Effort:** 20 min
- **Blocker:** No (Tasks 3–5 provide test data)
- **Notes:** Use CommunicationEvent test data from previous tasks

### [ ] Task 7: Test Manual Lead Reassignment from Unmatched SMS Modal
- **Component:** ReassignModal in CommunicationLogsPanel
- **Details:** Click "Assign to Lead" on unmatched SMS, select lead, verify update
- **Acceptance Criteria:**
  - ✓ Modal opens with SMS details
  - ✓ Lead selector shows active leads (new/contacted only)
  - ✓ Lead updated: reply_status="responded", automation_enabled=false
  - ✓ New CommunicationEvent created with manually_assigned=true flag
- **Effort:** 25 min
- **Blocker:** No (Task 6 must complete first)
- **Notes:** Test with unmatched SMS from Task 3

### [ ] Task 8: Add Filtering for Email_sent/Email_failed Events in Logs
- **Component:** CommunicationLogsPanel.jsx — filter logic
- **Details:** Extend filter dropdown to include "email_sent", "email_failed" categories
- **Acceptance Criteria:**
  - ✓ New filter options appear in dropdown
  - ✓ Filter correctly limits displayed events
  - ✓ Count updates when filter changes
- **Effort:** 15 min
- **Blocker:** No (Task 6 must complete first)
- **Notes:** Simple addition to filter enum

### [ ] Task 9: Add Export/Download Functionality for Communication Logs
- **Component:** CommunicationLogsPanel.jsx — export button + CSV generator
- **Details:** Add "Export as CSV" button, download filtered logs as file
- **Acceptance Criteria:**
  - ✓ Export button visible
  - ✓ CSV contains: date, channel, status, subject, provider_id, error_message
  - ✓ Filtered data only (respects current filter state)
  - ✓ File downloads with timestamp name
- **Effort:** 30 min
- **Blocker:** No (Task 8 should complete first)
- **Notes:** Use browser download API

---

## PRIORITY 3: WEBSITE LEAD AUTOMATION (5 tasks)

### [ ] Task 10: Test Website Leads Dashboard with 50+ Test Leads
- **Component:** WebsiteLeadsDashboard.jsx
- **Details:** Bulk create 50 test WebsiteLeads, load dashboard, verify pagination/filtering
- **Acceptance Criteria:**
  - ✓ Dashboard loads without lag
  - ✓ Leads list paginated (shows 10 per page default)
  - ✓ Status filter buttons work (new/contacted/responded/booked)
  - ✓ Sorting by created_date works
- **Effort:** 20 min
- **Blocker:** No (can run independently)
- **Notes:** Use bulk create or fixture script

### [ ] Task 11: Verify Immediate SMS + Email Response Sends on Form Submission
- **Component:** `sendWebsiteLeadResponse` + `submitLeadCapture` trigger
- **Details:** Submit form via `/captures/leads`, verify SMS + email sent within 60 sec
- **Acceptance Criteria:**
  - ✓ SMS sent to phone_number within 10 sec
  - ✓ Email sent to email within 30 sec
  - ✓ CommunicationEvent logged for both
  - ✓ Lead marked as lead_status="contacted"
- **Effort:** 25 min
- **Blocker:** No (Task 5 should complete first)
- **Notes:** Monitor function logs

### [ ] Task 12: Verify 3-Step Follow-Up Sequence Timing (10min, 1hr, 24hr)
- **Component:** `processWebsiteLeadFollowUps` scheduled automation
- **Details:** Create lead at T=0, monitor follow-up times: 10min (SMS), 1hr (email), 24hr (SMS)
- **Acceptance Criteria:**
  - ✓ Step 1 SMS sent at ~10 min
  - ✓ Step 2 email sent at ~60 min
  - ✓ Step 3 SMS sent at ~1440 min (24hr)
  - ✓ next_follow_up_at updated correctly between steps
  - ✓ All events logged in CommunicationEvent
- **Effort:** 120 min (includes wait time)
- **Blocker:** Yes (real-time test, cannot parallelize)
- **Notes:** Use test lead creation with initial_response_sent_at=now

### [ ] Task 13: Test Automation Stop When Lead Replies by SMS
- **Component:** `receiveTwilioInboundSms` + lead update logic
- **Details:** Create lead, trigger follow-up sequence, then reply via SMS
- **Acceptance Criteria:**
  - ✓ SMS received updates lead to replied status
  - ✓ automation_enabled = false (stops future sends)
  - ✓ No more follow-up emails/SMS sent after reply
  - ✓ CommunicationEvent shows sms_received + automation_stopped=true
- **Effort:** 30 min
- **Blocker:** Yes (Tasks 11–12 must be running)
- **Notes:** Send SMS during 1hr follow-up window

### [ ] Task 14: Test Automation Stop When Lead Books Appointment
- **Component:** WebsiteLead update logic (manual or via booking_status field)
- **Details:** Create lead, manually update booking_status="booked", verify no more follow-ups
- **Acceptance Criteria:**
  - ✓ Lead with booking_status="booked" excluded from follow-up query
  - ✓ Existing follow-ups skip this lead
  - ✓ next_follow_up_at remains null (not cleared again)
- **Effort:** 15 min
- **Blocker:** No (Task 12 should be running, but independent check)
- **Notes:** Test in WebsiteLeadsDashboard

---

## PRIORITY 4: MISSED CALL RECOVERY (4 tasks)

### [ ] Task 15: End-to-End Test: Missed Call → Instant SMS → Follow-Up Sequence
- **Component:** `twilioinbound` + `processMissedCallFollowUps`
- **Details:** Full workflow: missed call → SMS 2min → email 10min → SMS 1hr → email 24hr
- **Acceptance Criteria:**
  - ✓ Missed call logged (event_type: call_missed)
  - ✓ Instant SMS sent within 2 min
  - ✓ All 4 follow-up steps sent on schedule
  - ✓ Lead status updated at each step
  - ✓ All events logged with timestamps
- **Effort:** 90 min (includes waits)
- **Blocker:** Yes (Tasks 2, 4 must complete first)
- **Notes:** Use real missed call or simulator

### [ ] Task 16: Verify Old Lead Reactivation Campaign Logic
- **Component:** `reactivateLeadOutreach` (check if built, else create)
- **Details:** Query leads with status="closed" + last_contacted_at > 30 days ago
- **Acceptance Criteria:**
  - ✓ Old leads identified correctly
  - ✓ Reactivation email sent with "We miss you" messaging
  - ✓ Lead marked as "reactivation_in_progress"
  - ✓ CommunicationEvent logged for each
- **Effort:** 45 min
- **Blocker:** No (independent, but requires data from Task 15)
- **Notes:** May need to build function if not existing

### [ ] Task 17: Test Closed/Booked Lead Protection (No Reactivation)
- **Component:** Lead matching logic in automation functions
- **Details:** Verify closed/booked leads never matched to new calls/SMS
- **Acceptance Criteria:**
  - ✓ Closed leads excluded from missed call match query
  - ✓ Booked leads excluded from SMS reply match query
  - ✓ Inbound events logged as "unmatched" when lead closed
- **Effort:** 20 min
- **Blocker:** No (Tasks 2, 3 should complete first)
- **Notes:** Query validation test only

### [ ] Task 18: Verify Duplicate Call Handling (Idempotency)
- **Component:** `twilioinbound` + CallSid idempotency check
- **Details:** Send same missed call twice (same CallSid), verify only processed once
- **Acceptance Criteria:**
  - ✓ First call → SMS sent, lead updated
  - ✓ Second call (same CallSid) → skipped (returns ok_duplicate)
  - ✓ Only one SMS sent total
  - ✓ One CommunicationEvent per call
- **Effort:** 20 min
- **Blocker:** No (Task 4 must complete first)
- **Notes:** Manual CallSid reuse test or Twilio simulator

---

## PRIORITY 5: ADMIN DASHBOARD ENHANCEMENTS (3 tasks)

### [ ] Task 19: Add Unread Webhook Error Badge to Communication Logs Nav
- **Component:** AdminDashboard.jsx nav + CommunicationLogsPanel badge logic
- **Details:** Count failed/unmatched events in past 24hr, show badge on nav item
- **Acceptance Criteria:**
  - ✓ Badge shows count of failed + unmatched events
  - ✓ Updates every 30 sec
  - ✓ Badge visible on "Communication Logs" nav item
  - ✓ Clicking nav item goes to logs panel
- **Effort:** 20 min
- **Blocker:** No (Task 8 should complete first)
- **Notes:** Similar to inbox unread badge logic

### [ ] Task 20: Build Automation Health Check Dashboard
- **Component:** New AdminAutomationHealthPanel.jsx
- **Details:** Show success/fail rates for each automation type (SMS, email, calls, etc.)
- **Acceptance Criteria:**
  - ✓ Last 24hr success % per channel (SMS/email/call)
  - ✓ Failed count breakdown by error type
  - ✓ Slow send detection (>30 sec delay flagged)
  - ✓ Retry attempt count visible
- **Effort:** 60 min
- **Blocker:** No (independent, but uses CommunicationEvent data)
- **Notes:** Aggregate query by event_type + status

### [ ] Task 21: Add Drill-Down Analytics: SMS Delivery Rate, Reply Rate by Lead Source
- **Component:** AdminAnalyticsDashboard.jsx — new cards
- **Details:** Show: SMS delivery %, reply %, conversion % by source (website_form, contact_page, etc.)
- **Acceptance Criteria:**
  - ✓ SMS sent vs delivered % calculated
  - ✓ Reply rate = (sms_received / sms_sent) %
  - ✓ Conversion rate = (booked / sms_sent) %
  - ✓ Breakdowns by source visible in tables/charts
- **Effort:** 90 min
- **Blocker:** No (requires 7+ days of data to be meaningful)
- **Notes:** May need to build if not existing

---

## PRIORITY 6: CLIENT PORTAL & USER EXPERIENCE (4 tasks)

### [ ] Task 22: Build Lead Dashboard Widget Showing Reply Status Breakdown
- **Component:** New LeadStatusBreakdownWidget.jsx (client portal)
- **Details:** Show counts: replied vs no-reply, booked vs still-open
- **Acceptance Criteria:**
  - ✓ Widget shows: responded (count), replied (count), booked (count)
  - ✓ Pie/bar chart visual
  - ✓ Drill-down to see lead list per status
- **Effort:** 40 min
- **Blocker:** No (independent)
- **Notes:** Client-facing widget

### [ ] Task 23: Build Live Notification When Inbound SMS/Call Received
- **Component:** New ClientPortalNotificationBell.jsx + real-time subscription
- **Details:** Client sees toast/badge when WebsiteLead gets SMS reply or missed call
- **Acceptance Criteria:**
  - ✓ Toast notification appears immediately on inbound event
  - ✓ Notification shows: "SMS from [lead name]" or "Missed call from [lead name]"
  - ✓ Click notification → navigate to lead detail
  - ✓ Sound/badge option if desired
- **Effort:** 45 min
- **Blocker:** No (requires real-time subscription)
- **Notes:** Use base44 subscription API on WebsiteLead

### [ ] Task 24: Add "Pause Automation" Toggle Per Lead in Client Portal
- **Component:** LeadDetailView.jsx — automation_enabled toggle
- **Details:** Client can pause/resume automation for a specific lead
- **Acceptance Criteria:**
  - ✓ Toggle visible in lead detail
  - ✓ Toggle updates automation_enabled field
  - ✓ Paused leads skip all follow-ups until re-enabled
  - ✓ Event logged: "automation_paused_by_user"
- **Effort:** 20 min
- **Blocker:** No (independent)
- **Notes:** Simple checkbox + update call

### [ ] Task 25: Build Custom Message Templates UI for Clients
- **Component:** New ClientMessageTemplatesPanel.jsx
- **Details:** Client can customize SMS/email templates for immediate response + follow-ups
- **Acceptance Criteria:**
  - ✓ Template editor for 5 messages: immediate SMS, immediate email, 10min SMS, etc.
  - ✓ Variable insertion: {first_name}, {service_interest}, {booking_link}
  - ✓ Preview of rendered message
  - ✓ Save templates to AdminSettings or new ClientTemplate entity
- **Effort:** 90 min
- **Blocker:** No (independent, but requires AdminSettings schema update)
- **Notes:** Rich text editor + variable validator

---

## PRIORITY 7: BACKEND FUNCTION RELIABILITY (3 tasks)

### [ ] Task 26: Add Retry Logic to Failed SMS/Email Sends (Exponential Backoff)
- **Component:** `sendWebsiteLeadResponse`, `processWebsiteLeadFollowUps` functions
- **Details:** Catch failed sends, queue for retry: 1 min, 5 min, 30 min later
- **Acceptance Criteria:**
  - ✓ Failed SMS captured (Twilio error)
  - ✓ AutomationJob created with status="queued", scheduled_for=now+1min
  - ✓ Retry processor checks AutomationJob queue every 1 min
  - ✓ Max 3 retries per job, then mark as failed
  - ✓ Log each retry attempt in CommunicationEvent
- **Effort:** 60 min
- **Blocker:** No (independent, but improves reliability)
- **Notes:** Uses AutomationJob entity

### [ ] Task 27: Add Dead-Letter Queue for Failed Webhook Processing
- **Component:** New DeadLetterQueue processing logic + WebhookFailed entity
- **Details:** Log all webhook processing failures (validation, parsing, matching) to separate queue for manual review
- **Acceptance Criteria:**
  - ✓ Failed webhooks logged to DeadLetterQueue entity
  - ✓ Admin dashboard shows dead-letter count
  - ✓ Webhook can be "reprocessed" manually after fix
  - ✓ No data loss on processing failure
- **Effort:** 45 min
- **Blocker:** No (independent)
- **Notes:** Create new entity + admin UI

### [ ] Task 28: Build Health Check Endpoint for All Automation Functions
- **Component:** New `/api/health` function
- **Details:** Endpoint returns status of all automations: last_run_at, success_count, failure_count, avg_duration
- **Acceptance Criteria:**
  - ✓ Endpoint responds in <2 sec
  - ✓ Shows status: "healthy" (>95% success), "degraded" (80–95%), "critical" (<80%)
  - ✓ Lists: twilioinbound, receiveTwilioInboundSms, sendWebsiteLeadResponse, processMissedCallFollowUps, processWebsiteLeadFollowUps
  - ✓ Last 100 events analyzed per function
- **Effort:** 40 min
- **Blocker:** No (independent)
- **Notes:** Can be called manually or by external monitoring

---

## PRIORITY 8: TESTING & QA (2 tasks)

### [ ] Task 29: Load Test: Simulate 1000 SMS Replies in 1 Minute
- **Component:** New load test script (local or via backend function)
- **Details:** Fire 1000 POST requests to `receiveTwilioInboundSms` with varied payloads
- **Acceptance Criteria:**
  - ✓ All requests return HTTP 200
  - ✓ 0 timeouts
  - ✓ Database handles concurrent updates (no locks/deadlocks)
  - ✓ Response time: avg <500ms, p95 <2s
  - ✓ All leads updated correctly post-test
- **Effort:** 90 min
- **Blocker:** No (independent, but requires production-like environment)
- **Notes:** Use Apache JMeter or custom Node script

### [ ] Task 30: Security Audit: Validate All Webhook Signatures + Auth Guards
- **Component:** `twilioinbound`, `receiveTwilioInboundSms` signature validation
- **Details:** Verify X-Twilio-Signature check works, test with invalid signatures
- **Acceptance Criteria:**
  - ✓ Invalid signatures rejected (HTTP 403)
  - ✓ Valid signatures accepted
  - ✓ No auth bypass possible
  - ✓ All admin functions require auth (admin role)
  - ✓ Log security violations
- **Effort:** 30 min
- **Blocker:** No (independent)
- **Notes:** Penetration testing checklist

---

## PRIORITY 9: MONITORING & OBSERVABILITY (2 tasks)

### [ ] Task 31: Set Up Automated Alerts for Webhook Failures
- **Component:** Alert logic + notification (Slack/email)
- **Details:** If webhook failure rate > 5% in 10 min window, send alert
- **Acceptance Criteria:**
  - ✓ Alert triggered when: failed_count / (failed_count + success_count) > 5%
  - ✓ Alert sent to ADMIN_NOTIFICATION_EMAIL + Slack (if configured)
  - ✓ Alert includes: which webhook, failure count, sample error messages
  - ✓ Alert throttled: max 1 per hour per webhook type
- **Effort:** 45 min
- **Blocker:** No (independent)
- **Notes:** Can use CloudWatch or custom query + Cron automation

### [ ] Task 32: Build Metrics Dashboard: SMS Sent/Delivered/Failed Rates by Day
- **Component:** New AdminMetricsDashboard.jsx
- **Details:** 30-day trend chart: SMS sent, delivered, failed counts + rates
- **Acceptance Criteria:**
  - ✓ Line chart showing trend over last 30 days
  - ✓ Hover tooltip shows: count, %, date
  - ✓ Delivery rate = delivered / sent %
  - ✓ Failure rate = failed / sent %
  - ✓ Table view with daily breakdown
- **Effort:** 60 min
- **Blocker:** No (independent, requires recharts)
- **Notes:** Query CommunicationEvent grouped by day

---

## PRIORITY 10: DOCUMENTATION & HANDOFF (1 task)

### [ ] Task 33: Create Comprehensive Admin Runbook + Troubleshooting Guide
- **Component:** New ADMIN_RUNBOOK.md file
- **Details:** Step-by-step guide: setup, configuration, troubleshooting, escalation
- **Acceptance Criteria:**
  - ✓ Webhook setup instructions (Twilio, Resend)
  - ✓ Troubleshooting flowchart: "No SMS sent?" → steps to diagnose
  - ✓ Common errors + solutions: "Twilio auth error", "Email bounce", etc.
  - ✓ Manual lead reassignment instructions
  - ✓ Performance tuning tips
  - ✓ Backup/restore procedures
- **Effort:** 120 min
- **Blocker:** No (do last, after all features working)
- **Notes:** Markdown format, include screenshots

---

## COMPLETION STATUS TRACKER

| Priority | Group | Tasks | Complete | In Progress | Blocked | Not Started |
|----------|-------|-------|----------|-------------|---------|------------|
| 1 | Webhook Setup | 5 | 0 | 0 | 0 | 5 |
| 2 | Communication Logs | 4 | 0 | 0 | 0 | 4 |
| 3 | Website Lead Automation | 5 | 0 | 0 | 0 | 5 |
| 4 | Missed Call Recovery | 4 | 0 | 0 | 0 | 4 |
| 5 | Admin Enhancements | 3 | 0 | 0 | 0 | 3 |
| 6 | Client Portal UX | 4 | 0 | 0 | 0 | 4 |
| 7 | Backend Reliability | 3 | 0 | 0 | 0 | 3 |
| 8 | Testing & QA | 2 | 0 | 0 | 0 | 2 |
| 9 | Monitoring & Alerts | 2 | 0 | 0 | 0 | 2 |
| 10 | Documentation | 1 | 0 | 0 | 0 | 1 |
| **TOTAL** | | **33** | **0** | **0** | **0** | **33** |

---

## NEXT STEPS

**Start with Priority 1 (Tasks 1–5)** — these are blocking all downstream work.

Once all 5 webhook tasks complete, begin Priority 2 (communication logs) in parallel with Priority 3 (website lead automation testing).

Follow the dependency chains in each task description.