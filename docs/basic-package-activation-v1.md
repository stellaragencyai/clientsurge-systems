# Basic Package Activation V1

This is the first repeatable activation path for a client buying website redesign plus two automations:

1. Instant lead response and SMS reply capture
2. Missed-call text-back

The goal is not to make every future install fully automatic yet. The goal is to make the first paid-client install repeatable, testable, and safe to hand off.

## Current Proven Foundation

- Twilio CLI access works.
- Resend CLI access works through `C:\Users\nolan\.resend\bin\resend.exe`.
- ElevenLabs is available through API access, but it is not part of this basic package path.
- Base44 production secrets include Twilio and Resend credentials.
- The 877 number is the production SMS/voice automation number.
- The 602 number remains reserved for the ElevenLabs receptionist.
- The 877 SMS webhook receives inbound replies, matches active website leads, marks them responded, disables automation, clears scheduled follow-up, and logs `CommunicationEvent`.
- The 877 voice webhook receives call events, creates or matches a lead, sends a missed-call text-back, logs the call/SMS events, returns TwiML, and skips duplicate `CallSid` processing.
- Twilio delivery-status callbacks are handled through the same deployed 877 webhook route.

## Activation Inputs

Collect these before setup:

- Client business name
- Client contact name and email
- Client business phone or assigned Twilio business phone
- Public website domain
- Lead form destination page or form URL
- Booking link, if available
- Desired reply-to email
- Preferred sender name for email, for example `Client Name <noreply@clientdomain.com>`
- Twilio number assignment decision
- Client-specific message tone and any required compliance wording
- Common customer questions

## Provider Setup

### Twilio

Use the Twilio CLI to verify the assigned number:

- SMS webhook points to the Base44 877 webhook route.
- Voice webhook points to the Base44 877 webhook route.
- Both methods are `POST`.
- The number can send SMS.
- The number can receive inbound SMS.

For the current shared production number:

- Phone number: `+18778123630`
- Purpose: Base44 SMS and missed-call automation

### Resend

Use the Resend CLI or API to verify:

- Sending domain is verified.
- From address is valid.
- API key is active.
- Test email sends successfully.

The current shared production from email is stored in Base44 as `RESEND_FROM_EMAIL`.

### Base44

Required production secrets:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_WEBHOOK_KEY`
- `TWILIO_SMS_STATUS_CALLBACK_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## Activation Steps

1. Create or confirm the client/project record.
2. Convert client intake into the canonical install/order configuration.
3. Confirm the website lead form posts to Base44 lead capture.
4. Confirm `TWILIO_PHONE_NUMBER` is set to the assigned automation number.
5. Confirm the assigned Twilio number routes SMS and voice to Base44.
6. Confirm `RESEND_FROM_EMAIL` matches the approved sender identity.
7. Run an unmatched inbound SMS test.
8. Run a matched WebsiteLead SMS reply test.
9. Run a missed-call webhook test.
10. Verify delivery callback behavior.
11. Verify `CommunicationEvent` entries for each path.
12. Mark the automation checklist active only after all gates pass.

## AI Brain Mapping

The website AI and onboarding assistant should collect the client intake, then produce this exact patch for `Order.install_configuration`:

```json
{
  "shared": {
    "twilio_business_phone": "+18778123630",
    "business_hours": "Mon-Fri 9am-5pm",
    "after_hours_behavior": "send_after_hours_sms",
    "consent_behavior": "include_opt_out_language",
    "opt_out_message": "Reply STOP to opt out."
  },
  "services": {
    "instant_lead_response": {
      "sms_template": "Hi {{lead_name}}, this is Client Name. Thanks for reaching out. We received your request and will help you shortly. You can book here: https://example.com/book. Reply STOP to opt out."
    },
    "missed_call_text_back": {
      "sms_template": "Hi, this is Client Name. Sorry we missed your call. Reply here and we can help, or book a time here: https://example.com/book. Reply STOP to opt out."
    }
  }
}
```

Local builder:

```bash
npm run openclaw:basic-package-config -- path/to/intake.json
```

Growth builder for automations 1-4:

```bash
npm run openclaw:growth-package-config -- path/to/intake.json
```

The builder outputs:

- missing intake fields, if any
- the canonical install configuration
- the go-live gates the operator must verify before marking services live

## Growth Package Extension

