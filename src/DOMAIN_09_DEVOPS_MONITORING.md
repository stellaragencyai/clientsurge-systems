# 🛠️ DOMAIN 09 — DevOps, Monitoring & Operational Readiness
> **Business Area:** Uptime monitoring, error alerting, secrets management, DNS/SSL, load testing, runbooks, environment validation  
> **~16 tasks** | Last updated: 2026-05-03  
> **Agents who touch this:** Agent B (functions), Agent C (ops/config)

---

## 🔴 CRITICAL

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 211 | ⏳ | Configure custom domain DNS + verify SSL cert | C | — | — | ~1 hr |
| 213a | ⏳ | Configure Resend domain authentication (SPF, DKIM, DMARC) | C | — | — | ~1 hr |
| 213b | ⏳ | Verify Twilio number is A2P 10DLC registered for US commercial SMS | C | — | — | ~2 hrs |
| 218 | ⏳ | Verify all secrets are set in production (not just dev) environment | C | — | — | ~30 min |

---

## 🟠 HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 107 | ⏳ | Create healthCheck function: returns {status:"ok", timestamp, version} — no auth | B | — | → C (#152 register with UptimeRobot) | ~20 min |
| 152 | ⏳ | Register healthCheck URL with UptimeRobot or Better Stack | C | #107 | — | ~30 min |
| 154 | ⏳ | getAdminAnalytics: fix MRR to sum total_monthly from paid Orders | B | — | — | ~1 hr |
| 155 | ⏳ | getClientAnalytics: remove hardcoded mock data — replace with real entity queries | B | — | — | ~1 hr |
| 212 | ⏳ | Set up UptimeRobot or Better Stack monitoring on healthCheck endpoint | C | #107 | — | ~30 min |
| 215 | ⏳ | Set up error alerting: admin email on any backend function 5xx error | C | — | — | ~1 hr |

---

## 🟡 MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 103 | ⏳ | discoverLeads: return 503 with clear error if Google Maps API key is missing | B | — | — | ~15 min |
| 112 | ⏳ | Extend autoEndToEndTest: full checkout → webhook → email → status flow w/ cleanup | B | — | — | ~2 hrs |
| 158 | ⏳ | Add standardized console.log format to all functions: [functionName] msg {ctx} | B | — | — | ~1 hr |
| 159 | ⏳ | Verify all functions return proper HTTP status codes (not always 200) | B | — | — | ~45 min |
| 216 | ⏳ | Document all environment variables in README_ENV.md | C | — | — | ~30 min |
| 217 | ⏳ | Create runbook: Twilio down / Resend down / Stripe down scenarios | C | — | — | ~1 hr |
| 219 | ⏳ | Load test: simulate 50 concurrent lead submissions, measure response time | C | — | — | ~1 hr |

---

## ⚪ LOW

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 156 | ⏳ | getClientPortalContext: on auth, write portal_login CommunicationEvent | B | — | — | ~20 min |

---

## ✅ COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| 109 | OrderSuccess: add noindex meta tag | Agent B | 2026-05-03 | Added `<meta name="robots" content="noindex">` in `pages/OrderSuccess.jsx` via `setPageMetadata` |