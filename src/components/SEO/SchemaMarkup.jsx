export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ClientSurge Systems',
    url: 'https://clientsurgesystems.com',
    logo: 'https://media.base44.com/images/public/69d49a29c1974b32f46e8550/aaaacb19f_generated_image.png',
    description:
      'The Amazon of AI Services for Business — browse packaged AI automation systems, add to cart, and check out. Done-for-you setup included.',
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
      'The Amazon of AI Services for Business — browse AI automation systems including lead capture, missed-call text-back, AI follow-up, booking, reviews, and reactivation. Add to cart and check out.',
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
      lowPrice: '497',
      highPrice: '1997',
      offerCount: '3',
    },
    description:
      'Done-for-you AI systems for lead capture, instant lead response, automated follow-up, missed-call recovery, appointment booking, review requests, and lead reactivation. Browse, add to cart, and check out — no demos required.',
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
        price: '497',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '497',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        url: 'https://clientsurgesystems.com/store?package=starter_system',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Growth System',
        price: '997',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '997',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        url: 'https://clientsurgesystems.com/store?package=growth_system',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Pro System',
        price: '1997',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '1997',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        url: 'https://clientsurgesystems.com/store?package=pro_system',
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
      'The Amazon of AI Services for Business — browse, add to cart, and check out packaged AI automation systems for local service businesses.',
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