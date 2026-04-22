import { useState, useEffect, useRef } from "react";
import { X, CheckCircle2, ArrowRight } from "lucide-react";

const problems = [
  {
    problem: "Leads don't hear back fast enough",
    solution: "Instant automated response within seconds of inquiry",
  },
  {
    problem: "Missed calls go unanswered",
    solution: "Automatic text-back sent the moment a call is missed",
  },
  {
    problem: "Follow-up falls through the cracks",
    solution: "14-day automated nurture sequence keeps leads warm",
  },
  {
    problem: "Old leads are forgotten",
    solution: "Reactivation campaigns turn dormant contacts into revenue",
  },
  {
    problem: "Booking friction loses clients",
    solution: "Guided booking flow converts inquiries to confirmed appointments",
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
    <section id="problem-solution" className="nebula-problem py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">
            Where Leads Are Lost
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Every Problem Has a System Behind It
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            These are the exact gaps killing your conversion rate — and exactly how we fix them.
          </p>
        </div>

        <div className="relative">
          {/* Connecting flow line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20" aria-hidden="true" />
          
          <div className="space-y-4">
            {problems.map((item, i) => (
              <CardWithFadeIn key={i} delay={i * 80}>
                <div 
                  className="group grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-border shadow-sm cursor-pointer hover:shadow-md transition-all"
                  onClick={() => {
                    const solEl = document.querySelector(`[data-solution-id="${i}"]`);
                    if (solEl) {
                      solEl.style.background = "linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.1) 100%)";
                      solEl.style.boxShadow = "0 0 25px rgba(34,197,94,0.25)";
                      setTimeout(() => {
                        solEl.style.background = "rgba(34,197,94,0.05)";
                        solEl.style.boxShadow = "0 2px 14px rgba(154,92,46,0.05), inset 0 1px 0 rgba(255,255,255,0.7)";
                      }, 1500);
                    }
                  }}
                >
                  {/* Problem side */}
                  <div className="flex items-center gap-4 px-6 py-5 bg-white border-b md:border-b-0 md:border-r border-border">
                    <div className="w-9 h-9 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
                      <X className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground leading-snug">{item.problem}</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to highlight <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                  {/* Solution side */}
                  <div 
                    data-solution-id={i}
                    className="flex items-center gap-4 px-6 py-5 bg-white transition-all duration-500"
                    style={{
                      background: "rgba(255,255,255,1)",
                      boxShadow: "0 2px 14px rgba(154,92,46,0.05), inset 0 1px 0 rgba(255,255,255,0.7)",
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground leading-snug">{item.solution}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                        ✨ +3x Bookings
                      </div>
                    </div>
                  </div>
                </div>
              </CardWithFadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}