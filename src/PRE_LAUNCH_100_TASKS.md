# ClientSurge Systems — Pre-Launch Task List
> 100 items across Frontend, Backend, Admin, Checkout, Auth, SEO, and Ops

---

## 🌐 FRONTEND — HOMEPAGE & LANDING

1. **Store hero text is unreadable (cream/gold on white bg)**
   → Fix: Change Store `h1` color from `rgba(245,225,195,0.95)` to a dark value like `#1b140d`

2. **Store hero subtitle text is barely visible (low-opacity gold)**
   → Fix: Change color from `rgba(220,190,150,0.65)` to `rgba(27,20,13,0.75)` for readability

3. **Store search input debounce is broken — uses raw `setSearch` not `handleSearchChange`**
   → Fix: In `Store.jsx` line 540, change `onChange={(event) => setSearch(event.target.value)}` to `onChange={(e) => handleSearchChange(e.target.value)}`

4. **Social Proof Ticker uses fake/mocked purchase data**
   → Fix: Replace mock `mockPurchases` array with real recent Order entity data or remove the ticker until real data is available

5. **Testimonials section has no real client photos — uses placeholder initials**
   → Fix: Add real client photos or use high-quality AI-generated avatars with actual business names

6. **Homepage missing Testimonials section entirely**
   → Fix: Add `<Testimonials />` section to `pages/Home.jsx` between BeforeAfter and FinalCTA

7. **No "About Us" or founder story section**
   → Fix: Add a brief founder/team section or credibility block before the FAQ to build trust

8. **Pricing section links to Stripe but Stripe is in test mode**
   → Fix: Switch Stripe keys to live keys before launch, update `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`

9. **No cookie consent / GDPR banner**
   → Fix: Implement the existing `CookieConsent` component — wire it into `pages/Home.jsx`

10. **No exit-intent popup to capture abandoning visitors**
    → Fix: Wire in the existing `ExitIntentPopup` component in `pages/Home.jsx`

11. **ChatBubble AI has no rate limiting on the frontend**
    → Fix: Debounce/disable the send button for 2s after submission to prevent spam

12. **Mobile: Navbar height is 100px causing content to be pushed down excessively**
    → Fix: Reduce to `72px` on mobile, use `clamp()` for responsive height

13. **Store page background is dark/patterned but text is styled for it — conflicts on scroll**
    → Fix: Set a consistent white/light background for the store page to match the rest of the site

14. **`BeforeAfter` component — confirm it actually renders visible content (not broken)**
    → Fix: Test the component in viewport, verify slider interaction works on touch devices

15. **`InteractiveJourneyMap` — verify all steps are properly labeled and clickable**
    → Fix: Review each step for correct copy, icon, and click behavior

16. **FAQ search filter loses focus on mobile after typing**
    → Fix: Add `autoFocus={false}` and test input persistence on iOS Safari

17. **`IntegrationPartners` section — verify logos are all loading (no broken image fallbacks)**
    → Fix: Check each logo URL, add `onerror` fallback or use local assets

18. **No `<noscript>` fallback for users with JavaScript disabled**
    → Fix: Add a basic `<noscript>` tag in `index.html` explaining JS is required

19. **All CTA buttons still say "Book a Demo" — no secondary CTA variety**
    → Fix: Some CTAs should say "See Pricing", "Get Started Free", or "View Services" for variety

20. **`LeadLeakage` section stat numbers are hardcoded — should feel dynamic**
    → Fix: Add a `CountUp` animation on scroll entry to animate the revenue numbers

---

## 🛒 STORE & PRODUCT CHECKOUT

21. **Stripe Checkout is in test mode — real cards will fail**
    → Fix: Switch to live Stripe keys via Dashboard → Integrations before launch

22. **Order success page shows generic message — no order summary pulled from session**
    → Fix: In `pages/OrderSuccess.jsx`, confirm `sessionStorage` order data is being read and displayed correctly

23. **Cart items persist in sessionStorage across browser sessions**
    → Fix: Decide intentional behavior — if cart should reset on new visit, switch to `sessionStorage` only (already used) — verify it clears properly

24. **No upsell or order bump offered at checkout**
    → Fix: In CartSidebar, before showing the Stripe redirect, suggest 1 complementary add-on

