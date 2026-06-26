/**
 * SEO Hardening Utilities
 * Fixes FLAW #71: Missing alt tags on marketing images.
 * Fixes FLAW #72: Trailing slash inconsistency.
 * Fixes FLAW #73: Meta descriptions too long for SERP.
 * Fixes FLAW #74: Sitemap contains orphaned admin routes.
 * Fixes FLAW #75: Missing structured data for Automation Service pages.
 */

// ═══════════════════════════════════════════════════════════════
// FLAW #71: Centralized alt text for all marketing images
// ═══════════════════════════════════════════════════════════════

const IMAGE_ALT_TEXT = {
  // Logo
  logo: "ClientSurge Systems — AI Lead Automation Platform",
  // Hero images
  heroDashboard: "ClientSurge dashboard showing live lead capture, response times, and booked appointments",
  // Industry images
  roofingHero: "Roofer using ClientSurge to capture and respond to storm damage leads automatically",
  hvacHero: "HVAC technician receiving automated lead response for emergency AC repair calls",
  dentalHero: "Dental office using ClientSurge for new patient lead capture and appointment booking",
  medSpaHero: "Med spa using ClientSurge to capture consultation requests and follow up automatically",
  plumbingHero: "Plumber receiving automated emergency service lead response from ClientSurge",
  chiropracticHero: "Chiropractor using ClientSurge to capture and book new patient appointments",
  contractorsHero: "General contractor using ClientSurge to manage project inquiry leads and follow-ups",
  realEstateHero: "Real estate agent using ClientSurge to capture and respond to property inquiries",
  personalInjuryHero: "Personal injury attorney using ClientSurge to capture and follow up with case leads",
  // Tool logos
  twilioLogo: "Twilio SMS integration for automated lead response",
  stripeLogo: "Stripe payment integration for secure checkout",
  openaiLogo: "OpenAI integration for AI-powered lead qualification",
  zapierLogo: "Zapier integration for connecting ClientSurge to external tools",
  resendLogo: "Resend email integration for automated lead follow-up emails",
  calendlyLogo: "Calendly integration for automated appointment booking",
  // Misc
  moneyBackGuarantee: "30-day money-back guarantee badge",
  trustShield: "SSL encrypted secure checkout badge",
};

/**
 * Get alt text for a known image key.
 * @param {string} key - Image key from IMAGE_ALT_TEXT
 * @returns {string} Alt text
 */
export function getAltText(key) {
  return IMAGE_ALT_TEXT[key] || "ClientSurge Systems";
}

/**
 * Generate alt text for dynamic images (e.g., user-uploaded content).
 * @param {string} context - Context description
 * @param {string} fallback - Fallback text
 * @returns {string}
 */
export function generateAltText(context, fallback = "") {
  if (!context) return fallback || "ClientSurge Systems";
  return `${context} | ClientSurge Systems`;
}

// ═══════════════════════════════════════════════════════════════
// FLAW #72: Canonical URL normalization (trailing slash consistency)
// ═══════════════════════════════════════════════════════════════

/**
 * Normalize a URL path to use consistent trailing slashes.
 * Root path "/" keeps its slash; all other paths strip trailing slash.
 * @param {string} path - URL path
 * @returns {string} Normalized path
 */
export function normalizeTrailingSlash(path) {
  if (!path) return "/";
  if (path === "/") return "/";
  return path.replace(/\/+$/, "") || "/";
}

/**
 * Get the canonical URL for a path, with consistent trailing slashes.
 * @param {string} path
 * @returns {string} Full canonical URL
 */
export function getCanonicalUrl(path) {
  const normalized = normalizeTrailingSlash(path);
  return `https://clientsurgesystems.com${normalized}`;
}

// ═══════════════════════════════════════════════════════════════
// FLAW #73: Meta description length validation
// ═══════════════════════════════════════════════════════════════

const META_DESC_MAX = 160; // Google SERP limit
const META_DESC_MIN = 70;

/**
 * Validate a meta description length for SERP optimization.
 * @param {string} description
 * @returns {{ valid: boolean, length: number, message: string }}
 */
