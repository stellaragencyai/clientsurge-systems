# ClientSurge Systems — Master Task List (250 Tasks)
> **Last Updated:** 2026-05-03  
> **Total Tasks:** 250  
> **Completed:** ~27  
> **Remaining:** ~235  

---

## ⚠️ ACTIVE WORK IN PROGRESS — DO NOT DUPLICATE

> 🤖 **Sam (AI Agent)** is currently working the **Store / Pricing / Checkout / Stripe** workstream.  
> **Started:** 2026-05-03 12:41 MST  
> **Tasks locked:** #27, #28, #43, #47, #70, #72, #146, #147, #148, #194, #195, #201, #202, #203, #206, #87, #84, #86, #92, #95, #127  
> Do NOT attempt these tasks until status changes from 🔄 to ✅.

---

## 👥 TEAM ASSIGNMENTS

| Agent | Workstream | Tasks |
|---|---|---|
| **Agent A (Base44 AI)** | Frontend, UI/UX, Store, Mobile, SEO | #1–83 |
| **Agent B (Team Member 2)** | Backend Functions, Automation, Security | #84–167 |
| **Agent C (Team Member 3)** | Admin Panel, Client Portal, Stripe, Ops | #168–250 |

> ✅ = Complete | 🔄 = In Progress | ⏳ = Pending | ❌ = Blocked

---

## 📋 STATUS LEGEND
- ✅ **Complete** — Merged and verified in production
- 🔄 **In Progress** — Being worked on now
- ⏳ **Pending** — Not started
- ❌ **Blocked** — Needs dependency or decision

---

---

# 🟦 AGENT A — Frontend, UI/UX, Store, Mobile, SEO
### Tasks #1 – #83

---

## SECTION 1: PRE-LAUNCH FRONTEND (Original List #1–#50)

| # | Status | Task | Priority |
|---|---|---|---|
| 1 | ✅ | Finalize store UI product cards with correct pricing display | HIGH |
| 2 | ✅ | Fix cart sidebar body scroll lock on mobile | HIGH |
| 3 | ⏳ | Add "No setup fee" label instead of "$0 setup" | MEDIUM |
| 4 | ✅ | Add search debounce (280ms) to store search input | MEDIUM |
| 5 | ✅ | Add SMS consent checkbox in CartSidebar when phone is entered | HIGH |
| 6 | ⏳ | Add `loading="lazy"` + explicit width/height to all below-fold images | HIGH |
| 7 | ⏳ | Add `<link rel="preload">` for hero image in index.html | HIGH |
| 8 | ⏳ | Split recharts/framer-motion into separate Vite chunks via manualChunks | MEDIUM |
| 9 | ⏳ | Add font-display: swap fallback for Inter/Playfair to prevent FOUT | MEDIUM |
| 10 | ⏳ | Store page: implement intersection-observer lazy rendering for 8+ products | MEDIUM |
| 11 | ⏳ | Build out pages/ThankYou — currently a blank page | HIGH |
| 12 | ⏳ | Add Navbar to LegalPage — currently renders with no header/branding | MEDIUM |
| 13 | ⏳ | Standardize all form inputs to rounded-xl (12px) globally | LOW |
| 14 | ⏳ | ClientPortal loading state: replace raw spinner with branded skeleton | MEDIUM |
| 15 | ⏳ | DemoBookingModal time slot grid: force 2-col on viewports < 480px | MEDIUM |
| 16 | ✅ | CookieConsent banner: add bottom: 80px on mobile to avoid MobileCallBar overlap | LOW |
| 17 | ✅ | FAQ accordion items: add border-bottom tap target on mobile | LOW |
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
| 29 | ⏳ | Redesign PageNotFound (404) with logo, links, search bar | MEDIUM |
| 30 | ⏳ | Add framer-motion + canvas-confetti to Contact page success state | LOW |
| 31 | ⏳ | pages/Industries: add gradient hero section with industry grid icons | MEDIUM |
| 32 | ⏳ | Industry pages: give each card a unique accent color or icon style | LOW |
| 33 | ⏳ | Mobile sticky cart bar: add padding-top: 72px to main content when visible | MEDIUM |
| 34 | ⏳ | AdminDashboard sidebar: add active-state highlight on current route | MEDIUM |
| 35 | ⏳ | Testimonials: replace broken image URLs with initials-based avatar fallbacks | HIGH |
| 36 | ✅ | Add favicon (32x32 + 180x180) and apple-touch-icon to index.html | HIGH |
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
| 67 | ⏳ | ClientPortal: add "Get Help" tab with support ticket form → SupportMessage entity | HIGH |
| 68 | ⏳ | ClientPortal: add "What's New" section reading from Changelog entity | LOW |
| 69 | ⏳ | ClientPortal: add "Refer a Business" section with unique referral link | MEDIUM |
| 70 | ✅ | BillingDashboard: add "Cancel Subscription" → getStripeCustomerPortalUrl redirect | HIGH |
| 71 | ⏳ | BillingDashboard: add "Download Invoice PDF" using Stripe invoice_pdf URL | MEDIUM |
| 72 | ✅ | ClientPortal: show "payment failed" banner when billing_status === "past_due" | HIGH |

---

## SECTION 8: MISC FRONTEND

| # | Status | Task | Priority |
|---|---|---|---|
| 73 | ⏳ | chatBubbleAI: add typing indicator ("...") while LLM processes response | MEDIUM |
| 74 | ⏳ | chatBubbleAI: add sessionStorage counter, block after 10 messages per session | HIGH |
| 75 | ⏳ | Add session timeout warning modal after 30min admin inactivity | MEDIUM |
| 76 | ✅ | Verify Stripe publishable key is ONLY in frontend (not sk_live_ anywhere) | CRITICAL |
| 77 | ✅ | Portal graceful empty state — no navigation errors on null project | DONE |
| 78 | ⏳ | Add cookie consent to all public lead capture forms | HIGH |
| 79 | ⏳ | pages/Success: verify content is correct and not stale | MEDIUM |
| 80 | ⏳ | Onboarding page: ensure form validates all required fields before submit | MEDIUM |
| 81 | ⏳ | All pages: verify meta description is unique (not default fallback) | MEDIUM |
| 83 | ⏳ | pages/Industries: verify all 6 industry cards link to correct routes | MEDIUM |

---

---

# 🟩 AGENT B — Backend Functions, Automation, Security
### Tasks #84 – #167

---

## SECTION 9: SECURITY

| # | Status | Task | Priority |
|---|---|---|---|
| 84 | 🔄 | Add Origin header validation to submitLeadCapture + submitContactInquiry | HIGH |
| 85 | ✅ | autoEndToEndTest: add admin role check (return 403 if not admin) | CRITICAL |
| 86 | 🔄 | Move webhookLeadCapture secret from URL param to X-Webhook-Secret header | HIGH |
| 87 | 🔄 | submitLeadCapture: normalize phone to E.164 (+1 prefix, reject < 10 digits) | HIGH |
| 88 | ⏳ | Add consent_given_at + consent_ip fields to WebsiteLead/Leads entities | HIGH |
| 89 | ⏳ | Capture X-Forwarded-For IP in submitLeadCapture and store as consent_ip | HIGH |
| 90 | ⏳ | Add IP allowlist option in AdminSettings for admin panel access | MEDIUM |
| 91 | ⏳ | Create autoArchiveOldLeads: anonymize WebsiteLead records > 365 days old | MEDIUM |
| 92 | 🔄 | Ensure honeypot website_url field is in ALL public forms (LeadCaptureForm, CaptureLeads) | HIGH |
| 93 | ⏳ | Add X-Frame-Options: DENY header to all backend function responses | MEDIUM |
| 94 | ✅ | Privacy link on contact form and checkout | DONE |

---

## SECTION 10: BACKEND FUNCTIONS — RELIABILITY

