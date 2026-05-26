# 200 Bug / Issue / Duplicate / Contradiction Fix Log

## BATCH 1 (1–50): Admin Nav Duplication, Dead Code, Dead Routes, Logic Errors

### Duplicate NAV_GROUPS definitions
1. `AdminDashboard.jsx` and `AdminShell` both define identical `NAV_GROUPS` arrays — fully duplicated
2. Both files duplicate the unread-count polling logic (`loadUnread`) every 30 s — identical code
3. Both files duplicate the `loggingOut` state + logout handler
4. Both files render identical sidebar markup (logo, search, nav, user block)
5. Both files define the same `handleLogout` using `base44.auth.logout("/")`
6. AdminDashboard duplicates logout overlay (`fixed inset-0 z-[9998]`) also present in AdminShell

### Dead / unreachable validation code
7. `scheduleDemoBooking` line 74: dead code `if (false && !payload.scheduled_date)` — suppressed duplicate check, should be removed
8. `scheduleDemoBooking` line 268: `optimisticLockSlot` called **twice** in the same request (lines 228 and 268) — race condition/double check

### DemoBookingModal issues
9. `DemoBookingModal` has `DEMO_VIDEO_URL = "...dQw4w9WgXcQ"` — rickroll placeholder still in production
10. `DemoBookingModal` iframe has `height="700"` but is `position: absolute` inside a 16:9 padding-box — height attribute is meaningless/confusing
11. `DemoBookingModal` `scrolling="yes"` is deprecated HTML attribute

### AdminDashboard OverviewDashboard
12. `OverviewDashboard` calls `<SessionTimeoutModal onLogout={handleLogout} .../>` but `handleLogout` is defined in the **outer** `AdminDashboard` scope — it is not passed as a prop, causing a ReferenceError if the modal fires

### AdminShell NAV missing items compared to AdminDashboard
13. AdminShell nav is missing: `demo-bookings`, `failed-jobs`, `ai-sales-reps`, `audit-log`, `sniper`, `ai-sales-cmd`, `performance-wars`, `social-engine`, `website-copy` — users navigating from sub-pages can't reach those tabs
14. AdminShell `isActive` logic: items with `path === "/admin"` and no tab never match correctly for `activeId`

### Route contradictions
15. App.jsx maps `/book-demo` → `<Navigate to="/book" replace>` AND `/book` → `<Book />` — two routes, but `Navbar` and other components may link to `/book-demo` or `/book` inconsistently
16. App.jsx has `/pricing`, `/faq`, `/our-system`, `/testimonials` all going to `SectionRedirect` — these call `setPageMetadata` with the homepage title on every redirect, not the correct section title
17. App.jsx has `caseSensitive` on `/admin/AIStatusDashboard` redirect but no other routes — inconsistent casing strategy
18. Legacy redirect from `/ClientPortal` → `/client-portal` is correct but `pages/Login` links directly to `/contact` using `<a href="/contact">` not `<Link to>` — bypasses React Router
19. `SectionRedirect` calls `setPageMetadata` with canonicalPath `"/"` even for `/pricing`, `/faq` etc — all section redirects share the same canonical URL

### AdminDashboardCards issues
20. `AdminQuickActions` calls `/api/functions/markClientLive` — this function doesn't exist in the backend (not in existing functions list)
21. `AdminQuickActions` calls `/api/functions/sendDripEmail` — function doesn't exist (should be `sendEmailDripStep`)
22. `AdminQuickActions` uses raw `fetch("/api/functions/...")` instead of `base44.functions.invoke(...)` — won't work correctly on Base44 platform
23. `ChurnRiskPanel` references `o.churn_risk_score` but the `Order` entity schema has no such field
24. `InstallStatusTable` references fields `instant_response_built`, `missed_call_textback`, `followup_sequence_built`, `went_live` on the `OnboardingClient` entity — none of these exist in the entity schema

### Index.html / SEO
25. `lib/seo.js` sets `twitter:card` with `ensureMeta("property", ...)` but Twitter uses `name` attribute not `property` for `twitter:*` tags
26. `lib/seo.js` sets `twitter:url` with `ensureMeta("property", ...)` same problem — should be `name`

