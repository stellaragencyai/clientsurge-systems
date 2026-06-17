import { SIX_AUTOMATIONS } from "./sixAutomations.js";

export const PUBLIC_ROUTE_METADATA = {
  "/": {
    key: "home",
    title: "AI Automation Systems for Local Leads | ClientSurge Systems",
    description:
      "AI-powered websites, voice agents, missed-call recovery, lead follow-up, and booking automation for local service businesses that want more booked jobs.",
  },
  "/automations": {
    key: "automations",
    title: "AI Automation Systems for Local Service Businesses | ClientSurge Systems",
    description:
      "ClientSurge installs AI automation systems that capture, follow up with, qualify, book, and reactivate leads for local service businesses.",
  },
  "/about": {
    key: "about",
    title: "About ClientSurge Systems | AI Automation for Local Businesses",
    description:
      "Learn how ClientSurge Systems combines conversion-focused websites, AI voice agents, lead follow-up, booking automation, and recovery workflows for local service businesses.",
  },
  "/book": {
    key: "book",
    title: "Book Your Free ClientSurge Automation Audit | ClientSurge Systems",
    description:
      "Book a free audit to review missed-call leakage, speed-to-lead gaps, website conversion, follow-up gaps, booking friction, and practical automation opportunities.",
  },
  "/contact": {
    key: "contact",
    title: "Contact ClientSurge Systems | AI Automation Questions",
    description:
      "Contact ClientSurge Systems about AI voice agents, lead capture, missed-call recovery, booking automation, and local service business automation.",
  },
  "/pricing": {
    key: "pricing",
    title: "Pricing | ClientSurge Systems",
    description:
      "Compare ClientSurge automation packages, setup pricing, monthly management, and what is included for local service businesses.",
  },
  "/faq": {
    key: "faq",
    title: "Frequently Asked Questions | ClientSurge Systems",
    description:
      "Answers about ClientSurge setup, pricing, integrations, support, billing, cancellation, and SMS compliance.",
  },
  "/our-system": {
    key: "our-system",
    title: "Our System | ClientSurge Systems",
    description:
      "See how the ClientSurge system captures leads, follows up faster, recovers missed calls, books appointments, and reactivates old opportunities.",
  },
  "/testimonials": {
    key: "testimonials",
    title: "Launch Scenarios & Testimonials | ClientSurge Systems",
    description:
      "See the launch scenarios, workflow outcomes, and proof-oriented testimonial framing ClientSurge uses for med spas, HVAC, dental, and local service businesses.",
  },
  "/blog": {
    key: "blog",
    title: "ClientSurge Blog | AI Automation for Local Service Businesses",
    description:
      "Guides on missed-call recovery, AI lead follow-up, AI voice agents, local service business automation, conversion systems, and booking automation.",
  },
  "/store": {
    key: "store",
    title: "AI Automation Store | ClientSurge Systems",
    description:
      "Compare ClientSurge packages, automation systems, and done-for-you launch options for local service businesses.",
  },
  "/start": {
    key: "start",
    title: "Start Your AI Automation Audit | ClientSurge Systems",
    description:
      "Begin the guided ClientSurge audit flow to review lead response, follow-up, and booking gaps in your service business.",
  },
  "/industries": {
    key: "industries",
    title: "Industries We Help | ClientSurge Systems",
    description:
      "AI automation systems for roofing, HVAC, dental, med spa, chiropractic, contractor, and local service businesses.",
  },
  "/roofing": {
    key: "roofing",
    title: "Roofing Automation Systems | ClientSurge Systems",
    description:
      "AI automation for roofing companies: storm-season lead surges, missed-call recovery, inspection booking, estimate follow-up, storm-damage routing, and old estimate reactivation.",
  },
  "/hvac": {
    key: "hvac",
    title: "HVAC Automation Systems | ClientSurge Systems",
    description:
      "AI automation for HVAC companies: emergency call handling, seasonal demand spikes, missed-call recovery, estimate follow-up, service reminders, and maintenance plan automation.",
  },
  "/plumbing": {
    key: "plumbing",
    title: "Plumbing Automation Systems | ClientSurge Systems",
    description:
      "AI automation for plumbing companies: emergency leak calls, drain repair requests, water heater inquiries, missed-call recovery, after-hours lead capture, and dispatch handoff.",
  },
  "/dental": {
    key: "dental",
    title: "Dental Automation Systems | ClientSurge Systems",
    description:
      "AI automation for dental practices: new patient booking, emergency dental inquiries, missed appointment recovery, treatment-plan follow-up, and review automation.",
  },
  "/med-spa": {
    key: "med-spa",
    title: "Med Spa Automation Systems | ClientSurge Systems",
    description:
      "AI automation for med spas: consultation booking, package lead nurture, membership follow-up, no-show reduction, review requests, and old inquiry reactivation.",
  },
  "/chiropractic": {
    key: "chiropractic",
    title: "Chiropractic Automation Systems | ClientSurge Systems",
    description:
      "AI automation for chiropractic clinics: new patient intake, appointment reminders, unfinished care plan follow-up, reactivation campaigns, and review automation.",
  },
  "/contractors": {
    key: "contractors",
    title: "Contractor Automation Systems | ClientSurge Systems",
    description:
      "AI automation for contractors: project inquiry routing, quote follow-up, missed-call recovery, estimate nurturing, and old opportunity reactivation.",
  },
  "/privacy-policy": {
    key: "privacy",
    title: "Privacy Policy | ClientSurge Systems",
    description:
      "Read the ClientSurge Systems privacy policy, including what data we collect, how data is used, cookies, third-party services, and contact information.",
  },
  "/terms": {
    key: "terms",
    title: "Terms of Service | ClientSurge Systems",
    description:
      "Review the ClientSurge Systems terms governing service access, billing, platform usage, and customer responsibilities.",
  },
  "/setup-lookup": {
    key: "setup-lookup",
    title: "Check Your Setup Progress | ClientSurge Systems",
    description:
      "Enter your email or order ID to see exactly where your AI automation system setup stands. No login required.",
  },
  "/login": {
    key: "login",
    title: "Client Login | ClientSurge Systems",
    description:
      "ClientSurge Systems client login for existing customers accessing their portal and automation dashboard.",
  },
  ...Object.fromEntries(
    SIX_AUTOMATIONS.map((automation) => [
      automation.routePath,
      {
        key: automation.slug,
        title: `${automation.title} | ClientSurge Systems`,
        description: `${automation.summary} See what it does, what triggers it, who it helps, and how it fits into the ClientSurge automation stack.`,
      },
    ])
  ),
};

