/**
 * localSeo.js — #286 #344
 * Injects Phoenix/Scottsdale city name into H1 + meta title for local SEO.
 * Also sets canonical tag for every industry page.
 *
 * Usage in each industry page:
 *   import { setIndustryPageSeo } from '@/utils/localSeo';
 *   useEffect(() => setIndustryPageSeo('medspa'), []);
 */

const INDUSTRY_SEO = {
  medspa: {
    title: "Med Spa AI Automation in Phoenix & Scottsdale, AZ | ClientSurge Systems",
    description: "AI-powered lead response and booking automation for med spas in Phoenix & Scottsdale. Get 10x more consults with zero extra staff.",
    canonical: "https://clientsurgesystems.com/medspa",
    h1: "AI Automation for Med Spas in Phoenix & Scottsdale, AZ",
  },
  dental: {
    title: "Dental Practice AI Automation in Phoenix, AZ | ClientSurge Systems",
    description: "Automated lead follow-up and patient booking for dental offices in Phoenix, Scottsdale & Tempe, AZ.",
    canonical: "https://clientsurgesystems.com/dental",
    h1: "AI Lead Automation for Dental Practices in Phoenix, AZ",
  },
  tanning: {
    title: "Tanning Salon AI Automation in Phoenix Valley | ClientSurge Systems",
    description: "AI lead capture and follow-up automation for tanning salons across the Phoenix valley.",
    canonical: "https://clientsurgesystems.com/tanning",
    h1: "AI Automation for Tanning Salons in Phoenix & Scottsdale",
  },
  hvac: {
    title: "HVAC Contractor AI Lead Automation in Phoenix, AZ | ClientSurge Systems",
    description: "AI-powered lead response for HVAC contractors in Phoenix, Mesa, Chandler & Scottsdale, AZ.",
    canonical: "https://clientsurgesystems.com/hvac",
    h1: "AI Lead Response for HVAC Contractors in Phoenix, AZ",
  },
  roofing: {
    title: "Roofing Contractor AI Lead Automation in Phoenix, AZ | ClientSurge Systems",
    description: "Instant AI lead response for roofing contractors in the Phoenix metropolitan area.",
    canonical: "https://clientsurgesystems.com/roofing",
    h1: "AI Lead Automation for Roofing Contractors in Phoenix & Scottsdale",
  },
  contractors: {
    title: "General Contractor AI Automation in Phoenix, AZ | ClientSurge Systems",
    description: "AI lead response and follow-up for general contractors in Phoenix, Scottsdale & surrounding areas.",
    canonical: "https://clientsurgesystems.com/contractors",
    h1: "AI Lead Automation for General Contractors in Phoenix, AZ",
  },
};

export function setIndustryPageSeo(industry) {
  const seo = INDUSTRY_SEO[industry];
  if (!seo) return;

  // Title + meta description
  document.title = seo.title;
  let desc = document.head.querySelector('meta[name="description"]');
  if (!desc) { desc = document.createElement("meta"); desc.name = "description"; document.head.appendChild(desc); }
  desc.content = seo.description;

  // #344: canonical tag
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
  canonical.href = seo.canonical;

  // OG tags
  const ogMap = { "og:title": seo.title, "og:description": seo.description, "og:url": seo.canonical };
  for (const [prop, val] of Object.entries(ogMap)) {
    let el = document.head.querySelector(`meta[property="${prop}"]`);
    if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
    el.content = val;
  }

  return seo; // return for use in React components if needed
}
