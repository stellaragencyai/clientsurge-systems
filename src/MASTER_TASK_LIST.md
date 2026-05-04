# ClientSurge Systems — Master Task List (300 Planned Tasks)
> **Last Updated:** 2026-05-03  
> **Planned Task IDs:** 300
> **Current Rows In File:** 301
> **Duplicate ID Note:** `#213` appears 2 times; use split suffixes like `#213a` / `#213b` in audit and control notes until renumbered
> **Current Row Status Snapshot:** ✅ 21 | 🔄 13 | ⏳ 267 | ❌ 0
> **Backlog Truth Audit:** `docs/task-authenticity-audit-2026-05-03.md`  
> **Agent Control Center:** `docs/agent-task-control-center.md`  

---

## ⚠️ ACTIVE WORK IN PROGRESS — DO NOT DUPLICATE

> 🤖 **Sam (AI Agent)** is currently working the **Store / Pricing / Checkout / Stripe** workstream.  
> **Started:** 2026-05-03 12:41 MST  
> **Tasks locked:** #27, #28, #43, #47, #70, #72, #148, #194, #195, #201, #202, #203, #206
> Do NOT attempt these tasks until status changes from 🔄 to ✅.

---

## 🔍 AUTHENTICITY CHECKPOINT

- Do not trust a `✅` row by status alone. Confirm against the audit before calling a task truly complete.
- High-signal backlog truth cleanup completed on 2026-05-03:
  `#2`, `#3`, `#5`, `#94`, `#101` moved back out of green;
  `#11`, `#29`, `#67`, `#146`, `#147`, `#173`, `#255`, `#260`, `#284`, `#288` were promoted to match repo reality.
- Current live-only items that still need real-world proof: `#201`, `#202`, `#203`, `#206`, `#213a`, `#213b`, and the final QA rows `#241-#250`.

---

## 👥 TEAM ASSIGNMENTS

| Agent | Workstream | Primary Zones | Current Locked Tasks |
|---|---|---|---|
| **Agent A (Base44 AI)** | Frontend, UI/UX, Store, Mobile, SEO, Performance | `#1-#83`, `#282-#300` | `#27`, `#28`, `#43`, `#47` |
| **Agent B (Team Member 2)** | Backend Functions, Automation, Security, AI, Tracking | `#84-#167`, `#251-#258`, `#298` | `#148` |
| **Agent C (Team Member 3)** | Admin Panel, Client Portal, Stripe, Ops, Onboarding | `#168-#250`, `#259-#281` | `#70`, `#72`, `#194`, `#195`, `#201`, `#202`, `#203`, `#206` |

> ✅ = Repo-verified complete | 🔄 = In Progress | ⏳ = Pending | ❌ = Blocked | 🔒 = Locked by an active agent | ↪ = Delegated | 💬 = Needs reply | 🧪 = Proof note exists (test or live)

---

## 📋 STATUS LEGEND
- ✅ **Complete** — Repo-verified and merged
- 🔄 **In Progress** — Being worked on now
- ⏳ **Pending** — Not started
- ❌ **Blocked** — Needs dependency or decision
- 🧪 **Proof Note** — Test evidence or live/production verification is documented for tasks that need it

## 🤝 COLLABORATION RULES

1. Before changing any row to `✅`, add repo proof and a change-log note. Add `🧪` evidence notes when the task also has test proof or live/production verification.
2. If you take a task, move it to `🔄`, add it to the control center lock table, and record who owns it.
3. If you need another agent, add a handoff row in `docs/agent-task-control-center.md` instead of burying the note in chat.
4. If a task needs a live-environment check, keep it out of `✅` until the real proof exists.
5. Use `#213a` and `#213b` in coordination notes until the duplicate numbering is cleaned up.

---

## 🧪 LAUNCH-IMPORTANT CHECKPOINT BOARD

Use this board for the highest-signal launch tasks first. It separates backlog row status from actual execution truth so the agents can see what is built, what is tested, what is only proven in production, and what still blocks launch.

Checkpoint legend:
- `🟩` complete / proven
- `🟨` partial / mixed / in progress
- `🟥` missing / unproven / still blocking
- `N/A` not applicable for that checkpoint

Gate meaning:
- `🟥` currently blocks a truthful launch
- `🟨` important but not yet a hard blocker, or blocked only through another dependency
- `🟩` no longer a current launch blocker

