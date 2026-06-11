# Booking Production Readiness

## Overall Status

PARTIAL until deploy verification and PRODUCTION_SAFE_TEST_REQUIRED live proof are complete.

The source booking flow now has stronger required-field validation, canonical CRM booking state, canonical industry CRM tags, UTM/referrer capture, provider-failure warnings, and local desktop/mobile browser proof. Production readiness must not be marked PASS until a safe live test proves the deployed `/book` route and provider behavior.

## Booking Entry Points

- Homepage CTA: opens shared Free Automation Audit booking modal through `DemoBookingProvider` where present.
- `/book`: renders the current inline Free Automation Audit scheduler.
- `/roofing`: opens industry-specific Roofing Automation Audit modal context.
- `/hvac`: opens industry-specific HVAC Automation Audit modal context.
- `/dental`: opens industry-specific Dental Automation Audit modal context.
- `/med-spa`: opens industry-specific Med Spa Automation Audit modal context.
- `/plumbing`: public industry route and Plumbing Automation Audit context are present.
- `/contact`: offers the shared Free Automation Audit modal fallback.
- Mobile sticky CTA: opens shared Free Automation Audit modal.
- Header CTA: opens shared Free Automation Audit modal.
- Footer CTA: links to `/book`.
- Store/pricing CTA: links to `/book` or uses the shared booking provider.

## Required Fields Captured

- name
- email
- phone
- business_name
- website / business_website_url
- industry / business_type
- issue / biggest_issue / message
- scheduled_date
- scheduled_time
- consent_given
- source_page
- crm_tag
- UTM fields where present
- referrer where available

## Validation Rules

- Invalid or missing email is rejected.
- Missing or short phone is rejected.
- Missing business name is rejected.
- Missing website is rejected.
- Missing industry is rejected.
- Missing issue/message is rejected.
- Missing date/time is rejected.
- Past date is rejected by the backend.
- Missing consent is rejected by the frontend and backend.
- Honeypot `website_url` submissions are safely ignored.

## Industry Context Preservation

Expected CRM tags:

- `roofing_lead`
- `hvac_lead`
- `dental_lead`
- `med_spa_lead`
- `plumbing_lead`

The booking payload preserves:

- `source_page`
- `source_history`
- `crm_tag`
- `industry_slug`
- `industry_tags`
- `service_interest`
- UTM fields
- referrer

## CRM / Lead Behavior

`scheduleDemoBooking` creates or updates canonical `Leads`.

Required booking state:

- `status = Booked`
- `crm_stage = Audit Booked`
- `outreach_status = booked`
- `booked_at` set
- `source_history` merged rather than overwritten
- latest `source_page`, `crm_tag`, and industry context set

Duplicate handling checks recent same-business matches by email first, then phone.

## Email Behavior

Confirmation and prep emails use Free Automation Audit language. Missing Resend credentials are treated as optional side-effect failures by the parent booking function and should return warnings instead of failing the booking.

PRODUCTION_SAFE_TEST_REQUIRED: prove actual production confirmation delivery with an approved test recipient.

## SMS Behavior

SMS confirmation uses Free Automation Audit language. Missing Twilio credentials are treated as optional side-effect failures by the parent booking function and should return warnings instead of failing the booking.

PRODUCTION_SAFE_TEST_REQUIRED: prove actual production SMS delivery only with an approved safe test phone number.

## Admin Notification Behavior

Admin notification includes:

- name
- business name
- email
- phone
- website
- industry
- CRM tag
- industry tags
- issue/message
- date
- time
- source page
- UTM fields
- referrer

## Calendar Behavior

Current calendar behavior is a placeholder/internal booking-state update through `createDemoCalendarEvent`; no real external calendar event creation is proven in this repo.

Known limitation: OPTIONAL_CALENDAR with PRODUCTION_SAFE_TEST_REQUIRED for any real provider-backed calendar event. Do not claim self-service scheduling or real calendar sync until an approved test calendar proves it.

## Provider Requirements

- Resend: OPTIONAL_NOTIFICATION
- Twilio: OPTIONAL_NOTIFICATION
- Calendar provider: OPTIONAL_CALENDAR
- Canonical `Leads` write: REQUIRED_FOR_BOOKING
- DemoRequest slot record: REQUIRED_FOR_BOOKING
- Safe warnings for notification failures: SAFE_FALLBACK_EXISTS

## Safe Local Test Instructions

Run:

```bash
npm test
npm run build
npm run lint
npm run typecheck
```

For browser QA, run the Vite dev server and verify `/book`, homepage CTA, all industry CTA routes, contact fallback, mobile CTA, header CTA, footer link, and store/pricing CTA using safe mocks only.

## Safe Production Test Instructions

OWNER_CONFIRMATION_REQUIRED before any production submission.

Use an approved test identity, approved test email, approved test phone, and approved test calendar destination if calendar proof is required. Do not use real customer lead data. Do not send real emails or SMS until test mode or owner approval is confirmed.

## Production Proof Checklist

- `/book` returns 200.
- `/book` renders Free Automation Audit copy.
- `/book` exposes date and time controls.
- No public demo-first copy appears on booking CTAs.
- Safe live booking creates or updates a canonical Lead.
- Safe live booking records `status = Booked`.
- Safe live booking records `crm_stage = Audit Booked`.
- Safe live booking records `outreach_status = booked`.
- Safe live booking records `booked_at`.
- Safe live booking records source page, UTM/referrer, industry slug, industry tags, and CRM tag.
- Missing provider credentials do not crash booking.
- Notification/calendar warnings are visible for operator review.

Use `node scripts/audit/booking-live-route-scan.mjs` for a non-submitting public route scan.

## Known Limitations

- Real production proof is not included without an approved safe live test.
- Real external calendar event creation is not proven.
- Internal function/component names still use legacy `Demo` naming to avoid risky rename churn.
- Provider dashboards were not modified.

## Owner Decisions Still Required

- OWNER_CONFIRMATION_REQUIRED: approved production-safe test identity and contact details.
- OWNER_CONFIRMATION_REQUIRED: whether calendar sync must be built or whether support-reply fallback is acceptable for launch.
- OWNER_CONFIRMATION_REQUIRED: approved test calendar if real calendar proof is required.
