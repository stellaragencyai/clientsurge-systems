# ClientSurge Launch Gates

This document defines the gates that decide whether ClientSurge can be trusted for launch. A gate is not complete because code exists. A gate is complete only when proof exists.

## Gate status rules

- `blocked`: required proof is missing or a production blocker exists.
- `partial`: code/config exists, but proof is incomplete.
- `ready_for_proof`: prerequisites exist and manual/provider proof is the next step.
- `proof_passed`: evidence was verified and recorded.
- `approved`: owner manually approved the gate after proof review.
- `waived`: owner knowingly accepted a risk. A waiver is not proof.

## Core launch gates

| Gate | Required proof | Not acceptable as proof |
|---|---|---|
| Website CTA Verification | Desktop and mobile proof that public CTAs route correctly. | Code comment only. |
| Lead Capture Gate | Real public lead submission, consent capture, CRM link, and response trigger. | Fake/test lead. |
| Stripe Payment Gate | Real non-test paid Order with Stripe identifiers and handoff fields. | Pending Order, queued checkout, test-mode row. |
| Resend Email Gate | Provider evidence plus manual recipient/inbox confirmation. | Internal queued event only. |
| Twilio SMS Gate | Twilio provider message ID and delivery/callback evidence. | Queued SMS only. |
| Twilio Voice Gate | Real inbound call proof and webhook outcome. | Console configuration screenshot only. |
| Booking Flow Gate | Booking link loads and booking/click proof is recorded. | Link stored in settings only. |
| Analytics Gate | Active GA4 config plus page_view and CTA/click proof. | GA4 property exists but no events. |
| Security Gate | Admin/client routes require auth, headers verified, private routes blocked. | Route list only. |
| Client Portal Gate | Real client login proves portal data isolation. | Admin login only. |
| Admin Dashboard Gate | Metrics reconcile to production-trusted records. | Dashboard screenshot without source rows. |
| Install OS Gate | Paid order creates linked install/checklist/onboarding records. | Order paid but no handoff. |
| Dashboard Truth Gate | Failed/stuck/dead-letter production blockers are zero or explicitly resolved. | Hiding failures without classification. |

## Evidence rules

- Every proof row must identify source entity, provider ID when relevant, timestamp, environment, and owner/verifier.
- Test and smoke rows can validate mechanics but cannot close production gates.
- Manual screenshots are supporting evidence, not a substitute for source rows.
- A gate cannot mark `proof_passed` from a code path that did not check provider or production data.

## Manual approval rules

Manual `approved` or `waived` status may override a computed status only if the gate record keeps the evidence summary, blocker, and waiver/approval reason. Do not use manual approval to erase production defects.

## Release stop conditions

Stop the release immediately if any of these are true:

- Live Stripe objects were changed without explicit approval.
- Base44 production was published without a linked PR and release checklist.
- Admin/private routes appear in public navigation, sitemap, or indexable metadata.
- Dashboard counts include fake/test/internal records as production.
- SMS/email proof depends only on queued status.
- A webhook accepts unauthenticated provider traffic where signature or shared-secret validation is required.
