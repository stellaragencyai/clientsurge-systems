# Agent Task Control Center

This file is the shared coordination layer for the master backlog. The task rows in `src/MASTER_TASK_LIST.md` remain the canonical backlog, but this control center is where the three agents coordinate locks, handoffs, blockers, verification, and short chat-style notes.

## Sources

- Master backlog: `src/MASTER_TASK_LIST.md`
- Truth audit: `docs/task-authenticity-audit-2026-05-03.md`

## Agent Protocol

Every AI agent should use this protocol before touching the repo or changing a task row.

1. Read `src/MASTER_TASK_LIST.md`, this control center, and the truth audit first.
2. Check the lock board and request router before claiming work.
3. Claim work by moving the row to `🔄`, adding yourself to the lock board, and recording the claim timestamp.
4. Leave a heartbeat whenever you materially change scope, hit a blocker, finish a batch, or at least once every 30 minutes while the task is active.
5. If you need another agent, open a structured request in the request router instead of burying it in chat.
6. Do not move a task to `✅` until repo proof exists, the right verification has been recorded, and any required live proof is attached.
7. If a task becomes blocked, move it to `❌`, add the blocker, and either route a request or return it to queue with notes.
8. When done, update the backlog row, this control center, and the master-file change log together.

## Lease Rules

- A `🔄` task is a lease, not just a note.
- Default heartbeat expectation: every 30 minutes while active.
- Default stale timeout: 4 hours without a heartbeat unless the row says otherwise.
- If a lease goes stale, another agent may reclaim it only after adding a reclaim note in the request router or agent chat.
- Reclaimed tasks must keep prior findings unless they are explicitly disproven.

## AI-Agent Coordination Cross-Check

This is the audit against the proposed multi-agent operating model for three AI agents using the markdown board as their shared operating system.

### 1. Unified Agent Protocol — 🟩 Implemented

- 🟩 Shared truth sources already exist in this file and the master backlog.
- 🟩 Status semantics already exist: `✅`, `🔄`, `⏳`, `❌`, `↪`, `💬`, `🧪`.
- 🟩 Update expectations already exist in the master backlog under collaboration rules and update instructions.
- 🟩 A top-of-file agent protocol now tells a newly activated AI agent what order to follow: read, claim, heartbeat, request help, verify, close.
- 🟩 A cadence rule now exists for expected heartbeats and stale-task reclaim behavior.

### 2. Task Lease + Heartbeat System — 🟩 Implemented

- 🟩 The current lock board already tracks task owner, reason, last update, and exit condition.
- 🟩 The board now behaves like an explicit lease system instead of an informal lock list.
- 🟩 `claimed_at`, `last_heartbeat`, `stale_after`, and `next_action` are now first-class fields.
- 🟩 A reclaim rule now tells another AI agent when a stale lock may be taken over.

### 3. Inter-Agent Inbox / Request Router — 🟩 Implemented

- 🟩 The handoff queue already exists.
- 🟩 The agent chat table already exists.
- 🟩 The old handoff queue is now upgraded into a structured request router for agent-to-agent coordination.
- 🟩 Request type, expected deliverable, due-by priority, acknowledgement, and status fields now exist.

### 4. Implementation vs Verification vs Launch Truth — 🟩 Implemented For Launch-Important Rows

- 🟩 The truth audit file already exists and is linked from both coordination docs.
- 🟩 The live-proof queue already distinguishes repo truth from production truth for critical launch tasks.
- 🟩 The `🧪` proof-note concept already exists.
- 🟩 The master backlog now includes a launch-important checkpoint board that separates `Implemented`, `Tested`, `Live`, and `Gate` truth for the highest-signal launch tasks.
- 🟨 The full 300-task backlog still does not expose this truth split row-by-row, so the new model is intentionally scoped to launch-important work first.

### 5. Launch System Blueprint For Business-Critical Workflows — 🟩 Implemented

