# Area 8 — Email, SMS, Phone, Opt-Out, and Compliance

## Scope

This area covers outbound SMS, inbound SMS replies, STOP/opt-out handling, email deliverability/opt-out markers, phone/Twilio sender safety, provider evidence logging, and broad communication-function inventory.

## What changed

- Hardened `base44/functions/sendSMS/entry.ts` so the generic SMS send path blocks additional opt-out fields and persists compliance-block evidence.
- Updated `src/utils/smsCompliance.js` so shared SMS compliance utility behavior matches the backend guard model.
- Added `tests/area8CommunicationCompliance.test.js` to lock the new SMS guard behavior.
- Added `scripts/audit-area8-communication-compliance.mjs` to inventory communication-related Base44 functions.
- Added `tests/area8CommunicationInventory.test.js` to lock the Area 8 inventory coverage.

## 10 flaws / risks addressed

1. Generic outbound SMS only checked a narrow set of opt-out fields.
2. Generic outbound SMS did not consistently treat `sms_opt_out_status`, `sms_permission`, `sms_status`, and `outreach_status` as blocking markers.
3. Generic outbound SMS compliance blocks were not logged with a dedicated `sms_blocked` event type.
4. Generic outbound SMS persisted opt-out lookup did not inspect enough possible phone fields from inbound message records.
5. Generic outbound SMS stored the original message body instead of the final outbound body with the opt-out footer.
6. Generic outbound SMS did not include `to_address` on persisted outbound `Messages` records.
7. Shared SMS compliance utility blocked outbound copy containing opt-out words, which could conflict with legitimate STOP footer language.
8. Shared inbound reply handling did not return a broad enough opt-out update payload.
9. There was no full communication-function inventory separating SMS, email, phone, webhook, inbound, and outbound functions.
10. There was no Area 8 regression test preventing removal of communication-compliance markers from critical SMS paths.

## Files changed

- `base44/functions/sendSMS/entry.ts`
- `src/utils/smsCompliance.js`
- `scripts/audit-area8-communication-compliance.mjs`
- `tests/area8CommunicationCompliance.test.js`
- `tests/area8CommunicationInventory.test.js`
- `docs/AREA_8_EMAIL_SMS_PHONE_COMPLIANCE_AUDIT.md`

## How to run the Area 8 audit

```bash
node scripts/audit-area8-communication-compliance.mjs --write
node --test tests/area8CommunicationCompliance.test.js tests/area8CommunicationInventory.test.js
```

The `--write` option creates:

```text
tmp/area8-communication-compliance-audit.json
```

## Important limitation

This pass intentionally avoids broad rewrites to working Twilio/Resend automation handlers. The generic outbound SMS gate was hardened directly, and the new inventory makes remaining communication risks visible for follow-up without risking the currently working automation flow.

## Manual verification after Base44 publish

- Send a safe test SMS through `sendSMS` with a normal lead and confirm the STOP footer is present.
- Mark a test lead with `sms_opt_out_status=opted_out` and confirm `sendSMS` returns `sms_sent:false` with a compliance reason.
- Send a Twilio STOP reply to a matched test lead and confirm automations stop.
- Confirm CommunicationEvent shows `sms_blocked` when a blocked lead is attempted.
- Confirm no live provider secrets appear in communication functions.
