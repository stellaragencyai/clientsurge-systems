# ClientSurge Launch Campaign Kit

Generated for the pre-Stripe-proof launch push. This kit focuses on public website readiness, pricing accuracy, Resend/work-email setup, SEO, launch emails, brochure/PDF assets, and launch deals that do not conflict with the current checkout catalog.

## Launch Readiness Snapshot

Status: Repo-side campaign kit ready; external provider proof still required.

Current frontend and catalog signals:
- Public package prices are Starter at $249 setup and $99/month, Growth at $499 setup and $249/month, and Pro at $999 setup and $499/month.
- The public store still exposes smaller self-serve component prices for individual services, but canonical package checkout uses the package price IDs in `src/lib/salesCatalog.js`.
- SEO/conversion audit is currently 9/10. The only failing check is a real GA4 measurement ID.
- Resend send paths exist through the canonical CommunicationOutbox. Production still needs sender-domain proof and safe delivery/bounce evidence before large-volume email.
- Stripe live proof remains intentionally paused until frontend, email, and launch assets are ready.

## Non-Negotiable Launch Gates

1. Build passes locally with no production-facing pricing mismatch.
2. `npm run audit:seo-conversion` passes or has a documented external blocker.
3. Resend domain is verified and `RESEND_FROM_EMAIL` uses a real ClientSurge sender.
4. Work inboxes are live, monitored, and routed.
5. Contact and booking paths are manually tested in a staging-safe environment.
6. No launch email is sent without unsubscribe language and a real physical mailing address.
7. No discount is advertised unless the matching checkout/coupon path exists or the offer is manually fulfilled.

## Work Email Setup

Recommended public-facing inboxes:

| Address | Purpose | Required Before Launch |
|---|---|---|
| `hello@clientsurgesystems.com` | General inquiries and website reply-to | Yes |
| `nolan@clientsurgesystems.com` | Founder/operator direct replies | Yes |
| `support@clientsurgesystems.com` | Client support and onboarding questions | Yes |
| `billing@clientsurgesystems.com` | Invoices, receipts, payment recovery | Before paid launch |
| `audits@clientsurgesystems.com` | Optional audit campaign routing | Nice to have |