- 🟨 The backlog is grouped by domains and workstreams already.
- 🟨 Supporting docs already exist for pieces of launch readiness such as Stripe go-live.
- 🟩 There is now a canonical workflow matrix inside the shared coordination system for the must-have launch systems.
- 🟩 The launch matrix now maps each business-critical workflow to owner, trigger, channels, dependencies, assets, environment requirements, fallback path, and launch proof.
- 🟨 Some workflow state still depends on repo-truth refreshes and live-proof updates, so the matrix is now present but will need ongoing upkeep.

## Summary

- 🟩 Already strong: shared truth sources, status language, lock ownership, handoff/chat basics, proof mindset, unified protocol, explicit leases, structured request routing, and a launch blueprint matrix.
- 🟨 Still partial: the checkpoint split now exists for launch-important work, but not yet for the full backlog.
- 🟨 Ongoing need: the launch blueprint is now present, but it must stay synced with real repo and live-state evidence.

## Current Snapshot

| Metric | Value | Notes |
|---|---|---|
| Planned task IDs | 300 | Backlog extends through `#300` |
| Current task rows | 301 | Duplicate task IDs still need cleanup |
| Status counts | `✅ 21 / 🔄 13 / ⏳ 267 / ❌ 0` | This is the row-state snapshot from the latest repo audit |
| Known false greens | High-signal set corrected in backlog on 2026-05-03 | `#2`, `#3`, `#5`, `#94`, `#101` now reflect pending work again |
| Known stale pendings | High-signal set corrected in backlog on 2026-05-03 | `#11`, `#29`, `#67`, `#146`, `#147`, `#173`, `#255`, `#260`, `#284`, `#288` were promoted to match repo reality |
| Live-only proof tasks | `#201`, `#202`, `#203`, `#206`, `#213a`, `#213b`, `#241-#250` | These cannot become true green from repo code alone |

## Maintenance Rule

- If the backlog gains or loses tasks, update `src/MASTER_TASK_LIST.md` top counts immediately and keep this file's snapshot aligned with the latest audit.

## Status Rules

- `✅` means repo proof exists, the task has been tested at the right level, and any required live proof has been recorded.
- `🔄` means one agent owns the task right now. A task should not stay `🔄` without an owner and a last update.
- `⏳` means unclaimed or returned to queue.
- `❌` means blocked by a specific dependency, not just unfinished.
- `↪` in notes means delegated to another agent.
- `💬` in notes means a reply is needed before work can continue.
- `🧪` in notes means there is real test coverage or a named verification command.

## Agent Lanes

| Agent | Ownership | Current Locks | Next High-Value Cleanup | Waiting On |
|---|---|---|---|---|
| Agent A | `#1-#83`, `#282-#300` | `#27`, `#28`, `#43`, `#47` | `#2`, `#3`, `#5`, `#23`, `#300` | Base44-confirmed UI overlap decisions and cart/consent fixes |
| Agent B | `#84-#167`, `#251-#258`, `#298` | `#148` | `#94`, `#126`, `#128`, `#131`, `#251` | Canonical backend path decisions and live verification windows |
| Agent C | `#168-#250`, `#259-#281` | `#70`, `#72`, `#194`, `#195`, `#201`, `#202`, `#203`, `#206` | `#273`, `#275`, `#278`, `#279`, `#280` | Live Stripe environment, portal proof, and ops-side access |

## Current Lock Board

| Task | Owner | Reason | Claimed At | Last Heartbeat | Stale After | Next Action | Exit Condition |
|---|---|---|---|---|---|---|---|
| `#27`, `#28`, `#43`, `#47` | Agent A | Active store/theme workstream | 2026-05-03 12:41 MST | 2026-05-03 | 4h with no heartbeat | Finish current store/theme edits or return rows to queue with notes | Repo proof exists and row is either finished or returned to queue |
| `#148` | Agent B | Stripe/backend reliability workstream | 2026-05-03 | 2026-05-03 | 4h with no heartbeat | Verify the missing payment-failed recovery email path or downgrade the row from `🔄` | Recovery-email truth is verified and the row can move to `✅` or back to `⏳` |
| `#70`, `#72`, `#194`, `#195`, `#201`, `#202`, `#203`, `#206` | Agent C | Billing, portal, and live Stripe ops workstream | 2026-05-03 | 2026-05-03 | 4h with no heartbeat | Reconcile portal billing truth and record any live Stripe proof that exists | Portal flow is truthful and live-environment proof is recorded where required |