| Task | Row | Impl | Test | Live | Gate | Current Truth |
|---|---|---|---|---|---|---|
| `#23` React `ErrorBoundary` wrapping app routes | `⏳` | 🟩 | 🟩 | N/A | 🟩 | Implemented in repo and verified with `build`, `lint`, and `typecheck`; backlog row is stale and should be promoted on next truth sync |
| `#76` Stripe publishable key only in frontend | `⏳` | N/A | 🟥 | N/A | 🟥 | Still needs a dedicated verification pass to confirm no secret key leakage |
| `#85` `autoEndToEndTest` admin-role gate | `⏳` | 🟥 | 🟥 | N/A | 🟨 | Security-hardening task still appears open in repo truth |
| `#95` STOP guard before nurture sends | `⏳` | 🟥 | 🟥 | 🟥 | 🟥 | Compliance-critical send guard still needs canonical implementation and proof |
| `#127` inbound STOP handling pauses all sequences | `⏳` | 🟥 | 🟥 | 🟥 | 🟥 | Still needs canonical STOP-handling proof on the live Twilio path |
| `#146` Stripe subscription metadata `order_id` | `✅` | 🟩 | 🟨 | 🟥 | 🟨 | Repo-complete; still needs live Stripe proof before it can be treated as fully launch-ready |
| `#147` Stripe `billing_status = past_due` on failure | `✅` | 🟩 | 🟨 | 🟥 | 🟨 | Repo-complete; launch truth still depends on real billing-failure proof |
| `#154` admin analytics MRR fix | `⏳` | 🟥 | 🟥 | N/A | 🟨 | Critical analytics gap still open |
| `#194` portal `PaymentFailedBanner` | `🔄` | 🟨 | 🟨 | 🟥 | 🟨 | Banner path exists, but portal truth and live billing validation are still under reconciliation |
| `#201` switch Stripe to live keys | `🔄` | N/A | N/A | 🟥 | 🟥 | Environment-only launch gate; cannot turn green from repo alone |
| `#202` update Stripe webhook URL to production | `🔄` | N/A | N/A | 🟥 | 🟥 | Production dashboard proof required |
| `#203` real-card Stripe purchase test | `🔄` | N/A | 🟥 | 🟥 | 🟥 | Hard launch gate; real transaction proof still missing |
| `#211` custom domain DNS + SSL | `⏳` | 🟨 | 🟨 | 🟨 | 🟨 | Production URLs suggest a domain exists, but this has not been re-verified in this audit pass |
| `#213a` Resend SPF/DKIM/DMARC auth | `⏳` | N/A | N/A | 🟥 | 🟥 | External deliverability gate still needs production proof |
| `#213b` Twilio A2P 10DLC registration | `⏳` | N/A | N/A | 🟥 | 🟥 | External compliance gate still needs production proof |
| `#218` verify all production secrets are set | `⏳` | N/A | N/A | 🟥 | 🟥 | Environment-only launch gate still open |
| `#239` write `STRIPE_GO_LIVE.md` | `⏳` | 🟩 | N/A | N/A | 🟩 | File now exists in repo; backlog row is stale and should be promoted on next truth sync |
| `#245` final lead → SMS → follow-up → booking test | `⏳` | 🟨 | 🟥 | 🟥 | 🟥 | Underlying paths exist in part, but the end-to-end launch proof is still missing |
| `#248` legal pages accuracy + TCPA review | `⏳` | 🟨 | 🟥 | N/A | 🟥 | Pages exist, but final legal/compliance review is still open |
| `#249` final real-card purchase verification | `⏳` | 🟨 | 🟥 | 🟥 | 🟥 | Launch-critical purchase proof still missing |
| `#250` team sign-off | `⏳` | N/A | N/A | 🟥 | 🟥 | Cannot complete until the launch-blocking rows above are genuinely green |
| `#251` wire `scoreLeadIntelligence` on new lead creation | `⏳` | 🟨 | 🟥 | N/A | 🟨 | Intelligence function exists, but the trigger wiring is still missing |
| `#260` portal billing tab | `✅` | 🟩 | 🟨 | 🟥 | 🟨 | Billing UI exists in repo, but real paid-customer validation is still missing |
| `#263` red portal `PaymentFailedBanner` duplicate row | `⏳` | 🟨 | 🟨 | 🟥 | 🟨 | Same truth as `#194`; keep both rows aligned until duplicates are cleaned up |
| `#268` admin dashboard MRR card | `⏳` | 🟥 | 🟥 | N/A | 🟨 | Launch-ops metric still open |
| `#276` `InstallChecklistPanel` live progress panel | `⏳` | 🟨 | 🟥 | N/A | 🟨 | Component exists in repo, but wiring/verification are still incomplete |
| `#300` TCPA consent disclosure on all public lead forms | `⏳` | 🟨 | 🟥 | N/A | 🟥 | Consent copy is present in some flows, but not yet consistently across all public lead-capture surfaces |

---

---

# 🟦 AGENT A — Frontend, UI/UX, Store, Mobile, SEO
### Tasks #1 – #83

---

## SECTION 1: PRE-LAUNCH FRONTEND (Original List #1–#50)

| # | Status | Task | Priority |
|---|---|---|---|
| 1 | ✅ | Finalize store UI product cards with correct pricing display | HIGH |
| 2 | ⏳ | Fix cart sidebar body scroll lock on mobile | HIGH |
| 3 | ⏳ | Add "No setup fee" label instead of "$0 setup" | MEDIUM |
| 4 | ✅ | Add search debounce (280ms) to store search input | MEDIUM |
| 5 | ⏳ | Add SMS consent checkbox in CartSidebar when phone is entered | HIGH |
| 6 | ⏳ | Add `loading="lazy"` + explicit width/height to all below-fold images | HIGH |
| 7 | ⏳ | Add `<link rel="preload">` for hero image in index.html | HIGH |
| 8 | ⏳ | Split recharts/framer-motion into separate Vite chunks via manualChunks | MEDIUM |
| 9 | ⏳ | Add font-display: swap fallback for Inter/Playfair to prevent FOUT | MEDIUM |
| 10 | ⏳ | Store page: implement intersection-observer lazy rendering for 8+ products | MEDIUM |
| 11 | ✅ | Build out pages/ThankYou — currently a blank page | HIGH |
| 12 | ⏳ | Add Navbar to LegalPage — currently renders with no header/branding | MEDIUM |
| 13 | ⏳ | Standardize all form inputs to rounded-xl (12px) globally | LOW |
| 14 | ⏳ | ClientPortal loading state: replace raw spinner with branded skeleton | MEDIUM |
| 15 | ⏳ | DemoBookingModal time slot grid: force 2-col on viewports < 480px | MEDIUM |
| 16 | ⏳ | CookieConsent banner: add bottom: 80px on mobile to avoid MobileCallBar overlap | LOW |
| 17 | ⏳ | FAQ accordion items: add border-bottom tap target on mobile | LOW |
| 18 | ⏳ | Industry sub-pages: ensure hero headline renders as semantic `<h1>` tag | HIGH |
| 19 | ⏳ | Add descriptive alt text to all hero, testimonial, and TrustBar images | MEDIUM |
| 20 | ⏳ | Fix robots.txt: change Disallow: /leads/ to Disallow: /leads/admin | MEDIUM |
| 21 | ⏳ | Add hreflang tag to index.html for future i18n readiness | LOW |
| 22 | ⏳ | Stub /blog route with 3 placeholder posts for organic SEO | MEDIUM |
| 23 | ⏳ | Add React ErrorBoundary in App.jsx wrapping all routes | CRITICAL |
| 24 | ⏳ | Set staleTime: 60_000 and retry: 1 in lib/query-client.js | MEDIUM |
| 25 | ⏳ | Wrap App in React.StrictMode in main.jsx (dev only) | LOW |

---

## SECTION 2: VISUAL / THEME / UI CONSISTENCY

| # | Status | Task | Priority |
|---|---|---|---|
| 26 | ⏳ | Add dark mode ☀️/🌙 toggle to Navbar desktop + mobile menu | MEDIUM |
| 27 | 🔄 | Implement ThemeProvider from next-themes so dark mode class is actually applied | HIGH |
| 28 | 🔄 | Standardize primary CTAs to blue gradient; gold = store/checkout only | MEDIUM |
| 29 | ✅ | Redesign PageNotFound (404) with logo, links, search bar | MEDIUM |
| 30 | ⏳ | Add framer-motion + canvas-confetti to Contact page success state | LOW |
| 31 | ⏳ | pages/Industries: add gradient hero section with industry grid icons | MEDIUM |
| 32 | ⏳ | Industry pages: give each card a unique accent color or icon style | LOW |
| 33 | ⏳ | Mobile sticky cart bar: add padding-top: 72px to main content when visible | MEDIUM |
| 34 | ⏳ | AdminDashboard sidebar: add active-state highlight on current route | MEDIUM |
| 35 | ⏳ | Testimonials: replace broken image URLs with initials-based avatar fallbacks | HIGH |
| 36 | ⏳ | Add favicon (32x32 + 180x180) and apple-touch-icon to index.html | HIGH |
| 37 | ⏳ | GuidedPathToggle: add Tooltip explaining Guided vs Explore All modes | LOW |
| 38 | ✅ | ClientPortal tabs: "Setup Progress" is now first tab and default landing tab on login | DONE |
| 39 | ⏳ | Industry pages CTAs: use industry-specific headline copy from industryData.js | MEDIUM |
| 40 | ⏳ | Mobile nav: show logged-in user name/role after nav links | LOW |

