# Task Authenticity Audit — 2026-05-03

This audit treats the task list as a set of claims, not a source of truth. Each row below says whether the claim is actually supported by repo evidence, only partially implemented, duplicated elsewhere, or impossible to verify from code alone.

## Baseline

- Source backlog: `src/MASTER_TASK_LIST.md`
- Parsed task rows: 301
- Parsed status counts: ✅ 21, 🔄 13, ⏳ 267, ❌ 0
- Duplicate numbering issue: task #213 appears 2 times
- Verification baseline: `npm test`, `npm run lint`, and `npm run build` all pass on 2026-05-03

## Legend

- `Verified complete (repo)`: code and/or tests support the claim inside this repository
- `Stale pending`: the list says pending, but the repo already contains the feature or a close equivalent
- `Claim overstated`: the list says complete, but the current repo does not actually satisfy the task
- `Partial`: some real scaffolding exists, but the acceptance criteria are not met end to end
- `Duplicate / overlap`: this row should be merged into another task instead of tracked separately
- `Live / ops verification required`: cannot honestly be called green from repo code alone
- `Valid pending`: still a real task, but no trustworthy completion evidence was found

## SECTION 1: PRE-LAUNCH FRONTEND (Original List #1–#50)

- **#1** [claim: Complete] Finalize store UI product cards with correct pricing display
  Audit: Verified complete (repo).
  Evidence: `src/components/store/ProductCard.jsx`, `src/lib/salesCatalog.js`, `tests/salesCatalog.test.js`.
  Tested: Indirectly covered by `npm test`; no dedicated visual regression.
  🟩 Done: Product cards render canonical `monthly_fee` and `setup_fee` data from the store catalog.
  🟨 Missing: Add browser-level pricing assertions if this should remain green over time.

- **#2** [claim: Pending] Fix cart sidebar body scroll lock on mobile
  Audit: Valid pending implementation task.
  Evidence: `src/components/store/CartSidebar.jsx`, `src/lib/bodyScrollLock.js`.
  Tested: Code inspection only.
  🟩 Done: A shared body-scroll-lock helper exists and other overlays already use it.
  🟨 Missing: CartSidebar does not import or apply `acquireBodyScrollLock()` on open/close.

- **#3** [claim: Pending] Add "No setup fee" label instead of "$0 setup"
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#4** [claim: Complete] Add search debounce (280ms) to store search input
  Audit: Verified complete (repo).
  Evidence: `src/pages/Store.jsx`.
  Tested: Code inspection plus passing `npm test` / `npm run build`.
  🟩 Done: Store search keeps separate input state and applies a 280ms debounce before filtering.
  🟨 Missing: Add a UI test if you want the backlog to treat this as permanently protected.

- **#5** [claim: Pending] Add SMS consent checkbox in CartSidebar when phone is entered
  Audit: Valid pending implementation task.
  Evidence: `src/components/store/CartSidebar.jsx`, `base44/functions/createCheckoutSession/entry.ts`.
  Tested: Code inspection only.
  🟩 Done: Checkout now expects explicit legal acceptance on the backend.
  🟨 Missing: CartSidebar does not render an SMS consent checkbox and does not send `accepted_legal` to checkout.

- **#6** [claim: Pending] Add `loading="lazy"` + explicit width/height to all below-fold images
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#7** [claim: Pending] Add `<link rel="preload">` for hero image in index.html
  Audit: Valid pending implementation task.
  Evidence: `index.html`, `src/lib/seo.js`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: index.html, src/lib/seo.js.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#8** [claim: Pending] Split recharts/framer-motion into separate Vite chunks via manualChunks
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#9** [claim: Pending] Add font-display: swap fallback for Inter/Playfair to prevent FOUT
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#10** [claim: Pending] Store page: implement intersection-observer lazy rendering for 8+ products
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Store.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Store.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#11** [claim: Complete] Build out pages/ThankYou — currently a blank page
  Audit: Verified complete (repo).
  Evidence: `src/pages/ThankYou.jsx`.
  Tested: Code inspection; covered by passing build, but not separately acceptance-tested.
  🟩 Done: The `ThankYou` route now renders a full confirmation experience instead of a blank page.
  🟨 Missing: Add focused acceptance coverage if you want stronger long-term proof than repo inspection.

- **#12** [claim: Pending] Add Navbar to LegalPage — currently renders with no header/branding
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#13** [claim: Pending] Standardize all form inputs to rounded-xl (12px) globally
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#14** [claim: Pending] ClientPortal loading state: replace raw spinner with branded skeleton
  Audit: Valid pending implementation task.
  Evidence: `src/pages/ClientPortal.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/ClientPortal.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#15** [claim: Pending] DemoBookingModal time slot grid: force 2-col on viewports < 480px
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#16** [claim: Pending] CookieConsent banner: add bottom: 80px on mobile to avoid MobileCallBar overlap
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#17** [claim: Pending] FAQ accordion items: add border-bottom tap target on mobile
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#18** [claim: Pending] Industry sub-pages: ensure hero headline renders as semantic `<h1>` tag
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#19** [claim: Pending] Add descriptive alt text to all hero, testimonial, and TrustBar images
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#20** [claim: Pending] Fix robots.txt: change Disallow: /leads/ to Disallow: /leads/admin
  Audit: Valid pending implementation task.
  Evidence: `public/robots.txt`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: public/robots.txt.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#21** [claim: Pending] Add hreflang tag to index.html for future i18n readiness
  Audit: Valid pending implementation task.
  Evidence: `index.html`, `src/lib/seo.js`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: index.html, src/lib/seo.js.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#22** [claim: Pending] Stub /blog route with 3 placeholder posts for organic SEO
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#23** [claim: Pending] Add React ErrorBoundary in App.jsx wrapping all routes
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#24** [claim: Pending] Set staleTime: 60_000 and retry: 1 in lib/query-client.js
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#25** [claim: Pending] Wrap App in React.StrictMode in main.jsx (dev only)
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION 2: VISUAL / THEME / UI CONSISTENCY

- **#26** [claim: Pending] Add dark mode ☀️/🌙 toggle to Navbar desktop + mobile menu
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#27** [claim: In Progress] Implement ThemeProvider from next-themes so dark mode class is actually applied
  Audit: In progress claim is weak; core requirement still missing.
  Evidence: `src/main.jsx`, `src/components/ui/sonner.jsx`.
  Tested: Code inspection only.
  🟩 Done: The codebase already depends on `next-themes` in the toast layer.
  🟨 Missing: Wrap the app in a real `ThemeProvider`, persist theme state, and ensure dark-mode classes reach the document root.

- **#28** [claim: In Progress] Standardize primary CTAs to blue gradient; gold = store/checkout only
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Store.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Store.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#29** [claim: Complete] Redesign PageNotFound (404) with logo, links, search bar
  Audit: Verified complete (repo).
  Evidence: `src/lib/PageNotFound.jsx`, `src/App.jsx`.
  Tested: Code inspection; covered by passing build, but not separately acceptance-tested.
  🟩 Done: A branded 404 component already exists and is wired through the app.
  🟨 Missing: Add focused acceptance coverage if you want stronger long-term proof than repo inspection.

- **#30** [claim: Pending] Add framer-motion + canvas-confetti to Contact page success state
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Contact.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Contact.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#31** [claim: Pending] pages/Industries: add gradient hero section with industry grid icons
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#32** [claim: Pending] Industry pages: give each card a unique accent color or icon style
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#33** [claim: Pending] Mobile sticky cart bar: add padding-top: 72px to main content when visible
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#34** [claim: Pending] AdminDashboard sidebar: add active-state highlight on current route
  Audit: Valid pending implementation task.
  Evidence: `src/pages/AdminDashboard.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/AdminDashboard.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#35** [claim: Pending] Testimonials: replace broken image URLs with initials-based avatar fallbacks
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#36** [claim: Pending] Add favicon (32x32 + 180x180) and apple-touch-icon to index.html
  Audit: Valid pending implementation task.
  Evidence: `index.html`, `src/lib/seo.js`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: index.html, src/lib/seo.js.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#37** [claim: Pending] GuidedPathToggle: add Tooltip explaining Guided vs Explore All modes
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#38** [claim: Complete] ClientPortal tabs: "Setup Progress" is now first tab and default landing tab on login
  Audit: Verified complete (repo, wording drift).
  Evidence: `src/pages/ClientPortal.jsx`.
  Tested: Code inspection plus portal tests in `npm test`.
  🟩 Done: The first/default portal tab resolves to `progress`, which is the build/setup progress view.
  🟨 Missing: If exact copy matters, rename `Build Progress` to `Setup Progress` to match the task text.

- **#39** [claim: Pending] Industry pages CTAs: use industry-specific headline copy from industryData.js
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#40** [claim: Pending] Mobile nav: show logged-in user name/role after nav links
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION 3: STORE PAGE UX

- **#41** [claim: Pending] Store page initial load: show 6 ProductCard skeletons for 300ms then reveal
  Audit: Valid pending implementation task.
  Evidence: `src/components/store/ProductCard.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/components/store/ProductCard.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#42** [claim: Pending] Store ProductCard on mobile (375px): reduce "Add to Cart" font to 10px
  Audit: Valid pending implementation task.
  Evidence: `src/components/store/ProductCard.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/components/store/ProductCard.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#43** [claim: In Progress] CartSidebar: apply acquireBodyScrollLock("cart-sidebar") on open, release on close
  Audit: In progress claim is weak; implementation missing.
  Evidence: `src/components/store/CartSidebar.jsx`, `src/lib/bodyScrollLock.js`.
  Tested: Code inspection only.
  🟩 Done: The shared scroll-lock utility exists and is already used by other overlays.
  🟨 Missing: Import it into `CartSidebar`, acquire on open, release on close/unmount, and add a regression test or browser check.

