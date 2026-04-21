import { useEffect, useRef, useState } from "react";
import { CalendarCheck, HeadphonesIcon, LayoutDashboard, MessageSquare, PhoneCall, RotateCcw, Send, Zap } from "lucide-react";

const stages = [
  {
    id: "lead-in",
    icon: Zap,
    eyebrow: "Trigger",
    title: "Lead comes in",
    copy: "A call, form, ad lead, or direct inquiry enters the system and gets captured immediately — nothing slips through the cracks.",
  },
  {
    id: "instant-response",
    icon: MessageSquare,
    eyebrow: "Speed",
    title: "Instant response",
    copy: "The system replies within seconds so you show up first while the lead's intent is still at its peak.",
  },
  {
    id: "missed-call",
    icon: PhoneCall,
    eyebrow: "Coverage",
    title: "Missed-call recovery",
    copy: "If nobody answers, a text-back fires immediately to keep the conversation alive before they call a competitor.",
  },
  {
    id: "follow-up",
    icon: Send,
    eyebrow: "Nurture",
    title: "Follow-up runs",
    copy: "Automated sequences keep warm leads moving over 14 days until they reply, book, or clearly go cold.",
  },
  {
    id: "booking",
    icon: CalendarCheck,
    eyebrow: "Conversion",
    title: "Booking handoff",
    copy: "Ready leads move into a frictionless booking path — fewer drop-offs, more confirmed appointments.",
  },
  {
    id: "crm",
    icon: LayoutDashboard,
    eyebrow: "Visibility",
    title: "Pipeline updates",
    copy: "Statuses, tags, and handoffs stay organized automatically so your team always knows where every lead stands.",
  },
  {
    id: "reactivation",
    icon: RotateCcw,
    eyebrow: "Recovery",
    title: "Old leads return",
    copy: "Dormant contacts get reactivated with proven campaigns — turning forgotten leads into fresh revenue.",
  },
  {
    id: "optimization",
    icon: HeadphonesIcon,
    eyebrow: "Support",
    title: "System improves",
    copy: "Performance is reviewed and tuned after launch so the automation keeps getting stronger and converting more over time.",
  },
];

// How long each stage is highlighted (ms)
const STAGE_DURATION = 3200;

