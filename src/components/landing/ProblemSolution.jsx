import { useEffect, useRef } from "react";
import { Users, AlertTriangle, Archive, Zap, MessageCircle, CheckSquare2, RefreshCw, Hourglass, Phone, ArrowRight } from "lucide-react";

const pairs = [
  {
    problemIcon: Hourglass,
    problem: "You're Too Slow to Respond",
    problemDesc: "The average business takes 47 hours to reply. By then, they've already booked your competitor.",
    solutionIcon: Zap,
    solution: "Instant Lead Response",
    solutionDesc: "Respond in under 60 seconds  -  automatically, 24/7.",
  },
  {
    problemIcon: Phone,
    problem: "Missed Calls Are Missed Revenue",
    problemDesc: "Every unanswered call is a customer you paid to attract  -  walking straight to someone else.",
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

// FIX 2: Single shimmer keyframe at module level  -  not duplicated per card
const sectionStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

function CardWithFadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          // FIX 5 (functionality): disconnect after first trigger  -  no wasted observers
          observer.disconnect();
        }
      },
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
    <section id="services" className="py-20 md:py-28 px-4 md:px-6 relative overflow-hidden">
      {/* Single style block  -  no duplicates */}
      <style>{sectionStyles}</style>

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-amber-50/30 to-background pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-amber-100/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-red-100/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Problem & The Fix</p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight mb-6">
            You Don't Have a Lead Problem.
            <br />
            <span className="text-primary">You Have a Follow-Up Problem.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Every delayed response is lost revenue. Here's where it breaks  -  and exactly how we fix it.
          </p>
        </div>

        {/* Paired rows */}
        <div className="space-y-6">
          {pairs.map((pair, i) => {
            const ProblemIcon = pair.problemIcon;
            const SolutionIcon = pair.solutionIcon;

            return (
              <div key={i} className="grid md:grid-cols-[1fr_auto_1fr] gap-0 items-center">

                {/* Problem card */}
                <CardWithFadeIn delay={i * 40}>
                  <div
                    className="flex items-start gap-4 p-7 rounded-2xl relative overflow-hidden group h-full"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,220,220,0.08) 0%, rgba(220,60,60,0.04) 100%)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: "1px solid rgba(220,80,80,0.20)",
                      boxShadow: "0 4px 24px rgba(167,42,42,0.06), inset 0 1px 0 rgba(255,200,200,0.15), 0 0 40px rgba(180,40,40,0.04)",
                      transition: "box-shadow 0.35s ease, transform 0.35s ease, border-color 0.35s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 20px 52px rgba(167,42,42,0.18), inset 0 1px 0 rgba(255,200,200,0.35), 0 0 60px rgba(180,40,40,0.12)";
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.borderColor = "rgba(220,80,80,0.45)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 4px 24px rgba(167,42,42,0.08), inset 0 1px 0 rgba(255,200,200,0.25), 0 0 40px rgba(180,40,40,0.06)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "rgba(220,80,80,0.25)";
                    }}
                  >
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full" style={{ background: "linear-gradient(to bottom, rgba(167,42,42,0.7), rgba(167,42,42,0.1))" }} />

                    {/* Glass shimmer on hover */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl"
                      style={{ background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)", animation: "shimmer 2.5s infinite" }}
                    />

                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(167,42,42,0.10)" }}>
                      <ProblemIcon className="w-6 h-6" style={{ color: "#a72a2a" }} strokeWidth={1.5} />
                    </div>

                    <div className="flex-1 min-w-0 relative z-10">
                      {/* FIX 4 (functionality): Problem/Fix badge label */}
                      <span className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2" style={{ background: "rgba(167,42,42,0.1)", color: "#a72a2a" }}>
                        The Problem
                      </span>
                      <h3 className="text-base font-bold text-foreground mb-2">{pair.problem}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{pair.problemDesc}</p>
                    </div>
                  </div>
                </CardWithFadeIn>

                {/* Arrow connector between the two cards */}
                <div className="hidden md:flex flex-col items-center justify-center px-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-md flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#9a5c2e,#7a4825)", border: "2px solid white" }}>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-100" />
                  </div>
                </div>

                {/* Solution card */}
                <CardWithFadeIn delay={i * 40 + 80}>
                  <div
                    className="flex items-start gap-4 p-7 rounded-2xl relative overflow-hidden group h-full"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,245,215,0.08) 0%, rgba(154,92,46,0.05) 100%)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: "1px solid rgba(200,150,92,0.22)",
                      boxShadow: "0 4px 24px rgba(154,92,46,0.06), inset 0 1px 0 rgba(255,220,150,0.12), 0 0 40px rgba(154,92,46,0.05)",
                      transition: "box-shadow 0.35s ease, transform 0.35s ease, border-color 0.35s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 20px 52px rgba(154,92,46,0.20), inset 0 1px 0 rgba(255,220,150,0.35), 0 0 60px rgba(154,92,46,0.13)";
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.borderColor = "rgba(200,150,92,0.55)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 4px 24px rgba(154,92,46,0.09), inset 0 1px 0 rgba(255,220,150,0.2), 0 0 40px rgba(154,92,46,0.07)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "rgba(200,150,92,0.30)";
                    }}
                  >
                    {/* Right accent bar */}
                    <div className="absolute right-0 top-4 bottom-4 w-1 rounded-full" style={{ background: "linear-gradient(to bottom, rgba(154,92,46,0.75), rgba(154,92,46,0.1))" }} />

                    {/* Glass shimmer on hover */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl"
                      style={{ background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)", animation: "shimmer 2.5s infinite" }}
                    />

                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(154,92,46,0.12)" }}>
                      <SolutionIcon className="w-6 h-6" style={{ color: "#9a5c2e" }} strokeWidth={1.5} />
                    </div>

                    <div className="flex-1 min-w-0 relative z-10">
                      {/* Fix badge */}
                      <span className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2" style={{ background: "rgba(154,92,46,0.12)", color: "#7a4825" }}>
                        The Fix
                      </span>
                      <h3 className="text-base font-bold text-foreground mb-2">{pair.solution}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{pair.solutionDesc}</p>
                    </div>
                  </div>
                </CardWithFadeIn>

              </div>
            );
          })}
        </div>

        {/* Next Step */}
        <div className="mt-16 text-center">
          <p className="text-foreground font-semibold text-base mb-6">
            Ready to fix all 5 of these in your business?
          </p>
          <a
            href="#how-it-works-section"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            See the 4-step system below
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="mt-4 text-xs text-muted-foreground">No commitment • Live in 5-7 days • Fully done-for-you</p>
        </div>

      </div>
    </section>
  );
}