- **#44** [claim: Pending] Mobile sticky cart bar: add circular badge with items.length count
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#45** [claim: Pending] Store page: add "Talk to a Human" escape valve CTA below product grid
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Store.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Store.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#46** [claim: Pending] AdminDashboard sidebar: wire AdminGlobalSearch to all entity types
  Audit: Valid pending implementation task.
  Evidence: `src/pages/AdminDashboard.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/AdminDashboard.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#47** [claim: In Progress] Store SocialProofTicker: verify data is from real Orders (not hardcoded)
  Audit: In progress claim is weak; still hardcoded.
  Evidence: `src/components/store/SocialProofTicker.jsx`.
  Tested: Code inspection only.
  🟩 Done: The ticker UI exists and rotates messages.
  🟨 Missing: Replace the `mockPurchases` array with real order-backed data or explicitly mark the widget as demo-only.

- **#48** [claim: Pending] CartSidebar: show empty state with top 3 popular nudge tiles
  Audit: Valid pending implementation task.
  Evidence: `src/components/store/CartSidebar.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/components/store/CartSidebar.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#49** [claim: Pending] Store: Guided mode with no industry selected should show all non-coming-soon products
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Store.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Store.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#50** [claim: Pending] ProductCard "see more features" button should open ServiceDetailModal
  Audit: Valid pending implementation task.
  Evidence: `src/components/store/ProductCard.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/components/store/ProductCard.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION 4: MOBILE UX

- **#51** [claim: Pending] pages/Book Calendly iframe: set width:100%, height:700px, scrolling:yes
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#52** [claim: Pending] MobileCallBar: pull phone number from AdminSettings instead of hardcoding
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#53** [claim: Pending] Audit all form inputs for iOS zoom issue (font-size < 16px)
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#54** [claim: Pending] DemoBookingModal step 2: set min-height:48px on date/time inputs
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#55** [claim: Pending] pages/Book Calendly: test CSP allows calendly.com frames on live domain
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

## SECTION 5: SEO

- **#56** [claim: Pending] Industry pages: inject LocalBusiness + Service JSON-LD schema markup
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#57** [claim: Pending] Generate og:image (1200x630) and add to index.html + setPageMetadata
  Audit: Valid pending implementation task.
  Evidence: `src/lib/seo.js`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/lib/seo.js.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#58** [claim: Pending] Industry page titles: include city/location for local SEO signals
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#59** [claim: Pending] Add internal linking: Footer cross-links industry pages; Store links to industry pages
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Store.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Store.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#60** [claim: Complete] sitemap.xml: add all industry pages and core routes
  Audit: Verified complete (repo).
  Evidence: `public/sitemap.xml`.
  Tested: Code inspection only; no external crawler verification stored in repo.
  🟩 Done: Sitemap includes core routes and the six industry routes.
  🟨 Missing: Submit and validate in Search Console if you want a live-proof green status.

- **#61** [claim: Pending] Create generateSitemap backend function for dynamic sitemap at /sitemap.xml
  Audit: Valid pending implementation task.
  Evidence: `public/sitemap.xml`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: public/sitemap.xml.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION 6: PERFORMANCE

- **#62** [claim: Pending] Add manifest.json + minimal service worker for PWA installability
  Audit: Valid pending implementation task.
  Evidence: `index.html`, `src/lib/seo.js`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: index.html, src/lib/seo.js.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#63** [claim: Pending] Move all Recharts imports inside lazy() components — audit AdminDashboard/Portal
  Audit: Valid pending verification task.
  Evidence: `src/pages/AdminDashboard.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/AdminDashboard.jsx.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#64** [claim: Pending] Add ?w=800&q=80 Unsplash query params + srcSet to all hero/industry images
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#65** [claim: Pending] Remove three.js from package.json if not actively used (saves ~600KB)
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#66** [claim: Pending] Subset Google Fonts: Inter 400/500/600/700 + Playfair 400/600/700 only
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION 7: CLIENT EXPERIENCE (FRONTEND SIDE)

- **#67** [claim: Complete] ClientPortal: add "Get Help" tab with support ticket form → SupportMessage entity
  Audit: Verified complete (repo).
  Evidence: `src/pages/ClientPortal.jsx`, `src/components/portal/SupportChat.jsx`, `base44/entities/SupportMessage.jsonc`.
  Tested: Code inspection; covered by passing build, but not separately acceptance-tested.
  🟩 Done: The portal already has a `Support & Messaging` tab backed by `SupportMessage` writes.
  🟨 Missing: Add focused acceptance coverage if you want stronger long-term proof than repo inspection.

- **#68** [claim: Pending] ClientPortal: add "What's New" section reading from Changelog entity
  Audit: Valid pending implementation task.
  Evidence: `src/pages/ClientPortal.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/ClientPortal.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#69** [claim: Pending] ClientPortal: add "Refer a Business" section with unique referral link
  Audit: Valid pending implementation task.
  Evidence: `src/pages/ClientPortal.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/ClientPortal.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#70** [claim: In Progress] BillingDashboard: add "Cancel Subscription" → getStripeCustomerPortalUrl redirect
  Audit: Partial: payment portal exists, cancel flow does not match task.
  Evidence: `src/components/portal/BillingDashboard.jsx`, `base44/functions/getStripeCustomerPortalUrl/entry.ts`, `src/components/portal/PlanManager.jsx`.
  Tested: Code inspection only; no live portal proof.
  🟩 Done: Billing already opens Stripe/customer payment tooling, and PlanManager supports manual cancellation requests.
  🟨 Missing: Expose an explicit cancel-subscription CTA that intentionally routes to a verified working Stripe portal cancellation flow.

- **#71** [claim: Pending] BillingDashboard: add "Download Invoice PDF" using Stripe invoice_pdf URL
  Audit: Partial: feature exists in a different form.
  Evidence: `src/components/portal/BillingDashboard.jsx`, `base44/functions/createInvoicePaymentLink/entry.ts`.
  Tested: Code inspection only.
  🟩 Done: Billing already renders invoice rows with a PDF download icon when `pdf_url` is present.
  🟨 Missing: Decide whether the current icon-based download satisfies the task or whether you still want a dedicated button and explicit Stripe invoice proof.

- **#72** [claim: In Progress] ClientPortal: show "payment failed" banner when billing_status === "past_due"
  Audit: Partial: banner exists but is not wired where the task claims.
  Evidence: `src/components/portal/PaymentFailedBanner.jsx`, `src/pages/ClientPortal.jsx`.
  Tested: Code inspection only.
  🟩 Done: A payment-failed banner component exists and can detect past-due/unpaid states.
  🟨 Missing: Mount it in the portal flow and verify it keys off the canonical order/subscription state the task expects.

## SECTION 8: MISC FRONTEND

- **#73** [claim: Pending] chatBubbleAI: add typing indicator ("...") while LLM processes response
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#74** [claim: Pending] chatBubbleAI: add sessionStorage counter, block after 10 messages per session
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#75** [claim: Pending] Add session timeout warning modal after 30min admin inactivity
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#76** [claim: Pending] Verify Stripe publishable key is ONLY in frontend (not sk_live_ anywhere)
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#77** [claim: Complete] Portal graceful empty state — no navigation errors on null project
  Audit: Verified complete (repo).
  Evidence: `src/pages/ClientPortal.jsx`, `base44/functions/getClientPortalContext/entry.ts`, `tests/portalAndLaunchHardening.test.js`.
  Tested: Covered by `npm test` plus code inspection.
  🟩 Done: Portal returns a controlled empty/not-found state instead of breaking navigation when no project is linked.
  🟨 Missing: Production smoke-test the empty-state copy if you want live proof.

- **#78** [claim: Pending] Add cookie consent to all public lead capture forms
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#79** [claim: Pending] pages/Success: verify content is correct and not stale
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#80** [claim: Pending] Onboarding page: ensure form validates all required fields before submit
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Onboarding.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Onboarding.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#81** [claim: Pending] All pages: verify meta description is unique (not default fallback)
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#82** [claim: Complete] sitemap.xml updated with industry pages
  Audit: Duplicate / overlap with #60.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #60, then keep only one canonical acceptance criterion.

- **#83** [claim: Pending] pages/Industries: verify all 6 industry cards link to correct routes
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

## SECTION 9: SECURITY

- **#84** [claim: Pending] Add Origin header validation to submitLeadCapture + submitContactInquiry
  Audit: Valid pending implementation task.
  Evidence: `base44/functions/submitLeadCapture/entry.ts`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: base44/functions/submitLeadCapture/entry.ts.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#85** [claim: Pending] autoEndToEndTest: add admin role check (return 403 if not admin)
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#86** [claim: Pending] Move webhookLeadCapture secret from URL param to X-Webhook-Secret header
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#87** [claim: Pending] submitLeadCapture: normalize phone to E.164 (+1 prefix, reject < 10 digits)
  Audit: Valid pending implementation task.
  Evidence: `base44/functions/submitLeadCapture/entry.ts`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: base44/functions/submitLeadCapture/entry.ts.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#88** [claim: Pending] Add consent_given_at + consent_ip fields to WebsiteLead/Leads entities
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#89** [claim: Pending] Capture X-Forwarded-For IP in submitLeadCapture and store as consent_ip
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Store.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Store.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#90** [claim: Pending] Add IP allowlist option in AdminSettings for admin panel access
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#91** [claim: Pending] Create autoArchiveOldLeads: anonymize WebsiteLead records > 365 days old
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#92** [claim: Pending] Ensure honeypot website_url field is in ALL public forms (LeadCaptureForm, CaptureLeads)
  Audit: Valid pending implementation task.
  Evidence: `src/components/landing/LeadCaptureForm.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/components/landing/LeadCaptureForm.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#93** [claim: Pending] Add X-Frame-Options: DENY header to all backend function responses
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#94** [claim: Pending] Privacy link on contact form and checkout
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Contact.jsx`, `src/components/store/CartSidebar.jsx`.
  Tested: Code inspection only.
  🟩 Done: Legal pages exist and can be linked, but the audited surfaces do not currently prove the claimed behavior.
  🟨 Missing: The contact form and checkout sidebar do not currently show a clear in-form privacy link as claimed.