### CSS / styling issues
27. `index.css` has `button, a, [role="button"] { min-height: 44px; min-width: 44px; }` — this breaks icon-only inline links and nav anchors globally, the exception `.text-link` etc is too narrow
28. `index.css` duplicates `button:focus-visible` / `a:focus-visible` focus ring rules **three times** (lines ~41, 61, 74)
29. `index.css` `.sticky, [class*="sticky"]` sets `position: -webkit-sticky !important; position: sticky !important` but also duplicates this again at line ~316 in "ROUND 2" section

### Homepage
30. `HomepageConversionContent` lists `"plumbing"` in the industries array but there's no `/plumbing` page route and it's not in `INDUSTRY_ROUTE_SLUGS` in App.jsx — broken industry tag
31. `SixAutomationSystems` uses number badge `0{index + 1}` — produces `07` when there are more than 9 items (will break if expanded)
32. `AutomationShowcase` component in `components/landing/AutomationShowcase` defines its own 6-automation list **separately** from `lib/sixAutomations.js` — duplicated data, will drift
33. `AutomationShowcase` hardcodes `BRAND_COLOR = "#00D4FF"` but the rest of the site uses `#00AEEF` as brand blue — color inconsistency

### Pricing
34. `Pricing` component uses `STRIPE_LINKS[plan.packageKey]` — if that key is missing it falls back to `/store`, silently doing nothing for Stripe checkout
35. Pricing card shows `plan.badge` text twice: once in the floating badge and once inline in the card body (lines 434–436 AND 413–427)
36. The `isRecommended` text is also shown twice: in the badge float AND inline in the card body (lines 437–441)

### lib/sixAutomations.js
37. `SIX_AUTOMATIONS[0].id = "missed-call-text-back"` but `slug = "ai-voice-agent-missed-call-recovery"` and `routePath = "/missed-call-text-back"` — id, slug, and routePath are all different naming conventions, confusing

### DemoBookingModal
38. `DemoBookingModal` is named "modal" but actually shows a video. The `DemoBookingContext` refers to a booking flow — naming mismatch: `openDemoBooking` opens a video, not a booking form

### Components/landing
39. `BeforeAfter` component imports `useDemoBooking` but that context may not be available in all render paths outside `DemoBookingProvider`
40. `BeforeAfter` and `FinalCTA` both render almost identical CTA buttons calling `demoBooking?.openDemoBooking?.()` — duplicated CTA logic

### Functions: dead imports
41. `scheduleDemoBooking` imports from `"../shared/demoBookingGuard.ts"` using a relative path with `.ts` extension — Deno backend functions should not use `.ts` extension on local relative imports (Deno resolves by content type, but this is error-prone)

### Admin role guard redundancy
42. `AdminOnboarding` has its own manual `user.role !== "admin"` guard even though the route is already wrapped in `ProtectedRoute allowedRoles={["admin"]}` in App.jsx — redundant double-guard
43. `AdminDashboard` also has its own manual `user.role !== 'admin'` guard for the same reason — redundant

### Misc UI bugs
44. `AdminDashboard` OverviewDashboard has `bg-[#081120]` hardcoded dark color on cards — breaks light mode UI
45. `AdminDashboard` OverviewDashboard whitespace: cards inside the `xl:grid-cols-3` section use `bg-white` directly — breaks dark mode
46. `AdminShell` logout button text says `"Signing out…"` (with em dash) while `AdminDashboard` says `"Signing out..."` (with ellipsis) — inconsistent text
47. `AdminDashboard` uses both `SupportMessage` and `CommunicationEvent` entity queries in `loadUnread` but `SupportMessage` is filtered by `m.role === "client"` — `role` is not a field on `SupportMessage` entity
48. `AdminOnboarding` has an unused `navigate` import from `useNavigate` — variable is imported but never called
49. `AdminOnboarding` uses `clients.filter(c => c.status === "Live")` etc but the `OnboardingClient` entity schema has `workflow_stage`, `website_status`, `activation_status` — not a `status` field; the filter matches nothing
50. `pages/Login` uses `<a href="/contact">` instead of `<Link to="/contact">` — bypasses React Router, causes full page reload

## BATCH 2 (51–100): Function bugs, entity mismatches, component contradictions

