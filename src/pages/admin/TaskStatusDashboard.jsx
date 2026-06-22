import { useState, useMemo } from "react";
import { CheckCircle2, Clock, AlertCircle, XCircle, Search, ChevronDown, ChevronRight } from "lucide-react";

// Status constants
const S = { DONE: "done", PENDING: "pending", INPROGRESS: "inprogress", BLOCKED: "blocked" };

const statusConfig = {
  done:      { label: "Complete",     icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", dot: "🟢" },
  pending:   { label: "Pending",      icon: Clock,        color: "#d97706", bg: "#fffbeb", border: "#fde68a", dot: "🟡" },
  inprogress:{ label: "In Progress",  icon: Clock,        color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", dot: "🔵" },
  blocked:   { label: "Blocked",      icon: XCircle,      color: "#dc2626", bg: "#fef2f2", border: "#fecaca", dot: "🔴" },
};

function s(str) {
  if (str === "✅") return S.DONE;
  if (str === "🔄") return S.INPROGRESS;
  if (str === "⏳") return S.PENDING;
  if (str === "❌") return S.BLOCKED;
  return S.PENDING;
}

// ─── ALL TASKS DATA ────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    area: "🟦 Frontend / UI / UX / Store / Mobile / SEO",
    subsections: [
      { name: "Pre-Launch Frontend (#1–25)", tasks: [
        [1,"✅","Finalize store UI product cards with correct pricing display"],
        [2,"✅","Fix cart sidebar body scroll lock on mobile"],
        [3,"✅","Add 'No setup fee' label instead of '$0 setup'"],
        [4,"✅","Add search debounce (280ms) to store search input"],
        [5,"✅","Add SMS consent checkbox in CartSidebar when phone is entered"],
        [6,"✅","Add loading=lazy + explicit width/height to all below-fold images"],
        [7,"✅","Add <link rel=preload> for hero image in index.html"],
        [8,"✅","Split recharts/framer-motion into separate Vite chunks via manualChunks"],
        [9,"✅","Add font-display: swap fallback for Inter/Playfair to prevent FOUT"],
        [10,"✅","Store page: implement intersection-observer lazy rendering for 8+ products"],
        [11,"✅","Build out pages/ThankYou — currently a blank page"],
        [12,"✅","Add Navbar to LegalPage — currently renders with no header/branding"],
        [13,"✅","Standardize all form inputs to rounded-xl (12px) globally"],
        [14,"✅","ClientPortal loading state: replace raw spinner with branded skeleton"],
        [15,"✅","DemoBookingModal time slot grid: force 2-col on viewports < 480px"],
        [16,"✅","CookieConsent banner: add bottom: 80px on mobile to avoid MobileCallBar overlap"],
        [17,"✅","FAQ accordion items: add border-bottom tap target on mobile"],
        [18,"✅","Industry sub-pages: ensure hero headline renders as semantic <h1> tag"],
        [19,"✅","Add descriptive alt text to all hero, testimonial, and TrustBar images"],
        [20,"✅","Fix robots.txt: change Disallow: /leads/ to Disallow: /leads/admin"],
        [21,"✅","Add hreflang tag to index.html for future i18n readiness"],
        [22,"✅","Stub /blog route with 3 placeholder posts for organic SEO"],
        [23,"✅","Add React ErrorBoundary in App.jsx wrapping all routes"],
        [24,"✅","Set staleTime: 60_000 and retry: 1 in lib/query-client.js"],
        [25,"✅","Wrap App in React.StrictMode in main.jsx (dev only)"],
      ]},
      { name: "Visual / Theme / UI Consistency (#26–40)", tasks: [
        [26,"✅","Add dark mode ☀️/🌙 toggle to Navbar desktop + mobile menu"],
        [27,"🔄","Implement ThemeProvider from next-themes so dark mode class is actually applied"],
        [28,"🔄","Standardize primary CTAs to blue gradient; gold = store/checkout only"],
        [29,"✅","Redesign PageNotFound (404) with logo, links, search bar"],
        [30,"✅","Add framer-motion + canvas-confetti to Contact page success state"],
        [31,"✅","pages/Industries: add gradient hero section with industry grid icons"],
        [32,"✅","Industry pages: give each card a unique accent color or icon style"],
        [33,"✅","Mobile sticky cart bar: add padding-top: 72px to main content when visible"],
        [34,"✅","AdminDashboard sidebar: add active-state highlight on current route"],
        [35,"✅","Testimonials: replace broken image URLs with initials-based avatar fallbacks"],
        [36,"✅","Add favicon (32x32 + 180x180) and apple-touch-icon to index.html"],
        [37,"✅","GuidedPathToggle: add Tooltip explaining Guided vs Explore All modes"],
        [38,"✅","ClientPortal tabs: 'Setup Progress' is now first tab and default landing tab"],
        [39,"✅","Industry pages CTAs: use industry-specific headline copy from industryData.js"],
        [40,"✅","Mobile nav: show logged-in user name/role after nav links"],
      ]},
      { name: "Store Page UX (#41–50)", tasks: [
        [41,"✅","Store page initial load: show 6 ProductCard skeletons for 300ms then reveal"],
        [42,"✅","Store ProductCard on mobile (375px): reduce 'Add to Cart' font to 10px"],
        [43,"🔄","CartSidebar: apply acquireBodyScrollLock on open, release on close"],
        [44,"✅","Mobile sticky cart bar: add circular badge with items.length count"],
        [45,"✅","Store page: add 'Talk to a Human' escape valve CTA below product grid"],
        [46,"✅","AdminDashboard sidebar: wire AdminGlobalSearch to all entity types"],
        [47,"🔄","Store SocialProofTicker: verify data is from real Orders (not hardcoded)"],
        [48,"✅","CartSidebar: show empty state with top 3 popular nudge tiles"],
        [49,"✅","Store: Guided mode with no industry selected should show all non-coming-soon products"],
        [50,"✅","ProductCard 'see more features' button should open ServiceDetailModal"],
      ]},
      { name: "Mobile UX (#51–55)", tasks: [
        [51,"🔄","pages/Book Calendly iframe: set width:100%, height:700px, scrolling:yes"],
        [52,"✅","MobileCallBar: pull phone number from AdminSettings instead of hardcoding"],
        [53,"✅","Audit all form inputs for iOS zoom issue (font-size < 16px)"],
        [54,"✅","DemoBookingModal step 2: set min-height:48px on date/time inputs"],
        [55,"🔄","pages/Book Calendly: test CSP allows calendly.com frames on live domain"],
      ]},
      { name: "SEO (#56–61)", tasks: [
        [56,"✅","Industry pages: inject LocalBusiness + Service JSON-LD schema markup"],
        [57,"✅","Generate og:image (1200x630) and add to index.html + setPageMetadata"],
        [58,"✅","Industry page titles: include city/location for local SEO signals"],
        [59,"✅","Add internal linking: Footer cross-links industry pages"],
        [60,"✅","sitemap.xml: add all industry pages and core routes"],
        [61,"✅","Create generateSitemap backend function for dynamic sitemap at /sitemap.xml"],
      ]},
      { name: "Performance (#62–66)", tasks: [
        [62,"✅","Add manifest.json + minimal service worker for PWA installability"],
        [63,"✅","Move all Recharts imports inside lazy() components"],
        [64,"✅","Add ?w=800&q=80 Unsplash query params + srcSet to all hero/industry images"],
        [65,"✅","Remove three.js from package.json if not actively used (saves ~600KB)"],
        [66,"✅","Subset Google Fonts: Inter 400/500/600/700 + Playfair 400/600/700 only"],
      ]},
      { name: "Client Experience Frontend (#67–83)", tasks: [
        [67,"✅","ClientPortal: add 'Get Help' tab with support ticket form → SupportMessage entity"],
        [68,"✅","ClientPortal: add 'What's New' section reading from Changelog entity"],
        [69,"✅","ClientPortal: add 'Refer a Business' section with unique referral link"],
        [70,"✅","BillingDashboard: add 'Cancel Subscription' → getStripeCustomerPortalUrl redirect"],
        [71,"✅","BillingDashboard: add 'Download Invoice PDF' using Stripe invoice_pdf URL"],
        [72,"✅","ClientPortal: show 'payment failed' banner when billing_status === 'past_due'"],
        [73,"✅","chatBubbleAI: add typing indicator while LLM processes response"],
        [74,"✅","chatBubbleAI: add sessionStorage counter, block after 10 messages per session"],
        [75,"✅","Add session timeout warning modal after 30min admin inactivity"],
        [76,"✅","Verify Stripe publishable key is ONLY in frontend (not sk_live_ anywhere)"],
        [77,"✅","Portal graceful empty state — no navigation errors on null project"],
        [78,"✅","Add cookie consent to all public lead capture forms"],
        [79,"✅","pages/Success: verify content is correct and not stale"],
        [80,"✅","Onboarding page: ensure form validates all required fields before submit"],
        [81,"✅","All pages: verify meta description is unique (not default fallback)"],
        [83,"✅","pages/Industries: verify all 6 industry cards link to correct routes"],
      ]},
    ]
  },
  {
    area: "🟩 Backend Functions / Automation / Security",
    subsections: [
      { name: "Security (#84–94)", tasks: [
        [84,"✅","Add Origin header validation to submitLeadCapture + submitContactInquiry"],
        [85,"✅","autoEndToEndTest: add admin role check (return 403 if not admin)"],
        [86,"✅","Move webhookLeadCapture secret from URL param to X-Webhook-Secret header"],
        [87,"✅","submitLeadCapture: normalize phone to E.164 (+1 prefix, reject < 10 digits)"],
        [88,"✅","Add consent_given_at + consent_ip fields to WebsiteLead/Leads entities"],
        [89,"✅","Capture X-Forwarded-For IP in submitLeadCapture and store as consent_ip"],
        [90,"✅","Add IP allowlist option in AdminSettings for admin panel access"],
        [91,"✅","Create autoArchiveOldLeads: anonymize WebsiteLead records > 365 days old"],
        [92,"✅","Ensure honeypot website_url field is in ALL public forms"],
        [93,"✅","Add X-Frame-Options: DENY header to all backend function responses"],
        [94,"✅","Privacy link on contact form and checkout"],
      ]},
      { name: "Backend Reliability (#95–117)", tasks: [
        [95,"✅","processNurtureCampaigns: check CommunicationEvent for STOP keyword before each send"],
        [96,"✅","processDripCampaigns: skip leads with status 'Booked' before sending each step"],
        [97,"✅","processNurtureCampaigns: add idempotency guard (check for duplicate send within 23hr)"],
        [98,"✅","processWebsiteLeadFollowUps: add cadence_paused: true skip guard"],
        [99,"✅","scheduleDemoBooking: add optimistic lock — re-fetch slots before confirming"],
        [100,"✅","scheduleDemoBooking: reject weekend bookings + blocked_dates in AdminSettings"],
        [101,"✅","CartSidebar: add 12-second timeout fallback for Stripe redirect"],
        [102,"✅","sendOrderConfirmationEmail: add fallback values for all template variables"],
        [103,"✅","discoverLeads: return 503 with clear error if Google Maps API key is missing"],
        [104,"✅","enrichLeadWithAI: skip enrichment if lead.enriched_at < 7 days ago"],
        [105,"✅","Store search debounce 280ms implemented"],
        [106,"✅","robots.txt updated with admin blocks"],
        [107,"✅","Create healthCheck function: returns {status:'ok', timestamp, version}"],
        [108,"✅","Create autoCloseStaleLeads: daily scheduled function, closes leads > 30 days"],
        [109,"✅","OrderSuccess: add noindex meta tag"],
        [110,"✅","Create exportLeadsCSV: query Leads with filters, return CSV"],
        [111,"✅","Create exportCommunicationLogs: CSV export with date range filter"],
        [112,"✅","Extend autoEndToEndTest: full checkout → webhook → email → status flow"],
        [113,"✅","sendDailyDigest: add gate — skip send if leads_today === 0 AND orders_today === 0"],
        [114,"✅","All Resend fetch calls: add retry once on 429/5xx with 2-second delay"],
        [115,"✅","monthlyClientReport: after generating report, email it to the client"],
        [116,"✅","getBookedDemoSlots: add {scheduled_date: selectedDate} filter"],
        [117,"✅","Create sendNPSSurvey function: triggered 7 days after order_status = 'fully_live'"],
      ]},
      { name: "Automation (#118–125)", tasks: [
        [118,"✅","Create entity automation: ClientProject update → send milestone email when workflow_stage changes"],
        [119,"✅","Create entity automation: Order update → trigger sendNPSSurvey when order_status = 'fully_live'"],
        [120,"✅","Create scheduled automation: autoCloseStaleLeads — runs daily at 2am"],
        [121,"✅","'$0 setup' renamed to 'No setup fee' in store"],
        [122,"✅","Create scheduled automation: autoArchiveOldLeads — runs monthly"],
        [123,"✅","processAutomationJobs: add retry logic — up to 3 attempts with exponential backoff"],
        [124,"✅","Create _shared/response.js: okJson() and errJson() for consistent response format"],
        [125,"✅","Create _shared/retryFetch.js: reusable retry wrapper for external API calls"],
      ]},
      { name: "Twilio / SMS (#126–130)", tasks: [
        [126,"✅","scheduleFollowUpSMS: verify business hours check uses Phoenix timezone correctly"],
        [127,"✅","receiveTwilioInboundSms: verify STOP handling immediately pauses all sequences"],
        [128,"✅","All SMS sends: verify opt-out language 'Reply STOP to unsubscribe' is appended"],
        [129,"✅","processMissedCallFollowUps: verify missed_call_step_sent increment is idempotent"],
        [130,"✅","Twilio number: add auto-provision flow for new clients"],
      ]},
      { name: "Email / Resend (#131–135)", tasks: [
        [131,"✅","sendOrderConfirmationEmail: verify all 6 service names render correctly in email"],
        [132,"✅","sendDemoConfirmationEmail: verify scheduled_date/time display correctly in all timezones"],
        [133,"✅","sendClientWelcomeEmail: ensure it links to correct client portal URL"],
        [134,"✅","receiveResendWebhook: on email bounce, update CommunicationEvent status to 'failed'"],
        [135,"✅","receiveResendWebhook: on email open, update lead.last_engagement_at"],
      ]},
      { name: "Lead Pipeline (#137–145)", tasks: [
        [137,"✅","submitLeadCapture: verify deduplication window is exactly 60 minutes"],
        [138,"✅","onLeadCreated: verify webhook payload includes all required fields"],
        [139,"✅","scoreLeads: verify lead_score calculation accounts for all scoring factors"],
        [140,"✅","scoreLeadIntelligence: add confidence threshold — skip if AI confidence < 0.6"],
        [141,"✅","routeLead: verify assigned_to field is populated correctly for all lead types"],
        [142,"✅","createLeadAndDispatch: add error recovery if CommunicationEvent creation fails"],
        [143,"✅","validateLeadQuality: add check for disposable email domains"],
        [144,"✅","deduplicateLeads: run dedup on phone hash as well as email"],
        [145,"✅","enrichLead: add timeout of 10 seconds max for external enrichment calls"],
      ]},
      { name: "Stripe Backend (#146–151)", tasks: [
        [146,"🔄","createCheckoutSession: add subscription_data.metadata.order_id for subscription event matching"],
        [147,"✅","stripeWebhookOrders: on invoice.payment_failed, set Order billing_status: 'past_due'"],
        [148,"✅","stripeWebhookOrders: on payment_failed, send recovery email with Stripe payment update link"],
        [149,"✅","requestSubscriptionChange: use proration_behavior: 'create_prorations' in Stripe call"],
        [150,"✅","Extract Stripe init + signature validation into _shared/stripeInit.js"],
        [151,"✅","Add createAuditLog helper: write admin action records to AuditLog entity"],
      ]},
      { name: "Monitoring / DevOps (#152–160)", tasks: [
        [152,"⏳","Register healthCheck function URL with UptimeRobot or Better Stack"],
        [153,"✅","Add Cache-Control: public, max-age=60 to read-only functions"],
        [154,"✅","getAdminAnalytics: fix MRR to sum total_monthly from paid Orders"],
        [155,"✅","getClientAnalytics: remove/replace any hardcoded mock data with real entity queries"],
        [156,"✅","getClientPortalContext: on auth, write portal_login CommunicationEvent"],
        [157,"✅","Create AuditLog entity with fields: admin_email, action, entity, before, after, timestamp"],
        [158,"✅","Add standardized console.log format to all functions"],
        [159,"✅","Verify all functions return proper HTTP status codes (not always 200)"],
        [160,"✅","Add request timeout handling to all external API calls (Twilio, Resend, Stripe)"],
      ]},
      { name: "Data Integrity (#161–167)", tasks: [
        [161,"✅","Verify Order entity client_id is always set after checkout completes"],
        [162,"✅","Verify ClientProject is always created when Order payment_status = 'paid'"],
        [163,"✅","Verify CommunicationEvent is created for every SMS/email send attempt"],
        [164,"✅","Add data validation: Order.total_monthly must equal sum of item monthly_fees"],
        [165,"✅","Ensure AutomationChecklist records are created for every paid service"],
        [166,"✅","Verify pipeline_status and order_status stay in sync after every transition"],
        [167,"✅","Run deduplicateLeads on all existing Leads records to clean up database"],
      ]},
    ]
  },
  {
    area: "🟥 Admin Panel / Client Portal / Stripe / Ops",
    subsections: [
      { name: "Admin Panel Features (#168–184)", tasks: [
        [168,"✅","Add bulk status update to admin lead table (checkboxes + 'Mark as Contacted' toolbar)"],
        [169,"✅","Wire Leads.subscribe() real-time listener to auto-refresh admin leads table"],
        [170,"✅","Install Queue panel: show estimated completion date (install_initialized_at + 6 days)"],
        [171,"✅","Add 'Resend Welcome Email' button in client detail view → sendPortalWelcomeEmail"],
        [172,"✅","AdminSettings: add 'Test Connection' buttons for Twilio + Resend → testProviderConnections"],
        [173,"✅","Add 'Website Leads' tab in AdminDashboard showing WebsiteLead entity with filters"],
        [174,"✅","Add 'Override & Mark Live' button with required reason field in AutomationInstallChecklist"],
        [175,"✅","AdminLeadDetail: add 'Send Manual SMS' text area + button → sendSMS"],
        [176,"✅","AdminSettings: add 'Preview Email Template' modal with sample variable substitution"],
        [177,"✅","Admin analytics: add conversion funnel chart (Lead→Contacted→Booked→Paid)"],
        [178,"✅","CommunicationLogsPanel: add 'Export Logs' button → exportCommunicationLogs"],
        [179,"✅","AdminLeads table: add lead_score column (visible, sortable, color-coded)"],
        [180,"✅","Add 'Demo Bookings' tab in AdminDashboard for DemoRequest management"],
        [181,"✅","AdminLeadDetail: add 'Enroll in Nurture' button → startNurtureCampaign"],
        [182,"✅","Add 'Failed Jobs' section in AdminAutomation showing AutomationJob failures + Retry"],
        [183,"✅","AdminLeads: mask phone numbers as (602) ***-3227 for non-super-admin users"],
        [184,"✅","Create AuditLog viewer tab in AdminDashboard for tracking all admin actions"],
      ]},
      { name: "Admin Onboarding / Install (#185–190)", tasks: [
        [185,"✅","AdminOnboarding: add client search/filter by business name or email"],
        [186,"✅","AdminOnboarding: show pipeline_status badge prominently on each client card"],
        [187,"✅","InstallQueuePanel: add 'Assign to Admin' dropdown for each pending install"],
        [188,"✅","AutomationInstallChecklist: add progress bar showing % of checklist items complete"],
        [189,"✅","Admin: add one-click 'Initialize Install OS' button for newly paid orders"],
        [190,"✅","Admin: show warning badge when order has been paid > 2 days with no install started"],
      ]},
      { name: "Client Portal (#191–200)", tasks: [
        [191,"✅","ClientPortal: build 'Get Help' tab with support ticket form → SupportMessage entity"],
        [192,"✅","ClientPortal: build 'What's New' changelog section from Changelog entity"],
        [196,"✅","BillingDashboard: 'Download Invoice PDF' using Stripe invoice_pdf URL"],
        [197,"✅","ClientPortal: add NPS score display after it's collected"],
        [198,"✅","QuickStartWizard: ensure all onboarding steps link to correct help resources"],
        [199,"✅","ClientPortal: verify OrderTracker shows correct install stages for all service types"],
        [200,"✅","ClientDashboard: add 'Your Automation is Paused' warning when cadence_paused = true"],
      ]},
      { name: "Stripe / Billing (#201–210)", tasks: [
        [201,"🔄","Switch Stripe from Test Mode to Live Mode (sk_live_ / pk_live_ keys in Dashboard)"],
        [202,"🔄","Update Stripe webhook endpoint URL to production domain"],
        [203,"🔄","Test full purchase flow end-to-end with real card on live domain"],
        [204,"✅","Verify Stripe subscription renewal fires invoice.paid webhook and is handled"],
        [205,"✅","Add capacity limit: AdminSettings.max_active_onboarding — block checkout if exceeded"],
        [206,"🔄","getStripeCustomerPortalUrl: verify it returns working URL for all paid customers"],
        [207,"✅","Stripe proration: implement preview before plan change in requestSubscriptionChange"],
        [208,"✅","Verify Stripe metadata includes base44_app_id on all checkout sessions"],
        [209,"✅","Add Stripe customer ID to ClientProject for portal billing lookups"],
        [210,"✅","Verify all Stripe webhook event types are handled (created, updated, deleted, failed)"],
      ]},
      { name: "Operational Readiness (#211–219)", tasks: [
        [211,"✅","Configure custom domain DNS and verify SSL cert"],
        [212,"✅","Set up UptimeRobot or Better Stack monitoring on healthCheck endpoint"],
        [213,"✅","Configure Resend domain authentication (SPF, DKIM, DMARC) for deliverability"],
        ["213b","✅","Verify Twilio number is A2P 10DLC registered for commercial SMS in the US"],
        [214,"✅","Add Google Analytics 4 event tracking for: purchase, demo_booked, lead_submitted"],
        [215,"✅","Set up error alerting: admin email on any backend function 5xx error"],
        [216,"✅","Document all environment variables in a README_ENV.md file"],
        [217,"✅","Create runbook: what to do when Twilio is down / Resend is down / Stripe is down"],
        [218,"✅","Verify all secrets are set in production (not just dev) environment"],
        [219,"❌","Load test: simulate 50 concurrent lead submissions and measure response time"],
      ]},
      { name: "Data / Entities (#220–229)", tasks: [
        [220,"✅","Create AuditLog entity (admin_email, action, entity_name, record_id, before, after, timestamp)"],
        [221,"✅","Create Changelog entity (title, description, date, is_published) for client portal"],
        [222,"✅","Create Referral entity (referrer_client_id, referred_email, status, credit_amount)"],
        [223,"✅","Add nps_score + nps_responded_at fields to ClientProject entity"],
        [225,"✅","Add consent_given_at + consent_ip fields to Leads entity"],
        [226,"✅","Verify all entity RLS rules are correct — Client entity has correct read/write rules"],
        [227,"✅","Add max_active_onboarding field to AdminSettings entity"],
        [228,"✅","Add blocked_dates array field to AdminSettings for holiday/weekend booking blocks"],
        [229,"✅","Add allowed_admin_ips array field to AdminSettings for IP allowlisting"],
      ]},
      { name: "Client Experience Backend (#230–235)", tasks: [
        [230,"✅","Create sendNPSSurvey function — email 7 days after fully_live with 1-10 rating link"],
        [231,"✅","Entity automation: ClientProject workflow_stage change → send milestone email"],
        [232,"✅","Entity automation: Order fully_live → trigger sendNPSSurvey after 7-day delay"],
        [233,"✅","Verify sendClientWelcomeEmail includes correct client portal URL + temp access instructions"],
        [234,"✅","Verify sendPortalWelcomeEmail is triggered automatically after order is paid"],
        [235,"✅","Create Changelog entity records: add first 3 'What's New' entries for portal"],
      ]},
      { name: "Documentation (#236–240)", tasks: [
        [236,"✅","Write README_ENV.md documenting all required environment variables"],
        [237,"✅","Write RUNBOOK_OUTAGE.md: steps for Twilio/Resend/Stripe outage scenarios"],
        [238,"✅","Write ONBOARDING_SOP.md: step-by-step for onboarding a new client manually"],
        [239,"✅","Write STRIPE_GO_LIVE.md: checklist for switching to live Stripe keys"],
        [240,"✅","Update INSTALLATION_WORKFLOW_GUIDE.md with latest install OS fields"],
      ]},
      { name: "Final Launch Checklist (#241–250)", tasks: [
        [241,"✅","Final: run Lighthouse audit on homepage — target 90+ performance score"],
        [242,"✅","Final: run axe or WAVE accessibility audit — fix all WCAG AA violations"],
        [243,"✅","Final: test all CTA buttons across mobile (375px, 390px, 414px)"],
        [244,"✅","Final: verify all email templates render correctly in Gmail, Outlook, Apple Mail"],
        [245,"🔄","Final: test complete lead → SMS → follow-up → booking flow with test lead"],
        [246,"✅","Final: verify admin panel loads in < 3 seconds with 100+ leads in database"],
        [247,"✅","Final: confirm robots.txt is correct and sitemap is submitted to Google Search Console"],
        [248,"✅","Final: review all legal pages (Privacy, Terms) for accuracy and TCPA compliance"],
        [249,"🔄","Final: do a full purchase test with a real card → verify order, emails, SMS all fire"],
        [250,"🔄","Final: team sign-off — all 3 agents mark their sections complete before go-live"],
      ]},
    ]
  },
  {
    area: "🔬 Expansion Pack 1 — AI Brain / Portal / Admin / SEO (#251–300)",
    subsections: [
      { name: "AI Brain / Lead Intelligence (A)", tasks: [
        [251,"✅","Wire scoreLeadIntelligence to fire on every new WebsiteLead creation"],
        [252,"✅","Wire classifyLeadIntent on inbound SMS replies"],
        [253,"✅","Wire predictChurnRisk to run weekly on all active Orders — alert Nolan if score > 70"],
        [254,"✅","Wire automationOrchestrator to Admin dashboard so Nolan can trigger it manually"],
        [255,"✅","/lead-intelligence page: display lead_score and quality_label per lead in the UI"],
        [256,"✅","Lead Intelligence dashboard: add real LeadAnalytics entity reads"],
        [257,"✅","Add 'AI Re-Score' button in admin lead list — calls scoreLeadIntelligence"],
        [258,"✅","predictLeadOutcome: surface prediction result in ClientPortal leads tab"],
      ]},
      { name: "Client Portal Missing Features (B)", tasks: [
        [259,"✅","ClientPortal: build 'Get Help' tab with support ticket form"],
        [260,"✅","ClientPortal: build 'Billing' tab — show current plan, next billing date, amount"],
        [261,"✅","ClientPortal: 'Cancel Subscription' button → redirect to Stripe customer portal URL"],
        [262,"✅","ClientPortal: 'Download Invoice' button → pull Stripe invoice_pdf URL"],
        [263,"✅","ClientPortal: show red PaymentFailedBanner when Order billing_status === 'past_due'"],
        [264,"✅","ClientPortal: build 'Refer a Business' tab with unique referral link"],
        [265,"✅","ClientPortal: AutomationChecklist — display live checklist progress"],
        [266,"✅","ClientPortal: show 'Setup Progress' bar driven by real ClientInstallationOS fields"],
        [267,"✅","ClientPortal: add 'What's New' tab reading from a Changelog entity"],
      ]},
      { name: "Admin Panel Analytics / Ops (C)", tasks: [
        [268,"✅","AdminDashboard: build MRR metric card — sum total_monthly from all Orders with payment_status=paid"],
        [269,"✅","AdminDashboard: build LTV card — total revenue per client over their lifetime"],
        [270,"✅","AdminDashboard: build Churn Risk panel — list clients with predictChurnRisk score > 70"],
        [271,"✅","AdminDashboard: wire AdminGlobalSearch to all entity types"],
        [272,"✅","AdminDashboard: add session inactivity timeout — show warning modal after 30min"],
        [273,"✅","AdminDashboard: add 'Install Status' table showing each client's onboarding step completion"],
        [274,"✅","AdminDashboard: add quick-action buttons — 'Send Day 1 Email', 'Trigger Follow-Up', 'Mark Live'"],
        [275,"✅","Admin leads list: add bulk action — 'Mark as contacted', 'Export to CSV', 'Rescore with AI'"],
      ]},
      { name: "Onboarding Flow (D)", tasks: [
        [276,"✅","Build InstallChecklistPanel component — reads AutomationChecklist entity fields"],
        [277,"✅","Wire onboarding_complete, went_live, twilio_configured fields to admin UI"],
        [278,"✅","Auto-send 'You're Live!' email via Resend when went_live is set to true"],
        [279,"✅","Auto-send Telegram alert to Nolan when any onboarding step changes"],
        [280,"⏳","Build client-facing onboarding status page at /setup — shows install progress without admin login"],
        [281,"✅","Onboarding form: validate all required fields before submit"],
      ]},
      { name: "SEO Structural Gaps (E)", tasks: [
        [282,"✅","Add LocalBusiness + Service JSON-LD schema to all 6 industry pages"],
        [283,"✅","Add BreadcrumbList JSON-LD schema to all inner pages"],
        [284,"✅","Add setPageMetadata() utility — dynamic title + description + og:image per route"],
        [285,"✅","Add preconnect links for fonts.googleapis.com, stripe.com, resend.com in index.html"],
        [286,"✅","Industry pages: include Phoenix/Scottsdale city name in H1 and meta title"],
        [287,"✅","Create /blog with 3 pillar posts"],
        [288,"✅","Add twitter:card meta tags to all pages"],
      ]},
      { name: "Performance (F)", tasks: [
        [289,"✅","Add preconnect and dns-prefetch for Stripe, Twilio, Resend CDNs in index.html"],
        [290,"✅","Add manifest.json with name, icons, theme_color for PWA installability"],
        [291,"✅","Add Vite manualChunks to split recharts, framer-motion, lucide into separate bundles"],
        [292,"✅","Add loading=lazy attribute to ALL below-fold images site-wide"],
        [293,"✅","Subset Google Fonts — load only Inter 400/500/600/700 + Playfair 400/600"],
      ]},
      { name: "Analytics + Tracking (G)", tasks: [
        [294,"✅","Connect GA4 property — add G- tracking ID to index.html gtag snippet"],
        [295,"✅","Track checkout button clicks as GA4 conversion events"],
        [296,"✅","Track form submissions (lead capture, contact, onboarding) as GA4 events"],
        [297,"✅","Add UTM parameter persistence — submitLeadCapture stores utm_source/medium/campaign"],
        [298,"✅","Build weekly analytics digest automation — email Nolan every Monday"],
      ]},
      { name: "Accessibility + Legal (H)", tasks: [
        [299,"✅","Add skip-to-content link at top of every page for screen reader accessibility"],
        [300,"✅","Add TCPA-compliant SMS consent disclosure to ALL public lead capture forms"],
      ]},
    ]
  },
  {
    area: "🔧 Expansion Pack 2 — Stripe / Portal / Admin / Lead Mgmt / Store (#301–400)",
    subsections: [
      { name: "Stripe / Payments — Critical Revenue Gaps (I)", tasks: [
        [301,"✅","Pricing.jsx: replace all 6 test Stripe links with live payment links"],
        [302,"✅","salesCatalog.js: audit all setup_fee and monthly_fee values — must be ONE source of truth"],
        [303,"✅","CartSidebar handleCheckout: wire to createCheckoutSession backend function"],
        [304,"✅","createCheckoutSession: verify it uses sk_live_ not sk_test_ — check STRIPE_SECRET_KEY env var"],
        [305,"✅","Add Stripe Customer Portal link to BillingDashboard — getStripeCustomerPortalUrl is deployed"],
        [306,"✅","getClientInvoices function is deployed — wire it to BillingDashboard so real invoice history shows"],
        [307,"✅","requestSubscriptionChange function deployed — wire 'Upgrade/Downgrade' button"],
        [308,"✅","stripeWebhookOrders: add handling for customer.subscription.deleted"],
        [309,"✅","Add post-checkout redirect from Stripe back to /client-portal with session_id param"],
        [310,"✅","Add Stripe test mode warning banner in Admin panel"],
      ]},
      { name: "Portal — Mock/Sample Data Replacement (J)", tasks: [
        [311,"✅","AutomationsOverview.jsx: replace SAMPLE_AUTOMATIONS hardcoded array with real AutomationChecklist entity reads"],
        [312,"✅","SocialProofTicker.jsx: wire to real Order entity count for 'X businesses automated'"],
        [313,"✅","WeeklyReports.jsx: verify BUILD_STEPS keys match actual ClientInstallationOS entity fields"],
        [314,"✅","RevenueMetricsPanel.jsx: verify it reads from real Order entities not mock data"],
        [315,"✅","TasksDashboard.jsx: confirm getClientTaskJobs function returns real data"],
        [316,"✅","ClientPortal.jsx: verify getClientPortalContext returns project, order, AND subscription"],
        [317,"✅","PaymentFailedBanner component: add billing_status === 'past_due' check to show it"],
        [318,"✅","Portal tab 'Automations': replace with real getAutomationStatus function call"],
        [319,"✅","Portal WeeklyReports tab: wire generateWeeklyReport backend function"],
        [320,"✅","Portal NotificationBell: verify it polls real entity for unread notifications"],
      ]},
      { name: "Admin Panel — Deployed Functions Never Called From UI (K)", tasks: [
        [321,"✅","Wire getAdminAnalytics to AdminDashboard/RevenueDashboard"],
        [322,"✅","Wire getLeadPipelineSummary to LeadManagementDashboard"],
        [323,"✅","Wire deduplicateLeads to a 'Clean Duplicates' button in admin leads panel"],
        [324,"✅","Wire stalledOnboardingAlert to a cron automation"],
        [325,"✅","Wire monthlyClientReport to send on 1st of each month"],
        [326,"❌","Wire autoSchedule30DayCheckin — BLOCKED: current function immediately sends a misleading 'live for 30 days' email"],
        [327,"✅","Wire sendDailyDigest to a daily 8am MST automation"],
        [328,"✅","Wire runWinBackSequence — added System Automations win-back preview control"],
        [329,"✅","Wire reactivateLeadOutreach — verified Lead Reactivation admin tab"],
        [330,"✅","Admin IntegrationHealth.jsx: call getIntegrationHealth on load"],
      ]},
      { name: "Lead Management (L)", tasks: [
        [331,"✅","bulkLeadAction function deployed — wire it to BulkActionToolbar.jsx"],
        [332,"✅","importLeads function deployed — build a CSV import UI in admin leads panel"],
        [333,"✅","dispatchLeadWebhook deployed — add webhook test button in admin"],
        [334,"✅","routeLead function deployed — verify LeadRoutingPanel.jsx actually calls it"],
        [335,"✅","LeadCRMDrawer.jsx: verify it calls enrichLeadWithAI on open"],
        [336,"✅","onLeadCreated function: verify it fires for EVERY new WebsiteLead"],
        [337,"✅","processWebsiteLeadFollowUps automation: verify it is ACTIVE and scheduled"],
        [338,"✅","processMissedCallFollowUps automation: verify ACTIVE and Twilio webhook is configured"],
        [339,"✅","processNurtureCampaigns: verify STOP keyword check is in place BEFORE every SMS send"],
        [340,"✅","LeadSourceAttribution.jsx: wire to real CommunicationEvent entity reads"],
      ]},
      { name: "SEO Technical Gaps (M)", tasks: [
        [341,"✅","seo.js: DEFAULT_OG_IMAGE points to base44.com CDN — host at clientsurgesystems.com"],
        [342,"✅","index.html: missing viewport-fit=cover in meta viewport tag"],
        [343,"✅","index.html: Space Grotesk font loaded but rarely used — remove to save 60KB"],
        [344,"✅","Add canonical tag to every industry page using setPageMetadata"],
        [345,"✅","MedSpa.jsx calls setPageMetadata — verify Dental, Chiro, HVAC, Roofing, Contractors pages also call it"],
        [346,"✅","SchemaMarkup.jsx getFAQSchema — add FAQ schema to all 6 industry pages"],
        [347,"⏳","Footer: 'Tanning Salons' industry missing from footer nav links"],
        [348,"✅","Footer: Roofing and Contractors pages missing from footer nav — add all active industry routes"],
        [349,"✅","Add /sitemap.xml route that reads from AdminSettings or returns hardcoded XML"],
        [350,"✅","Add robots.txt with correct Disallow: /admin Disallow: /client-portal Allow: /"],
      ]},
      { name: "Frontend Quality — Real Bugs (N)", tasks: [
        [351,"✅","Testimonials.jsx: all 3 testimonials use Unsplash stock photos — replace with generated avatars"],
        [352,"✅","Testimonials.jsx: change all testimonial locations to Phoenix/Scottsdale, AZ"],
        [353,"✅","SocialProofTicker says '6 automations per client' — change to 'Up to 6 automations'"],
        [354,"✅","constants.js BUTTON_TEXT.BOOK_DEMO = 'Make the Leap' — replace site-wide"],
        [355,"✅","ExitIntentPopup.jsx: verify it doesn't fire on /admin or /client-portal routes"],
        [356,"✅","CookieConsent.jsx: verify it persists dismissal in localStorage"],
        [357,"✅","LeadCaptureForm: add honeypot hidden field website_url to block bots"],
        [358,"✅","MobileCallBar.jsx: hardcoded phone number — pull from AdminSettings"],
        [359,"⏳","Hero.jsx checklist says '14 days of automated follow-up' — verify backend runs for 14 days"],
        [360,"✅","ScrollProgressBar.jsx: verify it only renders on long-scroll pages"],
      ]},
      { name: "Store Page Specific Gaps (O)", tasks: [
        [361,"✅","Store salesCatalog.js: individual service pricing — document the pricing hierarchy clearly"],
        [362,"✅","Store GuidedPathToggle: 'Explore All' mode — add a 'Most Popular' sort as default"],
        [363,"✅","Store BuildYourStackFlow.jsx: lazy loaded — verify it renders on mobile"],
        [364,"✅","CartSidebar: after successful checkout, cart items should be cleared"],
        [365,"✅","Store StackValueCounter: verify it reads from cart context in real time"],
        [366,"✅","Store page: CANONICAL_SERVICE_PRODUCTS and AI_PRODUCTS both imported from aiProducts"],
        [367,"✅","ProductCard.jsx: 'Add to Cart' should be disabled for coming_soon products"],
        [368,"✅","Store ServiceComparisonModal: lazy loaded — add error boundary wrapper"],
        [369,"✅","CartSidebar: smsConsent checkbox is present but is it validated before checkout proceeds?"],
        [370,"✅","Store page: setPageMetadata is imported — verify it's actually called"],
      ]},
      { name: "Onboarding + Installation Flow (P)", tasks: [
        [371,"✅","initializeInstallOS function deployed — verify it is called when a new Order is created"],
        [372,"✅","installPipeline function: wire it to Admin InstallOrderWorkspace.jsx"],
        [373,"⏳","autoProvisionTwilioNumber is deployed — add 'Auto-Provision Number' button in admin install workspace"],
        [374,"✅","configureService function deployed — wire to ServiceConfigEditor.jsx"],
        [375,"✅","getInstallConfiguration function deployed — verify InstallOrderWorkspace calls it on load"],
        [376,"✅","listInstallQueue function deployed — verify InstallQueuePanel.jsx calls it (not a static list)"],
        [377,"✅","sendClientWelcomeEmail deployed — verify it fires when Order goes to 'paid_setup_in_progress' status"],
        [378,"✅","sendPortalWelcomeEmail deployed — verify it fires when client portal account is first created"],
        [379,"✅","stalledOnboardingAlert: create a daily 9am automation"],
        [380,"✅","Onboarding.jsx form: currently 531 lines with no field-level validation — add required field validation"],
      ]},
      { name: "Security — Specific Gaps (Q)", tasks: [
        [381,"✅","autoEndToEndTest function: no auth guard found — add admin role check immediately"],
        [382,"✅","secureFormSubmission function exists — verify submitLeadCapture and submitContactInquiry actually call it"],
        [383,"✅","authGuards.js shared lib exists — audit which functions import and use it"],
        [384,"✅","webhookSecurity.js and webhookValidation shared libs — verify receiveTwilioInboundSms validates Twilio signature"],
        [385,"⏳","AuditLog entity exists — broader admin action audit still open"],
        [386,"⏳","legacyQuarantine.js shared lib exists — identify and remove all legacy function references"],
        [387,"✅","Base44 vite.config.js has legacySDKImports — ensure BASE44_LEGACY_SDK_IMPORTS=false in production"],
        [388,"✅","manageWebhookRegistration function deployed — ensure webhook secrets are stored encrypted"],
        [389,"✅","sendTestLead function deployed and exposed — add admin-only guard"],
        [390,"✅","simulateMissedCall function deployed — add admin-only guard"],
      ]},
      { name: "Automation Health + Scheduling (R)", tasks: [
        [391,"✅","Create entity automation on Order for 'create' event — triggers initializeInstallOS + sendClientWelcomeEmail"],
        [392,"✅","Create entity automation on ClientInstallationOS for 'update' event"],
        [393,"✅","bookingConfirmationLoop: verify it is called after every scheduleDemoBooking"],
        [394,"✅","processQualifiedFollowUps: verify it runs on a schedule"],
        [395,"✅","processDripCampaigns: create scheduled automation to run every 4 hours"],
        [396,"✅","processDynamicFollowUps: verify it runs every hour for active sequences"],
        [397,"⏳","autoSendWebhookInstructions: wire to fire when a new client Order is created"],
        [398,"✅","generateWeeklyReport: create weekly Monday 8am MST automation"],
        [399,"✅","sendDailyDigest: create daily 7am MST automation"],
        [400,"✅","Create a healthCheck automation that runs every 6 hours"],
      ]},
    ]
  },
  {
    area: "🧠 AI Pipeline — Payment / Credentials / Activation / Website / Elite / Intelligence (#401–475)",
    subsections: [
      { name: "Payment Detection + Package Intelligence (S)", tasks: [
        [401,"✅","stripeWebhookOrders: on checkout.session.completed, read metadata.package_key and write to Order.package_key"],
        ["401a","✅","Verify metadata.package_key is attached to the Stripe checkout session at creation"],
        ["401b","✅","Add fallback — if metadata.package_key is missing, derive package_key from line items"],
        ["401c","✅","Write test case — create a mock checkout.session.completed event"],
        [402,"✅","Build classifyPurchasedPackage function — AI maps service_keys to nearest tier"],
        ["402a","✅","Define TIER_SERVICE_MAP constant with canonical service_key lists per tier"],
        ["402b","⏳","Handle edge cases — client buys 3 services (map to Growth), 5 services (map to Elite minus 1)"],
        ["402c","⏳","Log classification decision with reasoning to AgentLog"],
        [403,"✅","stripeWebhookOrders: invoke initializeInstallOS immediately after setting package_key"],
        ["403a","✅","Wrap initializeInstallOS call in try/catch so a failure does NOT return 500 to Stripe"],
        ["403b","✅","Log initializeInstallOS failure to AgentLog and fire Telegram alert to Nolan"],
        ["403c","✅","Add idempotency check — if ClientInstallationOS already exists for this order_id, skip"],
        [404,"✅","sendOrderConfirmationEmail: make email body package-aware"],
        ["404a","✅","Build 3 HTML email templates (one per tier) with service checklist"],
        ["404b","⏳","Build à la carte fallback template that lists individual services from Order.items[]"],
        ["404c","✅","Test all 4 variants (3 tiers + à la carte) with real order_id before going live"],
        [405,"✅","sendAdminPurchaseNotification: guarantee it fires on EVERY checkout.session.completed"],
        ["405a","✅","Wire Telegram message — format: '💳 New Payment: [Business] - [Tier] - $[Setup] + $[Monthly]/mo'"],
        ["405b","⏳","Wire backup email to nolan@clientsurgesystems.com in case Telegram fails"],
        [426,"✅","validateStripeWebhookSignature: confirm stripeWebhookOrders uses stripe.webhooks.constructEvent()"],
        [427,"✅","Add stripe_event_id idempotency check to stripeWebhookOrders"],
        [428,"✅","Handle checkout.session.expired in stripeWebhookOrders"],
        [429,"✅","Handle customer.subscription.deleted in stripeWebhookOrders"],
        [430,"✅","Handle invoice.payment_failed properly — add sendMissedCallRecoveryEmail call with invoice link"],
      ]},
      { name: "Credentials Intake Form (T)", tasks: [
        [406,"✅","Build /setup/credentials page — post-purchase landing"],
        ["406a","✅","Build the /setup/credentials route in App.jsx"],
        ["406b","✅","Add order validation hook on page load — fetch Order, verify payment_status"],
        ["406c","⏳","Add loading skeleton for the 200ms fetch delay before form renders"],
        [407,"✅","Build tiered credentials intake form — Starter: 3 fields, Growth: 6 fields, Elite: 10 fields"],
        ["407a","✅","Build the Starter 3-field form variant"],
        ["407b","✅","Build the Growth 6-field form variant"],
        ["407c","✅","Build Elite 10-field wizard with logo upload, hex color pickers, AI tone radio buttons"],
        ["407d","⏳","Add sessionStorage persistence between wizard steps"],
        [408,"✅","On credentials submit, call saveClientCredentials which writes all fields into Order.install_configuration"],
        ["408a","✅","Map business_phone → install_configuration.twilio_business_phone"],
        ["408b","✅","Map booking_link → install_configuration.booking.booking_link"],
        ["408c","✅","Map logo_url → install_configuration.brand.logo_url"],
        ["408d","✅","Advance ClientInstallationOS.workflow_stage to 'Ready for Install' after successful write"],
        [409,"✅","Build 'Missing Credentials' daily automation — 9am MST"],
        ["409a","✅","Write the reminder email template"],
        ["409b","✅","Create the Base44 scheduled automation triggering this check daily"],
        [410,"✅","Build saveClientCredentials backend function"],
        ["410a","✅","Define REQUIRED_FIELDS_BY_TIER constant"],
        ["410b","✅","Return structured validation errors per field"],
        ["410c","⏳","Add admin_bypass flag — if caller is admin role, skip validation"],
        [431,"⏳","Add multi-step progress bar to Elite intake form with sessionStorage persistence"],
        [432,"⏳","Add hex color picker with live preview swatch to Elite form"],
        [433,"⏳","Add Google Business Profile URL validator in intake form"],
        [434,"✅","After credentials submission: redirect to /setup/status/[order_id] AND immediately send confirmation email"],
      ]},
      { name: "Service Activation Engine (U)", tasks: [
        [411,"✅","installPipeline: add TIER_SERVICE_MAP gate"],
        ["411a","✅","Define TIER_SERVICE_MAP as a shared constant accessible by both installPipeline and activateAllServices"],
        ["411b","⏳","Add admin override — if admin manually triggers a service outside client's tier, log a warning but allow it"],
        [412,"✅","configureService: after each successful config, update AutomationChecklistStep.status = 'complete'"],
        ["412a","✅","Query AutomationChecklistStep by order_id + service_key to find the right record"],
        ["412b","⏳","Handle gracefully if AutomationChecklistStep record doesn't exist — create it"],
        [413,"✅","Build generateServiceTemplates function — AI personalization layer"],
        ["413a","✅","Build OpenAI prompt for each of the 4 template types with tone + industry context"],
        ["413b","✅","Enforce 160-char hard limit on all SMS output with retry if exceeded"],
        ["413c","⏳","Add character count validation and rejection before writing to install_configuration"],
        ["413d","✅","Add static fallback templates per industry if OpenAI call fails"],
        [414,"✅","autoProvisionTwilioNumber: trigger automatically in installPipeline when business_phone is empty"],
        [415,"✅","Build activateAllServices function — reads package_service_keys, calls generateServiceTemplates first"],
        ["415a","✅","Sequential execution with individual try/catch per service"],
        ["415b","✅","Track partial success — write { service_key, status, error } array to Order.activation_errors"],
        ["415c","✅","On full completion, call sendGoLiveNotification"],
        [435,"✅","Build sendGoLiveNotification function"],
        [436,"✅","Add service activation retry logic — if configureService fails, wait 5min and retry once"],
        [437,"✅","Build getActivationProgress function"],
        [438,"⏳","Add activation_started_at and activation_completed_at timestamp fields to Order"],
      ]},
      { name: "Website Generation Engine (V)", tasks: [
        [416,"✅","Build generateClientWebsite backend function (AI-powered rewrite with InvokeLLM copy generation)"],
        ["416a","✅","Define WebsiteSpec JSON schema — pages array with sections, copy blocks, brand object"],
        ["416b","✅","Build the Starter 1-page spec generator"],
        ["416c","✅","Build Growth 3-page spec (Home + Services + Book Now)"],
        ["416d","✅","Build Elite 5-page spec (Home + Services + Industry Landing + Client Portal Login + Lead Intelligence Dashboard)"],
        [417,"✅","Define 3 website tier templates per industry in BusinessConfigTemplate"],
        ["417a","✅","Write Starter template JSON for all 6 industries"],
        ["417b","✅","Write Growth template JSON for all 6 industries"],
        ["417c","✅","Write Elite template JSON for all 6 industries"],
        ["417d","✅","Build seedWebsiteTemplates admin function with idempotency check"],
        [418,"✅","generateClientWebsite — Elite tier: call OpenAI to write hero headline, subheading, 3 proof points"],
        [419,"✅","Auto-update ClientInstallationOS.workflow_stage as website build progresses"],
        [420,"✅","Build /setup/preview/[order_id] page — shows AI-generated WebsiteSpec as visual mockup"],
        ["420a","✅","Build the approve handler — sets WebsiteSpec.status = 'approved'"],
        ["420b","⏳","Build the revision request handler"],
        [439,"✅","Create WebsiteSpec entity schema"],
        [440,"✅","After client approves WebsiteSpec, auto-Telegram Nolan"],
        [441,"✅","Build applyWebsiteSpec admin function"],
        [442,"⏳","Build AI website copy finalizer — if client submitted revision_notes, AI regenerates affected sections"],
      ]},
      { name: "Elite Tier Perks (W)", tasks: [
        [421,"✅","Build generateLeadMagnet function — Elite perk #1"],
        ["421a","✅","Generate 3 lead magnets (one per major pain point per industry)"],
        ["421b","✅","Convert markdown to PDF and upload to Base44 private storage"],
        ["421c","⏳","Create Files entity record linked to order_id and notify client"],
        [422,"✅","Build generateMonthlyPerformanceReport function — Elite perk #2"],
        ["422a","✅","Build the data queries per metric"],
        ["422b","✅","Build HTML report template with metric cards"],
        ["422c","⏳","Create Reports entity and save report record"],
        ["422d","✅","Create monthly 1st-of-month scheduled automation"],
        [423,"✅","Build Elite voice clone intake flow — perk #3"],
        [424,"✅","Build /setup/status/[order_id] activation tracker — polls ClientInstallationOS.workflow_stage every 30 seconds"],
        ["424a","✅","Build 30-second polling with useInterval hook"],
        ["424b","✅","Build the stepper component with 5 stages reading real workflow_stage field"],
        ["424c","⏳","Build error state with 'Contact Support' button"],
        [425,"✅","Build runFullPipelineTest admin function — simulates complete purchase for each of 3 tiers"],
        ["425a","✅","Build Starter tier test fixture and assertion set"],
        ["425b","✅","Build Growth tier test fixture"],
        ["425c","✅","Build Elite tier test fixture including website generation step"],
        [443,"✅","Elite perk #4 — generateCompetitorAudit"],
        [444,"⏳","Elite perk #5 — generateSocialStarterPack: AI generates 10 ready-to-post social captions"],
        [445,"✅","Elite perk #6 — wire autoSchedule30DayCheckin for Elite clients"],
      ]},
      { name: "AI Intelligence Loop (X)", tasks: [
        [446,"✅","Build detectPackageUpgradeOpportunity — weekly check"],
        [447,"✅","Build predictOptimalSendTime — AI analyzes CommunicationEvent reply rates by hour-of-day"],
        [448,"✅","Build generatePersonalizedFollowUp — replaces static Day 3/Day 7 templates"],
        [449,"✅","Build analyzeClientLeadQuality — monthly per client"],
        [450,"⏳","Build autoOptimizeSMSTemplates — A/B test engine for SMS template variants"],
        [451,"✅","Build detectLeadGhostingPattern"],
        [452,"✅","Wire processCallRecording output to automationOrchestrator"],
        [453,"✅","Build clientHealthScore function — composite score 0-100"],
        [454,"✅","Build generateAIOnboardingBriefing"],
        [455,"✅","Upgrade intelligentLeadRouting — replace simple rules with AI routing"],
      ]},
      { name: "Admin AI Tools (Y)", tasks: [
        [456,"✅","Build admin 'AI Audit' button per order in InstallOrderWorkspace"],
        [457,"✅","AILeadInsightPanel: verify it calls scoreLeadIntelligence and predictLeadOutcome with real data"],
        [458,"✅","Add 'Next Best Action' card to admin lead detail"],
        [459,"✅","Build adminAICommandBar — natural language command input"],
        [460,"✅","Build AI anomaly detection in getAdminAnalytics"],
      ]},
      { name: "Missing Infrastructure (Z)", tasks: [
        [461,"✅","Create WebsiteSpec entity schema"],
        [462,"✅","Create Reports entity schema"],
        [463,"✅","Add health_score field (numeric 0-100) to ClientProject entity"],
        [464,"✅","Add voice_sample_url + voice_clone_status enum to Order.install_configuration schema"],
        [465,"⏳","Add optimal_send_hour field (integer 0-23) to ClientProject"],
        [466,"✅","Add ab_test_variant field to MessageTemplate entity"],
        [467,"✅","Add website_spec_id field to ClientInstallationOS"],
        [468,"✅","Build seedWebsiteTemplates admin function"],
        [469,"✅","Add pipeline_version field to ClientInstallationOS"],
        [470,"✅","Build migrateInstallOS admin function"],
        [471,"✅","Add activation_errors array field to Order"],
        [472,"✅","Build getSystemHealthDashboard admin function"],
        [473,"✅","Wire healthCheck function to 6-hour scheduled automation"],
        [474,"✅","Build clientOffboardingAI — on subscription.deleted"],
        [475,"✅","Build generatePackageComparisonEmail — triggered at day 60 for Starter and Growth clients"],
      ]},
    ]
  },
  {
    area: "🛡️ AI Pipeline Expansion 3 — Quality Gates / Safety / Real-Time Triggers (#476–500)",
    subsections: [
      { name: "AI Quality Gates (AA)", tasks: [
        [476,"✅","Build validateAIOutputs function — every AI-generated string passes through this before being written"],
        [477,"✅","Add AI hallucination guard to generateServiceTemplates"],
        [478,"✅","Build AI output audit log — every LLM call writes to AgentLog"],
        [479,"✅","Add package tier validation gate in activateAllServices"],
        [480,"✅","Build credentialsCompletionCheck function"],
      ]},
      { name: "Client-Facing AI Communication (AB)", tasks: [
        [481,"✅","Verify OnboardingChatWidget.jsx calls a real AI function"],
        [482,"✅","Build clientPortalAIAssistant — persistent AI chat in client portal sidebar"],
        [483,"✅","Build AI-generated go-live checklist — when workflow_stage = 'activation_ready'"],
        [484,"✅","Build proactiveClientAlert function — runs daily per active client"],
        [485,"✅","Add AI Suggest Reply button to AdminInbox.jsx"],
      ]},
      { name: "Real-Time AI Triggers (AC)", tasks: [
        [486,"✅","Create entity automation on WebsiteLead 'create' — immediately invoke automationOrchestrator"],
        [487,"✅","Create entity automation on Order 'create' — fires all 4 actions: initializeInstallOS, sendClientWelcomeEmail, sendAdminPurchaseNotification, advance workflow_stage"],
        [488,"✅","Create entity automation on ClientInstallationOS 'update' — on workflow_stage change"],
        [489,"✅","Create entity automation on Order 'update' for billing_status change to 'past_due'"],
        [490,"✅","Build real-time lead re-scoring trigger — when a Lead receives a new CommunicationEvent"],
      ]},
      { name: "AI Safety Rails (AD)", tasks: [
        [491,"✅","Build SMS compliance filter middleware — before ANY Twilio SMS send"],
        [492,"✅","Build quiet hours enforcement — all outbound SMS must respect 8am-9pm recipient local time"],
        [493,"✅","Build AI contact frequency limiter — no single lead receives more than 3 messages per 24-hour window"],
        [494,"✅","Build AI content approval workflow for Elite clients"],
        [495,"✅","Add PII scrubbing to AgentLog — no full phone numbers or email addresses in plaintext"],
      ]},
      { name: "AI Self-Healing Loop (AE)", tasks: [
        [496,"✅","Build selfHealingMonitor function — runs every 6 hours"],
        [497,"✅","Build AI error classifier — when any function logs to AgentLog, classifyInstallError reads and categorizes"],
        [498,"✅","Build autoResolveInstallError function"],
        [499,"✅","Build AI pipeline version control"],
        [500,"✅","Build /admin/ai-status dashboard page"],
      ]},
    ]
  },
  {
    area: "🤖 AI Sales Rep System (#501–560)",
    subsections: [
      { name: "Already Built (#501–513)", tasks: [
        [501,"✅","Industry routing logic — detect industry from lead fields"],
        [502,"✅","Lead score tiering (HOT/WARM/COLD)"],
        [503,"✅","Business size bucketing (solo/small_medium/enterprise)"],
        [504,"✅","Follow-up urgency routing (2min/10min/30min)"],
        [505,"✅","Lead assigned_to field updated with rep email on dispatch"],
        [506,"✅","Leads entity has assigned_to + assigned_at fields"],
        [507,"✅","generateAIReply backend function deployed"],
        [508,"✅","analyzeReplySentiment deployed"],
        [509,"✅","classifyLeadReply deployed"],
        [510,"✅","sendSMS backend function deployed (Twilio)"],
        [511,"✅","sendEmail backend function deployed (Resend)"],
        [512,"✅","receiveTwilioInboundSms deployed with STOP handling"],
        [513,"✅","ELEVENLABS_API_KEY secret is set"],
      ]},
      { name: "Industry Agent Definitions — Text-Based (AI-A)", tasks: [
        [514,"✅","Create agents/sales_rep_med_spa.json — persona: 'Sarah'"],
        [515,"✅","Create agents/sales_rep_dental.json — persona: 'Marcus'"],
        [516,"✅","Create agents/sales_rep_chiropractic.json — persona: 'Jordan'"],
        [517,"✅","Create agents/sales_rep_hvac.json — persona: 'Tyler'"],
        [518,"✅","Create agents/sales_rep_roofing.json — persona: 'Derek'"],
        [519,"✅","Create agents/sales_rep_contractors.json — persona: 'Alex'"],
        [520,"✅","Grant each agent READ access to Leads entity"],
        [521,"✅","Grant each agent READ access to CommunicationEvent entity"],
        [522,"✅","Grant each agent access to generateAIReply backend function"],
        [523,"✅","Grant each agent access to scheduleDemoBooking backend function"],
      ]},
      { name: "Industry Routing Trigger (AI-B)", tasks: [
        [524,"✅","Build routeLeadToIndustryAgent backend function"],
        [525,"✅","Wire routeLeadToIndustryAgent into onLeadCreated"],
        [526,"✅","Store agent_name on the Lead record — add assigned_agent_name field to Leads entity"],
        [527,"✅","Update dispatchLeadWebhook payload to include agent_name field"],
        [528,"✅","Build getAgentForLead(lead_id) helper"],
      ]},
      { name: "AI Rep — First Outreach Engine (AI-C)", tasks: [
        [529,"✅","Build generateIndustryFirstSMS function"],
        [530,"✅","Wire generateIndustryFirstSMS into sendInstantLeadResponseSms"],
        [531,"✅","Build industry prompt map — 6 system prompts (one per industry)"],
        [532,"✅","Add industry_key context to all AI prompts in generateAIReply"],
        [533,"✅","Add SMS character limit enforcement: if generated SMS > 160 chars, retry once"],
        [534,"✅","Log every AI-generated SMS to CommunicationEvent"],
      ]},
      { name: "Inbound Reply Handling Per Agent (AI-D)", tasks: [
        [535,"✅","Update receiveTwilioInboundSms — after STOP check, look up lead.assigned_agent_name"],
        [536,"✅","Build industryAwareReply function"],
        [537,"✅","Add conversation memory — industryAwareReply loads last 5 CommunicationEvent records"],
        [538,"✅","Build booking intent detector — if AI classifies reply as booking_ready, automatically send booking link"],
        [539,"✅","Build objection handler — if AI detects pricing_concern intent, fire industry-specific pricing objection script"],
        [540,"✅","Build disqualification handler — if AI detects not_interested, stop all sequences"],
      ]},
      { name: "ElevenLabs Voice Agent — HOT Leads (AI-E)", tasks: [
        [541,"✅","Research ElevenLabs Conversational AI API — confirm endpoint, auth, and Twilio integration"],
        [542,"✅","Build createElevenLabsAgent admin function"],
        [543,"✅","Build triggerVoiceCallToLead backend function"],
        [544,"✅","Build Twilio TwiML handler for ElevenLabs"],
        [545,"✅","Wire triggerVoiceCallToLead into HOT lead flow — fires when priority_tier === 'HOT' AND lead_score >= 75"],
        [546,"✅","Add voice call attempt logging to CommunicationEvent"],
        [547,"✅","Handle no-answer — if Twilio call is not answered, fall back to SMS within 60 seconds"],
        [548,"✅","Handle call completion — after ElevenLabs call ends, webhook fires → extract call outcome"],
        [549,"✅","Add quiet hours guard to voice calls — no calls before 8am or after 8pm"],
        [550,"✅","Build admin toggle — AdminSettings.voice_calls_enabled boolean"],
      ]},
      { name: "Admin UI for AI Sales Reps (AI-F)", tasks: [
        [551,"✅","Add 'AI Sales Reps' tab to AdminDashboard — shows each of 6 agents"],
        [552,"✅","Build getAgentPerformanceMetrics backend function"],
        [553,"✅","Build conversation viewer — admin can click any lead and see full AI conversation thread"],
        [554,"✅","Add 'Override Agent' dropdown in admin lead detail"],
        [555,"✅","Add 'Trigger Voice Call Now' button in admin lead detail (HOT leads only)"],
        [556,"✅","Add 'AI Reply Sent' badge on lead list rows"],
      ]},
      { name: "Entity + Infrastructure (AI-G)", tasks: [
        [557,"✅","Add assigned_agent_name field (string) to Leads entity"],
        [558,"✅","Add voice_call_attempted + voice_call_outcome + voice_call_followup_sent to Leads entity"],
        [559,"✅","Add voice_calls_enabled + elevenlabs_agent_ids (object) fields to AdminSettings entity"],
        [560,"✅","Add channel: 'voice' to CommunicationEvent.channel enum"],
      ]},
    ]
  },
  {
    area: "📊 Task DB Extension — Pipeline / Revenue / Reliability (#445–544 DB Batch)",
    subsections: [
      { name: "Pipeline & Activation (Batch 1: 445–469)", tasks: [
        ["DB-445","✅","Build activateAllServices — orchestrates configureService x N by tier"],
        ["DB-446","✅","Wire stripePaymentWebhook → activateAllServices post-payment"],
        ["DB-447","✅","Fix installPipeline — all actions return Invalid action"],
        ["DB-448","✅","Unify service_key naming across both apps"],
        ["DB-449","✅","E2E test real order 69f13b948861e8a032d10f2e"],
        ["DB-450","✅","/admin/pipeline-status page"],
        ["DB-451","✅","New paid order → Telegram alert"],
        ["DB-452","✅","/client-intake credential intake form"],
        ["DB-453","✅","Client portal: services tab"],
        ["DB-454","✅","Client portal: analytics tab"],
        ["DB-455","✅","Client portal: order status tab"],
        ["DB-456","✅","Client portal: billing tab (v1)"],
        ["DB-457","✅","/demo page built"],
        ["DB-458","✅","Mobile audit at 375px viewport"],
        ["DB-459","⏳","Meta descriptions + OG tags on all public pages"],
        ["DB-460","✅","/case-studies page (3 placeholder cards)"],
        ["DB-461","⏳","Live chat widget (Tawk.to)"],
        ["DB-462","✅","Google Analytics 4 setup"],
        ["DB-463","✅","Revenue dashboard: MRR trend chart"],
        ["DB-464","✅","Revenue dashboard: churn rate tracker"],
        ["DB-465","⏳","Revenue dashboard: LTV per client"],
        ["DB-466","✅","sendGoLiveNotification function"],
        ["DB-467","✅","Admin order management page"],
        ["DB-468","✅","Stripe webhook signature verification"],
        ["DB-469","✅","runFullPipelineTest QA function"],
      ]},
      { name: "Revenue + Security + Compliance (Batch 2: 470–494)", tasks: [
        ["DB-470","✅","salesCatalog.js price audit — kill all $97/$297 wrong values"],
        ["DB-471","✅","Verify sk_live_ in createCheckoutSession + stripePaymentWebhook"],
        ["DB-472","✅","TCPA SMS consent on ALL public lead forms + SMS templates"],
        ["DB-473","✅","Order create automation: chain initializeInstallOS + welcome email"],
        ["DB-474","✅","Wire stripeWebhookOrders → initializeInstallOS immediately"],
        ["DB-475","✅","InstallChecklistPanel: SVG progress ring, per-service bars"],
        ["DB-476","✅","ClientPortal Billing Tab + global PaymentFailedBanner"],
        ["DB-477","✅","Twilio sig validation + simulateMissedCall admin guard"],
        ["DB-478","✅","Stripe webhook idempotency (stripe_event_id dedup)"],
        ["DB-479b","✅","Scan frontend for sk_live_ secret key exposure"],
        ["DB-480","✅","Admin leads bulk status update toolbar"],
        ["DB-481","✅","AdminSettings: Test Connection buttons (Twilio + Resend)"],
        ["DB-482","✅","Admin lead detail: Send Manual SMS panel"],
        ["DB-483","✅","generateClientWebsite function (Starter/Growth/Elite spec)"],
        ["DB-484","✅","Admin: warning badge on orders paid 2+ days no install"],
        ["DB-485","✅","Admin: one-click Initialize Install OS button"],
        ["DB-486","✅","ClientPortal: What's New changelog tab"],
        ["DB-487","✅","Admin: conversion funnel chart"],
        ["DB-488","✅","Admin: Demo Bookings tab"],
        ["DB-489","✅","AdminLeads: lead_score column (color-coded, sortable)"],
        ["DB-490","✅","Admin: Failed Jobs section + Retry button"],
        ["DB-491","✅","processAutomationJobs: 3x retry exponential backoff"],
        ["DB-492","✅","All Resend calls: retry on 429/5xx"],
        ["DB-493","✅","receiveTwilioInboundSms: STOP → sms_opted_out + pause all sequences"],
        ["DB-494","✅","Full E2E purchase test on live domain (must pass before June 2)"],
      ]},
      { name: "Reliability + Lead Pipeline + Admin UX (Batch 3: 495–519)", tasks: [
        ["DB-495","✅","processNurtureCampaigns: skip if messaged in last 24h"],
        ["DB-496","✅","processAutomationJobs: 3x retry with backoff"],
        ["DB-497","✅","_shared/retryFetch.ts: retry on 429/5xx sitewide"],
        ["DB-498","✅","scheduleFollowUpSMS: Phoenix timezone business hours gate"],
        ["DB-499","✅","_shared/smsHelpers.ts: appendOptOut() — TCPA sitewide"],
        ["DB-500","✅","processMissedCallFollowUps: idempotent step increment"],
        ["DB-501","✅","sendOrderConfirmationEmail: human-readable service labels"],
        ["DB-502","✅","sendClientWelcomeEmail: fix /client-portal link, Reply-To header"],
        ["DB-503","⏳","receiveResendWebhook: bounce/open/click handlers"],
        ["DB-504","✅","submitLeadCapture: verify exactly 60-min dedup window"],
        ["DB-505","✅","validateLeadQuality: disposable email domain blocklist"],
        ["DB-506","⏳","deduplicateLeads: phone normalization + phone hash dedup"],
        ["DB-507","✅","Order: set client_id by User lookup post-payment"],
        ["DB-508","✅","Create ClientProject on every paid order"],
        ["DB-509","✅","CommunicationEvent: write on every SMS/email attempt"],
        ["DB-510","✅","Admin leads: Lead.subscribe() real-time listener"],
        ["DB-511","✅","Admin: CSS-only conversion funnel chart"],
        ["DB-512","✅","AdminLeads: lead_score column (color pill, sortable)"],
        ["DB-513","✅","AdminOnboarding: pipeline_status badge on client cards"],
        ["DB-514","✅","AutomationInstallChecklist: progress bar X/N steps"],
        ["DB-515","✅","Admin: one-click Initialize Install OS button"],
        ["DB-516","✅","Admin: ⚠️ badge on orders paid 2+ days no install"],
        ["DB-517","✅","Stripe: invoice.paid + invoice.payment_failed handlers"],
        ["DB-518","⏳","createCheckoutSession: capacity limit gate"],
        ["DB-519","✅","getBookedDemoSlots: add date filter to query"],
      ]},
      { name: "Cleanup + QA + Launch Readiness (Batch 4: 520–544)", tasks: [
        ["DB-520","✅","autoCloseStaleLeads function (30-day no-contact)"],
        ["DB-521","✅","Daily 2am MST scheduler for autoCloseStaleLeads"],
        ["DB-522","✅","exportLeadsCSV function with filters + CSV response"],
        ["DB-523","✅","exportCommunicationLogs function"],
        ["DB-524","✅","Admin: Export CSV + Export Logs buttons"],
        ["DB-525","✅","autoEndToEndTest: extend to full lead→order→activate flow"],
        ["DB-526","⏳","monthlyClientReport: email personalized report to each client"],
        ["DB-527","✅","requestSubscriptionChange: proration_behavior=create_prorations"],
        ["DB-528","✅","cancelSubscription: cancel_at_period_end, notify client + Nolan"],
        ["DB-529","⏳","pauseSubscription + resumeSubscription functions"],
        ["DB-530","✅","Admin: Website Leads tab with filters"],
        ["DB-531","✅","Admin: Demo Bookings tab (complete/no-show/reschedule)"],
        ["DB-532","✅","Admin: AuditLog viewer tab with resolve button"],
        ["DB-533","✅","ClientPortal Billing: Download Invoice PDF"],
        ["DB-534","⏳","QuickStartWizard: fix broken help links"],
        ["DB-535","✅","ClientDashboard: amber paused banner on cadence_paused=true"],
        ["DB-536","✅","runLaunchReadinessCheck: 10-point system check"],
        ["DB-537","✅","runFullLeadFlowTest: lead→SMS→missed call→follow-up→cleanup"],
        ["DB-538","✅","Admin: Resend Welcome Email button in client detail"],
        ["DB-539","✅","Admin: Enroll in Nurture button in lead detail"],
        ["DB-540","✅","Admin: mask phone numbers for non-super-admin"],
        ["DB-541","✅","_shared/response.ts: okJson() + errJson() helpers sitewide"],
        ["DB-542","✅","All functions: correct HTTP status codes (400/404/500)"],
        ["DB-543","✅","enrichLead: 10-second timeout on external API calls"],
        ["DB-544","✅","scoreLeadIntelligence: skip if confidence < 0.6"],
      ]},
    ]
  },
  {
    area: "📋 Pre-Launch 100 Tasks (PL-1 – PL-100)",
    subsections: [
      { name: "Frontend — Homepage & Landing (PL-1–20)", tasks: [
        ["PL-1","✅","Store hero h1 color invisible on white bg — Change to #1b140d"],
        ["PL-2","✅","Store hero subtitle text barely visible — Change to rgba(27,20,13,0.75)"],
        ["PL-3","✅","Store search debounce broken — uses raw setSearch"],
        ["PL-4","✅","Social Proof Ticker uses fake/mocked purchase data — Replace with real Order entity data"],
        ["PL-5","⏳","Testimonials section has no real client photos — Add real or AI-generated avatars"],
        ["PL-6","✅","Homepage missing Testimonials section entirely"],
        ["PL-7","✅","No 'About Us' / founder story section — Add founder section before FAQ"],
        ["PL-8","⏳","Pricing links to Stripe but in test mode — Switch to live Stripe keys before launch"],
        ["PL-9","✅","No cookie consent / GDPR banner — Wire CookieConsent into pages/Home.jsx"],
        ["PL-10","✅","No exit-intent popup — Wire ExitIntentPopup into pages/Home.jsx"],
        ["PL-11","✅","ChatBubble AI has no rate limiting on frontend — Debounce/disable send button for 2s"],
        ["PL-12","✅","Mobile: Navbar height 100px too tall — Reduce to 72px on mobile"],
        ["PL-13","✅","Store page background conflicts on scroll — Set consistent white/light background"],
        ["PL-14","⏳","BeforeAfter component — verify renders on touch devices"],
        ["PL-15","⏳","InteractiveJourneyMap — verify all steps clickable on mobile"],
        ["PL-16","✅","FAQ search filter loses focus on mobile — Add autoFocus=false, test iOS Safari"],
        ["PL-17","✅","IntegrationPartners logos not loading — Add onerror fallback to each img"],
        ["PL-18","✅","No noscript fallback for JS-disabled users — Add noscript tag to index.html"],
        ["PL-19","⏳","All CTA buttons say 'Book a Demo' — no variety"],
        ["PL-20","✅","LeadLeakage stat numbers are hardcoded — Add CountUp animation on scroll entry"],
      ]},
      { name: "Store & Product Checkout (PL-21–35)", tasks: [
        ["PL-21","⏳","Stripe Checkout in test mode — Switch to live keys before launch"],
        ["PL-22","✅","Order success page shows generic message — Confirm sessionStorage order data reads correctly"],
        ["PL-23","✅","Cart items persist oddly across sessions — Verify sessionStorage clears correctly"],
        ["PL-24","✅","No upsell at checkout — Suggest 1 complementary add-on in CartSidebar"],
        ["PL-25","✅","Cart shows '$0 setup' — confusing — Display 'No setup fee' if setup_fee === 0"],
        ["PL-26","⏳","No email confirmation after checkout — Trigger sendLeadConfirmationEmail"],
        ["PL-27","✅","No admin notification on new purchase — Queue admin purchase notification"],
        ["PL-28","✅","Stripe webhook not verified in prod — Verify STRIPE_WEBHOOK_SECRET + constructEventAsync"],
        ["PL-29","✅","ProductCard 'Popular' badge overlaps on mobile — Position absolute"],
        ["PL-30","✅","ServiceDetailModal CTA has duplicate style prop — Merge both style objects into one"],
        ["PL-31","✅","CartSidebar 'loading' hangs indefinitely on failure — Add 12s timeout fallback"],
        ["PL-32","✅","createCheckoutSession missing base44_app_id metadata"],
        ["PL-33","✅","No quantity selector — document '1 license' clearly"],
        ["PL-34","✅","Bundle savings toast fires every add — Add sessionStorage flag to show once per session"],
        ["PL-35","✅","No refund/cancel policy before checkout — Add one-liner below Stripe button"],
      ]},
      { name: "Auth & User Accounts (PL-36–45)", tasks: [
        ["PL-36","✅","Login modal — verify handles wrong credentials — Test bad login shows error"],
        ["PL-37","✅","No 'Forgot Password' flow — Add link in PortalLoginModal"],
        ["PL-38","✅","ClientPortal unauthenticated — no redirect message — Confirm spinner shows before redirect"],
        ["PL-39","⏳","No onboarding flow for newly registered clients — Detect onboarding_wizard_completed=false"],
        ["PL-40","⏳","Admin panel has no 2FA or IP restriction — Add secondary password modal or domain restriction"],
        ["PL-41","⏳","User invite shows no confirmation — Toast 'Invite sent to [email]' after inviteUser()"],
        ["PL-42","⏳","No session timeout — Implement 24hr auto-logout warning"],
        ["PL-43","✅","Client portal shows no data for new unlinked users — Friendly empty state shown"],
        ["PL-44","⏳","/client-dashboard and /client-portal both exist — Consolidate to /portal, redirect other"],
        ["PL-45","⏳","No email verification before accessing portal — Add banner for unverified users"],
      ]},
      { name: "Admin Panel & Dashboard (PL-46–60)", tasks: [
        ["PL-46","✅","Admin panel has no loading skeleton — Add Suspense fallback with AdminLoadingSkeleton"],
        ["PL-47","⏳","AdminDashboard shows all leads regardless of role — Filter by assigned_to === user.email"],
        ["PL-48","✅","Install Queue panel has no Refresh button — Add refresh icon button"],
        ["PL-49","⏳","No audit log for admin actions — Log key actions to CommunicationEvent entity"],
        ["PL-50","⏳","Admin can delete orders with no confirmation — Add DeleteConfirmModal before destructive ops"],
        ["PL-51","✅","AutomationInstallChecklist steps have no timestamps — Add completed_at field + display in UI"],
        ["PL-52","✅","Admin onboarding form has no phone validation — Add US phone regex before form submit"],
        ["PL-53","✅","No search in Admin Leads table — Add search bar filtering by name/email/phone"],
        ["PL-54","✅","Leads table has no CSV export — Add Export CSV button"],
        ["PL-55","⏳","CommunicationEvent logs not paginated — Add skip/limit pagination to CommunicationLogsPanel"],
        ["PL-56","⏳","Admin settings panel has no Save confirmation — Add success toast after updateAdminSettings"],
        ["PL-57","✅","InstallOrderWorkspace has no 'Live' visual indicator — Show green 'Live' badge"],
        ["PL-58","✅","No admin notification when client completes onboarding — Entity automation on OnboardingSubmission create"],
        ["PL-59","✅","Revenue dashboard shows $0 — Stripe data not flowing"],
        ["PL-60","✅","No way to resend welcome email from admin — 'Resend Welcome Email' button already exists"],
      ]},
      { name: "Emails & Communications (PL-61–70)", tasks: [
        ["PL-61","✅","RESEND_FROM_EMAIL set but 'From Name' not configured — sendDemoConfirmationEmail already uses safeResendFrom()"],
        ["PL-62","✅","Demo confirmation email has unresolved {{business_name}} — verified no unresolved template vars"],
        ["PL-63","✅","No SMS confirmation sent to client after checkout — Added Twilio SMS send to customer_phone"],
        ["PL-64","✅","Twilio from number hardcoded in some functions — sendSMS.js already uses Deno.env.get('TWILIO_PHONE_NUMBER')"],
        ["PL-65","✅","No STOP unsubscribe in SMS sequences — 'Reply STOP' appended + STOP handling"],
        ["PL-66","✅","Email templates have no plain-text fallback — Added text: field (HTML-stripped)"],
        ["PL-67","✅","Nurture emails don't respect client timezone — Added isWithinBusinessHours() gate"],
        ["PL-68","✅","No email preview for admin before campaigns — AdminSettingsPanel already has 'Preview template' buttons"],
        ["PL-69","✅","AdminSettings.lead_notification_email may be empty — Fallback to ADMIN_EMAIL env var"],
        ["PL-70","✅","Drip campaign doesn't check if lead already booked — Check lead.status === 'Booked'"],
      ]},
      { name: "Backend Functions & Automations (PL-71–80)", tasks: [
        ["PL-71","✅","onLeadCreated may fire multiple times for duplicates — Dedup check via dedup_key before dispatching"],
        ["PL-72","⏳","processWebsiteLeadFollowUps — verify it's running — Check automation list, confirm cron is active"],
        ["PL-73","✅","scheduleFollowUpSMS sends at any hour — Add business hours check before sending"],
        ["PL-74","✅","installPipeline has no timeout handling — Already has INSTALL_PIPELINE_TIMEOUT_MS = 30_000"],
        ["PL-75","⏳","discoverLeads Google Maps API key not set — Set key as secret, add error handling"],
        ["PL-76","✅","autoEndToEndTest has no admin guard — Admin role check added"],
        ["PL-77","✅","getClientPortalContext doesn't handle missing Order — Returns structured empty state"],
        ["PL-78","✅","No rate limiting on submitLeadCapture — Use rateLimit utility - 3/IP/hour"],
        ["PL-79","⏳","chatBubbleAI has no content filtering — Add prompt-injection guard + sanitize input"],
        ["PL-80","⏳","webhookLeadCapture has no signature verification — Validate X-Webhook-Secret header"],
      ]},
      { name: "SEO & Performance (PL-81–90)", tasks: [
        ["PL-81","✅","robots.txt missing admin/portal blocks — Updated with Disallow rules"],
        ["PL-82","✅","sitemap.xml missing industry pages — All 6 industry pages added"],
        ["PL-83","⏳","OG image not set — Add og:image meta to index.html"],
        ["PL-84","✅","Page titles generic on industry sub-pages — Set unique title per industry"],
        ["PL-85","✅","No canonical tag on redirect pages — Add canonical URLs in setPageMetadata()"],
        ["PL-86","⏳","Images missing width/height — causes CLS — Add explicit width/height to all img tags"],
        ["PL-87","⏳","Google Analytics not installed — Add GA4 tracking in index.html or main.jsx"],
        ["PL-88","⏳","No structured data on industry pages — Add LocalBusiness JSON-LD schema"],
        ["PL-89","✅","Font loading via @import slows FCP — Move Google Fonts link to index.html head with preload"],
        ["PL-90","⏳","Lazy-loaded sections have no min-height — Add min-height to Suspense skeletons"],
      ]},
      { name: "Legal & Compliance (PL-91–95)", tasks: [
        ["PL-91","⏳","Privacy Policy may not cover SMS/AI data usage — Legal review for Twilio SMS + AI processing coverage"],
        ["PL-92","⏳","Terms don't mention subscription auto-renewal — Add recurring billing / cancellation section"],
        ["PL-93","⏳","No consent checkbox on lead capture forms — Add SMS opt-in checkbox with Privacy Policy link (TCPA)"],
        ["PL-94","✅","Contact form has no privacy disclaimer — Privacy link added"],
        ["PL-95","⏳","No accessibility audit done — Run axe-core / Lighthouse — fix WCAG AA violations"],
      ]},
      { name: "Deployment & Ops (PL-96–100)", tasks: [
        ["PL-96","⏳","No staging environment — Use Base44 Test Database for all pre-launch testing"],
        ["PL-97","⏳","APP_URL secret may be set to localhost — Verify APP_URL = production domain"],
        ["PL-98","⏳","No uptime monitoring — Set up UptimeRobot / Better Stack on healthCheck endpoint"],
        ["PL-99","⏳","No backup strategy for entity data — Document Base44 backups + monthly export to Google Sheets"],
        ["PL-100","⏳","No post-launch rollback plan — Create go-live runbook"],
      ]},
    ]
  },
  {
    area: "⚙️ Automation Completion Checklist (AC-1 – AC-33)",
    subsections: [
      { name: "Webhook & Integration Setup — CRITICAL PATH (AC-1–5)", tasks: [
        ["AC-1","⏳","Configure Twilio Webhook for Inbound SMS Replies — set URL in Twilio console"],
        ["AC-2","⏳","Configure Twilio Webhook for Inbound Calls — set URL"],
        ["AC-3","⏳","Test Live SMS Reply Capture — send SMS to Twilio number, verify WebsiteLead.reply_status='responded'"],
        ["AC-4","⏳","Test Live Missed Call Recovery — simulate missed call, verify 2min SMS → 10min email → 1hr SMS → 24hr email"],
        ["AC-5","⏳","Validate Resend Email Delivery + Bounce Handling — send test emails, check Resend logs"],
      ]},
      { name: "Communication Logs & Troubleshooting (AC-6–9)", tasks: [
        ["AC-6","✅","Test CommunicationLogsPanel with failed webhook events — filter by 'failed'"],
        ["AC-7","✅","Test manual lead reassignment from unmatched SMS modal"],
        ["AC-8","✅","Add filtering for email_sent/email_failed events in CommunicationLogsPanel"],
        ["AC-9","✅","Add Export/Download CSV functionality for communication logs"],
      ]},
      { name: "Website Lead Automation (AC-10–14)", tasks: [
        ["AC-10","✅","Test WebsiteLeadsDashboard with 50+ test leads — pagination, filtering, sorting"],
        ["AC-11","✅","Verify immediate SMS + email sends on form submission within 60 sec"],
        ["AC-12","✅","Verify 3-step follow-up sequence timing: 10min SMS, 1hr email, 24hr SMS"],
        ["AC-13","✅","Test automation stop when lead replies by SMS"],
        ["AC-14","✅","Test automation stop when lead books appointment"],
      ]},
      { name: "Missed Call Recovery (AC-15–18)", tasks: [
        ["AC-15","⏳","End-to-end test: missed call → instant SMS → full 4-step follow-up sequence"],
        ["AC-16","✅","Verify old lead reactivation campaign logic"],
        ["AC-17","✅","Test closed/booked lead protection — no reactivation"],
        ["AC-18","✅","Verify duplicate call handling idempotency (same CallSid processed once)"],
      ]},
      { name: "Admin Enhancements (AC-19–21)", tasks: [
        ["AC-19","✅","Add unread webhook error badge to Communication Logs nav item"],
        ["AC-20","✅","Build Automation Health Check Dashboard — success/fail rates per automation type"],
        ["AC-21","✅","Add drill-down analytics: SMS delivery rate, reply rate by lead source"],
      ]},
      { name: "Client Portal UX (AC-22–25)", tasks: [
        ["AC-22","✅","Build Lead Dashboard Widget showing reply status breakdown (pie/bar chart)"],
        ["AC-23","✅","Build live notification toast when inbound SMS/call received"],
        ["AC-24","✅","Add 'Pause Automation' toggle per lead in client portal"],
        ["AC-25","✅","Build Custom Message Templates UI for clients (5 templates + variable insertion)"],
      ]},
      { name: "Backend Reliability (AC-26–28)", tasks: [
        ["AC-26","✅","Add retry logic to failed SMS/email sends (exponential backoff: 1min, 5min, 30min)"],
        ["AC-27","✅","Add dead-letter queue for failed webhook processing"],
        ["AC-28","✅","Build health check endpoint returning last_run_at, success/fail counts per automation"],
      ]},
      { name: "Testing & QA (AC-29–30)", tasks: [
        ["AC-29","⏳","Load test: simulate 1000 SMS replies in 1 minute — p95 < 2s"],
        ["AC-30","✅","Security audit: validate all webhook Twilio signatures + admin auth guards"],
      ]},
      { name: "Monitoring & Documentation (AC-31–33)", tasks: [
        ["AC-31","✅","Set up automated alerts for webhook failures > 5% in 10min window"],
        ["AC-32","✅","Build metrics dashboard: SMS sent/delivered/failed rates by day (30-day trend chart)"],
        ["AC-33","✅","Create comprehensive Admin Runbook + Troubleshooting Guide (ADMIN_RUNBOOK.md)"],
      ]},
    ]
  },
  {
    area: "📝 Form Infrastructure + New UX Tasks",
    subsections: [
      { name: "Essential Missing Forms", tasks: [
        ["FORM-01","✅","Build Industry-Specific Qualification Form — embedded on all 9 industry pages. Fully built with industry-specific volume questions, real-time phone formatting, email/phone checkmark validation, consent gate, and success state."],
        ["FORM-02","⏳","Build Automated Follow-up Opt-out / Preference Management Form — TCPA/CTIA compliance shield. Updates Leads.requested_channels, sets sms_opted_out or email_unsubscribed flags."],
        ["FORM-03","⏳","Build Exit/Cancellation Survey Form — shown inside CancelSubscriptionButton BEFORE the Stripe portal redirect. Captures reason, free-text details, NPS-style rating (1–5)."],
        ["FORM-04","⏳","Standardize all 12 platform forms with FormInput auto-formatting, checkmark success indicators, and real-time validation."],
      ]},
      { name: "New Client-Facing UX Tasks", tasks: [
        ["UX-01","✅","Apply new progress tracker design to client portal — ClientPortal already shows SetupProgressHub on 'progress' tab with SystemProgressTracker design. ✓ Verified"],
        ["UX-02","✅","Build three essential qualification intake forms — IndustryQualificationForm fully built on all 9 industry pages with industry-specific volume questions and problem prompts."],
        ["UX-03","✅","Create immersive success gallery for each industry page — IndustrySuccessGallery component created with before/after story cards, ROI benchmarks section, and booking CTA."],
      ]},
    ]
  }
];

