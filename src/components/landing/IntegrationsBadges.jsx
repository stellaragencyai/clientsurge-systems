export default function IntegrationsBadges() {
  const integrations = [
    { name: 'GHL', logo: 'https://images.g2crowd.com/upload/enterprises/images/ca/79/000014079/original/gohighlevel-logo.png', height: 24 },
    { name: 'Twilio', logo: 'https://www.twilio.com/en/company/assets/logos/twilio_logo_blue.svg', height: 24 },
    { name: 'Calendly', logo: 'https://assets.calendly.com/assets/logo-full-body-dark.png', height: 24 },
    { name: 'Google', logo: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png', height: 20 },
    { name: 'Facebook', logo: 'https://www.facebook.com/rsrc.php/v3/y2/r/8WDI3EvcuIT.png', height: 24 },
    { name: 'Instagram', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png', height: 24 },
    { name: 'Mindbody', logo: 'https://www.mindbody.io/assets/branding/mindful-mark.svg', height: 24 },
    { name: 'Vagaro', logo: 'https://vagaro.com/resources/img/logo.png', height: 24 },
  ];

  return (
    <section className="py-12 px-6 bg-gradient-to-r from-background via-card to-background border-y border-border">
      <div className="max-w-7xl mx-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-6">
          Integrates with the tools you already use
        </p>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          {integrations.map((int, i) => (
            <div
              key={i}
              className="inline-flex items-center px-4 py-2 bg-white border border-border rounded-full shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-primary transition-all"
              title={int.name}
              role="img"
              aria-label={`${int.name} integration`}
              tabIndex={0}
            >
              <img 
                src={int.logo} 
                alt={`${int.name} logo`}
                loading="lazy"
                style={{ height: `${int.height}px`, maxWidth: '120px', objectFit: 'contain' }}
                className="grayscale hover:grayscale-0 transition-all"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}