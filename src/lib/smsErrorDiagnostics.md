# SMS Error Diagnostics & Toll-Free Verification

## Twilio Error 30032: Toll-Free Verification Required

### Problem
When sending SMS from a toll-free number (e.g., `+18778123630`), Twilio returns:
- **Error Code:** 30032
- **Status:** undelivered / failed
- **Meaning:** The toll-free sender number has not been verified or approved for US/Canada SMS traffic.

### Why It Happens
Twilio requires all toll-free numbers to undergo regulatory verification before they can send SMS messages. This is a compliance requirement from the US FCC and Canadian authorities.

### Solution: Verify Your Toll-Free Number

1. **Log into Twilio Console**
   - Go to https://console.twilio.com

2. **Navigate to Phone Numbers**
   - Phone Numbers > Manage > Active Numbers

3. **Select Your Toll-Free Sender**
   - Find the number that sent the failed SMS (e.g., `+18778123630`)
   - Click on it to open details

4. **Check Toll-Free Verification Status**
   - Look for the **Regulatory Information** section
   - Check the **Toll-Free Verification** field
   - Status will be one of:
     - **Pending:** Verification is still being processed (1-2 business days)
     - **Approved:** Number is verified and ready to send SMS
     - **Rejected:** Your submission was rejected; review the reason and resubmit
     - **Not Submitted:** No verification has been submitted yet

5. **Complete the Verification**
   - If not submitted, click **Submit Toll-Free Verification**
   - Fill in your business details accurately
   - Submit for approval
   - Twilio will notify you when complete (usually 1-2 business days)

6. **Retry SMS Once Approved**
   - Only retry production SMS after verification shows **Approved**
   - Do not send production messages from an unverified toll-free number

### Alternative: Use a Different Sender

If you don't want to wait for toll-free verification, you can switch to:

- **A2P 10DLC Number:** A standard US phone number registered for high-volume SMS
  - Requires 1-2 business days for approval
  - Navigate to Phone Numbers > 10DLC in Twilio Console

- **Short Code:** A 5-6 digit code (more expensive, for high-volume)
  - Contact Twilio sales for setup

- **Alphanumeric Sender ID:** Some countries support text-based senders
  - Check your target country's SMS regulations

### Balance & Account Issues

While error 30032 is specifically a compliance/verification issue, also verify:

- **Account Funded:** Twilio account has a valid payment method and is not suspended
- **Not Trial Account:** Trial accounts have limited SMS units
- **Sufficient Credit:** Account has funds to send messages

Check these in **Twilio Console > Billing > Account Balance**

### Diagnostics in Base44

When ClientSurge runs a delivery proof test and receives error 30032:

1. **Diagnostic Title:** "Toll-Free Verification Required"
2. **Category:** sender_compliance_block
3. **Severity:** launch_blocker (blocks production SMS)
4. **Explanation:** Shows that the toll-free number needs verification
5. **Next Action:** Step-by-step guide to verify in Twilio Console

The admin dashboard will clearly indicate this is NOT a phone number issue, balance issue, or network issue—it's a sender compliance problem that must be resolved in Twilio.

### Testing After Verification

Once your toll-free number is verified:

1. Return to Base44 Admin > SMS Diagnostics
2. Click "Run Delivery Proof Test"
3. If successful, you'll see:
   - ✓ SMS Accepted by Twilio
   - Provider Message ID (SID)
   - Status: queued / sent
   - Awaiting delivery confirmation via status callback

4. Monitor the status callback webhook to confirm delivery
5. Once confirmed, production SMS is ready

### Prevention

- Always verify toll-free numbers before adding them to production
- Use A2P 10DLC if faster onboarding is needed (similar compliance process, usually faster)
- Keep your Twilio account funded and in good standing
- Test with the delivery proof before sending production campaigns