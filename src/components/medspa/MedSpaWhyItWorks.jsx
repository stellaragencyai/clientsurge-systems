const points = [
  {
    number: "01",
    title: "Most leads convert when contacted quickly",
    desc: "The first business to respond wins the booking. Speed is the single biggest factor in lead conversion.",
  },
  {
    number: "02",
    title: "Most businesses don't follow up consistently",
    desc: "Manual follow-up is unreliable. Leads fall through the cracks. This system makes sure every single one gets contacted.",
  },
  {
    number: "03",
    title: "Faster response leads to more booked appointments",
    desc: "Simple math — respond faster, follow up better, book more. This is the entire point of the system.",
  },
];

export default function MedSpaWhyItWorks() {
  return (
    <section className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">The Logic</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
            Why This Works
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {points.map((p, i) => (
            <div key={i} className="p-7 bg-gradient-to-br from-[#FAFAF8] to-white rounded-2xl border border-border hover:border-primary/40 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-4">
                <span className="text-5xl font-bold text-primary/20 font-display">{p.number}</span>
                <div className="w-2 h-2 rounded-full bg-primary/30 mt-2" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-3">{p.title}</h3>
              <div className="w-1 h-0.5 bg-gradient-to-r from-primary to-transparent mb-3" />
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}