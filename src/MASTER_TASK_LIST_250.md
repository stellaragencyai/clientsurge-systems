# ClientSurge Systems — Master Control Panel
> **Last Updated:** 2026-05-03  
> **Total Tasks:** 250 | **Completed:** ~24 | **Remaining:** ~226  
> ⚠️ This file is the **index and coordination hub only.** All tasks live in DOMAIN files below.

---

## 📅 TODAY'S DASHBOARD — UPDATE EVERY SESSION START

> Last refreshed: 2026-05-03 14:00 MST by Agent A

| Category | Count | Details |
|---|---|---|
| ✅ Completed Today | 9 | #194, #146, #147, #24, #23, #29, #25, #20, #38 |
| 🔄 In Progress Right Now | 6 | #27, #28, #43, #47, #70, #72, #195, #201–203, #206 |
| ❌ Blocked | 0 | — |
| 🧪 Ready to Test | 0 | — |

> **⚠️ AGENT RULE:** Rewrite this table every session start. Takes 30 seconds.

---

## 🗂️ DOMAIN INDEX — ALL TASKS LIVE HERE

> **Health Score Legend:** 🟢 80%+ done · 🟡 30–79% done · 🔴 <30% done

| # | File | Domain | ~Tasks | Health | Done | Critical Open | Fastest Win | Status |
|---|---|---|---|---|---|---|---|---|
| 01 | `DOMAIN_01_STRIPE_PAYMENTS.md` | 💳 Stripe & Billing | 18 | 🟡 22% | 4 | #201→#203 chain | #208 (~20 min) | 🔄 Active |
| 02 | `DOMAIN_02_LEAD_PIPELINE.md` | 🎯 Lead Tracking & CRM | 22 | 🔴 5% | 1 | #127 STOP handling | #137 (~30 min) | ⏳ Pending |
| 03 | `DOMAIN_03_AUTOMATION.md` | 🤖 Automation Engine | 22 | 🔴 0% | 0 | #95, #127 | #113 (~20 min) | ⏳ Pending |
| 04 | `DOMAIN_04_SECURITY_LEGAL.md` | 🔒 Security & Legal | 18 | 🔴 17% | 3 | #85, #248 | #85 (~30 min) | ⏳ Pending |
| 05 | `DOMAIN_05_SEO_MARKETING.md` | 📈 SEO & Marketing | 14 | 🟡 29% | 4 | None | #21 (~10 min) | ⏳ Pending |
| 06 | `DOMAIN_06_PERFORMANCE_SPEED.md` | ⚡ Speed & Performance | 12 | 🟡 42% | 5 | None | #116 (~20 min) | ⏳ Pending |
| 07 | `DOMAIN_07_FRONTEND_VISUALS.md` | 🎨 Frontend & Visuals | 28 | 🟡 32% | 9 | #76 key audit | #17 (~10 min) | 🔄 Active |
| 08 | `DOMAIN_08_CLIENT_PORTAL_ADMIN.md` | 🏠 Client Portal & Admin | 28 | 🔴 11% | 3 | None | #185 (~30 min) | 🔄 Active |
| 09 | `DOMAIN_09_DEVOPS_MONITORING.md` | 🛠️ DevOps & Monitoring | 16 | 🔴 6% | 1 | #211, #213a/b | #107 (~20 min) | ⏳ Pending |
| 10 | `DOMAIN_10_LAUNCH_CHECKLIST.md` | 🚀 Final Launch | 10 | 🔴 0% | 0 | All (D01–09 gate) | None yet | ⛔ Blocked |

---

## ⚡ PRIORITY QUEUE — GRAB FROM HERE FIRST

