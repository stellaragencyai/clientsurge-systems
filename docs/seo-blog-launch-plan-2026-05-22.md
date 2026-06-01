# ClientSurge SEO And Blog Launch Plan - 2026-05-22

Purpose: turn Phase 4 into an executable launch asset for the 2026-05-29 target without pretending the blog/content engine is already fully published.

## Current State

- `/blog` exists as a launch content index.
- The first 10 planned launch articles now exist locally:
  - `/blog/missed-call-text-back-guide`
  - `/blog/ai-lead-follow-up-automation`
  - `/blog/med-spa-lead-response-automation`
  - `/blog/dental-missed-call-automation`
  - `/blog/contractor-lead-follow-up-system`
  - `/blog/hvac-missed-call-text-back`
  - `/blog/roofing-lead-response-automation`
  - `/blog/ai-appointment-booking-local-business`
  - `/blog/lead-response-speed-to-lead`
  - `/blog/automation-package-comparison`
- Core metadata helpers exist in `src/lib/seo.js`.
- GA4 helper functions exist in `src/utils/analytics.js` and `src/lib/analytics.js`.
- `public/sitemap.xml` and `public/robots.txt` were previously updated for core and industry routes.
- `public/sitemap.xml` now includes the first 10 article URLs.
- `/blog` now includes topic filters for All, Lead Capture, Industries, Booking, and Strategy to keep the mobile index easier to scan.
- Blog is not yet operating on a recurring publishing cadence.
- Search Console submission and indexed-content proof are still manual launch tasks.

## Launch SEO Positioning

Primary offer phrase:

- AI lead response and follow-up systems for local service businesses.

Primary buying-intent clusters:

- missed call text back service
- AI lead follow up automation
- AI appointment booking for local businesses
- med spa lead response automation
- dental missed call automation
- contractor lead follow up system
- HVAC missed call text back
- roofing lead response automation

Content should emphasize speed-to-lead, follow-up reliability, booking flow, and honest implementation requirements. Avoid unsupported revenue guarantees.

## First 10 Launch Articles

1. `missed-call-text-back-guide`
   - Title: Missed Call Text-Back: How Local Businesses Recover Lost Leads
   - Target: missed call text back service
   - CTA: book an automation audit

2. `ai-lead-follow-up-automation`
   - Title: AI Lead Follow-Up Automation: What It Should Actually Do
   - Target: AI lead follow up automation
   - CTA: compare packages

3. `med-spa-lead-response-automation`
   - Title: Med Spa Lead Response Automation: Stop Losing Consult Requests
   - Target: med spa lead response automation
   - CTA: view med spa system

4. `dental-missed-call-automation`
   - Title: Dental Missed Call Automation for New Patient Inquiries
   - Target: dental missed call automation
   - CTA: book a dental automation demo

5. `contractor-lead-follow-up-system`
   - Title: Contractor Lead Follow-Up Systems That Keep Estimates Moving
   - Target: contractor lead follow up system
   - CTA: view contractor workflow

6. `hvac-missed-call-text-back`
   - Title: HVAC Missed Call Text-Back for Emergency and Seasonal Leads
   - Target: HVAC missed call text back
   - CTA: view HVAC automation

7. `roofing-lead-response-automation`
   - Title: Roofing Lead Response Automation for Storm and Estimate Demand
   - Target: roofing lead response automation
   - CTA: view roofing automation

8. `ai-appointment-booking-local-business`
   - Title: How AI Appointment Booking Works for Local Service Businesses
   - Target: AI appointment booking local business
   - CTA: start with Growth package

9. `lead-response-speed-to-lead`
   - Title: Why Speed-To-Lead Still Wins Local Service Customers
   - Target: speed to lead local business
   - CTA: audit current response path

10. `automation-package-comparison`
   - Title: Starter vs Growth vs Elite: Choosing the Right Automation Stack
   - Target: AI automation package pricing
   - CTA: compare packages

## Publishing Cadence

Before launch:

- Day 1: publish or expand missed-call guide.
- Day 2: publish AI lead follow-up guide.
- Day 3: publish med spa guide.
- Day 4: publish dental guide.
- Day 5: publish contractor or HVAC guide.
- Day 6: publish package comparison guide.
- Day 7: final sitemap and Search Console check.

After launch:

- Monday: one evergreen SEO guide.
- Wednesday: one industry-specific article.
- Friday: one proof/process article or package FAQ.

## Internal Linking Rules

Each article should link to:

- `/store` for package comparison.
- `/book` for audit/demo intent.
- one relevant industry page.
- one relevant automation page.
- `/contact` for implementation questions.

Industry pages should link back to the most relevant article once posts are live.

## LLM-Friendly Requirements

- Use direct, specific headings.
- Define what each automation does, when it triggers, and what proof is required.
- Include package fit sections for Starter, Growth, and Elite.
- Avoid vague superlatives and fake case-study claims.
- Add FAQ sections with concise answers that can be quoted by search and answer engines.
- Keep pricing language consistent with the canonical sales catalog.

## Measurement Plan

Track these GA4 events once production analytics is confirmed:

- `cta_click`
- `lead_submitted`
- `demo_booked`
- `purchase`

UTM defaults for launch content:

```text
utm_source=organic
utm_medium=blog
utm_campaign=clientsurge_launch_2026_05
utm_content=<article_slug>
```

## Launch Blockers

- First 10 blog articles are implemented locally and need deployment proof before they can be treated as published.
- Search Console sitemap submission still requires account access and manual confirmation.
- GA4 measurement ID must be present in the deployed environment before analytics proof.

## Next Safe Implementation Batch

1. Confirm deployed GA4/Search Console access before treating analytics proof as complete.
2. Submit updated sitemap after deployment.
3. Expand recurring post briefs after the launch 10 are live.
4. Continue screenshot QA on industry-page related-guide sections after deployment.

## 2026-05-22 Internal Linking Pass

- Added related launch-guide links from industry pages back to the matching article URLs:
  - `/med-spa` -> `/blog/med-spa-lead-response-automation`
  - `/dental` -> `/blog/dental-missed-call-automation`
  - `/contractors` -> `/blog/contractor-lead-follow-up-system`
  - `/hvac` -> `/blog/hvac-missed-call-text-back`
  - `/roofing` -> `/blog/roofing-lead-response-automation`
  - `/chiropractic` -> `/blog/ai-appointment-booking-local-business`
- Added regression coverage in `tests/blogLaunch.test.js` so these links stay wired.

Verification:

- `node --test tests/blogLaunch.test.js tests/homepageCredibilityCopy.test.js tests/sixAutomations.test.js` passed 14/14.
- `npx eslint src/components/landing/IndustryTemplate.jsx tests/blogLaunch.test.js --quiet` passed.
- `npm run build` passed.
- Mobile visual proof captured at `qa/results/frontend-polish/med-spa-mobile-390x844-related-guide-fullpage.png`.