## SECTION 10: BACKEND FUNCTIONS — RELIABILITY

- **#95** [claim: Pending] processNurtureCampaigns: check CommunicationEvent for STOP keyword before each send
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#96** [claim: Pending] processDripCampaigns: skip leads with status "Booked" before sending each step
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#97** [claim: Pending] processNurtureCampaigns: add idempotency guard (check for duplicate send within 23hr)
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#98** [claim: Pending] processWebsiteLeadFollowUps: add cadence_paused: true skip guard
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#99** [claim: Pending] scheduleDemoBooking: add optimistic lock — re-fetch slots before confirming
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#100** [claim: Pending] scheduleDemoBooking: reject weekend bookings (Sat/Sun) + blocked_dates in AdminSettings
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#101** [claim: Pending] CartSidebar: add 12-second timeout fallback for Stripe redirect
  Audit: Valid pending implementation task.
  Evidence: `src/components/store/CartSidebar.jsx`.
  Tested: Code inspection only.
  🟩 Done: Basic Stripe redirect logic exists.
  🟨 Missing: There is no visible 12-second timeout fallback or recovery path if the Stripe redirect stalls.

- **#102** [claim: Pending] sendOrderConfirmationEmail: add fallback values for all template variables
  Audit: Valid pending verification task.
  Evidence: `base44/functions/sendOrderConfirmationEmail/entry.ts`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: base44/functions/sendOrderConfirmationEmail/entry.ts.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#103** [claim: Pending] discoverLeads: return 503 with clear error if Google Maps API key is missing
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#104** [claim: Pending] enrichLeadWithAI: skip enrichment if lead.enriched_at < 7 days ago
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#105** [claim: Complete] Store search debounce 280ms implemented
  Audit: Duplicate / overlap with #4.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #4, then keep only one canonical acceptance criterion.

- **#106** [claim: Complete] robots.txt updated with admin blocks
  Audit: Verified complete (repo).
  Evidence: `public/robots.txt`.
  Tested: Code inspection only; no external crawler verification stored in repo.
  🟩 Done: Robots file blocks admin/authenticated/internal routes and publishes the sitemap location.
  🟨 Missing: Confirm the deployed file matches repo state on the production domain.

## SECTION 11: BACKEND FUNCTIONS — NEW

- **#107** [claim: Pending] Create healthCheck function: returns {status:"ok", timestamp, version} — no auth
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#108** [claim: Pending] Create autoCloseStaleLeads: daily scheduled function, closes leads with no contact > 30 days
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Contact.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Contact.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#109** [claim: Complete] OrderSuccess: add noindex meta tag
  Audit: Verified complete (repo).
  Evidence: `src/App.jsx`.
  Tested: Code inspection only; no external crawler verification stored in repo.
  🟩 Done: Route-level `robots` handling applies `noindex,nofollow` to `/order-success` and other protected flows.
  🟨 Missing: Add a browser assertion if you want automated proof instead of code inspection.

- **#110** [claim: Pending] Create exportLeadsCSV: query Leads with filters, return CSV with Content-Disposition header
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#111** [claim: Pending] Create exportCommunicationLogs: CSV export with date range filter
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#112** [claim: Pending] Extend autoEndToEndTest: full checkout → webhook → email → status flow with cleanup
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#113** [claim: Pending] sendDailyDigest: add gate — skip send if leads_today === 0 AND orders_today === 0
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#114** [claim: Pending] All Resend fetch calls: add retry once on 429/5xx with 2-second delay
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#115** [claim: Pending] monthlyClientReport: after generating report, email it to the client
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#116** [claim: Pending] getBookedDemoSlots: add {scheduled_date: selectedDate} filter — don't fetch all records
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#117** [claim: Pending] Create sendNPSSurvey function: triggered 7 days after order_status = "fully_live"
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION 12: AUTOMATION

- **#118** [claim: Pending] Create entity automation: ClientProject update → send milestone email when workflow_stage changes
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#119** [claim: Pending] Create entity automation: Order update → trigger sendNPSSurvey when order_status = "fully_live"
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#120** [claim: Pending] Create scheduled automation: autoCloseStaleLeads — runs daily at 2am
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#121** [claim: Complete] "$0 setup" renamed to "No setup fee" in store
  Audit: Duplicate / overlap with #3.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #3, then keep only one canonical acceptance criterion.

- **#122** [claim: Pending] Create scheduled automation: autoArchiveOldLeads — runs monthly
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#123** [claim: Pending] processAutomationJobs: add retry logic — up to 3 attempts with exponential backoff
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#124** [claim: Pending] Create _shared/response.js: okJson() and errJson() for consistent response format
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#125** [claim: Pending] Create _shared/retryFetch.js: reusable retry wrapper for external API calls
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION 13: TWILIO / SMS

- **#126** [claim: Pending] scheduleFollowUpSMS: verify business hours check uses Phoenix timezone correctly
  Audit: Mostly done in repo; still needs explicit verification.
  Evidence: `base44/functions/scheduleFollowUpSMS/entry.ts`.
  Tested: Covered indirectly by passing test suite, but no timezone-specific assertion found.
  🟩 Done: Follow-up SMS logic was hardened around Phoenix business-hours gating.
  🟨 Missing: Add a timezone-focused test that proves Phoenix handling across edge times and DST assumptions.

- **#127** [claim: Pending] receiveTwilioInboundSms: verify STOP handling immediately pauses all sequences for that lead
  Audit: Valid pending, currently blocked by canonical lockdown.
  Evidence: `base44/functions/receiveTwilioInboundSms/entry.ts`.
  Tested: Code inspection only.
  🟩 Done: The repo explicitly quarantines the legacy inbound SMS endpoint instead of pretending it works canonically.
  🟨 Missing: Rebuild inbound STOP handling on the canonical runtime path rather than the disabled legacy endpoint.

- **#128** [claim: Pending] All SMS sends: verify opt-out language "Reply STOP to unsubscribe" is appended
  Audit: Partial: one major send path is hardened, not all send paths.
  Evidence: `base44/functions/scheduleFollowUpSMS/entry.ts`.
  Tested: Code inspection only.
  🟩 Done: Follow-up SMS now appends opt-out language if a template omits it.
  🟨 Missing: Audit every outbound SMS entrypoint and enforce the same STOP-language rule everywhere.

- **#129** [claim: Pending] processMissedCallFollowUps: verify missed_call_step_sent increment is idempotent
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#130** [claim: Pending] Twilio number: add auto-provision flow for new clients in autoProvisionTwilioNumber
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION 14: EMAIL / RESEND

- **#131** [claim: Pending] sendOrderConfirmationEmail: verify all 6 service names render correctly in email
  Audit: Valid pending, code exists but render truth is unproven.
  Evidence: `base44/functions/sendOrderConfirmationEmail/entry.ts`.
  Tested: Template code only; no client render proof stored in repo.
  🟩 Done: A canonical order-confirmation template exists and loops through purchased items.
  🟨 Missing: Render/send proof for all service-name combinations across the actual template output.

- **#132** [claim: Pending] sendDemoConfirmationEmail: verify scheduled_date/time display correctly in all timezones
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#133** [claim: Pending] sendClientWelcomeEmail: ensure it links to correct client portal URL
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#134** [claim: Pending] receiveResendWebhook: on email bounce, update CommunicationEvent status to "failed"
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#135** [claim: Pending] receiveResendWebhook: on email open, update lead.last_engagement_at
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#136** [claim: Complete] Sitemap updated with all industry pages
  Audit: Duplicate / overlap with #60.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #60, then keep only one canonical acceptance criterion.

## SECTION 15: LEAD PIPELINE

- **#137** [claim: Pending] submitLeadCapture: verify deduplication window is exactly 60 minutes
  Audit: Valid pending verification task.
  Evidence: `base44/functions/submitLeadCapture/entry.ts`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: base44/functions/submitLeadCapture/entry.ts.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#138** [claim: Pending] onLeadCreated: verify webhook payload includes all required fields
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#139** [claim: Pending] scoreLeads: verify lead_score calculation accounts for all scoring factors
  Audit: Valid pending; scoring surfaces exist but this specific verification is not proved.
  Evidence: `src/pages/LeadIntelligence.jsx`, `src/components/leads/LeadsTableIntelligence.jsx`.
  Tested: No dedicated score-audit test found.
  🟩 Done: Lead scores and labels are surfaced in multiple admin and lead-intelligence views.
  🟨 Missing: Trace the actual score-calculation implementation against every intended scoring factor and add assertions for the edge cases.