| # | Status | Task | Priority |
|---|---|---|---|
| 95 | 🔄 | processNurtureCampaigns: check CommunicationEvent for STOP keyword before each send | CRITICAL |
| 96 | ⏳ | processDripCampaigns: skip leads with status "Booked" before sending each step | HIGH |
| 97 | ⏳ | processNurtureCampaigns: add idempotency guard (check for duplicate send within 23hr) | HIGH |
| 98 | ⏳ | processWebsiteLeadFollowUps: add cadence_paused: true skip guard | HIGH |
| 99 | ⏳ | scheduleDemoBooking: add optimistic lock — re-fetch slots before confirming | HIGH |
| 100 | ⏳ | scheduleDemoBooking: reject weekend bookings (Sat/Sun) + blocked_dates in AdminSettings | MEDIUM |
| 101 | ✅ | CartSidebar: add 12-second timeout fallback for Stripe redirect | DONE |
| 102 | ⏳ | sendOrderConfirmationEmail: add fallback values for all template variables | HIGH |
| 103 | ⏳ | discoverLeads: return 503 with clear error if Google Maps API key is missing | MEDIUM |
| 104 | ⏳ | enrichLeadWithAI: skip enrichment if lead.enriched_at < 7 days ago | MEDIUM |
| 105 | ✅ | Store search debounce 280ms implemented | DONE |
| 106 | ✅ | robots.txt updated with admin blocks | DONE |

---

## SECTION 11: BACKEND FUNCTIONS — NEW

| # | Status | Task | Priority |
|---|---|---|---|
| 107 | ✅ | Create healthCheck function: returns {status:"ok", timestamp, version} — no auth | HIGH |
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
| 127 | 🔄 | receiveTwilioInboundSms: verify STOP handling immediately pauses all sequences for that lead | CRITICAL |
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
| 146 | 🔄 | createCheckoutSession: add subscription_data.metadata.order_id for subscription event matching | CRITICAL |
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
| 173 | ⏳ | Add "Website Leads" tab in AdminDashboard showing WebsiteLead entity with filters | HIGH |
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
| 213b | ⏳ | Verify Twilio number is A2P 10DLC registered for commercial SMS in the US | CRITICAL |
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

| Agent | Total Tasks | Complete | In Progress | Remaining |
|---|---|---|---|---|
| Agent A (Frontend/UI/SEO) | 83 | 9 | 0 | 74 |
| Agent B (Backend/Security) | 84 | 6 | 0 | 78 |
| Agent C (Admin/Stripe/Ops) | 83 | 0 | 0 | 83 |
| **TOTAL** | **250** | **15** | **0** | **235** |

---

## 🔄 CHANGE LOG

| Date | Agent | Change |
|---|---|---|
| 2026-05-03 | Agent A | Initial file created, all 250 tasks populated |
| 2026-05-03 | Agent A | #38 ✅ — "Setup Progress" tab moved to first position and set as default landing tab in ClientPortal |

---

## 📝 HOW TO UPDATE THIS FILE

1. Change the status emoji: `⏳` → `🔄` when starting, `🔄` → `✅` when done
2. Add a row to the **CHANGE LOG** with your date, agent name, and what you did
3. Update the **PROGRESS TRACKER** counts at the bottom
4. If a task is blocked, add a note in the task row and change to `❌`

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
| 255 | ⏳ | /lead-intelligence page: display lead_score and quality_label per lead in the UI | HIGH |
| 256 | ⏳ | Lead Intelligence dashboard: add real LeadAnalytics entity reads — currently shows no data | HIGH |
| 257 | ⏳ | Add "AI Re-Score" button in admin lead list — calls scoreLeadIntelligence for selected lead | MEDIUM |
| 258 | ⏳ | predictLeadOutcome: surface prediction result in ClientPortal leads tab | LOW |

---

## SECTION B: CLIENT PORTAL — Completely missing key features

| # | Status | Task | Priority |
|---|---|---|---|
| 259 | ⏳ | ClientPortal: build "Get Help" tab with support ticket form → creates SupportMessage entity record | HIGH |
| 260 | ⏳ | ClientPortal: build "Billing" tab — show current plan, next billing date, amount | CRITICAL |
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
| 268 | ✅ | AdminDashboard: build MRR metric card — sum total_monthly from all Orders with payment_status=paid | CRITICAL |
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
| 285 | ✅ | Add preconnect links for fonts.googleapis.com, stripe.com, resend.com in index.html | MEDIUM |
| 286 | ⏳ | Industry pages: include Phoenix/Scottsdale city name in H1 and meta title for local SEO | HIGH |
| 287 | ⏳ | Create /blog with 3 pillar posts: AI Automation for Med Spas, Missed Call Text-Back Guide, How AI Books Appointments | MEDIUM |
| 288 | ⏳ | Add twitter:card meta tags to all pages (currently only on homepage) | LOW |

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
| 294 | ✅ | Connect GA4 property — add G- tracking ID to index.html gtag snippet | HIGH |
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


---

---

# 🆕 EXPANSION PACK 2 — Tasks #301–#400
### Added by Sam | 2026-05-03 | Deep repo + bundle + component audit

> All tasks below are ⏳ Pending unless noted.

---

## SECTION I: STRIPE / PAYMENTS — Critical Revenue Gaps

| # | Status | Task | Priority |
|---|---|---|---|
| 301 | ⏳ | Pricing.jsx: replace all 6 test Stripe links (buy.stripe.com/test_*) with live payment links — currently LIVE SITE IS TAKING TEST PAYMENTS | CRITICAL |
| 302 | ⏳ | salesCatalog.js: audit all setup_fee and monthly_fee values — store products show $97/mo and $297 setup but tier pages show $497/mo — must be ONE source of truth | CRITICAL |
| 303 | ⏳ | CartSidebar handleCheckout: wire to createCheckoutSession backend function — currently unclear what endpoint it calls | HIGH |
| 304 | ⏳ | createCheckoutSession: verify it uses sk_live_ not sk_test_ — check STRIPE_SECRET_KEY env var is set to live key | CRITICAL |
| 305 | ⏳ | Add Stripe Customer Portal link to BillingDashboard — getStripeCustomerPortalUrl is deployed but never called | HIGH |
| 306 | ⏳ | getClientInvoices function is deployed — wire it to BillingDashboard so real invoice history shows (currently blank) | HIGH |
| 307 | ⏳ | requestSubscriptionChange function is deployed — wire "Upgrade/Downgrade" button in BillingDashboard to call it | MEDIUM |
| 308 | ⏳ | stripeWebhookOrders: add handling for customer.subscription.deleted to set Order status = cancelled and notify Nolan | HIGH |
| 309 | ⏳ | Add post-checkout redirect from Stripe back to /client-portal with session_id param so portal auto-loads after purchase | HIGH |
| 310 | ⏳ | Add Stripe test mode warning banner in Admin panel — show red "TEST MODE ACTIVE" badge if STRIPE_SECRET_KEY starts with sk_test_ | HIGH |

---

## SECTION J: PORTAL — Components Exist But Are Using SAMPLE / MOCK Data

| # | Status | Task | Priority |
|---|---|---|---|
| 311 | ⏳ | AutomationsOverview.jsx: replace SAMPLE_AUTOMATIONS hardcoded array with real AutomationChecklist entity reads | CRITICAL |
| 312 | ⏳ | SocialProofTicker.jsx: currently shows only static stats strings — wire to real Order entity count for "X businesses automated" | MEDIUM |
| 313 | ⏳ | WeeklyReports.jsx: verify BUILD_STEPS keys match actual ClientInstallationOS entity fields — step_onboarding, step_sms etc. may be wrong field names | HIGH |
| 314 | ⏳ | RevenueMetricsPanel.jsx: verify it reads from real Order entities not mock data — add fallback empty state if no paid orders exist yet | HIGH |
| 315 | ⏳ | TasksDashboard.jsx: confirm getClientTaskJobs function returns real data — add empty state for new clients with zero tasks | MEDIUM |
| 316 | ⏳ | ClientPortal.jsx: getClientPortalContext is invoked — verify it returns project, order, AND subscription in a single call, not just project | HIGH |
| 317 | ✅ | PaymentFailedBanner component is imported in ClientPortal but never conditionally rendered — add billing_status === "past_due" check to show it | CRITICAL |
| 318 | ⏳ | Portal tab "Automations" shows AutomationsOverview with fake data — replace with real getAutomationStatus function call | HIGH |
| 319 | ⏳ | Portal WeeklyReports tab: wire generateWeeklyReport backend function to "Generate Report" button | MEDIUM |
| 320 | ⏳ | Portal NotificationBell: verify it polls real entity for unread notifications — add badge count from real data | MEDIUM |

