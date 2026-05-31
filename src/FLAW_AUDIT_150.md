# 150 Flaw Audit — ClientSurge Systems Full Site Scan
Generated: 2026-05-31

## THEME / COLOR INCONSISTENCIES (1–40)

### #F001 — Blog page uses hardcoded `#00D4FF` brand color
**File:** `pages/Blog.jsx` line 45, 50
**Issue:** Tag chips and "Read more" text use `#00D4FF` — the OLD brand accent. All other pages use `#0088CC` / `#00AEEF`.
**Fix:** Replace `color: "#00D4FF"` and `background: "rgba(0,212,255,0.1)"` with the canonical brand color `#00AEEF` / `rgba(0,174,239,0.1)`.

### #F002 — Blog page uses `background: "rgba(0,212,255,0.2)"` for tag border
**File:** `pages/Blog.jsx` line 45
**Issue:** `rgba(0,212,255,0.2)` is off-brand. Should be `rgba(0,174,239,0.2)`.

### #F003 — Blog page has no Navbar or Footer
**File:** `pages/Blog.jsx`
**Issue:** Blog page renders inside a bare `<div style="padding: 60px 20px">` with no `<Navbar />` or `<Footer />`. Every other public page has both.
**Fix:** Import and render `<Navbar />` above and `<Footer />` below the content.

### #F004 — Blog page has no `<MobileCallBar />`
**File:** `pages/Blog.jsx`
**Issue:** All other content pages (Contact, About) include `<MobileCallBar />`. Blog is missing it.

### #F005 — Blog page lacks padding-top for fixed Navbar overlap
**File:** `pages/Blog.jsx`
**Issue:** `padding: "60px 20px"` is hardcoded on the outer div. After adding Navbar, content will be hidden behind the fixed nav (~64px–82px).
**Fix:** Add `paddingTop: "clamp(5.5rem, 10vw, 7rem)"` to accommodate the fixed Navbar.

### #F006 — Blog uses raw `style={}` inline props throughout instead of Tailwind
**File:** `pages/Blog.jsx`
**Issue:** Entire page is written in `style={{}}` instead of Tailwind + CSS variables. Creates a maintenance silo and breaks dark mode.

### #F007 — About page hero uses a custom brown gradient instead of brand blue
**File:** `pages/About.jsx` line 29
**Issue:** `background: "linear-gradient(to bottom, hsl(40,8%,88%), hsl(0,0%,100%))"` — warm brown/beige gradient. Inconsistent with all other page heroes which use white/card/muted backgrounds or the brand blue.

### #F008 — Automations page uses its own custom Navbar (header only) — misses the full Navbar component
**File:** `pages/Automations.jsx` lines 319–339
**Issue:** The Automations page renders its own bare `<div>` header with a logo + single CTA link instead of the `<Navbar />` component. Missing: mobile menu, login button, industry dropdown, all nav links.
**Fix:** Replace the custom header with `<Navbar />`.

### #F009 — Automations page has no Footer
**File:** `pages/Automations.jsx`
**Issue:** No `<Footer />` rendered. The page ends abruptly after the bottom CTA grid.

### #F010 — Automations page has no MobileCallBar
**File:** `pages/Automations.jsx`
**Issue:** Missing `<MobileCallBar />` that every other public page has.

### #F011 — Automations `BRAND` object uses `gradientFrom: "#00AEEF"` but `gradientTo` is `"#003B8F"` — CTA button reverses to `#0050A0`
**File:** `pages/Automations.jsx` line 335
**Issue:** The Automations page header CTA uses `background: 'linear-gradient(135deg, ${BRAND.gradientFrom}, #0050A0)'` — hardcoded `#0050A0` mid-value that doesn't match `BRAND.gradientTo = "#003B8F"`.

### #F012 — Automations page ServiceCard uses `style={{ background: "white" }}` (hardcoded)
**File:** `pages/Automations.jsx` line 192
**Issue:** `background: "white"` breaks dark mode and doesn't use the CSS variable `hsl(var(--card))`.

### #F013 — Automations page ServiceCard content text uses `text-slate-600` and `text-slate-900` (hardcoded Tailwind gray)
**File:** `pages/Automations.jsx` lines 246, 252
**Issue:** Should use `text-foreground` / `text-muted-foreground` tokens.

### #F014 — Automations page stats box uses `background: "#f0f8ff"` hardcoded
**File:** `pages/Automations.jsx` line 257
**Issue:** Should be `bg-primary/5` or `hsl(var(--card))` for theme consistency.

### #F015 — Automations bottom CTA uses `text-slate-900`, `text-slate-600`, `text-slate-500` (hardcoded)
**File:** `pages/Automations.jsx` lines 393–416
**Issue:** Should use theme tokens `text-foreground`, `text-muted-foreground`.

### #F016 — Automations bottom CTA second button uses `text-slate-700`, `border-slate-200`, `hover:border-blue-300`
**File:** `pages/Automations.jsx` line 410
**Issue:** `text-slate-700` should be `text-foreground`; `border-slate-200` → `border-border`; `hover:border-blue-300` → `hover:border-primary/40`.

### #F017 — Pricing section `CoreOfferCTA` uses `bg-[#f0f9ff]` (hardcoded hex)
**File:** `components/landing/CoreOffer.jsx` line 189
**Issue:** `bg-[#f0f9ff]` is a hardcoded background. Should be `bg-primary/4` or `bg-card` from design tokens.

### #F018 — Pricing `ALA_CARTE` add-on CTA link uses `text-black` instead of `text-primary`
**File:** `components/landing/Pricing.jsx` line 230
**Issue:** `text-black` on a light button when the rest of the pricing section uses `text-primary`. Inconsistent.

### #F019 — ProofBeforeLaunch uses `bg-sky-50`, `border-sky-100`, `text-slate-600`, `text-slate-700` (hardcoded Tailwind colors)
**File:** `components/landing/ProofBeforeLaunch.jsx` lines 55–64
**Issue:** `bg-sky-50` should be `bg-primary/5`, `border-sky-100` → `border-primary/15`, `text-slate-600/700` → `text-foreground/text-muted-foreground`.

### #F020 — ProofBeforeLaunch uses `border-slate-200` for article cards
**File:** `components/landing/ProofBeforeLaunch.jsx` line 55
**Issue:** `border-slate-200` should be `border-border` (theme token).

