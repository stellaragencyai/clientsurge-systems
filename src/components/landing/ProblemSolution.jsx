import { useState, useEffect, useRef } from "react";
import { X, CheckCircle2 } from "lucide-react";

const problems = [
  {
    problem: "Missed calls with no instant text-back",
    stat: "62% of callers won't leave a voicemail",
    solution: "Automatic SMS sent the moment a call is missed — keeps the conversation alive",
    result: "Zero missed opportunities",
  },
  {
    problem: "Form leads followed up too late",
    stat: "Odds of qualifying a lead drop 21× after 5 minutes",
    solution: "Instant automated response within seconds of every form submission",
    result: "Under 60 sec response",
  },
  {
    problem: "No automated SMS or email nurture",
    stat: "80% of sales require 5+ follow-up touchpoints",
    solution: "14-day automated nurture sequence keeps every lead warm without manual effort",
    result: "14-day nurture",
  },
  {
    problem: "No CRM pipeline tracking every opportunity",
    stat: "Companies lose 20–30% of revenue to poor pipeline visibility",
    solution: "Every lead is tracked from first contact to booked appointment automatically",
    result: "Full pipeline visibility",
  },
  {
    problem: "Old leads sit with no reactivation",
    stat: "56% of old leads convert when properly re-engaged",
    solution: "Reactivation campaigns re-engage dormant contacts and recover lost revenue",
    result: "Old leads re-engaged",
  },
  {
    problem: "Interested people never get pushed to book",
    stat: "Guided booking increases conversions by up to 3×",
    solution: "Guided booking flow converts warm inquiries into confirmed appointments",
    result: "Cleaner path to booking",
  },
];

function CardWithFadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
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
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  );
}

export default function ProblemSolution() {
  return (
    <section id="problem-solution" className="nebula-problem py-16 md:py-32 px-4 md:px-6" style={{ overflowX: "hidden" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">
            Where Leads Are Lost
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
            You Don't Need More Leads —<br className="hidden md:block" /> You're Losing the Ones You Already Have
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Most local businesses don't lose money because nobody is interested. They lose money because calls get missed, form leads sit too long, follow-up happens manually, and interested people never get pushed into a booking flow.
          </p>
        </div>

        <div className="relative">
          {/* Column headers */}
          <div className="grid md:grid-cols-2 gap-5 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-destructive/15 flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-destructive" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-destructive/70">What Usually Breaks</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">How We Fix It</p>
            </div>
          </div>

          {/* Rows — each problem paired with its solution */}
          <div className="space-y-3">
            {problems.map((item, i) => (
              <CardWithFadeIn key={item.problem} delay={i * 70}>
                <div className="grid md:grid-cols-2 gap-5 items-stretch">
                  {/* Problem */}
                  <div
                    className="rounded-2xl px-5 py-4 border border-red-200/60 relative overflow-hidden flex items-start gap-3"
                    style={{
                      background: "rgba(255,255,255,0.55)",
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                      boxShadow: "0 4px 20px rgba(220,38,38,0.06), inset 0 1px 0 rgba(255,255,255,0.85)",
                      animation: `problemSlideIn 0.7s ease-out ${i * 0.15}s both`,
                    }}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-px"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(220,38,38,0.18), transparent)" }}
                    />
                    <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200/70 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground leading-snug">{item.problem}</p>
                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200/60 uppercase tracking-[0.08em]">
                        <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                        {item.stat}
                      </div>
                    </div>
                  </div>

                  {/* Solution */}
                  <div
                    className="rounded-2xl px-5 py-4 border border-primary/20 relative overflow-hidden flex items-start gap-3"
                    style={{
                      background: "rgba(255,255,255,0.55)",
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                      boxShadow: "0 4px 20px rgba(154,92,46,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
                      animation: `solutionSlideIn 0.7s ease-out ${0.2 + i * 0.15}s both`,
                    }}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute left-0 top-0 h-full w-1"
                      style={{
                        background: "linear-gradient(to bottom, #9a5c2e, rgba(154,92,46,0))",
                        animation: `progressFill 0.8s ease-out ${0.25 + i * 0.15}s both`,
                      }}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-px"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(154,92,46,0.25), transparent)" }}
                    />
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground leading-snug">{item.solution}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 uppercase tracking-[0.08em]">
                        {item.result}
                      </div>
                    </div>
                  </div>
                </div>
              </CardWithFadeIn>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes problemSlideIn {
            from {
              opacity: 0;
              transform: translateX(-12px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes solutionSlideIn {
            from {
              opacity: 0;
              transform: translateX(12px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes progressFill {
            from {
              height: 0%;
              opacity: 0;
            }
            to {
              height: 100%;
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </section>
  );
}