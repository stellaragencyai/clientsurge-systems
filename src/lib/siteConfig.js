/**
 * Centralized site configuration & constants.
 *
 * AREA 1 QA: CANONICAL PUBLIC NAVIGATION
 * Public header: Home -> / | AI Packages -> /pricing | Automations -> /automations |
 * Industries -> /industries | How It Works -> /how-it-works | Contact -> /contact |
 * Client Login -> /login | primary CTA -> /pricing
 *
 * AREA 1 QA: CANONICAL CTA DESTINATION MAP
 * "Compare Packages" / "Choose Your System" -> /pricing
 * "View Included Automations" -> /automations
 * "Get Help Choosing" / support CTAs -> /contact
 * "Client Login" -> /login
 * Phone CTAs -> tel:+16025843227
 * Email CTAs -> mailto:support@clientsurgesystems.com
 * Fallback buyer CTA -> /pricing
 *
 * AREA 1 QA: PUBLIC ROUTE CLASSIFICATION
 * Public marketing routes stay limited to buyer-facing pages. Internal/admin/setup
 * routes must not appear in header, footer, sitemap, or generated public route lists.
 */

const productSignupUrl = (packageKey) => `/product-signup?package=${packageKey}`;

export const SITE_CONFIG = {
  brand: {
    name: "ClientSurge Systems",
    tagline: "AI-Powered Sales Systems for Local Service Businesses",
  },
  navigation: {
    sections: [
      { label: "Home", href: "/", isPage: true },
      { label: "AI Packages", href: "/pricing", isPage: true },
      { label: "Automations", href: "/automations", isPage: true },
      { label: "Industries", href: "/industries", isPage: true },
      { label: "How It Works", href: "/how-it-works", isPage: true },
      { label: "Contact", href: "/contact", isPage: true },
    ],
    solutions: [
      { label: "Compare AI Packages", href: "/pricing", isPage: true },
      { label: "Included Automations", href: "/automations", isPage: true },
      { label: "How It Works", href: "/how-it-works", isPage: true },
      { label: "Talk to ClientSurge", href: "/contact", isPage: true },
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
    help: "/contact",
    contact: "/contact",
    privacyPolicy: "/privacy",
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