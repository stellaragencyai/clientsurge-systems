import { useEffect, useRef, useState } from "react";
import { Clock, PhoneMissed, Users, AlertTriangle, Archive, ArrowRight, Zap, MessageCircle, Phone, CheckSquare2, RefreshCw, Hourglass } from "lucide-react";

const pairs = [
  {
    problemIcon: Hourglass,
    problem: "You're Too Slow to Respond",
    problemDesc: "The average business takes 47 hours to reply. By then, they've already booked your competitor.",
    solutionIcon: Zap,
    solution: "Instant Lead Response",
    solutionDesc: "Capture leads before competitors respond.",
  },
  {
    problemIcon: Phone,
    problem: "Missed Calls Are Missed Revenue",
    problemDesc: "Every unanswered call is a customer you paid to attract — walking straight to someone else.",
    solutionIcon: MessageCircle,
    solution: "Missed Call Text-Back",
    solutionDesc: "Recover revenue from every missed call.",
  },
  {
    problemIcon: Users,
    problem: "Your Team Can't Keep Up",
    problemDesc: "Front desks handle walk-ins, phones, and messages at once. Follow-up is an afterthought.",
    solutionIcon: CheckSquare2,
    solution: "Automated Follow-Up",
    solutionDesc: "Turn more inquiries into booked appointments.",
  },
  {
    problemIcon: AlertTriangle,
    problem: "No System Means No Follow-Up",
    problemDesc: "A warm lead left without contact for 24 hours is a cold lead. Without automation, that's most of your pipeline.",
    solutionIcon: Zap,
    solution: "Booking Flow Automation",
    solutionDesc: "Guide leads directly to scheduling without friction.",
  },
  {
    problemIcon: Archive,
    problem: "Old Leads Are Sitting Untouched",
    problemDesc: "You already paid to get them. Without a reactivation system, that investment is rotting in a spreadsheet.",
    solutionIcon: RefreshCw,
    solution: "Lead Reactivation",
    solutionDesc: "Turn old leads into new revenue.",
  },
];

function CardWithFadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function ProblemSolution() {
  return (
    <section id="services" className="py-24 md:py-32 px-6 bg-gradient-to-b from-card to-background">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-20">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Problem & The Fix</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
            You Don't Have a Lead Problem.
            <br />
            <span className="text-primary">You Have a Follow-Up Problem.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
            Every delayed response is lost revenue. Here's where it breaks — and exactly how we fix it.
          </p>
        </div>

        {/* Column labels */}
        <div className="hidden md:grid grid-cols-[1fr_50px_1fr] gap-6 mb-8 px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-destructive/60 text-center">The Problem</p>
          <div />
          <p className="text-xs font-bold uppercase tracking-widest text-primary text-center">The Solution</p>
        </div>

        {/* Paired rows */}
        <div className="space-y-6">
          {pairs.map((pair, i) => {
            const ProblemIcon = pair.problemIcon;
            const SolutionIcon = pair.solutionIcon;
            return (
              <div key={i} className="grid md:grid-cols-[1fr_50px_1fr] gap-6 items-center">

                {/* Problem */}
                <CardWithFadeIn delay={i * 50}>
                  <div className="flex items-start gap-5 p-7 rounded-3xl bg-white border-2 border-destructive/25 hover:border-destructive/40 hover:shadow-lg transition-all duration-300 group cursor-default">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-destructive/15 flex items-center justify-center group-hover:bg-destructive/25 transition-colors duration-300">
                      <ProblemIcon className="w-7 h-7 text-destructive/70" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-foreground mb-2">{pair.problem}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{pair.problemDesc}</p>
                    </div>
                  </div>
                </CardWithFadeIn>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary/30 border-2 border-primary flex items-center justify-center animate-pulse">
                    <ArrowRight className="w-5 h-5 text-primary" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="md:hidden flex justify-center">
                  <ArrowRight className="w-5 h-5 text-primary rotate-90" strokeWidth={2.5} />
                </div>

                {/* Solution */}
                <CardWithFadeIn delay={i * 50 + 100}>
                  <div className="flex items-start gap-5 p-7 rounded-3xl bg-gradient-to-br from-primary/12 to-primary/5 border-2 border-primary/35 hover:border-primary/60 hover:shadow-lg transition-all duration-300 group cursor-default">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/25 flex items-center justify-center group-hover:bg-primary/35 transition-colors duration-300">
                      <SolutionIcon className="w-7 h-7 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-foreground mb-2">{pair.solution}</h3>
                      <p className="text-sm text-primary/75 font-medium leading-relaxed">{pair.solutionDesc}</p>
                    </div>
                  </div>
                </CardWithFadeIn>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}