---

## SECTION 3: STORE PAGE UX

| # | Status | Task | Priority |
|---|---|---|---|
| 41 | ⏳ | Store page initial load: show 6 ProductCard skeletons for 300ms then reveal | MEDIUM |
| 42 | ⏳ | Store ProductCard on mobile (375px): reduce "Add to Cart" font to 10px | MEDIUM |
| 43 | 🔄 | CartSidebar: apply acquireBodyScrollLock("cart-sidebar") on open, release on close | HIGH |
| 44 | ⏳ | Mobile sticky cart bar: add circular badge with items.length count | LOW |
| 45 | ⏳ | Store page: add "Talk to a Human" escape valve CTA below product grid | MEDIUM |
| 46 | ⏳ | AdminDashboard sidebar: wire AdminGlobalSearch to all entity types | MEDIUM |
| 47 | 🔄 | Store SocialProofTicker: verify data is from real Orders (not hardcoded) | MEDIUM |
| 48 | ⏳ | CartSidebar: show empty state with top 3 popular nudge tiles | LOW |
| 49 | ⏳ | Store: Guided mode with no industry selected should show all non-coming-soon products | MEDIUM |
| 50 | ⏳ | ProductCard "see more features" button should open ServiceDetailModal | LOW |

---

## SECTION 4: MOBILE UX

| # | Status | Task | Priority |
|---|---|---|---|
| 51 | ⏳ | pages/Book Calendly iframe: set width:100%, height:700px, scrolling:yes | HIGH |
| 52 | ⏳ | MobileCallBar: pull phone number from AdminSettings instead of hardcoding | MEDIUM |
| 53 | ⏳ | Audit all form inputs for iOS zoom issue (font-size < 16px) | HIGH |
| 54 | ⏳ | DemoBookingModal step 2: set min-height:48px on date/time inputs | MEDIUM |
| 55 | ⏳ | pages/Book Calendly: test CSP allows calendly.com frames on live domain | HIGH |

---

## SECTION 5: SEO

| # | Status | Task | Priority |
|---|---|---|---|
| 56 | ⏳ | Industry pages: inject LocalBusiness + Service JSON-LD schema markup | HIGH |
| 57 | ⏳ | Generate og:image (1200x630) and add to index.html + setPageMetadata | HIGH |
| 58 | ⏳ | Industry page titles: include city/location for local SEO signals | MEDIUM |
| 59 | ⏳ | Add internal linking: Footer cross-links industry pages; Store links to industry pages | MEDIUM |
| 60 | ✅ | sitemap.xml: add all industry pages and core routes | DONE |
| 61 | ⏳ | Create generateSitemap backend function for dynamic sitemap at /sitemap.xml | LOW |

---

## SECTION 6: PERFORMANCE

| # | Status | Task | Priority |
|---|---|---|---|
| 62 | ⏳ | Add manifest.json + minimal service worker for PWA installability | LOW |
| 63 | ⏳ | Move all Recharts imports inside lazy() components — audit AdminDashboard/Portal | MEDIUM |
| 64 | ⏳ | Add ?w=800&q=80 Unsplash query params + srcSet to all hero/industry images | MEDIUM |
| 65 | ⏳ | Remove three.js from package.json if not actively used (saves ~600KB) | HIGH |
| 66 | ⏳ | Subset Google Fonts: Inter 400/500/600/700 + Playfair 400/600/700 only | MEDIUM |

---

## SECTION 7: CLIENT EXPERIENCE (FRONTEND SIDE)

| # | Status | Task | Priority |
|---|---|---|---|
| 67 | ✅ | ClientPortal: add "Get Help" tab with support ticket form → SupportMessage entity | HIGH |
| 68 | ⏳ | ClientPortal: add "What's New" section reading from Changelog entity | LOW |
| 69 | ⏳ | ClientPortal: add "Refer a Business" section with unique referral link | MEDIUM |
| 70 | 🔄 | BillingDashboard: add "Cancel Subscription" → getStripeCustomerPortalUrl redirect | HIGH |
| 71 | ⏳ | BillingDashboard: add "Download Invoice PDF" using Stripe invoice_pdf URL | MEDIUM |
| 72 | 🔄 | ClientPortal: show "payment failed" banner when billing_status === "past_due" | HIGH |

---

## SECTION 8: MISC FRONTEND

| # | Status | Task | Priority |
|---|---|---|---|
| 73 | ⏳ | chatBubbleAI: add typing indicator ("...") while LLM processes response | MEDIUM |
| 74 | ⏳ | chatBubbleAI: add sessionStorage counter, block after 10 messages per session | HIGH |
| 75 | ⏳ | Add session timeout warning modal after 30min admin inactivity | MEDIUM |
| 76 | ⏳ | Verify Stripe publishable key is ONLY in frontend (not sk_live_ anywhere) | CRITICAL |
| 77 | ✅ | Portal graceful empty state — no navigation errors on null project | DONE |
| 78 | ⏳ | Add cookie consent to all public lead capture forms | HIGH |
| 79 | ⏳ | pages/Success: verify content is correct and not stale | MEDIUM |
| 80 | ⏳ | Onboarding page: ensure form validates all required fields before submit | MEDIUM |
| 81 | ⏳ | All pages: verify meta description is unique (not default fallback) | MEDIUM |
| 82 | ✅ | sitemap.xml updated with industry pages | DONE |
| 83 | ⏳ | pages/Industries: verify all 6 industry cards link to correct routes | MEDIUM |

---

---

# 🟩 AGENT B — Backend Functions, Automation, Security
### Tasks #84 – #167

---

## SECTION 9: SECURITY

