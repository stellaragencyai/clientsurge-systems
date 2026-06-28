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

## Migration status in this PR

Migrated:

1. `sendDemoConfirmationSMS/entry.ts` — now routes through `sendCompliantSms`.
2. `sendReviewRequest/entry.ts` — SMS path now routes through `sendCompliantSms`; email path remains Resend-based.

Not yet migrated:

1. `sendInstantLeadResponseSms/entry.ts`
2. `sendInstantLeadResponseSms/main.ts`
3. `sendWebsiteLeadResponse/entry.ts`
4. `sendWebsiteLeadResponse/main.ts`
5. `processWebsiteLeadFollowUps/entry.ts`
6. `processMissedCallFollowUps/entry.ts`
7. `processDripCampaigns/entry.ts`
8. `bulkLeadAction/entry.ts`
9. `retryFailedEvent/entry.ts`

## Follow-up migration priority

1. instant lead response
2. missed-call follow-up
3. website lead response/follow-up
4. drip/nurture campaign SMS
5. bulk lead action SMS
6. retry failed event SMS

Do not add new direct Twilio calls.