- **#140** [claim: Pending] scoreLeadIntelligence: add confidence threshold — skip if AI confidence < 0.6
  Audit: Valid pending implementation task.
  Evidence: `src/pages/LeadIntelligence.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/LeadIntelligence.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#141** [claim: Pending] routeLead: verify assigned_to field is populated correctly for all lead types
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#142** [claim: Pending] createLeadAndDispatch: add error recovery if CommunicationEvent creation fails
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#143** [claim: Pending] validateLeadQuality: add check for disposable email domains (mailinator, tempmail, etc.)
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#144** [claim: Pending] deduplicateLeads: run dedup on phone hash as well as email
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#145** [claim: Pending] enrichLead: add timeout of 10 seconds max for external enrichment calls
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION 16: STRIPE BACKEND

- **#146** [claim: Complete] createCheckoutSession: add subscription_data.metadata.order_id for subscription event matching
  Audit: Verified complete (repo).
  Evidence: `base44/functions/createCheckoutSession/entry.ts`.
  Tested: Code inspection only; no separate checkout metadata test.
  🟩 Done: `subscription_data.metadata.order_id` is already written into Stripe checkout session creation.
  🟨 Missing: Add a direct automated assertion if you want stronger proof than code inspection alone.

- **#147** [claim: Complete] stripeWebhookOrders: on invoice.payment_failed, set Order billing_status: "past_due"
  Audit: Verified complete (repo).
  Evidence: `base44/functions/stripeWebhookOrders/entry.ts`, `base44/functions/_shared/subscriptionSync.js`, `tests/subscriptionSync.test.js`.
  Tested: Covered by `npm test`.
  🟩 Done: `invoice.payment_failed` flows through subscription sync and maps the order into `past_due` billing state.
  🟨 Missing: Do a live Stripe failure test if you want environment-proof instead of repo-proof.

- **#148** [claim: In Progress] stripeWebhookOrders: on payment_failed, send recovery email with Stripe payment update link
  Audit: Partial: billing warning state exists, recovery-email path is still missing.
  Evidence: `base44/functions/stripeWebhookOrders/entry.ts`, `base44/functions/createInvoicePaymentLink/entry.ts`.
  Tested: Code inspection only.
  🟩 Done: The backend can create payment-update links and mark billing into a warning state.
  🟨 Missing: Trigger a dedicated recovery email on payment failure and prove it contains the correct update-payment URL.

- **#149** [claim: Pending] requestSubscriptionChange: use proration_behavior: "create_prorations" in Stripe call
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#150** [claim: Pending] Extract Stripe init + signature validation into _shared/stripeInit.js
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#151** [claim: Pending] Add createAuditLog helper: write admin action records to AuditLog entity
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

## SECTION 17: MONITORING & DEVOPS

- **#152** [claim: Pending] Register healthCheck function URL with UptimeRobot or Better Stack
  Audit: Live / ops verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not repo-verifiable without deployed environment access.
  🟩 Done: The task is framed as an environment, vendor, or final QA check rather than a pure repo change.
  🟨 Missing: Perform the named live verification and attach proof before marking it complete.

- **#153** [claim: Pending] Add Cache-Control: public, max-age=60 to read-only functions (getAdminSettings, etc.)
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#154** [claim: Pending] getAdminAnalytics: fix MRR to sum total_monthly from paid Orders
  Audit: Partial: the surface exists; accuracy claim is still unverified.
  Evidence: `src/components/admin/RevenueDashboard.jsx`.
  Tested: Code inspection only.
  🟩 Done: Revenue/MRR views exist in admin.
  🟨 Missing: Confirm the MRR math source is canonical paid orders and add a regression test.

- **#155** [claim: Pending] getClientAnalytics: remove/replace any hardcoded mock data with real entity queries
  Audit: Partial: the surface exists; accuracy claim is still unverified.
  Evidence: `base44/functions/getClientAnalytics/entry.ts`, `tests/portalAndLaunchHardening.test.js`.
  Tested: Some coverage exists in `npm test`.
  🟩 Done: Client analytics was hardened away from obvious mock/ownership drift in the recent backend work.
  🟨 Missing: Audit every returned metric field for real entity sourcing and remove any remaining placeholder values.

- **#156** [claim: Pending] getClientPortalContext: on auth, write portal_login CommunicationEvent
  Audit: Valid pending implementation task.
  Evidence: `src/pages/ClientPortal.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/ClientPortal.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#157** [claim: Pending] Create AuditLog entity with fields: admin_email, action, entity, before, after, timestamp
  Audit: Pending, but duplicated.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog captures the need for an `AuditLog` entity in two different places.
  🟨 Missing: Implement one canonical `AuditLog` entity and delete the duplicate row.

- **#158** [claim: Pending] Add standardized console.log format to all functions: [functionName] message {context}
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#159** [claim: Pending] Verify all functions return proper HTTP status codes (not always 200)
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#160** [claim: Pending] Add request timeout handling to all external API calls (Twilio, Resend, Stripe)
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION 18: DATA INTEGRITY

- **#161** [claim: Pending] Verify Order entity client_id is always set after checkout completes
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#162** [claim: Pending] Verify ClientProject is always created when Order payment_status = "paid"
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#163** [claim: Pending] Verify CommunicationEvent is created for every SMS/email send attempt
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#164** [claim: Pending] Add data validation: Order.total_monthly must equal sum of item monthly_fees
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#165** [claim: Pending] Ensure AutomationChecklist records are created for every paid service
  Audit: Valid pending implementation task.
  Evidence: `base44/entities/AutomationChecklist.jsonc`, `base44/functions/initializeInstallOS/entry.ts`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: base44/entities/AutomationChecklist.jsonc, base44/functions/initializeInstallOS/entry.ts.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#166** [claim: Pending] Verify pipeline_status and order_status stay in sync after every transition
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#167** [claim: Pending] Run deduplicateLeads on all existing Leads records to clean up database
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION 19: ADMIN PANEL — FEATURES

- **#168** [claim: Pending] Add bulk status update to admin lead table (checkboxes + "Mark as Contacted" toolbar)
  Audit: Stale pending: already built in repo.
  Evidence: `src/components/admin/LeadBulkToolbar.jsx`, `src/components/admin/LeadManagementDashboard.jsx`.
  Tested: Code inspection only.
  🟩 Done: Bulk lead actions already exist in the admin lead workspace.
  🟨 Missing: Update the task status or narrow the task text if a different acceptance criterion is intended.

- **#169** [claim: Pending] Wire Leads.subscribe() real-time listener to auto-refresh admin leads table
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#170** [claim: Pending] Install Queue panel: show estimated completion date (install_initialized_at + 6 days)
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#171** [claim: Pending] Add "Resend Welcome Email" button in client detail view → sendPortalWelcomeEmail
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#172** [claim: Pending] AdminSettings: add "Test Connection" buttons for Twilio + Resend → testProviderConnections
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#173** [claim: Complete] Add "Website Leads" tab in AdminDashboard showing WebsiteLead entity with filters
  Audit: Stale pending: already built in repo.
  Evidence: `src/pages/AdminDashboard.jsx`, `src/components/admin/WebsiteLeadsDashboard.jsx`.
  Tested: Code inspection only.
  🟩 Done: Admin dashboard already exposes a Website Leads tab.
  🟨 Missing: Update the task status or narrow the task text if a different acceptance criterion is intended.

