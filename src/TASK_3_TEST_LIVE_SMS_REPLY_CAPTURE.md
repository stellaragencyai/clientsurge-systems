# TASK 3: TEST LIVE SMS REPLY CAPTURE WITH REAL TWILIO NUMBER

**Status:** ⏳ NOT STARTED  
**Effort:** 30 minutes (includes wait time for lead state)  
**Blocker:** YES — Validates SMS webhook function  
**Dependency:** Task 1 must be live  
**Date Started:** [fill in]  
**Date Completed:** [fill in]

---

## OVERVIEW

This task verifies end-to-end functionality of the SMS reply capture system. You will:

1. Create a test WebsiteLead with your phone number
2. Trigger immediate SMS response to validate endpoint
3. Send SMS reply from your phone to your Twilio number
4. Verify lead is marked as "responded" and automation stops
5. Confirm all events logged in CommunicationEvent

---

## PREREQUISITES

✓ Task 1: SMS webhook configured and live  
✓ Test SMS sent in Task 1 verification (optional but helpful)  
✓ Admin access to dashboard  
✓ Personal phone to send test SMS  
✓ Your personal phone number handy (format: +1XXXXXXXXXX)

---

## STEP-BY-STEP TEST

### Step 1: Create Test WebsiteLead

1. Go to Admin Dashboard
2. Navigate to **Database** → **Entities** → **WebsiteLead**
3. Click **+ Create** (or use API if preferred)
4. Fill in:
   - **full_name:** "Test Lead SMS"
   - **first_name:** "Test"
   - **email:** "test-sms@example.com"
   - **phone_number:** [YOUR PHONE NUMBER in E.164 format, e.g., +16025551234]
   - **service_interest:** "SMS reply test"
   - **message:** "Testing SMS reply automation"
   - **source:** "website_form"
   - **lead_status:** "new"
   - **reply_status:** "none"
   - **booking_status:** "none"
   - **automation_enabled:** true
5. Click **Save**
6. Copy the lead ID (e.g., "lead_abc123") for later reference

### Step 2: Trigger Immediate SMS Response (Optional)

To test that SMS is being sent correctly, call the `sendWebsiteLeadResponse` function:

1. Go to Dashboard → Code → Functions → `sendWebsiteLeadResponse`
2. Click **Test Function**
3. Paste this payload:

```json
{
  "lead_id": "[PASTE_YOUR_LEAD_ID_HERE]"
}
```

4. Click **Execute**
5. Check function response:
   - Should return: `{ "success": true, "sms_sent": true, "email_sent": true }`
6. **Within 30 seconds,** you should receive:
   - SMS message to your phone
   - Email message to your email address

**If SMS/email not received:**
- Check function logs for error messages
- Verify TWILIO_PHONE_NUMBER and RESEND_API_KEY set in secrets
- Verify phone number is in E.164 format

### Step 3: Verify Lead State After SMS Sent

1. Go to **WebsiteLead entity** → find your test lead
2. Verify these fields were updated:
   - [ ] **lead_status:** changed from "new" to "contacted"
   - [ ] **initial_response_sent_at:** set to current timestamp
   - [ ] **follow_up_step:** set to 0
   - [ ] **next_follow_up_at:** set to approximately 10 minutes in future

### Step 4: Send SMS Reply from Your Phone

1. From your personal phone, send an SMS to your Twilio number
2. Message text: "Yes, I'm interested!" (any text is fine)
3. Send the SMS
4. **Wait 5–10 seconds** for webhook to process

### Step 5: Check CommunicationEvent Log

1. Admin Dashboard → System → **Communication Logs**
2. Filter by: **All** or **Received**
3. Look for your incoming SMS:
   - **Channel:** SMS
   - **Direction:** Inbound
   - **Event type:** sms_received
   - **Status:** received
   - **Subject:** "[TWILIO] SMS Reply from +1XXXXXXXXXX"
   - **Message body:** "Yes, I'm interested!" (or your text)
   - **Provider message ID:** (Twilio MessageSid)

### Step 6: Verify Lead Updated to "Responded"

1. Go back to **WebsiteLead entity** → your test lead
2. Verify these fields were updated:
   - [ ] **reply_status:** changed from "none" to "responded"
   - [ ] **lead_status:** changed from "contacted" to "responded"
   - [ ] **automation_enabled:** changed from true to false ← **CRITICAL: automation should STOP**
   - [ ] **next_follow_up_at:** changed to null (no more follow-ups scheduled)

