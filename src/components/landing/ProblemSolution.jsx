import { useEffect, useRef, useState } from "react";
import { Clock, PhoneMissed, Users, AlertTriangle, Archive, Zap, MessageCircle, Phone, CheckSquare2, RefreshCw, Hourglass } from "lucide-react";

const pairs = [
  {
    problemIcon: Hourglass,
    problem: "You're Too Slow to Respond",
    problemDesc: "The average business takes 47 hours to reply. By then, they've already booked your competitor.",
    solutionIcon: Zap,
    solution: "Instant Lead Response",
    solutionDesc: "Respond in under 60 seconds — automatically, 24/7.",
  },
  {
    problemIcon: Phone,
    problem: "Missed Calls Are Missed Revenue",
    problemDesc: "Every unanswered call is a customer you paid to attract — walking straight to someone else.",
    solutionIcon: MessageCircle,
    solution: "Missed Call Text-Back",
    solutionDesc: "Text them back instantly. Recover the lead before they dial your competitor.",
  },
  {
    problemIcon: Users,
    problem: "Your Team Can't Keep Up",
    problemDesc: "Front desks handle walk-ins, phones, and messages at once. Follow-up is an afterthought.",
    solutionIcon: CheckSquare2,
    solution: "Automated Follow-Up",
    solutionDesc: "Smart sequences handle the repetition. Your team focuses on closing deals.",
  },
  {
    problemIcon: AlertTriangle,
    problem: "No System Means No Follow-Up",
    problemDesc: "A warm lead left without contact for 24 hours is a cold lead. Without automation, that's most of your pipeline.",
    solutionIcon: Zap,
    solution: "Booking Flow Automation",
    solutionDesc: "Guide leads directly to your calendar. No phone tag. No friction.",
  },
  {
    problemIcon: Archive,
    problem: "Old Leads Are Sitting Untouched",
    problemDesc: "You already paid to get them. Without a reactivation system, that investment is rotting in a spreadsheet.",
    solutionIcon: RefreshCw,
    solution: "Lead Reactivation",
    solutionDesc: "Turn cold leads back into revenue with proven re-engagement campaigns.",
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
    <section id="services" className="py-20 md:py-28 px-4 md:px-6 bg-gradient-to-b from-card to-background">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Problem & The Fix</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight mb-6">
            You Don't Have a Lead Problem.
            <br />
            <span className="text-primary">You Have a Follow-Up Problem.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Every delayed response is lost revenue. Here's where it breaks — and exactly how we fix it.
          </p>
        </div>

        {/* Paired rows */}
        <div className="space-y-8">
          {pairs.map((pair, i) => {
            const ProblemIcon = pair.problemIcon;
            const SolutionIcon = pair.solutionIcon;

            return (
              <div key={i} className="grid md:grid-cols-2 gap-6 items-stretch">

                {/* Problem */}
                <CardWithFadeIn delay={i * 40}>
                  <div 
                    className="flex items-start gap-4 p-7 rounded-2xl border transition-all duration-300 hover:border-red-400 hover:shadow-lg bg-red-50/40 min-h-36"
                    style={{
                      borderColor: `rgba(239,68,68,0.2)`,
                    }}
                  >
                    <div 
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 bg-red-200/50"
                    >
                      <ProblemIcon 
                        className="w-6 h-6"
                        style={{
                          color: `rgba(239,68,68,0.8)`,
                        }}
                        strokeWidth={1.5} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground mb-2">{pair.problem}</h3>
                      <p className="text-sm text-foreground/70 leading-relaxed">{pair.problemDesc}</p>
                    </div>
                  </div>
                </CardWithFadeIn>

                {/* Solution */}
                <CardWithFadeIn delay={i * 40 + 80}>
                  <div 
                    className="flex items-start gap-4 p-7 rounded-2xl border transition-all duration-300 hover:border-amber-500 hover:shadow-lg bg-amber-50/40 min-h-36"
                    style={{
                      borderColor: `rgba(161,120,35,0.2)`,
                    }}
                  >
                    <div 
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 bg-amber-200/50"
                    >
                      <SolutionIcon 
                        className="w-6 h-6"
                        style={{
                          color: `rgba(161,120,35,0.8)`,
                        }}
                        strokeWidth={1.5} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground mb-2">{pair.solution}</h3>
                      <p className="text-sm text-foreground/70 leading-relaxed">
                        {pair.solutionDesc}
                      </p>
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