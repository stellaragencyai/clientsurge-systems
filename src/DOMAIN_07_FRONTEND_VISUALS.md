# 🎨 DOMAIN 07 — Frontend, Visuals & UI/UX
> **Business Area:** UI consistency, dark mode, CTA standards, mobile UX, store UX, animations, industry pages, testimonials, forms  
> **~48 tasks** (incl. 20 new 📱 Mobile/Device tasks) | Last updated: 2026-05-03  
> **Agents who touch this:** Agent A (all frontend)
> **📱 Device targets:** iPhone 12 (375px) · iPhone 15 (393px) · iPhone 17 Pro Max (430px) · iPad (768/1024px) · Safari 16/17

---

## 📊 DOMAIN HEALTH: 🟢 97% Ready (34/35 done · 0 critical open · 1 dep-blocked)
> ⚡ **Fastest win:** M04 — Hero headline 375px audit (~20 min, no deps) · Agent A
> ⚠️ **Critical:** none currently open

---

## ⏱️ SPRINT SNAPSHOT — updated each session
| Metric | Value |
|---|---|
| 🔴 Unblocked Critical | 0 |
| 🟠 Fastest Win (< 30 min, no deps) | #M09 iOS input zoom (30 min), #M01 100svh fix (20 min), #M08 Safari blur flicker (15 min) |
| 🧱 Longest Blocked Chain | #27 (ThemeProvider) → #26 (dark mode toggle) |
| ✅ Done This Week | 34 tasks (#1,2,3,5,11,16,17,25,29,35,36,38,42,43,44,45,49,51,52,55,76,77 + M01,M02,M03,M05,M06,M07,M08,M09,M10,M11,M12,M13,M14,M15,M16,M17,M18,M19) + CTA pass (28a–28d) |
| 🎯 Est. Hours to Domain Complete | ~18 hrs |
| 📱 Next 5 Priority Tasks | M04 (Hero headline 375px), #54 (stale date/time input row), M20 (full device pass), #15 (stale time slot grid), #12 (LegalPage navbar) |

---

## 🔴 CRITICAL

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 76 | ✅ | Verify Stripe publishable key is ONLY in frontend (not sk_live_ anywhere) | Morpheus | — | — | 🧵 Stripe-Live | Done |

---

## 🟠 HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 11 | ✅ | Build out pages/ThankYou — fully built with animated checkmark, plan card, next-steps, contact | A | — | — | — | ~1 hr |
| 35 | ✅ | Testimonials: replaced broken Unsplash URLs with initials-based gradient avatars | A | — | — | — | ~30 min |
| 36 | ✅ | Favicon + apple-touch-icon already present in index.html — verified | A | — | — | — | ~20 min |
| 51 | ✅ | pages/Book Calendly iframe: set width:100%, height:700px, scrolling:yes | Morpheus | — | — | — | Done |
| 53 | ✅ | Audit all form inputs for iOS zoom issue (font-size < 16px) | Morpheus | — | — | 🧵 Mobile-UX | Done |
| 55 | ✅ | pages/Book Calendly: test CSP allows calendly.com frames on live domain | Morpheus | — | — | — | Done |
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
| 28 | ✅ | Standardize primary CTAs to blue gradient; gold = store/checkout only | A | — | — | 🧵 CTA-Standards | ~1 hr |
| 28a | ✅ | StickyCTA: replace brown gradient "Book Your Free Demo" with blue | A | — | — | 🧵 CTA-Standards | ~10 min |
| 28b | ✅ | MobileCallBar: replace brown "Book Free Demo" button with blue gradient | A | — | — | 🧵 CTA-Standards | ~10 min |
| 28c | ✅ | MobileCallBar: replace brown tint on "Call Now" button with blue tint | A | — | — | 🧵 CTA-Standards | ~5 min |
| 28d | ✅ | Pricing: replace hidden brown demo button at bottom with blue gradient | A | — | — | 🧵 CTA-Standards | ~5 min |
| 31 | ⏳ | pages/Industries: add gradient hero section with industry grid icons | A | — | — | — | ~1 hr |
| 33 | ⏳ | Mobile sticky cart bar: add padding-top: 72px to main content when visible | A | — | — | 🧵 Mobile-UX | ~20 min |
| 34 | ⏳ | AdminDashboard sidebar: add active-state highlight on current route | A | — | — | — | ~20 min |
| 41 | ⏳ | Store page initial load: show 6 ProductCard skeletons for 300ms then reveal | A | — | — | — | ~45 min |
| 42 | ✅ | Store ProductCard on mobile (375px): reduce "Add to Cart" font to 10px | Morpheus | — | — | 🧵 Mobile-UX | Done |
| 44 | ✅ | Mobile sticky cart bar: add circular badge with items.length count | Morpheus | — | — | 🧵 Mobile-UX | Done |
| 45 | ✅ | Store page: add "Talk to a Human" escape valve CTA below product grid | Morpheus | — | — | 🧵 CTA-Standards | Done |
| 49 | ✅ | Store: Guided mode no industry → show all non-coming-soon products | Morpheus | — | — | — | Done |
| 52 | ✅ | MobileCallBar: pull phone number from AdminSettings instead of hardcoding | Morpheus | — | — | 🧵 Mobile-UX | Done |
| 54 | ⏳ | DemoBookingModal step 2: set min-height:48px on date/time inputs | A | — | — | 🧵 Mobile-UX | ~10 min |
| 73 | ⏳ | chatBubbleAI: add typing indicator ("...") while LLM processes response | A | — | — | — | ~20 min |
| 74 | ⏳ | chatBubbleAI: add sessionStorage counter, block after 10 messages per session | A | — | — | — | ~30 min |
| 79 | ⏳ | pages/Success: verify content is correct and not stale | A | — | — | — | ~15 min |

---

## 📱 MOBILE / DEVICE-SPECIFIC (iPhone 12 · iPhone 15 · iPhone 17 Pro Max · iPad · Safari)

> These tasks ensure pixel-perfect rendering and interaction on all target Apple devices.

| # | Status | Task | Agent | Device Target | Thread | Est. Time |
|---|---|---|---|---|---|---|
| M01 | ✅ | iOS Safari: audit all `min-height: 100vh` — replace with `100svh` (Dynamic Island safe) | A | iPhone 15, 17 Pro Max | 🧵 Mobile-UX | ~20 min |
| M02 | ✅ | iPhone notch/Dynamic Island: verify `padding-top: env(safe-area-inset-top)` on Navbar — added via @supports in index.css | A | iPhone 15, 17 Pro Max | 🧵 Mobile-UX | ~15 min |
| M03 | ✅ | iOS Safari: test body scroll lock — `position: fixed` + `top: -scrollY` pattern (current `acquireBodyScrollLock` may not work on Safari 17) | Morpheus | All iPhone / Safari | 🧵 Mobile-UX | Done |
| M04 | ⏳ | iPhone 12 (375px): audit Hero headline — ensure `clamp()` font doesn't overflow or wrap awkwardly at 375px | A | iPhone 12 | 🧵 Mobile-UX | ~20 min |
| M05 | ✅ | iPhone 17 Pro Max (430px): MobileCallBar safe-area bottom padding — `.safe-area-bottom-bar` class + inline style applied | A | iPhone 17 Pro Max | 🧵 Mobile-UX | ~15 min |
| M06 | ✅ | iPad (768px / 1024px): pricing cards grid — `.pricing-cards-grid` class + CSS 2-col override at 768–1023px | A | iPad | 🧵 Mobile-UX | ~20 min |
| M07 | ✅ | iPad landscape (1024px): Navbar desktop links too cramped — audit at 1024px breakpoint | Morpheus | iPad landscape | 🧵 Mobile-UX | Done |
| M08 | ✅ | Safari 17: `backdrop-filter` with `blur()` causes flicker on scroll — add `transform: translateZ(0)` to Navbar | A | Safari / iPhone | 🧵 Mobile-UX | ~15 min |
| M09 | ✅ | iOS input zoom: ALL text inputs must be `font-size: 16px` min — audit DemoBookingModal (all inputs fixed with style={{ fontSize:"16px" }}) | A | All iPhone | 🧵 Mobile-UX | ~30 min |
| M10 | ✅ | iPhone 12/15: DemoBookingModal scrollable inside fixed overlay — test that form is reachable without browser chrome interfering | Morpheus | iPhone 12, 15 | 🧵 Mobile-UX | Done |
| M11 | ✅ | Safari: `position: sticky` navbar — `-webkit-sticky` added to index.css for all `.sticky` elements | A | All Safari | 🧵 Mobile-UX | ~10 min |
| M12 | ✅ | iPhone 12 (375px): Store page product grid — confirm single-column layout and no horizontal scroll leakage | Morpheus | iPhone 12 | 🧵 Mobile-UX | Done |
| M13 | ✅ | iPhone 17 Pro Max (430px): Hero CTA buttons — confirm min 44×44px touch target and no overlap with visual glow decorations | Morpheus | iPhone 17 Pro Max | 🧵 Mobile-UX | Done |
| M14 | ✅ | Safari: test `createPortal` DemoBookingModal renders correctly in Safari 16/17 (known z-index stacking context bugs) | Morpheus | Safari / iPhone | 🧵 Mobile-UX | Done |
| M15 | ✅ | iPad: Footer nav grid — `.footer-nav-grid` class + CSS 2-col override at 640–1023px | A | iPad | 🧵 Mobile-UX | ~15 min |
| M16 | ✅ | iPhone: Pricing "Most Popular" badge overflows card top on 375px — badge needs `position: relative` fallback at mobile | A | iPhone 12, 15 | 🧵 Mobile-UX | ~15 min |
| M17 | ✅ | iOS Safari: `<input type="date">` — `minHeight: 48px` + `fontSize: 16px` applied to date/time inputs in DemoBookingModal | A | All iPhone | 🧵 Mobile-UX | ~20 min |
| M18 | ✅ | iPhone: Navbar mobile menu — verify `acquireBodyScrollLock` fully prevents background page scroll on all iPhone models | Morpheus | All iPhone | 🧵 Mobile-UX | Done |
| M19 | ✅ | iPhone landscape: Hero `min-height: auto` override at `max-height: 500px + landscape` in index.css | A | iPhone 12, 15, 17 | 🧵 Mobile-UX | ~15 min |
| M20 | ⏳ | Full device test pass: manually test on iPhone 12 (375px), iPhone 15 (393px), iPhone 17 Pro Max (430px), iPad (768px) — document any layout breaks | A | All Apple devices | 🧵 Mobile-UX | ~2 hrs |

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
| 76 | Stripe frontend secret exposure audit | Morpheus | 2026-05-21 | Added `tests/frontendSecretExposure.test.js` to scan frontend source/public assets for real Stripe/server-side secret key formats and verified no `sk_live_` exposure in frontend code |
| 53 | iOS form input zoom audit | Morpheus | 2026-05-21 | Added a mobile global form-control font-size guard in `src/index.css` and `tests/iosInputZoomGuard.test.js` so text, date, time, URL, textarea, and select controls stay at 16px on mobile Safari |
| 45 | Store human fallback CTA | Morpheus | 2026-05-21 | Moved the store escape-valve CTA directly below the product grid with a clear Talk to a Human path to `/book` and regression coverage |
| M03 | iOS body scroll lock verification | Morpheus | 2026-05-21 | Added `tests/bodyScrollLock.test.js` to verify stacked overlay locks preserve `nav-open` and `--scroll-lock-top` until final release; removed direct Navbar class/style clearing so shared lock ownership is not bypassed |
| M07 | iPad landscape navbar audit | Morpheus | 2026-05-21 | Shifted desktop nav links/actions from `lg` to `xl` so 1024px iPad landscape uses the compact menu instead of cramped centered desktop navigation; added regression coverage in `tests/navbarVisualPolish.test.js` |
