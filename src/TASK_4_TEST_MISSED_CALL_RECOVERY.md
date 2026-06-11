# TASK 4: TEST LIVE MISSED CALL RECOVERY WORKFLOW END-TO-END

**Status:** ⏳ NOT STARTED  
**Effort:** 45 minutes (includes SMS send delays)  
**Blocker:** YES — Validates complete missed call flow  
**Dependency:** Tasks 1–2 must be live  
**Date Started:** [fill in]  
**Date Completed:** [fill in]

---

## OVERVIEW

This task verifies the entire missed call recovery automation from initial call through multi-touch follow-up sequence. You will:

1. Simulate a missed call to your Twilio number
2. Verify instant SMS sent within 2 minutes
3. Monitor scheduled follow-ups: 10min email, 1hr SMS, 24hr email
4. Confirm lead created and marked as "Hot" priority
5. Validate all events logged with correct timing

---

## PREREQUISITES

✓ Tasks 1–2: Both Twilio webhooks (SMS + calls) configured and live  
✓ `processMissedCallFollowUps` function deployed  
✓ TWILIO_PHONE_NUMBER and RESEND_API_KEY set in secrets  
✓ Personal phone to make test call  
✓ Email address to receive follow-up emails  
✓ Patience: this test spans 24 hours (can be monitored in parallel with other work)

---

## STEP-BY-STEP TEST

### Step 1: Make Missed Call to Your Twilio Number

1. From your personal phone, call your Twilio number
2. Let it ring for 3–5 seconds (simulate missed/unanswered call)
3. Hang up **without answering**
4. **Note the exact time:** [__:__:__ AM/PM]

### Step 2: Monitor Function Logs (First 10 Seconds)

1. Immediately go to Dashboard → Code → Functions → `twilioinbound` → **Logs**
2. Look for POST request within 10 seconds:
   - URL: `/api/twilioinbound`
   - Status: 200
   - Payload includes: `CallStatus=no-answer`
   - Timestamp matches your call

**If no log entry:**
- Check Task 2 webhook configuration
- Verify function deployed and live
- Wait 10 seconds and refresh logs

### Step 3: Verify Lead Created Within 30 Seconds

1. Go to **Database → Leads** (or **WebsiteLead** if using that entity)
2. Sort by **created_date** descending
3. Look for new lead with:
   - **phone:** [YOUR PHONE NUMBER in E.164]
   - **status:** "Contacted" (or "Hot" in activation_priority)
   - **activation_priority:** "Hot" ← indicates missed call
   - **created_date:** within 30 seconds of your call
4. **Copy the lead ID:** [______________]

**If lead not created:**
- Check `twilioinbound` logs for database error
- Verify Leads entity exists and has schema
- Check phone number format (should be +1XXXXXXXXXX)

### Step 4: Wait for Instant SMS (2 Minute Window)

1. **Start a timer:** note exact time [__:__:__ AM/PM]
2. Wait 2–3 minutes
3. **Check your phone for SMS** (message from Twilio number)
   - Typical content: "Just wanted to follow up — we can usually get you taken care of pretty quickly. What's going on?"
4. **Note receipt time:** [__:__:__ AM/PM]

**If SMS not received:**
- Check `processMissedCallFollowUps` logs for SMS send error
- Verify TWILIO_PHONE_NUMBER set in secrets
- Wait additional 2 minutes (may be delayed)
- Check Communication Logs for "sms_failed" event

### Step 5: Verify Instant SMS Event in Communication Logs

1. Admin Dashboard → System → **Communication Logs**
2. Filter by: **All**
3. Find the SMS event:
   - **Channel:** SMS
   - **Direction:** Outbound
   - **Event type:** sms_sent
   - **Status:** sent
   - **Subject:** "Missed-call follow-up step 1"
   - **Provider:** Twilio
   - **Timestamp:** within 2 min of your call

### Step 6: Wait for Email (10 Minute Window)

1. **From time of SMS receipt, wait ~8 more minutes** (total ~10 min from missed call)
2. Check your email inbox for:
   - **From:** RESEND_FROM_EMAIL (e.g., support@clientsurgesystems.com)
   - **Subject:** "Most people ask us this"
   - **Body:** Mentions pricing, availability, same-day service + booking link
3. **Note receipt time:** [__:__:__ AM/PM]

**If email not received:**
- Check Resend logs for bounce/failure
- Verify email address correct on lead record
- Check Communication Logs for "email_failed" event

### Step 7: Verify Email Event in Communication Logs

1. Admin Dashboard → Communication Logs
2. Find email event:
   - **Channel:** Email
   - **Direction:** Outbound
   - **Event type:** email_sent
   - **Status:** sent
   - **Subject:** "Missed-call follow-up step 2"
   - **Provider:** Resend
   - **Timestamp:** ~10 min after missed call

### Step 8: Wait for 1-Hour SMS (60 Minute Window)

1. **From initial missed call, wait ~60 minutes** (or note time to check later)
2. Check for second SMS:
   - **Content:** "We've got a few open spots today/tomorrow. Want me to lock one in for you?"
