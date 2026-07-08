# Area 4 — Contact Forms, Lead Capture, and CRM Handoff

## Scope

This area covers public lead capture surfaces, contact forms, Base44 public function submission, WebsiteLead creation, canonical Leads creation, attribution, consent, deduplication, and non-blocking notification behavior.

## 10 flaws fixed in this area

1. The contact page submitted through the Base44 browser SDK instead of a direct public function client, risking anonymous auth-probe failures on public forms.
2. Contact form failures did not expose a support/debug request ID to the user.
3. Contact form validation did not consistently require business name, phone, business type, and explicit contact consent before submission.
4. Contact form did not visibly capture a real business website separately from the hidden honeypot field.
5. Contact form attribution only read URL parameters and missed stored UTM session attribution.
6. `submitContactInquiry/entry.ts` and `submitContactInquiry/main.ts` could drift as two separate implementations.
7. Contact inquiry backend accepted missing Origin headers in the canonical path instead of using the shared public-form origin guard.
8. Contact inquiry backend did not consistently return request IDs on success and failure.
9. Lead capture source normalization collapsed too many sources into generic `website_form` instead of preserving home, pricing, industry, exit-intent, chat, and lead-capture page origins.
10. Lead capture backend did not consistently return request IDs or pass request IDs into downstream automation triggers.

## Files changed

- `src/lib/publicFunctionClient.js`
- `src/pages/Contact.jsx`
- `base44/functions/submitLeadCapture/entry.ts`
- `base44/functions/submitContactInquiry/main.ts`
- `base44/functions/submitContactInquiry/entry.ts`
- `tests/publicFormHoneypot.test.js`
- `tests/publicFormOriginGuard.test.js`
- `tests/area4LeadCaptureContracts.test.js`

## Verification expectation

After merge and Base44 publish:

- `/contact` should submit without using the Base44 browser SDK.
- Contact submissions should return `lead_id`, `website_lead_id`, and `request_id` when successful.
- Failed contact submissions should show a direct support path and request ID when available.
- `submitContactInquiry` should create/update a `WebsiteLead` and attempt canonical `Leads` creation.
- `submitLeadCapture` should preserve source attribution and return request IDs.
- Honeypot field `website_url` must remain separate from real `business_website_url`.
