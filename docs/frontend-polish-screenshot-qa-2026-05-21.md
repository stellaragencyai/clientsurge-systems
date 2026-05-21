# ClientSurge Frontend Polish And Screenshot QA

Created: 2026-05-21

Purpose: turn Phase 1 polish into a concrete visual QA pass that can be executed locally before launch, without touching providers, production deploys, or live customer flows.

## Scope

Primary routes:

- `/`
- `/automations`
- `/industries`
- `/store`
- `/book`
- `/about`
- `/contact`

Primary homepage sections:

- `Hero`
- `CoreOffer`
- `AutomationShowcase`
- `InteractiveJourneyMap`
- `Pricing`
- `FAQ`
- `FinalCTA`
- `Navbar`
- `MobileCallBar`

## Viewports

Capture screenshots at:

- Desktop: `1440x1000`
- Laptop: `1280x900`
- Tablet: `768x1024`
- Mobile: `390x844`
- Small mobile: `360x780`

## Acceptance Checklist

### First Viewport

- Brand and offer are immediately clear without relying on nav text alone.
- Primary CTA is visible above the fold on desktop and mobile.
- Hero visual renders fully, is not blank, and does not overlap the headline or CTA.
- Mobile nav, sticky CTA, and hero CTA do not compete for the same tap area.
- First viewport hints at the next section on both mobile and desktop.

### Conversion Flow

- Visitors can move from problem awareness to package selection without hitting a dead end.
- Pricing cards explain setup cost, monthly cost, included automations, and 30-day monthly start timing.
- CTAs vary by intent: audit, pricing, demo, and start checkout should not all feel identical.
- Store package recommendation from quiz/session state is visible and does not hide package comparison.
- Book/contact fallback path is obvious if a visitor is not ready to buy.

### Visual Credibility

- Testimonials and proof sections avoid unverifiable claims that read like fabricated case studies.
- Avatar or initials treatment does not imply real customer photos unless verified.
- Before/after visuals are clearly framed as workflow examples or demonstrated outcomes.
- Trust and guarantee copy is specific without overpromising a guaranteed revenue result.

### Mobile UX

- No text overlaps cards, buttons, images, animation panels, or sticky controls.
- Horizontal scrolling is absent at 360px and 390px widths.
- Tap targets are large enough for nav, accordions, pricing CTAs, quiz choices, and booking links.
- Animated demos remain readable and do not clip important labels.
- Sticky mobile CTA does not cover form submit buttons or footer links.

### Performance And Stability

- Images reserve stable dimensions and do not create visible layout shift.
- Lazy sections load without leaving blank high-value content in the first screen.
- Heavy animations remain smooth enough on mobile and have no broken asset references.
- Console has no uncaught runtime errors during page load and route navigation.

### Accessibility And Semantics

- Page headings descend logically enough for screen reader scanning.
- Interactive icon buttons and nav controls have useful labels.
- Form fields have labels or accessible names.
- Color contrast is readable for primary text, muted text, CTA labels, and badges.
- Keyboard focus is visible for nav, package buttons, FAQ controls, and modal actions.

## Suggested Playwright Flow

1. Start local dev server.
2. Visit each primary route at each viewport.
3. Save full-page screenshots under `qa/results/frontend-polish/`.
4. Record console errors and failed network requests.
5. Manually inspect the first viewport and the primary conversion path.
6. Fix layout/copy regressions in small batches, then rerun the affected viewport screenshots.

## Out Of Scope

- Live Stripe checkout.
- Live Twilio SMS or calls.
- Live Resend sends.
- Base44 production publish or deploy.
- Any claim that requires production provider proof.

## Recommended Next Patch Areas

1. Replace or soften any testimonial claims that cannot be verified before launch.
2. Screenshot-test the homepage first viewport and pricing/store flow on mobile.
3. Fix any sticky CTA overlap found at `360x780` and `390x844`.
4. Verify that `/store` checkout CTAs are clear but do not imply live provider proof is complete.
