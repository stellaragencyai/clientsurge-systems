import { useState } from "react";
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

const ProblemCard = ({ problem }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`p-6 rounded-2xl bg-background/5 transition-all duration-300 transform ${hovered ? "border border-slate-600 -translate-y-1 shadow-lg" : "border border-transparent"}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all ${hovered ? "bg-primary/30 scale-110" : "bg-primary/20"}`}>
        <problem.icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-background mb-2">{problem.title}</h3>
      <p className="text-sm text-background/60 leading-relaxed">{problem.desc}</p>
    </div>
  );
};

export default function ProblemSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-foreground">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Real Problem</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-background leading-tight">
            You Don't Have a Lead Problem.
            <br />
            <span className="text-primary">You Have a Follow-Up Problem.</span>
          </h2>
          <p className="mt-5 text-background/60 text-lg leading-relaxed">
            Every delayed response is lost revenue. Every missed call is a booking that went elsewhere.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((p, i) => (
            <ProblemCard key={i} problem={p} />
          ))}
        </div>
      </div>
    </section>
  );
}