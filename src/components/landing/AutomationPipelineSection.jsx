import { useEffect, useRef, useState } from "react";
import { CalendarCheck, HeadphonesIcon, LayoutDashboard, MessageSquare, PhoneCall, RotateCcw, Send, Zap } from "lucide-react";

const stages = [
  {
    id: "lead-in",
    icon: Zap,
    eyebrow: "Trigger",
    title: "Lead comes in",
    copy: "A call, form, ad lead, or direct inquiry enters the system and gets captured quickly so your team can respond first.",
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
    copy: "Ready leads move into a cleaner booking path so fewer prospects stall before scheduling.",
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
    copy: "Dormant contacts can be re-engaged with a measured reactivation flow that brings older opportunities back into the pipeline.",
  },
  {
    id: "optimization",
    icon: HeadphonesIcon,
    eyebrow: "Support",
    title: "System improves",
    copy: "Performance is reviewed and tuned after launch so the automation keeps getting stronger and converting more over time.",
  },
];

const STAGE_DURATION = 3200;
// Fade duration for content panel (ms) â€” slow enough to see
const FADE_DURATION = 600;

export default function AutomationPipelineSection() {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [contentKey, setContentKey] = useState(0);
  const [contentVisible, setContentVisible] = useState(true);

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

  // Auto-advance
  useEffect(() => {
    if (!inView) return undefined;
    const interval = window.setInterval(() => {
      advanceTo((activeStage + 1) % stages.length);
    }, STAGE_DURATION);
    return () => window.clearInterval(interval);
  }, [inView, activeStage]);

  const advanceTo = (index) => {
    // Fade out content AND switch active stage simultaneously
    setContentVisible(false);
    setActiveStage(index);
    const t = window.setTimeout(() => {
      setContentKey((k) => k + 1);
      setContentVisible(true);
    }, FADE_DURATION);
    return () => window.clearTimeout(t);
  };

  const handleNodeClick = (index) => {
    if (index === activeStage) return;
    advanceTo(index);
  };

  const active = stages[activeStage];
  const ActiveIcon = active.icon;

  // Node size: about two-thirds of 125px = ~84px
  const NODE_SIZE = 84;
  const ICON_SIZE = 31;

  return (
    <section
      ref={sectionRef}
      aria-label="Automation pipeline diagram"
      className="relative mt-16"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Header */}
      <div className="text-center mb-14">
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Live Pipeline View</p>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
          See the Full{" "}
          <span style={{ color: "#9a5c2e", textShadow: "0 0 28px rgba(154,92,46,0.35)" }}>System</span>
          {" "}in Motion
        </h2>
        <p className="mt-5 text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          This walkthrough shows the intended flow from first lead to booked appointment across the services we currently support.
        </p>
      </div>

      {/* â”€â”€ Desktop pipeline (lg+) â”€â”€ */}
      <div className="hidden lg:block">

        {/* Node row */}
        <div className="relative" style={{ paddingTop: "20px", paddingBottom: "8px" }}>

          {/* Connector line â€” sits above the nodes, not through them */}
          <div
            className="absolute left-0 right-0"
            style={{ top: "0px", height: "2px" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
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
              className="absolute top-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: "18px",
                height: "18px",
                left: `calc(${((activeStage + 0.5) / stages.length) * 100}% - 9px)`,
                background: "radial-gradient(circle, #fff5e0 10%, #e8a550 60%, rgba(200,150,92,0.1) 100%)",
                boxShadow: "0 0 18px 6px rgba(232,165,80,0.55)",
                transition: `left ${STAGE_DURATION * 0.85}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            />
          </div>

          {/* Stage nodes â€” extra spacing via gap */}
          <div className="grid grid-cols-8 gap-x-8">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = activeStage === index;
              return (
                <button
                  key={stage.id}
                  onClick={() => handleNodeClick(index)}
                  className="flex flex-col items-center gap-4 focus:outline-none group"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? "translateY(0)" : "translateY(16px)",
                    transition: `opacity 600ms ease ${index * 80}ms, transform 600ms ease ${index * 80}ms`,
                  }}
                >
                  {/* Circle node - larger emphasis */}
                  <div
                    className="relative z-10 flex items-center justify-center transition-all duration-500"
                    style={{
                      width: `${NODE_SIZE}px`,
                      height: `${NODE_SIZE}px`,
                      borderRadius: "50%",
                      background: isActive
                        ? "linear-gradient(135deg, #7a4825 0%, #c8965c 100%)"
                        : "rgba(255,255,255,0.85)",
                      border: isActive
                        ? "3px solid rgba(200,150,92,0.6)"
                        : "2px solid rgba(154,92,46,0.2)",
                      boxShadow: isActive
                        ? "0 0 0 9px rgba(200,150,92,0.12), 0 16px 36px rgba(154,92,46,0.25)"
                        : "0 6px 20px rgba(0,0,0,0.07)",
                      transform: isActive ? "scale(1.12)" : "scale(1)",
                    }}
                  >
                    <Icon
                      style={{
                        width: `${ICON_SIZE}px`,
                        height: `${ICON_SIZE}px`,
                        color: isActive ? "#fff5e0" : "#9a5c2e",
                        transition: "color 0.5s",
                      }}
                    />
                    {isActive && (
                      <span
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{ background: "rgba(200,150,92,0.18)", animationDuration: "1.8s" }}
                      />
                    )}
                  </div>

                  {/* Label */}
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

        {/* â”€â”€ Always-visible detail panel â€” metallic silver â”€â”€ */}
        <div
          className="mt-10 rounded-2xl px-10 py-8 flex gap-8 items-start pipeline-panel-pulse"
          style={{
            background: "linear-gradient(135deg, rgba(245,246,248,0.98) 0%, rgba(228,231,236,0.97) 100%)",
            border: "1.5px solid rgba(180,185,195,0.5)",
            boxShadow: "0 12px 48px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(0,0,0,0.04)",
            minHeight: "160px",
          }}
          key={`panel-${contentKey}`}
        >
          {/* Icon â€” fades with content */}
          <div
            key={`icon-${contentKey}`}
            style={{
              opacity: contentVisible ? 1 : 0,
              transition: `opacity ${FADE_DURATION}ms ease`,
              flexShrink: 0,
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #7a4825 0%, #c8965c 100%)",
                boxShadow: "0 8px 24px rgba(154,92,46,0.28)",
              }}
            >
              <ActiveIcon className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Text â€” fades with content */}
          <div
            key={`text-${contentKey}`}
            className="flex-1"
            style={{
              opacity: contentVisible ? 1 : 0,
              transition: `opacity ${FADE_DURATION}ms ease`,
            }}
          >
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

      {/* â”€â”€ Mobile pipeline (< lg) â”€â”€ */}
      <div className="lg:hidden space-y-0">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = activeStage === index;
          return (
            <div key={stage.id} className="relative pl-10">
              {index < stages.length - 1 && (
                <div
                  className="absolute left-[1.175rem] top-[3.5rem] w-px"
                  style={{
                    height: "calc(100% + 1px)",
                    background: isActive
                      ? "linear-gradient(to bottom, #c8965c, rgba(200,150,92,0.2))"
                      : "rgba(154,92,46,0.14)",
                    transition: "background 600ms ease",
                  }}
                />
              )}
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
              <div
                className="mb-2 pt-3 pb-4 pr-2"
                style={{ opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(-8px)", transition: `opacity 0.5s ease ${index * 60}ms, transform 0.5s ease ${index * 60}ms` }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#9a6840" }}>{stage.eyebrow}</p>
                <h4 className="text-sm font-bold text-foreground mb-0">{stage.title}</h4>
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

      <style>{`
        @keyframes panelPulseFlash {
          0%   { box-shadow: 0 12px 48px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.85), 0 0 0 0 rgba(200,150,92,0); border-color: rgba(180,185,195,0.5); }
          18%  { box-shadow: 0 12px 48px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.85), 0 0 28px 6px rgba(200,150,92,0.55); border-color: rgba(200,150,92,0.75); }
          100% { box-shadow: 0 12px 48px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.85), 0 0 0 0 rgba(200,150,92,0); border-color: rgba(180,185,195,0.5); }
        }
        .pipeline-panel-pulse {
          animation: panelPulseFlash 700ms ease-out forwards;
        }
      `}</style>
    </section>
  );
}