---

## SECTION K: ADMIN PANEL — Deployed Functions Never Called From UI

| # | Status | Task | Priority |
|---|---|---|---|
| 321 | ✅ | Wire getAdminAnalytics to AdminDashboard/RevenueDashboard — function is deployed but never invoked from frontend | CRITICAL |
| 322 | ⏳ | Wire getLeadPipelineSummary to LeadManagementDashboard — deployed but disconnected | HIGH |
| 323 | ⏳ | Wire deduplicateLeads to a "Clean Duplicates" button in admin leads panel | HIGH |
| 324 | ⏳ | Wire stalledOnboardingAlert to a cron automation — currently deployed but no scheduler triggers it | HIGH |
| 325 | ⏳ | Wire monthlyClientReport to send on 1st of each month — function exists, no automation created for it | HIGH |
| 326 | ⏳ | Wire autoSchedule30DayCheckin — deployed but no trigger exists to schedule 30-day follow-up with clients | MEDIUM |
| 327 | ⏳ | Wire sendDailyDigest to a daily 8am MST automation — deployed but never scheduled | HIGH |
| 328 | ⏳ | Wire runWinBackSequence — deployed but no UI button or automation triggers it for churned clients | MEDIUM |
| 329 | ⏳ | Wire reactivateLeadOutreach — deployed but no UI or automation triggers lead reactivation flow | MEDIUM |
| 330 | ⏳ | Admin IntegrationHealth.jsx: call getIntegrationHealth on load — component exists but verify it's wired to the right function | HIGH |

---

## SECTION L: LEAD MANAGEMENT — Gaps Between Functions and UI

| # | Status | Task | Priority |
|---|---|---|---|
| 331 | ⏳ | bulkLeadAction function is deployed — wire it to BulkActionToolbar.jsx which currently has no backend connection | HIGH |
| 332 | ⏳ | importLeads function is deployed — build a CSV import UI in admin leads panel that calls it | MEDIUM |
| 333 | ⏳ | dispatchLeadWebhook is deployed — add webhook test button in admin that fires a sample lead payload | MEDIUM |
| 334 | ⏳ | routeLead function deployed — verify LeadRoutingPanel.jsx actually calls it and doesn't just show static routing rules | HIGH |
| 335 | ⏳ | LeadCRMDrawer.jsx: verify it calls enrichLeadWithAI on open — should auto-enrich lead if AI fields are empty | MEDIUM |
| 336 | ⏳ | onLeadCreated function: verify it fires for EVERY new WebsiteLead — check entity automation exists and is active | CRITICAL |
| 337 | ⏳ | processWebsiteLeadFollowUps automation: verify it is ACTIVE and scheduled — this is the core follow-up engine | CRITICAL |
| 338 | ⏳ | processMissedCallFollowUps automation: verify ACTIVE and Twilio webhook is configured to hit receiveTwilioMissedCallWebhook | CRITICAL |
| 339 | ⏳ | processNurtureCampaigns: verify STOP keyword check is in place BEFORE every SMS send — TCPA requirement | CRITICAL |
| 340 | ⏳ | LeadSourceAttribution.jsx: wire to real CommunicationEvent entity reads filtered by source — currently unclear if it shows live data | MEDIUM |

---

## SECTION M: SEO — Deep Technical Gaps Found in index.html + Pages

| # | Status | Task | Priority |
|---|---|---|---|
| 341 | ⏳ | seo.js: DEFAULT_OG_IMAGE points to base44.com CDN — host og-image.png at clientsurgesystems.com/og-image.png and update | HIGH |
| 342 | ⏳ | index.html: missing viewport-fit=cover in meta viewport tag — needed for iPhone notch safe area | MEDIUM |
| 343 | ⏳ | index.html: Space Grotesk font loaded but rarely used — remove to save 60KB on initial load | MEDIUM |
| 344 | ⏳ | Add canonical tag to every industry page using setPageMetadata — currently setJsonLd is called but canonical may be missing | HIGH |
| 345 | ⏳ | MedSpa.jsx calls setPageMetadata — verify Dental, Chiro, HVAC, Roofing, Contractors pages also call it (IndustryTemplate may not) | HIGH |
| 346 | ⏳ | SchemaMarkup.jsx getFAQSchema is used on MedSpa only — add FAQ schema to all 6 industry pages | MEDIUM |
| 347 | ⏳ | Footer: "Tanning Salons" industry missing from footer nav links — only 5 industries listed, should be 6 | MEDIUM |
| 348 | ⏳ | Footer: Roofing and Contractors pages missing from footer nav — add all active industry routes | MEDIUM |
| 349 | ⏳ | Add /sitemap.xml route that reads from AdminSettings or returns hardcoded XML including all industry pages | MEDIUM |
| 350 | ⏳ | Add robots.txt with correct Disallow: /admin Disallow: /client-portal Allow: / | HIGH |

---

## SECTION N: FRONTEND QUALITY — Real Bugs Found in Component Audit

| # | Status | Task | Priority |
|---|---|---|---|
| 351 | ⏳ | Testimonials.jsx: all 3 testimonials use Unsplash stock photos of strangers — replace with generated avatars or initials | HIGH |
| 352 | ⏳ | Testimonials.jsx: Jessica M. is in "Miami, FL" — change all testimonial locations to Phoenix/Scottsdale, AZ for local credibility | HIGH |
| 353 | ⏳ | SocialProofTicker says "6 automations per client" — Starter gets 2, Growth 4, Elite 6 — change to "Up to 6 automations" | HIGH |
| 354 | ⏳ | constants.js BUTTON_TEXT.BOOK_DEMO = "Get Your Free Audit" — verify this replaces ALL former "Book Demo" references site-wide | MEDIUM |
| 355 | ⏳ | ExitIntentPopup.jsx: verify it doesn't fire on /admin or /client-portal routes — admin should never see exit intent | MEDIUM |
| 356 | ⏳ | CookieConsent.jsx: verify it persists dismissal in localStorage — if not, re-shows on every page visit | HIGH |
| 357 | ⏳ | LeadCaptureForm: add honeypot hidden field website_url to block bots — confirmed missing from at least one form variant | HIGH |
| 358 | ⏳ | MobileCallBar.jsx: hardcoded phone number — pull from AdminSettings.twilio_from_number instead | MEDIUM |
| 359 | ⏳ | Hero.jsx checklist says "14 days of automated follow-up" — verify backend processDynamicFollowUps actually runs for 14 days | MEDIUM |
| 360 | ⏳ | ScrollProgressBar.jsx: verify it only renders on long-scroll pages (homepage, industry pages) — not on /admin or portal | LOW |

---

## SECTION O: STORE PAGE — Specific Gaps Found