| # | Status | Task | Priority |
|---|---|---|---|
| 84 | ⏳ | Add Origin header validation to submitLeadCapture + submitContactInquiry | HIGH |
| 85 | ⏳ | autoEndToEndTest: add admin role check (return 403 if not admin) | CRITICAL |
| 86 | ⏳ | Move webhookLeadCapture secret from URL param to X-Webhook-Secret header | HIGH |
| 87 | ⏳ | submitLeadCapture: normalize phone to E.164 (+1 prefix, reject < 10 digits) | HIGH |
| 88 | ⏳ | Add consent_given_at + consent_ip fields to WebsiteLead/Leads entities | HIGH |
| 89 | ⏳ | Capture X-Forwarded-For IP in submitLeadCapture and store as consent_ip | HIGH |
| 90 | ⏳ | Add IP allowlist option in AdminSettings for admin panel access | MEDIUM |
| 91 | ⏳ | Create autoArchiveOldLeads: anonymize WebsiteLead records > 365 days old | MEDIUM |
| 92 | ⏳ | Ensure honeypot website_url field is in ALL public forms (LeadCaptureForm, CaptureLeads) | HIGH |
| 93 | ⏳ | Add X-Frame-Options: DENY header to all backend function responses | MEDIUM |
| 94 | ⏳ | Privacy link on contact form and checkout | HIGH |

---

## SECTION 10: BACKEND FUNCTIONS — RELIABILITY

| # | Status | Task | Priority |
|---|---|---|---|
| 95 | ⏳ | processNurtureCampaigns: check CommunicationEvent for STOP keyword before each send | CRITICAL |
| 96 | ⏳ | processDripCampaigns: skip leads with status "Booked" before sending each step | HIGH |
| 97 | ⏳ | processNurtureCampaigns: add idempotency guard (check for duplicate send within 23hr) | HIGH |
| 98 | ⏳ | processWebsiteLeadFollowUps: add cadence_paused: true skip guard | HIGH |
| 99 | ⏳ | scheduleDemoBooking: add optimistic lock — re-fetch slots before confirming | HIGH |
| 100 | ⏳ | scheduleDemoBooking: reject weekend bookings (Sat/Sun) + blocked_dates in AdminSettings | MEDIUM |
| 101 | ⏳ | CartSidebar: add 12-second timeout fallback for Stripe redirect | HIGH |
| 102 | ⏳ | sendOrderConfirmationEmail: add fallback values for all template variables | HIGH |
| 103 | ⏳ | discoverLeads: return 503 with clear error if Google Maps API key is missing | MEDIUM |
| 104 | ⏳ | enrichLeadWithAI: skip enrichment if lead.enriched_at < 7 days ago | MEDIUM |
| 105 | ✅ | Store search debounce 280ms implemented | DONE |
| 106 | ✅ | robots.txt updated with admin blocks | DONE |

---

## SECTION 11: BACKEND FUNCTIONS — NEW

| # | Status | Task | Priority |
|---|---|---|---|
| 107 | ⏳ | Create healthCheck function: returns {status:"ok", timestamp, version} — no auth | HIGH |
| 108 | ⏳ | Create autoCloseStaleLeads: daily scheduled function, closes leads with no contact > 30 days | MEDIUM |
| 109 | ✅ | OrderSuccess: add noindex meta tag | DONE |
| 110 | ⏳ | Create exportLeadsCSV: query Leads with filters, return CSV with Content-Disposition header | MEDIUM |
| 111 | ⏳ | Create exportCommunicationLogs: CSV export with date range filter | MEDIUM |
| 112 | ⏳ | Extend autoEndToEndTest: full checkout → webhook → email → status flow with cleanup | HIGH |
| 113 | ⏳ | sendDailyDigest: add gate — skip send if leads_today === 0 AND orders_today === 0 | LOW |
| 114 | ⏳ | All Resend fetch calls: add retry once on 429/5xx with 2-second delay | HIGH |
| 115 | ⏳ | monthlyClientReport: after generating report, email it to the client | MEDIUM |
| 116 | ⏳ | getBookedDemoSlots: add {scheduled_date: selectedDate} filter — don't fetch all records | HIGH |
| 117 | ⏳ | Create sendNPSSurvey function: triggered 7 days after order_status = "fully_live" | MEDIUM |

---

## SECTION 12: AUTOMATION

| # | Status | Task | Priority |
|---|---|---|---|
| 118 | ⏳ | Create entity automation: ClientProject update → send milestone email when workflow_stage changes | HIGH |
| 119 | ⏳ | Create entity automation: Order update → trigger sendNPSSurvey when order_status = "fully_live" | MEDIUM |
| 120 | ⏳ | Create scheduled automation: autoCloseStaleLeads — runs daily at 2am | MEDIUM |
| 121 | ✅ | "$0 setup" renamed to "No setup fee" in store | DONE |
| 122 | ⏳ | Create scheduled automation: autoArchiveOldLeads — runs monthly | LOW |
| 123 | ⏳ | processAutomationJobs: add retry logic — up to 3 attempts with exponential backoff | HIGH |
| 124 | ⏳ | Create _shared/response.js: okJson() and errJson() for consistent response format | MEDIUM |
| 125 | ⏳ | Create _shared/retryFetch.js: reusable retry wrapper for external API calls | MEDIUM |

---

## SECTION 13: TWILIO / SMS

| # | Status | Task | Priority |
|---|---|---|---|
| 126 | ⏳ | scheduleFollowUpSMS: verify business hours check uses Phoenix timezone correctly | HIGH |
| 127 | ⏳ | receiveTwilioInboundSms: verify STOP handling immediately pauses all sequences for that lead | CRITICAL |
| 128 | ⏳ | All SMS sends: verify opt-out language "Reply STOP to unsubscribe" is appended | HIGH |
| 129 | ⏳ | processMissedCallFollowUps: verify missed_call_step_sent increment is idempotent | HIGH |
| 130 | ⏳ | Twilio number: add auto-provision flow for new clients in autoProvisionTwilioNumber | MEDIUM |

---

## SECTION 14: EMAIL / RESEND

| # | Status | Task | Priority |
|---|---|---|---|
| 131 | ⏳ | sendOrderConfirmationEmail: verify all 6 service names render correctly in email | HIGH |
| 132 | ⏳ | sendDemoConfirmationEmail: verify scheduled_date/time display correctly in all timezones | MEDIUM |
| 133 | ⏳ | sendClientWelcomeEmail: ensure it links to correct client portal URL | HIGH |
| 134 | ⏳ | receiveResendWebhook: on email bounce, update CommunicationEvent status to "failed" | MEDIUM |
| 135 | ⏳ | receiveResendWebhook: on email open, update lead.last_engagement_at | LOW |
| 136 | ✅ | Sitemap updated with all industry pages | DONE |

