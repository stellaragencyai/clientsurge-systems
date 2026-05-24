# TASK 1: CONFIGURE TWILIO WEBHOOK FOR INBOUND SMS REPLIES

**Status:** ⏳ NOT STARTED  
**Effort:** 15 minutes (manual configuration)  
**Blocker:** YES — Required for Tasks 3, 13, 14  
**Date Started:** [fill in when starting]  
**Date Completed:** [fill in when done]

---

## OVERVIEW

This task configures Twilio to send incoming SMS messages (inbound replies) to your app's webhook endpoint. When a customer texts your Twilio number, Twilio will POST the message to `receiveTwilioInboundSms`, which will:

1. Validate the Twilio signature
2. Find the matching WebsiteLead by phone number
3. Mark the lead as "responded" and stop automation
4. Log the SMS in CommunicationEvent

---

## PREREQUISITES

✓ App published to production domain (e.g., `https://myapp.example.com`)  
✓ Twilio account with active phone number  
✓ TWILIO_AUTH_TOKEN set in app secrets  
✓ TWILIO_PHONE_NUMBER set in app secrets  
✓ `receiveTwilioInboundSms` function deployed and live

---

## STEP-BY-STEP CONFIGURATION

### Step 1: Log in to Twilio Console

1. Go to **https://console.twilio.com**
2. Sign in with your Twilio account credentials
3. Navigate to **Phone Numbers** (left sidebar)

### Step 2: Select Your Active Phone Number

1. Click **Phone Numbers** → **Active Numbers**
2. Find and click your phone number (e.g., `+1-602-587-4608`)

### Step 3: Configure Messaging Webhook

1. Scroll down to the **Messaging** section
2. Look for **"A Message Comes In"** (this is the inbound SMS webhook)
3. Select **Webhook** from the dropdown
4. Paste this URL into the webhook field:

```
https://[YOUR-APP-DOMAIN]/api/receiveTwilioInboundSms
```

**Replace `[YOUR-APP-DOMAIN]` with your published app domain** (e.g., `https://clientsurge-automation.app` or `https://your-custom-domain.com`)

### Step 4: Set HTTP Method

1. Below the URL field, select **HTTP Method: POST**

### Step 5: Save Configuration

1. Click **Save** at the bottom of the form
2. Twilio will display: "Webhook configuration saved"

---

## VISUAL REFERENCE

```
Twilio Console
├── Phone Numbers
│   └── Active Numbers
│       └── [Your Number: +1-602-587-4608]
│           └── Messaging
│               ├── A Message Comes In
│               │   ├── [x] Webhook
│               │   ├── URL: https://your-app.com/api/receiveTwilioInboundSms
│               │   └── Method: HTTP POST ← SELECT THIS
│               ├── Message Status Callback
│               │   └── (leave empty — optional)
│               └── [SAVE BUTTON]
```

---

## VERIFICATION CHECKLIST

- [ ] Twilio console shows webhook URL (no error message)
- [ ] HTTP Method is "POST"
- [ ] URL uses HTTPS (not HTTP)
- [ ] URL does not have trailing slash
- [ ] Status indicator next to webhook shows "Active" or similar

---

## TESTING THE WEBHOOK

### Test 1: Send SMS to Your Twilio Number

1. From your personal phone, send an SMS to your Twilio number
   - Text: "Hello, testing!"
2. Wait 5–10 seconds
3. Check app logs or CommunicationEvent entity:
   - Look for event_type = "sms_received"
   - Check context_type = "website_lead" (if matched) or "inbound_sms_unmatched"

### Test 2: Verify Lead Update (if SMS matched)

If the phone number matched an existing WebsiteLead:
- [ ] WebsiteLead.reply_status = "responded"
- [ ] WebsiteLead.lead_status = "responded"
- [ ] WebsiteLead.automation_enabled = false
- [ ] WebsiteLead.next_follow_up_at = null

### Test 3: Check Communication Log

1. Go to Admin Dashboard → System → **Communication Logs**
2. Filter by: **Unmatched** or **All**
3. Verify your SMS appears with:
   - Channel: SMS
   - Direction: Inbound
   - Status: Received
   - Subject: "[TWILIO SMS] Reply from +1XXXXXXXXXX"
   - Message body: Your SMS text

---

## TROUBLESHOOTING

### Issue: Webhook URL shows "Invalid"

**Cause:** URL format is wrong or domain doesn't exist  
**Solution:**
- Ensure URL is HTTPS (not HTTP)
- Verify domain is published and reachable
- Test domain in browser: `https://[your-domain]/api/receiveTwilioInboundSms` should return 405 Method Not Allowed (expected for GET)

### Issue: SMS Sent But Not Received in App

**Cause:** Webhook not firing or function has error  
**Solution:**
1. Check function logs: Functions → receiveTwilioInboundSms → Logs
2. Look for error messages
3. Verify TWILIO_AUTH_TOKEN is set in secrets (required for signature validation)
4. Re-check webhook URL in Twilio console for typos

### Issue: SMS Received But Lead Not Updated

**Cause:** Phone number doesn't match any active WebsiteLead  
**Solution:**
1. Check CommunicationEvent for status: "unmatched"
2. Create a test WebsiteLead with the same phone number you're texting from
3. Re-send SMS
4. Phone number must be normalized to E.164 format (e.g., +16025551234)

### Issue: Signature Validation Failed

**Cause:** TWILIO_AUTH_TOKEN missing or incorrect  
**Solution:**
1. Check secrets are set: Dashboard → Settings → Environment Variables
2. Copy TWILIO_AUTH_TOKEN from Twilio console (Account → Auth Token, not Account SID)
3. Save and redeploy

---

## IMPORTANT NOTES

- **Domain must be HTTPS** — Twilio requires secure webhooks
- **Webhook must be public** — Twilio cannot access private IPs
- **Phone number E.164 format** — Inbound SMS normalized to +1XXXXXXXXXX
- **Twilio signature validation** — All requests verified; invalid signatures rejected with HTTP 403
- **Idempotency** — Same MessageSid sent twice will be processed only once

---

## COMPLETION SIGN-OFF

Once you've completed all steps and tested successfully:

- [ ] Webhook URL configured in Twilio console
- [ ] HTTP method set to POST
- [ ] Test SMS sent and received in CommunicationEvent
- [ ] Lead matched and automation stopped (if applicable)
- [ ] No errors in function logs

**Task 1 Status:** ✅ COMPLETE

**Next Step:** Proceed to **Task 2: Configure Twilio Webhook for Inbound Calls**