export default function MedSpaSpecific() {
  const points = [
    "Your services are high-ticket. One missed lead = hundreds in lost revenue.",
    "Consultations are crucial. Fast response determines who gets booked.",
    "Front desk is already overwhelmed. They can't manage more leads manually.",
    "Your leads expect a professional, fast response. You need to deliver.",
  ];

  return (
    <section className="py-20 md:py-28 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 text-center">
          Built Specifically For Med Spas
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12">
          Not a generic solution. Built for how you actually work.
        </p>

        <div className="space-y-6">
          {points.map((point, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">{i + 1}</span>
              </div>
              <p className="text-base text-foreground leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}