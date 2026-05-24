# 🎯 DOMAIN 02 — Lead Tracking & CRM Pipeline
> **Business Area:** Lead capture, deduplication, scoring, routing, enrichment, reactivation, pipeline management  
> **~22 tasks** | Last updated: 2026-05-03  
> **Agents who touch this:** Agent B (backend), Agent C (admin UI)

---

## 📊 DOMAIN HEALTH: 🔴 5% Ready (1/22 done · 1 critical open · 0 hard-blocked)
> ⚡ **Fastest win:** #104 — enrichLeadWithAI 7-day skip guard (~20 min, no deps) · Agent B  
> ⚠️ **Critical path:** #127 (STOP handling) must complete before #95 in D03 can be verified

---

## ⏱️ SPRINT SNAPSHOT — updated each session
| Metric | Value |
|---|---|
| 🔴 Unblocked Critical | 1 (#127 — STOP handling verification) |
| 🟠 Fastest Win (< 30 min, no deps) | #137 — dedup window verification (30 min) |
| 🧱 Longest Blocked Chain | #162 → #118 → #231 (3 deep, milestone emails) |
| ✅ Done This Week | 1 task (#4) |
| 🎯 Est. Hours to Domain Complete | ~22 hrs |

---

## 🔴 CRITICAL

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 127 | ✅ | receiveTwilioInboundSms: verify STOP handling immediately pauses ALL sequences | B | — | → B (#95 STOP check in nurture) | 🧵 TCPA-Compliance | ~1 hr |

---

## 🟠 HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 137 | ✅ | submitLeadCapture: verify deduplication window is exactly 60 minutes | B | — | — | 🧵 Lead-Dedup | ~30 min |
| 138 | ✅ | onLeadCreated: verify webhook payload includes all required fields | B | — | — | — | ~30 min |
| 141 | ✅ | routeLead: verify assigned_to field is populated correctly for all lead types | B | — | — | — | ~30 min |
| 142 | ✅ | createLeadAndDispatch: add error recovery if CommunicationEvent creation fails | B | — | — | — | ~45 min |
| 143 | ✅ | validateLeadQuality: add check for disposable email domains (mailinator, etc.) | B | — | — | 🧵 Lead-Quality | ~30 min |
| 144 | ✅ | deduplicateLeads: run dedup on phone hash as well as email | B | — | — | 🧵 Lead-Dedup | ~45 min |
| 161 | ✅ | Verify Order entity client_id is always set after checkout completes | B/C | — | → C (portal order tracker) | 🧵 Order-Linking | ~30 min |
| 162 | ✅ | Verify ClientProject is always created when Order payment_status = "paid" | B/C | — | → B (#118 milestone email) | 🧵 Order-Linking | ~30 min |
| 163 | ✅ | Verify CommunicationEvent is created for every SMS/email send attempt | B | — | — | — | ~45 min |
| 168 | ✅ | Admin: add bulk status update to lead table (checkboxes + "Mark as Contacted") | C | — | — | 🧵 Admin-LeadUI | ~1 hr |
| 169 | ✅ | Wire Leads.subscribe() real-time listener to auto-refresh admin leads table | C | — | — | 🧵 Admin-LeadUI | ~1 hr |
| 175 | ✅ | AdminLeadDetail: add "Send Manual SMS" text area + button → sendSMS | C | — | — | 🧵 Admin-LeadUI | ~45 min |
| 179 | ✅ | AdminLeads table: add lead_score column (visible, sortable, color-coded) | C | — | — | 🧵 Admin-LeadUI | ~1 hr |

---

## 🟡 MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 139 | ✅ | scoreLeads: verify lead_score calculation accounts for all scoring factors | B | — | — | 🧵 Lead-Quality | ~30 min |
| 140 | ✅ | scoreLeadIntelligence: add confidence threshold — skip if AI confidence < 0.6 | B | — | — | 🧵 Lead-Quality | ~30 min |
| 145 | ✅ | enrichLead: add timeout of 10 seconds max for external enrichment calls | B | — | — | — | ~20 min |
| 164 | ✅ | Add data validation: Order.total_monthly must equal sum of item monthly_fees | B | — | — | 🧵 Order-Linking | ~30 min |
| 165 | ✅ | Ensure AutomationChecklist records created for every paid service | B/C | — | — | 🧵 Order-Linking | ~45 min |
| 166 | ✅ | Verify pipeline_status and order_status stay in sync after every transition | B | — | — | 🧵 Order-Linking | ~45 min |
| 167 | ✅ | Run deduplicateLeads on all existing Leads records to clean up database | B | — | — | 🧵 Lead-Dedup | ~30 min |
| 183 | ✅ | AdminLeads: mask phone numbers as (602) ***-3227 for non-super-admin users | C | — | — | 🧵 Admin-LeadUI | ~30 min |

---

## ⚪ LOW

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 104 | ✅ | enrichLeadWithAI: skip enrichment if lead.enriched_at < 7 days ago | B | — | — | — | ~20 min |

---

## ✅ COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| 4 | Store search debounce 280ms | Agent A | 2026-05-03 | Added 280ms `useDebounce` hook to store search input in `pages/Store.jsx` |