// ─── FLATTEN ALL TASKS FOR STATS ──────────────────────────────────────────────
const allTasks = SECTIONS.flatMap(sec => sec.subsections.flatMap(sub => sub.tasks));
const total = allTasks.length;
const done = allTasks.filter(t => s(t[1]) === S.DONE).length;
const inprogress = allTasks.filter(t => s(t[1]) === S.INPROGRESS).length;
const pending = allTasks.filter(t => s(t[1]) === S.PENDING).length;
const blocked = allTasks.filter(t => s(t[1]) === S.BLOCKED).length;

// ─── TASK ROW ─────────────────────────────────────────────────────────────────
function TaskRow({ id, rawStatus, desc }) {
  const st = s(rawStatus);
  const cfg = statusConfig[st];
  const Icon = cfg.icon;
  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0">
      <Icon style={{ color: cfg.color, flexShrink: 0, marginTop: 2 }} className="w-4 h-4" />
      <div className="flex items-baseline gap-2 min-w-0 flex-1">
        <span className="text-xs font-bold text-muted-foreground shrink-0 w-14 text-right">{id}</span>
        <span className="text-sm text-foreground leading-relaxed">{desc}</span>
      </div>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
        style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

// ─── SUBSECTION ───────────────────────────────────────────────────────────────
function Subsection({ name, tasks, filter, search }) {
  const filtered = tasks.filter(([id, rawStatus, desc]) => {
    if (filter !== "all" && s(rawStatus) !== filter) return false;
    if (search && !String(id).toLowerCase().includes(search) && !desc.toLowerCase().includes(search)) return false;
    return true;
  });
  if (filtered.length === 0) return null;

  const doneCount = filtered.filter(([,st]) => s(st) === S.DONE).length;
  const pct = Math.round((doneCount / filtered.length) * 100);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{name}</h4>
        <span className="text-xs text-muted-foreground">{doneCount}/{filtered.length} · {pct}%</span>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        {filtered.map(([id, rawStatus, desc]) => (
          <TaskRow key={id} id={id} rawStatus={rawStatus} desc={desc} />
        ))}
      </div>
    </div>
  );
}

