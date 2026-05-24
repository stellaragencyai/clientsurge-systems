export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ClientSurge Systems',
    url: 'https://clientsurgesystems.com',
    logo: 'https://clientsurgesystems.com/og-image.png',
    description:
      'AI-powered websites, voice agents, lead response, missed-call recovery, follow-up automation, and booking systems for local service businesses.',
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
      'AI automation systems for local service businesses, including AI phone receptionist workflows, missed-call text-back, instant lead response, nurture automation, booking systems, and review request automation.',
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
    name: 'AI Lead Conversion Automation',
    serviceType: 'AI automation, voice agent, and lead conversion systems',
    provider: {
      '@type': 'Organization',
      name: 'ClientSurge Systems',
      url: 'https://clientsurgesystems.com',
    },
    areaServed: 'United States',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      lowPrice: '497',
      highPrice: '1997',
    },
    description:
      'Done-for-you systems for AI voice agents, instant lead response, automated follow-up, missed-call recovery, appointment booking, review requests, and lead reactivation.',
  };
}

export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ClientSurge Systems',
    url: 'https://clientsurgesystems.com',
    description:
      'Public website for ClientSurge Systems, an AI automation company helping local service businesses convert more leads into booked jobs.',
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