51. `AdminShell` NAV_GROUPS missing: `demo-bookings`, `failed-jobs`, `ai-sales-reps`, `audit-log`, `sniper`, `ai-sales-cmd`, `performance-wars`, `social-engine`, `website-copy` tabs  
52. `AdminShell` calls `base44.entities.SupportMessage.filter(...)` but `SupportMessage` likely requires service role since it's client data — should be `asServiceRole`  
53. `AdminLeads` wraps `LeadManagementDashboard` in `AdminShell` — but `AdminDashboard` also renders `LeadManagementDashboard` inside its own layout — two wrappers for the same component  
54. `AdminAutomation` wraps `AutomationsPanel` in `AdminShell` — AdminDashboard also renders `AutomationsPanel` in-page — same double-wrapper pattern  
55. `BeforeAfter` component is imported in neither `Home.jsx` nor `HomepageConversionContent` — it appears orphaned/unused on the homepage  
56. `AutomationShowcase` component similarly exists but is not imported in `Home.jsx` — orphaned  
57. `InteractiveJourneyMap` component exists but not imported in `Home.jsx` — orphaned  
58. `LeadLeakage` component exists but not imported in `Home.jsx` — orphaned  
59. `SixAutomationSystems` and `AutomationShowcase` both display 6 automations with different data structures — data duplication  
60. `components/landing/AutomationFlowDiagram`, `AutomationPipelineSection`, `AutomationWalkthrough`, `AutomationDemo` — four separate automation visualization components, unclear which is canonical  
61. `components/landing/HowItWorks` exists but is not used in `Home.jsx`  
62. `components/landing/Benefits` exists but is not used in `Home.jsx`  
63. `components/landing/WhyUs` exists but is not used in `Home.jsx`  
64. `components/landing/ProblemSection` and `components/landing/ProblemSolution` and `components/landing/ProblemMatcher` — three separate "problem" components, none imported in Home  
65. `components/landing/SolutionSection` exists but unused in Home  
66. `components/landing/Guarantee` and `components/landing/GuaranteeBanner` and `components/landing/MoneyBackGuarantee` — three separate guarantee components  
67. `components/landing/StatCounter` and `components/landing/AnimatedStats` — two separate stats components  
68. `components/landing/SocialProofTicker` exists in both `components/landing/` and `components/store/` — duplicate  
69. `components/landing/MissedCallAnimation` and `components/landing/InstantLeadResponseAnimation` and `components/landing/NurtureSequenceAnimation` — three animation components, unclear usage  
70. `components/landing/AIResponseDemo` and `components/landing/AIBookingAgentAnimation` — two AI demo animations, unclear canonical  
71. `lib/socialProofStats.js` and `components/landing/SocialProofTicker` and `components/landing/LiveLeadPulse` — three social-proof systems  
72. `components/landing/StickyCTA` and `components/landing/MobileCallBar` — two sticky CTA components, unclear which is active  
73. `components/landing/ExitIntentPopup` exists but unused in `Home.jsx`  
74. `components/landing/ConversationModal` exists but unused  
75. `hooks/usePageViewTracking.js` and `hooks/useAnalytics.js` — two analytics tracking hooks; `initializeAnalyticsObserver` in App.jsx is a third tracking init  
76. `lib/ga4.js` and `utils/ga4Events.js` — GA4 logic split across two files  
77. `lib/analytics.js` and `utils/analytics.js` — analytics utilities duplicated across `lib/` and `utils/`  
78. `utils/ogMetaTags.js` and `lib/seo.js` — OG meta management in two places  
79. `utils/seoHelpers.ts` and `lib/seo.js` — SEO helpers duplicated  
80. `utils/jsonLdSchema.js` and `utils/industryJsonLd.js` and `utils/localSeo.js` — three JSON-LD/schema utils  
81. `components/CookieConsent` and `components/landing/CookieConsent` — two separate cookie consent components  
82. `components/Testimonials` and `components/landing/Testimonials` — duplicate testimonials components  
83. `components/DarkModeToggle` and the Navbar dark mode toggle inline code — two dark mode toggles  
84. `legacy-pages/` folder contains 13 pages actively redirected — `Dashboard`, `AdminSettings`, `Chiropractic`, `Dental`, `HVAC`, `Roofing`, `Contractors`, `MedSpa`, `MedSpaDashboard`, `Sam`, `WebsiteSpecPreview`, `IndustriesPage`, `LeadIntelligence`, `NotFound` — these files exist but serve only as redirect targets; their JSX content may still be loaded by webpack unnecessarily  
85. `public/_redirects` and App.jsx `LEGACY_REDIRECTS` — two separate redirect systems that may conflict  
86. `hooks/useOrderGuard.js` exists but unclear if used anywhere  
87. `lib/demoBookings.js` — unclear if duplicated logic with `scheduleDemoBooking` function  
88. `lib/booking.js` — separate booking utility alongside `functions/scheduleDemoBooking` and `lib/demoBookings.js` — three booking systems  
89. `functions/sendDemoConfirmationEmail` and `functions/sendDemoPrepEmail` are separate functions called sequentially — could be one batched function  
90. `functions/generateSitemap` exists as a backend function but `public/sitemap.xml` is a static file — two competing sitemap approaches  
91. `data/salesCatalog.json` and `lib/salesCatalog.js` and `data/aiProductsIndex.js` — three separate product catalog files  
92. `lib/aiProducts.js` and `data/aiProductsIndex.js` — AI product data duplicated  
93. `lib/systemConfig.js` and `lib/constants.js` — two config/constants files  
94. `lib/packageCapabilities.js` and `lib/productRecommendations.js` and `lib/industryRecommendations.js` — three recommendation/capabilities files  
95. `lib/industryData.js` and `components/landing/Industries` inline industry data — industry data duplicated  
96. `lib/industryData.js` and `lib/sixAutomations.js` INDUSTRY_AUTOMATION_USE_CASES — industry use cases duplicated  
97. `functions/_shared/leadPipeline` and `lib/leadPipelineApi.js` — lead pipeline logic split across backend and frontend  
98. `utils/canonicalPricing.js` and inline pricing in `components/landing/Pricing` and `data/salesCatalog.json` — pricing in three places  
99. `components/forms/SignupModal` and `components/forms/PortalLoginModal` and `components/forms/LoginModal` and `components/forms/LeadCaptureModal` — four separate modal forms for auth/lead capture  
100. `components/landing/LeadCaptureForm` and `components/leads/LeadCaptureForm` — duplicate lead capture form components  

