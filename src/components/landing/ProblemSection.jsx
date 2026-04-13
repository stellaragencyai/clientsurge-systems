import { Clock, PhoneMissed, Users, AlertTriangle, Archive } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "You're Too Slow to Respond",
    desc: "The average business takes 47 hours to reply to a new lead. In that window, they've already booked your competitor. Speed wins.",
  },
  {
    icon: PhoneMissed,
    title: "Missed Calls Are Missed Revenue",
    desc: "Every unanswered call is a customer you paid to attract — walking straight to someone else. It adds up faster than you think.",
  },
  {
    icon: Users,
    title: "Your Team Can't Keep Up",
    desc: "Front desks handle walk-ins, phones, and messages at the same time. Follow-up is an afterthought. Leads slip through.",
  },
  {
    icon: AlertTriangle,
    title: "No System Means No Follow-Up",
    desc: "A warm lead left without contact for 24 hours is a cold lead. Without automation, that's most of your pipeline.",
  },
  {
    icon: Archive,
    title: "Old Leads Are Sitting Untouched",
    desc: "You already paid to get them. But without a reactivation system, that investment is quietly rotting in a spreadsheet.",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-card to-background">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Real Problem</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
            You Don't Have a Lead Problem.
            <br />
            <span className="text-primary">You Have a Follow-Up Problem.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
            Every delayed response is lost revenue. Every missed call is a booking that went elsewhere.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((p, i) => (
            <div key={i} className="p-6 rounded-2xl border border-border bg-white hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}