25. **Cart shows "$0 setup" for services with no setup fee — confusing**
    → Fix: If `setup_fee === 0`, display "No setup fee" instead of "$0 setup"

26. **No email confirmation sent to customer after checkout completes**
    → Fix: In `stripeWebhookOrders` function, trigger `sendLeadConfirmationEmail` after `checkout.session.completed`

27. **No order confirmation email to admin when a new purchase is made**
    → Fix: Add `sendAdminLeadNotification` call inside `stripeWebhookOrders` on successful checkout

28. **Stripe webhook not verified with signature validation in test — confirm it works in prod**
    → Fix: Verify `STRIPE_WEBHOOK_SECRET` is set and `constructEventAsync` is being used in `stripeWebhookOrders`

29. **ProductCard "Popular" badge overlaps with content on mobile**
    → Fix: Position it as `position: absolute; top: -10px; right: 10px` with `zIndex: 10` and test on 375px viewport

30. **ServiceDetailModal CTA button has duplicate `style={}` prop (syntax error)**
    → Fix: In `ServiceDetailModal`, line ~136, remove the first `style={}` override that gets replaced immediately

31. **Cart sidebar "loading" state says "Redirecting to Stripe..." indefinitely if checkout fails**
    → Fix: Add a 10s timeout fallback that resets step back to "info" with an error message

32. **`createCheckoutSession` function doesn't include `base44_app_id` in Stripe metadata**
    → Fix: Add `metadata: { base44_app_id: Deno.env.get("BASE44_APP_ID") }` to the session creation call

33. **No quantity selector — customers can only add 1 of each service**
    → Fix: This is intentional for subscriptions, but document this clearly in the UI ("1 license per service")

34. **Bundle savings toast fires on every item add — can be annoying**
    → Fix: Add a `localStorage` flag to only show it once per session

35. **No refund/cancellation policy shown before checkout**
    → Fix: Add a one-liner below the Stripe button: "Cancel anytime. Refunds per our Terms of Service." linked to `/legal/terms`

---

## 🔐 AUTH & USER ACCOUNTS

36. **Login modal uses `PortalLoginModal` — confirm it handles wrong credentials gracefully**
    → Fix: Test login with bad credentials, ensure error message is shown and not just a silent failure

37. **No "Forgot Password" flow**
    → Fix: Add a "Forgot Password?" link in `PortalLoginModal` that triggers Base44's native password reset

38. **`ClientPortal` is behind auth but no redirect message is shown for unauthenticated users**
    → Fix: Confirm `AuthRedirectFallback` spinner shows briefly before redirect — add message: "Redirecting to login..."

39. **No onboarding flow for newly registered clients**
    → Fix: After first login, detect `onboarding_wizard_completed: false` on `ClientProject` and redirect to `/onboarding`

40. **Admin panel (`/admin`) has no 2FA or IP restriction**
    → Fix: At minimum, add a secondary password confirmation modal on admin login, or restrict to specific email domains

41. **User invite system sends invite but no confirmation shown to admin**
    → Fix: After `base44.users.inviteUser()` succeeds, show a toast: "Invite sent to [email]"

42. **No session timeout — users stay logged in indefinitely**
    → Fix: Implement a 24hr auto-logout warning with an "Extend Session" button

43. **Client portal shows no data for new users who haven't been linked to an Order**
    → Fix: Show a friendly empty state: "Your services are being set up. You'll receive an email within 24 hours."

44. **`/client-dashboard` and `/client-portal` both exist — confusing routing**
    → Fix: Consolidate to one route (`/portal`) and redirect the other, update all internal links

45. **No email verification required before accessing client portal**
    → Fix: Check if Base44 enforces email verification — if not, add a banner reminding unverified users to check email

---

## 🛠️ ADMIN PANEL & DASHBOARD

46. **Admin panel (`/admin`) has no loading skeleton — shows blank on slow connections**
    → Fix: Add `<Suspense fallback={<AdminLoadingSkeleton />}>` wrapper around `AdminDashboard`

47. **`AdminDashboard` shows all leads regardless of assigned admin — no role-based filtering**
    → Fix: Add filter for `assigned_to === user.email` unless user is super-admin

48. **Install Queue panel has no "Refresh" button — relies on manual page reload**
    → Fix: Add a refresh icon button that re-fetches `listInstallQueue` data