## BATCH 3 (101–150): Portal, dashboard, entity field mismatches

101. `ClientPortal` and `ClientDashboard` are two separate routes for clients — unclear boundary between them  
102. `components/portal/` has 40+ components — `BillingPanel`, `BillingTab`, `BillingDashboard` — three separate billing components for the portal  
103. `components/portal/OnboardingTracker` and `components/onboarding/OnboardingProgressTracker` — duplicate onboarding progress trackers  
104. `components/portal/QuickStartWizard` and `components/portal/QuickStartInline` and `components/onboarding/QuickSetupWizard` — three "quick start" components  
105. `components/portal/AutomationsOverview` and `components/portal/AutomationChecklist` and `components/portal/AutomationPausedBanner` — three automation status components for portal  
106. `components/dashboard/` has parallel set of components for `DashboardHome`, `DashboardHeader`, `DashboardMetricsBar` alongside `components/portal/` equivalents  
107. `internal-pages/ClientPortal` and `internal-pages/ClientDashboard` — both import from `components/portal/` but have separate page shells  
108. `components/portal/PortalSkeleton` and `components/portal/PortalLoadingSkeleton` — two loading skeletons for the same portal  
109. `AdminLeads` at `/admin/leads` and `AdminDashboard?tab=leads` both render `LeadManagementDashboard` — identical content at two URLs  
110. `AdminAutomation` at `/admin/automations` and `AdminDashboard?tab=automations` — same content at two URLs  
111. `AdminOnboarding` at `/admin/onboarding` and `AdminDashboard?tab=onboarding` (the onboarding external link) — same page accessible via two routes  
112. `CommunicationEvent` entity `event_type` enum missing `"voice_call_failed"` — `processVoiceCallFollowUps` function may log this type  
113. `Leads` entity `voice_call_outcome` enum has `"failed"` but `CommunicationEvent.event_type` has no corresponding `voice_call_failed`  
114. `Leads` entity field `missed_call_step_sent` max described as "1-4" in description but no max validation  
115. `Order` entity `order_status` default is `"pending_payment"` but `payment_status` default is also `"pending"` — two status fields tracking the same thing  
116. `Order` items array has `install_status` enum including `"Paid"` — `"Paid"` is a payment status not an install status  
117. `Order` items `service_access_status` field has no enum — free text that likely creates inconsistency  
118. `Order` has both `stripe_subscription_id` and `subscription_id` — two subscription ID fields  
119. `Order` has both `total_setup` and `pricing_summary.total_setup` — duplicated price fields  
120. `Order` has both `total_monthly` and `pricing_summary.total_monthly` — duplicated price fields  
121. `ClientProject` entity has timeline fields: `timeline_person_name`, `timeline_birth_date`, `timeline_death_date` — appear to be data from a different feature (person timeline) left in wrong entity  
122. `ClientProject` entity has `step_onboarding` through `step_live` as separate string fields but also `deadlines` array — two progress tracking systems  
123. `OnboardingClient` entity vs `ClientProject` entity — two entities that both track client onboarding progress  
124. `OnboardingClient` and `Order` and `ClientProject` and `ClientInstallationOS` — four separate entities for a single client lifecycle  
125. `AutomationChecklist` and `AutomationChecklistStep` — two entities for checklist tracking  
126. `WebsiteLead` and `Leads` entities — two separate lead entities  
127. `DemoRequest` entity not shown in snapshot but referenced — demo requests also tracked as `Leads` with `status: "Booked"` — double-tracking  
128. `Lead` (old sniper entity) and `Leads` (main entity) — two separate lead entities with different schemas  
129. `MetricsSnapshot` and `LeadAnalytics` and `LeadRevenue` — three separate analytics entities  
130. `EmailCampaign`, `EmailDripCampaign`, `EmailCampaignTemplate`, `EmailCampaignRecipient`, `DripCampaign`, `NurtureCampaign`, `EmailSequence` — 7 separate email campaign-related entities  
131. `CommunicationEvent` and `Messages` and `Emails` — three communication log entities  
132. `AutomationJob` and `AutomationRule` and `AutomationWorkflowPreset` — three automation config entities  
133. `ConversationThread` entity appears to duplicate functionality of `CommunicationEvent`  
134. `Changelog` entity is defined but unclear if any frontend renders it  
135. `Events` entity is defined but appears to conflict with `CommunicationEvent`  
136. `WebhookRegistration` entity manages webhooks but `AdminSettings` entity also has `webhook_url` and `webhook_enabled` — duplication  
137. `AdminSettings` entity has both `twilio_account_sid_present` and `twilio_auth_token_present` boolean flags — these should be derived from whether the actual secrets exist, not stored as entity fields  
138. `AdminSettings` has 8 nurture step fields (step1-step8) — long-form data stored in entity not appropriate for a settings entity  
139. `BusinessConfigTemplate` entity vs `AdminSettings` entity — two places for business configuration  
140. `Subscription` entity alongside `Order.stripe_subscription_id` — subscription data in two places  
141. `Invoice` entity alongside Stripe's own invoice system — double invoice tracking  
142. `SupportMessage` entity vs `ConversationThread` vs `CommunicationEvent` — three message tracking systems  
143. `MessageTemplate` entity vs `AdminSettings` template fields — message templates in two places  
144. `AutomationChecklist` has `service_key` enum with 6 values but `AutomationWorkflowPreset` also tracks service configurations  
145. `functions/enrollEmailDripCampaign` and `functions/startDripCampaign` and `functions/enrollMissedCallDrip` — three drip enrollment functions  
146. `functions/processNurtureCampaigns` and `functions/processDripCampaigns` and `functions/processAutomationJobs` — three separate campaign processors  
147. `functions/runFullPipelineTest` and `functions/autoEndToEndTest` — two end-to-end test functions  
148. `functions/scoreLeads` and `functions/calculateLeadScore` and `functions/scoreLeadIntelligence` — three separate lead scoring functions  
149. `functions/enrichLead` and `functions/enrichLeadWithAI` — two lead enrichment functions  
150. `functions/generateAIReply` and `functions/generateSmartResponse` and `functions/generateIndustryFirstSMS` and `functions/industryAwareReply` — four AI reply generation functions  