---

## SECTION 15: LEAD PIPELINE

| # | Status | Task | Priority |
|---|---|---|---|
| 137 | ⏳ | submitLeadCapture: verify deduplication window is exactly 60 minutes | HIGH |
| 138 | ⏳ | onLeadCreated: verify webhook payload includes all required fields | MEDIUM |
| 139 | ⏳ | scoreLeads: verify lead_score calculation accounts for all scoring factors | MEDIUM |
| 140 | ⏳ | scoreLeadIntelligence: add confidence threshold — skip if AI confidence < 0.6 | MEDIUM |
| 141 | ⏳ | routeLead: verify assigned_to field is populated correctly for all lead types | MEDIUM |
| 142 | ⏳ | createLeadAndDispatch: add error recovery if CommunicationEvent creation fails | MEDIUM |
| 143 | ⏳ | validateLeadQuality: add check for disposable email domains (mailinator, tempmail, etc.) | HIGH |
| 144 | ⏳ | deduplicateLeads: run dedup on phone hash as well as email | HIGH |
| 145 | ⏳ | enrichLead: add timeout of 10 seconds max for external enrichment calls | MEDIUM |

---

## SECTION 16: STRIPE BACKEND

| # | Status | Task | Priority |
|---|---|---|---|
| 146 | ✅ | createCheckoutSession: add subscription_data.metadata.order_id for subscription event matching | CRITICAL |
| 147 | ✅ | stripeWebhookOrders: on invoice.payment_failed, set Order billing_status: "past_due" | CRITICAL |
| 148 | 🔄 | stripeWebhookOrders: on payment_failed, send recovery email with Stripe payment update link | HIGH |
| 149 | ⏳ | requestSubscriptionChange: use proration_behavior: "create_prorations" in Stripe call | MEDIUM |
| 150 | ⏳ | Extract Stripe init + signature validation into _shared/stripeInit.js | LOW |
| 151 | ⏳ | Add createAuditLog helper: write admin action records to AuditLog entity | MEDIUM |

---

## SECTION 17: MONITORING & DEVOPS

| # | Status | Task | Priority |
|---|---|---|---|
| 152 | ⏳ | Register healthCheck function URL with UptimeRobot or Better Stack | HIGH |
| 153 | ⏳ | Add Cache-Control: public, max-age=60 to read-only functions (getAdminSettings, etc.) | MEDIUM |
| 154 | ⏳ | getAdminAnalytics: fix MRR to sum total_monthly from paid Orders | CRITICAL |
| 155 | ⏳ | getClientAnalytics: remove/replace any hardcoded mock data with real entity queries | HIGH |
| 156 | ⏳ | getClientPortalContext: on auth, write portal_login CommunicationEvent | LOW |
| 157 | ⏳ | Create AuditLog entity with fields: admin_email, action, entity, before, after, timestamp | MEDIUM |
| 158 | ⏳ | Add standardized console.log format to all functions: [functionName] message {context} | LOW |
| 159 | ⏳ | Verify all functions return proper HTTP status codes (not always 200) | MEDIUM |
| 160 | ⏳ | Add request timeout handling to all external API calls (Twilio, Resend, Stripe) | HIGH |

---

## SECTION 18: DATA INTEGRITY

| # | Status | Task | Priority |
|---|---|---|---|
| 161 | ⏳ | Verify Order entity client_id is always set after checkout completes | HIGH |
| 162 | ⏳ | Verify ClientProject is always created when Order payment_status = "paid" | HIGH |
| 163 | ⏳ | Verify CommunicationEvent is created for every SMS/email send attempt | HIGH |
| 164 | ⏳ | Add data validation: Order.total_monthly must equal sum of item monthly_fees | MEDIUM |
| 165 | ⏳ | Ensure AutomationChecklist records are created for every paid service | MEDIUM |
| 166 | ⏳ | Verify pipeline_status and order_status stay in sync after every transition | HIGH |
| 167 | ⏳ | Run deduplicateLeads on all existing Leads records to clean up database | MEDIUM |

---

---

# 🟥 AGENT C — Admin Panel, Client Portal, Stripe Config, Ops
### Tasks #168 – #250

---

## SECTION 19: ADMIN PANEL — FEATURES

| # | Status | Task | Priority |
|---|---|---|---|
| 168 | ⏳ | Add bulk status update to admin lead table (checkboxes + "Mark as Contacted" toolbar) | HIGH |
| 169 | ⏳ | Wire Leads.subscribe() real-time listener to auto-refresh admin leads table | HIGH |
| 170 | ⏳ | Install Queue panel: show estimated completion date (install_initialized_at + 6 days) | MEDIUM |
| 171 | ⏳ | Add "Resend Welcome Email" button in client detail view → sendPortalWelcomeEmail | MEDIUM |
| 172 | ⏳ | AdminSettings: add "Test Connection" buttons for Twilio + Resend → testProviderConnections | HIGH |
| 173 | ✅ | Add "Website Leads" tab in AdminDashboard showing WebsiteLead entity with filters | HIGH |
| 174 | ⏳ | Add "Override & Mark Live" button with required reason field in AutomationInstallChecklist | MEDIUM |
| 175 | ⏳ | AdminLeadDetail: add "Send Manual SMS" text area + button → sendSMS | HIGH |
| 176 | ⏳ | AdminSettings: add "Preview Email Template" modal with sample variable substitution | MEDIUM |
| 177 | ⏳ | Admin analytics: add conversion funnel chart (Lead→Contacted→Booked→Paid) | HIGH |
| 178 | ⏳ | CommunicationLogsPanel: add "Export Logs" button → exportCommunicationLogs | MEDIUM |
| 179 | ⏳ | AdminLeads table: add lead_score column (visible, sortable, color-coded) | HIGH |
| 180 | ⏳ | Add "Demo Bookings" tab in AdminDashboard for DemoRequest management | HIGH |
| 181 | ⏳ | AdminLeadDetail: add "Enroll in Nurture" button → startNurtureCampaign | MEDIUM |
| 182 | ⏳ | Add "Failed Jobs" section in AdminAutomation showing AutomationJob failures + Retry | HIGH |
| 183 | ⏳ | AdminLeads: mask phone numbers as (602) ***-3227 for non-super-admin users | MEDIUM |
| 184 | ⏳ | Create AuditLog viewer tab in AdminDashboard for tracking all admin actions | MEDIUM |

---

## SECTION 20: ADMIN PANEL — ONBOARDING / INSTALL