| # | Status | Task | Priority |
|---|---|---|---|
| 361 | ⏳ | Store salesCatalog.js: individual service setup_fee is $297 and monthly_fee is $97 — this conflicts with tier pricing ($497+) — document the pricing hierarchy clearly in salesCatalog comments | HIGH |
| 362 | ⏳ | Store GuidedPathToggle: "Explore All" mode shows all products — add a "Most Popular" sort as default | LOW |
| 363 | ⏳ | Store BuildYourStackFlow.jsx: lazy loaded — verify it actually renders on mobile without crashing | HIGH |
| 364 | ⏳ | CartSidebar: after successful checkout, cart items should be cleared and success state shown — verify this happens | HIGH |
| 365 | ⏳ | Store StackValueCounter: verify it reads from cart context in real time — if it uses static values, replace | MEDIUM |
| 366 | ⏳ | Store page: CANONICAL_SERVICE_PRODUCTS and AI_PRODUCTS both imported from aiProducts — aiProducts.js is only 15 lines, verify it exports what Store expects | HIGH |
| 367 | ⏳ | ProductCard.jsx: "Add to Cart" should be disabled for coming_soon products — verify checkout_enabled flag gates the button | MEDIUM |
| 368 | ⏳ | Store ServiceComparisonModal: lazy loaded — add error boundary wrapper so the store doesn't crash if it fails to load | MEDIUM |
| 369 | ⏳ | CartSidebar: smsConsent checkbox is present but is it validated before checkout proceeds? Block checkout if unchecked | CRITICAL |
| 370 | ⏳ | Store page: setPageMetadata is imported from seo.js — verify it's actually called in StoreInner useEffect with store-specific title/description | MEDIUM |

---

## SECTION P: ONBOARDING + INSTALLATION FLOW

| # | Status | Task | Priority |
|---|---|---|---|
| 371 | ⏳ | initializeInstallOS function is deployed — verify it is called when a new Order is created, not just manually | HIGH |
| 372 | ⏳ | installPipeline function: wire it to Admin InstallOrderWorkspace.jsx — verify the workspace actually calls the pipeline | HIGH |
| 373 | ⏳ | autoProvisionTwilioNumber is deployed — add "Auto-Provision Number" button in admin install workspace | MEDIUM |
| 374 | ⏳ | configureService function is deployed — wire to ServiceConfigEditor.jsx in admin install panel | HIGH |
| 375 | ⏳ | getInstallConfiguration function deployed — verify InstallOrderWorkspace calls it on load to pre-populate fields | MEDIUM |
| 376 | ⏳ | listInstallQueue function deployed — verify InstallQueuePanel.jsx calls it (not a static list) | HIGH |
| 377 | ⏳ | sendClientWelcomeEmail deployed — verify it fires when Order goes to "paid_setup_in_progress" status, not manually | HIGH |
| 378 | ⏳ | sendPortalWelcomeEmail deployed — verify it fires when client portal account is first created | HIGH |
| 379 | ⏳ | stalledOnboardingAlert: create a daily 9am automation that calls this function and Telegrams Nolan if any client is stalled | HIGH |
| 380 | ⏳ | Onboarding.jsx form: currently 531 lines with no field-level validation — add required field validation before submitClientOnboarding is called | HIGH |

---

## SECTION Q: SECURITY — Specific Gaps Found in Code

| # | Status | Task | Priority |
|---|---|---|---|
| 381 | ⏳ | autoEndToEndTest function: no auth guard found — anyone with the URL can trigger a full system test — add admin role check immediately | CRITICAL |
| 382 | ⏳ | secureFormSubmission function exists but verify submitLeadCapture and submitContactInquiry actually call it (not duplicate logic) | HIGH |
| 383 | ⏳ | authGuards.js shared lib exists — audit which functions import and use it vs which skip it entirely | HIGH |
| 384 | ⏳ | webhookSecurity.js and webhookValidation shared libs exist — verify receiveTwilioInboundSms validates Twilio signature header | CRITICAL |
| 385 | ⏳ | AuditLog entity exists in schema — verify admin actions (lead updates, order changes) actually write to it | MEDIUM |
| 386 | ⏳ | legacyQuarantine.js shared lib exists — identify and remove all legacy function references it wraps | MEDIUM |
| 387 | ⏳ | Base44 vite.config.js has legacySDKImports set to env var — ensure BASE44_LEGACY_SDK_IMPORTS=false in production | HIGH |
| 388 | ⏳ | manageWebhookRegistration function deployed — ensure webhook secrets are stored encrypted, not in plain text in WebhookRegistration entity | HIGH |
| 389 | ⏳ | sendTestLead function deployed and exposed — add admin-only guard so it cannot be called externally | HIGH |
| 390 | ⏳ | simulateMissedCall function deployed — add admin-only guard, this function can trigger real SMS sends | CRITICAL |

---

## SECTION R: AUTOMATION HEALTH + SCHEDULING

| # | Status | Task | Priority |
|---|---|---|---|
| 391 | ⏳ | Create entity automation on Order for "create" event — triggers initializeInstallOS + sendClientWelcomeEmail automatically | CRITICAL |
| 392 | ⏳ | Create entity automation on ClientInstallationOS for "update" event — fires stalledOnboardingAlert check when progress stalls | HIGH |
| 393 | ⏳ | bookingConfirmationLoop: verify it is called after every scheduleDemoBooking — sends confirmation email + SMS + creates DemoRequest record | HIGH |
| 394 | ⏳ | processQualifiedFollowUps: verify it runs on a schedule — add daily automation if missing | HIGH |
| 395 | ⏳ | processDripCampaigns: create scheduled automation to run every 4 hours — currently may be manual only | HIGH |
| 396 | ⏳ | processDynamicFollowUps: verify it runs every hour for active sequences — add automation if missing | HIGH |
| 397 | ⏳ | autoSendWebhookInstructions: wire to fire when a new client Order is created — sends Twilio/webhook setup guide to client | MEDIUM |
| 398 | ⏳ | generateWeeklyReport: create weekly Monday 8am MST automation — currently deployed but no schedule triggers it | HIGH |
| 399 | ⏳ | sendDailyDigest: create daily 7am MST automation — deployed but unscheduled | HIGH |
| 400 | ⏳ | Create a healthCheck automation that runs every 6 hours and posts results to AgentLog — function deployed, no trigger exists | HIGH |

---

*Expansion Pack 2 added by Sam (AI Agent) — 2026-05-03. Tasks #301–#400.*
*Sources: live bundle analysis, 370 JSX component scan, 160 backend function inventory, 42 entity schemas, 15 shared lib files.*


---

---


---

---

# 🧠 AI PIPELINE — FULL EXPANSION — Tasks #401–#475
### Sam | 2026-05-03 | Original 25 broken into sub-tasks + 50 new omissions filled
### Sources: stripeWebhookOrders (295 lines), configureService (669 lines), installPipeline (288 lines + 1778-line shared lib), initializeInstallOS (263 lines), Order entity (537 lines), ClientInstallationOS schema, BusinessConfigTemplate schema

---

## SECTION S: PAYMENT DETECTION + PACKAGE INTELLIGENCE