export default function AutomationPipelineSection() {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [descVisible, setDescVisible] = useState(true);

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
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return undefined;
    const interval = window.setInterval(() => {
      // Fade out desc, advance stage, fade back in
      setDescVisible(false);
      const t = window.setTimeout(() => {
        setActiveStage((curr) => (curr + 1) % stages.length);
        setDescVisible(true);
      }, 380);
      return () => window.clearTimeout(t);
    }, STAGE_DURATION);
    return () => window.clearInterval(interval);
  }, [inView]);

  const active = stages[activeStage];
  const ActiveIcon = active.icon;

  return (
    <section
      ref={sectionRef}
      aria-label="Automation pipeline diagram"
      className="relative mt-16"
    >
      {/* Subtle background glow strip */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Header */}
      <div className="text-center mb-14">
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">Live Pipeline View</p>
        <h3 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          See the Full System in Motion
        </h3>
        <p className="mt-4 text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
          Every step fires automatically. Watch the engine move from first lead to booked appointment.
        </p>
      </div>

      {/* ── Desktop pipeline (lg+) ── */}
      <div className="hidden lg:block">

        {/* Node row */}
        <div className="relative">

          {/* Connector line behind nodes */}
          <div className="absolute left-0 right-0 top-[2.1rem] h-px">
            {/* Base track */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            {/* Animated fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: inView ? "100%" : "0%",
                transition: "width 2800ms ease",
                background: "linear-gradient(90deg, #7a4825, #c8965c, #f5d9a8, #c8965c, #7a4825)",
                boxShadow: "0 0 10px rgba(200,150,92,0.3)",
              }}
            />
            {/* Travelling dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
              style={{
                left: `calc(${((activeStage + 0.5) / stages.length) * 100}% - 6px)`,
                background: "radial-gradient(circle, #fff5e0 10%, #e8a550 60%, rgba(200,150,92,0.1) 100%)",
                boxShadow: "0 0 14px 4px rgba(232,165,80,0.55)",
                transition: `left ${STAGE_DURATION * 0.85}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            />
          </div>

          {/* Stage nodes */}
          <div className="grid grid-cols-8">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = activeStage === index;
              return (
                <button
                  key={stage.id}
                  onClick={() => { setDescVisible(false); setTimeout(() => { setActiveStage(index); setDescVisible(true); }, 200); }}
                  className="flex flex-col items-center gap-3 focus:outline-none group"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? "translateY(0)" : "translateY(16px)",
                    transition: `opacity 600ms ease ${index * 80}ms, transform 600ms ease ${index * 80}ms`,
                  }}
                >
                  {/* Circle node */}
                  <div
                    className="relative z-10 w-[4.25rem] h-[4.25rem] rounded-full flex items-center justify-center transition-all duration-500"
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, #7a4825 0%, #c8965c 100%)"
                        : "rgba(255,255,255,0.85)",
                      border: isActive
                        ? "2px solid rgba(200,150,92,0.6)"
                        : "1.5px solid rgba(154,92,46,0.2)",
                      boxShadow: isActive
                        ? "0 0 0 6px rgba(200,150,92,0.12), 0 12px 28px rgba(154,92,46,0.22)"
                        : "0 4px 14px rgba(0,0,0,0.06)",
                      transform: isActive ? "scale(1.12)" : "scale(1)",
                    }}
                  >
                    <Icon
                      className="w-6 h-6 transition-colors duration-500"
                      style={{ color: isActive ? "#fff5e0" : "#9a5c2e" }}
                    />
                    {/* Pulse ring on active */}
                    {isActive && (
                      <span
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{ background: "rgba(200,150,92,0.18)", animationDuration: "1.8s" }}
                      />
                    )}
                  </div>

                  {/* Label below node */}
                  <span
                    className="text-xs font-semibold text-center leading-tight transition-colors duration-300 px-1"
                    style={{ color: isActive ? "#7a4825" : "rgba(90,60,30,0.55)" }}
                  >
                    {stage.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expanding description panel */}
        <div
          className="mt-10 overflow-hidden"
          style={{
            maxHeight: descVisible ? "280px" : "0px",
            opacity: descVisible ? 1 : 0,
            transition: "max-height 460ms cubic-bezier(0.4,0,0.2,1), opacity 380ms ease",
          }}
        >
          <div
            className="rounded-2xl px-10 py-8 flex gap-8 items-start"
            style={{
              background: "linear-gradient(135deg, rgba(255,252,247,0.98) 0%, rgba(252,244,232,0.96) 100%)",
              border: "1.5px solid rgba(200,150,92,0.28)",
              boxShadow: "0 12px 48px rgba(154,92,46,0.1), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            {/* Icon */}
            <div
              className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #7a4825 0%, #c8965c 100%)",
                boxShadow: "0 8px 24px rgba(154,92,46,0.28)",
              }}
            >
              <ActiveIcon className="w-7 h-7 text-white" />
            </div>

            {/* Text */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">{active.eyebrow}</p>
                {/* Progress dots */}
                <div className="flex gap-1.5 ml-auto">
                  {stages.map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-500"
                      style={{
                        width: i === activeStage ? "20px" : "6px",
                        height: "6px",
                        background: i === activeStage
                          ? "linear-gradient(90deg, #7a4825, #c8965c)"
                          : "rgba(154,92,46,0.2)",
                      }}
                    />
                  ))}
                </div>
              </div>
              <h4 className="font-display text-2xl font-bold text-foreground mb-3">{active.title}</h4>
              <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">{active.copy}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile pipeline (< lg) ── */}
      <div className="lg:hidden space-y-0">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = activeStage === index;
          return (
            <div key={stage.id} className="relative pl-10">
              {/* Vertical connector */}
              {index < stages.length - 1 && (
                <div
                  className="absolute left-[1.175rem] top-[3.5rem] w-px"
                  style={{
                    height: isActive ? "calc(100% + 1px)" : "calc(100% + 1px)",
                    background: isActive
                      ? "linear-gradient(to bottom, #c8965c, rgba(200,150,92,0.2))"
                      : "rgba(154,92,46,0.14)",
                    transition: "background 600ms ease",
                  }}
                />
              )}

              {/* Node */}
              <div className="absolute left-0 top-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #7a4825 0%, #c8965c 100%)"
                      : "rgba(255,255,255,0.9)",
                    border: isActive ? "2px solid rgba(200,150,92,0.5)" : "1.5px solid rgba(154,92,46,0.2)",
                    boxShadow: isActive ? "0 0 0 4px rgba(200,150,92,0.12)" : "none",
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: isActive ? "#fff5e0" : "#9a5c2e" }} />
                </div>
              </div>

              {/* Content */}
              <div
                className="mb-2 pt-3 pb-4 pr-2 transition-all duration-400"
                style={{ opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(-8px)", transitionDelay: `${index * 60}ms` }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#9a6840" }}>{stage.eyebrow}</p>
                <h4 className="text-sm font-bold text-foreground mb-0">{stage.title}</h4>

                {/* Expanding copy on mobile */}
                <div
                  className="overflow-hidden"
                  style={{
                    maxHeight: isActive ? "80px" : "0px",
                    opacity: isActive ? 1 : 0,
                    transition: "max-height 440ms ease, opacity 360ms ease",
                  }}
                >
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2">{stage.copy}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </section>
  );
}