| # | Status | Task | Priority |
|---|---|---|---|
| 185 | ⏳ | AdminOnboarding: add client search/filter by business name or email | MEDIUM |
| 186 | ⏳ | AdminOnboarding: show pipeline_status badge prominently on each client card | HIGH |
| 187 | ⏳ | InstallQueuePanel: add "Assign to Admin" dropdown for each pending install | MEDIUM |
| 188 | ⏳ | AutomationInstallChecklist: add progress bar showing % of checklist items complete | MEDIUM |
| 189 | ⏳ | Admin: add one-click "Initialize Install OS" button for newly paid orders | HIGH |
| 190 | ⏳ | Admin: show warning badge when order has been paid > 2 days with no install started | HIGH |

---

## SECTION 21: CLIENT PORTAL

| # | Status | Task | Priority |
|---|---|---|---|
| 191 | ⏳ | ClientPortal: add "Get Help" support ticket tab → SupportMessage entity | HIGH |
| 192 | ⏳ | ClientPortal: add "What's New" changelog section from Changelog entity | LOW |
| 193 | ⏳ | ClientPortal: add "Refer a Business" section with unique ?ref=clientID link | MEDIUM |
| 194 | 🔄 | ClientPortal: show PaymentFailedBanner when billing_status === "past_due" | CRITICAL |
| 195 | 🔄 | BillingDashboard: "Cancel Subscription" → getStripeCustomerPortalUrl redirect | HIGH |
| 196 | ⏳ | BillingDashboard: "Download Invoice PDF" using Stripe invoice_pdf URL | MEDIUM |
| 197 | ⏳ | ClientPortal: add NPS score display after it's collected | LOW |
| 198 | ⏳ | QuickStartWizard: ensure all onboarding steps link to correct help resources | MEDIUM |
| 199 | ⏳ | ClientPortal: verify OrderTracker shows correct install stages for all service types | HIGH |
| 200 | ⏳ | ClientDashboard: add "Your Automation is Paused" warning when cadence_paused = true | HIGH |

---

## SECTION 22: STRIPE / BILLING

| # | Status | Task | Priority |
|---|---|---|---|
| 201 | 🔄 | Switch Stripe from Test Mode to Live Mode (sk_live_ / pk_live_ keys in Dashboard) | CRITICAL |
| 202 | 🔄 | Update Stripe webhook endpoint URL to production domain | CRITICAL |
| 203 | 🔄 | Test full purchase flow end-to-end with real card on live domain | CRITICAL |
| 204 | ⏳ | Verify Stripe subscription renewal fires invoice.paid webhook and is handled | HIGH |
| 205 | ⏳ | Add capacity limit: AdminSettings.max_active_onboarding — block checkout if exceeded | MEDIUM |
| 206 | 🔄 | getStripeCustomerPortalUrl: verify it returns working URL for all paid customers | HIGH |
| 207 | ⏳ | Stripe proration: implement preview before plan change in requestSubscriptionChange | MEDIUM |
| 208 | ⏳ | Verify Stripe metadata includes base44_app_id on all checkout sessions | HIGH |
| 209 | ⏳ | Add Stripe customer ID to ClientProject for portal billing lookups | MEDIUM |
| 210 | ⏳ | Verify all Stripe webhook event types are handled (created, updated, deleted, failed) | HIGH |

---

## SECTION 23: OPERATIONAL READINESS

| # | Status | Task | Priority |
|---|---|---|---|
| 211 | ⏳ | Configure custom domain DNS (if not already done) and verify SSL cert | CRITICAL |
| 212 | ⏳ | Set up UptimeRobot or Better Stack monitoring on healthCheck endpoint | HIGH |
| 213 | ⏳ | Configure Resend domain authentication (SPF, DKIM, DMARC) for deliverability | CRITICAL |
| 213 | ⏳ | Verify Twilio number is A2P 10DLC registered for commercial SMS in the US | CRITICAL |
| 214 | ⏳ | Add Google Analytics 4 event tracking for: purchase, demo_booked, lead_submitted | HIGH |
| 215 | ⏳ | Set up error alerting: admin email on any backend function 5xx error | HIGH |
| 216 | ⏳ | Document all environment variables in a README_ENV.md file | MEDIUM |
| 217 | ⏳ | Create runbook: what to do when Twilio is down / Resend is down / Stripe is down | MEDIUM |
| 218 | ⏳ | Verify all secrets are set in production (not just dev) environment | CRITICAL |
| 219 | ⏳ | Load test: simulate 50 concurrent lead submissions and measure response time | MEDIUM |

---

## SECTION 24: DATA / ENTITIES

| # | Status | Task | Priority |
|---|---|---|---|
| 220 | ⏳ | Create AuditLog entity (admin_email, action, entity_name, record_id, before, after, timestamp) | MEDIUM |
| 221 | ⏳ | Create Changelog entity (title, description, date, is_published) for client portal | LOW |
| 222 | ⏳ | Create Referral entity (referrer_client_id, referred_email, status, credit_amount) | LOW |
| 223 | ⏳ | Add nps_score + nps_responded_at fields to ClientProject entity | MEDIUM |
| 224 | ⏳ | Add consent_given_at + consent_ip fields to WebsiteLead entity | HIGH |
| 225 | ⏳ | Add consent_given_at + consent_ip fields to Leads entity | HIGH |
| 226 | ⏳ | Verify all entity RLS rules are correct — Client entity has correct read/write rules | HIGH |
| 227 | ⏳ | Add max_active_onboarding field to AdminSettings entity | MEDIUM |
| 228 | ⏳ | Add blocked_dates array field to AdminSettings for holiday/weekend booking blocks | MEDIUM |
| 229 | ⏳ | Add allowed_admin_ips array field to AdminSettings for IP allowlisting | LOW |

---

## SECTION 25: CLIENT EXPERIENCE (BACKEND SIDE)

| # | Status | Task | Priority |
|---|---|---|---|
| 230 | ⏳ | Create sendNPSSurvey function — email 7 days after fully_live with 1-10 rating link | MEDIUM |
| 231 | ⏳ | Entity automation: ClientProject workflow_stage change → send milestone email | HIGH |
| 232 | ⏳ | Entity automation: Order fully_live → trigger sendNPSSurvey after 7-day delay | MEDIUM |
| 233 | ⏳ | Verify sendClientWelcomeEmail includes correct client portal URL + temp access instructions | HIGH |
| 234 | ⏳ | Verify sendPortalWelcomeEmail is triggered automatically after order is paid | HIGH |
| 235 | ⏳ | Create Changelog entity records: add first 3 "What's New" entries for portal | LOW |

---

## SECTION 26: DOCUMENTATION

