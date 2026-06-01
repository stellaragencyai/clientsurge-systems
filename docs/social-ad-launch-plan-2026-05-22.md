# ClientSurge Social And Ad Launch Plan - 2026-05-22

Purpose: turn Phase 5 into a practical seven-day demand-generation plan while keeping all paid ads and external posting behind explicit Nolan approval.

## Current State

- Launch target is 2026-05-29 unless Nolan changes it.
- Public website and package flow are the main conversion surface.
- Live provider proof is not fully complete, so external campaign copy must not imply live customer fulfillment has been proven end to end until those gates pass.
- First seven organic launch posts are drafted in `docs/social-launch-post-drafts-2026-05-22.md`.
- Additional organic posts, Meta ad drafts, Google Search ad drafts, UTM links, and creative directions are drafted in `docs/social-ad-creative-bank-2026-05-22.md`.
- Analytics and pixel readiness is documented by name only in `docs/analytics-pixel-readiness-2026-05-22.md`.
- No paid ads, social posts, or external messages should be published without approval.

## Launch Campaign Thesis

ClientSurge sells the system local businesses wish they had after they miss a lead: instant response, structured follow-up, booking handoff, and a visible install path.

Best early audiences:

- med spas with paid lead spend or heavy Instagram inquiry volume
- dental offices missing phone inquiries
- HVAC and roofing operators with seasonal or emergency lead spikes
- contractors who quote manually and lose follow-up momentum

## Offer Angles

1. Missed-call recovery
   - Problem: calls and forms arrive while the team is busy.
   - Promise: every missed inquiry gets a fast, trackable response path.
   - CTA: "Audit my missed lead path."

2. Speed-to-lead
   - Problem: competitors win because they respond first.
   - Promise: automated response and follow-up reduce dead time.
   - CTA: "See the automation stack."

3. Old lead reactivation
   - Problem: paid-for leads sit unused.
   - Promise: re-engagement campaigns turn dormant lists into fresh conversations.
   - CTA: "Reactivate old leads."

4. Done-for-you implementation
   - Problem: operators do not have time to configure every tool.
   - Promise: package purchase starts a guided install workflow.
   - CTA: "Compare packages."

## Seven-Day Organic Posting Plan

Day 1:

- Theme: "The fastest competitor usually wins the lead."
- Format: LinkedIn text post + Instagram carousel.
- CTA: `/book?utm_source=social&utm_medium=organic&utm_campaign=clientsurge_launch_2026_05&utm_content=speed_to_lead`

Day 2:

- Theme: missed-call text-back workflow.
- Format: short diagram post.
- CTA: `/automations?utm_source=social&utm_medium=organic&utm_campaign=clientsurge_launch_2026_05&utm_content=missed_call_workflow`

Day 3:

- Theme: Starter/Growth/Elite package fit.
- Format: comparison post.
- CTA: `/store?utm_source=social&utm_medium=organic&utm_campaign=clientsurge_launch_2026_05&utm_content=package_fit`

Day 4:

- Theme: med spa lead response.
- Format: niche-specific post.
- CTA: `/med-spa?utm_source=social&utm_medium=organic&utm_campaign=clientsurge_launch_2026_05&utm_content=medspa_lead_response`

Day 5:

- Theme: old lead reactivation.
- Format: before/after workflow post.
- CTA: `/automations?utm_source=social&utm_medium=organic&utm_campaign=clientsurge_launch_2026_05&utm_content=reactivation`

Day 6:

- Theme: what happens after purchase.
- Format: onboarding/install timeline post.
- CTA: `/store?utm_source=social&utm_medium=organic&utm_campaign=clientsurge_launch_2026_05&utm_content=after_purchase`

Day 7:

- Theme: launch announcement.
- Format: founder-style announcement post.
- CTA: `/book?utm_source=social&utm_medium=organic&utm_campaign=clientsurge_launch_2026_05&utm_content=launch_announcement`

## First Paid Ad Test

Do not launch until Nolan approves budget, audience, platform, and creative.

Recommended first test:

- Platform: Meta
- Objective: leads or website conversions, depending on pixel readiness.
- Audience: Arizona and nearby regional med spa owners/operators, then duplicate for dental.
- Budget: small validation budget only, such as $20-$50/day for 3 days.
- Destination: `/book` or `/med-spa`, not the direct checkout path.
- Success metric: qualified audit bookings and clean UTM attribution, not vanity clicks.

Creative concepts:

1. "You paid for the lead. Why let a missed call kill it?"
2. "New inquiry at 7:42 PM. Your front desk is gone. ClientSurge still answers."
3. "A website is not enough. The lead response system is what books."

## Tracking Requirements

Minimum before paid traffic:

- GA4 measurement ID deployed.
- Pixel decision made for Meta if paid ads launch there.
- UTM links used on every social/ad destination.
- `/book`, `/store`, and lead forms checked on mobile.
- Live provider proof status clearly reflected in internal launch notes.

Recommended UTM template:

```text
utm_source=<platform>
utm_medium=<organic|paid_social>
utm_campaign=clientsurge_launch_2026_05
utm_content=<creative_or_post_slug>
```

## Copy Guardrails

- Do not claim guaranteed revenue.
- Do not claim customer results unless Nolan provides verified proof.
- Do not imply live SMS/email/payment flows have passed if the provider proof is still pending.
- Be specific about workflows: missed-call text-back, instant lead response, booking prompts, reactivation, and reporting.
- Keep CTAs tied to audit/demo/package comparison until provider gates are fully green.

## Approval Needed Before External Action

- Posting to any public profile.
- Creating or launching paid ads.
- Installing or changing tracking pixels.
- Using customer testimonials, logos, screenshots, or names.
- Sending outreach messages or DMs.

## Next Safe Implementation Batch

1. Review and select the strongest organic posts from the first 21 drafts.
2. Confirm GA4/Search Console/Meta Pixel access with Nolan before changing any deployed environment or account settings.
3. Convert approved creative into final production-domain URLs after deployment.
