const testimonials = [
  {
    quote: "Within 3 weeks we went from booking maybe 2 consultations a week from online leads to over 10. The system just runs — I don't touch it.",
    name: "Jessica M.",
    business: "Owner, Luminary Aesthetics — Miami, FL",
    result: "5× consultation bookings",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80",
  },
  {
    quote: "We were spending $4k/month on ads and converting almost none of it. Now our close rate from ads is completely different. It paid for itself in the first week.",
    name: "Carlos R.",
    business: "Owner, Elite HVAC & Cooling — Phoenix, AZ",
    result: "ROI in under 7 days",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
  },
  {
    quote: "I used to personally follow up with every lead. Now that's just… handled. My team is focused on clients and I'm focused on growth.",
    name: "Amanda T.",
    business: "Director, Revive Wellness Studio — Austin, TX",
    result: "Fully automated follow-up",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&q=80",
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

        <div className="grid md:grid-cols-3 gap-8">
           {testimonials.map((t, i) => (
             <div
               key={i}
               className="group relative flex flex-col p-8 rounded-2xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 cursor-default"
               style={{
                 background: "rgba(255, 255, 255, 0.75)",
                 border: "1.5px solid rgba(255, 255, 255, 0.6)",
                 boxShadow: "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
                 transition: "all 0.4s ease",
               }}
               onMouseEnter={e => {
                 e.currentTarget.style.background = "rgba(255, 255, 255, 0.95)";
                 e.currentTarget.style.border = "1.5px solid rgba(200, 150, 92, 0.4)";
                 e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8), 0 0 40px rgba(200, 150, 92, 0.15)";
                 e.currentTarget.style.transform = "translateY(-8px)";
               }}
               onMouseLeave={e => {
                 e.currentTarget.style.background = "rgba(255, 255, 255, 0.75)";
                 e.currentTarget.style.border = "1.5px solid rgba(255, 255, 255, 0.6)";
                 e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)";
                 e.currentTarget.style.transform = "translateY(0)";
               }}
             >
              {/* Quote mark */}
              <div className="text-5xl font-display text-foreground/10 leading-none mb-3 select-none">"</div>

              {/* Quote text */}
              <p className="text-sm text-foreground/80 leading-relaxed flex-1 mb-8 italic">
                {t.quote}
              </p>

              {/* Divider */}
              <div className="border-t border-black/8 pt-5 flex items-center gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white" />
                </div>

                {/* Name + biz */}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{t.business}</p>
                </div>
              </div>

              {/* Result badge */}
              <div className="mt-4">
                <span className="inline-block text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  ✓ {t.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}