| Priority | Task # | Agent | Domain | Description | Est. Time |
|---|---|---|---|---|---|
| 🔴 CRITICAL | #85 | Agent B | D04 Security | autoEndToEndTest: add admin 403 check | ~30 min |
| 🔴 CRITICAL | #95 | Agent B | D03 Automation | processNurtureCampaigns: STOP check before each send | ~45 min |
| 🔴 CRITICAL | #154 | Agent B | D09 DevOps | getAdminAnalytics: fix MRR calculation | ~1 hr |
| 🔴 CRITICAL | #76 | Agent A | D07 Frontend | Verify Stripe publishable key not sk_live_ anywhere | ~20 min |
| 🟠 HIGH | #148 | Agent B | D01 Stripe | stripeWebhookOrders: recovery email on payment_failed | ~1 hr |
| 🟠 HIGH | #161 | Agent B/C | D02 Leads | Verify Order.client_id always set after checkout | ~30 min |
| 🟠 HIGH | #189 | Agent C | D08 Admin | Admin: one-click Initialize Install OS for paid orders | ~1 hr |
| 🟠 HIGH | #169 | Agent C | D02 Leads | Wire Leads.subscribe() real-time to admin leads table | ~1 hr |
| 🟠 HIGH | #35 | Agent A | D07 Frontend | Testimonials: replace broken images with initials fallback | ~30 min |
| 🟠 HIGH | #107 | Agent B | D09 DevOps | Create healthCheck function | ~20 min |

> **Rule:** When you finish a task here, remove it and add the next-highest ⏳ task from its domain file.

---

## 🔗 DEPENDENCY MAP

| Upstream (must finish first) | Blocks Downstream | Status | Last Verified |
|---|---|---|---|
| #157 — Create AuditLog entity | #151, #184 — AuditLog helper + viewer | ⏳ | 2026-05-03 |
| #146 — createCheckoutSession order_id | #148 — recovery email on payment_failed | ✅ Done | 2026-05-03 |
| #147 — stripeWebhookOrders payment_failed | #194 — PaymentFailedBanner | ✅ Done | 2026-05-03 |
| #107 — Create healthCheck function | #152, #212 — Register with UptimeRobot | ⏳ | 2026-05-03 |
| #162 — ClientProject on paid order | #118 — Milestone email automation | ⏳ | 2026-05-03 |
| #117 — Create sendNPSSurvey | #119, #232 — NPS automations | ⏳ | 2026-05-03 |
| #88 — consent_given_at fields | #89 — Capture IP in submitLeadCapture | ⏳ | 2026-05-03 |
| #110 — exportLeadsCSV | #178 — Export Logs button in UI | ⏳ | 2026-05-03 |
| #201 — Stripe Live Mode | #202, #203, #249 — webhook + E2E test | 🔄 | 2026-05-03 |
| #220 — AuditLog entity | #226 — Verify all RLS rules | ⏳ | 2026-05-03 |

---

## 💬 INTER-AGENT MESSAGES

| Date | From | To | Message |
|---|---|---|---|
| 2026-05-03 | Agent C | Agent B | #161 — need client_id confirmed before I wire portal order tracker. |
| 2026-05-03 | Agent B | Agent C | #147 ✅ — invoice.payment_failed sets billing_status: "past_due". Safe to build on. |
| 2026-05-03 | Agent C | Agent A | #72 ✅ done (PaymentFailedBanner live). Remove banner placeholder from ClientPortal if any. |
| 2026-05-03 | Agent A | All | Repo scan: #24, #23, #29 already done ✅. Completed #25 (StrictMode) and #20 (robots.txt). |
| 2026-05-03 | Agent A | Agent B | #85 and #95 — next two CRITICAL backend tasks, zero dependencies, clear to start. |
| 2026-05-03 | Agent A | Agent C | #195 — post 🧪 here when done so I can smoke test ClientPortal before marking ✅. |
| 2026-05-03 | Agent A | All | All 250 tasks restructured into 10 domain files. MASTER is now the index. Go to domain files for task details. |

---

## 🔒 CURRENTLY LOCKED TASKS

| Task # | Agent | Started | Est. Done | Description |
|---|---|---|---|---|
| #27, #28 | Sam (AI) | 2026-05-03 12:41 MST | ~2 hrs | ThemeProvider + CTA color standardization |
| #43 | Sam (AI) | 2026-05-03 12:41 MST | ~30 min | CartSidebar scroll lock |
| #47 | Sam (AI) | 2026-05-03 12:41 MST | ~30 min | SocialProofTicker real data verification |
| #70, #72 | Sam (AI) | 2026-05-03 12:41 MST | ~1 hr | BillingDashboard cancel + payment failed banner |
| #146, #147, #148 | Sam (AI) | 2026-05-03 12:41 MST | ~2 hrs | Stripe checkout + webhook backend |
| #194, #195 | Sam (AI) | 2026-05-03 12:41 MST | ~1 hr | ClientPortal payment banner + cancel flow |
| #201, #202, #203 | Sam (AI) | 2026-05-03 12:41 MST | ~3 hrs | Stripe live mode switch + E2E test |
| #206 | Sam (AI) | 2026-05-03 12:41 MST | ~30 min | getStripeCustomerPortalUrl verification |

