# 🔒 DOMAIN 04 — Security & Legal / Compliance
> **Business Area:** Input validation, TCPA compliance, consent capture, honeypots, RLS rules, Privacy/Terms pages, cookie consent, data anonymization  
> **~18 tasks** | Last updated: 2026-05-03  
> **Agents who touch this:** Agent A (frontend forms), Agent B (backend validation), Agent C (entities/data)

---

## 🔴 CRITICAL

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 85 | ⏳ | autoEndToEndTest: add admin role check (return 403 if not admin) | B | — | — | ~30 min |
| 248 | ⏳ | Final: review all legal pages (Privacy, Terms) for TCPA compliance accuracy | C | — | → ALL sign-off in MASTER | ~2 hrs |

---

## 🟠 HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 84 | ⏳ | Add Origin header validation to submitLeadCapture + submitContactInquiry | B | — | — | ~30 min |
| 86 | ⏳ | Move webhookLeadCapture secret from URL param to X-Webhook-Secret header | B | — | — | ~30 min |
| 87 | ⏳ | submitLeadCapture: normalize phone to E.164 (+1 prefix, reject < 10 digits) | B | — | — | ~30 min |
| 88 | ⏳ | Add consent_given_at + consent_ip fields to WebsiteLead/Leads entities | B | — | → B (#89 capture IP) | ~45 min |
| 89 | ⏳ | Capture X-Forwarded-For IP in submitLeadCapture → store as consent_ip | B | #88 | — | ~20 min |
| 92 | ⏳ | Ensure honeypot website_url field in ALL public forms | B/A | — | — | ~30 min |
| 128 | ⏳ | All SMS sends: verify opt-out language "Reply STOP to unsubscribe" is appended | B | — | — | ~30 min |
| 224 | ⏳ | Add consent_given_at + consent_ip fields to WebsiteLead entity | C | — | → B (#89) | ~20 min |
| 225 | ⏳ | Add consent_given_at + consent_ip fields to Leads entity | C | — | → B (#89) | ~20 min |
| 226 | ⏳ | Verify all entity RLS rules are correct (Client entity read/write rules) | C | — | — | ~1 hr |
| 78 | ⏳ | Add cookie consent to all public lead capture forms | A | — | — | ~45 min |

---

## 🟡 MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 90 | ⏳ | Add IP allowlist option in AdminSettings for admin panel access | B | #229 | — | ~45 min |
| 91 | ⏳ | Create autoArchiveOldLeads: anonymize WebsiteLead records > 365 days old | B | — | → B (#122 scheduled automation) | ~1 hr |
| 93 | ⏳ | Add X-Frame-Options: DENY header to all backend function responses | B | — | — | ~30 min |
| 151 | ⏳ | Add createAuditLog helper: write admin action records to AuditLog entity | B | #157 | → C (#184 AuditLog viewer) | ~45 min |
| 184 | ⏳ | Create AuditLog viewer tab in AdminDashboard | C | #157 | — | ~1 hr |
| 229 | ⏳ | Add allowed_admin_ips array field to AdminSettings entity | C | — | → B (#90) | ~20 min |

---

## ✅ COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| 94 | Privacy link on contact form and checkout | Agent B | 2026-05-03 | Added `/legal/privacy` link in `Contact.jsx` form footer and `CartSidebar` |
| 20 | robots.txt: Disallow /leads/admin (not /leads/) | Agent A | 2026-05-03 | Updated `public/robots.txt` — changed `/leads/` → `/leads/admin` |
| 23 | React ErrorBoundary wrapping all routes in App.jsx | Agent A | 2026-05-03 | Added `ErrorBoundary` component wrapping all `<Routes>` in `App.jsx` |