export function validateMetaDescription(description) {
  if (!description) {
    return { valid: false, length: 0, message: "Missing meta description" };
  }
  const length = description.length;
  if (length > META_DESC_MAX) {
    return {
      valid: false,
      length,
      message: `Meta description too long: ${length}/${META_DESC_MAX} chars — Google will truncate`,
    };
  }
  if (length < META_DESC_MIN) {
    return {
      valid: false,
      length,
      message: `Meta description too short: ${length}/${META_DESC_MIN} chars — add more detail for better SERP`,
    };
  }
  return { valid: true, length, message: `Meta description length OK: ${length} chars` };
}

/**
 * Truncate a meta description to the SERP-safe length.
 * @param {string} description
 * @returns {string}
 */
export function truncateMetaDescription(description) {
  if (!description) return "";
  if (description.length <= META_DESC_MAX) return description;
  // Truncate at word boundary
  const truncated = description.substring(0, META_DESC_MAX - 1);
  const lastSpace = truncated.lastIndexOf(" ");
  return truncated.substring(0, lastSpace > META_DESC_MIN ? lastSpace : META_DESC_MAX - 1) + "…";
}

// ═══════════════════════════════════════════════════════════════
// FLAW #74: Sitemap route filtering — exclude admin/internal routes
// ═══════════════════════════════════════════════════════════════

/**
 * Routes that should NEVER appear in sitemap.xml or be indexed.
 */
const BLOCKED_SITEMAP_PATTERNS = [
  /^\/admin/,
  /^\/mission-control/,
  /^\/dashboard/,
  /^\/admin-settings/,
  /^\/saas\/admin/,
  /^\/client-portal/,
  /^\/client-dashboard/,
  /^\/setup/,
  /^\/onboarding/,
  /^\/leads\/capture/,
  /^\/order-success/,
  /^\/thank-you/,
  /^\/success$/,
  /^\/legal\//,
  /^\/reset-password/,
  /^\/forgot-password/,
  /^\/login/,
  /^\/register/,
  /^\/opt-out/,
  /^\/_generated/,
  /^\/pages/,
  /^\/NotFound/,
];

/**
 * Check if a route should be excluded from the sitemap.
 * @param {string} path
 * @returns {boolean}
 */
export function isExcludedFromSitemap(path) {
  return BLOCKED_SITEMAP_PATTERNS.some(pattern => pattern.test(path));
}

/**
 * Filter a list of routes to only include sitemap-safe public routes.
 * @param {Array<string>} paths
 * @returns {Array<string>}
 */
export function filterSitemapRoutes(paths) {
  if (!Array.isArray(paths)) return [];
  return paths.filter(path => !isExcludedFromSitemap(path));
}

// ═══════════════════════════════════════════════════════════════
// FLAW #75: Structured data (JSON-LD) for Automation Service pages
// ═══════════════════════════════════════════════════════════════

/**
 * Generate Service schema JSON-LD for an automation service page.
 * @param {object} service - { name, description, slug, features }
 * @returns {object} JSON-LD schema object
 */
export function buildAutomationServiceSchema(service = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name || "ClientSurge Automation",
    description: service.description || "",
    provider: {
      "@type": "Organization",
      name: "ClientSurge Systems",
      url: "https://clientsurgesystems.com",
      logo: "https://clientsurgesystems.com/logo.png",
      telephone: "+1-602-584-3227",
      email: "support@clientsurgesystems.com",
    },
    serviceType: service.serviceType || "Business Automation",
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    url: `https://clientsurgesystems.com/${service.slug || ""}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: service.price || "497",
      availability: "https://schema.org/InStock",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Included Features",
      itemListElement: (service.features || []).map(feature => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: feature,
        },
      })),
    },
  };
}

/**
 * Generate FAQPage schema for automation service pages with FAQs.
 * @param {Array<{q: string, a: string}>} faqs
 * @returns {object} JSON-LD schema object
 */
export function buildFAQSchema(faqs = []) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}