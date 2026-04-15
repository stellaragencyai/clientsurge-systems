const testimonials = [
  {
    name: "Sarah M.",
    businessType: "Med Spa",
    location: "Miami, FL",
    before: "Booking 2 consults/week from online leads",
    after: "10+ consults/week",
    result: "5× booking increase",
    quote: "The system just runs — I don't touch it.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80",
  },
  {
    name: "Jennifer L.",
    businessType: "Aesthetic Clinic",
    location: "Los Angeles, CA",
    before: "Losing leads on Instagram DMs",
    after: "Instant response system live 24/7",
    result: "40% more bookings",
    quote: "Leads are booking faster than ever before.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
  },
  {
    name: "Diana K.",
    businessType: "Med Spa",
    location: "Austin, TX",
    before: "Missed calls and cold inquiries",
    after: "Recovered old leads + instant responses",
    result: "$15k recovered revenue",
    quote: "We got back money we thought was gone.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80",
  },
];

export default function MedSpaTestimonials() {
  return (
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-background to-card">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Proven Results</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Real Results From Med Spas Using Our System
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group relative flex flex-col p-8 rounded-2xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 cursor-default"
              style={{
                background: "rgba(255, 255, 255, 0.75)",
                border: "2px solid #000000",
                boxShadow: "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
                transition: "all 0.4s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.95)";
                e.currentTarget.style.border = "2px solid #000000";
                e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8), 0 0 40px rgba(200, 150, 92, 0.15)";
                e.currentTarget.style.transform = "translateY(-8px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.75)";
                e.currentTarget.style.border = "2px solid #000000";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Business Type Badge */}
              <div className="mb-4">
                <span className="inline-block text-xs font-bold text-foreground/60 bg-foreground/5 px-3 py-1 rounded-full">
                  {t.businessType} — {t.location}
                </span>
              </div>

              {/* Before/After */}
              <div className="mb-6 space-y-3 pb-6 border-b border-black/8">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Before</p>
                  <p className="text-sm text-foreground/70">{t.before}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">After</p>
                  <p className="text-sm font-semibold text-foreground">{t.after}</p>
                </div>
              </div>

              {/* Result Highlight */}
              <div className="mb-6">
                <span className="inline-block text-sm font-bold text-white bg-gradient-to-r from-amber-800 to-amber-700 px-4 py-2 rounded-full" style={{background: "linear-gradient(135deg, #9a5c2e 0%, #7a4825 100%)"}}>
                  {t.result}
                </span>
              </div>

              {/* Quote */}
              <p className="text-sm text-foreground/75 leading-relaxed flex-1 mb-6">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-md"
                />
                <div>
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}