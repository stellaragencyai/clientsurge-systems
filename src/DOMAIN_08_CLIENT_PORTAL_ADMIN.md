# 🏠 DOMAIN 08 — Client Portal & Admin Dashboard
> **Business Area:** Client portal UX, admin dashboard features, install queue, onboarding workflow, audit trail, real-time updates  
> **~28 tasks** | Last updated: 2026-05-03  
> **Agents who touch this:** Agent A (frontend portal), Agent C (admin panel)

---

## 🟠 HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 67 | ⏳ | ClientPortal: add "Get Help" tab → SupportMessage entity | A | — | — | ~1 hr |
| 170 | ⏳ | Install Queue panel: show estimated completion date (install_initialized_at + 6 days) | C | — | — | ~30 min |
| 171 | ⏳ | Add "Resend Welcome Email" button in client detail → sendPortalWelcomeEmail | C | — | — | ~30 min |
| 172 | ⏳ | AdminSettings: add "Test Connection" buttons (Twilio + Resend) → testProviderConnections | C | — | — | ~1 hr |
| 173 | ⏳ | Add "Website Leads" tab in AdminDashboard showing WebsiteLead entity with filters | C | — | — | ~1 hr |
| 177 | ⏳ | Admin analytics: add conversion funnel chart (Lead→Contacted→Booked→Paid) | C | — | — | ~2 hrs |
| 180 | ⏳ | Add "Demo Bookings" tab in AdminDashboard for DemoRequest management | C | — | — | ~1 hr |
| 186 | ⏳ | AdminOnboarding: show pipeline_status badge prominently on each client card | C | — | — | ~30 min |
| 189 | ⏳ | Admin: add one-click "Initialize Install OS" button for newly paid orders | C | — | — | ~1 hr |
| 190 | ⏳ | Admin: show warning badge when order paid > 2 days with no install started | C | — | — | ~45 min |
| 191 | ⏳ | ClientPortal: add "Get Help" support ticket tab → SupportMessage entity | C | — | — | ~1 hr |
| 199 | ⏳ | ClientPortal: verify OrderTracker shows correct install stages for all service types | C | — | — | ~1 hr |

---

## 🟡 MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 46 | ⏳ | AdminDashboard sidebar: wire AdminGlobalSearch to all entity types | A | — | — | ~1 hr |
| 174 | ⏳ | Add "Override & Mark Live" button with required reason in AutomationInstallChecklist | C | — | — | ~45 min |
| 176 | ⏳ | AdminSettings: add "Preview Email Template" modal with sample variable substitution | C | — | — | ~1 hr |
| 178 | ⏳ | CommunicationLogsPanel: add "Export Logs" button → exportCommunicationLogs | C | #110 | — | ~30 min |
| 185 | ⏳ | AdminOnboarding: add client search/filter by business name or email | C | — | — | ~30 min |
| 187 | ⏳ | InstallQueuePanel: add "Assign to Admin" dropdown for each pending install | C | — | — | ~30 min |
| 188 | ⏳ | AutomationInstallChecklist: add progress bar showing % of checklist complete | C | — | — | ~45 min |
| 193 | ⏳ | ClientPortal: add "Refer a Business" section with unique ?ref=clientID link | C | — | — | ~45 min |
| 197 | ⏳ | ClientPortal: add NPS score display after it's collected | C | #223 | — | ~30 min |
| 198 | ⏳ | QuickStartWizard: ensure all onboarding steps link to correct help resources | C | — | — | ~30 min |

---

## ⚪ LOW

| # | Status | Task | Agent | Dependencies | Handoff To | Est. Time |
|---|---|---|---|---|---|---|
| 68 | ⏳ | ClientPortal: add "What's New" changelog section from Changelog entity | A | #221 | — | ~45 min |
| 69 | ⏳ | ClientPortal: add "Refer a Business" with unique referral link | A | #222 | — | ~30 min |
| 192 | ⏳ | ClientPortal: add "What's New" changelog section from Changelog entity | C | #221 | — | ~45 min |

---

## ✅ COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| 38 | ClientPortal: "Setup Progress" tab first + default on login | Agent A | 2026-05-03 | Changed `defaultTab` state to `"progress"` in `ClientPortal.jsx` |
| 77 | Portal graceful empty state on null project | Agent A | 2026-05-03 | Added null-check + empty state UI when `project === null` in `ClientPortal.jsx` |
| 194 | PaymentFailedBanner in ClientPortal on past_due | Agent C | 2026-05-03 | New `components/portal/PaymentFailedBanner.jsx`; shown when `billing_status === "past_due"` |