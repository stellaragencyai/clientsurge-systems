export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ClientSurge Systems',
    url: 'https://clientsurgesystems.com',
    logo: 'https://media.base44.com/images/public/69d49a29c1974b32f46e8550/aaaacb19f_generated_image.png',
    description:
      'Packaged AI lead automation systems for local service businesses. Compare Starter, Growth, and Pro, then check out with done-for-you setup included.',
    email: 'support@clientsurgesystems.com',
    telephone: '+1-602-584-3227',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Phoenix',
      addressRegion: 'AZ',
      addressCountry: 'US',
    },
  };
}

export function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'ClientSurge Systems',
    url: 'https://clientsurgesystems.com',
    description:
      'Packaged AI automation systems including lead capture, missed-call text-back, AI follow-up, booking, reviews, and reactivation. Compare packages and check out with done-for-you setup included.',
    areaServed: 'United States',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Phoenix',
      addressRegion: 'AZ',
      addressCountry: 'US',
    },
    telephone: '+1-602-584-3227',
    priceRange: '$$'
  };
}

export function getServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'AI Lead Conversion Automation Systems',
    serviceType: 'AI automation, voice agent, and lead conversion systems',
    provider: {
      '@type': 'Organization',
      name: 'ClientSurge Systems',
      url: 'https://clientsurgesystems.com',
    },
    areaServed: 'United States',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '99',
      highPrice: '499',
      offerCount: '3',
    },
    description:
      'Done-for-you AI systems for lead capture, instant lead response, automated follow-up, missed-call recovery, appointment booking, review requests, and lead reactivation. Compare packages and check out — no demos required.',
  };
}

export function getProductSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'ClientSurge AI Automation Systems',
    description:
      'Packaged AI systems for local service businesses: lead capture, missed-call recovery, AI follow-up, booking automation, review requests, and lead reactivation.',
    brand: {
      '@type': 'Brand',
      name: 'ClientSurge Systems',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter System',
        price: '99',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '99',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        url: 'https://clientsurgesystems.com/product-signup?package=starter_system',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Growth System',
        price: '249',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '249',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        url: 'https://clientsurgesystems.com/product-signup?package=growth_system',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Pro System',
        price: '499',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '499',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        url: 'https://clientsurgesystems.com/product-signup?package=pro_system',
        availability: 'https://schema.org/InStock',
      },
    ],
  };
}

export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ClientSurge Systems',
    url: 'https://clientsurgesystems.com',
    description:
      'Compare packaged AI automation systems for local service businesses and check out with done-for-you setup included.',
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      name: 'ClientSurge Systems',
      url: 'https://clientsurgesystems.com',
    },
  };
}

export function getFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}
