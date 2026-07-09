export const PUBLIC_ROUTE_METADATA = {
  "/": {
    key: "home",
    title: "ClientSurge Systems | AI-Powered Sales Systems for Local Businesses",
    description:
      "ClientSurge Systems installs AI automation for local service businesses, including lead capture, missed-call recovery, AI follow-up, appointment booking, review requests, and reactivation workflows.",
  },
  "/pricing": {
    key: "pricing",
    title: "Pricing | Starter, Growth, and Pro AI Automation Packages | ClientSurge Systems",
    description:
      "Compare ClientSurge Systems packages with clear setup fees, monthly subscription scope, install expectations, and support paths for AI automation services.",
  },
  "/automations": {
    key: "automations",
    title: "AI Automation Services | ClientSurge Systems",
    description:
      "Explore ClientSurge automation services for lead response, missed-call text-back, AI follow-up, booking, reviews, and customer reactivation.",
  },
  "/contact": {
    key: "contact",
    title: "Contact ClientSurge Systems | Questions and Support",
    description:
      "Contact ClientSurge Systems to ask questions, get support, or discuss AI voice agents, lead follow-up, booking automation, and local service business systems.",
  },
  "/industries": {
    key: "industries",
    title: "Industries Served | ClientSurge Systems",
    description:
      "See how ClientSurge Systems adapts AI automation workflows for service businesses such as HVAC, plumbing, roofing, med spas, dental, legal intake, and home services.",
  },
  "/proof": {
    key: "proof",
    title: "Proof Standards and Trust Labels | ClientSurge Systems",
    description:
      "Review ClientSurge Systems proof standards, verified evidence labels, workflow previews, and the claims we will not publish without support.",
  },
  "/faq": {
    key: "faq",
    title: "FAQ | ClientSurge Systems",
    description:
      "Answers to common questions about ClientSurge Systems packages, setup, AI automation workflows, billing, support, and implementation.",
  },
  "/how-it-works": {
    key: "how-it-works",
    title: "How It Works | ClientSurge Systems",
    description:
      "Learn how ClientSurge Systems turns a business website into a lead capture, response, booking, follow-up, review, and reactivation system.",
  },
  "/about": {
    key: "about",
    title: "About ClientSurge Systems",
    description:
      "Learn about ClientSurge Systems and its done-for-you AI automation systems for local service businesses.",
  },
  "/blog": {
    key: "blog",
    title: "Blog | ClientSurge Systems",
    description:
      "Read ClientSurge Systems articles about AI automation, lead capture, follow-up, booking workflows, reviews, and local service business growth systems.",
  },
  "/testimonials": {
    key: "testimonials",
    title: "Workflow Scenarios and Trust Signals | ClientSurge Systems",
    description:
      "Review ClientSurge Systems workflow scenarios and trust signals. These previews are not client testimonials unless clearly labeled as verified customer quotes.",
  },
  "/roadmap": {
    key: "roadmap",
    title: "Automation Roadmap | ClientSurge Systems",
    description:
      "Review the ClientSurge Systems automation roadmap and planned improvements without treating unverified future items as live proof.",
  },
  "/privacy": {
    key: "privacy",
    title: "Privacy Policy | ClientSurge Systems",
    description:
      "Read the ClientSurge Systems privacy policy covering lead forms, SMS communications, AI voice and call automation, analytics, payment processors, account deletion, data retention, and privacy rights.",
  },
  "/terms": {
    key: "terms",
    title: "Terms of Service | ClientSurge Systems",
    description:
      "Review the ClientSurge Systems terms of service covering AI automation services, subscriptions, payments, acceptable use, limitations, and customer responsibilities.",
  },
  "/sms-terms": {
    key: "sms-terms",
    title: "SMS Terms and Consent | ClientSurge Systems",
    description:
      "Read the ClientSurge Systems SMS terms covering opt-in consent, message frequency, message and data rates, STOP opt-out instructions, HELP support, and communication preferences.",
  },
  "/refund-policy": {
    key: "refund-policy",
    title: "Refund and Cancellation Policy | ClientSurge Systems",
    description:
      "Read the ClientSurge Systems refund and cancellation policy covering setup work, monthly subscriptions, prospective cancellation, and billing support.",
  },
};

export const STATIC_ROUTE_ALIASES = {
  "/privacy-policy": "/privacy",
  "/account-deletion": "/privacy#account-deletion",
  "/delete-account": "/privacy#account-deletion",
  "/data-deletion": "/privacy#data-deletion-request",
  "/legal/privacy": "/privacy",
  "/legal/terms": "/terms",
  "/legal/sms": "/sms-terms",
  "/legal/refund": "/refund-policy",
  "/automation-roadmap": "/roadmap",
  "/product-landing": "/pricing",
  "/product-sign-up": "/product-signup",
  "/product_signup": "/product-signup",
  "/signup": "/product-signup",
  "/client-dashboard": "/client-portal",
  "/ClientPortal": "/client-portal",
  "/Dashboard": "/admin",
  "/AdminSettings": "/admin",
  "/AdminLeadDetail": "/admin/leads",
  "/LeadIntelligence": "/admin",
  "/Sam": "/admin",
  "/MedSpaDashboard": "/admin",
  "/WebsiteSpecPreview": "/setup/preview",
  "/NotFound": "/",
};