> ⚠️ **Stale lock rule:** If 🔄 for more than 4 hours with no update, post in messages above.

---

## 👥 TEAM ASSIGNMENTS

| Agent | Workstream | Primary Domains |
|---|---|---|
| **Agent A (Base44 AI)** | Frontend, UI/UX, Store, Mobile, SEO | D05, D06, D07 (primary) + D08 portal frontend |
| **Agent B (Team Member 2)** | Backend, Automation, Security | D02, D03, D04 (primary) + D01 backend, D09 |
| **Agent C (Team Member 3)** | Admin Panel, Portal, Stripe, Ops | D01 config, D08 admin (primary) + D09, D10 |

---

## 📊 PROGRESS TRACKER

| Agent | Total | Complete | In Progress | Remaining |
|---|---|---|---|---|
| Agent A (Frontend/UI/SEO) | 83 | 14 | 0 | 69 |
| Agent B (Backend/Security) | 84 | 8 | 0 | 76 |
| Agent C (Admin/Stripe/Ops) | 83 | 2 | 1 | 80 |
| **TOTAL** | **250** | **24** | **1** | **225** |

---

## 📋 STATUS LEGEND

- ✅ **Complete** — Merged and verified in production
- 🔄 **In Progress** — Being worked on now
- ⏳ **Pending** — Not started
- ❌ **Blocked** — Needs dependency or decision
- 🧪 **Ready to Test** — Code done, needs verification
- 🟢 **SOLO** — Zero dependencies, any agent can grab immediately

---

## 🔄 CHANGE LOG

| Date | Agent | Change |
|---|---|---|
| 2026-05-03 | Agent A | Initial file created, all 250 tasks populated |
| 2026-05-03 | Agent A | Performance batch: body::before removed, content-visibility disabled, lazy-loaded ChatBubble, logo URL optimized, ExitIntentPopup removed. #6,7,65,66 ✅ |
| 2026-05-03 | Agent A | #38 ✅ — "Setup Progress" tab moved to first position, default tab in ClientPortal |
| 2026-05-03 | Agent B | #146 ✅ — salesCatalog.js pricing updated; createCheckoutSession wired into Pricing CTAs |
| 2026-05-03 | Agent B | #147 ✅ — stripeWebhookOrders: idempotency guard added via stripe_event_id |
| 2026-05-03 | Agent C | #194 ✅ — PaymentFailedBanner live in ClientPortal |
| 2026-05-03 | Agent C | #195 🔄 — BillingDashboard Cancel Subscription flow in progress |
| 2026-05-03 | Agent A | #25 ✅ — React.StrictMode in main.jsx (dev-only) |
| 2026-05-03 | Agent A | #20 ✅ — robots.txt fixed: /leads/ → /leads/admin |
| 2026-05-03 | Agent A | **RESTRUCTURE COMPLETE** — All 250 tasks migrated into 10 domain files (DOMAIN_01–10). MASTER is now a lean index/control panel only. |

---

## 📝 HOW TO USE THIS SYSTEM

1. **Start here** — Check TODAY'S DASHBOARD and PRIORITY QUEUE
2. **Go to the domain file** for your area to find task details
3. **Claim a task** — Change `⏳` → `🔄` in the domain file, add to CURRENTLY LOCKED above
4. **Finish a task** — Change `🔄` → `✅` in the domain file, remove from CURRENTLY LOCKED, update PROGRESS TRACKER
5. **Cross-agent coordination** — Post in INTER-AGENT MESSAGES above
6. **Check DEPENDENCY MAP** before starting any blocked task

---

*Last updated: 2026-05-03 | Restructured into 10 domain files for clarity*