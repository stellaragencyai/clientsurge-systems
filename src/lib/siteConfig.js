import { PACKAGE_OFFERS, getPackageStorePath } from "./salesCatalog.js";

/**
 * Centralized site configuration and constants.
 * Package pricing and Stripe references are derived from salesCatalog.js.
 */

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

export const STRIPE_PRODUCTS = Object.fromEntries(
  PACKAGE_OFFERS.map((offer) => [
    offer.package_key.replace(/_system$/, ""),
    {
      name: offer.name,
      id: offer.stripe_product_id,
      setup: offer.setup_total,
      monthly: offer.monthly_total,
      checkout_url: getPackageStorePath(offer.package_key),
    },
  ])
);
