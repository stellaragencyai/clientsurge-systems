# TASK 2: CONFIGURE TWILIO WEBHOOK FOR INBOUND CALLS

**Status:** ⏳ NOT STARTED  
**Effort:** 15 minutes (manual configuration)  
**Blocker:** YES — Required for Tasks 4, 15, 18  
**Dependency:** Task 1 must complete first  
**Date Started:** [fill in]  
**Date Completed:** [fill in]

---

## OVERVIEW

This task configures Twilio to send incoming call events (ringing, no-answer, busy, completed, failed) to your app's webhook endpoint. When someone calls your Twilio number, Twilio will POST call status updates to `twilioinbound`, which will:

1. Validate Twilio signature
2. Detect if call was missed (no-answer, failed, busy)
3. Create or match lead by phone number
4. Trigger missed call recovery automation (instant SMS, follow-ups)
5. Log call event in CommunicationEvent

---

## PREREQUISITES

✓ Task 1 (SMS webhook) completed and verified  
✓ App published to production domain  
✓ TWILIO_AUTH_TOKEN set in secrets  
✓ TWILIO_PHONE_NUMBER set in secrets  
✓ `twilioinbound` function deployed and live

---

## STEP-BY-STEP CONFIGURATION

### Step 1: Log in to Twilio Console

1. Go to **https://console.twilio.com**
2. Sign in with your account
3. Navigate to **Phone Numbers** (left sidebar)

### Step 2: Select Your Active Phone Number

1. Click **Phone Numbers** → **Active Numbers**
2. Find and click your Twilio phone number

### Step 3: Configure Voice Webhook

1. Scroll down to the **Voice & Fax** section (or **Voice**)
2. Look for **"A Call Comes In"** (inbound voice webhook)
3. Select **Webhook** from the dropdown
4. Paste this URL:

```
https://[YOUR-APP-DOMAIN]/api/twilioinbound
```

**Replace `[YOUR-APP-DOMAIN]` with your published domain** (same as Task 1)

### Step 4: Set HTTP Method

1. Select **HTTP Method: POST**

### Step 5: Configure Status Callback (Optional but Recommended)

1. Find **"Call Status Callbacks"** section
2. Select **Webhook**
3. Paste same URL:

```
https://[YOUR-APP-DOMAIN]/api/twilioinbound
```

This ensures Twilio sends call completion events (completed, busy, no-answer) to your webhook, not just initial ringing.

### Step 6: Save Configuration

1. Click **Save** at the bottom
2. Verify success message: "Webhook configuration saved"

---

## VISUAL REFERENCE

```
Twilio Console
├── Phone Numbers
│   └── Active Numbers
│       └── [Your Number: +1-602-587-4608]
│           └── Voice & Fax
│               ├── A Call Comes In
│               │   ├── [x] Webhook
│               │   ├── URL: https://your-app.com/api/twilioinbound
│               │   └── Method: HTTP POST ← SELECT
│               ├── Call Status Callbacks
│               │   ├── [x] Webhook
│               │   └── URL: https://your-app.com/api/twilioinbound
│               └── [SAVE BUTTON]
```

---

## VERIFICATION CHECKLIST

- [ ] "A Call Comes In" webhook URL configured (HTTPS)
- [ ] HTTP Method set to POST
- [ ] Call Status Callbacks webhook also configured (recommended)
- [ ] No error messages in Twilio console
- [ ] Status shows "Active" or "Configured"

---

## TESTING THE WEBHOOK

### Test 1: Simulate Missed Call

1. Call your Twilio number from your personal phone
2. Let it ring until voicemail (don't answer)
3. Hang up after 3–5 rings
4. Wait 5–10 seconds

### Test 2: Check Function Logs

1. Dashboard → Code → Functions → `twilioinbound` → Logs
2. Look for POST request with:
   - Status: 200 (or 2xx)
   - Payload includes: `CallStatus=no-answer`
   - Timestamp matches your missed call

### Test 3: Verify Lead Created/Updated

1. Check **Leads** or **WebsiteLead** entity:
   - New lead created with phone = your phone number
   - status = "Contacted" (or similar)
   - activation_priority = "Hot"
   - last_contacted_at = recent timestamp

### Test 4: Check Communication Log

1. Admin Dashboard → System → Communication Logs
2. Filter: **All**
3. Verify new entry:
   - Channel: Call
   - Direction: Inbound
   - Event type: call_missed
   - Subject: "[TWILIO] Missed call from +1XXXXXXXXXX"
   - Status: "no-answer"

### Test 5: Verify Instant SMS Sent (if configured)

1. Check for SMS sent to your phone within 2 minutes:
   - Message: "Just wanted to follow up..." (from `processMissedCallFollowUps`)
2. If SMS sent, verify CommunicationEvent:
   - Event type: sms_sent
   - Status: sent
   - Subject: "Missed-call follow-up step 1"

---

## TROUBLESHOOTING

### Issue: Webhook URL Shows Error

**Cause:** Domain not accessible or wrong format  
**Solution:**
- Verify HTTPS (not HTTP)
- Test URL in browser: `https://[your-domain]/api/twilioinbound` → should return 405 (GET not allowed)
- Ensure domain is published and public

### Issue: Call Made But No Webhook Fired

**Cause:** Webhook not configured or has error  
**Solution:**
1. Re-check Twilio console for URL typos
2. Check function logs for runtime errors
3. Verify TWILIO_AUTH_TOKEN set (required for signature validation)
4. Test with different call scenarios: let ring, answer then hang up, busy signal

### Issue: Webhook Fires But Lead Not Created

**Cause:** Phone number parsing or database error  
**Solution:**
1. Check function logs for error messages
2. Verify Leads entity exists and has proper schema
3. Check if phone number is normalized to E.164 (e.g., +16025551234)

### Issue: Lead Created But No SMS Sent

**Cause:** Twilio SMS credentials missing or RESEND_API_KEY not set  
**Solution:**
1. Verify TWILIO_PHONE_NUMBER set in secrets
2. Verify RESEND_API_KEY set in secrets (for follow-up emails)
3. Check `processMissedCallFollowUps` logs for SMS send errors

---

## IMPORTANT NOTES

- **HTTPS required** — Twilio only sends to secure endpoints
- **Both webhooks needed** — Configure both "A Call Comes In" AND "Call Status Callbacks"
- **Call Status** — Possible values: queued, ringing, in-progress, completed, failed, busy, no-answer, canceled
- **Missed call detection** — Triggered by status: no-answer, failed, busy
- **Answered calls** — Logged as call_answered (no recovery SMS sent)

---

## COMPLETION SIGN-OFF

Once all tests pass:

- [ ] "A Call Comes In" webhook configured in Twilio
- [ ] "Call Status Callbacks" webhook configured in Twilio
- [ ] HTTP method set to POST for both
- [ ] Test call made and received in CommunicationEvent
- [ ] Lead created with correct phone number
- [ ] Instant SMS sent (if applicable)
- [ ] No errors in function logs

**Task 2 Status:** ✅ COMPLETE

**Next Step:** Proceed to **Task 3: Test Live SMS Reply Capture**