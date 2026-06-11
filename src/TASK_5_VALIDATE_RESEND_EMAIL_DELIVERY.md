# TASK 5: VALIDATE RESEND EMAIL DELIVERY + BOUNCE HANDLING

**Status:** ⏳ NOT STARTED  
**Effort:** 30 minutes  
**Blocker:** NO — Can run in parallel  
**Dependency:** Tasks 1–4 recommended but not required  
**Date Started:** [fill in]  
**Date Completed:** [fill in]

---

## OVERVIEW

This task validates that Resend (email service provider) is correctly sending emails from the automation system and properly handling bounces/failures. You will:

1. Trigger email sends from various workflows
2. Verify delivery in Resend dashboard
3. Test invalid email address handling
4. Monitor bounce/failure logging
5. Confirm no system crashes on email errors

---

## PREREQUISITES

✓ RESEND_API_KEY set in secrets  
✓ RESEND_FROM_EMAIL set in secrets (e.g., support@clientsurgesystems.com)  
✓ Access to Resend dashboard (https://resend.com/emails)  
✓ Test email addresses (both valid and invalid)  
✓ Tasks 3–4 running (will generate email data)

---

## STEP-BY-STEP TEST

### Part A: Test Valid Email Delivery

#### Step 1: Send Test Email via Function

1. Dashboard → Code → Functions → `sendWebsiteLeadResponse`
2. Click **Test Function**
3. Create a test WebsiteLead with:
   - **email:** [YOUR PERSONAL EMAIL]
   - **phone_number:** +16025551111 (dummy)
   - **full_name:** "Email Test"
   - **service_interest:** "Email delivery test"
4. Call function with lead_id
5. Check function response:
   - Should return: `{ "email_sent": true }`

#### Step 2: Check Email Receipt

1. Check your personal email inbox within 30 seconds
2. Verify email received:
   - **From:** RESEND_FROM_EMAIL
   - **Subject:** "Got your request — here's the next step"
   - **Body:** Contains: lead name, service interest, booking link
   - **Timestamp:** matches function call time

**If email not received:**
- Check spam folder
- Wait additional 60 seconds (occasional delays)
- Check function logs for error
- See Troubleshooting section

#### Step 3: Verify in Resend Dashboard

1. Go to **https://resend.com/emails**
2. Look for email sent in past 5 minutes:
   - **To:** your email address
   - **Subject:** matches expected subject
   - **Status:** "Delivered" (green checkmark)
   - **From:** RESEND_FROM_EMAIL
3. Click on email to view:
   - Full headers and body
   - Delivery timestamp
   - Any errors or warnings

#### Step 4: Check CommunicationEvent

1. Admin Dashboard → System → Communication Logs
2. Filter: **All** or search by your email
3. Find event:
   - **Channel:** Email
   - **Event type:** email_sent
   - **Status:** sent
   - **Provider:** Resend
   - **Provider message ID:** (Resend message ID from dashboard)

---

### Part B: Test Invalid Email Handling

#### Step 5: Send Email to Invalid Address

1. Create test WebsiteLead with:
   - **email:** "not-a-valid-email@" (intentionally malformed)
   - **phone_number:** +16025552222
   - **full_name:** "Invalid Email Test"

2. Call `sendWebsiteLeadResponse` function

3. Check function response:
   - May return error OR skip silently (depends on validation)
   - Check function logs

#### Step 6: Verify Error Logged

1. Check CommunicationEvent:
   - Look for **email_failed** or **email_skipped** event
   - **Error message:** should describe issue (invalid format, etc.)
   - **Status:** "failed" or "skipped"

2. Check Resend dashboard:
   - Email should NOT appear (failed before sending)

#### Step 7: Verify System Didn't Crash

1. Function should return HTTP 200 (success response)
2. App should continue running (no unhandled exceptions)
3. Other leads' emails should still send normally

---

### Part C: Test Bounce Handling

#### Step 8: Set Up Webhook (Advanced - Optional)

Resend can send bounce notifications back to your app. This is optional for this task but recommended for production.

1. Resend Dashboard → API Tokens → Webhooks
2. Add webhook URL:
   ```
   https://[YOUR-APP-DOMAIN]/api/receiveResendWebhook
   ```
3. Select events: "email.bounced", "email.complained"

#### Step 9: Monitor Bounce Events

1. Send emails to known bounce addresses (if available)
   - Hard bounces: user@example.com (invalid domain)
   - Soft bounces: test@domain.com (mailbox full)

2. Resend will send bounce notification to webhook

3. Check CommunicationEvent for:
   - **Event type:** email_bounced
   - **Status:** failed
   - **Error message:** "Hard bounce" or "Soft bounce"

#### Step 10: Verify Bounce Logging

1. Admin Dashboard → Communication Logs
2. Filter: **Failed**
3. Look for email_bounced events
4. Verify metadata contains:
   - **bounce_type:** hard / soft / complaint
   - **recipient:** bounced email address
   - **timestamp:** when bounce received

---

### Part D: Load Test Email Sends

#### Step 11: Bulk Email Send Test

1. Create 10 test WebsiteLeads with different email addresses
   - Mix of valid, invalid, etc.

2. Call `processWebsiteLeadFollowUps` function (or manually trigger for each lead)

3. Monitor Resend dashboard:
   - All valid emails should appear within 60 sec
   - No failures on Resend's side
   - Response times under 500ms

#### Step 12: Check Error Rate

1. Count successful emails sent
2. Count failed emails
3. Calculate: **Error rate = failed / total**
   - Should be < 5% (most errors are invalid email formats, not Resend failures)

4. Check function logs:
   - No repeated Resend API errors
   - No timeout errors

---

## ACCEPTANCE CRITERIA (All Must Pass)

- [ ] Valid email sent and received within 30 sec
- [ ] Email appears in Resend dashboard with "Delivered" status
- [ ] CommunicationEvent created for email_sent
- [ ] Provider message ID logged from Resend
- [ ] Invalid email address causes email_failed event (not crash)
- [ ] Function returns 200 even on invalid email
- [ ] Bounce webhook configured (optional)
- [ ] Bounce events logged in CommunicationEvent
- [ ] No unhandled exceptions in function logs
- [ ] Bulk send completes without timeouts
- [ ] Error rate < 5% across test batch
- [ ] All valid emails eventually delivered

---

## KEY METRICS TO TRACK

| Metric | Target | Actual |
|--------|--------|--------|
| Email delivery time | < 30 sec | [__________] |
| Resend API response time | < 500ms | [__________] |
| Successful delivery rate | > 95% | [__________] |
| Bounce detection time | < 5 min | [__________] |
| Error handling (no crash) | 100% | [__________] |

---

## TROUBLESHOOTING

### Issue: Email Not Received (Valid Address)

**Cause 1:** RESEND_API_KEY invalid  
**Solution:**
- Check Resend dashboard for API key
- Verify key is set in secrets (not token, not ID)
- Try regenerating key in Resend

**Cause 2:** Spam filter blocking email  
**Solution:**
- Check spam/junk folder
- Add Resend domain to email provider's whitelist
- Check email address is correct

**Cause 3:** Function error  
**Solution:**
- Check sendWebsiteLeadResponse logs
- Look for "Resend error" messages
- Check rate limits (Resend free tier: 100 emails/day)

### Issue: Email Sent But Not in Resend Dashboard

**Cause:** Dashboard cache delay  
**Solution:**
- Refresh Resend dashboard page
- Wait 2–3 minutes
- Check by message ID in logs

### Issue: Bounce Webhook Not Firing

**Cause:** Webhook URL misconfigured or domain not public  
**Solution:**
- Verify webhook URL is HTTPS and public
- Check Resend webhook logs for failed attempts
- Test webhook URL in browser (should return 405 for GET)

### Issue: High Error Rate (>10%)

**Cause 1:** Email validation too strict  
**Solution:**
- Review email format validation in functions
- Resend accepts most RFC-valid addresses

**Cause 2:** API rate limits hit  
**Solution:**
- Space out test sends
- Check Resend rate limits for your plan

**Cause 3:** Domain reputation issues  
**Solution:**
- Verify SPF/DKIM/DMARC records configured
- Check Resend domain settings

---

## DEBUGGING CHECKLIST

Collect for any failures:

1. **Test email address:** [______________]
2. **Email sent time:** [__:__:__ AM/PM]
3. **Email received time:** [__:__:__ AM/PM] (or "NOT RECEIVED")
4. **Resend dashboard shows delivery?** YES / NO
5. **CommunicationEvent created?** YES / NO
6. **Provider message ID:** [______________]
7. **Function logs error (if any):** [paste]
8. **Bounce event received?** YES / NO / N/A
9. **Error rate across batch:** [__________]%

---

## COMPLETION SIGN-OFF

Once all acceptance criteria pass:

- [ ] Valid email delivered within 30 sec
- [ ] Email verified in Resend dashboard
- [ ] CommunicationEvent logged correctly
- [ ] Invalid emails handled gracefully
- [ ] No crashes or unhandled errors
- [ ] Bulk sends complete successfully
- [ ] Error rate < 5%

**Task 5 Status:** ✅ COMPLETE

**Congratulations!** Priority 1 (Webhook & Integration Setup) is now complete.

**Next Steps:**
- Update PROJECT_COMPLETION_CHECKLIST.md: mark Tasks 1–5 as COMPLETE
- Proceed to Priority 2: **Task 6: Test Communication Logs Panel**
- Tasks 3–4 continue running in background (24-hour missed call test)