export const STATIC_ROUTE_ALIASES = {
  "/Blog": "/blog",
  "/book-demo": "/book",
  "/IndustriesPage": "/industries",
  "/IndustryTemplate": "/industries",
  "/Roofing": "/roofing",
  "/ROOFING": "/roofing",
  "/HVAC": "/hvac",
  "/Hvac": "/hvac",
  "/Plumbing": "/plumbing",
  "/PLUMBING": "/plumbing",
  "/Dental": "/dental",
  "/DENTAL": "/dental",
  "/MedSpa": "/med-spa",
  "/Med-Spa": "/med-spa",
  "/MED-SPA": "/med-spa",
  "/Chiropractic": "/chiropractic",
  "/CHIROPRACTIC": "/chiropractic",
  "/Contractors": "/contractors",
  "/CONTRACTORS": "/contractors",
  "/industries/roofing": "/roofing",
  "/industries/hvac": "/hvac",
  "/industries/plumbing": "/plumbing",
  "/industries/dental": "/dental",
  "/industries/med-spa": "/med-spa",
  "/industries/chiropractic": "/chiropractic",
  "/industries/contractors": "/contractors",
  "/legal/privacy": "/privacy-policy",
  "/legal/terms": "/terms",
};

export const LEGACY_REDIRECTS = [
  ["/Blog", "/blog"],
  ["/book-demo", "/book"],
  ["/IndustriesPage", "/industries"],
  ["/IndustryTemplate", "/industries"],
  ["/Roofing", "/roofing"],
  ["/ROOFING", "/roofing"],
  ["/HVAC", "/hvac"],
  ["/Hvac", "/hvac"],
  ["/Plumbing", "/plumbing"],
  ["/PLUMBING", "/plumbing"],
  ["/Dental", "/dental"],
  ["/DENTAL", "/dental"],
  ["/MedSpa", "/med-spa"],
  ["/Med-Spa", "/med-spa"],
  ["/MED-SPA", "/med-spa"],
  ["/Chiropractic", "/chiropractic"],
  ["/CHIROPRACTIC", "/chiropractic"],
  ["/Contractors", "/contractors"],
  ["/CONTRACTORS", "/contractors"],
  ["/industries/roofing", "/roofing"],
  ["/industries/hvac", "/hvac"],
  ["/industries/plumbing", "/plumbing"],
  ["/industries/dental", "/dental"],
  ["/industries/med-spa", "/med-spa"],
  ["/industries/chiropractic", "/chiropractic"],
  ["/industries/contractors", "/contractors"],
  ["/Dashboard", "/admin"],
  ["/AdminSettings", "/admin"],
  ["/AdminLeadDetail", "/admin?tab=leads"],
  ["/LeadIntelligence", "/admin"],
  ["/Sam", "/admin"],
  ["/MedSpaDashboard", "/admin"],
  ["/WebsiteSpecPreview", "/admin"],
  ["/legal/privacy", "/privacy-policy"],
  ["/legal/terms", "/terms"],
  ["/privacy", "/privacy-policy"],
  ["/product-landing", "/product"],
  ["/client-dashboard-entry", "/dashboard-entry"],
];

