# ClientSurge Dual-Number Deployment Checklist

## Canonical number roles

| Number | Role | Automated SMS |
|---|---|---|
| +18778123630 | Customer service, support, website leads, onboarding, transactional messaging | Allowed |
| +16025843227 | Nolan sales, Arizona/local outreach, direct sales follow-up | Allowed |
| +16025874608 | Nolan personal verification and manual calls | Prohibited |

## Owner actions required before production activation

### Twilio Console

- [ ] Confirm +18778123630 shows toll-free verification status **Approved**.
- [ ] Confirm +16025843227 is SMS-capable and attached to the correct approved messaging campaign/service.
- [ ] Confirm +16025874608 is not configured as a Messaging Service sender and is not used by any automation.
- [ ] For +18778123630, set **A message comes in** to:
  `https://clientsurgesystems.com/functions/receiveTwilioInboundSms`
- [ ] For +16025843227, set **A message comes in** to the same inbound endpoint.
- [ ] Set the SMS status callback used by outbound messages to:
  `https://clientsurgesystems.com/functions/receiveTwilioSmsStatusCallback`
- [ ] Confirm voice webhooks remain correct for each number's intended voice behavior.
- [ ] Copy each Phone Number SID and Messaging Service SID for entry into the Base44 number registry. Do not commit credentials.

### Base44 Secrets

Set or verify:

- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_CUSTOMER_SERVICE_NUMBER=+18778123630`
- [ ] `TWILIO_SALES_NUMBER=+16025843227`
- [ ] `TWILIO_SMS_STATUS_CALLBACK_URL=https://clientsurgesystems.com/functions/receiveTwilioSmsStatusCallback`

Keep `TWILIO_FROM_NUMBER` temporarily set to `+16025843227` only as a rollback-compatible legacy fallback until all historical call sites have been verified.

Never set an automated sender secret to `+16025874608`.

### Base44 data

Create three `TwilioPhoneNumber` records:

1. Customer service
   - `phone_number`: `+18778123630`
   - `display_name`: `ClientSurge Customer Service`
   - `purpose`: `customer_service`
   - `sms_enabled`: true
   - `automated_sending_allowed`: true
   - `approval_status`: `approved`
   - `is_public`: true
   - `is_default_for_purpose`: true
   - `active`: true

2. Sales
   - `phone_number`: `+16025843227`
   - `display_name`: `Nolan ClientSurge Sales`
   - `purpose`: `sales`
   - `sms_enabled`: true
   - `automated_sending_allowed`: true
   - `approval_status`: `approved`
   - `is_public`: false
   - `is_default_for_purpose`: true
   - `active`: true

3. Personal verification
   - `phone_number`: `+16025874608`
   - `display_name`: `Nolan Personal Verification`
   - `purpose`: `personal_verification`
   - `automated_sending_allowed`: false
   - `is_public`: false
   - `is_default_for_purpose`: false
   - `active`: true

Update the current `AdminSettings` record with purpose-specific fields when the Base44 schema is deployed:

- `twilio_customer_service_number`: `+18778123630`
- `twilio_sales_number`: `+16025843227`
- Keep `twilio_from_number`: `+16025843227` during the compatibility window.

## Pre-merge verification

- [ ] Resolver unit tests pass.
- [ ] Repository build passes.
- [ ] Typecheck passes or produces no new errors attributable to this PR.
- [ ] No executable source file still labels +18778123630 as permanently blocked.
- [ ] No executable source file permits +16025874608 as an automated sender.
- [ ] PR review confirms no Twilio credentials were committed.

## Production tests

Use controlled test leads with explicit consent.

### Customer-service number

- [ ] Send a website-lead response and confirm From = +18778123630.
- [ ] Reply from the test handset and confirm the inbound message is logged with To = +18778123630.
- [ ] Send a second outbound message and confirm conversation affinity preserves +18778123630.
- [ ] Test STOP; confirm future sends are blocked.
- [ ] Test START; confirm Twilio carrier-level opt-out behavior and application state are reconciled.
- [ ] Test HELP and verify the expected response or support workflow.

### Sales number

- [ ] Send a sales-purpose message and confirm From = +16025843227.
- [ ] Reply and confirm the inbound message is logged with To = +16025843227.
- [ ] Send a follow-up and confirm conversation affinity preserves +16025843227.

### Personal number protection

- [ ] Attempt a dry-run sender resolution using +16025874608 as `clientAssignedNumber`.
- [ ] Confirm the resolver blocks it before a Twilio API request is made.

## Rollback

If production verification fails:

1. Do not delete message or event evidence.
2. Revert the deployment commit/PR.
3. Keep `AdminSettings.twilio_from_number=+16025843227`.
4. Keep `TWILIO_FROM_NUMBER=+16025843227`.
5. Re-run a controlled 602 send and inbound reply test.
6. Record the failure in the PR and `CommunicationEvent` evidence.

## Release gate

The feature is production-approved only when both numbers pass outbound, inbound, status callback, STOP, HELP, and conversation-affinity tests. GitHub merge alone does not prove Twilio or Base44 production configuration.