| # | Status | Task | Priority |
|---|---|---|---|
| 401 | ⏳ | stripeWebhookOrders: on checkout.session.completed, read metadata.package_key from Stripe session and write to Order.package_key — field exists in schema but is NEVER auto-set by the webhook — entire downstream pipeline is blind without it | CRITICAL |
| 401a | ⏳ | Sub-task: verify metadata.package_key is attached to the Stripe checkout session at the moment of creation in createCheckoutSession | CRITICAL |
| 401b | ⏳ | Sub-task: add fallback — if metadata.package_key is missing, derive package_key from line items by matching price IDs against salesCatalog | HIGH |
| 401c | ⏳ | Sub-task: write test case — create a mock checkout.session.completed event and assert Order.package_key is correctly set | HIGH |
| 402 | ⏳ | Build classifyPurchasedPackage function — AI reads selected_service_keys[] on à la carte orders and maps to nearest tier: 2 services = starter, 4 = growth, 6 = elite. Write result to Order.package_type | HIGH |
| 402a | ⏳ | Sub-task: define TIER_SERVICE_MAP constant with canonical service_key lists per tier | HIGH |
| 402b | ⏳ | Sub-task: handle edge cases — client buys 3 services (map to Growth), 5 services (map to Elite minus 1, flag for admin review) | MEDIUM |
| 402c | ⏳ | Sub-task: log classification decision with reasoning to AgentLog | MEDIUM |
| 403 | ⏳ | stripeWebhookOrders: immediately after setting package_key, invoke initializeInstallOS — currently fully disconnected and requires manual trigger | CRITICAL |
| 403a | ⏳ | Sub-task: wrap initializeInstallOS call in try/catch so a failure does NOT return 500 to Stripe (Stripe would retry infinitely) | CRITICAL |
| 403b | ⏳ | Sub-task: log initializeInstallOS failure to AgentLog and fire Telegram alert to Nolan | HIGH |
| 403c | ⏳ | Sub-task: add idempotency check — if ClientInstallationOS already exists for this order_id, skip creation silently | HIGH |
| 404 | ⏳ | sendOrderConfirmationEmail: make email body package-aware — Starter = "2 AI systems activating", Growth = "4 systems", Elite = "all 6 + custom website being built" — currently sends generic confirmation | HIGH |
| 404a | ⏳ | Sub-task: build 3 HTML email templates (one per tier) with service checklist rendered from Order.package_service_keys | HIGH |
| 404b | ⏳ | Sub-task: build à la carte fallback template that lists individual services from Order.items[] | MEDIUM |
| 404c | ⏳ | Sub-task: test all 4 variants (3 tiers + à la carte) with real order_id before going live | HIGH |
| 405 | ⏳ | sendAdminPurchaseNotification: guarantee it fires on EVERY checkout.session.completed — add explicit call with tier, business name, total revenue, and deep link to admin order view | HIGH |
| 405a | ⏳ | Sub-task: wire Telegram message — format: "💳 New Payment: [Business] — [Tier] — $[Setup] + $[Monthly]/mo" | HIGH |
| 405b | ⏳ | Sub-task: wire backup email to nolan@clientsurgesystems.com in case Telegram fails | MEDIUM |
| 426 | ✅ | validateStripeWebhookSignature: confirm stripeWebhookOrders uses stripe.webhooks.constructEvent() with STRIPE_WEBHOOK_SECRET — if env var is missing, return 500 immediately not a silent pass | CRITICAL |
| 427 | ⏳ | Add stripe_event_id idempotency check to stripeWebhookOrders — before processing any event, query Orders for existing stripe_event_id. If found, return 200 immediately — without this Stripe retries double-process payments | CRITICAL |
| 428 | ⏳ | Handle checkout.session.expired in stripeWebhookOrders — set Order.payment_status = "expired" and send recovery email with a fresh checkout link | HIGH |
| 429 | ✅ | Handle customer.subscription.deleted in stripeWebhookOrders — set Order.status = "cancelled", billing_status = "cancelled", invoke runWinBackSequence, Telegram Nolan with MRR lost | HIGH |
| 430 | ⏳ | Handle invoice.payment_failed properly — currently sets billing_status = "past_due" but does NOT send recovery email with Stripe hosted invoice URL — add sendMissedCallRecoveryEmail call with invoice link | HIGH |

---

## SECTION T: CREDENTIALS INTAKE FORM

| # | Status | Task | Priority |
|---|---|---|---|
| 406 | ⏳ | Build /setup/credentials page — post-purchase landing. Reads order_id from URL, confirms Order.payment_status = "paid", renders intake form. If order not found or unpaid, redirect to /pricing | CRITICAL |
| 406a | ⏳ | Sub-task: build the /setup/credentials route in App.jsx | CRITICAL |
| 406b | ⏳ | Sub-task: add order validation hook on page load — fetch Order, verify payment_status | HIGH |
| 406c | ⏳ | Sub-task: add loading skeleton for the 200ms fetch delay before form renders | MEDIUM |
| 407 | ⏳ | Build tiered credentials intake form — Starter: 3 fields (business phone, business name, booking link). Growth: 6 fields (add marketing platform, Google Business Profile URL, existing website). Elite: 10 fields (add logo upload, brand primary/secondary color, target audience, AI tone selector) | CRITICAL |
| 407a | ⏳ | Sub-task: build the Starter 3-field form variant | HIGH |
| 407b | ⏳ | Sub-task: build the Growth 6-field form variant | HIGH |
| 407c | ⏳ | Sub-task: build Elite 10-field wizard with logo upload (Base44 private storage), hex color pickers with live swatch preview, and AI tone radio buttons (Professional / Warm / Energetic) | HIGH |
| 407d | ⏳ | Sub-task: add sessionStorage persistence between wizard steps so page refresh doesn't lose data | MEDIUM |
| 408 | ⏳ | On credentials submit, call saveClientCredentials which writes all fields into Order.install_configuration in the exact nested structure configureService expects | CRITICAL |
| 408a | ⏳ | Sub-task: map business_phone → install_configuration.twilio_business_phone | CRITICAL |
| 408b | ⏳ | Sub-task: map booking_link → install_configuration.booking.booking_link | CRITICAL |
| 408c | ⏳ | Sub-task: map logo_url → install_configuration.brand.logo_url, primary_color → install_configuration.brand.primary_color | HIGH |
| 408d | ⏳ | Sub-task: advance ClientInstallationOS.workflow_stage to "Ready for Install" after successful write | CRITICAL |
| 409 | ⏳ | Build "Missing Credentials" daily automation — 9am MST. Queries Orders: payment_status=paid AND workflow_stage=intake_received AND created_date > 24h ago. Sends reminder email + Telegram per stalled client | HIGH |
| 409a | ⏳ | Sub-task: write the reminder email template — warm, not alarming: "We're ready to activate your systems — we just need a few details" | HIGH |
| 409b | ⏳ | Sub-task: create the Base44 scheduled automation triggering this check daily | HIGH |
| 410 | ⏳ | Build saveClientCredentials backend function — validates required fields per tier with field-specific error messages, writes to Order.install_configuration, invokes installPipeline action=advance | CRITICAL |
| 410a | ⏳ | Sub-task: define REQUIRED_FIELDS_BY_TIER constant — Starter: [business_phone, business_name, booking_link], Growth: +3, Elite: +4 | HIGH |
| 410b | ⏳ | Sub-task: return structured validation errors: { field: "business_phone", message: "Required for Twilio SMS setup" } — not just a generic 400 | HIGH |
| 410c | ⏳ | Sub-task: add admin_bypass flag — if caller is admin role, skip validation and write whatever is provided | MEDIUM |
| 431 | ⏳ | Add multi-step progress bar to Elite intake form — "Step 1: Business Info → Step 2: Brand Assets → Step 3: Review & Confirm" — with sessionStorage persistence | MEDIUM |
| 432 | ⏳ | Add hex color picker with live preview swatch to Elite form — brand.primary_color and brand.secondary_color stored in Order.install_configuration | MEDIUM |
| 433 | ⏳ | Add Google Business Profile URL validator in intake form — must match google.com/maps or g.page pattern — used by generateClientWebsite to pull real business data | MEDIUM |
| 434 | ⏳ | After credentials submission: redirect to /setup/status/[order_id] AND immediately send "We got your info — activating now" Resend confirmation email | HIGH |

---

## SECTION U: SERVICE ACTIVATION ENGINE

