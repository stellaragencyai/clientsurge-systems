# Legal/TCPA Review Draft - 2026-05-21

This is an internal product/compliance review draft, not legal advice and not final attorney sign-off.

## Scope Reviewed

- Public legal routes:
  - `/privacy-policy`
  - `/terms`
  - legacy redirects from `/legal/privacy` and `/legal/terms`
- Public consent surfaces:
  - `LeadCaptureForm`
  - `LeadCaptureModal`
  - `Contact`
  - checkout/cart legal links
- Supporting compliance controls:
  - consent audit fields on `WebsiteLead` and `Leads`
  - SMS opt-out footer helper
  - inbound STOP handling and cadence pause behavior
  - cookie consent on public app shell

## Changes Made

- Tightened Terms SMS language so consent is tied to explicit opt-in, booking/request context, or other opt-in behavior instead of mere phone-number entry.
- Added "Consent is not a condition of purchase" to Privacy and Terms SMS sections.
- Added Privacy consent-record language for consent text version, timestamp, IP address, source page, and UTM/source details.
- Clarified customer responsibility for their own customer consent and opt-out compliance when using ClientSurge automations.

## Current Coverage

- Privacy page covers collected data, usage, SMS/email communications, consent records, AI processing, cookies/tracking, service-provider sharing, retention, and contact method.
- Terms page covers subscription renewal, cancellation/change handling, payment processing, SMS compliance, AI output responsibility, limitation of liability, and Arizona governing law.
- Public lead forms require explicit SMS/email consent and link to Privacy/Terms.
- Backend lead capture persists consent metadata and normalizes consent IP.
- Core customer SMS send paths append opt-out language.
- Inbound STOP replies pause relevant website-lead cadence paths.

## Remaining Human/Legal Review Questions

- Confirm whether arbitration, class-action waiver, warranty disclaimer, and dispute-notice language should be added before launch.
- Confirm whether refund/cancellation language is sufficiently aligned with Stripe checkout copy and any sales-page promises.
- Confirm whether state-specific privacy language is sufficient for launch audience, especially if marketing expands beyond Arizona.
- Confirm whether HELP-message support language should be added only after a working HELP response path exists.
- Confirm whether customer-facing automations need a separate client agreement/DPA when ClientSurge processes the client's customer data.

## Sign-Off Status

- Product/compliance draft review: complete.
- Final legal sign-off: pending Nolan/legal counsel.
- No live publication, deploy, provider change, or external legal representation was performed by this review.