49. **No audit log for admin actions (who changed what on a client record)**
    → Fix: Log key admin actions (status changes, note additions) to `CommunicationEvent` entity

50. **Admin can delete orders but there's no confirmation dialog**
    → Fix: Add a `DeleteConfirmModal` before any destructive operation in admin panels

51. **`AutomationInstallChecklist` steps have no timestamps for when they were completed**
    → Fix: Add `completed_at` field to checklist steps and display it in the UI

52. **Admin onboarding form for new clients has no validation on phone number format**
    → Fix: Add regex validation for US phone numbers before allowing form submission

53. **No search functionality in Admin Leads table**
    → Fix: Add a search bar that filters by business name, email, or phone across the `Leads` entity

54. **Leads table has no CSV export**
    → Fix: Add an "Export CSV" button that generates a downloadable file from filtered lead data

55. **CommunicationEvent logs are not paginated — could be thousands of records**
    → Fix: Add pagination with `skip`/`limit` to the `CommunicationLogsPanel`

56. **Admin settings panel has no "Save" confirmation — changes might not persist**
    → Fix: Add success toast after `updateAdminSettings` call completes

57. **`InstallOrderWorkspace` has no visual indicator when services are already live**
    → Fix: Show a green "Live" badge next to service names where `install_status === "Live"`

58. **No admin notification when a client completes their onboarding form**
    → Fix: Add entity automation on `OnboardingSubmission` create → trigger `sendAdminLeadNotification`

59. **Revenue dashboard shows $0 for all metrics — confirm Stripe data is flowing in**
    → Fix: Test `stripeWebhookOrders` end-to-end with a real test checkout, verify `Order.payment_status` updates to "paid"

60. **No way to manually resend a client's welcome email from the admin panel**
    → Fix: Add a "Resend Welcome Email" button in the client detail view that calls `sendPortalWelcomeEmail`

---

## 📧 EMAILS & COMMUNICATIONS

61. **`RESEND_FROM_EMAIL` is set but the "From Name" is not configured**
    → Fix: Update all Resend email calls to include `from_name: "ClientSurge Systems"` for branding

62. **Demo confirmation email has placeholder `{{business_name}}` that may not be replaced**
    → Fix: Audit `sendDemoConfirmationEmail` — verify all template variables are being substituted

63. **No SMS confirmation sent to client after checkout**
    → Fix: In `stripeWebhookOrders`, after payment confirmed, trigger a Twilio SMS via `sendSMS` to `customer_phone`

64. **Twilio from number is hardcoded in some functions vs reading from `TWILIO_PHONE_NUMBER` env**
    → Fix: Audit all `sendSMS` and `sendInstantLeadResponseSms` calls to use `Deno.env.get("TWILIO_PHONE_NUMBER")`

65. **No unsubscribe mechanism in SMS sequences (TCPA compliance)**
    → Fix: Add "Reply STOP to unsubscribe" to all outbound SMS messages and handle STOP replies in `receiveTwilioInboundSms`

66. **Email templates have no plain-text fallback**
    → Fix: All Resend emails should include both `html` and `text` body fields for email client compatibility

67. **Nurture sequence emails don't respect client's timezone**
    → Fix: Store timezone in `Client` entity and offset send times accordingly in `processNurtureCampaigns`

68. **No email preview functionality for admin before campaigns go out**
    → Fix: Add a "Send Preview" button in the email template editor that sends a test to the admin's email

69. **`AdminSettings.lead_notification_email` may be empty — causing silent failures**
    → Fix: Add a fallback to `ADMIN_EMAIL` env var if `lead_notification_email` is not set

70. **Drip campaign doesn't check if lead has already converted (booked) before sending**
    → Fix: In `processDripCampaigns`, check `lead.status === "Booked"` and skip if true

---

## ⚙️ BACKEND FUNCTIONS & AUTOMATIONS

71. **`onLeadCreated` automation may fire multiple times for duplicate leads**
    → Fix: Add deduplication check in `onLeadCreated` using `lead.dedup_key` before dispatching

72. **`processWebsiteLeadFollowUps` scheduled task — confirm it's actually running**
    → Fix: Check automation list, verify cron is active and not paused

73. **`scheduleFollowUpSMS` has no check for business hours — SMS may send at 2am**
    → Fix: Add business hours check using the `AdminSettings.business_hours` field before sending

