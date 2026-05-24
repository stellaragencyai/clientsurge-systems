# 🤖 DOMAIN 03 — Automation Engine
> **Business Area:** SMS sequences, email drip, nurture campaigns, missed call recovery, booking agent, review requests, NPS, STOP handling  
> **~22 tasks** | Last updated: 2026-05-03  
> **Agents who touch this:** Agent B (functions), Agent C (admin UI)

---

## 📊 DOMAIN HEALTH: 🔴 0% Ready (0/22 done · 2 critical open · 1 upstream-blocked)
> ⚡ **Fastest win:** #113 — sendDailyDigest skip guard (~20 min, no deps) · Agent B  
> ⚠️ **Critical path:** #127 (STOP) → #95 (nurture check) — both must close before sequences can go live

---

## ⏱️ SPRINT SNAPSHOT — updated each session
| Metric | Value |
|---|---|
| 🔴 Unblocked Critical | 2 (#95, #127 — STOP handling chain) |
| 🟠 Fastest Win (< 30 min, no deps) | #113 — sendDailyDigest skip guard (~20 min) |
| 🧱 Longest Blocked Chain | #162(D02) → #118 → #231 (milestone email chain, 3 deep) |
| ✅ Done This Week | 0 tasks |
| 🎯 Est. Hours to Domain Complete | ~24 hrs |

---

## 🔴 CRITICAL

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 95 | ✅ | processNurtureCampaigns: check CommunicationEvent for STOP keyword before each send | B | — | — | 🧵 TCPA-Compliance | ~45 min |
| 127 | ✅ | receiveTwilioInboundSms: verify STOP handling immediately pauses ALL sequences | B | — | — | 🧵 TCPA-Compliance | ~1 hr |

---

## 🟠 HIGH

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 96 | ✅ | processDripCampaigns: skip leads with status "Booked" before sending each step | B | — | — | 🧵 Sequence-Guards | ~30 min |
| 97 | ✅ | processNurtureCampaigns: add idempotency guard (no duplicate send within 23hr) | B | — | — | 🧵 Sequence-Guards | ~45 min |
| 98 | ✅ | processWebsiteLeadFollowUps: add cadence_paused: true skip guard | B | — | — | 🧵 Sequence-Guards | ~30 min |
| 118 | ✅ | Entity automation: ClientProject update → milestone email on workflow_stage change | B | #162 | → C (#231 wire automation) | 🧵 Milestone-Emails | ~1 hr |
| 123 | ✅ | processAutomationJobs: add retry logic (up to 3 attempts, exponential backoff) | B | — | — | — | ~1 hr |
| 126 | ✅ | scheduleFollowUpSMS: verify business hours check uses Phoenix timezone correctly | B | — | — | — | ~30 min |
| 129 | ✅ | processMissedCallFollowUps: verify missed_call_step_sent increment is idempotent | B | — | — | 🧵 Sequence-Guards | ~30 min |
| 182 | ✅ | Admin: add "Failed Jobs" section in AdminAutomation + Retry button | C | — | — | — | ~1 hr |
| 200 | ✅ | ClientDashboard: add "Your Automation is Paused" warning when cadence_paused = true | C | — | — | 🧵 Sequence-Guards | ~30 min |
| 231 | ✅ | Entity automation: ClientProject workflow_stage change → send milestone email | C | #118 | — | 🧵 Milestone-Emails | ~45 min |

---

## 🟡 MEDIUM

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 99 | ✅ | scheduleDemoBooking: add optimistic lock — re-fetch slots before confirming | B | — | — | — | ~45 min |
| 100 | ✅ | scheduleDemoBooking: reject weekend + blocked_dates in AdminSettings | B | #228 | — | — | ~30 min |
| 108 | ✅ | Create autoCloseStaleLeads: daily function, closes leads with no contact > 30 days | B | — | → B (#120 wire scheduled automation) | 🧵 Auto-Maintenance | ~1 hr |
| 113 | ✅ | sendDailyDigest: skip send if leads_today === 0 AND orders_today === 0 | B | — | — | — | ~20 min |
| 115 | ✅ | monthlyClientReport: after generating, email it to the client | B | — | — | — | ~30 min |
| 117 | ✅ | Create sendNPSSurvey function: 7 days after order_status = "fully_live" | B | — | → B (#119) + C (#232) wire automations | 🧵 NPS-Flow | ~1 hr |
| 119 | ✅ | Entity automation: Order fully_live → trigger sendNPSSurvey after 7-day delay | B | #117 | — | 🧵 NPS-Flow | ~30 min |
| 120 | ✅ | Scheduled automation: autoCloseStaleLeads — runs daily at 2am | B | #108 | — | 🧵 Auto-Maintenance | ~15 min |
| 130 | ✅ | Twilio: add auto-provision flow for new clients in autoProvisionTwilioNumber | B | — | — | — | ~1 hr |
| 181 | ✅ | AdminLeadDetail: add "Enroll in Nurture" button → startNurtureCampaign | C | — | — | — | ~30 min |
| 230 | ✅ | Create sendNPSSurvey function — email 7 days after fully_live w/ 1-10 rating link | C | — | → C (#232 wire automation) | 🧵 NPS-Flow | ~1 hr |
| 232 | ✅ | Entity automation: Order fully_live → trigger sendNPSSurvey 7-day delay | C | #230 | — | 🧵 NPS-Flow | ~30 min |

---

## ⚪ LOW

| # | Status | Task | Agent | Dependencies | Handoff To | Thread | Est. Time |
|---|---|---|---|---|---|---|---|
| 122 | ✅ | Scheduled automation: autoArchiveOldLeads — runs monthly | B | #91 | — | 🧵 Auto-Maintenance | ~15 min |
| 124 | ✅ | Create _shared/response.js: okJson() and errJson() for consistent format | B | — | — | — | ~20 min |
| 125 | ✅ | Create _shared/retryFetch.js: reusable retry wrapper for external API calls | B | — | — | — | ~20 min |

---

## ✅ COMPLETED

| # | Task | Completed By | Date | Change Note |
|---|---|---|---|---|
| — | No completed tasks yet | — | — | — |