| # | Status | Task | Priority |
|---|---|---|---|
| 411 | ⏳ | installPipeline: add TIER_SERVICE_MAP gate — starter activates [instant_lead_response, missed_call_text_back]; growth adds [appointment_booking_ai, follow_up_sequences]; elite adds [review_request_automation, ai_receptionist] — currently no tier gate exists | CRITICAL |
| 411a | ⏳ | Sub-task: define TIER_SERVICE_MAP as a shared constant accessible by both installPipeline and activateAllServices | HIGH |
| 411b | ⏳ | Sub-task: add admin override — if admin manually triggers a service outside client's tier, log a warning but allow it | MEDIUM |
| 412 | ⏳ | configureService: after each successful config, update AutomationChecklistStep.status = "complete" + completed_at timestamp + Telegram Nolan "Service configured for [Business]" | HIGH |
| 412a | ⏳ | Sub-task: query AutomationChecklistStep by order_id + service_key to find the right record | HIGH |
| 412b | ⏳ | Sub-task: handle gracefully if AutomationChecklistStep record doesn't exist — create it rather than failing | MEDIUM |
| 413 | ⏳ | Build generateServiceTemplates function — AI personalization layer. Reads industry + business_name + tone_of_voice from Order.install_configuration. Generates personalized: instant SMS, missed call SMS, nurture Day 1 email, review request SMS. Writes to install_configuration | CRITICAL |
| 413a | ⏳ | Sub-task: build OpenAI prompt for each of the 4 template types with tone + industry context | HIGH |
| 413b | ⏳ | Sub-task: enforce 160-char hard limit on all SMS output with retry if exceeded | HIGH |
| 413c | ⏳ | Sub-task: add character count validation and rejection before writing to install_configuration | MEDIUM |
| 413d | ⏳ | Sub-task: add static fallback templates per industry if OpenAI call fails | HIGH |
| 414 | ⏳ | autoProvisionTwilioNumber: trigger automatically in installPipeline when install_configuration.twilio_business_phone is empty — store provisioned number in Order + Telegram Nolan | HIGH |
| 415 | ⏳ | Build activateAllServices function — reads package_service_keys, calls generateServiceTemplates first, then configureService for each service in sequence with per-service error handling and no full-halt on individual failure | CRITICAL |
| 415a | ⏳ | Sub-task: sequential execution with individual try/catch per service | HIGH |
| 415b | ⏳ | Sub-task: track partial success — write { service_key, status, error } array to Order.activation_errors | HIGH |
| 415c | ⏳ | Sub-task: on full completion (all services attempted), call sendGoLiveNotification | HIGH |
| 435 | ⏳ | Build sendGoLiveNotification function — fires when all package services confirmed active. Client email: "Your systems are live" + service list + portal login link. Telegram Nolan: "[Business] is LIVE — $[MRR]/mo active" | HIGH |
| 436 | ⏳ | Add service activation retry logic — if configureService fails, wait 5min and retry once. If fails twice: mark error, create AgentLog entry, Telegram Nolan. Do not block other services | HIGH |
| 437 | ⏳ | Build getActivationProgress function — returns { total_services, configured, live, errored, percent_complete } — used by admin install workspace AND client activation status page | HIGH |
| 438 | ⏳ | Add activation_started_at and activation_completed_at timestamp fields to Order — currently install_initialized_at exists but no completion timestamp exists | MEDIUM |

---

## SECTION V: WEBSITE GENERATION ENGINE

| # | Status | Task | Priority |
|---|---|---|---|
| 416 | ⏳ | Build generateClientWebsite backend function — takes order_id, reads package_key + industry + install_configuration, returns structured WebsiteSpec object. Starter = 1-page, Growth = 3-page, Elite = 5-page interactive. Writes spec to WebsiteSpec entity | CRITICAL |
| 416a | ⏳ | Sub-task: define WebsiteSpec JSON schema — pages array with sections, copy blocks, brand object | HIGH |
| 416b | ⏳ | Sub-task: build the Starter 1-page spec generator (Hero + Problem + Solution + 2 Automation blocks + CTA + Footer) | HIGH |
| 416c | ⏳ | Sub-task: build Growth 3-page spec (Home + Services + Book Now) | HIGH |
| 416d | ⏳ | Sub-task: build Elite 5-page spec (Home + Services + Industry Landing + Client Portal Login + Lead Intelligence Dashboard) | HIGH |
| 417 | ⏳ | Define 3 website tier templates per industry in BusinessConfigTemplate — 6 industries x 3 tiers = 18 template records. Seed via seedWebsiteTemplates function | CRITICAL |
| 417a | ⏳ | Sub-task: write Starter template JSON for all 6 industries (med_spa, dental, hvac, chiropractic, roofing, contractors) | HIGH |
| 417b | ⏳ | Sub-task: write Growth template JSON for all 6 industries | HIGH |
| 417c | ⏳ | Sub-task: write Elite template JSON for all 6 industries | HIGH |
| 417d | ⏳ | Sub-task: build seedWebsiteTemplates admin function with idempotency check | HIGH |
| 418 | ⏳ | generateClientWebsite — Elite tier: call OpenAI to write hero headline, subheading, 3 proof points, primary CTA using { business_name, industry, tone_of_voice, target_audience } — store in WebsiteSpec.pages[0].copy | HIGH |
| 419 | ⏳ | Auto-update ClientInstallationOS.workflow_stage as website build progresses through: intake_received → credentials_complete → templates_generating → website_building → website_review → website_approved → website_live — each transition writes a _at timestamp | HIGH |
| 420 | ⏳ | Build /setup/preview/[order_id] page — shows AI-generated WebsiteSpec as visual mockup with section list, copy blocks, automation feature cards. Has Approve button and one-time Revision Request form | HIGH |
| 420a | ⏳ | Sub-task: build the approve handler — sets WebsiteSpec.status = "approved", advances workflow_stage, Telegrams Nolan | HIGH |
| 420b | ⏳ | Sub-task: build the revision request handler — saves revision_notes, marks revision_requested = true, disables the button after one use | MEDIUM |
| 439 | ⏳ | Create WebsiteSpec entity schema — fields: order_id, package_key, industry, pages (array), brand (object with logo_url/primary_color/secondary_color/fonts), status enum (draft/approved/building/live), revision_requested (bool), revision_notes, approved_at, built_at | CRITICAL |
| 440 | ⏳ | After client approves WebsiteSpec, auto-Telegram Nolan with spec summary and deep link to admin order view — Nolan clicks "Start Build" in admin to begin construction | HIGH |
| 441 | ⏳ | Build applyWebsiteSpec admin function — converts WebsiteSpec JSON into a structured, pasteable Base44 editor prompt with exact component names, copy, brand colors, section order — writes to AgentLog | HIGH |
| 442 | ⏳ | Build AI website copy finalizer — if client submitted revision_notes, AI regenerates only the affected sections, re-saves to WebsiteSpec, marks status = "approved" | MEDIUM |

---

## SECTION W: ELITE TIER PERKS

| # | Status | Task | Priority |
|---|---|---|---|
| 421 | ⏳ | Build generateLeadMagnet function — Elite perk #1. OpenAI generates 600-800 word industry lead magnet in markdown, converts to PDF, uploads to private storage, creates Files entity record, sends portal notification | HIGH |
| 421a | ⏳ | Sub-task: generate 3 lead magnets (one per major pain point per industry) not just 1 | HIGH |
| 421b | ⏳ | Sub-task: convert markdown to PDF and upload to Base44 private storage | HIGH |
| 421c | ⏳ | Sub-task: create Files entity record linked to order_id and notify client via portal | MEDIUM |
| 422 | ⏳ | Build generateMonthlyPerformanceReport function — Elite perk #2. Runs 1st of month. Queries CommunicationEvent + Lead + Order for client's project. Calculates: leads responded, response rate, bookings, revenue attributed, avg response time. Renders HTML report, emails client, saves to Reports entity | HIGH |
| 422a | ⏳ | Sub-task: build the data queries per metric | HIGH |
| 422b | ⏳ | Sub-task: build HTML report template with metric cards | HIGH |
| 422c | ⏳ | Sub-task: create Reports entity and save report record | MEDIUM |
| 422d | ⏳ | Sub-task: create monthly 1st-of-month scheduled automation | HIGH |
| 423 | ⏳ | Build Elite voice clone intake flow — perk #3. After Elite payment, email client a Retell AI recording link. On receipt, store voice_sample_url in Order.install_configuration, create AutomationChecklistStep "Voice Clone Pending", Telegram Nolan | HIGH |
| 424 | ⏳ | Build /setup/status/[order_id] activation tracker — polls ClientInstallationOS.workflow_stage every 30 seconds. Shows vertical stepper: Payment Confirmed → Credentials Received → Systems Configuring → Website Building → All Live. Shows timestamps per step. Shows spinner on current step. Error state shows support CTA | CRITICAL |
| 424a | ⏳ | Sub-task: build 30-second polling with useInterval hook | HIGH |
| 424b | ⏳ | Sub-task: build the stepper component with 5 stages reading real workflow_stage field | HIGH |
| 424c | ⏳ | Sub-task: build error state with "Contact Support" button that opens SupportChat | MEDIUM |
| 425 | ⏳ | Build runFullPipelineTest admin function — simulates complete purchase for each of 3 tiers using QA fixture client. Tests: webhook → package_key set → initializeInstallOS → credentials write → generateServiceTemplates → configureService x N → generateClientWebsite → sendGoLiveNotification. Logs to AgentLog. Telegrams Nolan with pass/fail per step | CRITICAL |
| 425a | ⏳ | Sub-task: build Starter tier test fixture and assertion set | HIGH |
| 425b | ⏳ | Sub-task: build Growth tier test fixture | HIGH |
| 425c | ⏳ | Sub-task: build Elite tier test fixture including website generation step | HIGH |
| 443 | ⏳ | Elite perk #4 — generateCompetitorAudit: AI fetches top 3 local competitors via Google Places API, analyzes reviews + response speed, generates "Your Competitive Advantage" PDF report, delivers to client portal within 48h of go-live | HIGH |
| 444 | ⏳ | Elite perk #5 — generateSocialStarterPack: AI generates 10 ready-to-post social captions in client's tone (5 lead gen + 5 social proof), formats as PDF, delivers to portal | MEDIUM |
| 445 | ⏳ | Elite perk #6 — wire autoSchedule30DayCheckin to fire automatically for Elite clients at day 30 — process recording, generate AI summary of "what's working / what to optimize", deliver to portal | HIGH |