- **#174** [claim: Pending] Add "Override & Mark Live" button with required reason field in AutomationInstallChecklist
  Audit: Valid pending implementation task.
  Evidence: `src/components/admin/AutomationInstallChecklist.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/components/admin/AutomationInstallChecklist.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#175** [claim: Pending] AdminLeadDetail: add "Send Manual SMS" text area + button → sendSMS
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#176** [claim: Pending] AdminSettings: add "Preview Email Template" modal with sample variable substitution
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#177** [claim: Pending] Admin analytics: add conversion funnel chart (Lead→Contacted→Booked→Paid)
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Contact.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Contact.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#178** [claim: Pending] CommunicationLogsPanel: add "Export Logs" button → exportCommunicationLogs
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#179** [claim: Pending] AdminLeads table: add lead_score column (visible, sortable, color-coded)
  Audit: Stale pending: already built in repo.
  Evidence: `src/components/admin/LeadManagementDashboard.jsx`, `src/components/admin/LeadScoreBadge.jsx`.
  Tested: Code inspection only.
  🟩 Done: Admin leads already render color-coded lead-score badges.
  🟨 Missing: Update the task status or narrow the task text if a different acceptance criterion is intended.

- **#180** [claim: Pending] Add "Demo Bookings" tab in AdminDashboard for DemoRequest management
  Audit: Valid pending implementation task.
  Evidence: `src/pages/AdminDashboard.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/AdminDashboard.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#181** [claim: Pending] AdminLeadDetail: add "Enroll in Nurture" button → startNurtureCampaign
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#182** [claim: Pending] Add "Failed Jobs" section in AdminAutomation showing AutomationJob failures + Retry
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#183** [claim: Pending] AdminLeads: mask phone numbers as (602) ***-3227 for non-super-admin users
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#184** [claim: Pending] Create AuditLog viewer tab in AdminDashboard for tracking all admin actions
  Audit: Valid pending verification task.
  Evidence: `src/pages/AdminDashboard.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/AdminDashboard.jsx.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

## SECTION 20: ADMIN PANEL — ONBOARDING / INSTALL

- **#185** [claim: Pending] AdminOnboarding: add client search/filter by business name or email
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Onboarding.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Onboarding.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#186** [claim: Pending] AdminOnboarding: show pipeline_status badge prominently on each client card
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Onboarding.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Onboarding.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#187** [claim: Pending] InstallQueuePanel: add "Assign to Admin" dropdown for each pending install
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#188** [claim: Pending] AutomationInstallChecklist: add progress bar showing % of checklist items complete
  Audit: Stale pending: already built in repo.
  Evidence: `src/components/admin/AutomationInstallChecklist.jsx`.
  Tested: Code inspection only.
  🟩 Done: Automation install checklist already shows a progress bar and completed-step counts.
  🟨 Missing: Update the task status or narrow the task text if a different acceptance criterion is intended.

- **#189** [claim: Pending] Admin: add one-click "Initialize Install OS" button for newly paid orders
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#190** [claim: Pending] Admin: show warning badge when order has been paid > 2 days with no install started
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION 21: CLIENT PORTAL

- **#191** [claim: Pending] ClientPortal: add "Get Help" support ticket tab → SupportMessage entity
  Audit: Duplicate / overlap with #67.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #67, then keep only one canonical acceptance criterion.

- **#192** [claim: Pending] ClientPortal: add "What's New" changelog section from Changelog entity
  Audit: Duplicate / overlap with #68.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #68, then keep only one canonical acceptance criterion.

- **#193** [claim: Pending] ClientPortal: add "Refer a Business" section with unique ?ref=clientID link
  Audit: Duplicate / overlap with #69.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #69, then keep only one canonical acceptance criterion.

- **#194** [claim: In Progress] ClientPortal: show PaymentFailedBanner when billing_status === "past_due"
  Audit: Partial: banner exists but is not wired where the task claims.
  Evidence: `src/components/portal/PaymentFailedBanner.jsx`, `src/pages/ClientPortal.jsx`.
  Tested: Code inspection only.
  🟩 Done: A payment-failed banner component exists and can detect past-due/unpaid states.
  🟨 Missing: Mount it in the portal flow and verify it keys off the canonical order/subscription state the task expects.

- **#195** [claim: In Progress] BillingDashboard: "Cancel Subscription" → getStripeCustomerPortalUrl redirect
  Audit: Partial: payment portal exists, cancel flow does not match task.
  Evidence: `src/components/portal/BillingDashboard.jsx`, `base44/functions/getStripeCustomerPortalUrl/entry.ts`, `src/components/portal/PlanManager.jsx`.
  Tested: Code inspection only; no live portal proof.
  🟩 Done: Billing already opens Stripe/customer payment tooling, and PlanManager supports manual cancellation requests.
  🟨 Missing: Expose an explicit cancel-subscription CTA that intentionally routes to a verified working Stripe portal cancellation flow.

- **#196** [claim: Pending] BillingDashboard: "Download Invoice PDF" using Stripe invoice_pdf URL
  Audit: Duplicate / overlap with #71.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #71, then keep only one canonical acceptance criterion.

- **#197** [claim: Pending] ClientPortal: add NPS score display after it's collected
  Audit: Valid pending implementation task.
  Evidence: `src/pages/ClientPortal.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/ClientPortal.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#198** [claim: Pending] QuickStartWizard: ensure all onboarding steps link to correct help resources
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Onboarding.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Onboarding.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#199** [claim: Pending] ClientPortal: verify OrderTracker shows correct install stages for all service types
  Audit: Valid pending verification task.
  Evidence: `src/pages/ClientPortal.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/ClientPortal.jsx.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#200** [claim: Pending] ClientDashboard: add "Your Automation is Paused" warning when cadence_paused = true
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION 22: STRIPE / BILLING

- **#201** [claim: In Progress] Switch Stripe from Test Mode to Live Mode (sk_live_ / pk_live_ keys in Dashboard)
  Audit: Live / ops verification required.
  Evidence: `base44/functions/createCheckoutSession/entry.ts`, `base44/functions/stripeWebhookOrders/entry.ts`, `base44/functions/getStripeCustomerPortalUrl/entry.ts`.
  Tested: Not repo-verifiable without live credentials, vendor dashboards, or deployed domain access.
  🟩 Done: The repo contains the code paths that will consume these live configuration changes.
  🟨 Missing: Set live Stripe keys in the real environment and confirm no test keys remain active.

- **#202** [claim: In Progress] Update Stripe webhook endpoint URL to production domain
  Audit: Live / ops verification required.
  Evidence: `base44/functions/createCheckoutSession/entry.ts`, `base44/functions/stripeWebhookOrders/entry.ts`, `base44/functions/getStripeCustomerPortalUrl/entry.ts`.
  Tested: Not repo-verifiable without live credentials, vendor dashboards, or deployed domain access.
  🟩 Done: The repo contains the code paths that will consume these live configuration changes.
  🟨 Missing: Point Stripe’s live webhook endpoint at the production domain and verify signatures succeed.

- **#203** [claim: In Progress] Test full purchase flow end-to-end with real card on live domain
  Audit: Live / ops verification required.
  Evidence: `base44/functions/createCheckoutSession/entry.ts`, `base44/functions/stripeWebhookOrders/entry.ts`, `base44/functions/getStripeCustomerPortalUrl/entry.ts`.
  Tested: Not repo-verifiable without live credentials, vendor dashboards, or deployed domain access.
  🟩 Done: The repo contains the code paths that will consume these live configuration changes.
  🟨 Missing: Run a real-card purchase on the live domain and record order/email/subscription outcomes.

- **#204** [claim: Pending] Verify Stripe subscription renewal fires invoice.paid webhook and is handled
  Audit: Live / ops verification required.
  Evidence: `base44/functions/createCheckoutSession/entry.ts`, `base44/functions/stripeWebhookOrders/entry.ts`, `base44/functions/getStripeCustomerPortalUrl/entry.ts`.
  Tested: Not repo-verifiable without live credentials, vendor dashboards, or deployed domain access.
  🟩 Done: Webhook handling exists for renewal-related invoice events, but live renewal proof is not stored here.
  🟨 Missing: Wait for or simulate a live renewal cycle and capture proof that `invoice.paid` is handled correctly.

- **#205** [claim: Pending] Add capacity limit: AdminSettings.max_active_onboarding — block checkout if exceeded
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Onboarding.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Onboarding.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#206** [claim: In Progress] getStripeCustomerPortalUrl: verify it returns working URL for all paid customers
  Audit: Live / ops verification required.
  Evidence: `base44/functions/createCheckoutSession/entry.ts`, `base44/functions/stripeWebhookOrders/entry.ts`, `base44/functions/getStripeCustomerPortalUrl/entry.ts`.
  Tested: Not repo-verifiable without live credentials, vendor dashboards, or deployed domain access.
  🟩 Done: The repo contains the code paths that will consume these live configuration changes.
  🟨 Missing: Open the portal for multiple paid customers and prove the returned Stripe portal URL works for each.

- **#207** [claim: Pending] Stripe proration: implement preview before plan change in requestSubscriptionChange
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#208** [claim: Pending] Verify Stripe metadata includes base44_app_id on all checkout sessions
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#209** [claim: Pending] Add Stripe customer ID to ClientProject for portal billing lookups
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#210** [claim: Pending] Verify all Stripe webhook event types are handled (created, updated, deleted, failed)
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

## SECTION 23: OPERATIONAL READINESS

- **#211** [claim: Pending] Configure custom domain DNS (if not already done) and verify SSL cert
  Audit: Live / ops verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not repo-verifiable without live credentials, vendor dashboards, or deployed domain access.
  🟩 Done: The repo contains the code paths that will consume these live configuration changes.
  🟨 Missing: Confirm DNS and certificate status on the actual live host.

- **#212** [claim: Pending] Set up UptimeRobot or Better Stack monitoring on healthCheck endpoint
  Audit: Live / ops verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not repo-verifiable without live credentials, vendor dashboards, or deployed domain access.
  🟩 Done: The repo contains the code paths that will consume these live configuration changes.
  🟨 Missing: Create a real monitor against a deployed health endpoint; the health endpoint itself is still missing.

- **#213a** [claim: Pending] Configure Resend domain authentication (SPF, DKIM, DMARC) for deliverability
  Audit: Live / ops verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not repo-verifiable.
  🟩 Done: This row represents external Resend deliverability setup, not code.
  🟨 Missing: Verify SPF, DKIM, and DMARC in the sending domain and record live proof.

- **#213b** [claim: Pending] Verify Twilio number is A2P 10DLC registered for commercial SMS in the US
  Audit: Live / ops verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not repo-verifiable.
  🟩 Done: This second `#213` row is an external Twilio compliance requirement, not repo code.
  🟨 Missing: Confirm A2P 10DLC registration on the real Twilio number and renumber this duplicate task ID.

- **#214** [claim: Pending] Add Google Analytics 4 event tracking for: purchase, demo_booked, lead_submitted
  Audit: Partial foundation only.
  Evidence: `src/lib/analytics.js`, `index.html`.
  Tested: Code inspection only.
  🟩 Done: A lightweight client analytics helper exists, but GA4 is not actually bootstrapped in the page shell.
  🟨 Missing: Install a real GA4/gtag snippet and wire the named conversion events.

- **#215** [claim: Pending] Set up error alerting: admin email on any backend function 5xx error
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#216** [claim: Pending] Document all environment variables in a README_ENV.md file
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#217** [claim: Pending] Create runbook: what to do when Twilio is down / Resend is down / Stripe is down
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#218** [claim: Pending] Verify all secrets are set in production (not just dev) environment
  Audit: Live / ops verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not repo-verifiable without deployed environment access.
  🟩 Done: The task is framed as an environment, vendor, or final QA check rather than a pure repo change.
  🟨 Missing: Perform the named live verification and attach proof before marking it complete.

- **#219** [claim: Pending] Load test: simulate 50 concurrent lead submissions and measure response time
  Audit: Live / ops verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not repo-verifiable without deployed environment access.
  🟩 Done: The task is framed as an environment, vendor, or final QA check rather than a pure repo change.
  🟨 Missing: Perform the named live verification and attach proof before marking it complete.

## SECTION 24: DATA / ENTITIES

- **#220** [claim: Pending] Create AuditLog entity (admin_email, action, entity_name, record_id, before, after, timestamp)
  Audit: Pending, but duplicated.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog captures the need for an `AuditLog` entity in two different places.
  🟨 Missing: Merge this duplicate into #157 and then implement the single canonical entity.

- **#221** [claim: Pending] Create Changelog entity (title, description, date, is_published) for client portal
  Audit: Valid pending.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No matching implementation found.
  🟩 Done: The need is documented, but no entity/schema implementation is present.
  🟨 Missing: Create the `Changelog` entity, define fields and RLS, then wire portal reads.

- **#222** [claim: Pending] Create Referral entity (referrer_client_id, referred_email, status, credit_amount)
  Audit: Valid pending.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No matching implementation found.
  🟩 Done: The need is documented, but no entity/schema implementation is present.
  🟨 Missing: Create the `Referral` entity, define fields and RLS, then wire referral creation/reads.

- **#223** [claim: Pending] Add nps_score + nps_responded_at fields to ClientProject entity
  Audit: Valid pending.
  Evidence: `base44/entities`.
  Tested: No matching schema fields found for the requested change.
  🟩 Done: The surrounding entities already exist.
  🟨 Missing: Add the field(s), update writes/reads, and add schema-level plus flow-level tests.