export const PUBLIC_ROUTE_PATHS = [
  "/",
  "/store",
  "/order-success",
  "/med-spa",
  "/dental",
  "/hvac",
  "/plumbing",
  "/roofing",
  "/contractors",
  "/chiropractic",
  "/lead-capture-automation",
  "/missed-call-text-back",
  "/ai-lead-follow-up",
  "/appointment-booking-automation",
  "/review-automation",
  "/customer-reactivation",
  "/start",
  "/book",
  "/book-demo",
  "/industries",
  "/industries/med-spa",
  "/industries/dental",
  "/industries/hvac",
  "/industries/plumbing",
  "/industries/roofing",
  "/industries/contractors",
  "/industries/chiropractic",
  "/pricing",
  "/faq",
  "/our-system",
  "/testimonials",
  "/privacy-policy",
  "/terms",
  "/login",
  "/success",
  "/legal",
  "/contact",
  "/blog",
  "/about",
  "/automations",
  "/leads/capture",
  "/thank-you",
  "/setup-lookup",
];

// App shell behavior is slightly broader than indexable/public SEO routes.
// Keep this list aligned with the legacy loading + cookie-consent behavior.
export const APP_SHELL_PUBLIC_PATHS = [
  ...PUBLIC_ROUTE_PATHS,
  "/onboarding",
  "/setup/preview",
  "/setup-lookup",
];

export const AUTHENTICATED_ROUTE_PREFIXES = [
  "/client-portal",
  "/client-dashboard",
  "/onboarding",
  "/setup",
  "/setup/credentials",
  "/setup/status",
];

export const ADMIN_ROUTE_PREFIXES = [
  "/admin",
  "/admin/leads",
  "/admin/automations",
  "/admin/onboarding",
  "/admin/install-guide",
  "/admin/ai-sales",
  "/admin/performance-wars",
  "/dashboard",
  "/admin-settings",
  "/lead-intelligence",
  "/sam",
  "/medspa-dashboard",
];

export const INTERNAL_ROUTE_PREFIXES = [
  "/motion-lab",
  "/setup/preview",
  "/admin/AIStatusDashboard",
];

export const NOINDEX_ROUTE_PREFIXES = [
  "/login",
  "/store",
  "/start",
  "/book-demo",
  ...AUTHENTICATED_ROUTE_PREFIXES,
  ...ADMIN_ROUTE_PREFIXES,
  ...INTERNAL_ROUTE_PREFIXES,
  "/order-success",
  "/success",
  "/thank-you",
  "/setup-lookup",
];

export const SITEMAP_STATIC_PATHS = [
  "/",
  "/about",
  "/automations",
  "/book",
  "/contact",
  "/blog",
  "/pricing",
  "/industries",
  "/roofing",
  "/hvac",
  "/plumbing",
  "/dental",
  "/med-spa",
  "/chiropractic",
  "/contractors",
  "/lead-capture-automation",
  "/missed-call-text-back",
  "/ai-lead-follow-up",
  "/appointment-booking-automation",
  "/review-automation",
  "/customer-reactivation",
  "/privacy-policy",
  "/terms",
  "/setup-lookup",
];

export const BLOG_SITEMAP_PATHS = [
  "/blog/missed-call-text-back-guide",
  "/blog/ai-lead-follow-up-automation",
  "/blog/med-spa-lead-response-automation",
  "/blog/dental-missed-call-automation",
  "/blog/contractor-lead-follow-up-system",
  "/blog/hvac-missed-call-text-back",
  "/blog/roofing-lead-response-automation",
  "/blog/ai-appointment-booking-local-business",
  "/blog/lead-response-speed-to-lead",
  "/blog/automation-package-comparison",
];

export const ROBOTS_DISALLOW_PATHS = [
  "/admin",
  "/admin/",
  "/AdminLeadDetail",
  "/AdminSettings",
  "/dashboard",
  "/dashboard/",
  "/Dashboard",
  "/client-portal",
  "/client-portal/",
  "/client-dashboard",
  "/client-dashboard/",
  "/ClientPortal",
  "/store",
  "/start",
  "/book-demo",
  "/setup",
  "/setup/",
  "/setup/credentials",
  "/setup/preview",
  "/setup/status",
  "/onboarding",
  "/onboarding/",
  "/order-success",
  "/success",
  "/thank-you",
  "/lead-intelligence",
  "/LeadIntelligence",
  "/sam",
  "/Sam",
  "/IndustryTemplate",
  "/MedSpaDashboard",
  "/WebsiteSpecPreview",
  "/NotFound",
  "/medspa-dashboard",
  "/leads/admin",
  "/api/",
  "/base44/",
];