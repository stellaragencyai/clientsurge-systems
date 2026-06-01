# Base44 Automation Metadata Repair Packet

Prepared: 2026-05-22

Status: completed 2026-05-22 04:27 America/Phoenix.

Purpose: restore Base44 CLI auditability for the current production app without changing runtime business logic, customer data, secrets, domains, or provider routing.

## Current Blocker

`base44 functions list` fails before it can list deployed functions because three deployed functions have scheduled-simple automation metadata with `repeat_interval: null`.

Base44 CLI `0.0.51` validates `repeat_interval` as optional, but if the field is present it must be a positive integer. The repair should either remove the null field or set the intended positive integer interval.

## Confirmed Affected Targets

Raw authenticated API inspection on 2026-05-22 mapped the CLI error indices to:

| CLI error target | Function | Schedule intent |
|---|---|---|
| `functions[37].automations[0]` | `monthlyClientReport` | monthly, likely interval `1` |
| `functions[99].automations[0]` | `generateWeeklyReport` | weekly, likely interval `1` |
| `functions[176].automations[0..6]` | `generateSocialContent` | weekly entries likely `1`; "Bi-Weekly" entries need UI confirmation before choosing `1` or `2` |

## Approved Repair Scope

The narrow repair scope is:

1. Open the Base44 UI for app `69dc4a79656fdba136d413d3`.
2. Inspect the automation attachments for `monthlyClientReport`, `generateWeeklyReport`, and `generateSocialContent`.
3. For each affected scheduled-simple automation, replace `repeat_interval: null` with the UI-supported default/explicit interval:
   - use `1` for monthly and weekly schedules if the UI exposes an interval field;
   - remove/leave omitted if the UI treats interval `1` as implicit;
   - confirm the two `generateSocialContent` "Bi-Weekly" schedules before setting `1` or `2`.
4. Save only the automation metadata needed to remove the invalid null interval.
5. Re-run `base44 functions list`.

## Explicitly Excluded

- No backend source publish.
- No entity/schema publish.
- No domain/routing changes.
- No Twilio, Resend, Stripe, DNS, credential, secret, or permission changes.
- No customer data edits.
- No schedule cadence changes beyond preserving the intended existing cadence in a valid metadata shape.

## Success Proof

The repair is successful:

- `base44 functions list` completed without the prior validation error and listed 237 remote functions.
- The resulting function list includes `monthlyClientReport`, `generateWeeklyReport`, and `generateSocialContent`.
- Raw authenticated backend-functions read confirmed:
  - `monthlyClientReport`: interval `1` month.
  - `generateWeeklyReport`: intervals `1` week and `1` week.
  - `generateSocialContent`: bi-weekly intervals `2` weeks; weekly intervals `1` week.
- The production deploy path document is updated with the proof timestamp and remaining deploy blocker.

## Follow-On Gate

After CLI auditability is restored, the next separate approval gate is production backend/entity publish path proof. That gate should remain separate from this metadata repair.
