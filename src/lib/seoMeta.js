/**
 * Dynamic per-page SEO metadata helper (#12 — OG tags not dynamic per page)
 * Usage: call getPageMeta(pathname) and apply to document.head in each page's useEffect.
 */

const BASE_URL = "https://clientsurgesystems.com";
const DEFAULT_OG_IMAGE = "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png";

const PAGE_META = {
  "/": {
    title: "AI Automation Systems for Local Leads | ClientSurge Systems",
    description: "Six done-for-you automations for lead capture, missed-call recovery, AI follow-up, appointment booking, review generation, and customer reactivation for local service businesses.",
    ogTitle: "AI Automation Systems That Turn More Local Leads Into Booked Jobs",
  },
  "/pricing": {
    title: "Pricing & Packages | ClientSurge Systems",
    description: "Simple month-to-month pricing. Starter, Growth, and Pro System automation packages with no long-term contracts. One-time setup + monthly service.",
    ogTitle: "Transparent AI Automation Pricing | ClientSurge Systems",
  },
  "/automations": {
    title: "AI Automations for Local Businesses | ClientSurge Systems",
    description: "Explore every automation we install: instant lead response, missed-call text-back, AI booking agent, review requests, nurture sequences, and lead reactivation.",
    ogTitle: "Six AI Automations Built for Local Service Businesses",
  },
  "/about": {
    title: "About ClientSurge Systems",
    description: "ClientSurge Systems was built by local business operators who got tired of watching leads fall through the cracks. Learn our story.",
    ogTitle: "About ClientSurge Systems — Built by Operators, for Operators",
  },
  "/contact": {
    title: "Contact ClientSurge Systems",
    description: "Get in touch with the ClientSurge team. We'll help you identify the right automation stack for your business.",
    ogTitle: "Talk to a ClientSurge Automation Specialist",
  },
  "/faq": {
    title: "FAQ | ClientSurge Systems",
    description: "Answers to common questions about ClientSurge Systems — setup, pricing, integrations, billing, compliance, and more.",
    ogTitle: "Frequently Asked Questions | ClientSurge Systems",
  },
  "/store": {
    title: "Build Your Automation Stack | ClientSurge Store",
    description: "Choose individual automations or full packages. Instant lead response, missed-call recovery, AI booking agent, review automation, and more.",
    ogTitle: "ClientSurge Store — Pick Your Automations",
  },
  "/med-spa": {
    title: "AI Automation for Med Spas & Aesthetic Clinics | ClientSurge",
    description: "Turn more consult requests into booked appointments. Instant lead response, AI booking, and follow-up automation built for med spas.",
    ogTitle: "Med Spa Automation That Books More Consultations",
  },
  "/dental": {
    title: "AI Automation for Dental & Orthodontics Practices | ClientSurge",
    description: "Missed calls, follow-ups, and appointment booking — automated for dental offices. Stop losing patients to competitors who respond faster.",
    ogTitle: "Dental Practice Automation | ClientSurge Systems",
  },
  "/hvac": {
    title: "AI Automation for HVAC Companies | ClientSurge Systems",
    description: "Never miss a service call lead. Missed-call text-back, instant response, and booking automation for HVAC contractors.",
    ogTitle: "HVAC Lead Automation That Books More Service Calls",
  },
  "/roofing": {
    title: "AI Automation for Roofing Contractors | ClientSurge Systems",
    description: "Respond to every roofing lead in under 60 seconds. AI follow-up, booking automation, and review requests built for roofing companies.",
    ogTitle: "Roofing Contractor Automation | ClientSurge Systems",
  },
  "/chiropractic": {
    title: "AI Automation for Chiropractic Practices | ClientSurge Systems",
    description: "Book more new patients with instant follow-up and automated appointment scheduling for chiropractic and physical therapy clinics.",
    ogTitle: "Chiropractic Practice Automation | ClientSurge Systems",
  },
  "/contractors": {
    title: "AI Automation for General Contractors & Trades | ClientSurge",
    description: "Instant lead response and booking automation for contractors. Stop losing bids to competitors who respond in minutes.",
    ogTitle: "Contractor Lead Automation | ClientSurge Systems",
  },
  "/plumbing": {
    title: "AI Automation for Plumbing & Drain Services | ClientSurge",
    description: "Missed-call text-back and lead response automation for plumbers. Every service call inquiry gets a reply in under 60 seconds.",
    ogTitle: "Plumbing Lead Automation | ClientSurge Systems",
  },
  "/real-estate": {
    title: "AI Automation for Real Estate Agents | ClientSurge Systems",
    description: "Follow up with every buyer and seller lead automatically. Nurture sequences, instant responses, and booking automation for agents.",
    ogTitle: "Real Estate Lead Automation | ClientSurge Systems",
  },
  "/personal-injury": {
    title: "AI Automation for Personal Injury Law Firms | ClientSurge",
    description: "Respond to every case inquiry instantly. AI-powered lead capture, follow-up, and intake automation for personal injury attorneys.",
    ogTitle: "Personal Injury Law Firm Automation | ClientSurge Systems",
  },
};

/**
 * Get SEO/OG metadata for a given pathname.
 * @param {string} pathname - Current route pathname
 * @returns {{ title: string, description: string, ogTitle: string, ogImage: string, canonical: string }}
 */
export function getPageMeta(pathname) {
  const meta = PAGE_META[pathname] || PAGE_META["/"];
  return {
    title: meta.title,
    description: meta.description,
    ogTitle: meta.ogTitle || meta.title,
    ogDescription: meta.description,
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${BASE_URL}${pathname === "/" ? "" : pathname}`,
  };
}

/**
 * Apply page metadata to document.head.
 * Returns a cleanup function that restores the previous title.
 * @param {string} pathname
 */
export function applyPageMeta(pathname) {
  if (typeof document === "undefined") return () => {};
  const meta = getPageMeta(pathname);
  const prevTitle = document.title;

  document.title = meta.title;

  const setMeta = (name, content, isProperty = false) => {
    const attr = isProperty ? "property" : "name";
    let el = document.head.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    const prev = el.getAttribute("content");
    el.setAttribute("content", content);
    return () => el.setAttribute("content", prev || "");
  };

  const setCanonical = (href) => {
    let el = document.head.querySelector('link[rel="canonical"]');
    const created = !el;
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      document.head.appendChild(el);
    }
    const prev = el.getAttribute("href");
    el.setAttribute("href", href);
    return () => {
      if (created) el.remove();
      else el.setAttribute("href", prev || "");
    };
  };

  const cleanups = [
    setMeta("description", meta.description),
    setMeta("og:title", meta.ogTitle, true),
    setMeta("og:description", meta.ogDescription, true),
    setMeta("og:image", meta.ogImage, true),
    setMeta("twitter:title", meta.ogTitle),
    setMeta("twitter:description", meta.ogDescription),
    setCanonical(meta.canonical),
  ];

  return () => {
    document.title = prevTitle;
    cleanups.forEach((fn) => fn());
  };
}