74. **`installPipeline` function has no timeout handling — could hang indefinitely**
    → Fix: Add a 30s timeout with error logging to prevent zombie jobs

75. **`discoverLeads` function — Google Maps API key not set, will silently fail**
    → Fix: Set the Google Maps/Places API key as a secret and add error handling with clear error messages

76. **`autoEndToEndTest` function — remove or disable before launch**
    → Fix: Add admin role check so only admins can trigger it, or disable the automation entirely

77. **`getClientPortalContext` doesn't handle the case where no Order is found**
    → Fix: Return a structured empty state object instead of null/error so the portal renders gracefully

78. **No rate limiting on `submitLeadCapture` — can be spammed**
    → Fix: Use the existing `rateLimit` utility to restrict to 3 submissions per IP per hour

79. **`chatBubbleAI` function has no content filtering for inappropriate inputs**
    → Fix: Add a prompt-injection guard and sanitize user input before sending to LLM

80. **`webhookLeadCapture` has no signature verification**
    → Fix: Validate `X-Webhook-Secret` header against `AUTOMATION_SHARED_SECRET` env var on every request

---

## 🔍 SEO & PERFORMANCE

81. **`robots.txt` needs to block `/admin`, `/client-portal`, `/client-dashboard`**
    → Fix: Update `public/robots.txt` to add `Disallow: /admin`, `Disallow: /client-portal`, `Disallow: /client-dashboard`

82. **`sitemap.xml` is static and missing new industry pages**
    → Fix: Verify `/med-spa`, `/dental`, `/hvac`, `/roofing`, `/chiropractic`, `/contractors` are all in the sitemap

83. **OG image is not set — social media shares show no preview image**
    → Fix: Add `<meta property="og:image">` to `index.html` with a real branded preview image URL

84. **Page titles are generic on industry sub-pages**
    → Fix: In `IndustryTemplate`, set unique `<title>` per industry using `setPageMetadata()`

85. **No canonical tag on duplicate/redirect pages**
    → Fix: Add canonical URLs in `setPageMetadata()` calls for all pages that have redirects

86. **Images throughout the site have no `width`/`height` attributes — causes CLS**
    → Fix: Add explicit `width` and `height` to all `<img>` tags, especially in Hero and testimonials

87. **Google Analytics / tracking pixel not installed**
    → Fix: Add GA4 tracking ID to `index.html` or initialize in `main.jsx` via a `useEffect`

88. **No structured data on individual industry pages**
    → Fix: Add `LocalBusiness` JSON-LD schema to each industry page via `setJsonLd()`

89. **Font loading uses `@import` in CSS — slows First Contentful Paint**
    → Fix: Move Google Fonts `<link>` tags to `index.html` `<head>` with `rel="preload"` for Inter and Playfair

90. **Lazy-loaded sections have no minimum height — causes layout shift on load**
    → Fix: Add `min-height` to each `<Suspense fallback>` skeleton to match the expected section height

---

## 🔒 LEGAL & COMPLIANCE

91. **Privacy Policy page exists but may not cover SMS/AI data usage**
    → Fix: Have a lawyer review and update to explicitly cover Twilio SMS, AI processing, and data retention

92. **Terms of Service don't mention subscription auto-renewal**
    → Fix: Add a clear section on recurring billing, cancellation, and refund terms

93. **No consent checkbox on the lead capture form before SMS opt-in**
    → Fix: Add "I agree to receive SMS messages" checkbox with link to Privacy Policy — required for TCPA

94. **Contact form at `/contact` collects email but has no privacy disclaimer**
    → Fix: Add "We respect your privacy. See our Privacy Policy." below the submit button

95. **No accessibility audit done — WCAG 2.1 AA compliance unknown**
    → Fix: Run an axe-core or Lighthouse accessibility audit, fix all critical violations before launch

---

## 🚀 DEPLOYMENT & OPERATIONS

96. **No staging/preview environment separate from production**
    → Fix: Use Base44's Test Database for all pre-launch testing, never test with real Stripe keys

97. **`APP_URL` secret may be set to `localhost` — will break email links**
    → Fix: Verify `APP_URL` is set to the production domain (e.g. `https://clientsurgesystems.com`)

