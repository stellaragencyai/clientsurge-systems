# 📈 DOMAIN 05 — SEO & Marketing
> **Business Area:** Schema markup, Open Graph, sitemap, local SEO, blog, hreflang, Google Analytics, advertising readiness  
> **~14 tasks** | Last updated: 2026-05-03  
> **Agents who touch this:** Agent A (all)

---

## 📊 DOMAIN HEALTH: 🟡 29% Ready (4/14 done · 0 critical open · 0 hard-blocked)
> ⚡ **Fastest win:** #21 — hreflang tag in index.html (~10 min, no deps) · Agent A  
> ✅ **No critical blockers** — all remaining tasks are independent and can be grabbed in any order

---

## ⏱️ SPRINT SNAPSHOT — updated each session
| Metric | Value |
|---|---|
| 🔴 Unblocked Critical | 0 — no critical tasks in this domain |
| 🟠 Fastest Win (< 30 min, no deps) | #21 — hreflang tag (~10 min), #83 — verify industry card links (~15 min) |
| 🧱 Longest Blocked Chain | None — all tasks independent |
| ✅ Done This Week | 4 tasks (#60, #82, #20, #106) |
| 🎯 Est. Hours to Domain Complete | ~9 hrs |

---

## 🟠 HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 56 | ⏳ | Industry pages: inject LocalBusiness + Service JSON-LD schema markup | A | — | — | 🧵 Schema-SEO | ~1 hr |
| 57 | ⏳ | Generate og:image (1200x630) and add to index.html + setPageMetadata | A | — | — | 🧵 Social-Meta | ~1 hr |
| 18 | ⏳ 🟢 | Industry sub-pages: ensure hero headline renders as semantic `<h1>` tag | A | — | — | 🧵 Schema-SEO | ~20 min |
| 19 | ⏳ 🟢 | Add descriptive alt text to all hero, testimonial, and TrustBar images | A | — | — | — | ~30 min |
| 214 | ⏳ | Add GA4 event tracking: purchase, demo_booked, lead_submitted | A/C | — | — | 🧵 GA4-Events | ~1 hr |
| 247 | ⏳ | Final: confirm robots.txt correct + sitemap submitted to Google Search Console | A | — | → ALL sign-off | — | ~30 min |

---

## 🟡 MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 58 | ⏳ | Industry page titles: include city/location for local SEO signals | A | — | — | 🧵 Schema-SEO | ~30 min |
| 59 | ⏳ | Add internal linking: Footer cross-links industry pages; Store links industry pages | A | — | — | — | ~30 min |
| 22 | ⏳ | Stub /blog route with 3 placeholder posts for organic SEO | A | — | — | — | ~1 hr |
| 39 | ⏳ | Industry pages CTAs: use industry-specific headline copy from industryData.js | A | — | — | — | ~30 min |
| 81 | ⏳ | All pages: verify meta description is unique (not default fallback) | A | — | — | 🧵 Social-Meta | ~45 min |
| 83 | ⏳ | pages/Industries: verify all 6 industry cards link to correct routes | A | — | — | — | ~15 min |

---

## ⚪ LOW

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 21 | ⏳ 🟢 | Add hreflang tag to index.html for future i18n readiness | A | — | — | — | ~10 min |
| 61 | ⏳ | Create generateSitemap backend function for dynamic sitemap at /sitemap.xml | B | — | — | — | ~1 hr |

---

## ✅ COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| 60 | sitemap.xml: add all industry pages and core routes | Agent A | 2026-05-03 | Updated `public/sitemap.xml` with all 6 industry routes + core pages |
| 82 | sitemap.xml updated with industry pages | Agent A | 2026-05-03 | Added `/med-spa`, `/dental`, `/hvac`, `/roofing`, `/contractors`, `/chiropractic` |
| 20 | robots.txt fixed: /leads/admin | Agent A | 2026-05-03 | `public/robots.txt` — blocked `/leads/admin`, not `/leads/` |
| 106 | robots.txt updated with admin blocks | Agent B | 2026-05-03 | Added `/admin`, `/dashboard`, `/client-portal` Disallow rules |