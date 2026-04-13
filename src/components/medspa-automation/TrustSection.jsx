const testimonials = [
  {
    quote: 'Within 3 weeks we went from booking 2–3 consultations a week to over 8. The system just runs.',
    name: 'Dr. Jessica M.',
    business: 'Luminary Aesthetics, Miami FL',
    result: '4× more consultations',
  },
  {
    quote: 'Our front desk used to spend hours chasing leads. Now they focus on the clients in front of them.',
    name: 'Amanda T.',
    business: 'Revive Med Spa, Austin TX',
    result: 'Zero missed inquiries',
  },
];

export default function TrustSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-card">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground text-center mb-16">
          Used by growing med spas
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="p-8 bg-background rounded-xl border border-border">
              <p className="text-lg text-foreground italic mb-6">"{testimonial.quote}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded">
                  {testimonial.result}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center p-8 bg-primary/5 rounded-xl border border-primary/10">
          <p className="text-foreground font-semibold mb-2">Ready to be next?</p>
          <p className="text-muted-foreground text-sm">Join med spas that are converting more leads and running more efficiently.</p>
        </div>
      </div>
    </section>
  );
}