- **#224** [claim: Pending] Add consent_given_at + consent_ip fields to WebsiteLead entity
  Audit: Valid pending.
  Evidence: `base44/entities`.
  Tested: No matching schema fields found for the requested change.
  🟩 Done: The surrounding entities already exist.
  🟨 Missing: Add the field(s), update writes/reads, and add schema-level plus flow-level tests.

- **#225** [claim: Pending] Add consent_given_at + consent_ip fields to Leads entity
  Audit: Valid pending.
  Evidence: `base44/entities`.
  Tested: No matching schema fields found for the requested change.
  🟩 Done: The surrounding entities already exist.
  🟨 Missing: Add the field(s), update writes/reads, and add schema-level plus flow-level tests.

- **#226** [claim: Pending] Verify all entity RLS rules are correct — Client entity has correct read/write rules
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#227** [claim: Pending] Add max_active_onboarding field to AdminSettings entity
  Audit: Valid pending.
  Evidence: `base44/entities`.
  Tested: No matching schema fields found for the requested change.
  🟩 Done: The surrounding entities already exist.
  🟨 Missing: Add the field(s), update writes/reads, and add schema-level plus flow-level tests.

- **#228** [claim: Pending] Add blocked_dates array field to AdminSettings for holiday/weekend booking blocks
  Audit: Valid pending.
  Evidence: `base44/entities`.
  Tested: No matching schema fields found for the requested change.
  🟩 Done: The surrounding entities already exist.
  🟨 Missing: Add the field(s), update writes/reads, and add schema-level plus flow-level tests.

- **#229** [claim: Pending] Add allowed_admin_ips array field to AdminSettings for IP allowlisting
  Audit: Valid pending.
  Evidence: `base44/entities`.
  Tested: No matching schema fields found for the requested change.
  🟩 Done: The surrounding entities already exist.
  🟨 Missing: Add the field(s), update writes/reads, and add schema-level plus flow-level tests.

## SECTION 25: CLIENT EXPERIENCE (BACKEND SIDE)

- **#230** [claim: Pending] Create sendNPSSurvey function — email 7 days after fully_live with 1-10 rating link
  Audit: Duplicate / overlap with #117.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #117, then keep only one canonical acceptance criterion.

- **#231** [claim: Pending] Entity automation: ClientProject workflow_stage change → send milestone email
  Audit: Duplicate / overlap with #118.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #118, then keep only one canonical acceptance criterion.

- **#232** [claim: Pending] Entity automation: Order fully_live → trigger sendNPSSurvey after 7-day delay
  Audit: Duplicate / overlap with #119.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #119, then keep only one canonical acceptance criterion.

- **#233** [claim: Pending] Verify sendClientWelcomeEmail includes correct client portal URL + temp access instructions
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#234** [claim: Pending] Verify sendPortalWelcomeEmail is triggered automatically after order is paid
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

- **#235** [claim: Pending] Create Changelog entity records: add first 3 "What's New" entries for portal
  Audit: Valid pending.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No matching implementation found.
  🟩 Done: Portal and backlog language already anticipate a changelog feed.
  🟨 Missing: Seed the first published changelog records after the entity exists.

## SECTION 26: DOCUMENTATION

- **#236** [claim: Pending] Write README_ENV.md documenting all required environment variables
  Audit: Duplicate / overlap with #216.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #216, then keep only one canonical acceptance criterion.

- **#237** [claim: Pending] Write RUNBOOK_OUTAGE.md: steps for Twilio/Resend/Stripe outage scenarios
  Audit: Duplicate / overlap with #217.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #217, then keep only one canonical acceptance criterion.

- **#238** [claim: Pending] Write ONBOARDING_SOP.md: step-by-step for onboarding a new client manually
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Onboarding.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Onboarding.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#239** [claim: Pending] Write STRIPE_GO_LIVE.md: checklist for switching to live Stripe keys
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#240** [claim: Pending] Update INSTALLATION_WORKFLOW_GUIDE.md with latest install OS fields
  Audit: Valid pending verification task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Run the targeted verification, document the exact result, and add automated coverage if the check should stay green.

## SECTION 27: FINAL LAUNCH CHECKLIST

- **#241** [claim: Pending] Final: run Lighthouse audit on homepage — target 90+ performance score
  Audit: Final-stage manual or live verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not fully repo-verifiable.
  🟩 Done: The codebase now has a stronger baseline (`npm test`, `npm run lint`, and `npm run build` are green), but these rows are launch-proof checks, not repo-only changes.
  🟨 Missing: Run the named final check in the real launch environment and record the result explicitly before calling it green.

- **#242** [claim: Pending] Final: run axe or WAVE accessibility audit — fix all WCAG AA violations
  Audit: Final-stage manual or live verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not fully repo-verifiable.
  🟩 Done: The codebase now has a stronger baseline (`npm test`, `npm run lint`, and `npm run build` are green), but these rows are launch-proof checks, not repo-only changes.
  🟨 Missing: Run the named final check in the real launch environment and record the result explicitly before calling it green.

- **#243** [claim: Pending] Final: test all CTA buttons across mobile (375px, 390px, 414px)
  Audit: Final-stage manual or live verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not fully repo-verifiable.
  🟩 Done: The codebase now has a stronger baseline (`npm test`, `npm run lint`, and `npm run build` are green), but these rows are launch-proof checks, not repo-only changes.
  🟨 Missing: Run the named final check in the real launch environment and record the result explicitly before calling it green.

- **#244** [claim: Pending] Final: verify all email templates render correctly in Gmail, Outlook, Apple Mail
  Audit: Final-stage manual or live verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not fully repo-verifiable.
  🟩 Done: The codebase now has a stronger baseline (`npm test`, `npm run lint`, and `npm run build` are green), but these rows are launch-proof checks, not repo-only changes.
  🟨 Missing: Run the named final check in the real launch environment and record the result explicitly before calling it green.

- **#245** [claim: Pending] Final: test complete lead → SMS → follow-up → booking flow with test lead
  Audit: Final-stage manual or live verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not fully repo-verifiable.
  🟩 Done: The codebase now has a stronger baseline (`npm test`, `npm run lint`, and `npm run build` are green), but these rows are launch-proof checks, not repo-only changes.
  🟨 Missing: Run the named final check in the real launch environment and record the result explicitly before calling it green.

- **#246** [claim: Pending] Final: verify admin panel loads in < 3 seconds with 100+ leads in database
  Audit: Final-stage manual or live verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not fully repo-verifiable.
  🟩 Done: The codebase now has a stronger baseline (`npm test`, `npm run lint`, and `npm run build` are green), but these rows are launch-proof checks, not repo-only changes.
  🟨 Missing: Run the named final check in the real launch environment and record the result explicitly before calling it green.

- **#247** [claim: Pending] Final: confirm robots.txt is correct and sitemap is submitted to Google Search Console
  Audit: Final-stage manual or live verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not fully repo-verifiable.
  🟩 Done: The codebase now has a stronger baseline (`npm test`, `npm run lint`, and `npm run build` are green), but these rows are launch-proof checks, not repo-only changes.
  🟨 Missing: Run the named final check in the real launch environment and record the result explicitly before calling it green.

- **#248** [claim: Pending] Final: review all legal pages (Privacy, Terms) for accuracy and TCPA compliance
  Audit: Final-stage manual or live verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not fully repo-verifiable.
  🟩 Done: The codebase now has a stronger baseline (`npm test`, `npm run lint`, and `npm run build` are green), but these rows are launch-proof checks, not repo-only changes.
  🟨 Missing: Run the named final check in the real launch environment and record the result explicitly before calling it green.

- **#249** [claim: Pending] Final: do a full purchase test with a real card → verify order, emails, SMS all fire
  Audit: Final-stage manual or live verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not fully repo-verifiable.
  🟩 Done: The codebase now has a stronger baseline (`npm test`, `npm run lint`, and `npm run build` are green), but these rows are launch-proof checks, not repo-only changes.
  🟨 Missing: Run the named final check in the real launch environment and record the result explicitly before calling it green.

- **#250** [claim: Pending] Final: team sign-off — all 3 agents mark their sections complete before go-live
  Audit: Final-stage manual or live verification required.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not fully repo-verifiable.
  🟩 Done: The codebase now has a stronger baseline (`npm test`, `npm run lint`, and `npm run build` are green), but these rows are launch-proof checks, not repo-only changes.
  🟨 Missing: Run the named final check in the real launch environment and record the result explicitly before calling it green.

## SECTION A: AI BRAIN / LEAD INTELLIGENCE (Not wired to frontend at all)

- **#251** [claim: Pending] Wire scoreLeadIntelligence to fire on every new WebsiteLead creation — currently deployed but never called from frontend
  Audit: Valid pending.
  Evidence: `base44/functions/automationOrchestrator/entry.ts`, `src/pages/LeadIntelligence.jsx`, `src/components/admin/AILeadInsightPanel.jsx`.
  Tested: Code inspection only.
  🟩 Done: The `scoreLeadIntelligence` function is deployed and documented.
  🟨 Missing: Wire it to canonical WebsiteLead creation or explicitly rewrite the task around the canonical lead path.

- **#252** [claim: Pending] Wire classifyLeadIntent on inbound SMS replies — currently deployed but disconnected
  Audit: Valid pending; current inbound-SMS path is intentionally quarantined.
  Evidence: `base44/functions/receiveTwilioInboundSms/entry.ts`, `base44/functions/automationOrchestrator/entry.ts`.
  Tested: Code inspection only.
  🟩 Done: The repo clearly blocks the legacy inbound SMS handler instead of pretending it is canonical.
  🟨 Missing: Implement classify-intent on the canonical inbound reply path, not the disabled legacy handler.

