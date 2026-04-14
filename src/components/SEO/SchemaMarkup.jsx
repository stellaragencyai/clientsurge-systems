export function addServiceSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "ApexFlow",
    "image": "https://apexflow.com/logo.png",
    "description": "Automated lead capture, response, and booking system for service businesses",
    "url": "https://apexflow.com",
    "telephone": "+1-800-APEXFLOW",
    "email": "support@apexflow.com",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US"
    },
    "sameAs": [
      "https://facebook.com/apexflow",
      "https://twitter.com/apexflow",
      "https://linkedin.com/company/apexflow"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "847"
    }
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.innerHTML = JSON.stringify(schema);
  document.head.appendChild(script);
}

export function addServiceOfferingSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Lead Automation System",
    "description": "Automated lead capture, instant response, follow-up sequences, and appointment booking",
    "provider": {
      "@type": "Organization",
      "name": "ApexFlow",
      "url": "https://apexflow.com"
    },
    "serviceType": "Lead Management",
    "areaServed": "US",
    "priceRange": "$$",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "USD",
      "price": "397"
    }
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.innerHTML = JSON.stringify(schema);
  document.head.appendChild(script);
}

export function addFAQSchema(faqs) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.innerHTML = JSON.stringify(schema);
  document.head.appendChild(script);
}