| # | Status | Task | Priority |
|---|---|---|---|
| 236 | ⏳ | Write README_ENV.md documenting all required environment variables | MEDIUM |
| 237 | ⏳ | Write RUNBOOK_OUTAGE.md: steps for Twilio/Resend/Stripe outage scenarios | MEDIUM |
| 238 | ⏳ | Write ONBOARDING_SOP.md: step-by-step for onboarding a new client manually | HIGH |
| 239 | ⏳ | Write STRIPE_GO_LIVE.md: checklist for switching to live Stripe keys | CRITICAL |
| 240 | ⏳ | Update INSTALLATION_WORKFLOW_GUIDE.md with latest install OS fields | MEDIUM |

---

## SECTION 27: FINAL LAUNCH CHECKLIST

| # | Status | Task | Priority |
|---|---|---|---|
| 241 | ⏳ | Final: run Lighthouse audit on homepage — target 90+ performance score | HIGH |
| 242 | ⏳ | Final: run axe or WAVE accessibility audit — fix all WCAG AA violations | HIGH |
| 243 | ⏳ | Final: test all CTA buttons across mobile (375px, 390px, 414px) | HIGH |
| 244 | ⏳ | Final: verify all email templates render correctly in Gmail, Outlook, Apple Mail | HIGH |
| 245 | ⏳ | Final: test complete lead → SMS → follow-up → booking flow with test lead | CRITICAL |
| 246 | ⏳ | Final: verify admin panel loads in < 3 seconds with 100+ leads in database | MEDIUM |
| 247 | ⏳ | Final: confirm robots.txt is correct and sitemap is submitted to Google Search Console | HIGH |
| 248 | ⏳ | Final: review all legal pages (Privacy, Terms) for accuracy and TCPA compliance | CRITICAL |
| 249 | ⏳ | Final: do a full purchase test with a real card → verify order, emails, SMS all fire | CRITICAL |
| 250 | ⏳ | Final: team sign-off — all 3 agents mark their sections complete before go-live | CRITICAL |

---

---

## 📊 PROGRESS TRACKER

| Metric | Count | Notes |
|---|---|---|
| Planned task IDs | 300 | Expansion pack extends the backlog through `#300` |
| Current task rows | 301 | Duplicate task IDs still need cleanup |
| Complete rows | 21 | Status rows after latest truth cleanup and sync |
| In-progress rows | 13 | These are the currently locked rows |
| Pending rows | 267 | Includes tasks that still need implementation or live proof |
| Blocked rows | 0 | Reserve `❌` for explicit dependency waits |
| Current lock set | 13 | #27, #28, #43, #47, #70, #72, #148, #194, #195, #201, #202, #203, #206 |

---

## 💬 AGENT COMMUNICATION

- Shared coordination file: `docs/agent-task-control-center.md`
- Shared truth file: `docs/task-authenticity-audit-2026-05-03.md`
- Use the control center for:
  - task locks
  - task leases and heartbeats
  - request routing between agents
  - blocker escalation
  - cross-agent notes
  - proof before status changes
  - launch-system blueprint tracking

---

## 🔄 CHANGE LOG

| Date | Agent | Change |
|---|---|---|
| 2026-05-03 | Agent A | Initial file created, all 250 tasks populated |
| 2026-05-03 | Agent A | #38 ✅ — "Setup Progress" tab moved to first position and set as default landing tab in ClientPortal |
| 2026-05-03 | Codex | Re-audited the backlog, corrected the top-level truth snapshot, expanded team ownership into the 251-300 task range, and added a shared coordination/control-center workflow |
| 2026-05-03 | Codex | Corrected misleading row statuses: moved false greens `#2`, `#3`, `#5`, `#94`, `#101` back to pending and promoted stale/repo-complete rows `#11`, `#29`, `#67`, `#146`, `#147`, `#173`, `#255`, `#260`, `#284`, `#288` |
| 2026-05-03 | Codex | Added an AI-agent coordination cross-check in `docs/agent-task-control-center.md` to mark which parts of the proposed multi-agent operating model are already present, partial, or still missing |
| 2026-05-03 | Codex | Upgraded the control center with a unified AI-agent protocol, explicit lease/heartbeat rules, a structured request router, and a launch-system blueprint matrix |
| 2026-05-03 | Codex | Added a launch-important checkpoint board so agents can track `Implemented`, `Tested`, `Live`, and `Gate` truth separately from the raw row status for the highest-signal launch tasks |

---

## 📝 HOW TO UPDATE THIS FILE

1. Check `docs/task-authenticity-audit-2026-05-03.md` before trusting or changing any `✅` row.
2. If tasks are added, removed, or renumbered, run `node scripts/audit/sync-task-board-metadata.mjs`.
3. Change the status emoji: `⏳` → `🔄` when starting, `🔄` → `✅` only after proof exists.
4. Update `docs/agent-task-control-center.md` with locks, handoffs, blockers, or chat notes.
5. Add a row to the **CHANGE LOG** with your date, agent name, and what changed.
6. Keep the **Launch-Important Checkpoint Board** aligned for any launch-critical row you touch.
7. Regenerate `docs/task-authenticity-audit-2026-05-03.md` after meaningful status or scope changes.
8. If a task is blocked, add a note in the control center and change the row to `❌`.

---

*This file is shared across all 3 team agents. Last updated: 2026-05-03*


---

---

# 🆕 EXPANSION PACK — Tasks #251–#300
### Added by Sam | 2026-05-03 | Based on live bundle gap analysis + repo audit

> All tasks below are ⏳ Pending unless noted.

---

## SECTION A: AI BRAIN / LEAD INTELLIGENCE (Not wired to frontend at all)

| # | Status | Task | Priority |
|---|---|---|---|
| 251 | ⏳ | Wire scoreLeadIntelligence to fire on every new WebsiteLead creation — currently deployed but never called from frontend | CRITICAL |
| 252 | ⏳ | Wire classifyLeadIntent on inbound SMS replies — currently deployed but disconnected | HIGH |
| 253 | ⏳ | Wire predictChurnRisk to run weekly on all active Orders — alert Nolan if score > 70 | HIGH |
| 254 | ⏳ | Wire automationOrchestrator to Admin dashboard so Nolan can trigger it manually | MEDIUM |
| 255 | ✅ | /lead-intelligence page: display lead_score and quality_label per lead in the UI | HIGH |
| 256 | ⏳ | Lead Intelligence dashboard: add real LeadAnalytics entity reads — currently shows no data | HIGH |
| 257 | ⏳ | Add "AI Re-Score" button in admin lead list — calls scoreLeadIntelligence for selected lead | MEDIUM |
| 258 | ⏳ | predictLeadOutcome: surface prediction result in ClientPortal leads tab | LOW |

