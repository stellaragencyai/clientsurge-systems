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
    <section className="py-20 md:py-28 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">The Logic</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
            Why This Works
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {points.map((p, i) => (
            <div key={i} className="p-7 bg-[#FAFAF8] rounded-2xl border border-border hover:border-primary/25 hover:shadow-sm transition-all">
              <span className="text-4xl font-bold text-primary/15 font-display block mb-4">{p.number}</span>
              <h3 className="text-base font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}