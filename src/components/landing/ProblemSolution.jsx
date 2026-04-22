import { useState, useEffect, useRef } from "react";
import { X, CheckCircle2 } from "lucide-react";

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
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
            Every Problem Has a System Behind It
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            These are the exact gaps killing your conversion rate — and exactly how we fix them.
          </p>
        </div>

        <div className="space-y-4">
          {problems.map((item, i) => (
            <CardWithFadeIn key={i} delay={i * 80}>
              <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-border shadow-sm">
                {/* Problem side */}
                <div className="flex items-center gap-4 px-6 py-5 bg-destructive/5 border-b md:border-b-0 md:border-r border-border">
                  <div className="w-9 h-9 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-destructive" />
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug">{item.problem}</p>
                </div>
                {/* Solution side */}
                <div className="flex items-center gap-4 px-6 py-5 bg-primary/5">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug">{item.solution}</p>
                </div>
              </div>
            </CardWithFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}