import { useEffect, useRef, useState } from "react";
import { Clock, PhoneMissed, Users, AlertTriangle, Archive, ArrowRight, Zap, MessageCircle, Phone, CheckSquare2, RefreshCw, Hourglass } from "lucide-react";

let scrollY = 0;
if (typeof window !== "undefined") {
  scrollY = window.scrollY;
}

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
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section ref={sectionRef} id="services" className="py-24 md:py-32 px-6 bg-gradient-to-b from-card to-background">
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
            const colorProgress = Math.max(0, Math.min(1, scrollProgress - i * 0.08));
            const parallaxOffsetProblem = scrollProgress * -15;
            const parallaxOffsetSolution = scrollProgress * 15;

            return (
              <div key={i} className="grid md:grid-cols-[1fr_50px_1fr] gap-6 items-center">

                {/* Problem */}
                <CardWithFadeIn delay={i * 50}>
                  <div 
                    className="flex items-start gap-5 p-7 rounded-2xl border hover:border-black/40 hover:shadow-lg transition-all duration-300 group cursor-default min-h-40 bg-red-50/60"
                    style={{
                      transform: `translateY(${parallaxOffsetProblem}px)`,
                      borderColor: `rgba(239,68,68,${0.2})`,
                    }}
                  >
                    <div 
                      className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 bg-red-200/50"
                    >
                      <ProblemIcon 
                        className="w-7 h-7"
                        style={{
                          color: `rgba(239,68,68,0.7)`,
                        }}
                        strokeWidth={1.5} 
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-foreground mb-2">{pair.problem}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{pair.problemDesc}</p>
                    </div>
                  </div>
                </CardWithFadeIn>

                {/* Solution */}
                <CardWithFadeIn delay={i * 50 + 100}>
                  <div 
                    className="flex items-start gap-5 p-7 rounded-2xl border hover:border-black/40 hover:shadow-lg transition-all duration-300 group cursor-default min-h-40 bg-amber-50/60"
                    style={{
                      transform: `translateY(${parallaxOffsetSolution}px)`,
                      borderColor: `rgba(161,120,35,${0.2})`,
                    }}
                  >
                    <div 
                      className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 bg-amber-200/50"
                    >
                      <SolutionIcon 
                        className="w-7 h-7"
                        style={{
                          color: `rgba(161,120,35,0.7)`,
                        }}
                        strokeWidth={1.5} 
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-foreground mb-2">{pair.solution}</h3>
                      <p 
                        className="text-sm font-medium leading-relaxed transition-colors duration-300"
                        style={{color: `rgba(161,120,35,${0.5 + colorProgress * 0.5})`}}
                      >
                        {pair.solutionDesc}
                      </p>
                    </div>
                  </div>
                </CardWithFadeIn>

              </div>
            );
          })}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>

      </div>
    </section>
  );
}