### Step 7: Verify No Follow-Up SMS Sent

1. Wait 15 minutes
2. **Verify you do NOT receive any follow-up SMS/email** (because automation is disabled)
3. If you do receive follow-ups, automation stop failed — see Troubleshooting

### Step 8: Verify CommunicationEvent Shows Automation Stopped

1. Admin Dashboard → Communication Logs
2. Filter by: **All**
3. Look for event with:
   - **Subject:** "Lead automation stopped" or similar
   - **Event type:** workflow_triggered
   - **Metadata:** automation_stopped=true

---

## ACCEPTANCE CRITERIA (All Must Pass)

- [ ] WebsiteLead created with correct phone number
- [ ] SMS + email sent to test lead within 30 sec
- [ ] SMS/email received on your phone/email
- [ ] CommunicationEvent created for outbound SMS
- [ ] Lead updated: lead_status="contacted"
- [ ] Next follow-up scheduled (~10 min out)
- [ ] SMS reply from your phone received by webhook
- [ ] CommunicationEvent created for inbound SMS
- [ ] Lead updated: reply_status="responded"
- [ ] Lead updated: automation_enabled=false
- [ ] Lead updated: next_follow_up_at=null
- [ ] No follow-up SMS/email sent after reply
- [ ] All events timestamped correctly

---

## TROUBLESHOOTING

### Issue: SMS Not Received on My Phone

**Cause 1:** Twilio SMS send failed  
**Solution:**
- Check `sendWebsiteLeadResponse` function logs for Twilio error
- Verify TWILIO_PHONE_NUMBER is a valid number in your Twilio account
- Verify phone_number on lead is in E.164 format (+1XXXXXXXXXX)

**Cause 2:** RESEND_API_KEY missing for email  
**Solution:**
- Check secrets: RESEND_API_KEY should be set
- Email may fail separately from SMS (both are tried independently)

### Issue: SMS Reply Not Captured by Webhook

**Cause 1:** Webhook not configured in Twilio  
**Solution:**
- Go back to Task 1 verification
- Re-check Twilio console → Phone Numbers → Your Number → Messaging webhook

**Cause 2:** Signature validation failed  
**Solution:**
- Verify TWILIO_AUTH_TOKEN set in secrets (not Account SID)
- Check `receiveTwilioInboundSms` logs for "Signature mismatch" error

### Issue: Lead Not Marked as "Responded"

**Cause 1:** Phone number format mismatch  
**Solution:**
- WebsiteLead phone_number must exactly match incoming Twilio phone
- Both should be E.164: +1XXXXXXXXXX
- Check function logs for "No matching lead" error

**Cause 2:** Lead status was already "closed" or "booked"  
**Solution:**
- Closed/booked leads are protected (won't be re-matched)
- Create a new test lead with status="new" or "contacted"

### Issue: Automation Did Not Stop (Still Receiving Follow-Ups)

**Cause:** Lead update failed after SMS capture  
**Solution:**
- Check `receiveTwilioInboundSms` logs for database update error
- Verify WebsiteLead entity allows automation_enabled field
- Check that automation_enabled was correctly set to false

---

## DEBUGGING CHECKLIST

If test fails at any step, collect:

1. **WebsiteLead ID:** [______________]
2. **Your phone number (E.164):** [______________]
3. **Timestamp of SMS sent:** [______________]
4. **Timestamp of SMS reply:** [______________]
5. **Function logs from `sendWebsiteLeadResponse`:** [paste error]
6. **Function logs from `receiveTwilioInboundSms`:** [paste error]
7. **CommunicationEvent entries:** [count total, count received]

---

## COMPLETION SIGN-OFF

Once all acceptance criteria pass:

- [ ] Test lead created with phone number
- [ ] SMS + email received immediately
- [ ] SMS reply captured from webhook
- [ ] Lead marked as "responded"
- [ ] Automation disabled (no follow-ups)
- [ ] All events logged correctly
- [ ] No errors in function logs

**Task 3 Status:** ✅ COMPLETE

**Next Step:** Proceed to **Task 4: Test Live Missed Call Recovery**