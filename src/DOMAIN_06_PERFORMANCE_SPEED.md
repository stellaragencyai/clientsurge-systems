# DOMAIN 06 - Speed & Performance
> **Business Area:** Bundle size, lazy loading, image optimization, caching, PWA, Lighthouse scores
> **~16 tasks** | Last updated: 2026-05-21
> **Agents who touch this:** Agent A (frontend), Agent B (backend caching)

---

## DOMAIN HEALTH: 81% Ready (13/16 done, 0 critical open, 0 hard-blocked)
> **Fastest win:** #114 - Resend retry once on 429/5xx (~45 min) - Agent B
> **No critical blockers** - all tasks independent, good domain to batch with other work

---

## SPRINT SNAPSHOT - updated each session
| Metric | Value |
|---|---|
| Unblocked Critical | 0 - no critical tasks in this domain |
| Fastest Win | #114 - Resend retry once on 429/5xx (~45 min) |
| Longest Blocked Chain | None - all tasks independent |
| Done This Week | 13 tasks (#6, #7, #65, #66, #24, #8, #63, #9, #10, #62, #64, #116, #153) |
| Est. Hours to Domain Complete | ~3.25 hrs |

---

## HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 160 | Pending | Add request timeout handling to all external API calls (Twilio, Resend, Stripe) | B | - | - | - | ~1 hr |
| 241 | Pending | Final: run Lighthouse audit - target 90+ performance score | A | - | ALL sign-off | - | ~1 hr |
| 246 | Pending | Final: verify admin panel loads in < 3 seconds with 100+ leads | C | - | ALL sign-off | - | ~30 min |

---

## MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 114 | Pending | All Resend fetch calls: add retry once on 429/5xx with 2-second delay | B | - | - | - | ~45 min |
| 219 | Pending | Load test: simulate 50 concurrent lead submissions, measure response time | C | - | - | - | ~1 hr |

---

## LOW

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|

---

## COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| 6 | Add loading="lazy" + width/height to below-fold images | Agent A | 2026-05-03 | Applied `loading="lazy"` to all `<img>` tags below fold in Hero, Industries, Testimonials |
| 7 | Add `<link rel="preload">` for hero image in index.html | Agent A | 2026-05-03 | Added `<link rel="preload" as="image">` for hero background in `index.html` |
| 65 | Remove three.js from package.json (saves ~600KB) | Agent A | 2026-05-03 | Removed `three` from `package.json`; bundle saved ~600KB |
| 66 | Subset Google Fonts: Inter + Playfair correct weights only | Agent A | 2026-05-03 | `index.html` - limited Inter to 400/600/700, Playfair to 400/600 |
| 24 | staleTime: 60_000 and retry: 1 in lib/query-client.js | Agent A | 2026-05-03 | Updated `lib/query-client.js` defaultOptions |
| 8 | Split recharts/framer-motion into separate Vite chunks via manualChunks | Morpheus | 2026-05-21 | Verified `vite.config.js` keeps `vendor-framer`, `vendor-charts`, and `vendor-lucide` manual chunks; removed the empty forced Stripe bundle |
| 63 | Move all Recharts imports inside lazy() components - audit AdminDashboard/Portal | Morpheus | 2026-05-21 | Lazy-loaded chart-heavy AdminDashboard tabs and ClientPortal performance/report panels behind Suspense skeletons |
| 9 | Add font-display: swap fallback for Inter/Playfair to prevent FOUT | Morpheus | 2026-05-21 | Verified all Google Font stylesheet URLs in `index.html` include `display=swap` and added test coverage |
| 10 | Store page: intersection-observer lazy rendering for 8+ products | Morpheus | 2026-05-21 | Wired the store product grid through `LazyProductGrid` when 8+ products are visible, preserving `.store-grid` layout while deferring card rendering until viewport approach |
| 62 | Add manifest.json + minimal service worker for PWA installability | Morpheus | 2026-05-21 | Added `public/manifest.json`, local SVG PWA icon, same-origin `public/sw.js`, and production-only service worker registration |
| 64 | Add ?w=800&q=80 Unsplash query params + srcSet to all hero/industry images | Morpheus | 2026-05-21 | Added shared Unsplash optimization helpers and wired responsive `srcSet`/`sizes` into public industry hero/card/modal/process/timeline image surfaces |
| 116 | getBookedDemoSlots: add {scheduled_date: selectedDate} filter (don't fetch all) | Morpheus | 2026-05-21 | Verified `getBookedDemoSlots` queries by `scheduled_date`, active booking statuses, and a bounded result count; guarded by `tests/demoBookingSchedulerGuards.test.js` |
| 153 | Add Cache-Control: public, max-age=60 to read-only functions | Morpheus | 2026-05-21 | Added short public cache headers to public read-only booking availability responses while leaving admin settings uncached/no-store |