---

## SECTION B: CLIENT PORTAL — Completely missing key features

| # | Status | Task | Priority |
|---|---|---|---|
| 259 | ⏳ | ClientPortal: build "Get Help" tab with support ticket form → creates SupportMessage entity record | HIGH |
| 260 | ✅ | ClientPortal: build "Billing" tab — show current plan, next billing date, amount | CRITICAL |
| 261 | ⏳ | ClientPortal: "Cancel Subscription" button → redirect to Stripe customer portal URL | HIGH |
| 262 | ⏳ | ClientPortal: "Download Invoice" button → pull Stripe invoice_pdf URL and open in new tab | HIGH |
| 263 | ⏳ | ClientPortal: show red PaymentFailedBanner when Order billing_status === "past_due" | CRITICAL |
| 264 | ⏳ | ClientPortal: build "Refer a Business" tab with unique referral link generated per client | MEDIUM |
| 265 | ⏳ | ClientPortal: AutomationChecklist — display live checklist progress pulled from AutomationChecklist entity | HIGH |
| 266 | ⏳ | ClientPortal: show "Setup Progress" bar driven by real ClientInstallationOS fields (twilio_configured, etc.) | HIGH |
| 267 | ⏳ | ClientPortal: add "What's New" tab reading from a Changelog entity or AdminSettings changelog field | LOW |

---

## SECTION C: ADMIN PANEL — Missing analytics + ops features

| # | Status | Task | Priority |
|---|---|---|---|
| 268 | ⏳ | AdminDashboard: build MRR metric card — sum total_monthly from all Orders with payment_status=paid | CRITICAL |
| 269 | ⏳ | AdminDashboard: build LTV card — total revenue per client over their lifetime | HIGH |
| 270 | ⏳ | AdminDashboard: build Churn Risk panel — list clients with predictChurnRisk score > 70 | HIGH |
| 271 | ⏳ | AdminDashboard: wire AdminGlobalSearch to all entity types (Lead, Client, Order, SupportMessage) | MEDIUM |
| 272 | ⏳ | AdminDashboard: add session inactivity timeout — show warning modal after 30min, logout after 45min | MEDIUM |
| 273 | ⏳ | AdminDashboard: add "Install Status" table showing each client's onboarding step completion | HIGH |
| 274 | ⏳ | AdminDashboard: add quick-action buttons — "Send Day 1 Email", "Trigger Follow-Up", "Mark Live" per client | HIGH |
| 275 | ⏳ | Admin leads list: add bulk action — "Mark as contacted", "Export to CSV", "Rescore with AI" | MEDIUM |

---

## SECTION D: ONBOARDING FLOW — Entity fields exist but UI never reads them

| # | Status | Task | Priority |
|---|---|---|---|
| 276 | ⏳ | Build InstallChecklistPanel component — reads AutomationChecklist entity fields and renders live progress | CRITICAL |
| 277 | ⏳ | Wire onboarding_complete, went_live, twilio_configured fields to admin UI — currently invisible | HIGH |
| 278 | ⏳ | Auto-send "You're Live!" email via Resend when went_live is set to true on a ClientOnboarding record | HIGH |
| 279 | ⏳ | Auto-send Telegram alert to Nolan when any onboarding step changes (twilio_configured, lead_sources_connected, etc.) | HIGH |
| 280 | ⏳ | Build client-facing onboarding status page at /setup — shows their install progress without admin login | MEDIUM |
| 281 | ⏳ | Onboarding form: validate all required fields before submit — currently submits with empty required fields | HIGH |

---

## SECTION E: SEO — Structural gaps

| # | Status | Task | Priority |
|---|---|---|---|
| 282 | ⏳ | Add LocalBusiness + Service JSON-LD schema to all 6 industry pages | HIGH |
| 283 | ⏳ | Add BreadcrumbList JSON-LD schema to all inner pages | MEDIUM |
| 284 | ✅ | Add setPageMetadata() utility — dynamic title + description + og:image per route | HIGH |
| 285 | ⏳ | Add preconnect links for fonts.googleapis.com, stripe.com, resend.com in index.html | MEDIUM |
| 286 | ⏳ | Industry pages: include Phoenix/Scottsdale city name in H1 and meta title for local SEO | HIGH |
| 287 | ⏳ | Create /blog with 3 pillar posts: AI Automation for Med Spas, Missed Call Text-Back Guide, How AI Books Appointments | MEDIUM |
| 288 | ✅ | Add twitter:card meta tags to all pages (currently only on homepage) | LOW |

---

## SECTION F: PERFORMANCE

| # | Status | Task | Priority |
|---|---|---|---|
| 289 | ⏳ | Add preconnect and dns-prefetch for Stripe, Twilio, Resend CDNs in index.html | MEDIUM |
| 290 | ⏳ | Add manifest.json with name, icons, theme_color for PWA installability | LOW |
| 291 | ⏳ | Add Vite manualChunks to split recharts, framer-motion, lucide into separate bundles | MEDIUM |
| 292 | ⏳ | Add loading=lazy attribute to ALL below-fold images site-wide | HIGH |
| 293 | ⏳ | Subset Google Fonts — load only Inter 400/500/600/700 + Playfair 400/600 instead of full family | MEDIUM |

---

## SECTION G: ANALYTICS + TRACKING

| # | Status | Task | Priority |
|---|---|---|---|
| 294 | ⏳ | Connect GA4 property — add G- tracking ID to index.html gtag snippet | HIGH |
| 295 | ⏳ | Track checkout button clicks as GA4 conversion events | HIGH |
| 296 | ⏳ | Track form submissions (lead capture, contact, onboarding) as GA4 events | HIGH |
| 297 | ⏳ | Add UTM parameter persistence — store utm_source and utm_medium on lead record at capture | MEDIUM |
| 298 | ⏳ | Build weekly analytics digest automation — email Nolan every Monday: new leads, MRR, conversion rate, churn risk | HIGH |

---

## SECTION H: ACCESSIBILITY + LEGAL

| # | Status | Task | Priority |
|---|---|---|---|
| 299 | ⏳ | Add skip-to-content link at top of every page for screen reader accessibility | MEDIUM |
| 300 | ⏳ | Add TCPA-compliant SMS consent disclosure to ALL public lead capture forms — "By submitting, you consent to receive automated SMS. Reply STOP to opt out." | CRITICAL |

---

*Expansion added by Sam (AI Agent) — 2026-05-03. Tasks #251–#300.*
