# ⚡ DOMAIN 06 — Speed & Performance
> **Business Area:** Bundle size, lazy loading, image optimization, caching, PWA, Lighthouse scores  
> **~12 tasks** | Last updated: 2026-05-03  
> **Agents who touch this:** Agent A (frontend), Agent B (backend caching)

---

## 🟠 HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 63 | ⏳ | Move all Recharts imports inside lazy() components — audit AdminDashboard/Portal | A | — | — | ~1 hr |
| 116 | ⏳ | getBookedDemoSlots: add {scheduled_date: selectedDate} filter (don't fetch all) | B | — | — | ~20 min |
| 160 | ⏳ | Add request timeout handling to all external API calls (Twilio, Resend, Stripe) | B | — | — | ~1 hr |
| 241 | ⏳ | Final: run Lighthouse audit — target 90+ performance score | A | — | → ALL sign-off | ~1 hr |
| 246 | ⏳ | Final: verify admin panel loads in < 3 seconds with 100+ leads | C | — | → ALL sign-off | ~30 min |

---

## 🟡 MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 8 | ⏳ | Split recharts/framer-motion into separate Vite chunks via manualChunks | A | — | — | ~1 hr |
| 10 | ⏳ | Store page: intersection-observer lazy rendering for 8+ products | A | — | — | ~45 min |
| 64 | ⏳ | Add ?w=800&q=80 Unsplash query params + srcSet to all hero/industry images | A | — | — | ~45 min |
| 114 | ⏳ | All Resend fetch calls: add retry once on 429/5xx with 2-second delay | B | — | — | ~45 min |
| 153 | ⏳ | Add Cache-Control: public, max-age=60 to read-only functions | B | — | — | ~30 min |
| 219 | ⏳ | Load test: simulate 50 concurrent lead submissions, measure response time | C | — | — | ~1 hr |

---

## ⚪ LOW

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 9 | ⏳ 🟢 | Add font-display: swap fallback for Inter/Playfair to prevent FOUT | A | — | — | ~15 min |
| 62 | ⏳ | Add manifest.json + minimal service worker for PWA installability | A | — | — | ~1 hr |

---

## ✅ COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| 6 | Add loading="lazy" + width/height to below-fold images | Agent A | 2026-05-03 | Applied `loading="lazy"` to all `<img>` tags below fold in Hero, Industries, Testimonials |
| 7 | Add `<link rel="preload">` for hero image in index.html | Agent A | 2026-05-03 | Added `<link rel="preload" as="image">` for hero background in `index.html` |
| 65 | Remove three.js from package.json (saves ~600KB) | Agent A | 2026-05-03 | Removed `three` from `package.json`; bundle saved ~600KB |
| 66 | Subset Google Fonts: Inter + Playfair correct weights only | Agent A | 2026-05-03 | `index.html` — limited Inter to 400/600/700, Playfair to 400/600 |
| 24 | staleTime: 60_000 and retry: 1 in lib/query-client.js | Agent A | 2026-05-03 | Updated `lib/query-client.js` defaultOptions |