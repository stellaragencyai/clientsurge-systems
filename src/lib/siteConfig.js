/**
 * Centralized site configuration & constants
 * Replaces hardcoded strings scattered across Navbar, Footer, Pricing, etc.
 *
 * ── AREA 1 QA: CANONICAL PUBLIC NAVIGATION ──
 * Public header: Automations→/automations | AI Services→/store | Industries→/industries |
 *                About→/about | Contact→/contact | Login→/login | CTA→/store
 *
 * ── AREA 1 QA: CANONICAL CTA DESTINATION MAP ──
 * "Browse AI Services"             → /store
 * "View Automation Categories"     → /automations
 * "Get Help Choosing"              → /book
 * "View Pricing" / "See Packages"  → /pricing
 * "Contact Us" / support CTAs      → /contact
 * "Client Login"                   → /login
 * Phone CTAs                       → tel:+16025843227
 * Email CTAs                       → mailto:support@clientsurgesystems.com
 * Fallback (buyer CTA)             → /store
 * Fallback (support CTA)           → /contact
 *
 * ── AREA 1 QA: PUBLIC ROUTE CLASSIFICATION ──
 * PUBLIC: / /automations /pricing /store /industries /about /contact /book
 *         /privacy-policy /terms /login /faq /blog /testimonials /start /setup-lookup
 *         /roofing /hvac /plumbing /dental /med-spa /chiropractic /contractors
 *         /lead-capture-automation /missed-call-text-back /ai-lead-follow-up
 *         /appointment-booking-automation /review-automation /customer-reactivation
 *         /success /onboarding /leads/capture /legal/:type /order-success
 *         /thank-you /setup /setup/* /product /signup /our-system /library /register
 *         /reset-password /forgot-password
 * AUTH_PUBLIC: /login /register /forgot-password /reset-password
 * PROTECTED_CLIENT: /client-portal /client-dashboard /dashboard-entry
 * PROTECTED_ADMIN: /admin/* /mission-control /saas/admin
 * DEPRECATED: /product /signup /our-system /library (template pages, redirect or sunset)
 *
 * ── FOOTER: PUBLIC LINKS ONLY (no admin/dashboard/setup/internal) ──
 * Home | Automations | Pricing | Industries | About | Contact | Privacy | Terms | Login
 */

export const SITE_CONFIG = {
  brand: {
    name: "ClientSurge Systems",
    tagline: "AI Automation for Local Service Businesses",
  },
  navigation: {
    sections: [
      { label: "Pricing", href: "/pricing", isPage: true },
      { label: "Industries", href: "/industries", isPage: true },
      { label: "About", href: "/about", isPage: true },
      { label: "Contact", href: "/contact", isPage: true },
    ],
    solutions: [
      { label: "Automations", href: "/automations", isPage: true },
      { label: "Pricing", href: "/pricing", isPage: true },
    ],
  },
  industries: [
    { label: "Med Spas & Aesthetic Clinics", href: "/med-spa" },
    { label: "Dental & Orthodontics", href: "/dental" },
    { label: "Chiropractic & Physical Therapy", href: "/chiropractic" },
    { label: "HVAC, Plumbing & Home Services", href: "/hvac" },
    { label: "Plumbing & Drain Services", href: "/plumbing" },
    { label: "Roofing & Restoration", href: "/roofing" },
    { label: "Contractors & Trades", href: "/contractors" },
  ],
  links: {
    demoBooking: "/book",
    pricing: "/pricing",
    automations: "/automations",
    store: "/store",
    contact: "/contact",
    privacyPolicy: "/privacy-policy",
    terms: "/terms",
  },
  social: {
    twitter: "https://twitter.com/clientsurge",
    linkedin: "https://linkedin.com/company/clientsurge",
    github: "https://github.com/clientsurge",
  },
};

export const COLORS = {
  primary: "#00AEEF",
  darkPrimary: "#003B8F",
  electric: "#009FD4",
  foreground: "#001B44",
};

export const STRIPE_PRODUCTS = {
  starter: {
    name: "Starter System",
    id: "prod_UReWMpnZsCnfcL",
    setup: 797,
    monthly: 497,
  },
  growth: {
    name: "Growth System",
    id: "prod_UReWhZsWks1HuA",
    setup: 1297,
    monthly: 997,
  },
  pro: {
    name: "Pro System",
    id: "prod_UReW1LmsVbn4BZ",
    setup: 2497,
    monthly: 1997,
  },
};