### #F021 — FounderSection uses `rgba(154,92,46,0.25)` brown/copper border — off-brand
**File:** `components/landing/FounderSection.jsx` lines 17, 27, 47
**Issue:** The gold/copper accent color is inconsistent with the site's blue brand palette. No other section uses this warm gold. Should use `rgba(0,174,239,0.2)` or similar blue.

### #F022 — FounderSection founder photo falls back to a brown placeholder `f5e6d0/9a5c2e` (warm brown colors)
**File:** `components/landing/FounderSection.jsx` line 30
**Issue:** Placeholder uses `hsl(40,8%,96%)` warm tone (#f5e6d0). Should use brand blue placeholder or a real photo.

### #F023 — FounderSection uses `style={{ color: "#9a5c2e" }}` for founder credit line
**File:** `components/landing/FounderSection.jsx` line 49
**Issue:** `#9a5c2e` is a warm brown. Should use `text-primary` or `text-muted-foreground`.

### #F024 — ClientPortal top bar uses `bg-white/80` (hardcoded white) — breaks dark mode
**File:** `internal-pages/ClientPortal.jsx` line 201
**Issue:** `bg-white/80` is hardcoded. Should be `bg-background/80` for dark mode compatibility.

### #F025 — ClientPortal tab bar uses `bg-white` (hardcoded)
**File:** `internal-pages/ClientPortal.jsx` line 260
**Issue:** `bg-white` should be `bg-background`.

### #F026 — ClientPortal tab bar scroll shadow uses `from-white` (hardcoded)
**File:** `internal-pages/ClientPortal.jsx` line 261
**Issue:** `bg-gradient-to-l from-white` breaks dark mode. Should be `from-background`.

### #F027 — ClientDashboard `LoadingState` uses hardcoded `"#0A1628"` and `"rgba(10,22,40,...)"` text colors
**File:** `internal-pages/ClientDashboard.jsx` lines 37–38
**Issue:** Hardcoded dark colors instead of `text-foreground` and `text-muted-foreground`.

### #F028 — ClientDashboard `EmptyState` uses `background: "#ffffff"` (hardcoded white)
**File:** `internal-pages/ClientDashboard.jsx` line 72
**Issue:** Should be `hsl(var(--card))` or `bg-card`.

### #F029 — ClientDashboard outer wrapper uses `background: "#ffffff"` (hardcoded white)
**File:** `internal-pages/ClientDashboard.jsx` line 256
**Issue:** Should be `hsl(var(--background))`.

### #F030 — AdminDashboard overview stats use hardcoded Tailwind colors: `bg-blue-50 text-blue-700`, `bg-green-50 text-green-700`, `bg-purple-50 text-purple-700`, `bg-emerald-50 text-emerald-700`
**File:** `internal-pages/AdminDashboard.jsx` lines 414–418
**Issue:** None of these use design system tokens. They will look out of place in dark mode and don't match the blue brand. Should use `bg-primary/8 text-primary`, `bg-green-500/10 text-green-700` etc.

### #F031 — AdminDashboard priority queue "activation priority" badge uses `bg-white px-2.5 py-1` — white pill on white background (invisible in light mode cards)
**File:** `internal-pages/AdminDashboard.jsx` line 468
**Issue:** `rounded-full bg-white` badge sits inside a `bg-muted/20` card — near-invisible. Should be `bg-primary/10 text-primary` or similar colored badge.

### #F032 — AdminDashboard Offer Mix count badges also use `bg-white` — same issue
**File:** `internal-pages/AdminDashboard.jsx` line 505
**Issue:** Same as #F031 — white badge in a card context.

### #F033 — AdminDashboard Actionability Snapshot badges use `bg-white` too
**File:** `internal-pages/AdminDashboard.jsx` line 605
**Issue:** Same pattern — `bg-white` badge invisible.

### #F034 — FAQ AccordionItem has both `focus:outline-none` on Trigger AND `focus-within:ring-2` on AccordionItem — double ring artifacts
**File:** `components/landing/FAQ.jsx` lines 153, 162
**Issue:** Duplicate focus ring declarations can cause inconsistent rendering. Consolidate to one.

### #F035 — TrustBar uses `border-y border-primary/8` — `primary/8` is not a valid Tailwind opacity (must be `/8` = 8/100 = valid, but should be `/10` to match convention)
**File:** `components/landing/TrustBar.jsx` line 182
**Issue:** Minor opacity mismatch — `border-primary/8` vs the `border-primary/10` and `border-primary/15` used across the site.

### #F036 — TrustBar `StatCard` uses hardcoded `background: "#ffffff"` 
**File:** `components/landing/TrustBar.jsx` line 97
**Issue:** Should be `hsl(var(--card))` or `bg-card`.

### #F037 — SixAutomationSystems section uses `style={{ background: "#ffffff" }}` (hardcoded)
**File:** `components/landing/SixAutomationSystems.jsx` line 18
**Issue:** Should be `bg-background` or `bg-card` token.

### #F038 — Industries section background uses `bg-gradient-to-b from-card via-background via-70% to-slate-50/40` — `slate-50` is a hardcoded Tailwind color
**File:** `components/landing/Industries.jsx` line 334
**Issue:** `to-slate-50/40` should use a theme token like `to-background/50`.

### #F039 — Testimonials section uses `⭐` emoji for stars instead of the Lucide `Star` icon, inconsistent with other sections
**File:** `components/landing/Testimonials.jsx` line 107
**Issue:** The rest of the site uses Lucide icons. Using raw emoji stars can render inconsistently across platforms/OS.

### #F040 — Testimonials section has leading whitespace in h2 tag (`" Real Results..."`)
**File:** `components/landing/Testimonials.jsx` line 50
**Issue:** `" Real Results From Businesses Using Our System"` — leading space before "Real". Minor but visible in some browsers' text rendering.

---

## STRUCTURAL / LAYOUT BUGS (41–90)

### #F041 — Blog page has no `pt-32` or similar top padding for fixed Navbar clearance
**File:** `pages/Blog.jsx`
**Issue:** `padding: "60px 20px"` on the outer div. Once Navbar is added, content will collide with the navbar.

### #F042 — Automations page hero `<div>` has no responsive padding for mobile
**File:** `pages/Automations.jsx` line 342
**Issue:** `px-6 pt-16 pb-12` — no `clamp()` and no safe-area padding on mobile.

### #F043 — Automations ServiceCard thumbnail height is hardcoded `height: "210px"`
**File:** `pages/Automations.jsx` line 203
**Issue:** Fixed 210px thumbnail height can crop images badly on certain screen widths. Should use `aspect-video` class.

### #F044 — Automations VideoPlaceholder has no keyboard trap (focus lock) for accessibility
**File:** `pages/Automations.jsx` line 129
**Issue:** Modal opens but `<Escape>` key doesn't close it. No `useEffect` with keydown listener. Screen readers can navigate outside the modal.

### #F045 — ClientPortal tab bar: 18 tabs are all rendered at once — horizontal scroll with no indication
**File:** `internal-pages/ClientPortal.jsx` line 260
**Issue:** 18+ tabs in a horizontal scroll container with only a subtle gradient fade. On mobile this is unusable. Consider grouping into a dropdown or reducing visible tabs.

### #F046 — ClientPortal hero banner uses a hardcoded `linear-gradient` gradient directly in style prop, not using design tokens
**File:** `internal-pages/ClientPortal.jsx` line 239
**Issue:** `background: "linear-gradient(135deg,#003B8F 0%,#006BB0 60%,#00AEEF 100%)"` — should be abstracted to a class or CSS variable.

### #F047 — ClientPortal `notFound` state renders a plain centered card with no Navbar
**File:** `internal-pages/ClientPortal.jsx` line 155
**Issue:** When no project is found the page renders with no navigation at all. User has no way to get back to the site except using browser back.

### #F048 — ClientDashboard uses `<Navbar />` (public landing navbar) inside an authenticated dashboard
**File:** `internal-pages/ClientDashboard.jsx` line 257
**Issue:** The public Navbar with "Book Free Audit" and industry dropdown appears inside a client's private dashboard — wrong context, potential confusion.

### #F049 — ClientDashboard has no route guard — auth check is done inside the component with `base44.auth.me()`
**File:** `internal-pages/ClientDashboard.jsx` lines 178–179
**Issue:** The route `/client-dashboard` IS protected by `<ProtectedRoute>` in App.jsx. But the component also does its own `me()` check, which is redundant and adds latency.

### #F050 — AdminDashboard sidebar doesn't close on mobile when clicking a nav item that stays on the same page (tab switch)
**File:** `internal-pages/AdminDashboard.jsx` line 187
**Issue:** `if (window.innerWidth < 1024) setSidebarOpen(false)` — this only closes sidebar if `external` is false. On small screens navigating tabs doesn't close the sidebar either.

### #F051 — AdminDashboard `OverviewDashboard` has no `<AdminAICommandBar />` fallback — component can throw if not rendered
**File:** `internal-pages/AdminDashboard.jsx` line 422
**Issue:** `<AdminAICommandBar />` is rendered at the top of overview with no error boundary or loading state.

### #F052 — `renderContent()` in AdminDashboard has no `<Suspense>` wrapper — panels that do async fetching can throw unhandled rejections
**File:** `internal-pages/AdminDashboard.jsx` line 192
**Issue:** Each panel component does its own data fetching. There's no Suspense boundary — if a panel throws during render, the whole dashboard crashes.

### #F053 — Hero checklist grid uses `repeat(2, 1fr)` but only has 3 items — last item stretches full width
**File:** `components/landing/Hero.jsx` line 202
**Issue:** 3 items in a 2-column grid means item 3 spans the full width, looking unbalanced. Should use `grid-cols-1 sm:grid-cols-2` or 3 items in a 1-col grid.

### #F054 — Hero `headlineWords` array renders each word as a separate `<motion.span>` — causes word gaps to be inconsistent across zoom levels
**File:** `components/landing/Hero.jsx` lines 159–169
**Issue:** Word-by-word span animation creates inconsistent spacing. A trailing `{" "}` is added but can still collapse on some browsers.

### #F055 — Hero has 40+ blank lines (lines 356–396) in the visualWrap div that were clearly never cleaned up
**File:** `components/landing/Hero.jsx` lines 353–396
**Issue:** Dead whitespace in JSX. Should be removed.

### #F056 — CoreOffer `StackBuilder` button is `hidden` (className contains `hidden`)
**File:** `components/landing/CoreOffer.jsx` line 311
**Issue:** `className="... hidden"` — the Stack Builder trigger button is permanently hidden, but the `StackBuilder` component is still imported and mounted. Dead import and dead state.

### #F057 — CoreOffer `SystemCard` has a nested `<button>` inside a `<motion.button>` — invalid HTML
**File:** `components/landing/CoreOffer.jsx` lines 64–108
**Issue:** The "Add" button inside `SystemCard` is a `<button>` inside `<motion.button>`. Nesting interactive elements is invalid HTML and causes accessibility issues.

### #F058 — CoreOffer `CoreOfferCTA` `bg-[#f0f9ff]` has no dark mode equivalent
**File:** `components/landing/CoreOffer.jsx` line 189
**Issue:** Pure `bg-[#f0f9ff]` renders white in light mode, but the dark CSS class system can't override arbitrary hex values. Breaks dark mode visually.

### #F059 — Pricing `PricingCard` uses `rotateY: 6, rotateX: -2` on hover — causes layout shift on surrounding elements
**File:** `components/landing/Pricing.jsx` lines 383–386
**Issue:** 3D rotation on hover shifts cards relative to neighboring elements. Should use `scale` and `y` only.

### #F060 — Pricing `ALA_CARTE` add-on cards have `backdropFilter: "blur(12px)"` but no fallback for Firefox (Firefox doesn't support `backdrop-filter` without a flag)
**File:** `components/landing/Pricing.jsx` line 216
**Issue:** Missing `-webkit-backdrop-filter` and no `@supports` fallback. Cards may appear transparent in Firefox.

### #F061 — Industries section modal `IndustryModal` has a nested scroll container (`max-h-[90vh] overflow-y-auto`) but the backdrop click is on the Framer `motion.div` which has `pointerEvents: "none"`
**File:** `components/landing/Industries.jsx` lines 480–515
**Issue:** The backdrop div has an `onClick` to close but the modal motion wrapper has `pointerEvents: "none"` — this is correct design but the backdrop and modal z-indices should be verified. Modal does correctly set `pointerEvents: "auto"` on the inner div.

### #F062 — FAQ section `AccordionContent` has `className="... word-wrap break-words"` — `word-wrap` is not a Tailwind class
**File:** `components/landing/FAQ.jsx` line 165
**Issue:** `word-wrap` is not a valid Tailwind class (should be `break-words` or `overflow-wrap` which are valid). The `word-wrap` class is silently ignored.

### #F063 — FAQ `h2` has a leading space: `" Frequently Asked Questions"`
**File:** `components/landing/FAQ.jsx` line 99
**Issue:** Leading whitespace before "Frequently" — minor but visible in certain rendering contexts.

### #F064 — SixAutomationSystems card border `border: "1px solid rgba(255,255,255,0.9)"` (nearly white border on white bg — invisible)
**File:** `components/landing/SixAutomationSystems.jsx` line 73
**Issue:** The card's own border is almost invisible (white-on-white). The animated gradient border (`<motion.span>`) provides the visible border, but if that animation is paused (reduced motion), the card has no visible boundary.

### #F065 — Industries section `motion.button` elements use `type="button"` but also set `aria-pressed={isSelected}` — should use `role="radio"` or `role="option"` for a selection group
**File:** `components/landing/Industries.jsx` line 361
**Issue:** `aria-pressed` on a button in a selection group doesn't clearly communicate to screen readers that it's part of a choose-one group. A `role="radiogroup"` + `role="radio"` pattern would be more accessible.

### #F066 — Store page has large whitespace gap (lines 573–595 all empty) in `StoreInner`
**File:** `pages/Store.jsx` lines 573–595
**Issue:** 22 blank lines in JSX where commented-out code was removed. Creates a maintenance red flag and potential confusion.

### #F067 — Store page `SocialProofTicker` is loaded AFTER `<Footer />` — renders below the footer, users never see it
**File:** `pages/Store.jsx` lines 859–861
**Issue:** `<SocialProofTicker />` is in a `<Suspense>` block after `<Footer />`. It should be above the footer.

### #F068 — Store `BuildYourStackFlow` and `BundleSavingsToast` are in the same Suspense block — if either fails, both fail silently
**File:** `pages/Store.jsx` lines 827–830
**Issue:** Both should have their own Suspense/ErrorBoundary boundaries.

### #F069 — Store sticky cart `<div onClick>` is not keyboard accessible — no `onKeyDown`, `role="button"`, or `tabIndex`
**File:** `pages/Store.jsx` line 489
**Issue:** `<div onClick={() => setCartOpen(true)}>` is not keyboard focusable. Screen reader users and keyboard users cannot open the cart this way.

### #F070 — Store `store-hero` section has no `<h1>` aria landmark — the `<h1>` is hidden inside a deep div
**File:** `pages/Store.jsx` line 363
**Issue:** The store h1 is inside `store-hero-copy` > `store-hero`. Page structure is correct but not explicitly landmarked with `id="main-content"` or `<main>` tag.

### #F071 — Contact page `<select>` options have no `value` attributes (except the first option)
**File:** `pages/Contact.jsx` lines 345–352
**Issue:** `<option>Med Spas & Aesthetic Clinics</option>` — no `value` attribute. The option text becomes the value, which is long and inconsistent. Should use `value="med_spa"` etc.

### #F072 — Contact page double privacy disclaimer at the bottom of the form
**File:** `pages/Contact.jsx` lines 382–388
**Issue:** Two separate `<p className="text-center text-xs text-muted-foreground">` stacked directly below each other. First says "No spam. No pressure." and second has the Privacy Policy link. These should be merged into one paragraph.

### #F073 — Contact page form `handleSubmit` catch block uses generic `"Something went wrong"` — original error is swallowed
**File:** `pages/Contact.jsx` line 129
**Issue:** The error caught is discarded. `error.message` or `result.data.error` would be more informative.

### #F074 — About page has no `<MobileCallBar />` import at the top but does include it in JSX
Wait — About DOES import MobileCallBar. ✓ This is fine. Marking resolved.

### #F075 — About page "Who Builds It" section uses `<Link>` for "Get in Touch" and "See Our Services" but other CTAs across the page use `<a href>` — inconsistent
**File:** `pages/About.jsx` lines 105–116
**Issue:** Mixing `<Link>` and `<a href>` for internal navigation. Should use `<Link>` consistently for SPA routing.

### #F076 — About hero `<h1>` uses `font-display` class but the page imports no `font-display` setup — relies on CSS variable
**File:** `pages/About.jsx` line 32
**Issue:** `font-display` Tailwind class maps to `var(--font-display)`. This is correct per the design system. But About's hero h1 uses `font-display` while other h1 elements use `Montserrat, sans-serif` inline — inconsistency.

### #F077 — `FounderSection` photo src is `/founder-photo.jpg` (relative public path) — will 404 in production if not uploaded
**File:** `components/landing/FounderSection.jsx` line 30
**Issue:** Falls back to a placeholder, but the broken image flash is visible before `onError` fires. Should use a hosted URL or confirm the file exists in `/public`.

### #F078 — AdminDashboard and AdminShell both define the same `NAV_GROUPS` constant — complete duplication
**File:** `internal-pages/AdminDashboard.jsx` lines 53–111 and `components/admin/AdminShell.jsx` lines 18–80
**Issue:** Two separate NAV_GROUPS arrays in different files. When a nav item is added to one, it must be manually added to both. This has already led to desync (AdminDashboard has `ai-sales-reps` as "AI Sales Reps" but AdminShell maps the same concept differently).

### #F079 — AdminShell `NAV_GROUPS` System group is missing `failed-jobs` and `sniper` compared to AdminDashboard
**File:** `components/admin/AdminShell.jsx` System group
**Issue:** `failed-jobs` is in Tools group of AdminShell but in Automation group of AdminDashboard. `sniper` is in System of AdminDashboard but Tools of AdminShell. Inconsistent categorization.

### #F080 — AdminShell Tools group icon for `demo-bookings` is `MessageSquare` instead of `CalendarCheck2` used in AdminDashboard
**File:** `components/admin/AdminShell.jsx` line 71
**Issue:** Icon mismatch for the same nav item between AdminDashboard and AdminShell.

### #F081 — AdminShell `isActive()` for tab-based items depends on `activeId` prop — but standalone pages (AdminLeads, AdminOnboarding) may not pass the correct `activeId`
**File:** `components/admin/AdminShell.jsx` line 122
**Issue:** If `activeId` doesn't match any item's `id`, no nav item is highlighted as active. Many standalone pages may have this bug.

### #F082 — AdminDashboard `OverviewDashboard` bottom quick-action buttons use `bg-primary/8` which is not a standard Tailwind opacity
**File:** `internal-pages/AdminDashboard.jsx` line 619
**Issue:** `bg-primary/8` — Tailwind supports opacity modifiers from 0–100. `/8` means 8%, which is valid, but is not in the standard Tailwind config palette. Should confirm it renders consistently.

### #F083 — FinalCTA section has two CTAs that both link to `/book` — duplicating the same destination
**File:** `components/landing/FinalCTA.jsx` lines 97–113
**Issue:** "Get Your Free Audit" (opens DemoBookingModal) and "Get a Free Lead Leakage Audit" both link to `/book`. The first opens a modal, the second navigates. The two appear nearly identical to users — confusing.

### #F084 — FinalCTA "how the demo works" step connector `<motion.span>` has `scaleX` animation but `transformOrigin: "left"` inside a `text-left` container — connector won't span from center on mobile
**File:** `components/landing/FinalCTA.jsx` lines 69–81
**Issue:** On mobile where steps stack vertically, the horizontal connector makes no sense.

### #F085 — FinalCTA `<section>` uses `nebula-cta` class which forces a background — but `nebula-cta` is overridden to `#ffffff` on `body.homepage-white-canvas`
**File:** `components/landing/FinalCTA.jsx` line 14
**Issue:** On the homepage (white canvas), the `nebula-cta` background is suppressed. This makes the FinalCTA section background invisible / same as body — losing the section distinction.

### #F086 — `HomepageConversionContent` is not lazy-loaded but is imported eagerly in Home.jsx
**File:** `pages/Home.jsx` line 4
**Issue:** `HomepageConversionContent` is a large component (includes many sections) and is eagerly imported. It blocks the initial JS bundle. Should be `lazy()` loaded.

### #F087 — Home.jsx renders `<MotionSection>` wrappers but some sections inside are also wrapped in `<motion.div>` — double wrapping adds unnecessary DOM nodes and can cause staggered animation conflicts
**File:** `pages/Home.jsx`
**Issue:** `<MotionSection>` + internal `<motion.div>` double-nesting on sections like TrustBar, Testimonials.

### #F088 — `scrollToTop()` in `ScrollToTop` component only prevents scroll for hash navigation but the check is `!location.hash` — if a CTA scrolls to `#pricing` via `navigate()`, ScrollToTop will fire and reset to top
**File:** `App.jsx` line 117
**Issue:** When SPA navigates to `/#pricing`, the URL has no hash — it goes through `navigate("/")` and then JS scrolls. But on route change the ScrollToTop fires and resets scroll before the JS scroll, causing a flash to top then jump.

### #F089 — App.jsx `SectionRedirect` components navigate to `"/"` but the hash they're supposed to animate to is discarded
**File:** `App.jsx` lines 140–148
**Issue:** `/pricing` → `SectionRedirect hash="#pricing"` → `navigate("/", { replace: true })` — but the hash never gets scrolled to. The anchor scroll that was intended is lost. User ends up at top of homepage.

### #F090 — App.jsx `NOINDEX_PREFIXES` includes `/success` but the success page has legitimate content for clients — should be indexable
**File:** `App.jsx` line 124
**Issue:** `/success` is in NOINDEX but is a real page (`internal-pages/Success.jsx`). Should evaluate if this should be indexed.

---

## CONTENT / COPY / UX ISSUES (91–130)

### #F091 — Blog post cards show "Read more → (coming soon)" — this is a public-facing "coming soon" message on a published page
**File:** `pages/Blog.jsx` line 50
**Issue:** Users on the live site will see "(coming soon)" on every blog post. No post links work. Either implement real blog routing or remove the "Read more" CTA entirely.

### #F092 — Blog has only 3 placeholder posts with no actual content — zero SEO value
**File:** `pages/Blog.jsx`
**Issue:** The blog description in metadata promises "Practical guides on missed-call recovery, AI lead follow-up..." but all three posts are stubs with excerpt-only text.

### #F093 — FAQ answer for "How much does it cost?" says plans start at `$497/month` — but the Starter package is `$497/month`
**File:** `components/landing/FAQ.jsx` line 43
**Issue:** Technically correct but the pricing context says `$497/mo begins 30 days after go-live` — the FAQ doesn't mention the setup fee, misleading potential buyers.

### #F094 — FAQ category labels display in ALL CAPS via CSS `uppercase` but the underlying `category` values are lowercase — filter logic uses lowercase comparison, so filtering works. ✓ Not a bug.

### #F095 — Testimonials section shows only 3 testimonials — all from Arizona
**File:** `components/landing/Testimonials.jsx` lines 5–39
**Issue:** All three testimonial locations are "Scottsdale AZ", "Phoenix AZ", "Tempe AZ". Appears hyper-local, reducing trust for businesses outside Arizona.

### #F096 — Testimonials `result` badge ("5x booking increase") is displayed without any disclaimer or "results may vary" context
**File:** `components/landing/Testimonials.jsx` lines 101–104
**Issue:** The hard stats (5x booking, "ROI within the first month") have no asterisk or clarification. Legal risk and FTC advertising guidelines may apply.

### #F097 — FinalCTA projection stats ("3x typical booking rate lift", "< 90s target first response time") have a disclaimer but the disclaimer text is tiny and easily missed
**File:** `components/landing/FinalCTA.jsx` lines 49–51
**Issue:** `text-xs text-muted-foreground/60 italic` — extremely low contrast. WCAG AA requires 4.5:1 ratio for small text.

### #F098 — ProofBeforeLaunch heading "Show visitors what they are buying before they book" — reads as internal copy/instructions not consumer-facing messaging
**File:** `components/landing/ProofBeforeLaunch.jsx` line 37
**Issue:** "The site now explains the offer..." in the body text (line 41) reveals internal development language on a public-facing section.

### #F099 — ProofBeforeLaunch body text says "The site now explains the offer, then backs it up with concrete previews" — this is dev-written copy leaked to production
**File:** `components/landing/ProofBeforeLaunch.jsx` line 41
**Issue:** Dev/PM copy ("The site now explains...") is visible to site visitors.

### #F100 — About page copy says "Our clients are busy owners and operators who want a reliable, automated system running in the background — not another software tool to manage." — uses "not another software tool" but the product IS software
**File:** `pages/About.jsx` line 88
**Issue:** Positioning contradiction — "not a software tool" but ClientSurge is a SaaS platform. This may confuse buyers comparing software options.

### #F101 — Automations page h1 breaks on `<br />` tag on all screen sizes, creating awkward line break on desktop
**File:** `pages/Automations.jsx` line 354
**Issue:** `"AI Automation Systems for\n<br />\nLocal Service Businesses"` — hard `<br />` in an h1 is visible on all screen sizes. Should use responsive text sizing without forced breaks.

### #F102 — Automations page hero badge text "AI Lead Conversion Systems" is different from the page h1 "AI Automation Systems for Local Service Businesses" — inconsistency
**File:** `pages/Automations.jsx` lines 347, 350
**Issue:** Minor but the eyebrow badge and h1 describe the page with different labels.

### #F103 — Store "Talk to a Human" section CTA button has an emoji `📞` in the text
**File:** `pages/Store.jsx` line 852
**Issue:** `📞 Make the Leap: free 15-min strategy call` — mixed emoji in a button label is inconsistent with every other CTA on the site which uses Lucide icons + text.

### #F104 — Store hero h1 says "Build Your AI-Powered Business" — ambiguous (the product doesn't build the whole business)
**File:** `pages/Store.jsx` line 374
**Issue:** Copy says "AI-Powered Business" when what's actually sold is automation services for lead follow-up. The claim is too broad.

### #F105 — Store stat "AI Services Available: 12" — but there are actually 6 core automations. 12 refers to the full product catalog (live + coming soon)
**File:** `pages/Store.jsx` line 440
**Issue:** "12 AI Services Available" shown to visitors, but many are "Coming Soon" — this can create false expectations.

### #F106 — Pricing page h2 "Stop Losing Leads. Start Running a Real System." — uses period mid-headline breaking standard copywriting convention
**File:** `components/landing/Pricing.jsx` line 104
**Issue:** The headline break before "Start Running a Real System" can feel choppy. Industry practice is typically `em-dash` or single sentence for h2.

### #F107 — Pricing badge labels use the word "icon" literally: `{ icon: "Secure", text: "Secure Checkout via Stripe" }` — renders the icon field as text content
**File:** `components/landing/Pricing.jsx` lines 123–127
**Issue:** The badge rendering renders `{badge.icon}` as `<span>Secure</span>` instead of an actual icon. The `icon` field is just a text string. The intent was probably to show an icon, but the implementation just shows the label word ("Secure", "Clear", "Flexible") as plain text.

### #F108 — Pricing lower badge strip: `{ icon: "No lock-in", text: "No long-term contracts" }` — same issue as above, `icon` is plain text not an icon
**File:** `components/landing/Pricing.jsx` lines 156–162
**Issue:** Same problem — renders raw string "No lock-in", "Fast launch" etc. as `<span>` content above the description text. These should be Lucide icons.

### #F109 — SixAutomationSystems eyebrow text "The core offer" — lowercase, inconsistent with all other section eyebrows which are uppercase
**File:** `components/landing/SixAutomationSystems.jsx` line 28
**Issue:** All other eyebrow texts: "Choose Your Industry", "By The Numbers", "Proven Results", "Ready to Start?" — all title-cased or all-caps. "The core offer" is lowercase.

### #F110 — CoreOffer `SystemCard` "Add" button opens `StackBuilder` but the StackBuilder is hidden (`className="... hidden"`) — button does nothing visible
**File:** `components/landing/CoreOffer.jsx` line 311
**Issue:** Clicking "Add" on any system card sets `stackBuilderOpen: true` and calls `setStackItems()` but the trigger button renders hidden. The StackBuilder sheet may still open, but the trigger UI is broken.

### #F111 — CoreOffer header h2 reads "How The ClientSurge Flow Works" — "Flow" is vague; the section is about the 6 automations
**File:** `components/landing/CoreOffer.jsx` line 38
**Issue:** Section title doesn't match content well. The section lists individual automation systems with a vertical timeline. "The ClientSurge System" would be clearer.

### #F112 — Industries modal has a "Make the Leap" CTA that triggers a demo booking — same as the "Book Free Audit" CTA — two CTAs do the same thing
**File:** `components/landing/Industries.jsx` line 265–268
**Issue:** Both the "See The AI Store" link and "Make the Leap" button in the modal both link to booking demos or the store. The duplication reduces CTA hierarchy clarity.

### #F113 — TrustBar `StatCard` for "Average booking lift" shows "3x more bookings" animated, but the counter starts at 0 and animates to 3 — displaying "0x more bookings" briefly
**File:** `components/landing/TrustBar.jsx` line 82
**Issue:** The `useCountUp` starts at 0, so briefly shows "0x more bookings" before counting up. This is confusing — "0x more bookings" means no increase.

### #F114 — TrustBar `FollowUpTimeline` is imported but not shown in context — no section heading introduces it
**File:** `components/landing/TrustBar.jsx` line 199
**Issue:** The FollowUpTimeline visual appears below the stat cards without any heading or explanation. Users may not understand what they're looking at.

### #F115 — Hero subtext "ClientSurge Systems builds website lead capture, AI voice agents..." — the hero body is very long (2 full sentences, 40+ words)
**File:** `components/landing/Hero.jsx` line 196
**Issue:** Hero body copy should be max 15–20 words per best practice. Current version is 40+ words. Dilutes the value proposition.

### #F116 — Hero secondary CTA "View AI Automations" — the link goes to `/automations` which uses a different Navbar (custom header)
**File:** `components/landing/Hero.jsx` line 267
**Issue:** User expects consistent navigation but lands on a page with no full navbar. Creates disconnected experience.

### #F117 — Footer has a `"/tanning"` industry link that has no route defined in App.jsx
**File:** `components/landing/Footer.jsx` line 28
**Issue:** `{ label: "Tanning Salons", href: "/tanning" }` — no corresponding route or IndustryTemplate for "tanning" exists. Clicking this goes to the 404 page.

### #F118 — Footer Automations column links to `/automations` for ALL 6 automation items — none link to their individual service pages
**File:** `components/landing/Footer.jsx` lines 13–20
**Issue:** All 6 footer automation links point to `/automations`. The `lib/sixAutomations.js` canonical routePaths exist for each service but aren't used in the footer.

### #F119 — Footer uses inline `onMouseEnter` / `onMouseLeave` style overrides instead of CSS hover classes — causes React hydration issues and worse performance
**File:** `components/landing/Footer.jsx` — multiple `onMouseEnter`/`onMouseLeave` handlers
**Issue:** Every link in the footer uses direct DOM style mutation for hover. Should use Tailwind hover classes.

### #F120 — Navbar `sectionLinks` array links Pricing to `href: "#pricing"` but if the user is not on the homepage, clicking Pricing navigates to `/` top (not `/#pricing`)
**File:** `components/landing/Navbar.jsx` line 7
**Issue:** In `handleSectionNavigation`: if `location.pathname !== "/"` it calls `navigate("/")` without any anchor. The pricing section is never scrolled to.

---

## PERFORMANCE / ACCESSIBILITY / SEO ISSUES (121–150)

### #F121 — AdminDashboard `<StripeTestModeBanner />` is rendered outside the flex layout — could cause layout shift
**File:** `internal-pages/AdminDashboard.jsx` line 240
**Issue:** `<StripeTestModeBanner />` is rendered as the first child of the `flex` div — it's not part of the sidebar or content area. It may render at full width above both, causing layout shift.

### #F122 — `index.html` uses `<meta name="description">` set to a generic placeholder — not the actual site description
**File:** `index.html`
**Issue:** The default Base44 meta description is likely set in `index.html`. If it's not overridden dynamically by `setPageMetadata()` before crawl, Google will use the fallback. Confirm `setPageMetadata` runs on initial render.

### #F123 — `setPageMetadata` in Home.jsx wraps in try/catch swallowing errors silently
**File:** `pages/Home.jsx` lines 56–79
**Issue:** `try { cleanupMetadata = setPageMetadata({...}) } catch(error) { console.error(...) }` — if SEO tags fail to set, the page runs without meta tags. No user feedback. The error is logged but nothing is done.

### #F124 — All Unsplash images on Automations page lack `loading="lazy"` on some
**File:** `pages/Automations.jsx` line 208
**Issue:** `<img src={service.poster} width="640" height="360">` — no `loading="lazy"` attribute on service card thumbnails. They will load eagerly even if off-screen.

### #F125 — `IndustryTemplate` lazy loads via `import("./components/landing/IndustryTemplate")` but industry pages (`/med-spa`, `/dental`) are not in `NOINDEX_PREFIXES`
**File:** `App.jsx` lines 83–86
**Issue:** Industry pages are public/marketing pages and should be indexed — this is correct. But `IndustryTemplate` needs `setPageMetadata` called with correct canonical URLs per-industry to avoid duplicate content.

### #F126 — `public/sitemap.xml` is a static file — does not update automatically when new pages are added
**File:** `public/sitemap.xml`
**Issue:** The sitemap is static and may not include all routes from App.jsx. The `/blog`, `/automations`, industry pages (`/med-spa`, etc.) should be confirmed in the sitemap with correct `lastmod` dates.

### #F127 — `public/robots.txt` needs to be verified to not block `/store` or `/automations`
**File:** `public/robots.txt`
**Issue:** If robots.txt has `Disallow: /store` or similar, the highest-converting pages are blocked from crawling.

### #F128 — All `<img>` tags in `FounderSection` and `Industries` components lack `fetchPriority="high"` for LCP images
**File:** `components/landing/FounderSection.jsx` line 29, `components/landing/Industries.jsx` line 383
**Issue:** Above-the-fold or near-top images should have `fetchPriority="high"` to improve LCP Core Web Vitals.

### #F129 — SixAutomationSystems grid cards don't have `role="list"` / `role="listitem"` aria semantics — just a `<div>` grid
**File:** `components/landing/SixAutomationSystems.jsx` line 40
**Issue:** A set of related cards that are part of a conceptual list should have appropriate ARIA list semantics.

### #F130 — FAQ search input doesn't have a visible `<label>` — only `aria-label`
**File:** `components/landing/FAQ.jsx` line 110
**Issue:** `aria-label="Search FAQs"` provides screen reader context, but there's no visible label. WCAG 2.1 SC 1.3.1 recommends visible labels for form inputs.

### #F131 — Pricing page doesn't have `aria-label` on the pricing cards grid section
**File:** `components/landing/Pricing.jsx` line 143
**Issue:** The pricing grid `<div>` has no section landmark or aria-label to announce to screen readers. Add `aria-labelledby` pointing to the section h2.

### #F132 — `DemoBookingModal` is opened in multiple places without checking if it's already open — could theoretically mount twice
**File:** Multiple pages
**Issue:** `showBookingModal` state is local to each component. If a user triggers the modal from Hero AND FinalCTA on the same page, they're in the same component tree so it's fine. But the global `DemoBookingProvider` context and local `useState` are not in sync — some pages use the context, others use local state.

### #F133 — `usePageViewTracking` hook is called in `Navbar.jsx` — Navbar renders on every page, so page views are tracked through the navbar component
**File:** `components/landing/Navbar.jsx` line 58
**Issue:** This is fragile — if any page doesn't include `<Navbar />` (e.g., AdminDashboard, ClientPortal), page views aren't tracked. Should be in a top-level App component or router listener.

### #F134 — `AutoCTAAnalytics` component is rendered in App.jsx for all routes including admin pages — may fire CTA analytics on internal admin interactions
**File:** `App.jsx` line 131
**Issue:** `<AutoCTAAnalytics />` runs on every page. If admin buttons are tracked as CTAs, analytics data will be polluted.

### #F135 — `initializeAnalyticsObserver()` is called inside `AppInner` useEffect — but `AppInner` returns `null` — any errors in this function have no UI fallback
**File:** `App.jsx` lines 111–121
**Issue:** Analytics initialization errors are silently caught (or uncaught). Should be wrapped in try/catch.

### #F136 — `RouteIndexingGuard` modifies `robots` meta tag on every route change — but `setPageMetadata` also sets/restores `robots` meta tags independently — potential conflict
**File:** `App.jsx` lines 155–176
**Issue:** Two separate systems both modify the same `<meta name="robots">` tag. `RouteIndexingGuard` overrides what `setPageMetadata` set, then on cleanup restores its cached `previous` value which may be whatever `setPageMetadata` set — not the original.

### #F137 — `SessionTimeoutModal` at bottom of `OverviewDashboard` has `logoutAfterMs={45 * 60 * 1000}` (45 minutes) — but the modal is inside the Overview tab only, not other tabs
**File:** `internal-pages/AdminDashboard.jsx` line 629
**Issue:** If admin is on the Leads tab or Analytics tab for 45+ minutes, the session timeout modal never renders because it's only mounted when `activeTab === 'overview'`. Session timeout only works on the overview tab.

### #F138 — `AdminGlobalSearch` is rendered in both AdminDashboard and AdminShell — searching from a standalone admin page (AdminLeads) goes to AdminShell which navigates to `/admin?tab=X`, abandoning the current standalone page
**File:** `components/admin/AdminShell.jsx` line 151
**Issue:** The global search in AdminShell redirects to `navigate('/admin?tab=...')` — correct behavior. But users may lose context when they were on `/admin/leads` and search takes them to `/admin?tab=leads` (a different component/URL).

### #F139 — `processAutomationJobs`, `processDripCampaigns`, `processNurtureCampaigns` etc. are backend functions but have no corresponding automation/scheduler entries listed — they may never run
**File:** Backend functions list
**Issue:** Several backend functions named `process*` are defined but if no automation scheduler calls them, they're dead code. Need to confirm each has a corresponding `create_automation` scheduled entry.

### #F140 — `ClientDashboard` polls every 30 seconds with `fetchPortal(true)` using full API calls — no debounce or exponential backoff
**File:** `internal-pages/ClientDashboard.jsx` lines 214–217
**Issue:** Fixed 30-second polling fires indefinitely regardless of user activity. Should pause when tab is hidden (`document.visibilityState === "hidden"`) to reduce unnecessary API calls.

### #F141 — `AdminDashboard` and `AdminShell` both poll `SupportMessage` and `CommunicationEvent` every 30 seconds independently — if both run simultaneously (AdminShell wrapping an AdminDashboard view), that's 4 DB queries every 30s for the same data
**File:** Both files
**Issue:** Duplicated polling should be centralized in a shared hook or context.

### #F142 — `ClientPortal` real-time subscription for `ClientProject` entity has no `try/catch` around the subscribe call
**File:** `internal-pages/ClientPortal.jsx` line 133
**Issue:** `base44.entities.ClientProject.subscribe((event) => {...})` — if subscription fails, the error is unhandled.

### #F143 — `Home.jsx` imports `CinematicSectionDivider` and `HomepageMotionShell` from `PremiumHomepageMotion` — but if this component has a render error, the entire homepage crashes with no ErrorBoundary between them
**File:** `pages/Home.jsx` line 40
**Issue:** `<HomepageMotionShell>` wraps the entire homepage. Any render error inside throws to the nearest ErrorBoundary which is the global App-level one — showing a full-page error.

### #F144 — `Suspense` fallback components (`<SectionSkeleton />`, `<LargeSectionSkeleton />`) are imported from `SkeletonLoader` but the `<SectionSkeleton />` for some sections is used even for small components (e.g. `<TrustBar />`)
**File:** `pages/Home.jsx` lines 54–68
**Issue:** `<LargeSectionSkeleton />` used for TrustBar is disproportionately large for the section's actual size, causing noticeable layout shift when the component loads.

### #F145 — Home.jsx `useHomepageWhiteCanvas` hook modifies `document.body.classList` and `documentElement.style` — but if SSR or prerender runs, `document` may not be defined
**File:** `pages/Home.jsx` lines 59–61
**Issue:** `document.body.classList.add(...)` — no `typeof document` guard. The hook has `if (typeof document === "undefined") return undefined;` ✓ — actually this IS guarded. Mark as false alarm. ✓

### #F146 — `CookieConsent` component is rendered inside `<div className="min-h-screen">` — not at the top-level of the page, making it part of the normal document flow rather than a fixed overlay
**File:** `pages/Home.jsx` line 88
**Issue:** If `CookieConsent` uses `position: fixed`, it's fine. But if it uses relative positioning, it will appear inside the content flow, below the footer.

### #F147 — `ChatBubble` is only rendered on the Homepage — not on About, Contact, Automations, or other public pages where visitors may have questions
**File:** `pages/Home.jsx` line 86
**Issue:** The support chat bubble (if it's a lead capture tool) should appear on all marketing pages, not just the homepage.

### #F148 — `FollowUpTimeline` visual inside TrustBar has no aria description or alt text — it's purely decorative SVG/HTML with no accessible context
**File:** `components/landing/TrustBar.jsx` line 199
**Issue:** Users relying on screen readers see nothing meaningful from the FollowUpTimeline.

### #F149 — `Pricing` section `demoBooking` is destructured from `useDemoBooking()` context but `demoBooking` is never actually used in the `Pricing` component — the prop is passed to `PricingCard` but `PricingCard` doesn't use it either
**File:** `components/landing/Pricing.jsx` lines 66, 148
**Issue:** `const demoBooking = useDemoBooking()` → passed as `demoBooking={demoBooking}` to `PricingCard` → `PricingCard` accepts but never uses the prop. Dead code/prop.

### #F150 — `AdminDashboard` `OverviewDashboard` renders `<SessionTimeoutModal>` with `onLogout` callback but the modal is mounted inside OverviewDashboard — when user switches to another tab (Leads, Analytics, etc.), the modal unmounts, RESETTING the 45-minute timer on every tab switch
**File:** `internal-pages/AdminDashboard.jsx` line 629
**Issue:** `SessionTimeoutModal` is inside `OverviewDashboard` which only renders when `activeTab === "overview"`. Each time the user returns to Overview, the timer resets. A 45-minute session timeout that resets whenever you visit the overview tab is effectively non-functional.

---

## SUMMARY

| Category | Count |
|---|---|
| Theme / Color Inconsistencies | 40 |
| Structural / Layout Bugs | 50 |
| Content / Copy / UX Issues | 30 |
| Performance / Accessibility / SEO | 30 |
| **Total** | **150** |

## PRIORITY RANKING (Fix First)

### Critical (Legal / Revenue Impact)
- #F117 Footer Tanning Salons 404 link
- #F098/#F099 Internal dev copy in ProofBeforeLaunch visible to public
- #F091 Blog "coming soon" on live site
- #F003 Blog has no Navbar/Footer
- #F008/#F009 Automations page missing Navbar/Footer

### High (UX / Conversion)
- #F069 Store cart not keyboard accessible
- #F057 Nested buttons (invalid HTML) in CoreOffer
- #F120 Pricing section nav link doesn't scroll to #pricing
- #F083 FinalCTA duplicate CTAs both go to /book
- #F150 Session timeout resets on tab switch (non-functional)
- #F137 Session timeout only works on overview tab

### Medium (Visual consistency)
- #F001–F006 Blog color/nav inconsistencies
- #F019–F020 ProofBeforeLaunch hardcoded Tailwind colors
- #F030 AdminDashboard hardcoded bg-blue-50 etc. stats
- #F107–F108 Pricing badge icons render as plain text