/**
 * ADMIN/INTERNAL NOTE — Package Checkout Canonical Route
 *
 * There is exactly ONE canonical public package checkout route:
 *   /product-signup?package={starter_system|growth_system|pro_system}
 *
 * Product signup is a public buyer utility route, but it is intentionally
 * noindex and excluded from the sitemap. Marketing pages should lead users to
 * /pricing first unless they are selecting a specific package.
 *
 * The /store route is for browsing individual services only — it must NOT
 * be used as a primary package checkout path.
 *
 * App ID: 69dc4a79656fdba136d413d3
 */

export const LEGACY_REDIRECTS = Object.entries(STATIC_ROUTE_ALIASES);

// Public directory output is intentionally narrower than all routes the React app
// can render. This is the only set allowed in public page lists, sitemaps, and
// static fallbacks. Utility routes remain noindex and must never appear as public
// marketing navigation.
export const PUBLIC_DIRECTORY_PAGES = [
  "/",
  "/pricing",
  "/automations",
  "/industries",
  "/proof",
  "/contact",
  "/privacy",
  "/terms",
  "/sms-terms",
  "/refund-policy",
];

export const PUBLIC_ROUTE_PATHS = [...PUBLIC_DIRECTORY_PAGES];

export const APP_SHELL_PUBLIC_UTILITY_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/opt-out",
  "/account-deletion",
  "/delete-account",
  "/data-deletion",
  "/product",
  "/product-signup",
  "/product-sign-up",
  "/product_signup",
  "/signup",
  "/start",
  "/book",
  "/book-demo",
  "/store",
  "/faq",
  "/how-it-works",
  "/about",
  "/blog",
  "/testimonials",
  "/roadmap",
];

// Routes the React shell may render without treating the visitor as an admin.
// Client/dashboard/setup surfaces are intentionally excluded here because they
// are authenticated/private surfaces and should never appear in public route
// directories, sitemap output, or public-safe fallbacks.
export const APP_SHELL_PUBLIC_PATHS = [
  ...PUBLIC_ROUTE_PATHS,
  ...APP_SHELL_PUBLIC_UTILITY_PATHS,
];

export const AUTHENTICATED_ROUTE_PREFIXES = [
  "/client-portal",
  "/client-dashboard",
  "/client-saas",
  "/dashboard-entry",
  "/onboarding",
  "/setup",
  "/setup/credentials",
  "/setup/status",
  "/setup/preview",
  "/setup-lookup",
];

export const ADMIN_ROUTE_PREFIXES = [
  "/admin",
  "/admin-settings",
  "/adminsettings",
  "/admindashboard",
  "/adminleaddetail",
  "/aistatusdashboard",
  "/dashboard",
  "/lead-intelligence",
  "/leadintelligence",
  "/sam",
  "/medspa-dashboard",
  "/medspadashboard",
  "/mission-control",
  "/saas/admin",
  "/saas",
];

export const INTERNAL_ROUTE_PREFIXES = [
  "/_generated",
  "/pages",
  "/functions",
  "/function",
  "/internal",
  "/private",
  "/install",
  "/audit",
  "/observability",
  "/reconciliation",
  "/base44",
  "/api",
  "/api/apps",
  "/motion-lab",
  "/motionlab",
  "/performancewars",
  "/websitepreview",
  "/websitespecpreview",
  "/businesssetup",
  "/credentialssetup",
  "/setupstatus",
  "/admin/aistatusdashboard",
];

export const NOINDEX_ROUTE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/opt-out",
  "/account-deletion",
  "/delete-account",
  "/data-deletion",
  "/book",
  "/book-demo",
  "/start",
  "/store",
  "/product",
  "/product-signup",
  "/product-sign-up",
  "/product_signup",
  "/signup",
  "/success",
  "/order-success",
  "/thank-you",
  "/setup-lookup",
  "/launch-control",
  "/leads/capture",
  "/faq",
  "/how-it-works",
  "/about",
  "/blog",
  "/testimonials",
  "/roadmap",
  ...AUTHENTICATED_ROUTE_PREFIXES,
  ...ADMIN_ROUTE_PREFIXES,
  ...INTERNAL_ROUTE_PREFIXES,
];

export const SITEMAP_STATIC_PATHS = [...PUBLIC_DIRECTORY_PAGES];

export const BLOG_SITEMAP_PATHS = [];

export const ROBOTS_DISALLOW_PATHS = [
  "/_generated",
  "/_generated/",
  "/pages",
  "/pages/",
  "/admin",
  "/admin/",
  "/admin-settings",
  "/adminsettings",
  "/dashboard",
  "/dashboard/",
  "/client-portal",
  "/client-portal/",
  "/client-dashboard",
  "/client-dashboard/",
  "/client-saas",
  "/client-saas/",
  "/dashboard-entry",
  "/dashboard-entry/",
  "/setup",
  "/setup/",
  "/setup/credentials",
  "/setup/preview",
  "/setup/status",
  "/functions",
  "/functions/",
  "/function",
  "/function/",
  "/internal",
  "/internal/",
  "/private",
  "/private/",
  "/onboarding",
  "/onboarding/",
  "/install",
  "/install/",
  "/audit",
  "/audit/",
  "/observability",
  "/observability/",
  "/reconciliation",
  "/reconciliation/",
  "/api/",
  "/base44/",
  "/saas",
  "/saas/",
  "/mission-control",
  "/lead-intelligence",
  "/leadintelligence",
  "/sam",
  "/medspa-dashboard",
  "/medspadashboard",
  "/setup-lookup",
  "/account-deletion",
  "/delete-account",
  "/data-deletion",
  "/product-signup",
];
