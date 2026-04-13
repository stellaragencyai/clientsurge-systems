import { Clock, PhoneMissed, Users, AlertTriangle, Archive } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Slow Response Times",
    desc: "The average business takes 47 hours to respond to a lead. By then, they've already booked elsewhere.",
  },
  {
    icon: PhoneMissed,
    title: "Missed Calls = Missed Revenue",
    desc: "Every unanswered call is a potential customer choosing your competitor instead.",
  },
  {
    icon: Users,
    title: "Overwhelmed Staff",
    desc: "Your front desk is juggling walk-ins, calls, and messages — follow-up falls to the bottom of the list.",
  },
  {
    icon: AlertTriangle,
    title: "Leads Fall Through the Cracks",
    desc: "Without a system, warm leads cool off fast. No follow-up means no booking.",
  },
  {
    icon: Archive,
    title: "Old Leads Sit Untouched",
    desc: "You've already paid to acquire them. But without reactivation, that investment is wasted.",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">The Real Issue</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
            Most Businesses Don't Have a Lead Problem —{" "}
            <span className="text-primary">They Have a Follow-Up Problem</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}