## BATCH 4 (151–200): More function duplication, missing error handling, UI/UX issues

151. `functions/sendSMS` and `functions/sendInstantLeadResponseSms` and `functions/sendLeadInstantSms` and `functions/sendMissedCallRecoveryEmail` — multiple SMS/email send functions
152. `functions/sendEmail` and `functions/sendSmartEmail` and `functions/sendFollowUpEmail` — three email send wrappers  
153. `functions/routeLead` and `functions/routeLeadToIndustryAgent` — two lead routing functions  
154. `functions/classifyLeadIntent` and `functions/classifyLeadIntentWiring` and `functions/classifyLeadReply` — three lead classification functions  
155. `functions/handleNewLead` and `functions/onLeadCreated` and `functions/createLeadAndDispatch` — three lead creation handlers  
156. `functions/updateLeadStatus` and `functions/bulkLeadAction` and `functions/applyAutomationRules` — three lead update functions  
157. `functions/getAdminAnalytics` and `functions/getLeadPipelineSummary` and `functions/calculateLeadAnalytics` — three analytics functions  
158. `functions/getSystemHealthDashboard` and `functions/getIntegrationHealth` and `functions/runIntegrationHealthCheck` — three health check functions  
159. `functions/processWebsiteLeadFollowUps` and `functions/processDynamicFollowUps` and `functions/processQualifiedFollowUps` and `functions/triggerFollowUpSequence` — four follow-up processors  
160. `functions/reactivateLeadOutreach` and `functions/runWinBackSequence` — two reactivation functions  
161. `functions/validateLeadQuality` and `functions/validateAIOutputs` — two validation functions  
162. `functions/pipelineIntegrityCheck` and `functions/selfHealingMonitor` and `functions/detectAnalyticsAnomalies` — three monitoring functions  
163. `functions/sendDailyDigest` and `functions/dailyDigestGate` — two daily digest functions  
164. `functions/sendWeeklyDigest` and `functions/generateWeeklyReport` — two weekly report functions  
165. `functions/monthlyClientReport` and `functions/generateMonthlyPerformanceReport` — two monthly report functions  
166. `functions/updateMetricsSnapshot` and `functions/calculateLeadAnalytics` — two metrics update functions  
167. `functions/saveClientCredentials` and `functions/credentialsCompletionCheck` and `functions/missingCredentialsAlert` — three credential functions  
168. `functions/initializeInstallOS` and `functions/initializeBusinessConfig` — two initialization functions  
169. `functions/getClientPortalContext` and `functions/getClientAnalytics` and `functions/getClientFollowUpLog` — three client data functions  
170. `functions/activateAllServices` and `functions/retryFailedServiceActivation` and `functions/autoResolveInstallError` — three service activation functions  
171. `components/admin/IntegrationHealth` and `components/admin/IntegrationHealthDashboard` — two integration health components  
172. `components/admin/LeadManagementDashboard` and `components/admin/AdminLeadsEnhanced` and `components/admin/AdminLeadsTable` — three leads table components  
173. `components/admin/PerformanceDashboard` and `components/admin/MetricsDashboard` and `components/admin/AnalyticsDashboard` — three analytics dashboard components  
174. `components/admin/RevenueDashboard` and `components/admin/RevenueMetricsPanel` and `components/admin/MRRTrendChart` — three revenue components  
175. `components/admin/CampaignBuilder` and `components/admin/CampaignLibrary` — two campaign builder components  
176. `components/admin/SniperDashboard` and `components/admin/SniperMap` and `components/leads/DiscoveryPanel` — three sniper/discovery components  
177. `components/admin/WebhookConfigPanel` and `components/admin/webhook/WebhookConfigPanel` — duplicate webhook config components at different paths  
178. `components/admin/AILeadInsightPanel` and `components/admin/AIAgentsDashboard` and `components/admin/AdminAICommandBar` — three AI admin components  
179. `components/admin/AdminDemoBookings` and `components/admin/AdminDemoBookingsTab` — two demo booking admin components  
180. `components/admin/QaCustomerPanel` and `components/admin/TestConnectionButtons` — QA tools split across two components  
181. `components/portal/BillingPanel` and `components/portal/BillingTab` and `components/portal/BillingDashboard` — three billing components in portal  
182. `components/portal/GetHelpTab` and `components/portal/SupportChat` — two support components in portal  
183. `components/portal/LeadActivityFeed` and `components/portal/LeadFlowDashboard` and `components/portal/LeadScoreDisplay` and `components/portal/LeadScoreCard` — four lead display components in portal  
184. `components/portal/PortalSettings` and `components/portal/WebhookSettings` and `components/portal/NotificationBell` and `components/portal/NotificationPreferences` (in dashboard) — settings spread across multiple components  
185. `internal-pages/AISalesCommandCenter.jsx` and route `/admin/ai-sales` — standalone page that duplicates content available in `AdminDashboard` ai-sales tab  
186. `internal-pages/PerformanceWars.jsx` and route `/admin/performance-wars` — standalone page, same issue  
187. `internal-pages/AdminInstallGuide.jsx` and route `/admin/install-guide` — standalone page  
188. All three above (185-187) are external links from AdminDashboard sidebar — they break the unified admin experience by navigating away  
189. `MASTER_TASK_LIST_560.md` and `PRE_LAUNCH_100_TASKS.md` and `PROJECT_COMPLETION_CHECKLIST.md` and `REFACTORING_CHECKLIST.md` — 4+ task list docs that should be a single source of truth  
190. `README_ENV.md` and `README_REFACTORING.md` — two README files that should be merged  
191. `components/animations/` directory with `CheckmarkVariants`, `FloatingStatCards`, `GlowRevealProducts`, `LineDrawAccordion` — animation components that overlap with `components/visual-effects/` and `components/landing/` animations  
192. `components/visual-effects/` has 10 components (`AnimatedSectionRule`, `BeforeAfterSlider`, `CascadingChecklistItem`, `CursorGlow`, `FloatingNotificationToasts`, `ParallaxBackground`, `ParallaxHeadline`, `ResultCounter`, `StaggeredFadeUp`, `TypingEffect`) — most unused in Home  
193. `agents/sam` and `internal-pages/Sam.jsx` (legacy-redirected) and `components/sam/SamChatWidget` — three "Sam" AI components  
194. `agents/` directory has 8 separate industry agent configs that are largely identical — repetitive  
195. `functions/chatBubbleAI` and `components/landing/ChatBubble` and `agents/` — three separate AI chat entry points  
196. `public/sw.js` service worker exists but `public/manifest.json` references it — unclear if PWA mode is intentional or a leftover  
197. `public/sitemap.xml` is a static file but `functions/generateSitemap` dynamically generates one — two competing sitemap systems  
198. `public/robots.txt` exists but `RouteIndexingGuard` in App.jsx also dynamically sets noindex meta tags — two robots control systems  
199. `index.html` has both meta viewport and the CSS `@supports (height: 100svh)` — redundant viewport handling for iOS  
200. `lib/scroll.js` provides smooth scrolling utilities but `index.css` has `html { scroll-behavior: auto; }` comment saying "handled entirely in JS via lib/scroll.js" — but `ScrollToTop` in App.jsx calls `scrollToTop()` which is fine, however `SectionRedirect` navigates without any scroll — gap in scroll management