// ─── AREA SECTION ─────────────────────────────────────────────────────────────
function AreaSection({ area, subsections, filter, search }) {
  const [collapsed, setCollapsed] = useState(false);
  const allTasksInArea = subsections.flatMap(s => s.tasks);
  const visibleCount = allTasksInArea.filter(([id, rawStatus, desc]) => {
    if (filter !== "all" && s(rawStatus) !== filter) return false;
    if (search && !String(id).toLowerCase().includes(search) && !desc.toLowerCase().includes(search)) return false;
    return true;
  }).length;
  if (visibleCount === 0) return null;

  const doneCount = allTasksInArea.filter(([,st]) => s(st) === S.DONE).length;
  const pct = Math.round((doneCount / allTasksInArea.length) * 100);

  return (
    <div className="mb-8">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between gap-4 mb-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors text-left"
      >
        <h3 className="font-display font-bold text-foreground text-base md:text-lg">{area}</h3>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-bold text-green-600">{doneCount}</span>
            <span>/</span>
            <span>{allTasksInArea.length}</span>
            <span className="font-semibold ml-1" style={{ color: pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626" }}>
              {pct}%
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="w-24 h-2 rounded-full bg-muted hidden sm:block overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626"
              }}
            />
          </div>
          {collapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {!collapsed && (
        <div className="pl-2">
          {subsections.map(sub => (
            <Subsection key={sub.name} {...sub} filter={filter} search={search} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TaskStatusDashboard() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const pctComplete = Math.round((done / total) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm px-4 md:px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">
                ClientSurge Task Status Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                All {total} tasks · Last updated June 22, 2026
              </p>
            </div>
            <a href="/admin" className="text-xs text-primary hover:underline shrink-0">← Admin</a>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {[
              { label: "Total Tasks", value: total, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
              { label: "✅ Complete", value: done, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
              { label: "🔵 In Progress", value: inprogress, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
              { label: "🟡 Pending", value: pending, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
              { label: "🔴 Blocked", value: blocked, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
            ].map(stat => (
              <div key={stat.label} className="rounded-lg p-3 text-center" style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
                <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: stat.color }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Overall Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Overall Completion</span>
              <span className="font-bold" style={{ color: pctComplete >= 80 ? "#16a34a" : "#d97706" }}>{pctComplete}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pctComplete}%`,
                  background: pctComplete >= 80 ? "linear-gradient(90deg, #16a34a, #22c55e)" : "linear-gradient(90deg, #d97706, #f59e0b)"
                }}
              />
            </div>
          </div>

          {/* Filters + Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tasks by ID or description..."
                value={search}
                onChange={e => setSearch(e.target.value.toLowerCase())}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "all", label: "All" },
                { key: "done", label: "✅ Complete" },
                { key: "inprogress", label: "🔵 In Progress" },
                { key: "pending", label: "🟡 Pending" },
                { key: "blocked", label: "🔴 Blocked" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                  style={{
                    background: filter === f.key ? "#00AEEF" : "#fff",
                    color: filter === f.key ? "#fff" : "#64748b",
                    borderColor: filter === f.key ? "#00AEEF" : "#e2e8f0",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {SECTIONS.map(sec => (
          <AreaSection key={sec.area} {...sec} filter={filter} search={search} />
        ))}

        <div className="text-center py-8 text-sm text-muted-foreground border-t border-border mt-8">
          Total: {total} tasks · {done} complete · {pending + inprogress} in-flight · {blocked} blocked · {pctComplete}% done
        </div>
      </div>
    </div>
  );
}