---

## SECTION X: AI INTELLIGENCE LOOP

| # | Status | Task | Priority |
|---|---|---|---|
| 446 | ⏳ | Build detectPackageUpgradeOpportunity — weekly check. Growth clients with >20 leads/week for 2+ weeks get an AI-written Elite upgrade pitch. Starter clients at >80% utilization get a Growth pitch | HIGH |
| 447 | ⏳ | Build predictOptimalSendTime — AI analyzes CommunicationEvent reply rates by hour-of-day per client's lead base. Writes optimal_send_hour to ClientProject. Used by follow-up scheduler instead of fixed 10am | HIGH |
| 448 | ⏳ | Build generatePersonalizedFollowUp — replaces static Day 3/Day 7 templates. AI reads lead interaction history + email open status + page visited + lead score and writes a unique follow-up email per lead | HIGH |
| 449 | ⏳ | Build analyzeClientLeadQuality — monthly per client. Score distribution, industry breakdown, conversion rate, days to book. Identifies dead segments. Recommends re-engagement. Writes to LeadAnalytics entity | MEDIUM |
| 450 | ⏳ | Build autoOptimizeSMSTemplates — A/B test engine. Maintains 2 SMS template variants per service. After 50 sends each, picks winner by reply rate. Writes winning variant as active template in Order.install_configuration | MEDIUM |
| 451 | ⏳ | Build detectLeadGhostingPattern — identifies leads who opened Day 1 but never replied. After Day 7 silence, sends AI-generated "pattern break" message (different tone, shorter). If still no reply by Day 14, archives lead | HIGH |
| 452 | ⏳ | Wire processCallRecording output to automationOrchestrator — when Twilio call AI extracts buying signals + action items, orchestrator decides next action automatically (book / follow up / qualify / archive) | HIGH |
| 453 | ⏳ | Build clientHealthScore function — composite score: automation uptime + lead response rate + booking conversion + payment health + portal engagement. 0-100. Runs weekly. Writes to ClientProject.health_score. Clients below 60 trigger proactive outreach | HIGH |
| 454 | ⏳ | Build generateAIOnboardingBriefing — fires when workflow_stage advances to activation_ready. AI generates "Nolan's Briefing" doc: who the client is, what's set up, what's pending, suggested go-live call talking points. Delivered to Telegram + AgentLog | HIGH |
| 455 | ⏳ | Upgrade intelligentLeadRouting — replace simple rules in routeLead with AI: reads lead industry, message tone, urgency signals, business size. Routes to correct AutomationWorkflowPreset (hot_lead_express / nurture_and_qualify / win_back / standard) | MEDIUM |

---

## SECTION Y: ADMIN AI TOOLS

| # | Status | Task | Priority |
|---|---|---|---|
| 456 | ⏳ | Build admin "AI Audit" button per order in InstallOrderWorkspace — calls getActivationProgress + checks template registration + verifies Twilio number + checks last SMS/email sent. Returns full health report in a modal | HIGH |
| 457 | ⏳ | AILeadInsightPanel: verify it calls scoreLeadIntelligence and predictLeadOutcome with real data — if using mock data, wire to real functions | HIGH |
| 458 | ⏳ | Add "Next Best Action" card to admin lead detail — shows decideNextAction recommendation with reasoning + one-click Execute button that fires the recommended action | HIGH |
| 459 | ⏳ | Build adminAICommandBar — natural language command input in admin panel. Nolan types "rescore all med spa leads" or "send win-back to churned clients" and AI calls the appropriate backend function | MEDIUM |
| 460 | ⏳ | Build AI anomaly detection in getAdminAnalytics — auto-flag: lead volume drop >30% WoW, client reply rate below 10%, any automation with 0 triggers in 48h. Telegram Nolan specific anomalies, not just raw numbers | HIGH |

---

## SECTION Z: MISSING INFRASTRUCTURE

| # | Status | Task | Priority |
|---|---|---|---|
| 461 | ⏳ | Create WebsiteSpec entity schema — order_id, package_key, industry, pages (array), brand (object), status enum (draft/approved/building/live), revision_requested (bool), revision_notes, approved_at, built_at | CRITICAL |
| 462 | ⏳ | Create Reports entity schema — order_id, client_email, report_month, leads_contacted, response_rate, bookings_created, revenue_attributed, avg_response_time_minutes, report_html, delivered_at | MEDIUM |
| 463 | ⏳ | Add health_score field (numeric 0-100) to ClientProject entity — populated weekly by clientHealthScore | MEDIUM |
| 464 | ⏳ | Add voice_sample_url + voice_clone_status enum to Order.install_configuration schema — status: not_started / recording_requested / recording_received / clone_in_progress / clone_live | HIGH |
| 465 | ⏳ | Add optimal_send_hour field (integer 0-23) to ClientProject — populated by predictOptimalSendTime — used to schedule Day 3 and Day 7 at each client's best time | MEDIUM |
| 466 | ⏳ | Add ab_test_variant field to MessageTemplate entity — tracks A or B variant for autoOptimizeSMSTemplates | MEDIUM |
| 467 | ⏳ | Add website_spec_id field to ClientInstallationOS — links to WebsiteSpec record for one-lookup access from admin and portal | HIGH |
| 468 | ⏳ | Build seedWebsiteTemplates admin function — populates BusinessConfigTemplate with all 18 website tier records. Idempotent: skips if record already exists for industry+tier combo | HIGH |
| 469 | ⏳ | Add pipeline_version field to ClientInstallationOS — tracks which version of install pipeline was used. Prevents in-progress installs from breaking when pipeline is updated | MEDIUM |
| 470 | ⏳ | Build migrateInstallOS admin function — when pipeline templates are updated, backfills new checklist steps to all active ClientInstallationOS records without disturbing completed steps | MEDIUM |
| 471 | ⏳ | Add activation_errors array field to Order — stores { service_key, error_message, failed_at, retry_count } per failed service. Surfaces in admin install workspace | HIGH |
| 472 | ⏳ | Build getSystemHealthDashboard admin function — single call returns: Stripe webhook last received, Twilio last SMS sent, Resend last email sent, active automation count, orders in progress count, clients live count | HIGH |
| 473 | ⏳ | Wire healthCheck function to 6-hour scheduled automation — compares to last run, Telegrams Nolan on degradation, writes results to AgentLog | HIGH |
| 474 | ⏳ | Build clientOffboardingAI — on subscription.deleted: generates personalized 3-email win-back sequence, schedules via Resend, creates LeadReactivation record for 30-day re-entry into pipeline | HIGH |
| 475 | ⏳ | Build generatePackageComparisonEmail — triggered at day 60 for Starter and Growth clients. AI generates personalized upgrade email with real account metrics showing what they're missing. Drives organic tier upgrades | HIGH |

