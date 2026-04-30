import { useState, useEffect, useRef } from "react";
import { X, CheckCircle2, ArrowRight } from "lucide-react";

const problems = [
  {
    problem: "Leads do not hear back fast enough",
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

function CardWithFadeIn({ children, delay = 0, visible }) {
  return (
    <div
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
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const sectionRef = useRef(null);
  const [sectionVisible, setSectionVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setSectionVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="problem-solution" ref={sectionRef} className="nebula-problem py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">
            Where Leads Are Lost
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Every Problem Has a System Behind It
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            These are the exact gaps hurting conversion and exactly how we solve them.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {[
              "5 conversion leaks",
              "1 connected system",
              "Built around booked appointments",
            ].map((item) => (
              <span
                key={item}
                className="inline-flex rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary"
                style={{
                  background: "rgba(154,92,46,0.08)",
                  borderColor: "rgba(154,92,46,0.16)",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20"
            aria-hidden="true"
          />

          <div className="space-y-4">
            {problems.map((item, i) => (
              <CardWithFadeIn key={item.problem} delay={i * 80} visible={sectionVisible}>
                <div
                  className="group grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-border shadow-sm cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setHighlightedIndex(i)}
                >
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

                  <div
                    data-solution-id={i}
                    className="flex items-center gap-4 px-6 py-5 transition-all duration-500"
                    style={{
                      background:
                        highlightedIndex === i
                          ? "linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.08) 100%)"
                          : "rgba(255,255,255,1)",
                      boxShadow:
                        highlightedIndex === i
                          ? "0 0 25px rgba(34,197,94,0.18)"
                          : "0 2px 14px rgba(154,92,46,0.05), inset 0 1px 0 rgba(255,255,255,0.7)",
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground leading-snug">{item.solution}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                        Highlighted fix
                      </div>
                    </div>
                  </div>
                </div>
              </CardWithFadeIn>
            ))}
          </div>
        </div>

        <div
          className="mt-10 flex flex-col gap-4 rounded-[28px] border px-5 py-5 md:flex-row md:items-center md:justify-between"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(252,247,242,0.84) 100%)",
            borderColor: "rgba(154,92,46,0.14)",
            boxShadow: "0 16px 38px rgba(84,48,20,0.06)",
          }}
        >
          <p className="max-w-2xl text-sm leading-6 text-foreground/72">
            Every card above points to a system we actually install, not a vague
            wishlist of marketing features.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#services"
              className="inline-flex items-center justify-center rounded-full border border-primary/18 bg-primary/6 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Review the 8-system flow
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-full border border-[rgba(154,92,46,0.16)] bg-white/75 px-5 py-3 text-sm font-semibold text-foreground/78 transition-colors hover:bg-white"
            >
              See plan options
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
