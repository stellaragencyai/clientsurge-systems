export default function MedSpaProblem() {
  const problems = [
    "Slow response times mean leads go to competitors",
    "Missed calls turn into lost consultations",
    "No follow-up system means bookings fall through",
    "Front desk gets overwhelmed managing leads",
  ];

  return (
    <section className="py-20 md:py-28 px-6 bg-secondary/30">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 text-center">
          Most Med Spas Lose Leads After They Come In
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12">
          And it's costing you revenue every single day.
        </p>

        <div className="space-y-4">
          {problems.map((problem, i) => (
            <div key={i} className="flex gap-4 p-4 bg-white rounded-lg border border-border">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-destructive font-semibold text-sm">✕</span>
              </div>
              <p className="text-base text-foreground">{problem}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}