---

*AI Pipeline Full Expansion — Tasks #401–#475 (75 tasks + 30 sub-tasks)*
*Added by Sam (AI Agent) — 2026-05-03*


---

---

# 🧠 AI PIPELINE — EXPANSION 3 — Tasks #476–#500
### Sam | 2026-05-03 | Post-audit additions — gaps missed in previous 75 AI tasks
### Covers: AI quality gates, client communication AI, real-time triggers, safety rails, self-healing loop

---

## SECTION AA: AI QUALITY GATES

| # | Status | Task | Priority |
|---|---|---|---|
| 476 | ⏳ | Build validateAIOutputs function — every AI-generated string passes through this before being written anywhere. Rules: no unfilled {{placeholders}}, no profanity, no competitor names, no pricing contradicting salesCatalog, SMS under 160 chars. Reject + log to AgentLog on failure | CRITICAL |
| 477 | ⏳ | Add AI hallucination guard to generateServiceTemplates — after OpenAI returns copy, re-prompt: "Does this contain unverified claims about response times or guarantees?" If yes, strip the claim and regenerate that sentence only | HIGH |
| 478 | ⏳ | Build AI output audit log — every LLM call writes to AgentLog: function_name, input_context_hash, output_preview (100 chars), model, tokens used, generated_at. Full traceability for every message a client receives | HIGH |
| 479 | ⏳ | Add package tier validation gate in activateAllServices — before configureService is called, confirm service_key is in TIER_SERVICE_MAP AND required credentials exist in install_configuration. Reject with specific field-level error if either fails | CRITICAL |
| 480 | ⏳ | Build credentialsCompletionCheck function — returns per-service readiness: { instant_lead_response: { ready: true/false, missing_fields: [] }, ... }. Used by admin and portal to show exactly what is blocking each service | HIGH |

---

## SECTION AB: CLIENT-FACING AI COMMUNICATION

| # | Status | Task | Priority |
|---|---|---|---|
| 481 | ⏳ | Verify OnboardingChatWidget.jsx calls a real AI function — if responses are static/hardcoded, wire to generateAIReply with system prompt: "You are the ClientSurge onboarding assistant. Help this client complete their setup." | HIGH |
| 482 | ⏳ | Build clientPortalAIAssistant — persistent AI chat in client portal sidebar. Client asks "Why no leads today?" and AI reads CommunicationEvent data + automation status and returns a plain-English answer via getClientAnalytics + getAutomationStatus | HIGH |
| 483 | ⏳ | Build AI-generated go-live checklist — when workflow_stage = "activation_ready", AI reads package + credentials and generates a personalized "Before You Go Live" checklist (e.g. "Confirm booking link accepts appointments", "Test your Twilio number"). Saved to AutomationChecklist | HIGH |
| 484 | ⏳ | Build proactiveClientAlert function — runs daily per active client. If no new leads in 3 days, booking rate dropped 50%, or any automation had 0 triggers in 48h → sends plain-English alert email: "We noticed your lead volume dropped — here's what we recommend" | HIGH |
| 485 | ⏳ | Add AI Suggest Reply button to AdminInbox.jsx — reads inbound message + lead context + CommunicationEvent history, calls generateAIReply, drafts response. Admin sends or edits. Build the button + draft display in AdminInbox | MEDIUM |

---

## SECTION AC: REAL-TIME AI TRIGGERS

| # | Status | Task | Priority |
|---|---|---|---|
| 486 | ⏳ | Create entity automation on WebsiteLead "create" — immediately invoke automationOrchestrator with trigger_event="new_website_lead". Verify onLeadCreated is actually wired as an entity automation in Base44, not just deployed as a function | CRITICAL |
| 487 | ⏳ | Create entity automation on Order "create" — fires all 4 actions: (1) initializeInstallOS, (2) sendClientWelcomeEmail, (3) sendAdminPurchaseNotification, (4) advance workflow_stage to intake_received. All 4 must fire reliably on every new Order | CRITICAL |
| 488 | ⏳ | Create entity automation on ClientInstallationOS "update" — on workflow_stage change: if credentials_complete → invoke activateAllServices; if website_approved → Telegram Nolan + applyWebsiteSpec; if activated → sendGoLiveNotification | CRITICAL |
| 489 | ⏳ | Create entity automation on Order "update" for billing_status — when billing_status changes to "past_due": show PaymentFailedBanner (already built) AND send recovery SMS via Twilio. SMS recovery has higher open rate than email alone | HIGH |
| 490 | ⏳ | Build real-time lead re-scoring trigger — when a Lead receives a new CommunicationEvent (inbound SMS or email reply), immediately re-run scoreLeadIntelligence and update lead.score. Lead replying "I'm ready to book" should instantly jump to Hot status | HIGH |

---

## SECTION AD: AI SAFETY RAILS

| # | Status | Task | Priority |
|---|---|---|---|
| 491 | ⏳ | Build SMS compliance filter middleware — before ANY Twilio SMS send: (1) check lead has not texted STOP, (2) verify consent was collected at opt-in, (3) check message for prohibited content categories (loans, cannabis, adult). Sits as shared middleware called by ALL SMS-sending functions | CRITICAL |
| 492 | ⏳ | Build quiet hours enforcement — all outbound SMS must respect 8am–9pm recipient local time. Build getLocalTimeZone(phone_number) via area code lookup. If outside window, queue message in DelayedMessage entity. Scheduler processes queue at 8am daily | HIGH |
| 493 | ⏳ | Build AI contact frequency limiter — no single lead receives more than 3 AI-generated messages per 24-hour window across all channels combined. Build checkContactFrequency(lead_id) that counts CommunicationEvents in last 24h. All message-sending functions must call this first | HIGH |
| 494 | ⏳ | Build AI content approval workflow for Elite clients — before any AI-generated SMS template is written to install_configuration, create AdminApproval entity record. Nolan reviews in admin panel within 4 hours. If not reviewed in 4h, auto-approve with log entry | MEDIUM |
| 495 | ⏳ | Add PII scrubbing to AgentLog — no full phone numbers or email addresses stored in plaintext in any log. Build maskPII(string) utility: phone → (***) ***-1234, email → j***@g***.com. Required for all AgentLog writes | HIGH |

---

## SECTION AE: AI SELF-HEALING LOOP

| # | Status | Task | Priority |
|---|---|---|---|
| 496 | ⏳ | Build selfHealingMonitor function — runs every 6 hours. Checks: (1) Order in Configuring >4h → re-invoke activateAllServices for stuck services; (2) AutomationChecklistStep in_progress >2h → reset to pending and retry; (3) ClientInstallationOS in same workflow_stage >24h → Telegram Nolan with specific block identified | CRITICAL |
| 497 | ⏳ | Build AI error classifier — when any function logs to AgentLog, classifyInstallError reads the error and categorizes: twilio_credentials_invalid / booking_link_unreachable / openai_rate_limit / network_timeout / data_missing. Each category has a defined resolution path | HIGH |
| 498 | ⏳ | Build autoResolveInstallError function — reads AgentLog entries with requires_nolan=false and acts on category: openai_rate_limit → wait 60s + retry; network_timeout → retry immediately; data_missing → Telegram Nolan with exact field missing. Reduces manual intervention | HIGH |
| 499 | ⏳ | Build AI pipeline version control — before any activateAllServices run, write pipeline_version + timestamp + package_key + service_list to ClientInstallationOS. If pipeline updated mid-run, apply only delta changes rather than full restart | MEDIUM |
| 500 | ⏳ | Build /admin/ai-status dashboard page — shows: all AI functions with last invocation time + success/fail status, total tokens consumed this month from AgentLog, active entity automations and health, self-healing events in last 24h, and Run Full Pipeline Test button | HIGH |

---

*Expansion 3 — Tasks #476–#500 (25 tasks) | Added by Sam — 2026-05-03*
*Quality gates, client-facing AI, real-time event triggers, TCPA compliance, self-healing loop*