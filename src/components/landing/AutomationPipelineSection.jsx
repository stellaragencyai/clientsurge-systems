import { useEffect, useRef, useState } from "react";
import { CalendarCheck, HeadphonesIcon, LayoutDashboard, MessageSquare, PhoneCall, RotateCcw, Send, Zap } from "lucide-react";

const stages = [
  {
    id: "lead-in",
    icon: Zap,
    eyebrow: "Trigger",
    title: "Lead comes in",
    copy: "A call, form, ad lead, or direct inquiry enters the system and gets captured immediately.",
  },
  {
    id: "instant-response",
    icon: MessageSquare,
    eyebrow: "Speed",
    title: "Instant response",
    copy: "The system replies right away so you show up first while intent is still high.",
  },
  {
    id: "missed-call",
    icon: PhoneCall,
    eyebrow: "Coverage",
    title: "Missed-call recovery",
    copy: "If nobody answers, a text-back keeps the conversation alive instead of losing the lead.",
  },
  {
    id: "follow-up",
    icon: Send,
    eyebrow: "Nurture",
    title: "Follow-up runs",
    copy: "Automated sequences keep warm leads moving until they reply, book, or clearly go cold.",
  },
  {
    id: "booking",
    icon: CalendarCheck,
    eyebrow: "Conversion",
    title: "Booking handoff",
    copy: "Ready leads move into a cleaner booking path with less friction and fewer drop-offs.",
  },
  {
    id: "crm",
    icon: LayoutDashboard,
    eyebrow: "Visibility",
    title: "Pipeline updates",
    copy: "Statuses, tags, and handoffs stay organized automatically inside your workflow.",
  },
  {
    id: "reactivation",
    icon: RotateCcw,
    eyebrow: "Recovery",
    title: "Old leads return",
    copy: "Dormant opportunities can be reactivated with the right campaign instead of sitting untouched.",
  },
  {
    id: "optimization",
    icon: HeadphonesIcon,
    eyebrow: "Support",
    title: "System improves",
    copy: "Performance gets reviewed and tuned so the automation keeps getting stronger over time.",
  },
];

export default function AutomationPipelineSection() {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.16 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return undefined;

    const interval = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % stages.length);
    }, 1500);

    return () => window.clearInterval(interval);
  }, [inView]);

  return (
    <section
      ref={sectionRef}
      aria-label="Automation pipeline diagram"
      className="relative mt-12 overflow-hidden rounded-[2rem] border border-primary/20 bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(250,244,236,0.94))] px-5 py-10 md:px-8 md:py-12 shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
    >
      <div className="pointer-events-none absolute inset-x-12 top-0 h-24 rounded-full bg-[#f5d9a8]/35 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.32),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(201,156,110,0.12),transparent_36%)] opacity-90" />

      <div className="relative text-center mb-8">
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Animated Pipeline View</p>
        <h3 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          See How the Full System Works Together
        </h3>
        <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-3xl mx-auto">
          The blueprint cards show each automation individually. This view shows the whole revenue engine moving from first lead to booked appointment and ongoing optimization.
        </p>
      </div>

      <div className="relative hidden lg:block">
        <div className="absolute left-[6%] right-[6%] top-[2.65rem] h-[2px] rounded-full bg-[rgba(154,92,46,0.12)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#7a4825,#c8965c,#f5d9a8,#c8965c,#7a4825)]"
            style={{
              width: inView ? "100%" : "0%",
              transition: "width 2200ms ease",
              boxShadow: "0 0 16px rgba(200,150,92,0.45)",
            }}
          />
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full"
            style={{
              left: `calc(${((activeStage + 0.5) / stages.length) * 100}% - 7px)`,
              background: "radial-gradient(circle, #fff5e3 0%, #f0c98a 55%, rgba(200,150,92,0.18) 100%)",
              boxShadow: "0 0 20px rgba(240,201,138,0.75)",
              transition: "left 850ms ease",
            }}
          />
        </div>

        <div className="grid grid-cols-4 gap-5 xl:grid-cols-8">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = activeStage === index;

            return (
              <article
                key={stage.id}
                className="relative rounded-[1.5rem] border px-4 pb-5 pt-4 text-center transition-all duration-500"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(18px)",
                  transitionDelay: `${index * 90}ms`,
                  borderColor: isActive ? "rgba(154,92,46,0.44)" : "rgba(154,92,46,0.16)",
                  background: isActive
                    ? "linear-gradient(180deg,rgba(255,255,255,0.9),rgba(252,245,234,0.96))"
                    : "linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,250,243,0.82))",
                  boxShadow: isActive
                    ? "0 18px 36px rgba(154,92,46,0.14), inset 0 1px 0 rgba(255,255,255,0.78)"
                    : "0 8px 24px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.7)",
                }}
              >
                <div className="mb-3 flex justify-center">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-[1rem] border transition-all duration-500"
                    style={{
                      borderColor: isActive ? "rgba(154,92,46,0.3)" : "rgba(154,92,46,0.18)",
                      background: isActive
                        ? "linear-gradient(135deg,#9a5c2e 0%,#c8965c 100%)"
                        : "linear-gradient(135deg,rgba(255,255,255,0.9),rgba(248,235,214,0.96))",
                      boxShadow: isActive ? "0 0 18px rgba(200,150,92,0.35)" : "none",
                    }}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-[#8a5a32]"}`} />
                  </div>
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a684a]">{stage.eyebrow}</p>
                <h4 className="mt-2 text-sm font-semibold leading-snug text-slate-900">{stage.title}</h4>
                <p className="mt-2 text-xs leading-5 text-slate-600">{stage.copy}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="relative space-y-4 lg:hidden">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = activeStage === index;

          return (
            <div
              key={stage.id}
              className="flex items-start gap-4 rounded-[1.5rem] border px-4 py-4 transition-all duration-500"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateX(0)" : "translateX(-12px)",
                transitionDelay: `${index * 80}ms`,
                borderColor: isActive ? "rgba(154,92,46,0.4)" : "rgba(154,92,46,0.16)",
                background: isActive
                  ? "linear-gradient(180deg,rgba(255,255,255,0.92),rgba(252,245,234,0.96))"
                  : "linear-gradient(180deg,rgba(255,255,255,0.76),rgba(255,250,243,0.84))",
              }}
            >
              <div
                className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[1rem] border"
                style={{
                  borderColor: isActive ? "rgba(154,92,46,0.3)" : "rgba(154,92,46,0.18)",
                  background: isActive
                    ? "linear-gradient(135deg,#9a5c2e 0%,#c8965c 100%)"
                    : "linear-gradient(135deg,rgba(255,255,255,0.9),rgba(248,235,214,0.96))",
                }}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-[#8a5a32]"}`} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a684a]">{stage.eyebrow}</p>
                <h4 className="mt-1 text-sm font-semibold text-slate-900">{stage.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{stage.copy}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