DNS/provider checklist:
- Mailbox provider MX records are active for `clientsurgesystems.com`.
- Resend sending domain is verified for `clientsurgesystems.com`.
- SPF and DKIM pass for Resend.
- DMARC exists. Start with monitoring if unsure, then tighten later.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_EMAIL`, and `ADMIN_NOTIFICATION_EMAIL` are set in Base44.
- `RESEND_FROM_EMAIL` should be a verified sender such as `ClientSurge Systems <hello@clientsurgesystems.com>` or `ClientSurge Systems <nolan@clientsurgesystems.com>`.
- Test sends prove delivered, bounced, and complaint webhooks update CommunicationEvent/CommunicationOutbox before scale.

References:
- FTC CAN-SPAM guide: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- Resend domain authentication: https://resend.com/docs/dashboard/domains/introduction
- Resend DMARC guide: https://resend.com/docs/dashboard/domains/dmarc

## Frontend QA Checklist

High-intent routes:
- `/` homepage: hero CTA, audit CTA, industry links, pricing section, footer.
- `/book`: scheduler loads, fallback contact is visible, mobile layout is usable.
- `/contact`: validation, consent text, success state, fallback email/phone.
- `/store`: package prices, service counts, package names, checkout buttons, cart behavior.
- `/automations`: six-system explanation and CTA flow.
- `/industries`: active industry cards and page links.
- Industry pages: hero readability, CTA contrast, FAQ/schema, mobile layout.

Catalog assertions:
- Starter: 2 automations, $249 setup, $99/month.
- Growth: 4 automations, $499 setup, $249/month.
- Pro: 6 automations, $999 setup, $499/month.
- Treat Elite only as a legacy alias for Pro when reading old records or staging override keys.
- Avoid promising unsupported launch timing. Use "done-for-you setup" or "ready fast" unless a specific SLA has been operationally approved.

## Launch Positioning

Core promise:
ClientSurge helps local service businesses turn more website leads, missed calls, old inquiries, and completed jobs into booked revenue using done-for-you AI automation systems.

Audience:
Local service businesses that already get inquiries but lose revenue through slow response, missed calls, inconsistent follow-up, weak booking handoff, stale lead lists, or low review volume.

Offer ladder:
- Starter: respond fast and recover missed calls.
- Growth: add nurture and booking handoff for active lead flow.
- Pro: add old-lead reactivation and review requests for the full recovery stack.

Primary CTA:
Book an Automation Audit.

Secondary CTA:
View packages or ask a question.

## Launch Deals

Use these only if they match the actual sales/fulfillment process.

Approved no-code deals:
- Founder Launch Audit: free workflow audit for qualified local businesses.
- First 10 Launch Slots: priority onboarding queue for the first 10 approved businesses.
- Message Review Bonus: launch customers get one extra message-review pass before go-live.
- Reactivation Preview: Pro prospects get a manual estimate of dormant-lead recovery potential.

Deals requiring checkout/coupon support before public promotion:
- Setup-fee discount.
- First-month discount.
- Bundle coupon.
- Limited-time price lock.

Recommended launch deal:
"First 10 local businesses get priority setup plus an extra message-review pass before go-live." This adds urgency without breaking checkout pricing.

## SEO Launch Campaign

Primary keywords:
- local business AI automation
- missed call text back service
- AI lead response for local businesses
- automated lead follow up for service businesses
- review request automation
- old lead reactivation
- AI booking agent for local services

Launch-page support:
- Homepage targets the broad offer.
- `/automations` targets the six-system architecture.
- Industry pages target specific buyer verticals.
- `/book` targets audit intent.
- Blog posts should target problem-aware searches and drive to `/book`.

30-day SEO content calendar:

| Week | Asset | Target Query | CTA |
|---|---|---|---|
| 1 | Blog: Why local businesses lose booked jobs after the first inquiry | slow lead response local business | Book an audit |
| 1 | Blog: Missed call text-back systems explained | missed call text back service | View Starter |
| 2 | Blog: The 14-day follow-up sequence local service businesses need | automated lead follow up service business | View Growth |
| 2 | Industry page refresh: Med spas | med spa lead follow up automation | Book an audit |
| 3 | Blog: How to reactivate old leads without sounding desperate | old lead reactivation campaign | View Pro |
| 3 | Industry page refresh: Roofing or dental | industry-specific automation | Book an audit |
| 4 | Blog: Review request automation without review gating | review request automation local business | View Pro |
| 4 | Comparison page draft | AI automation agency for local businesses | Book an audit |

## Email Launch Campaign

Compliance guardrails:
- Use truthful sender/header information.
- Use clear subject lines that match the message.
- Include a physical mailing address.
- Include a working opt-out method.
- Honor opt-outs quickly.
- Do not imply guaranteed revenue or fake client results.

Warm list sequence:

Email 1 - Launch announcement
Subject: ClientSurge is live for local businesses
Preview: A done-for-you automation system for leads, missed calls, follow-up, booking, reviews, and reactivation.
CTA: Book an Automation Audit.

Email 2 - The problem
Subject: The lead loss usually happens after the inquiry
Preview: Slow replies, missed calls, and inconsistent follow-up are fixable system problems.
CTA: See the six automations.

Email 3 - Package clarity
Subject: Starter, Growth, or Pro?
Preview: A simple way to choose the right automation system for your current lead flow.
CTA: View packages.

Email 4 - Launch slot
Subject: First 10 launch slots get priority setup
Preview: Priority setup plus one extra message-review pass before go-live.
CTA: Claim a launch audit.

Email 5 - Final nudge
Subject: Want us to map the leaks in your follow-up?
Preview: We will review your lead capture, missed-call flow, follow-up, booking handoff, reviews, and old leads.
CTA: Book an audit.

Cold/local outreach sequence:

Email 1 - Specific pain
Subject: Quick question about missed calls and web leads
CTA: Reply with "audit" and we will send a simple checklist.

Email 2 - Useful asset
Subject: 6 follow-up gaps local businesses miss
CTA: Open the brochure or book an audit.

Email 3 - Package fit
Subject: Which automation stack fits your lead flow?
CTA: View Starter/Growth/Pro.

Email 4 - Breakup
Subject: Should I close the loop?
CTA: Reply yes/no.

## Brochure/PDF

Printable source:
- `public/launch/clientsurge-launch-brochure.html`

Generated PDF:
- `public/launch/clientsurge-launch-brochure.pdf`

Use the brochure in:
- Email 2 as the useful asset.
- LinkedIn posts.
- Sales follow-up after audit calls.
- Local chamber/networking outreach.

## Social And Local Launch Posts

Post 1:
Most local businesses do not need more chaos in their follow-up. They need a system that replies fast, recovers missed calls, follows up, books, requests reviews, and reactivates old leads. ClientSurge is built for exactly that.

Post 2:
The first automation most local businesses should install is simple: respond instantly when a lead submits a form. Speed-to-lead is not glamorous, but it is usually where revenue starts leaking first.

Post 3:
Launch offer: the first 10 qualified local businesses get priority setup plus one extra message-review pass before go-live. Book an Automation Audit and we will map the gaps before recommending a package.

## Remaining External Blockers

- Real GA4 measurement ID for production analytics.
- Resend dashboard/log proof for safe delivered and bounced test messages.
- Work inboxes verified and monitored.
- Base44 production environment values confirmed.
- Live Stripe proof remains intentionally paused.
