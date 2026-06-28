# SMS Compliance Guardrails

## Problem

The repo contains many direct Twilio send surfaces. Direct sends are dangerous because a single bypass can skip consent, STOP/opt-out handling, quiet hours, frequency limits, and event logging.

## New standard

All outbound automated SMS must route through `sendCompliantSms` unless it is a dedicated provider diagnostic/test function.

## `sendCompliantSms` enforces

- E.164-ish phone normalization for US numbers.
- STOP opt-out footer.
- Recipient opt-out block using prior inbound opt-out events.
- SMS consent check from payload or lead record.
- Quiet-hours block unless explicitly bypassed.
- 3 messages per 24 hours frequency cap per recipient.
- CommunicationEvent logging for queued, sent, failed, and blocked attempts.

## Audit gate

Run:

```bash
node scripts/audit-sms-compliance.mjs
```

The script fails when direct Twilio credentials/API usage appears outside the approved gateway/test files, or when SMS send logic lacks visible STOP/opt-out language.

## Follow-up migration

Migrate these function families away from direct Twilio sends first:

1. instant lead response
2. missed-call follow-up
3. website lead response/follow-up
4. demo confirmation SMS
5. review request SMS
6. drip/nurture campaign SMS
7. bulk lead action SMS
8. retry failed event SMS

Do not add new direct Twilio calls.
