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

## 2026-05-22 Blog/Store/Book QA Pass

Local server: `http://127.0.0.1:5174`

Evidence captured under `qa/results/frontend-polish/`:

- `store-mobile-390x844-wait10s.png`
- `store-desktop-1440x1000.png`
- `blog-index-mobile-390x844-wait10s.png`
- `blog-index-desktop-1440x1000-wait10s.png`
- `book-mobile-390x844-wait10s.png`
- `blog-index-mobile-390x844-filtered-cookie-normal.png`
- `book-mobile-390x844-cookie-offset-targeted.png`

Findings:

- Initial no-wait screenshots captured the Suspense loader and cookie banner before the page settled; rerunning with a 10-second wait showed the routes rendering correctly.
- `/store` mobile and desktop rendered package cards, pricing, automation labels, checkout/support CTAs, footer links, and no obvious horizontal overflow at `390x844`.
- `/blog` mobile rendered all 10 launch articles, but the index was a long undifferentiated list. Added topic filters for All, Lead Capture, Industries, Booking, and Strategy.
- `/book` mobile rendered the audit path and fallback contact CTAs, but the cookie banner competed with the fixed mobile call/demo bar. Cookie banner offset is now raised only when the mobile call bar is present on a mobile viewport.

Verification:

- `npx eslint src/pages/Blog.jsx src/components/landing/CookieConsent.jsx src/components/landing/MobileCallBar.jsx --quiet`
- `npm run build`

## 2026-05-22 Mobile Traffic Destination QA Add-On

Local server: `http://127.0.0.1:5176`

Evidence captured under `qa/results/frontend-polish/`:

- `med-spa-mobile-390x844-traffic-path.png`
- `book-mobile-390x844-traffic-path.png`
- `store-mobile-390x844-traffic-path.png`

Findings:

- `/store` mobile renders the package entry path with clear AI services count, setup timing, contract reassurance, and Guided Path/Explore All controls above the cookie banner.
- `/book` mobile renders the audit headline, audit-scope copy, review link, and bottom call/demo bar. The cookie banner is raised above the mobile CTA bar and does not hide the fixed buttons.
- `/med-spa` mobile renders the niche automation cards and menu access. The cookie banner covers part of the lower first viewport until accepted, but does not overlap the navbar/menu.

Verification:

- `npx --yes playwright@latest screenshot --wait-for-timeout=10000 --viewport-size=390,844 http://127.0.0.1:5176/med-spa qa/results/frontend-polish/med-spa-mobile-390x844-traffic-path.png`
- `npx --yes playwright@latest screenshot --wait-for-timeout=10000 --viewport-size=390,844 http://127.0.0.1:5176/book qa/results/frontend-polish/book-mobile-390x844-traffic-path.png`
- `npx --yes playwright@latest screenshot --wait-for-timeout=10000 --viewport-size=390,844 http://127.0.0.1:5176/store qa/results/frontend-polish/store-mobile-390x844-traffic-path.png`

## 2026-05-22 Credibility Media Fallback Patch

Finding:

- `public/founder-photo.jpg` is not present locally, so the founder section previously depended on a third-party placeholder image fallback.
- Industry template pages also had a generic `via.placeholder.com` hero fallback even though launch pages should avoid placeholder-looking media.

Fix:

- Replaced the founder image error path with an honest in-app founder placeholder that says the approved founder image is pending.
- Replaced the industry template placeholder URL with industry-specific Unsplash image fallbacks for med spa, dental, chiropractic, HVAC, roofing, and contractor pages.
- Added source tests so public credibility surfaces avoid generic placeholder media.

Verification:

- `node --test tests/homeFounderSection.test.js tests/homepageCredibilityCopy.test.js tests/homepageTestimonialsCredibility.test.js tests/homepageSimulatedProofCopy.test.js`
- `npx eslint src/components/landing/FounderSection.jsx src/components/landing/IndustryTemplate.jsx tests/homeFounderSection.test.js tests/homepageCredibilityCopy.test.js --quiet`
- `npm run build`
- `git diff --check` returned only existing CRLF warnings.

## 2026-05-22 Blog Launch Regression Guard

Finding:

- The blog index now has all 10 launch articles and topic filters, but that mobile-scannability work needed explicit regression coverage so it does not silently fall back to a long undifferentiated list.

Fix:

- Added `tests/blogLaunch.test.js` to verify all 10 launch article slugs stay present, every article URL remains in `public/sitemap.xml`, the blog index keeps the All/Lead Capture/Industries/Booking/Strategy filters, and article/FAQ schema hooks remain wired.

Verification:

- `node --test tests/blogLaunch.test.js tests/sixAutomations.test.js tests/seoBreadcrumb.test.js` passed 12/12.
- `npx eslint src/pages/Blog.jsx tests/blogLaunch.test.js --quiet` passed.
- `npm run build` passed.

## 2026-05-23 Med Spa Credibility Copy Pass

Finding:

- Legacy med-spa testimonial/social-proof components still used launch-visible language that looked like verified customer proof before approved case studies exist.
- The shared industry results component also used "Real Results" framing and a hard launch-timing line that should stay conditional until onboarding and provider access are confirmed.

Fix:

- Reframed med-spa testimonials/social proof as illustrative launch scenarios and removed customer-like names, stock-photo avatars, hard ROI/payback claims, and no-setup-fee copy.
- Reframed shared industry results as launch targets and changed the CTA note to make timing dependent on onboarding and provider access.
- Expanded `tests/medSpaLaunchCopy.test.js` to guard against the removed claims.

Verification:

- `node --test tests/medSpaLaunchCopy.test.js tests/homepageTestimonialsCredibility.test.js tests/homepageCredibilityCopy.test.js` passed 7/7.
- `npx eslint src/components/industry/IndustryResults.jsx src/components/medspa/MedSpaSocialProof.jsx src/components/medspa/MedSpaTestimonials.jsx src/components/medspa/MedSpaFinalCTA.jsx src/components/medspa/MedSpaPricingPreview.jsx tests/medSpaLaunchCopy.test.js --quiet` passed.
- `npm run build` passed.
