# PHASE 0: SITEWIDE VISUAL AUDIT REPORT
**Generated:** 2026-06-24  
**Status:** Audit Complete → Ready for Phase 1-8 Implementation

---

## ROUTE STRUCTURE SUMMARY

### PUBLIC MARKETING PAGES (SEO-indexed)
- ✅ `/` — Home (Recently refined, dark hero, good)
- ⚠️ `/automations` — Automations (exists, needs design system alignment)
- ⚠️ `/pricing` — Pricing (exists, uses PricingPageContent component)
- ⚠️ `/store` — Store (exists, needs design review)
- ⚠️ `/product-signup` — Product Signup (exists)
- ⚠️ `/start` — Start (exists, labeled as public)
- ⚠️ `/book` — Book/Free Audit (exists, has custom styling, needs alignment)
- ⚠️ `/contact` — Contact (exists, needs design review)
- ⚠️ `/industries` — Industries Hub (exists)
- ⚠️ `/:industry-slug` — Individual Industry Pages (roofing, hvac, etc.)
- ⚠️ `/about` — About (exists)
- ⚠️ `/faq` — FAQ (exists)
- ⚠️ `/testimonials` — Testimonials (exists)
- ⚠️ `/our-system` — Our System (exists)
- ⚠️ `/how-it-works` — How It Works (exists, may have duplicate)
- ⚠️ `/proof` — Proof Page (exists)
- ⚠️ `/blog` — Blog (exists)
- ⚠️ `/library` — Library (exists)
- ✅ `/privacy-policy` — Legal (exists, proper metadata)
- ✅ `/terms` — Legal (exists, proper metadata)
- 🔴 **DUPLICATE ALERT:** `/how-it-works` vs `/how-it-works-page` (consolidate)

### AUTOMATION SERVICE ROUTES (SEO-indexed)
- `/lead-capture-automation`
- `/missed-call-text-back`
- `/ai-lead-follow-up`
- `/appointment-booking-automation`
- `/review-automation`
- `/customer-reactivation`

**Status:** Use `AutomationServicePage` component, should link back to `/automations`

### CLIENT ONBOARDING PAGES (Public, but conversion-focused)
- ⚠️ `/setup` — Business Setup (needs design alignment)
- ⚠️ `/setup/credentials` — Credentials Setup (needs clarity)
- ⚠️ `/setup/status` — Setup Status (needs alignment)
- ⚠️ `/setup/preview` — Website Preview (needs alignment)
- ⚠️ `/onboarding` — Onboarding (needs design system)
- ⚠️ `/leads/capture` — Capture Leads (needs alignment)
- ⚠️ `/success` — Success (needs alignment)
- ⚠️ `/order-success` — Order Success (needs alignment)
- ⚠️ `/thank-you` — Thank You (needs alignment)

### CLIENT PROTECTED PAGES (Auth required)
- ✅ `/client-portal` — Client Portal (protected)
- ✅ `/client-dashboard` — Client Dashboard (protected)
- ✅ `/client-saas` — Client SaaS Dashboard (protected)
- ✅ `/dashboard-entry` — Dashboard Entry (protected)
- ✅ `/setup-lookup` — Client Setup Lookup (protected)

### ADMIN / INTERNAL PAGES (Admin-gated)
- `/admin` → `AdminDashboard`
- `/admin/leads/:leadId` → `AdminLeadDetail`
- `/admin/automations` → `AdminAutomation`
- `/admin/onboarding` → `AdminOnboarding`
- `/admin/install-guide` → `AdminInstallGuide`
- `/admin/ai-sales` → `AISalesCommandCenter`
- `/admin/performance-wars` → `PerformanceWars`
- `/admin/onboarding-pipeline` → `OnboardingPipeline`
- `/admin/logs` → `MissionControlLogs`
- `/saas/admin` → `SaaSAdminPanel`
- `/admin/opportunity-review` → `OpportunityReviewQueue`
- `/admin/audit` → `FunctionAudit`
- `/admin/reconciliation` → `AdminReconciliation`
- `/admin/system-observability` → `SystemObservabilityDashboard`
- `/admin/funnel-optimization` → `FunnelOptimizationPage`
- `/mission-control` → Redirect to `/admin`

**Redirects via PATH_EXPLICIT_MAP:**
- `/Dashboard` → `/mission-control`
- `/AdminSettings` → `/mission-control`
- `/LeadIntelligence` → `/admin`
- `/Sam` → `/admin`
- `/MedSpaDashboard` → `/admin`

### AUTH PAGES (Public, no-index)
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

---

