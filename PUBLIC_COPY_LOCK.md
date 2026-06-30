# ClientSurge Public Copy Lock

This file protects the approved ClientSurge Systems public positioning from accidental broad rewrites.

## Approved baseline

- Business name: `ClientSurge Systems`
- Homepage/browser title: `ClientSurge Systems | AI Automation for Local Businesses`
- Core positioning: AI automation systems for local service businesses.
- Core offer language may reference lead capture, missed-call recovery, instant or AI follow-up, appointment booking, review requests, lead reactivation, and AI voice/receptionist where appropriate.
- Tone: direct, professional, operator-focused, concrete, and proof-aware. Do not invent results or overstate proof.

## Approved Contact page wording

Visible Contact page header:

- Eyebrow: `Get In Touch`
- Title: `Contact Us`
- Subtitle: `Send a message and we'll respond within one business day.`
- Success message: `Thanks for reaching out. We'll respond within one business day.`

Contact page metadata:

- Title: `Contact ClientSurge Systems | Questions and Demo Requests`
- Description: `Contact ClientSurge Systems to ask questions, request a walkthrough, or discuss AI voice agents, lead follow-up, booking automation, and local service business systems.`
- OG description: `Reach out to discuss your lead flow, booking process, or automation questions.`

## Banned/suspicious drift phrases

Do not use these as main public positioning or Contact hero copy:

- `AI Growth Systems` as the main brand/category phrase.
- `Questions Before Choosing a System?`
- `Send a Setup Question`
- `Need Help?` as the main Contact hero.
- `Compare Packages → Guided Intake → Checkout` as the Contact page's main copy.

## Change rules

Public copy edits must be page-specific and reviewed against this checklist. Do not combine public copy edits with unrelated production changes. Public copy edits should not alter payments, providers, CRM data, admin functionality, route security, legal compliance, analytics, pricing logic, or modal UI behavior.

## Guard tests

`tests/routeMetadataParity.test.js` includes assertions for the homepage title and Contact copy drift. Update that test only when a deliberate brand decision changes the approved copy in this file.
