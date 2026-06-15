/**
 * Centralized site configuration & constants
 * Replaces hardcoded strings scattered across Navbar, Footer, Pricing, etc.
 */

export const SITE_CONFIG = {
  brand: {
    name: "ClientSurge Systems",
    tagline: "AI Automation for Local Service Businesses",
  },
  navigation: {
    sections: [
      { label: "Pricing", href: "/pricing", isPage: true },
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
