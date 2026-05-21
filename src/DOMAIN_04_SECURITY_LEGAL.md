# DOMAIN 04 - Security & Legal / Compliance
> **Business Area:** Input validation, TCPA compliance, consent capture, honeypots, RLS rules, Privacy/Terms pages, cookie consent, data anonymization
> **~18 tasks** | Last updated: 2026-05-21
> **Agents who touch this:** Agent A (frontend forms), Agent B (backend validation), Agent C (entities/data)

---

## DOMAIN HEALTH: 39% Ready (7/18 done, 1 critical open, 1 entity-blocked)
> **Fastest win:** #92 - verify honeypot website_url field in all public forms (~30 min, no deps) - Agent B/A
> **Critical path:** #224/#225 (entity fields) -> #88/#89 (IP capture) - consent chain must complete for TCPA compliance

---

## SPRINT SNAPSHOT - updated each session
| Metric | Value |
|---|---|
| Unblocked Critical | 1 (#248 legal review) |
| Fastest Win (< 30 min, no deps) | #92 - verify honeypot website_url field in all public forms (~30 min) |
| Longest Blocked Chain | #224 -> #88 -> #89 (consent capture chain, 3 deep) |
| Done This Week | 7 tasks (#94, #20, #23, #84, #85, #86, #87) |
| Est. Hours to Domain Complete | ~13 hrs |

---

## CRITICAL

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 248 | pending | Final: review all legal pages (Privacy, Terms) for TCPA compliance accuracy | C | - | ALL sign-off in MASTER | TCPA-Compliance | ~2 hrs |

---

## HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 88 | pending | Add consent_given_at + consent_ip fields to WebsiteLead/Leads entities | B | - | B (#89 capture IP) | Consent-Capture | ~45 min |
| 89 | pending | Capture X-Forwarded-For IP in submitLeadCapture -> store as consent_ip | B | #88 | - | Consent-Capture | ~20 min |
| 92 | pending | Ensure honeypot website_url field in ALL public forms | B/A | - | - | - | ~30 min |
| 128 | pending | All SMS sends: verify opt-out language "Reply STOP to unsubscribe" is appended | B | - | - | TCPA-Compliance | ~30 min |
| 224 | pending | Add consent_given_at + consent_ip fields to WebsiteLead entity | C | - | B (#89) | Consent-Capture | ~20 min |
| 225 | pending | Add consent_given_at + consent_ip fields to Leads entity | C | - | B (#89) | Consent-Capture | ~20 min |
| 226 | pending | Verify all entity RLS rules are correct (Client entity read/write rules) | C | - | - | - | ~1 hr |
| 78 | pending | Add cookie consent to all public lead capture forms | A | - | - | Consent-Capture | ~45 min |

---

## MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 90 | pending | Add IP allowlist option in AdminSettings for admin panel access | B | #229 | - | - | ~45 min |
| 91 | pending | Create autoArchiveOldLeads: anonymize WebsiteLead records > 365 days old | B | - | B (#122 scheduled automation) | - | ~1 hr |
| 93 | pending | Add X-Frame-Options: DENY header to all backend function responses | B | - | - | - | ~30 min |
| 151 | pending | Add createAuditLog helper: write admin action records to AuditLog entity | B | #157 | C (#184 AuditLog viewer) | AuditLog | ~45 min |
| 184 | pending | Create AuditLog viewer tab in AdminDashboard | C | #157 | - | AuditLog | ~1 hr |
| 229 | pending | Add allowed_admin_ips array field to AdminSettings entity | C | - | B (#90) | - | ~20 min |

---

## COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| 94 | Privacy link on contact form and checkout | Agent B | 2026-05-03 | Added `/legal/privacy` link in `Contact.jsx` form footer and `CartSidebar` |
| 20 | robots.txt: Disallow /leads/admin (not /leads/) | Agent A | 2026-05-03 | Updated `public/robots.txt`; changed `/leads/` to `/leads/admin` |
| 23 | React ErrorBoundary wrapping all routes in App.jsx | Agent A | 2026-05-03 | Added `ErrorBoundary` component wrapping all `<Routes>` in `App.jsx` |
| 84 | Add Origin header validation to submitLeadCapture + submitContactInquiry | Morpheus | 2026-05-21 | Added shared public-form origin guard for `submitLeadCapture` and `submitContactInquiry`, defaulting to ClientSurge production origins with optional configured deployment origins |
| 85 | autoEndToEndTest: add admin role check (return 403 if not admin) | Morpheus | 2026-05-21 | Verified `autoEndToEndTest` requires `requireAdminUser`, handles `AuthGuardError`, and is covered by source regression tests |
| 86 | Move webhookLeadCapture secret from URL param to signed headers | Morpheus | 2026-05-21 | Verified `webhookLeadCapture` uses `x-webhook-id`, `x-webhook-timestamp`, and HMAC `x-webhook-signature` validation instead of URL-param secret auth |
| 87 | submitLeadCapture: normalize phone to E.164 (+1 prefix, reject < 10 digits) | Morpheus | 2026-05-21 | `normalizePhone` now stores canonical `+1XXXXXXXXXX`, rejects short/unsupported phone input, and is covered by lead-capture quality tests |
