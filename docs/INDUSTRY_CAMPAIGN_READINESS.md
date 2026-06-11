# Industry Campaign Readiness

## Overall Status

PARTIAL. The five primary industry pages are source-ready for local controlled campaign review after this pass, but production proof is still required before claiming live readiness.

## Readiness Ranking

1. Roofing
2. HVAC
3. Plumbing
4. Dental
5. Med Spa

Ranking basis: local page readiness, CTA clarity, metadata correctness, email/notification readiness, mobile readiness, and amount of remaining production proof required.

## Roofing

- Page status: local campaign-ready source.
- CTA: Free Roofing Automation Audit.
- CRM tag: `roofing_lead`.
- Source page: `/roofing`.
- Confirmation email status: industry-specific source logic exists.
- Admin notification status: industry-specific source/admin context exists.
- Local test status: `tests/roofingLandingAudit.test.js`.
- Production proof status: PRODUCTION_SAFE_TEST_REQUIRED.
- UTM campaign URL example: `/roofing?utm_source=manual_outreach&utm_medium=email&utm_campaign=first_25_roofing&utm_content=audit_offer`.
- Blockers: safe live form/email/admin proof not performed.

## HVAC

- Page status: local campaign-ready source.
- CTA: Free HVAC Automation Audit.
- CRM tag: `hvac_lead`.
- Source page: `/hvac`.
- Confirmation email status: industry-specific source logic exists.
- Admin notification status: industry-specific source/admin context exists.
- Local test status: `tests/hvacLandingAudit.test.js`.
- Production proof status: PRODUCTION_SAFE_TEST_REQUIRED.
- UTM campaign URL example: `/hvac?utm_source=manual_outreach&utm_medium=email&utm_campaign=first_25_hvac&utm_content=audit_offer`.
- Blockers: safe live form/email/admin proof not performed.

## Dental

- Page status: local campaign-ready source.
- CTA: Free Dental Automation Audit.
- CRM tag: `dental_lead`.
- Source page: `/dental`.
- Confirmation email status: industry-specific source logic exists.
- Admin notification status: industry-specific source/admin context exists.
- Local test status: `tests/dentalLandingAudit.test.js`.
- Production proof status: PRODUCTION_SAFE_TEST_REQUIRED.
- UTM campaign URL example: `/dental?utm_source=manual_outreach&utm_medium=email&utm_campaign=first_25_dental&utm_content=audit_offer`.
- Blockers: safe live form/email/admin proof not performed.

## Med Spa

- Page status: local campaign-ready source.
- CTA: Free Med Spa Automation Audit.
- CRM tag: `med_spa_lead`.
- Source page: `/med-spa`.
- Confirmation email status: industry-specific source logic exists.
- Admin notification status: industry-specific source/admin context exists.
- Local test status: `tests/medSpaLandingAudit.test.js`.
- Production proof status: PRODUCTION_SAFE_TEST_REQUIRED.
- UTM campaign URL example: `/med-spa?utm_source=manual_outreach&utm_medium=email&utm_campaign=first_25_med_spa&utm_content=audit_offer`.
- Blockers: safe live form/email/admin proof not performed.

## Plumbing

- Page status: new standalone local campaign-ready source.
- CTA: Free Plumbing Automation Audit.
- CRM tag: `plumbing_lead`.
- Source page: `/plumbing`.
- Confirmation email status: industry-specific source logic exists.
- Admin notification status: industry-specific source/admin context exists.
- Local test status: `tests/plumbingLandingAudit.test.js`.
- Production proof status: PRODUCTION_SAFE_TEST_REQUIRED.
- UTM campaign URL example: `/plumbing?utm_source=manual_outreach&utm_medium=email&utm_campaign=first_25_plumbing&utm_content=audit_offer`.
- Blockers: safe live form/email/admin proof not performed.

## Secondary Industries

- Chiropractic route/source exists and remains secondary.
- Contractors route/source exists and remains secondary.
- Secondary issues do not block the five primary launch industries.

## Metadata Standards

- Route slug is preserved as `source_page`.
- Campaign CRM tags are `roofing_lead`, `hvac_lead`, `dental_lead`, `med_spa_lead`, and `plumbing_lead`.
- Industry tags preserve route slug, landing-page tag, campaign CRM tag, and audit intent tag.
- UTM fields preserved: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`.
- Consent fields preserved: `consent_given`, `consent_source`, `consent_text_version`.

## Email / Notification Standards

- Confirmation email copy must name the requested industry audit.
- Prep email copy must include industry-specific review focus.
- Admin demo notification must include source page, CRM tag, industry tags, source/UTM context, website, and challenge.
- No real provider send is required for local readiness.

## Production Proof Still Required

- PRODUCTION_SAFE_TEST_REQUIRED: safe live form submission for each primary route.
- PRODUCTION_SAFE_TEST_REQUIRED: safe live admin notification proof for each primary route.
- PRODUCTION_SAFE_TEST_REQUIRED: safe live confirmation email proof for each primary route.
- PRODUCTION_SAFE_TEST_REQUIRED: safe live CRM/source metadata proof for each primary route.
- PRODUCTION_SAFE_TEST_REQUIRED: live mobile/browser proof after deploy.

## Owner Decisions Still Required

- OWNER_CONFIRMATION_REQUIRED: approve a safe live test recipient and test submission process before production proof.
- OWNER_CONFIRMATION_REQUIRED: decide whether `*_lead` should remain the canonical `crm_tag` or remain additive alongside route slugs in older flows.
