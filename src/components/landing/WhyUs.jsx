import { Target, Lightbulb, Settings, Building, Puzzle, BarChart3 } from "lucide-react";

const reasons = [
  {
    icon: Target,
    title: "Outcome-Focused Approach",
    desc: "We don't sell software. We deliver booked appointments and measurable revenue growth.",
  },
  {
    icon: Lightbulb,
    title: "Simple Implementation",
    desc: "No disruption to your operations. We integrate seamlessly with your existing tools and workflows.",
  },
  {
    icon: Settings,
    title: "Tailored Systems",
    desc: "Every automation is customized to your business, your audience, and your goals.",
  },
  {
    icon: Building,
    title: "Built for Real Businesses",
    desc: "Not theoretical. Our systems are designed for the day-to-day reality of service businesses.",
  },
  {
    icon: Puzzle,
    title: "No Unnecessary Complexity",
    desc: "We build what works and nothing more. Clean, reliable, and easy for your team to use.",
  },
  {
    icon: BarChart3,
    title: "Designed for ROI",
    desc: "Every system we build is engineered to deliver a return that far exceeds your investment.",
  },
];

export default function WhyUs() {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">
            The Difference
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Why Businesses Choose Us
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((r, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <r.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}