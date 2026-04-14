const bullets = [
  "Botox and filler inquiries need fast response",
  "Missed calls turn into lost high-value clients",
  "Front desk teams are often overloaded",
  "Most leads are never followed up properly",
];

export default function MedSpaPositioning() {
  return (
    <section className="py-16 md:py-20 px-6 bg-primary/5 border-y border-primary/10">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-8">
          Built for Med Spas That Want More Booked Consultations
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {bullets.map((b, i) => (
            <div key={i} className="flex items-start gap-3 text-left bg-white rounded-xl px-5 py-4 border border-primary/15 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              <span className="text-sm font-medium text-foreground/80">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}