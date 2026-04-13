const reasons = [
  {
    title: "We Focus on Revenue, Not Features",
    desc: "We don't sell software. We build systems designed to fill your calendar and increase what you earn. Every component has one job: drive bookings.",
  },
  {
    title: "Implemented in Days, Not Months",
    desc: "Most clients are live within 5–7 business days. We handle every detail of the setup — you don't need to be technical or carve out weeks of your schedule.",
  },
  {
    title: "Custom-Built for Your Business",
    desc: "There's no template. We map your lead sources, your workflow, and your goals — then build a system that fits how your business actually operates.",
  },
  {
    title: "Zero Disruption to Your Team",
    desc: "Our systems work in the background. Your staff doesn't need to learn new tools or change how they work. It just runs.",
  },
  {
    title: "We Only Build What Works",
    desc: "No bloated platforms. No feature overload. Clean, reliable automation that does exactly what it's supposed to — and nothing more.",
  },
  {
    title: "You Keep Every Dollar It Generates",
    desc: "Our systems are built to return far more than they cost. If the ROI isn't clear, we'll tell you that before you sign anything.",
  },
];

export default function WhyUs() {
  return (
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-card via-background to-card">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Why ApexFlow</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            We're Not a Platform. We're Your Implementation Partner.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((r, i) => (
            <div key={i} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="w-8 h-0.5 bg-primary mb-5 rounded-full" />
              <h3 className="text-base font-semibold text-foreground mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}