## DESIGN DEBT ASSESSMENT

### 🔴 HIGH PRIORITY (blocks visual unity)
1. **Book.jsx** — Custom blue shell styling, may conflict with new dark navy system
2. **PricingPageContent** — Needs review for color/contrast alignment
3. **Automations.jsx** — Likely uses old styling, needs dark-system refresh
4. **Store.jsx** — Needs visual alignment with pricing/dark theme

### 🟡 MEDIUM PRIORITY (visual consistency)
1. **Contact.jsx** — Needs form styling + CTAs aligned
2. **About.jsx** — Needs hero/typography alignment
3. **FAQ** — Needs dark background + white text
4. **Testimonials** — Needs design system alignment
5. **Individual industry pages** — Need consistent dark/cyan system
6. **OurSystemPage** — Needs review
7. **Blog** — Likely uses old styling

### 🟢 LOW PRIORITY (functional but refinable)
1. **Client onboarding pages** — Functional, but typography/spacing can be tightened
2. **Admin pages** — Functional, just need noindex + title consistency

---

## DESIGN SYSTEM CONSOLIDATION TARGETS

### Colors (Established in index.css)
- **Background:** `#061025` (dark navy hero)
- **Secondary Navy:** `#08142C`
- **Card Background:** `rgba(8, 20, 44, 0.72)`
- **Primary Text:** `#FFFFFF`
- **Soft Body Text:** `#AEB8C8`
- **Muted Text:** `#7F8DA3`
- **Cyan Accent:** `#35BDF1`
- **Button Blue:** `#0079CC`
- **Button Glow:** `#00AEEF`
- **Border Glow:** `rgba(53, 189, 241, 0.25)`

### Typography (via SectionHeader + CSS)
- **Eyebrow:** 11px, uppercase, letter-spacing 0.2em, cyan
- **Section Title:** clamp(1.85rem, 4.2vw, 2.9rem), Montserrat 800, black (or white if dark bg)
- **Section Subtitle:** clamp(1rem, 1.7vw, 1.1rem), Inter 400, soft gray
- **Body Copy:** Inter 400, #FFFFFF (on dark), #3a3d47 (on light)
- **Form Labels:** 0.65rem, uppercase, 0.1em letter-spacing

### Components to Standardize
- **Glass Cards:** `backdrop-blur: 20px`, `rgba(255,255,255,0.07)` bg
- **CTA Buttons:** gradient blue, white text, electric glow
- **Section Containers:** max-width 1200px, padding 6rem top/bottom (desktop)
- **Hero Sections:** dark navy background, white headings, cyan accents

---

## DUPLICATE PAGE RESOLUTION

| Issue | Current | Action |
|-------|---------|--------|
| `/how-it-works` vs `/how-it-works-page` | Both exist | Consolidate to `/how-it-works` |
| `/product` vs `/product-signup` | Both exist | Keep distinct: `/product` = info, `/product-signup` = form |
| `/client-dashboard` vs `/dashboard-entry` | Both protected | Keep distinct: entry = landing, dashboard = full portal |
| `/client-saas` vs `/client-dashboard` | Both protected | Review purpose overlap, consider deprecating one |
| `/contact` vs `/book` | Both exist | Keep distinct: book = free audit form, contact = inquiry form |

---

## ACCEPTANCE CRITERIA FOR PHASES 1-8

After completion, verify:
- ✅ No black text on dark navy backgrounds
- ✅ All CTAs have consistent blue-gradient styling + glow
- ✅ All public pages use dark navy + white + cyan system
- ✅ Section headers use SectionHeader component or equivalent
- ✅ No horizontal overflow on mobile
- ✅ Glass cards consistent across pages
- ✅ Form fields styled consistently
- ✅ Admin pages remain protected and functional
- ✅ Client onboarding pages remain protected and functional
- ✅ Checkout links still work
- ✅ Contact/free-audit forms still work
- ✅ Hero automation buttons still link correctly
- ✅ No route redirection loops
- ✅ SEO metadata updated per page
- ✅ Noindex applied to admin/internal pages where supported

---

## NEXT STEPS
1. **Phase 1:** Lock design tokens (done in index.css)
2. **Phase 2:** Refine public marketing pages (Book, Automations, Pricing, Contact, etc.)
3. **Phase 3:** Priority public pages (Automations, Pricing, Book, Contact, Industries)
4. **Phase 4:** Client/onboarding pages
5. **Phase 5:** Admin route cleanup
6. **Phase 6:** Duplicate page consolidation
7. **Phase 7:** SEO metadata
8. **Phase 8:** Final QA