## Request Router

| Opened | From | To | Task | Request Type | Exact Need | Expected Deliverable | Due / Priority | Ack | Status |
|---|---|---|---|---|---|---|---|---|---|
| 2026-05-03 | System | Agent A | `#2` | Need frontend implementation | Implement `CartSidebar` body scroll lock now that the row has been corrected back to pending | Repo patch + proof note + row update | High / next available batch | Pending | Open |
| 2026-05-03 | System | Agent A + Agent B | `#5` | Need cross-functional alignment | Align checkout UI, consent copy, and backend payload so SMS/legal acceptance is real | Shared implementation note covering UI, payload, and verification path | High / launch-relevant | Pending | Open |
| 2026-05-03 | System | Agent B | `#148` | Need backend verification | Add the missing payment-failed recovery email path or downgrade the row from in-progress | Repo proof or explicit downgrade note | High / next backend pass | Pending | Open |
| 2026-05-03 | System | Agent C | `#70`, `#72`, `#194`, `#195` | Need portal truth reconciliation | Reconcile portal billing tasks with the actual UI so duplicates and partials are cleaned up | Truth note + row cleanup + proof links | Medium / next portal pass | Pending | Open |
| 2026-05-03 | System | All | `#213a`, `#213b` | Need numbering coordination | Keep using split aliases in notes until the duplicate numbering is fixed | Consistent alias use across backlog, audit, and chat | Medium / ongoing | Acknowledged | Open |

## Launch System Blueprint

This is the canonical workflow matrix for business-critical launch systems. A launch system is only truly ready when its repo proof, verification proof, and any required live proof all exist.

| Launch System | Owner | Core Tasks | Trigger | Channels / Surface | Required Assets / Config | Dependencies | Launch Proof Required | Current State | Fallback If Broken |
|---|---|---|---|---|---|---|---|---|---|
| Website lead capture | Agent B | `#84`, `#94`, `#95`, `#127`, `#245` | Contact form or lead form submit | Website, CRM, admin alerting | Form copy, honeypot, origin rules, notification targets | Lead entity truth, webhook path, admin notification | Real lead captured, stored, alerted, and visible end to end | 🟨 Repo partially ready, still needs live proof on some paths | Route leads to manual inbox review and email alerts |
| Demo booking flow | Agent A + Agent C | `#15`, `#54`, `#100`, `#243` | Demo modal or booking page submit | Modal, booking page, calendar flow | Booking copy, confirmation templates, blocked dates, calendar wiring | scheduleDemoBooking, AdminSettings, CSP | Real demo booked with confirmations and calendar evidence | 🟨 UI and repo path exist, still needs live verification | Switch to manual booking link and admin follow-up |
| Store checkout + paid order initialization | Agent B + Agent C | `#146`, `#147`, `#148`, `#201`, `#202`, `#203`, `#249` | Stripe checkout completion | Store, Stripe, order pipeline, email | Live price IDs, Stripe keys, webhook secret, confirmation templates | createCheckoutSession, stripeWebhookOrders, install pipeline | Real paid order initializes correctly with customer/admin confirmations | 🟨 Canonical repo path strong, live Stripe proof still pending | Manual order review and manual onboarding trigger |
| Missed-call recovery | Agent B | `#126`, `#127`, `#128`, `#245` | Twilio missed-call webhook | Twilio voice, SMS, follow-up automation | Twilio number, SMS template, status callback URL | Missed-call webhook, SMS sender, follow-up processor | Real missed call creates recovery sequence and stops on reply | 🟨 Repo path exists in multiple places, needs canonical live proof | Manual callback list with admin alerting |
| Instant lead response | Agent B | `#121`, `#122`, `#123`, `#245` | New lead created | SMS, optional email, admin view | SMS templates, business hours rules, Twilio config | Lead capture pipeline, sendSMS, status callback | Real lead receives immediate SMS and delivery is tracked | 🟨 Partial repo readiness, live proof still needed | Manual first-response SOP by admin |
| Review request automation | Agent B + Agent C | `#131`, `#148`, `#213a`, `#244` | Completion trigger or fully-live milestone | SMS, email, review links | Google review link, Resend auth, Twilio compliance, copy | sendReviewRequest, completion trigger, review proof path | Real customer receives review request after completion trigger | 🟨 Backend path exists, live trigger and deliverability still pending | Manual review outreach from admin |
| Client onboarding / install pipeline | Agent C | `#173`, `#174`, `#175`, `#227`, `#250` | Paid order enters onboarding | Admin workspace, client portal, install runtime | Install templates, credential collection, provider proof UI | Install runtime, launch readiness, provider proof data | Real order moves through setup to live with operator traceability | 🟨 Strong repo path, still needs live operator repetition | Manual install checklist outside the portal |
| Client portal billing recovery | Agent C | `#194`, `#195`, `#196`, `#206` | Billing failure or subscription management action | Client portal, Stripe customer portal | Billing banner UI, Stripe customer portal, portal auth | BillingDashboard, getStripeCustomerPortalUrl, Stripe metadata | Real paid customer can manage subscription and see failure state | 🟨 Partial truth, portal UI and live validation still need cleanup | Manual billing-support email and Stripe dashboard handling |
| Admin alerts and monitoring | Agent B + Agent C | `#167`, `#211`, `#212`, `#241-#250` | Failures, blocked installs, or periodic audits | Admin dashboard, email, ops review | Alert destinations, QA reports, automation secrets | Metrics snapshots, notification functions, QA tasks | Real alert path and named operator response plan | 🟨 Repo surfaces exist, push-alert and live runbook proof still incomplete | Daily manual ops sweep using dashboard and audit docs |

