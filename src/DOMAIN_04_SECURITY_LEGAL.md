# 🔒 DOMAIN 04 — Security & Legal / Compliance
> **Business Area:** Input validation, TCPA compliance, consent capture, honeypots, RLS rules, Privacy/Terms pages, cookie consent, data anonymization  
> **~18 tasks** | Last updated: 2026-05-03  
> **Agents who touch this:** Agent A (frontend forms), Agent B (backend validation), Agent C (entities/data)

---

## 📊 DOMAIN HEALTH: 🔴 17% Ready (3/18 done · 2 critical open · 1 entity-blocked)
> ⚡ **Fastest win:** #85 — autoEndToEndTest admin 403 guard (~30 min, no deps) · Agent B  
> ⚠️ **Critical path:** #224/#225 (entity fields) → #88/#89 (IP capture) — consent chain must complete for TCPA compliance

---

## ⏱️ SPRINT SNAPSHOT — updated each session
| Metric | Value |
|---|---|
| 🔴 Unblocked Critical | 2 (#85 admin check, #248 legal review) |
| 🟠 Fastest Win (< 30 min, no deps) | #85 — admin 403 guard in autoEndToEndTest (~30 min) |
| 🧱 Longest Blocked Chain | #224 → #88 → #89 (consent capture chain, 3 deep) |
| ✅ Done This Week | 3 tasks (#94, #20, #23) |
| 🎯 Est. Hours to Domain Complete | ~14 hrs |

---

## 🔴 CRITICAL

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 85 | ⏳ | autoEndToEndTest: add admin role check (return 403 if not admin) | B | — | — | — | ~30 min |
| 248 | ⏳ | Final: review all legal pages (Privacy, Terms) for TCPA compliance accuracy | C | — | → ALL sign-off in MASTER | 🧵 TCPA-Compliance | ~2 hrs |

---

## 🟠 HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 84 | ⏳ | Add Origin header validation to submitLeadCapture + submitContactInquiry | B | — | — | — | ~30 min |
| 86 | ⏳ | Move webhookLeadCapture secret from URL param to X-Webhook-Secret header | B | — | — | — | ~30 min |
| 87 | ⏳ | submitLeadCapture: normalize phone to E.164 (+1 prefix, reject < 10 digits) | B | — | — | 🧵 TCPA-Compliance | ~30 min |
| 88 | ⏳ | Add consent_given_at + consent_ip fields to WebsiteLead/Leads entities | B | — | → B (#89 capture IP) | 🧵 Consent-Capture | ~45 min |
| 89 | ⏳ | Capture X-Forwarded-For IP in submitLeadCapture → store as consent_ip | B | #88 | — | 🧵 Consent-Capture | ~20 min |
| 92 | ⏳ | Ensure honeypot website_url field in ALL public forms | B/A | — | — | — | ~30 min |
| 128 | ⏳ | All SMS sends: verify opt-out language "Reply STOP to unsubscribe" is appended | B | — | — | 🧵 TCPA-Compliance | ~30 min |
| 224 | ⏳ | Add consent_given_at + consent_ip fields to WebsiteLead entity | C | — | → B (#89) | 🧵 Consent-Capture | ~20 min |
| 225 | ⏳ | Add consent_given_at + consent_ip fields to Leads entity | C | — | → B (#89) | 🧵 Consent-Capture | ~20 min |
| 226 | ⏳ | Verify all entity RLS rules are correct (Client entity read/write rules) | C | — | — | — | ~1 hr |
| 78 | ⏳ | Add cookie consent to all public lead capture forms | A | — | — | 🧵 Consent-Capture | ~45 min |

---

## 🟡 MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 90 | ⏳ | Add IP allowlist option in AdminSettings for admin panel access | B | #229 | — | — | ~45 min |
| 91 | ⏳ | Create autoArchiveOldLeads: anonymize WebsiteLead records > 365 days old | B | — | → B (#122 scheduled automation) | — | ~1 hr |
| 93 | ⏳ | Add X-Frame-Options: DENY header to all backend function responses | B | — | — | — | ~30 min |
| 151 | ⏳ | Add createAuditLog helper: write admin action records to AuditLog entity | B | #157 | → C (#184 AuditLog viewer) | 🧵 AuditLog | ~45 min |
| 184 | ⏳ | Create AuditLog viewer tab in AdminDashboard | C | #157 | — | 🧵 AuditLog | ~1 hr |
| 229 | ⏳ | Add allowed_admin_ips array field to AdminSettings entity | C | — | → B (#90) | — | ~20 min |

---

## ✅ COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| 94 | Privacy link on contact form and checkout | Agent B | 2026-05-03 | Added `/legal/privacy` link in `Contact.jsx` form footer and `CartSidebar` |
| 20 | robots.txt: Disallow /leads/admin (not /leads/) | Agent A | 2026-05-03 | Updated `public/robots.txt` — changed `/leads/` → `/leads/admin` |
| 23 | React ErrorBoundary wrapping all routes in App.jsx | Agent A | 2026-05-03 | Added `ErrorBoundary` component wrapping all `<Routes>` in `App.jsx` |