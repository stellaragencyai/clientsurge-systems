# 🏠 DOMAIN 08 — Client Portal & Admin Dashboard
> **Business Area:** Client portal UX, admin dashboard features, install queue, onboarding workflow, audit trail, real-time updates  
> **~28 tasks** | Last updated: 2026-05-03  
> **Agents who touch this:** Agent A (frontend portal), Agent C (admin panel)

---

## 📊 DOMAIN HEALTH: 🟡 25% Ready (7/28 done · 0 critical open · 1 dep-blocked)
> ⚡ **Fastest win:** #185 — AdminOnboarding search/filter (~30 min, no deps) · Agent C  
> ⚠️ **Blocked:** #178 (Export Logs) blocked on #110 · #197 (NPS display) blocked on #223

---

## ⏱️ SPRINT SNAPSHOT — updated each session
| Metric | Value |
|---|---|
| 🔴 Unblocked Critical | 0 — no critical tasks in this domain |
| 🟠 Fastest Win (< 30 min, no deps) | #170 — est. completion date in Install Queue (~30 min) |
| 🧱 Longest Blocked Chain | #110 → #178 (export logs), #223 → #197 (NPS display) |
| ✅ Done This Week | 7 tasks (#38, #77, #194, #200, #201, #202, #203) |
| 🎯 Est. Hours to Domain Complete | ~20 hrs |

---

## 🟠 HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 67 | ✅ | ClientPortal: add "Get Help" tab → SupportMessage entity | A | — | — | 🧵 Portal-Support | ~1 hr |
| 170 | ✅ | Install Queue panel: show estimated completion date (install_initialized_at + 6 days) | C | — | — | 🧵 Install-Queue | ~30 min |
| 171 | ✅ | Add "Resend Welcome Email" button in client detail → sendPortalWelcomeEmail | C | — | — | — | ~30 min |
| 172 | ✅ | AdminSettings: add "Test Connection" buttons (Twilio + Resend) → testProviderConnections | C | — | — | — | ~1 hr |
| 173 | ✅ | Add "Website Leads" tab in AdminDashboard showing WebsiteLead entity with filters | C | — | — | 🧵 Admin-Tabs | ~1 hr |
| 177 | ✅ | Admin analytics: add conversion funnel chart (Lead→Contacted→Booked→Paid) | C | — | — | 🧵 Admin-Analytics | ~2 hrs |
| 180 | ✅ | Add "Demo Bookings" tab in AdminDashboard for DemoRequest management | C | — | — | 🧵 Admin-Tabs | ~1 hr |
| 186 | ✅ | AdminOnboarding: show pipeline_status badge prominently on each client card | C | — | — | 🧵 Install-Queue | ~30 min |
| 189 | ✅ | Admin: add one-click "Initialize Install OS" button for newly paid orders | C | — | — | 🧵 Install-Queue | ~1 hr |
| 190 | ✅ | Admin: show warning badge when order paid > 2 days with no install started | C | — | — | 🧵 Install-Queue | ~45 min |
| 191 | ✅ | ClientPortal: add "Get Help" support ticket tab → SupportMessage entity | C | — | — | 🧵 Portal-Support | ~1 hr |
| 199 | ✅ | ClientPortal: verify OrderTracker shows correct install stages for all service types | C | — | — | 🧵 Install-Queue | ~1 hr |

---

## 🟡 MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 46 | ✅ | AdminDashboard sidebar: wire AdminGlobalSearch to all entity types | A | — | — | — | ~1 hr |
| 174 | ✅ | Add "Override & Mark Live" button with required reason in AutomationInstallChecklist | C | — | — | 🧵 Install-Queue | ~45 min |
| 176 | ✅ | AdminSettings: add "Preview Email Template" modal with sample variable substitution | C | — | — | — | ~1 hr |
| 178 | ✅ | CommunicationLogsPanel: add "Export Logs" button → exportCommunicationLogs | C | #110 | — | — | ~30 min |
| 185 | ✅ | AdminOnboarding: add client search/filter by business name or email | C | — | — | — | ~30 min |
| 187 | ✅ | InstallQueuePanel: add "Assign to Admin" dropdown for each pending install | C | — | — | 🧵 Install-Queue | ~30 min |
| 188 | ✅ | AutomationInstallChecklist: add progress bar showing % of checklist complete | C | — | — | 🧵 Install-Queue | ~45 min |
| 193 | ✅ | ClientPortal: add "Refer a Business" section with unique ?ref=clientID link - referrals tab and ReferABusiness component are covered by clientPortalReferralTab tests | C | — | — | — | Done |
| 197 | ✅ | ClientPortal: add NPS score display after it's collected | C | #223 | — | 🧵 NPS-Flow | ~30 min |
| 198 | ✅ | QuickStartWizard: ensure all onboarding steps link to correct help resources | C | — | — | — | ~30 min |

---

## ⚪ LOW

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 68 | ✅ | ClientPortal: add "What's New" changelog section from Changelog entity | A | #221 | — | — | ~45 min |
| 69 | ✅ | ClientPortal: add "Refer a Business" with unique referral link | A | #222 | — | — | ~30 min |
| 192 | ✅ | ClientPortal: add "What's New" changelog section from Changelog entity | C | #221 | — | — | ~45 min |

---

## ✅ COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| 38 | ClientPortal: "Setup Progress" tab first + default on login | Agent A | 2026-05-03 | Changed `defaultTab` state to `"progress"` in `ClientPortal.jsx` |
| 77 | Portal graceful empty state on null project | Agent A | 2026-05-03 | Added null-check + empty state UI when `project === null` in `ClientPortal.jsx` |
| 194 | PaymentFailedBanner in ClientPortal on past_due | Agent C | 2026-05-03 | New `components/portal/PaymentFailedBanner.jsx`; shown when `billing_status === "past_due"` |
| 200 | ClientDashboard: WelcomeBanner with personalized greeting + progress stages | Agent A | 2026-05-03 | New `components/dashboard/WelcomeBanner.jsx` — 4-stage tracker (Payment Confirmed → Setup Info → Configuring → Live), personalized name/business, context-aware CTA |
| 201 | ClientDashboard: Setup info CTA routes to `/setup/credentials?order_id=` | Agent A | 2026-05-03 | WelcomeBanner renders "Submit Setup Info" button when stageIndex===0 and order exists |
| 202 | ClientDashboard: EmptyState "Browse AI Store" button changed to blue | Agent A | 2026-05-03 | Updated gradient from gold to `#00AEEF → #003B8F` in `pages/ClientDashboard` |
| 203 | CredentialsSetup page: 5-step intake wizard for new clients post-purchase | Agent A | 2026-05-03 | New `pages/CredentialsSetup.jsx` + `components/onboarding/CredentialsWizard.jsx` — validates order, collects business/brand/messaging/integrations data, saves to `Order.install_configuration` |