- **#253** [claim: Pending] Wire predictChurnRisk to run weekly on all active Orders — alert Nolan if score > 70
  Audit: Valid pending.
  Evidence: `base44/functions/automationOrchestrator/entry.ts`, `src/pages/LeadIntelligence.jsx`, `src/components/admin/AILeadInsightPanel.jsx`.
  Tested: Code inspection only.
  🟩 Done: The `predictChurnRisk` function is deployed and available to the orchestrator.
  🟨 Missing: Schedule weekly churn runs, persist results, and notify Nolan on high-risk scores.

- **#254** [claim: Pending] Wire automationOrchestrator to Admin dashboard so Nolan can trigger it manually
  Audit: Valid pending.
  Evidence: `base44/functions/automationOrchestrator/entry.ts`, `src/pages/LeadIntelligence.jsx`, `src/components/admin/AILeadInsightPanel.jsx`.
  Tested: Code inspection only.
  🟩 Done: The orchestrator function exists and can already fan out to AI helpers.
  🟨 Missing: Add an admin control surface that intentionally invokes the orchestrator and records the result.

- **#255** [claim: Complete] /lead-intelligence page: display lead_score and quality_label per lead in the UI
  Audit: Verified complete (repo).
  Evidence: `src/pages/LeadIntelligence.jsx`, `src/components/leads/LeadsTableIntelligence.jsx`, `src/components/leads/LeadDetail.jsx`.
  Tested: Code inspection; covered by passing build, but not separately acceptance-tested.
  🟩 Done: The lead-intelligence page already shows `lead_score` and `lead_quality_label` in the UI.
  🟨 Missing: Add focused acceptance coverage if you want stronger long-term proof than repo inspection.

- **#256** [claim: Pending] Lead Intelligence dashboard: add real LeadAnalytics entity reads — currently shows no data
  Audit: Partial / wrong-scope claim: analytics reads exist, but the page is still a legacy workspace.
  Evidence: `base44/functions/automationOrchestrator/entry.ts`, `src/pages/LeadIntelligence.jsx`, `src/components/admin/AILeadInsightPanel.jsx`.
  Tested: Code inspection only.
  🟩 Done: Lead Intelligence already reads `LeadAnalytics`, but only inside the legacy `Lead` workspace.
  🟨 Missing: Decide whether this feature belongs on the legacy page or the canonical customer-leads workspace, then wire the right data source.

- **#257** [claim: Pending] Add "AI Re-Score" button in admin lead list — calls scoreLeadIntelligence for selected lead
  Audit: Valid pending.
  Evidence: `base44/functions/automationOrchestrator/entry.ts`, `src/pages/LeadIntelligence.jsx`, `src/components/admin/AILeadInsightPanel.jsx`.
  Tested: Code inspection only.
  🟩 Done: Admin already has an AI qualification panel, but it targets `aiQualifyLead`, not the requested rescore path.
  🟨 Missing: Add a real rescore action in the admin lead list and persist the canonical output.

- **#258** [claim: Pending] predictLeadOutcome: surface prediction result in ClientPortal leads tab
  Audit: Valid pending.
  Evidence: `base44/functions/automationOrchestrator/entry.ts`, `src/pages/LeadIntelligence.jsx`, `src/components/admin/AILeadInsightPanel.jsx`.
  Tested: Code inspection only.
  🟩 Done: Portal lead surfaces exist, so there is a place to render predictions once a canonical source exists.
  🟨 Missing: Generate/store prediction output and expose it in the portal leads experience.

## SECTION B: CLIENT PORTAL — Completely missing key features

- **#259** [claim: Pending] ClientPortal: build "Get Help" tab with support ticket form → creates SupportMessage entity record
  Audit: Duplicate / overlap with #67.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #67, then keep only one canonical acceptance criterion.

- **#260** [claim: Complete] ClientPortal: build "Billing" tab — show current plan, next billing date, amount
  Audit: Verified complete (repo).
  Evidence: `src/pages/ClientPortal.jsx`, `src/components/portal/BillingDashboard.jsx`, `src/components/portal/PlanManager.jsx`.
  Tested: Code inspection; covered by passing build, but not separately acceptance-tested.
  🟩 Done: The client portal already exposes a Billing tab with plan, renewal, outstanding amount, and invoice history.
  🟨 Missing: Add focused acceptance coverage if you want stronger long-term proof than repo inspection.

- **#261** [claim: Pending] ClientPortal: "Cancel Subscription" button → redirect to Stripe customer portal URL
  Audit: Duplicate of #70 with the same gap.
  Evidence: `src/pages/ClientPortal.jsx`, `src/components/portal/BillingDashboard.jsx`, `src/components/portal/PaymentFailedBanner.jsx`.
  Tested: Code inspection only.
  🟩 Done: The related portal foundation already exists.
  🟨 Missing: Merge into #70 and implement the explicit Stripe-portal cancel flow once.

- **#262** [claim: Pending] ClientPortal: "Download Invoice" button → pull Stripe invoice_pdf URL and open in new tab
  Audit: Duplicate of #71 with the same gap.
  Evidence: `src/pages/ClientPortal.jsx`, `src/components/portal/BillingDashboard.jsx`, `src/components/portal/PaymentFailedBanner.jsx`.
  Tested: Code inspection only.
  🟩 Done: The related portal foundation already exists.
  🟨 Missing: Merge into #71 and decide whether the existing invoice download UX is sufficient.

- **#263** [claim: Pending] ClientPortal: show red PaymentFailedBanner when Order billing_status === "past_due"
  Audit: Duplicate of #72 with the same gap.
  Evidence: `src/pages/ClientPortal.jsx`, `src/components/portal/BillingDashboard.jsx`, `src/components/portal/PaymentFailedBanner.jsx`.
  Tested: Code inspection only.
  🟩 Done: The related portal foundation already exists.
  🟨 Missing: Merge into #72 and wire the payment-failed banner into the actual portal flow.

- **#264** [claim: Pending] ClientPortal: build "Refer a Business" tab with unique referral link generated per client
  Audit: Duplicate / overlap with #69.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #69, then keep only one canonical acceptance criterion.

- **#265** [claim: Pending] ClientPortal: AutomationChecklist — display live checklist progress pulled from AutomationChecklist entity
  Audit: Partial foundation only.
  Evidence: `src/components/portal/BuildTracker.jsx`, `src/components/admin/InstallChecklistPanel.jsx`, `base44/functions/initializeInstallOS/entry.ts`.
  Tested: Code inspection only.
  🟩 Done: Automation checklist entities and admin surfaces already exist.
  🟨 Missing: Read `AutomationChecklist` / `AutomationChecklistStep` directly in the client portal and expose live per-service progress.

- **#266** [claim: Pending] ClientPortal: show "Setup Progress" bar driven by real ClientInstallationOS fields (twilio_configured, etc.)
  Audit: Partial foundation only.
  Evidence: `src/components/portal/BuildTracker.jsx`, `src/components/admin/InstallChecklistPanel.jsx`, `base44/functions/initializeInstallOS/entry.ts`.
  Tested: Code inspection only.
  🟩 Done: The portal already shows progress from mirrored project/order state.
  🟨 Missing: Switch the portal progress source from mirror fields to canonical `ClientInstallationOS` fields if that is now the intended truth source.

- **#267** [claim: Pending] ClientPortal: add "What's New" tab reading from a Changelog entity or AdminSettings changelog field
  Audit: Duplicate / overlap with #68.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #68, then keep only one canonical acceptance criterion.

## SECTION C: ADMIN PANEL — Missing analytics + ops features

- **#268** [claim: Pending] AdminDashboard: build MRR metric card — sum total_monthly from all Orders with payment_status=paid
  Audit: Valid pending implementation task.
  Evidence: `src/pages/AdminDashboard.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/AdminDashboard.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#269** [claim: Pending] AdminDashboard: build LTV card — total revenue per client over their lifetime
  Audit: Valid pending implementation task.
  Evidence: `src/pages/AdminDashboard.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/AdminDashboard.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#270** [claim: Pending] AdminDashboard: build Churn Risk panel — list clients with predictChurnRisk score > 70
  Audit: Valid pending.
  Evidence: `base44/functions/automationOrchestrator/entry.ts`, `src/pages/LeadIntelligence.jsx`, `src/components/admin/AILeadInsightPanel.jsx`.
  Tested: Code inspection only.
  🟩 Done: Churn-risk logic exists at the function level, but no admin panel consumes it yet.
  🟨 Missing: Persist churn scores and render a canonical panel in admin.

- **#271** [claim: Pending] AdminDashboard: wire AdminGlobalSearch to all entity types (Lead, Client, Order, SupportMessage)
  Audit: Duplicate / overlap with #46.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #46, then keep only one canonical acceptance criterion.

- **#272** [claim: Pending] AdminDashboard: add session inactivity timeout — show warning modal after 30min, logout after 45min
  Audit: Duplicate / overlap with #75.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #75, then keep only one canonical acceptance criterion.

