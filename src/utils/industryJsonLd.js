const BASE_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "653 W 10th St",
  addressLocality: "Tempe",
  addressRegion: "AZ",
  postalCode: "85282",
  addressCountry: "US",
};

const INDUSTRY_CONFIG = {
  medspa: {
    name: "Med Spa AI Automation - ClientSurge Systems",
    description: "AI lead response and appointment booking automation for med spas in Phoenix and Scottsdale, AZ.",
    serviceType: "Med Spa Marketing Automation",
    areaServed: ["Phoenix, AZ", "Scottsdale, AZ", "Tempe, AZ", "Chandler, AZ"],
  },
  "med-spa": {
    name: "Med Spa AI Automation - ClientSurge Systems",
    description: "AI lead response and appointment booking automation for med spas in Phoenix and Scottsdale, AZ.",
    serviceType: "Med Spa Marketing Automation",
    areaServed: ["Phoenix, AZ", "Scottsdale, AZ", "Tempe, AZ", "Chandler, AZ"],
  },
  dental: {
    name: "Dental Practice AI Automation - ClientSurge Systems",
    description: "AI lead response and patient follow-up automation for dental offices in Phoenix and Scottsdale, AZ.",
    serviceType: "Dental Practice Automation",
    areaServed: ["Phoenix, AZ", "Scottsdale, AZ", "Mesa, AZ", "Tempe, AZ"],
  },
  chiropractic: {
    name: "Chiropractic Clinic AI Automation - ClientSurge Systems",
    description: "AI lead response, appointment booking, and patient follow-up automation for chiropractic clinics.",
    serviceType: "Chiropractic Clinic Automation",
    areaServed: ["Phoenix, AZ", "Scottsdale, AZ", "Tempe, AZ", "Mesa, AZ"],
  },
  hvac: {
    name: "HVAC Contractor AI Automation - ClientSurge Systems",
    description: "AI lead response and booking automation for HVAC contractors in Phoenix and Scottsdale, AZ.",
    serviceType: "HVAC Contractor Automation",
    areaServed: ["Phoenix, AZ", "Scottsdale, AZ", "Mesa, AZ", "Chandler, AZ", "Tempe, AZ"],
  },
  roofing: {
    name: "Roofing Contractor AI Automation - ClientSurge Systems",
    description: "AI lead capture and instant response for roofing contractors in the Phoenix metropolitan area.",
    serviceType: "Roofing Contractor Automation",
    areaServed: ["Phoenix, AZ", "Scottsdale, AZ", "Glendale, AZ", "Peoria, AZ"],
  },
  contractors: {
    name: "General Contractor AI Automation - ClientSurge Systems",
    description: "AI lead response and follow-up automation for general contractors in Phoenix and Scottsdale.",
    serviceType: "General Contractor Automation",
    areaServed: ["Phoenix, AZ", "Scottsdale, AZ", "Tempe, AZ", "Mesa, AZ"],
  },
};

export function buildIndustryJsonLd(industry) {
  const normalizedIndustry = String(industry || "medspa").toLowerCase().replace(/_/g, "-");
  const config = INDUSTRY_CONFIG[normalizedIndustry] || INDUSTRY_CONFIG.medspa;

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ProfessionalService"],
    name: config.name,
    description: config.description,
    url: "https://clientsurgesystems.com",
    telephone: "+16023727438",
    address: BASE_ADDRESS,
    areaServed: config.areaServed,
    serviceType: config.serviceType,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "AI Automation Services",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Instant Lead Response AI" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Missed Call Text-Back" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Automated Follow-Up Sequences" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "AI Appointment Booking" } },
      ],
    },
  };
}

export function injectIndustryJsonLd(industry) {
  const schema = buildIndustryJsonLd(industry);
  const existing = document.head.querySelector("script[data-industry-jsonld]");
  if (existing) existing.remove();

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-industry-jsonld", industry);
  script.textContent = JSON.stringify(schema, null, 2);
  document.head.appendChild(script);
}
