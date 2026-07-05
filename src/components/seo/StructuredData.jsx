/**
 * Structured Data (Schema.org) Component
 * Fixes Audit Issue #63: No structured data on most pages
 *
 * Injects JSON-LD schema markup dynamically per page.
 *
 * Usage:
 * <StructuredData type="FAQPage" data={faqItems} />
 * <StructuredData type="Product" data={productData} />
 * <StructuredData type="Service" data={serviceData} />
 */

import { useEffect } from "react";

const SCHEMA_ID_PREFIX = "cs-structured-data-";

function buildSchema(type, data) {
  const base = {
    "@context": "https://schema.org",
    "@type": type,
  };

  switch (type) {
    case "FAQPage":
      return {
        ...base,
        mainEntity: (Array.isArray(data) ? data : []).map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      };

    case "Product":
      return {
        ...base,
        name: data.name,
        description: data.description,
        brand: { "@type": "Brand", name: "ClientSurge Systems" },
        offers: {
          "@type": "Offer",
          price: data.price,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: data.url || "https://clientsurgesystems.com/pricing",
        },
      };

    case "Service":
      return {
        ...base,
        name: data.name,
        serviceType: data.serviceType,
        provider: {
          "@type": "Organization",
          name: "ClientSurge Systems",
          url: "https://clientsurgesystems.com",
        },
        areaServed: "United States",
        description: data.description,
      };

    case "Organization":
      return {
        ...base,
        name: "ClientSurge Systems",
        url: "https://clientsurgesystems.com",
        email: "support@clientsurgesystems.com",
        telephone: "+1-602-584-3227",
        description: "The Amazon of AI Services for Business.",
      };

    case "BreadcrumbList":
      return {
        ...base,
        itemListElement: (Array.isArray(data) ? data : []).map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.label,
          item: `https://clientsurgesystems.com${item.path}`,
        })),
      };

    default:
      return { ...base, ...data };
  }
}

export default function StructuredData({ type, data, id }) {
  useEffect(() => {
    if (!type || !data) return;

    const schema = buildSchema(type, data);
    const scriptId = SCHEMA_ID_PREFIX + (id || type);

    // Remove existing schema with same ID
    const existing = document.head.querySelector(`script[data-schema-id="${scriptId}"]`);
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema-id", scriptId);
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const el = document.head.querySelector(`script[data-schema-id="${scriptId}"]`);
      if (el) el.remove();
    };
  }, [type, data, id]);

  return null;
}