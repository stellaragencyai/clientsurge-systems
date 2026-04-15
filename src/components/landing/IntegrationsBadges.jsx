export default function IntegrationsBadges() {
  const integrations = ['GHL', 'Twilio', 'Calendly', 'Google', 'Facebook', 'Instagram', 'Mindbody', 'Vagaro'];

  return (
    <section className="py-12 px-6 bg-gradient-to-r from-background via-card to-background border-y border-border">
      <div className="max-w-7xl mx-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-6">
          Integrates with the tools you already use
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {integrations.map((int, i) => (
            <span
              key={i}
              className="inline-block px-4 py-2 bg-white border border-border rounded-full text-sm font-medium text-foreground shadow-sm hover:shadow-md transition-shadow"
            >
              {int}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}