3. **Note receipt time:** [__:__:__ AM/PM]

### Step 9: Verify 1-Hour SMS Event

1. Admin Dashboard → Communication Logs
2. Find SMS event:
   - **Event type:** sms_sent
   - **Subject:** "Missed-call follow-up step 3"
   - **Timestamp:** ~60 min after missed call

### Step 10: Schedule 24-Hour Email Verification

1. **Set a reminder** for 24 hours from original missed call time
2. Time to check: [DATE] at [__:__:__ AM/PM]
3. Expected SMS: "Should I close this out for now, or are you still interested in help with [service]?"

### Step 11: Verify Lead Status Throughout

At each step, check your lead record for updates:

**After call (0 min):**
- [ ] **status:** Contacted
- [ ] **activation_priority:** Hot
- [ ] **last_contacted_at:** timestamp of call

**After SMS (2 min):**
- [ ] **last_contacted_at:** updated to SMS send time
- [ ] **missed_call_step_sent:** 1

**After email (10 min):**
- [ ] **missed_call_step_sent:** 2

**After 1hr SMS (60 min):**
- [ ] **missed_call_step_sent:** 3

**After 24hr email (1440 min):**
- [ ] **missed_call_step_sent:** 4
- [ ] **missed_call_sequence_complete:** true

---

## ACCEPTANCE CRITERIA (All Must Pass)

- [ ] Missed call made from your phone
- [ ] Call logged in Communication Logs (event_type: call_missed)
- [ ] Lead created with correct phone number
- [ ] Lead marked as status: Contacted, priority: Hot
- [ ] SMS sent within 2 min of call
- [ ] SMS event logged with timestamp
- [ ] Email sent within 10 min of call
- [ ] Email event logged with timestamp
- [ ] SMS sent within 60 min of call
- [ ] SMS event logged with timestamp
- [ ] Email sent within 1440 min (24h) of call ← can check next day
- [ ] Email event logged with timestamp
- [ ] Total of 4 events in Communication Logs per lead
- [ ] Lead field missed_call_step_sent progresses: 1 → 2 → 3 → 4
- [ ] No errors in processMissedCallFollowUps logs

---

## TIMELINE SUMMARY

| Time | Event | Check |
|------|-------|-------|
| T+0 sec | Missed call made | Function logs |
| T+30 sec | Lead created | Leads entity |
| T+2 min | Instant SMS sent | Your phone + Communication Logs |
| T+10 min | Follow-up email sent | Your email + Communication Logs |
| T+60 min | Follow-up SMS sent | Your phone + Communication Logs |
| T+1440 min (24h) | Final email sent | Your email + Communication Logs |

---

## TROUBLESHOOTING

### Issue: No Lead Created After Call

**Cause:** `twilioinbound` webhook not firing or has error  
**Solution:**
- Check Task 2 webhook configuration
- Check `twilioinbound` logs for errors
- Make another test call and watch logs in real-time

### Issue: Lead Created But SMS Not Sent

**Cause:** `processMissedCallFollowUps` automation not running  
**Solution:**
- Verify automation is scheduled (check Automations list)
- Check function logs for runtime errors
- Verify TWILIO_PHONE_NUMBER set
- Manually trigger function: Dashboard → Code → Functions → processMissedCallFollowUps → Test

### Issue: SMS Sent But Email Not Sent

**Cause:** RESEND_API_KEY missing or invalid  
**Solution:**
- Check secrets: RESEND_API_KEY should be present
- Check email address on lead record
- Check Resend dashboard for bounce/delivery issues

### Issue: Messages Sent But Timestamps Wrong

**Cause:** Automation running on different schedule than expected  
**Solution:**
- `processMissedCallFollowUps` scheduled every 5 minutes
- Messages may be delayed up to 5 min (normal)
- Check "scheduled_for" vs "sent_at" in CommunicationEvent

---

## DEBUGGING CHECKLIST

Collect for any failures:

1. **Missed call time:** [DATE] [__:__:__ AM/PM]
2. **Lead ID created:** [______________]
3. **Lead phone number:** [______________]
4. **SMS received?** YES / NO → Time: [__:__:__ AM/PM]
5. **Email received?** YES / NO → Time: [__:__:__ AM/PM]
6. **twilioinbound logs:** [paste any errors]
7. **processMissedCallFollowUps logs:** [paste any errors]
8. **Communication Logs entries:** [count total events]

---

## COMPLETION SIGN-OFF

Once all acceptance criteria pass:

- [ ] Missed call detected and logged
- [ ] Lead created with Hot priority
- [ ] All 4 SMS/email sent on schedule
- [ ] Events logged with correct timestamps
- [ ] Lead fields updated correctly
- [ ] No errors in function logs

**Task 4 Status:** ✅ COMPLETE

**Note:** This task can run in parallel with Tasks 5+ since it involves waiting. Start it, then move on to other work.

**Next Step:** Proceed to **Task 5: Validate Resend Email Delivery**
