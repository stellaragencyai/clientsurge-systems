# DOMAIN 04 - Security & Legal / Compliance
> **Business Area:** Input validation, TCPA compliance, consent capture, honeypots, RLS rules, Privacy/Terms pages, cookie consent, data anonymization
> **~18 tasks** | Last updated: 2026-05-21
> **Agents who touch this:** Agent A (frontend forms), Agent B (backend validation), Agent C (entities/data)

---

## DOMAIN HEALTH: 91% Ready (20/22 done, 1 critical open)
> **Fastest win:** #93 - add X-Frame-Options: DENY header to backend function responses (~30 min, no deps) - Agent B
> **Critical path:** #248 legal review after remaining security/privacy hardening

---

## SPRINT SNAPSHOT - updated each session
| Metric | Value |
|---|---|
| Unblocked Critical | 1 (#248 legal review) |
| Fastest Win (< 30 min, no deps) | #93 - add X-Frame-Options: DENY header to backend function responses (~30 min) |
| Longest Blocked Chain | none currently identified |
| Done This Week | 20 tasks (#94, #20, #23, #78, #84, #85, #86, #87, #88, #89, #90, #91, #92, #128, #151, #184, #224, #225, #226, #229) |
| Est. Hours to Domain Complete | ~2.5 hrs plus legal review |

---

## CRITICAL

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 248 | pending | Final: review all legal pages (Privacy, Terms) for TCPA compliance accuracy | C | - | ALL sign-off in MASTER | TCPA-Compliance | ~2 hrs |

---

## HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| - | - | No remaining high-priority safe internal items | - | - | - | - | - |

---

## MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 93 | pending | Add X-Frame-Options: DENY header to all backend function responses | B | - | - | - | ~30 min |

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
| 92 | Ensure honeypot website_url field in ALL public forms | Morpheus | 2026-05-21 | Standardized `website_url` as the public-form honeypot across lead/contact capture paths and moved Sam's real website capture to `business_website_url` |
| 128 | All SMS sends: verify opt-out language "Reply STOP to unsubscribe" is appended | Morpheus | 2026-05-21 | Added shared `appendSmsOptOut` helper and wired it into core direct Twilio customer send paths plus regression tests |
| 88 | Add consent_given_at + consent_ip fields to WebsiteLead/Leads entities | Morpheus | 2026-05-21 | Added consent audit fields to lead entities and source tests |
| 89 | Capture X-Forwarded-For IP in submitLeadCapture -> store as consent_ip | Morpheus | 2026-05-21 | `submitLeadCapture` now stores normalized client IP as `consent_ip` on WebsiteLead and propagates it to CRM Leads |
| 224 | Add consent_given_at + consent_ip fields to WebsiteLead entity | Morpheus | 2026-05-21 | WebsiteLead already had `consent_given_at`; added `consent_ip` to complete the audit pair |
| 225 | Add consent_given_at + consent_ip fields to Leads entity | Morpheus | 2026-05-21 | Added CRM Lead consent audit fields and propagation from website capture |
| 226 | Verify all entity RLS rules are correct (Client entity read/write rules) | Morpheus | 2026-05-21 | Verified Client create/delete are admin-only and read/update are admin-or-own-email, with regression coverage |
| 78 | Add cookie consent to all public lead capture forms | Morpheus | 2026-05-21 | Moved `CookieConsent` to the public app shell so all public lead/form routes share the same consent banner without duplicating it on protected routes |
| 91 | Create autoArchiveOldLeads: anonymize WebsiteLead records > 365 days old | Morpheus | 2026-05-21 | Retargeted `autoArchiveOldLeads` from legacy `SpaLead` to canonical `WebsiteLead`, added archive schema markers, PII scrubbing, automation guard, and regression coverage |
| 229 | Add allowed_admin_ips array field to AdminSettings entity | Morpheus | 2026-05-21 | Added `allowed_admin_ips` array to AdminSettings schema, defaults, mutable settings whitelist, and regression tests |
| 90 | Add IP allowlist option in AdminSettings for admin panel access | Morpheus | 2026-05-21 | Added Admin Settings Security tab editor for allowed admin IPs and fixed settings API unwrap/save behavior so the option persists |
| 151 | Add createAuditLog helper: write admin action records to AuditLog entity | Morpheus | 2026-05-21 | Verified the shared `createAuditLog` helper writes canonical AuditLog entity fields through service-role create and added regression coverage |
| 184 | Create AuditLog viewer tab in AdminDashboard | Morpheus | 2026-05-21 | Added an Admin Dashboard Audit Log tab backed by `AuditLog.list`, with search, expandable before/after details, refresh, and CSV export |