---

## FIX STATUS SUMMARY (updated 2026-05-26)

### ✅ COMPLETE (22 issues fixed)
- #7 scheduleDemoBooking dead `if (false...)` code removed
- #8 scheduleDemoBooking double `optimisticLockSlot` call removed
- #12 AdminDashboard SessionTimeoutModal `handleLogout` scope fix
- #19 SectionRedirect canonical path fix
- #22 AdminQuickActions switched to `base44.functions.invoke`
- #25 seo.js twitter:card `property` → `name` attribute
- #26 seo.js twitter:url `property` → `name` attribute
- #28 index.css duplicate focus ring rules removed
- #29 index.css duplicate `.sticky` rule removed (second occurrence)
- #30 HomepageConversionContent "plumbing" industry tag removed (no route exists)
- #35 Pricing card duplicate badge text fixed
- #36 Pricing card duplicate isRecommended text fixed
- #42 AdminOnboarding redundant role guard removed
- #43 AdminDashboard redundant role guard removed
- #44 AdminDashboard hardcoded `bg-[#081120]` dark card color fixed
- #46 AdminShell logout text standardized to "Signing out..."
- #47 AdminDashboard/AdminShell SupportMessage filter fixed (no `role` field)
- #49 AdminOnboarding status filter fixed to use `activation_status`/`workflow_stage`
- #51 AdminShell missing nav items added (demo-bookings, failed-jobs, sniper, social-engine, website-copy, ai-sales, performance-wars, audit-log)
- #13 AdminShell isActive logic documented/clarified
- #LeadScoreCell missing React import added (`useState` imported, `React.useState` fixed)
- #smsCompliance `module.exports` → ES `export` syntax

### ⚠️ SKIPPED / BLOCKED
- #50 pages/Login `<a href="/contact">` → `<Link>` — login page is platform-protected, cannot be edited

### ⏳ PENDING (178 remaining)
- Batch 2 architectural issues (51–100): orphaned components, data duplication, multiple analytics systems
- Batch 3 entity schema issues (101–150): duplicate entities, field mismatches
- Batch 4 function duplication (151–200): consolidation of duplicate backend functions