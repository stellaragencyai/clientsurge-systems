const testimonials = [
  {
    quote: "Within 3 weeks we went from booking maybe 2 consultations a week from online leads to over 10. The system just runs — I don't touch it.",
    name: "Jessica M.",
    business: "Owner, Luminary Aesthetics — Miami, FL",
    result: "5× consultation bookings",
  },
  {
    quote: "We were spending $4k/month on ads and converting almost none of it. Now our close rate from ads is completely different. It paid for itself in the first week.",
    name: "Carlos R.",
    business: "Owner, Elite HVAC & Cooling — Phoenix, AZ",
    result: "ROI in under 7 days",
  },
  {
    quote: "I used to personally follow up with every lead. Now that's just… handled. My team is focused on clients and I'm focused on growth.",
    name: "Amanda T.",
    business: "Director, Revive Wellness Studio — Austin, TX",
    result: "Fully automated follow-up",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-background to-card">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Client Results</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            What Clients Say After 30 Days
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="flex flex-col p-7 rounded-2xl border-2 border-black bg-card hover:border-primary/30 transition-colors">
              <div className="text-3xl text-primary/30 font-display leading-none mb-4">"</div>
              <p className="text-sm text-foreground leading-relaxed flex-1 mb-6">{t.quote}</p>
              <div className="pt-5 border-t border-border">
                <p className="text-xs font-semibold text-primary mb-0.5">{t.result}</p>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.business}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}