98. **No uptime monitoring configured**
    → Fix: Set up UptimeRobot or Better Stack to ping the app and alert on downtime

99. **No backup strategy for entity data**
    → Fix: Document how Base44 handles backups and add a monthly manual export to Google Sheets as a safeguard

100. **No post-launch checklist or rollback plan**
     → Fix: Create a go-live runbook: verify Stripe live keys → test one real checkout → confirm webhook → confirm admin notification → confirm client email → monitor for 24hrs

---

## 🔴 CRITICAL — NEXT 10 TASKS (Do These Now)

101. **`sendLeadConfirmationEmail` — confirm the email template actually renders correctly**
     → Fix: Test by triggering a dummy checkout in test mode. Read `functions/sendLeadConfirmationEmail` and verify all variables (`customer_name`, `business_name`, `items`, totals) are substituted before sending. If any are undefined, the email sends with blank fields.

102. **Admin notification on new purchase is NOT wired up in `stripeWebhookOrders`**
     → Fix: After the customer confirmation email succeeds in `stripeWebhookOrders`, add a second call to `sendAdminLeadNotification` with order details so you get notified of every new sale immediately.

103. **`CartSidebar` checkout timeout missing — hangs on failed Stripe redirect**
     → Fix: In `CartSidebar` `handleCheckout`, add `setTimeout(() => { if (step === "loading") { setStep("info"); setError("Checkout timed out. Please try again."); } }, 12000)` immediately after setting step to "loading".

104. **`ServiceDetailModal` has two conflicting `style={}` props on the CTA button (JSX syntax error)**
     → Fix: In `components/store/ServiceDetailModal`, the Add to Cart `<button>` has a `style={{opacity...cursor...}}` and then immediately a second `style={{width...}}` — the second overwrites the first. Merge both into a single `style` object.

105. **Store search debounce is wired to raw `setSearch` instead of `handleSearchChange`**
     → Fix: In `pages/Store`, the search `<input>` `onChange` calls `setSearch(event.target.value)` directly. Change it to `onChange={(e) => handleSearchChange(e.target.value)}` to use the 280ms debounce properly.

106. **`robots.txt` does NOT block admin/portal routes from being indexed by Google**
     → Fix: Open `public/robots.txt` and add: `Disallow: /admin`, `Disallow: /client-portal`, `Disallow: /client-dashboard`, `Disallow: /order-success`, `Disallow: /setup`, `Disallow: /onboarding` under the `User-agent: *` block.

107. **`CookieConsent` component exists but is NOT wired into the homepage**
     → Fix: In `pages/Home.jsx`, import `CookieConsent` from `components/landing/CookieConsent` and render it at the bottom of the return block (after `<Footer />`). It only shows once per user via localStorage.

108. **`ExitIntentPopup` component exists but is NOT wired into the homepage**
     → Fix: Import and render `ExitIntentPopup` in `pages/Home.jsx`. It captures abandoning visitors and should show a lead magnet or demo offer. This is one of the highest-ROI conversion tools available.

109. **Order Success page (`/order-success`) is indexable by Google — exposes purchase data**
     → Fix: In `App.jsx`, the `RouteIndexingGuard` already has `/order-success` in `NOINDEX_PREFIXES` — verify it's there. Also add `<meta name="robots" content="noindex">` directly in `pages/OrderSuccess.jsx` as a safety net.

110. **`Store` page hero `h1` and subtitle text colors are nearly invisible on light backgrounds**
     → Fix: In `pages/Store`, change the `h1` color from `rgba(245,225,195,0.95)` to `#1b140d`, and the subtitle `p` color from `rgba(220,190,150,0.65)` to `rgba(27,20,13,0.72)`. These are the two most visible text bugs on the entire site.

---

## Priority Order (Do These First)
1. Items #105, #110 (visible text + search bugs on Store — first impressions)
2. Items #101–102 (Stripe webhook email chain — revenue critical)
3. Items #103–104 (cart UX bugs — blocks conversions)
4. Items #107–108 (cookie consent + exit popup — legal + leads)
5. Items #106, #109 (SEO/indexing — protects privacy + search ranking)
6. Items #21 (Stripe live keys — must flip before launch)
7. Items #63–65 (TCPA SMS compliance — already done ✅)
8. Items #91–94 (legal pages — already done ✅)