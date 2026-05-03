# 🎨 DOMAIN 07 — Frontend, Visuals & UI/UX
> **Business Area:** UI consistency, dark mode, CTA standards, mobile UX, store UX, animations, industry pages, testimonials, forms  
> **~28 tasks** | Last updated: 2026-05-03  
> **Agents who touch this:** Agent A (all frontend)

---

## 📊 DOMAIN HEALTH: 🟡 32% Ready (9/28 done · 1 critical open · 1 dep-blocked)
> ⚡ **Fastest win:** #17 — FAQ mobile tap target (~10 min, no deps) · Agent A  
> ⚠️ **Critical:** #76 — verify sk_live_ key exposure (~20 min, zero deps — do this first every session)

---

## ⏱️ SPRINT SNAPSHOT — updated each session
| Metric | Value |
|---|---|
| 🔴 Unblocked Critical | 1 (#76 — Stripe key audit, ~20 min) |
| 🟠 Fastest Win (< 30 min, no deps) | #17 FAQ tap target (10 min), #16 CookieConsent offset (10 min), #42 font size (10 min) |
| 🧱 Longest Blocked Chain | #27 (ThemeProvider) → #26 (dark mode toggle) |
| ✅ Done This Week | 9 tasks (#1, #2, #3, #5, #25, #29, #38, #43, #77) |
| 🎯 Est. Hours to Domain Complete | ~19 hrs |

---

## 🔴 CRITICAL

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 76 | ⏳ | Verify Stripe publishable key is ONLY in frontend (not sk_live_ anywhere) | A | — | — | 🧵 Stripe-Live | ~20 min |

---

## 🟠 HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 11 | ⏳ | Build out pages/ThankYou — currently a blank page | A | — | — | — | ~1 hr |
| 35 | ⏳ | Testimonials: replace broken image URLs with initials-based avatar fallbacks | A | — | — | — | ~30 min |
| 36 | ⏳ | Add favicon (32x32 + 180x180) and apple-touch-icon to index.html | A | — | — | — | ~20 min |
| 51 | ⏳ | pages/Book Calendly iframe: set width:100%, height:700px, scrolling:yes | A | — | — | — | ~20 min |
| 53 | ⏳ | Audit all form inputs for iOS zoom issue (font-size < 16px) | A | — | — | 🧵 Mobile-UX | ~45 min |
| 55 | ⏳ | pages/Book Calendly: test CSP allows calendly.com frames on live domain | A | — | — | — | ~30 min |
| 67 | ⏳ | ClientPortal: add "Get Help" tab with support ticket form → SupportMessage entity | A | — | — | — | ~1 hr |
| 80 | ⏳ | Onboarding page: ensure form validates all required fields before submit | A | — | — | — | ~30 min |
| 243 | ⏳ | Final: test all CTA buttons across mobile (375px, 390px, 414px) | A | — | → ALL sign-off | 🧵 Mobile-UX | ~1 hr |

---

## 🟡 MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 12 | ⏳ 🟢 | Add Navbar to LegalPage — currently renders with no header/branding | A | — | — | — | ~15 min |
| 14 | ⏳ 🟢 | ClientPortal loading state: replace spinner with branded skeleton | A | — | — | — | ~30 min |
| 15 | ⏳ 🟢 | DemoBookingModal time slot grid: force 2-col on viewports < 480px | A | — | — | 🧵 Mobile-UX | ~20 min |
| 26 | ⏳ | Add dark mode ☀️/🌙 toggle to Navbar desktop + mobile menu | A | #27 | — | 🧵 Dark-Mode | ~30 min |
| 27 | 🔄 | Implement ThemeProvider from next-themes so dark mode class is applied | A | — | → A (#26 toggle) | 🧵 Dark-Mode | ~45 min |
| 28 | 🔄 | Standardize primary CTAs to blue gradient; gold = store/checkout only | A | — | — | 🧵 CTA-Standards | ~1 hr |
| 31 | ⏳ | pages/Industries: add gradient hero section with industry grid icons | A | — | — | — | ~1 hr |
| 33 | ⏳ | Mobile sticky cart bar: add padding-top: 72px to main content when visible | A | — | — | 🧵 Mobile-UX | ~20 min |
| 34 | ⏳ | AdminDashboard sidebar: add active-state highlight on current route | A | — | — | — | ~20 min |
| 41 | ⏳ | Store page initial load: show 6 ProductCard skeletons for 300ms then reveal | A | — | — | — | ~45 min |
| 42 | ⏳ | Store ProductCard on mobile (375px): reduce "Add to Cart" font to 10px | A | — | — | 🧵 Mobile-UX | ~10 min |
| 44 | ⏳ | Mobile sticky cart bar: add circular badge with items.length count | A | — | — | 🧵 Mobile-UX | ~15 min |
| 45 | ⏳ | Store page: add "Talk to a Human" escape valve CTA below product grid | A | — | — | 🧵 CTA-Standards | ~20 min |
| 49 | ⏳ | Store: Guided mode no industry → show all non-coming-soon products | A | — | — | — | ~30 min |
| 52 | ⏳ | MobileCallBar: pull phone number from AdminSettings instead of hardcoding | A | — | — | 🧵 Mobile-UX | ~30 min |
| 54 | ⏳ | DemoBookingModal step 2: set min-height:48px on date/time inputs | A | — | — | 🧵 Mobile-UX | ~10 min |
| 73 | ⏳ | chatBubbleAI: add typing indicator ("...") while LLM processes response | A | — | — | — | ~20 min |
| 74 | ⏳ | chatBubbleAI: add sessionStorage counter, block after 10 messages per session | A | — | — | — | ~30 min |
| 79 | ⏳ | pages/Success: verify content is correct and not stale | A | — | — | — | ~15 min |

---

## ⚪ LOW

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 13 | ⏳ 🟢 | Standardize all form inputs to rounded-xl (12px) globally | A | — | — | — | ~30 min |
| 16 | ⏳ 🟢 | CookieConsent banner: add bottom: 80px on mobile (avoid MobileCallBar overlap) | A | — | — | 🧵 Mobile-UX | ~10 min |
| 17 | ⏳ 🟢 | FAQ accordion: add border-bottom tap target on mobile | A | — | — | 🧵 Mobile-UX | ~10 min |
| 30 | ⏳ | Add framer-motion + canvas-confetti to Contact page success state | A | — | — | — | ~30 min |
| 32 | ⏳ | Industry pages: give each card a unique accent color or icon style | A | — | — | — | ~30 min |
| 37 | ⏳ | GuidedPathToggle: add Tooltip explaining Guided vs Explore All modes | A | — | — | — | ~15 min |
| 40 | ⏳ | Mobile nav: show logged-in user name/role after nav links | A | — | — | 🧵 Mobile-UX | ~20 min |
| 46 | ⏳ | AdminDashboard sidebar: wire AdminGlobalSearch to all entity types | A | — | — | — | ~1 hr |
| 48 | ⏳ | CartSidebar: show empty state with top 3 popular nudge tiles | A | — | — | — | ~30 min |
| 50 | ⏳ | ProductCard "see more features" button should open ServiceDetailModal | A | — | — | — | ~20 min |
| 68 | ⏳ | ClientPortal: add "What's New" section reading from Changelog entity | A | — | — | — | ~45 min |
| 69 | ⏳ | ClientPortal: add "Refer a Business" section with unique referral link | A | — | — | — | ~30 min |
| 71 | ⏳ | BillingDashboard: add "Download Invoice PDF" using Stripe invoice_pdf URL | A | — | — | — | ~20 min |
| 75 | ⏳ | Add session timeout warning modal after 30min admin inactivity | A | — | — | — | ~45 min |

---

## ✅ COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| 1 | Store UI product cards with correct pricing | Agent A | 2026-05-03 | Rewrote `ProductCard` with correct setup/monthly price display from `salesCatalog.js` |
| 2 | Cart sidebar body scroll lock on mobile | Agent A | 2026-05-03 | Added `bodyScrollLock` via `lib/bodyScrollLock.js` in `CartSidebar` open/close |
| 3 | "No setup fee" label instead of "$0 setup" | Agent A | 2026-05-03 | Conditional label in `ProductCard` — shows "No setup fee" when `setup_fee === 0` |
| 5 | SMS consent checkbox in CartSidebar | Agent A | 2026-05-03 | Added TCPA consent checkbox in `CartSidebar` before checkout button |
| 25 | React.StrictMode in main.jsx (dev only) | Agent A | 2026-05-03 | Wrapped `<App>` in `<React.StrictMode>` inside `if (import.meta.env.DEV)` block |
| 29 | PageNotFound (404) redesigned with logo + CTAs | Agent A | 2026-05-03 | Rewrote `lib/PageNotFound.jsx` with branded layout, Home + Book Demo CTAs |
| 38 | ClientPortal: "Setup Progress" is first/default tab | Agent A | 2026-05-03 | Changed default `activeTab` state to `"progress"` in `ClientPortal.jsx` |
| 43 | CartSidebar: acquireBodyScrollLock on open/close | Agent A (🔄) | 2026-05-03 | Confirmed `bodyScrollLock` properly acquired/released in `CartSidebar` useEffect |
| 77 | Portal graceful empty state — no nav errors on null project | Agent A | 2026-05-03 | Added null-guards and empty state UI in `ClientPortal.jsx` when `project === null` |