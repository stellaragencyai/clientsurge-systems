export default function ProblemSection() {
  const steps = [
    'Leads come in',
    'Staff is busy',
    'Response is delayed',
    'Calls are missed',
    'Follow-up never happens',
    'Revenue disappears silently',
  ];

  return (
    <section className="py-24 md:py-32 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4 text-center">
          You're not losing leads.
        </h2>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-primary text-center mb-16">
          You're losing them after they contact you.
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-xs font-semibold text-primary">{i + 1}</span>
              </div>
              <p className="text-lg text-foreground font-medium">{step}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-card rounded-xl border border-border text-center">
          <p className="text-muted-foreground text-base leading-relaxed">
            Every hour a lead goes unresponded to, the chance of conversion drops by 50%. By the next day, they've already booked with your competitor.
          </p>
        </div>
      </div>
    </section>
  );
}