- **#273** [claim: Pending] AdminDashboard: add "Install Status" table showing each client's onboarding step completion
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Onboarding.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Onboarding.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#274** [claim: Pending] AdminDashboard: add quick-action buttons — "Send Day 1 Email", "Trigger Follow-Up", "Mark Live" per client
  Audit: Valid pending implementation task.
  Evidence: `src/pages/AdminDashboard.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/AdminDashboard.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#275** [claim: Pending] Admin leads list: add bulk action — "Mark as contacted", "Export to CSV", "Rescore with AI"
  Audit: Valid pending implementation task.
  Evidence: `src/pages/Contact.jsx`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: Related implementation area exists: src/pages/Contact.jsx.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION D: ONBOARDING FLOW — Entity fields exist but UI never reads them

- **#276** [claim: Pending] Build InstallChecklistPanel component — reads AutomationChecklist entity fields and renders live progress
  Audit: Partial foundation only.
  Evidence: `src/components/admin/InstallChecklistPanel.jsx`, `src/components/admin/AutomationInstallChecklist.jsx`.
  Tested: Code inspection only.
  🟩 Done: Checklist components already exist and read checklist/step entities on the admin side.
  🟨 Missing: Decide which checklist component is canonical, wire it where operators actually work, and remove overlap.

- **#277** [claim: Pending] Wire onboarding_complete, went_live, twilio_configured fields to admin UI — currently invisible
  Audit: Partial foundation only.
  Evidence: `src/components/admin/AutomationInstallChecklist.jsx`, `src/components/admin/InstallOrderWorkspace.jsx`, `base44/entities/AutomationChecklist.jsonc`.
  Tested: Code inspection only.
  🟩 Done: Some onboarding/live/twilio state is already visible in admin install surfaces.
  🟨 Missing: Expose the exact requested fields consistently in the intended admin view and add proof that the values stay in sync.

- **#278** [claim: Pending] Auto-send "You're Live!" email via Resend when went_live is set to true on a ClientOnboarding record
  Audit: Valid pending.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No matching end-to-end implementation found.
  🟩 Done: The need is documented, but implementation is not present.
  🟨 Missing: Add a canonical live-email trigger tied to the true go-live field and prove it sends exactly once.

- **#279** [claim: Pending] Auto-send Telegram alert to Nolan when any onboarding step changes (twilio_configured, lead_sources_connected, etc.)
  Audit: Valid pending.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No matching end-to-end implementation found.
  🟩 Done: The need is documented, but implementation is not present.
  🟨 Missing: Add a Telegram integration path, secret storage, event trigger, and delivery proof.

- **#280** [claim: Pending] Build client-facing onboarding status page at /setup — shows their install progress without admin login
  Audit: Valid pending.
  Evidence: `src/pages/ClientPortal.jsx`, `src/components/portal/BuildTracker.jsx`.
  Tested: No matching end-to-end implementation found.
  🟩 Done: There is already a client-authenticated progress view to borrow from.
  🟨 Missing: Build the public `/setup` status route, define auth/privacy rules, and source the right progress data.

- **#281** [claim: Pending] Onboarding form: validate all required fields before submit — currently submits with empty required fields
  Audit: Duplicate of #80; both remain valid and incomplete.
  Evidence: `src/pages/Onboarding.jsx`.
  Tested: Code inspection only.
  🟩 Done: The onboarding form has required fields, but section-to-section gating is still loose.
  🟨 Missing: Merge this duplicate into #80 and add real validation before navigation and final submit.

## SECTION E: SEO — Structural gaps

- **#282** [claim: Pending] Add LocalBusiness + Service JSON-LD schema to all 6 industry pages
  Audit: Duplicate / overlap with #56.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #56, then keep only one canonical acceptance criterion.

- **#283** [claim: Pending] Add BreadcrumbList JSON-LD schema to all inner pages
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#284** [claim: Complete] Add setPageMetadata() utility — dynamic title + description + og:image per route
  Audit: Verified complete (repo).
  Evidence: `src/lib/seo.js`.
  Tested: Code inspection; covered by passing build, but not separately acceptance-tested.
  🟩 Done: A reusable `setPageMetadata()` helper already sets title, description, canonical, OG, and Twitter metadata.
  🟨 Missing: Add focused acceptance coverage if you want stronger long-term proof than repo inspection.

- **#285** [claim: Pending] Add preconnect links for fonts.googleapis.com, stripe.com, resend.com in index.html
  Audit: Partial foundation only.
  Evidence: `index.html`.
  Tested: Code inspection only.
  🟩 Done: Index already preconnects fonts and Resend.
  🟨 Missing: Add the remaining intended origins (for example Stripe) only if they are actually needed in the browser shell.

- **#286** [claim: Pending] Industry pages: include Phoenix/Scottsdale city name in H1 and meta title for local SEO
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#287** [claim: Pending] Create /blog with 3 pillar posts: AI Automation for Med Spas, Missed Call Text-Back Guide, How AI Books Appointments
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

- **#288** [claim: Complete] Add twitter:card meta tags to all pages (currently only on homepage)
  Audit: Verified complete (repo).
  Evidence: `src/lib/seo.js`, `index.html`.
  Tested: Code inspection; covered by passing build, but not separately acceptance-tested.
  🟩 Done: Twitter card metadata is already written by `setPageMetadata()` and bootstrapped in `index.html`.
  🟨 Missing: Add focused acceptance coverage if you want stronger long-term proof than repo inspection.

## SECTION F: PERFORMANCE

- **#289** [claim: Pending] Add preconnect and dns-prefetch for Stripe, Twilio, Resend CDNs in index.html
  Audit: Partial foundation only.
  Evidence: `index.html`.
  Tested: Code inspection only.
  🟩 Done: Index already contains some preconnect groundwork.
  🟨 Missing: Add only the browser-relevant third-party origins and confirm they correspond to real frontend network usage.

- **#290** [claim: Pending] Add manifest.json with name, icons, theme_color for PWA installability
  Audit: Duplicate of #62; still incomplete.
  Evidence: `index.html`.
  Tested: Code inspection only.
  🟩 Done: The app shell references `/manifest.json`.
  🟨 Missing: Create the manifest file itself, decide whether a service worker belongs in scope, and then close both tasks together.

- **#291** [claim: Pending] Add Vite manualChunks to split recharts, framer-motion, lucide into separate bundles
  Audit: Duplicate / overlap with #8.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #8, then keep only one canonical acceptance criterion.

- **#292** [claim: Pending] Add loading=lazy attribute to ALL below-fold images site-wide
  Audit: Duplicate / overlap with #6.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #6, then keep only one canonical acceptance criterion.

- **#293** [claim: Pending] Subset Google Fonts — load only Inter 400/500/600/700 + Playfair 400/600 instead of full family
  Audit: Duplicate / overlap with #66.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: Not applicable.
  🟩 Done: The backlog already contains this requirement under another task.
  🟨 Missing: Merge this row into #66, then keep only one canonical acceptance criterion.

## SECTION G: ANALYTICS + TRACKING

- **#294** [claim: Pending] Connect GA4 property — add G- tracking ID to index.html gtag snippet
  Audit: Valid pending.
  Evidence: `index.html`, `src/lib/analytics.js`.
  Tested: Code inspection only.
  🟩 Done: Analytics helper code exists and the page shell is the correct place to bootstrap GA4.
  🟨 Missing: Install a real GA4 property ID and prove the gtag snippet loads in the deployed site.

- **#295** [claim: Pending] Track checkout button clicks as GA4 conversion events
  Audit: Partial foundation only.
  Evidence: `src/lib/analytics.js`.
  Tested: Code inspection only.
  🟩 Done: The repo has a reusable `trackEvent()` helper ready for wiring.
  🟨 Missing: Call `trackEvent()` on the real checkout CTA surfaces and verify the events fire.

- **#296** [claim: Pending] Track form submissions (lead capture, contact, onboarding) as GA4 events
  Audit: Partial foundation only.
  Evidence: `src/lib/analytics.js`.
  Tested: Code inspection only.
  🟩 Done: The repo has a reusable `trackEvent()` helper ready for wiring.
  🟨 Missing: Instrument public form submit success paths and verify the events fire.

- **#297** [claim: Pending] Add UTM parameter persistence — store utm_source and utm_medium on lead record at capture
  Audit: Partial foundation only.
  Evidence: `src/pages/Contact.jsx`, `src/components/landing/LeadCaptureForm.jsx`.
  Tested: Code inspection only.
  🟩 Done: Contact already captures UTM values in form state before submission.
  🟨 Missing: Persist UTM values on the actual lead record path for every relevant form, not just the contact form state.

- **#298** [claim: Pending] Build weekly analytics digest automation — email Nolan every Monday: new leads, MRR, conversion rate, churn risk
  Audit: Valid pending implementation task.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No direct proof found beyond the current repo baseline.
  🟩 Done: No meaningful implementation evidence found beyond the backlog row itself.
  🟨 Missing: Implement the requested change, add focused coverage, and then verify it in the right runtime surface.

## SECTION H: ACCESSIBILITY + LEGAL

- **#299** [claim: Pending] Add skip-to-content link at top of every page for screen reader accessibility
  Audit: Valid pending.
  Evidence: `src/MASTER_TASK_LIST.md`.
  Tested: No matching end-to-end implementation found.
  🟩 Done: The need is documented, but implementation is not present.
  🟨 Missing: Add a real skip link, main-content anchors, and keyboard-visibility styling across layouts.

- **#300** [claim: Pending] Add TCPA-compliant SMS consent disclosure to ALL public lead capture forms — "By submitting, you consent to receive automated SMS. Reply STOP to opt out."
  Audit: Valid pending.
  Evidence: `src/components/landing/LeadCaptureForm.jsx`, `src/pages/Contact.jsx`, `src/components/store/CartSidebar.jsx`.
  Tested: No matching end-to-end implementation found.
  🟩 Done: Public forms exist, so there are known insertion points for compliant disclosure.
  🟨 Missing: Add the TCPA disclosure to every public lead form, persist consent proof, and verify copy/legal accuracy.

## Highest-Signal Findings

- The backlog header is not trustworthy in its current form: it still says 250 tasks even though the file now runs through #300 and contains a duplicated #213.
- Several rows marked complete are not true in the current repo, including the cart body-scroll lock, the checkout SMS/legal consent flow, the checkout privacy-link claim, and the Stripe-redirect timeout fallback.
- Several rows still marked pending are already built or mostly built, especially the portal support tab, the billing tab, the website-leads admin workspace, the lead-intelligence score display, and global metadata helpers.
- The most important in-progress Stripe items split three ways: #146 and #147 are effectively done in repo, #148 is still missing the recovery-email leg, and #201-#203 / #206 remain live-environment checks, not repo-only tasks.
- The expansion pack adds useful work, but a few rows are aimed at legacy lead surfaces or duplicate existing portal/admin features instead of tightening the canonical paid-customer path.
