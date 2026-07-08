/**
 * Centralized site configuration & constants
 * Replaces hardcoded strings scattered across Navbar, Footer, Pricing, etc.
 *
 * ── AREA 1 QA: CANONICAL PUBLIC NAVIGATION (PACKAGE-FIRST) ──
 * Public header: AI Packages→/pricing | Automations→/automations |
 *                Industries→/industries | How It Works→/#how-it-works |
 *                Contact→/contact | Login→/login | CTA→/pricing
 *
 * ── AREA 1 QA: CANONICAL CTA DESTINATION MAP ──
 * "Compare Packages"                → /pricing
 * "Choose Your System"              → /pricing
 * "View Included Automations"       → /automations
 * "Get Help Choosing"               → /book
 * "Contact Us" / support CTAs       → /contact
 * "Client Login"                    → /login
 * Phone CTAs                        → tel:+16025843227
 * Email CTAs                        → mailto:support@clientsurgesystems.com
 * Fallback (buyer CTA)              → /pricing
 * Fallback (support CTA)            → /contact
 *
 * ── AREA 1 QA: PUBLIC ROUTE CLASSIFICATION ──
 * PUBLIC: / /pricing /automations /industries /about /contact /book
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
 * Platform | Company links only
 */

const productSignupUrl = (packageKey) => `/product-signup?package=${packageKey}`;

export const SITE_CONFIG = {
  brand: {
    name: "ClientSurge Systems",
    tagline: "Turn your website into an AI sales system",
  },
  navigation: {
    sections: [
      { label: "Home", href: "/", isPage: true },
      { label: "Browse Systems", href: "/pricing", isPage: true },
      { label: "Store", href: "/store", isPage: true },
      { label: "Automations", href: "/automations", isPage: true },
      { label: "Proof", href: "/proof", isPage: true },
      { label: "Contact", href: "/contact", isPage: true },
    ],
    solutions: [
      { label: "Browse Systems", href: "/pricing", isPage: true },
      { label: "Automation Store", href: "/store", isPage: true },
      { label: "Automations", href: "/automations", isPage: true },
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
    packages: "/pricing",
    automations: "/automations",
    help: "/book",
    contact: "/contact",
    privacyPolicy: "/privacy-policy",
    terms: "/terms",
    login: "/login",
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
    checkout_url: productSignupUrl("starter_system"),
  },
  growth: {
    name: "Growth System",
    id: "prod_UReWhZsWks1HuA",
    setup: 1297,
    monthly: 997,
    checkout_url: productSignupUrl("growth_system"),
  },
  pro: {
    name: "Pro System",
    id: "prod_UReW1LmsVbn4BZ",
    setup: 2497,
    monthly: 1997,
    checkout_url: productSignupUrl("pro_system"),
  },
};