## Blockers And Live-Proof Queue

| Task | Blocker | Owner | What Counts As Proof |
|---|---|---|---|
| `#201` | Live Stripe keys are environment-only | Agent C | Confirm production keys are set and test keys are removed |
| `#202` | Production webhook endpoint cannot be proved from repo alone | Agent C | Real Stripe dashboard/webhook proof |
| `#203` | Real purchase flow needs live card + deployed domain | Agent C | Recorded end-to-end transaction proof |
| `#206` | Customer portal URL needs live customer validation | Agent C | Working portal redirect for real paid customer records |
| `#213a` | Resend DNS auth lives outside repo | Agent C | SPF, DKIM, and DMARC verified on sending domain |
| `#213b` | Twilio A2P registration lives outside repo | Agent C | A2P 10DLC registration confirmed on production number |

## Agent Chat

| Date | From | To | Task | Message | Reply Needed |
|---|---|---|---|---|---|
| 2026-05-03 | System | All | `#2`, `#3`, `#5`, `#94`, `#101` | These rows were corrected out of green. The backlog is more honest now, but the implementation work is still open. | No |
| 2026-05-03 | System | All | `#11`, `#29`, `#67`, `#146`, `#147`, `#173`, `#255`, `#260`, `#284`, `#288` | These rows were promoted to reflect repo truth. Avoid reopening them as duplicate work unless the acceptance criteria change. | No |

## Completion Checklist

1. Link the repo evidence path.
2. Record how it was tested.
3. If the task claims production truth, attach live proof before using `✅`.
4. Update the backlog row, this control center, and the change log together.
5. If a task is really a duplicate or stale pending, say so explicitly instead of leaving it yellow forever.

## Quick Templates

### New Request

`YYYY-MM-DD | From | To | #task | Request Type | Exact Need | Expected Deliverable | Due / Priority | Ack | Open`

### New Chat Note

`YYYY-MM-DD | From | To | #task | Message | Yes/No`

### New Completion Note

`YYYY-MM-DD | Agent | #task | Repo proof + test proof + live proof if needed`
