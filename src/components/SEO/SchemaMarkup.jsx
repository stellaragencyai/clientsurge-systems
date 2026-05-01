export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ClientSurge Systems',
    url: 'https://clientsurgesystems.com',
    logo: 'https://media.base44.com/images/public/69d49a29c1974b32f46e8550/aaaacb19f_generated_image.png',
    description:
      'Done-for-you automation systems that help med spas and appointment-based businesses respond faster and book more appointments.',
    email: 'nolan@clientsurgesystems.com',
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
      'AI-powered lead response, follow-up automation, missed-call text-back, and booking systems for med spas and service businesses.',
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
    name: 'Lead Capture and Booking Automation',
    serviceType: 'Lead management automation',
    provider: {
      '@type': 'Organization',
      name: 'ClientSurge Systems',
      url: 'https://clientsurgesystems.com',
    },
    areaServed: 'United States',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      lowPrice: '397',
      highPrice: '1500',
    },
    description:
      'Done-for-you systems for instant lead response, automated follow-up, missed-call recovery, and appointment booking.',
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