For the first four automations, the same intake-to-config flow adds:

- `nurture_sequence_14d`
- `ai_booking_agent`

Additional intake fields:

- Lead sources
- Current booking process
- Common customer questions
- Booking platform or booking link
- Booking intake fields
- Whether booking reminders should be enabled

Generated config shape:

```json
{
  "services": {
    "nurture_sequence_14d": {
      "sms_enabled": true,
      "email_enabled": true,
      "steps": [
        { "day": 1, "channel": "sms", "message_template": "client-specific day 1 SMS" },
        { "day": 3, "channel": "email", "message_template": "client-specific day 3 email" },
        { "day": 7, "channel": "sms", "message_template": "client-specific day 7 SMS" }
      ]
    },
    "ai_booking_agent": {
      "booking_link": "https://example.com/book",
      "booking_mode": "external_link",
      "business_hours": "Mon-Fri 9am-5pm",
      "confirmation_template": "client-specific booking confirmation",
      "reminder_enabled": false,
      "reminder_template": "client-specific reminder if enabled",
      "intake_fields": ["lead_name", "lead_email", "lead_phone", "preferred_time", "notes"]
    }
  }
}
```

Extra go-live gates:

- Nurture sequence templates saved
- Nurture SMS step tested
- Nurture email step tested
- Booking link verified
- Booking intake fields saved
- Booking confirmation simulation logged
- Booking reminder simulation logged if enabled

## Go-Live Gates

Do not call the basic package live unless these pass:

- Inbound SMS returns TwiML/XML and creates a `sms_received` event.
- Matched SMS reply updates the correct WebsiteLead:
  - `reply_status=responded`
  - `lead_status=responded`
  - `automation_enabled=false`
  - `next_follow_up_at=null`
- Missed call returns TwiML/XML.
- Missed call creates or matches a `Leads` record.
- Missed call sends a text-back.
- Duplicate `CallSid` does not send a second text.
- Outbound SMS delivery callback can update `CommunicationEvent.status`.
- Resend can send a live email from the configured sender.
- No raw provider secrets are written into docs, repo files, or chat.

## Known V1 Limits

- Base44 is currently at the 50-function limit, so SMS reply handling, voice/missed-call handling, and SMS status callback handling are folded into `receiveTwilioMissedCallWebhook`.
- `sendWebsiteLeadResponse` has a local patch for SMS status callbacks, but Base44 did not deploy that function because of the 50-function limit. The core 877 webhook path is deployed.
- Full scheduled follow-up proof still needs a timed run of the processors.
- The current first version uses shared production provider credentials. A future version should support per-client sender/domain configuration more cleanly.

## Operator Command

Run the local readiness check:

```bash
npm run openclaw:basic-package-check
```

This check does not send SMS, place calls, or mutate provider state. It verifies CLI availability, Base44 secret names, and Twilio number routing shape.

Run the safe purchase-to-onboarding smoke test:

```bash
npm run openclaw:purchase-onboarding-smoke
```

This creates a clearly labeled QA order, initializes the deployed `installPipeline`, verifies Basic/Growth/Pro package detection, confirms an `OnboardingClient` handoff is created, and checks that Sam/onboarding receives the first missing intake question. It does not charge Stripe, send SMS, place calls, or mark services live.

## Full Smoke Test Sequence

Use this order before trusting a first real client:

1. Run `npm run openclaw:basic-package-check`.
2. Run `npm run openclaw:purchase-onboarding-smoke`.
3. Confirm the QA order is labeled as non-customer test data.
4. Complete the missing intake fields on the QA onboarding record.
5. Generate package config with `npm run openclaw:pro-package-config` or JSON `service_keys`.
6. Apply generated config to the install order.
7. Run provider/runtime tests from the admin install workspace.
8. Move services to Testing, then Live only after all provider gates pass.
9. Only after the QA path passes, run one tiny live Stripe payment proof with explicit approval.

## Handoff Summary Template

Use this after activation:

```text
Client:
Package: Website redesign + Instant Lead Response + Missed Call Text-Back
Twilio number:
Website domain:
Booking link:
Resend sender:

Passed gates:
- SMS webhook:
- Matched reply stop:
- Missed-call text-back:
- Duplicate call protection:
- SMS delivery callback:
- Resend send:

Open risks:
Next scheduled check:
```
