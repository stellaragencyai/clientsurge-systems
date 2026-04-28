import { useState, useEffect, useRef } from "react";
import { X, CheckCircle2 } from "lucide-react";

const problems = [
  {
    problem: "Missed calls with no instant text-back",
    solution: "Automatic SMS sent the moment a call is missed — keeps the conversation alive",
    result: "Zero missed opportunities",
  },
  {
    problem: "Form leads followed up too late",
    solution: "Instant automated response within seconds of every form submission",
    result: "Under 60 sec response",
  },
  {
    problem: "No automated SMS or email nurture",
    solution: "14-day automated nurture sequence keeps every lead warm without manual effort",
    result: "14-day nurture",
  },
  {
    problem: "No CRM pipeline tracking every opportunity",
    solution: "Every lead is tracked from first contact to booked appointment automatically",
    result: "Full pipeline visibility",
  },
  {
    problem: "Old leads sit with no reactivation",
    solution: "Reactivation campaigns re-engage dormant contacts and recover lost revenue",
    result: "Old leads re-engaged",
  },
  {
    problem: "Interested people never get pushed to book",
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
    <section id="problem-solution" className="nebula-problem py-24 md:py-32 px-6">
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
          <div
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20"
            aria-hidden="true"
          />

          <div className="space-y-4">
            {problems.map((item, i) => (
              <CardWithFadeIn key={item.problem} delay={i * 80}>
                <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-border shadow-sm">
                  <div className="flex items-center gap-4 px-6 py-5 border-b md:border-b-0 md:border-r border-border" style={{ background: "rgba(255,255,255,0.82)" }}>
                    <div className="w-9 h-9 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
                      <X className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {item.problem}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/45">
                        What usually breaks
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-4 px-6 py-5"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,252,248,1) 100%)",
                      boxShadow:
                        "0 2px 14px rgba(154,92,46,0.05), inset 0 1px 0 rgba(255,255,255,0.7)",
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {item.solution}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 uppercase tracking-[0.08em]">
                        {item.result}
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