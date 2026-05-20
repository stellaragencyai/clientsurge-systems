/**
 * jsonLdSchema.js — #56
 * Injects LocalBusiness + Service JSON-LD structured data into industry pages.
 * Call injectJsonLd(schema) from each industry page's useEffect.
 */

const BASE_ADDRESS = {
  "@type": "PostalAddress",
  addressLocality: "Phoenix",
  addressRegion: "AZ",
  addressCountry: "US",
};

const INDUSTRY_SERVICES = {
  med_spa: ["Botox", "Laser Hair Removal", "Facial Treatments", "Body Contouring", "Chemical Peels"],
  dental:  ["Teeth Cleaning", "Teeth Whitening", "Dental Implants", "Invisalign", "Emergency Dental"],
  tanning_salon: ["UV Tanning", "Spray Tanning", "Tanning Memberships", "Airbrush Tan"],
};

export function buildLocalBusinessSchema({ businessName, industry, phone, url, description }) {
  const services = INDUSTRY_SERVICES[industry?.toLowerCase().replace(/\s+/g, '_')] || [];

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: businessName || "ClientSurge Systems",
    description: description || `AI-powered automation systems for ${industry} businesses in Phoenix, AZ`,
    url: url || "https://clientsurgesystems.com",
    telephone: phone || "",
    address: BASE_ADDRESS,
    areaServed: ["Phoenix, AZ", "Scottsdale, AZ", "Tempe, AZ", "Mesa, AZ", "Chandler, AZ"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${industry} AI Automation Services`,
      itemListElement: services.map(s => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s },
      })),
    },
  };
}

export function injectJsonLd(schema) {
  // Remove any existing JSON-LD to avoid duplicates
  const existing = document.querySelector('script[data-cs-jsonld]');
  if (existing) existing.remove();

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-cs-jsonld', 'true');
  script.textContent = JSON.stringify(schema, null, 2);
  document.head.appendChild(script);
}

export function removeJsonLd() {
  const existing = document.querySelector('script[data-cs-jsonld]');
  if (existing) existing.remove();
}
