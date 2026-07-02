# ClientSurge Production Manual QA Checklist

Use this after GitHub build proof passes and the controlled Base44 publish completes.

## Rules

- Test in a real browser tab, not embedded Base44 preview.
- Use hard refresh before testing.
- Use realistic test data.
- Do not use a live payment method unless intentionally testing live checkout.
- Record timestamp, browser, device, and result.

## Test identity

Use a clearly marked test lead:

```text
Name: QA Test ClientSurge
Business: QA Test Business
Email: qa+clientsurge@example.com
Phone: (602) 555-0199
Industry: HVAC
Problem: QA test submission. Please ignore.
```

## Public route checks

| Route | Expected result |
|---|---|
| `/` | Loads without blank screen or console-breaking errors. |
| `/contact` | Contact form fields are editable. |
| `/book` | Booking/audit form loads. |
| `/start` | Installation intake loads. |
| `/product-signup` | Signup page loads and validates required fields. |
| `/opt-out` | Communication preference page loads without login. |
| `/pricing` | Packages render and CTA links work. |

## Contact form

- Try typing in every field.
- Submit empty form.
- Expected: validation prevents bad submission.
- Submit realistic test lead.
- Expected: success only after backend accepts.

## Free audit / booking forms

- Submit without date/time.
- Expected: blocked.
- Submit with bad email.
- Expected: blocked.
- Submit with bad phone.
- Expected: blocked.
- Submit realistic booking.
- Expected: success only after backend accepts.

## Opt-out flow

- Submit with no email/phone.
- Expected: blocked.
- Submit invalid email.
- Expected: blocked.
- Submit invalid phone.
- Expected: blocked.
- Submit valid email or phone plus preference.
- Expected: preferences updated success message.

## Start intake

- Submit empty.
- Expected: highlighted field errors.
- Fill required fields but omit consent.
- Expected: blocked.
- Fill all required fields.
- Expected: intake received only after backend accepts.

## Product signup / checkout

- Open in full browser tab.
- Submit empty.
- Expected: highlighted required fields.
- Submit invalid email/phone.
- Expected: blocked.
- Submit valid fields.
- Expected: secure checkout session or clear recovery error.

## Pass criteria

A release can move forward only if:

- No blank pages.
- No non-editable public form fields.
- Bad email and bad phone are blocked.
- Consent is required where messaging follow-up is involved.
- Success states do not appear after backend failure.
- Checkout errors provide recovery route.
- `www` redirects to root domain.
