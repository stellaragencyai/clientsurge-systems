/**
 * SaaS Upgrade Audit — 30-item checklist scored against the live ClientSurge site.
 * Status: "green" = implemented | "yellow" = partial | "red" = missing | "na" = not applicable
 */
export const SAAS_AUDIT_CATEGORIES = [
  { id: 1, name: "First Impressions & Onboarding", items: "1–6" },
  { id: 2, name: "Navigation & Information Architecture", items: "7–12" },
  { id: 3, name: "Core Product Experience", items: "13–18" },
  { id: 4, name: "Conversion Flows & Friction", items: "19–23" },
  { id: 5, name: "Trust & Credibility Signals", items: "24–27" },
  { id: 6, name: "Performance & Accessibility", items: "28–30" },
];

export const SAAS_AUDIT_ITEMS = [
  // Category 1
  { id: 1, cat: 1, title: "Five-second homepage clarity test", status: "green", note: "Headline clearly points visitors to compare packaged AI lead systems and start checkout." },
  { id: 2, cat: 1, title: "Time to first value", status: "green", note: "Product-signup flow is direct; no empty gate between purchase and portal." },
  { id: 3, cat: 1, title: "Empty state experience", status: "green", note: "EmptyState component + EmptyStateDashboard deployed in portal dashboards." },
  { id: 4, cat: 1, title: "Progress indicators in multi-step flows", status: "green", note: "QuickStartInline progress bar, CheckoutStepper, CheckoutProgress all present." },
  { id: 5, cat: 1, title: "Signup friction audit", status: "green", note: "Login/Register use email+password + Google OAuth; minimal required fields." },
  { id: 6, cat: 1, title: "First email relevance", status: "green", note: "sendClientWelcomeEmail + sendPortalWelcomeEmail route users to portal, not generic homepage." },
  // Category 2
  { id: 7, cat: 2, title: "Primary navigation audit", status: "green", note: "Nav ordered by visit frequency: Solutions → Industries → Pricing → Store." },
  { id: 8, cat: 2, title: "Search functionality", status: "yellow", note: "AdminGlobalSearch exists in admin; Store has product search. No site-wide public search bar in navbar." },
  { id: 9, cat: 2, title: "Breadcrumb and back navigation", status: "yellow", note: "Breadcrumb component exists with schema markup but not deployed on all key pages (Pricing, Store, FAQ)." },
  { id: 10, cat: 2, title: "Settings discoverability", status: "green", note: "Client Portal button in navbar; footer links to all key pages; settings within portal sidebar." },
  { id: 11, cat: 2, title: "Mobile navigation", status: "green", note: "Mobile drawer with 44px touch targets enforced globally in CSS; safe-area insets handled." },
  { id: 12, cat: 2, title: "Error state navigation", status: "green", note: "PageNotFound has search bar, suggested pages, and a demo booking CTA — no dead ends." },
  // Category 3
  { id: 13, cat: 3, title: "Feature discoverability", status: "green", note: "Automation pills in hero, SixAutomationsSection, Industries section all surface features on first scroll." },
  { id: 14, cat: 3, title: "Loading and skeleton states", status: "green", note: "LoadingState, SkeletonLoader, SectionSkeleton, PortalLoadingSkeleton all deployed with 2.2s sheen." },
  { id: 15, cat: 3, title: "Inline help and tooltips", status: "yellow", note: "No systematic tooltip system on complex portal features. Help is in SupportChat, not embedded at point of use." },
  { id: 16, cat: 3, title: "Data visualisation clarity", status: "green", note: "RevenueMetricsPanel and RealTimeMetricsPanel use clear KPI hierarchy with labeled stat cards." },
  { id: 17, cat: 3, title: "Keyboard accessibility", status: "green", note: "Global focus-visible ring, skip-to-content link, Escape closes drawers/dropdowns, tab order preserved." },
  { id: 18, cat: 3, title: "Responsive behaviour at breakpoints", status: "green", note: "Extensive responsive CSS covering 380px–1920px, iPad/tablet breakpoints, landscape fixes." },
  // Category 4
  { id: 19, cat: 4, title: "Upgrade flow audit", status: "green", note: "CheckoutButton → product-signup → CheckoutStepper (5 steps) → confirmation. Click count is low." },
  { id: 20, cat: 4, title: "Paywall positioning", status: "na", note: "Not applicable — ClientSurge is a storefront (direct purchase), not a freemium SaaS with usage limits." },
  { id: 21, cat: 4, title: "Form validation patterns", status: "green", note: "Forms use inline field-level validation with actionable error messages (e.g. 'Email already in use, sign in instead')." },
  { id: 22, cat: 4, title: "Checkout and payment flow", status: "green", note: "Stripe checkout with iframe guard, error handling, order confirmation email, post-purchase orchestrator." },
  { id: 23, cat: 4, title: "Trial expiry communication", status: "na", note: "Not applicable — no free trial. Direct purchase model with activation guarantee instead." },
  // Category 5
  { id: 24, cat: 5, title: "Social proof placement", status: "green", note: "Trust logos in hero, Testimonials page, CheckoutSocialProof component on checkout." },
  { id: 25, cat: 5, title: "Security and compliance signals", status: "yellow", note: "Footer has 'SSL Encrypted' badge. Missing: SOC 2 / GDPR / Stripe-secured badges near the billing form." },
  { id: 26, cat: 5, title: "Support accessibility", status: "green", note: "ChatBubble on every page, /contact page, support email + phone in footer, SupportChat in portal." },
  { id: 27, cat: 5, title: "Brand consistency check", status: "green", note: "Unified design system: Montserrat headings, #00AEEF primary, cs-btn-primary, cs-section-header everywhere." },
  // Category 6
  { id: 28, cat: 6, title: "Core Web Vitals", status: "green", note: "performanceMonitoring lib, lazy loading, image optimization, content-visibility: auto on below-fold sections." },
  { id: 29, cat: 6, title: "Colour contrast compliance", status: "green", note: "Pure black (#000) on white foreground; focus-visible ring at 4px; muted-foreground at 15% lightness." },
  { id: 30, cat: 6, title: "Cross-browser and cross-device testing", status: "green", note: "Vendor prefixes for backdrop-filter, -webkit-sticky, Safari transforms, Retina borders, iOS safe areas." },
];

export const STATUS_META = {
  green: { label: "Implemented", color: "#10B981", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.25)", icon: "check" },
  yellow: { label: "Partial", color: "#D4AF37", bg: "rgba(212,175,55,0.10)", border: "rgba(212,175,55,0.25)", icon: "alert" },
  red: { label: "Missing", color: "#EF4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)", icon: "x" },
  na: { label: "N/A", color: "#94A3B8", bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.25)", icon: "minus" },
};

export function getAuditSummary() {
  const counts = { green: 0, yellow: 0, red: 0, na: 0 };
  SAAS_AUDIT_ITEMS.forEach((item) => { counts[item.status] = (counts[item.status] || 0) + 1; });
  const scored = SAAS_AUDIT_ITEMS.filter((i) => i.status !== "na").length;
  const implemented = counts.green;
  const partial = counts.yellow;
  const missing = counts.red;
  const score = Math.round((implemented / scored) * 100);
  return { counts, scored, implemented, partial, missing, score };
}
