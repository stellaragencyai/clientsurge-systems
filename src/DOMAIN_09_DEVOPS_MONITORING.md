# DOMAIN 09 - DevOps, Monitoring & Operational Readiness
> **Business Area:** Uptime monitoring, error alerting, secrets management, DNS/SSL, load testing, runbooks, environment validation
> **~16 tasks** | Last updated: 2026-05-21
> **Agents who touch this:** Agent B (functions), Agent C (ops/config)

---

## DOMAIN HEALTH: 25% Ready (4/16 done, 4 critical open, 0 hard-blocked)
> **Fastest win:** #216 - document all environment variables in README_ENV.md (~30 min, no deps) - Agent C
> **Critical path:** #152/#212 (monitoring registration) - healthCheck exists; external monitor registration still needs approval/action outside the repo

---

## SPRINT SNAPSHOT - updated each session
| Metric | Value |
|---|---|
| Unblocked Critical | 4 (#211 DNS, #213a Resend DKIM, #213b Twilio 10DLC, #218 secrets audit) |
| Fastest Win (< 30 min, no deps) | #216 - document all environment variables in README_ENV.md (~30 min) |
| Longest Blocked Chain | #152 -> monitoring live (1 deep; external registration) |
| Done This Week | 4 tasks (#109, #107, #156, #103) |
| Est. Hours to Domain Complete | ~13 hrs |

---

## CRITICAL

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 211 | pending | Configure custom domain DNS + verify SSL cert | C | - | - | Go-Live-Infra | ~1 hr |
| 213a | pending | Configure Resend domain authentication (SPF, DKIM, DMARC) | C | - | - | Go-Live-Infra | ~1 hr |
| 213b | pending | Verify Twilio number is A2P 10DLC registered for US commercial SMS | C | - | - | Go-Live-Infra | ~2 hrs |
| 218 | pending | Verify all secrets are set in production (not just dev) environment | C | - | - | Go-Live-Infra | ~30 min |

---

## HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 152 | pending | Register healthCheck URL with UptimeRobot or Better Stack | C | #107 | - | Monitoring | ~30 min |
| 154 | done | getAdminAnalytics: fix MRR to sum total_monthly from paid Orders | B | - | - | - | Done |
| 155 | pending | getClientAnalytics: remove hardcoded mock data - replace with real entity queries | B | - | - | - | ~1 hr |
| 212 | pending | Set up UptimeRobot or Better Stack monitoring on healthCheck endpoint | C | #107 | - | Monitoring | ~30 min |
| 215 | pending | Set up error alerting: admin email on any backend function 5xx error | C | - | - | Monitoring | ~1 hr |

---

## MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 112 | pending | Extend autoEndToEndTest: full checkout -> webhook -> email -> status flow w/ cleanup | B | - | - | - | ~2 hrs |
| 158 | pending | Add standardized console.log format to all functions: [functionName] msg {ctx} | B | - | - | - | ~1 hr |
| 159 | pending | Verify all functions return proper HTTP status codes (not always 200) | B | - | - | - | ~45 min |
| 216 | pending | Document all environment variables in README_ENV.md | C | - | - | - | ~30 min |
| 217 | done | Create runbook: Twilio down / Resend down / Stripe down scenarios | C | docs/RUNBOOK_OUTAGE.md | Morpheus | 2026-05-20 | ~1 hr |
| 219 | pending | Load test: simulate 50 concurrent lead submissions, measure response time | C | - | - | - | ~1 hr |

---

## LOW

No pending low-priority Domain 09 tasks.

---

## COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| 109 | OrderSuccess: add noindex meta tag | Agent B | 2026-05-03 | Added `<meta name="robots" content="noindex">` in `pages/OrderSuccess.jsx` via `setPageMetadata` |
| 107 | Create healthCheck function: returns `{status:"ok", timestamp, version}` - no auth | Morpheus | 2026-05-21 | Verified existing public `base44/functions/healthCheck/entry.ts` endpoint and added source regression coverage for no-auth monitoring payload shape |
| 156 | getClientPortalContext: on auth, write portal_login CommunicationEvent | Morpheus | 2026-05-21 | Added best-effort authenticated portal login audit events for linked and empty/error portal states, plus schema/test coverage for `portal_login` |
| 103 | discoverLeads: return 503 with clear error if Google Maps API key is missing | Morpheus | 2026-05-21 | Verified existing `discoverLeadsGuard` integration, server-side `GOOGLE_MAPS_API_KEY` docs, and Deno/source regression coverage for launch-safe 503 behavior |
