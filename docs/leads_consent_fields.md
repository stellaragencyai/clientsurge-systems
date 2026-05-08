# Leads Entity — Consent Fields (#225)

## Fields Added
- `consent_given_at` (ISO datetime) — timestamp when user checked the SMS/email consent box
- `consent_ip` (string) — IP address of the user at time of consent (captured from X-Forwarded-For or request headers)

## Already Implemented In
- `submitLeadCapture/entry.ts` — reads `consent_given_at` and `consent_ip` from payload (lines ~45-48)
- `scheduleDemoBooking/entry.ts` — same pattern

## Base44 Entity Schema Update
Add to Leads entity schema in Base44 app editor:
```json
"consent_given_at": { "type": "string", "description": "ISO datetime of SMS/email consent" },
"consent_ip": { "type": "string", "description": "IP address at time of consent" }
```

## TCPA Compliance Note
These fields are mandatory for SMS marketing compliance. Never send marketing SMS to a lead
where `consent_given_at` is null unless they initiated the contact (inbound lead).
