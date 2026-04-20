const points = [
  {
    title: "High-value treatments require fast trust",
    desc: "Botox, fillers, lasers — these are not impulse purchases. Leads are doing research. Fast, professional follow-up signals that your spa is serious.",
  },
  {
    title: "Consultations don't fill themselves",
    desc: "Every treatment starts with a consultation. The more consultations you book, the more revenue you generate. Speed and follow-up determine who gets that slot.",
  },
  {
    title: "Your front desk wasn't built for this",
    desc: "Your staff is excellent with clients. But manually chasing new leads, sending follow-ups, and re-engaging old contacts isn't their job. It's ours.",
  },
  {
    title: "Leads in your niche are highly competitive",
    desc: "Multiple med spas may be targeting the same customers. The one that responds first and follows up best wins. Every time.",
  },
];

export default function MedSpaSpecific() {
  return (
    <section className="py-24 md:py-32 px-6 bg-muted">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left: image stack */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=70&auto=format"
                alt="Luxury med spa interior"
                loading="lazy"
                className="w-full h-80 object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-4 w-40 h-40 rounded-2xl overflow-hidden shadow-xl border-4 border-white hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1552693673-1bf958298935?w=300&q=70&auto=format"
                alt="Med spa treatment"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right: content */}
          <div className="md:pl-4">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Why Med Spas Specifically</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
              Built Specifically for Med Spas
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              This isn't a generic CRM. It's a system designed around the way med spas actually operate — high-value treatments, consultation-based booking, and a front desk that simply cannot handle everything manually.
            </p>
            <div className="space-y-5">
              {points.map((p, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs font-display mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">{p.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}