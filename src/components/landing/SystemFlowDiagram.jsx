import { useEffect, useRef, useState } from "react";
import { Zap, MessageSquare, PhoneCall, Send, RotateCcw, CalendarCheck, LayoutDashboard, HeadphonesIcon } from "lucide-react";

const NODES = [
  { icon: Zap,             label: "Instant Reply",      sub: "< 60 sec",          step: "01" },
  { icon: MessageSquare,   label: "Lead Converted",     sub: "Booked appointment", step: "02" },
  { icon: PhoneCall,       label: "Missed Call",        sub: "Text-back fired",    step: "03" },
  { icon: Send,            label: "Follow-Up",          sub: "14-day sequence",    step: "04" },
  { icon: RotateCcw,       label: "Reactivation",       sub: "Old leads revived",  step: "05" },
  { icon: CalendarCheck,   label: "Booking Flow",       sub: "Zero friction",      step: "06" },
  { icon: LayoutDashboard, label: "CRM Pipeline",       sub: "Auto-managed",       step: "07" },
  { icon: HeadphonesIcon,  label: "Live & Optimized",   sub: "Ongoing support",    step: "08" },
];

export default function SystemFlowDiagram() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [activeConnector, setActiveConnector] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Animate nodes in sequence
  const [lit, setLit] = useState([]);
  useEffect(() => {
    if (!inView) return;
    NODES.forEach((_, i) => {
      setTimeout(() => setLit(prev => [...prev, i]), i * 180);
    });
  }, [inView]);

  useEffect(() => {
    if (!inView) return;

    const interval = window.setInterval(() => {
      setActiveConnector((current) => (current + 1) % (NODES.length - 1));
    }, 1300);

    return () => window.clearInterval(interval);
  }, [inView]);

  return (
    <div ref={ref} className="mb-14">
      {/* Label */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-bold text-primary uppercase tracking-widest px-3 py-1.5 rounded-full border border-primary/20" style={{ background: "rgba(154,92,46,0.06)" }}>
          How the 8-System Flow Works
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* ─── DESKTOP: horizontal scroll row ─── */}
      <div className="hidden md:block">
        <div className="relative flex items-start justify-between gap-0">
          {NODES.map((node, i) => {
            const Icon = node.icon;
            const isLit = lit.includes(i);
            const isActive = activeNode === i;

            return (
              <div key={i} className="relative flex flex-col items-center flex-1">
                {/* Connector line — between nodes */}
                {i < NODES.length - 1 && (
                  <div className="absolute top-[22px] left-1/2 w-full h-px z-0" style={{ overflow: "visible" }}>
                    <svg width="100%" height="4" style={{ display: "block" }}>
                      <line
                        x1="0" y1="2" x2="100%" y2="2"
                        stroke={isLit ? "#c8965c" : "rgba(0,0,0,0.1)"}
                        strokeWidth="2"
                        strokeDasharray="5 4"
                        style={{
                          transition: `stroke 0.5s ease ${i * 0.18}s`,
                          strokeDashoffset: isLit ? 0 : 100,
                        }}
                      />
                      {/* Arrow tip */}
                      {isLit && (
                        <polygon
                          points="100%,2 calc(100% - 6),0 calc(100% - 6),4"
                          fill="#c8965c"
                          style={{ transition: `opacity 0.3s ease ${i * 0.18 + 0.2}s`, opacity: isLit ? 1 : 0 }}
                        />
                      )}
                    </svg>
                    {isLit && (
                      <div
                        className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
                        style={{
                          background: "radial-gradient(circle, #f5d9a8 0%, #c8965c 55%, rgba(200,150,92,0.15) 100%)",
                          boxShadow: "0 0 14px rgba(200,150,92,0.55)",
                          left: activeConnector === i ? "calc(100% - 10px)" : "0%",
                          opacity: activeConnector === i ? 1 : 0.35,
                          transition: "left 850ms ease, opacity 250ms ease",
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Node circle */}
                <button
                  onClick={() => setActiveNode(activeNode === i ? null : i)}
                  className="relative z-10 flex flex-col items-center group focus:outline-none"
                  style={{
                    opacity: isLit ? 1 : 0,
                    transform: isLit ? "translateY(0) scale(1)" : "translateY(12px) scale(0.85)",
                    transition: `opacity 0.4s ease ${i * 0.18}s, transform 0.4s ease ${i * 0.18}s`,
                  }}
                >
                  {/* Circle */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center mb-2 transition-all duration-300"
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg,#6b3f1f,#c8965c)"
                        : "linear-gradient(135deg,#9a5c2e,#c8965c)",
                      boxShadow: isActive
                        ? "0 0 0 4px rgba(200,150,92,0.3), 0 0 20px rgba(200,150,92,0.5)"
                        : isLit
                        ? "0 0 10px rgba(200,150,92,0.3)"
                        : "none",
                      transform: isActive ? "scale(1.15)" : "scale(1)",
                    }}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>

                  {/* Step badge */}
                  <span className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: "#9a5c2e" }}>
                    {node.step}
                  </span>

                  {/* Label */}
                  <p className="text-xs font-bold text-center text-foreground leading-tight px-1 mb-0.5">{node.label}</p>
                  <p className="text-[10px] text-center text-muted-foreground leading-snug px-1">{node.sub}</p>

                  {/* Expanded tooltip */}
                  {isActive && (
                    <div
                      className="absolute top-full mt-3 z-20 rounded-xl px-4 py-3 text-center shadow-xl whitespace-nowrap"
                      style={{
                        background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)",
                        border: "1px solid rgba(200,150,92,0.4)",
                        animation: "tooltipIn 0.2s ease-out forwards",
                      }}
                    >
                      <p className="text-xs font-bold text-amber-100">{node.label}</p>
                      <p className="text-[10px] text-amber-200/70 mt-0.5">{node.sub}</p>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Progress bar beneath */}
        <div className="mt-8 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
          <div
            className="h-full rounded-full transition-all ease-out"
            style={{
              width: inView ? "100%" : "0%",
              background: "linear-gradient(90deg, #7a4825, #c8965c, #f5d9a8, #c8965c)",
              boxShadow: "0 0 10px rgba(200,150,92,0.5)",
              transitionDuration: "2500ms",
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5 px-0.5">
          <span className="text-[10px] text-muted-foreground font-semibold">Lead Arrives</span>
          <span className="text-[10px] font-bold" style={{ color: "#9a5c2e" }}>System Fully Live ✓</span>
        </div>
      </div>

      {/* ─── MOBILE: vertical stepper ─── */}
      <div className="md:hidden space-y-0">
        {NODES.map((node, i) => {
          const Icon = node.icon;
          const isLit = lit.includes(i);
          return (
            <div
              key={i}
              className="flex items-start gap-4 relative"
              style={{
                opacity: isLit ? 1 : 0,
                transform: isLit ? "translateX(0)" : "translateX(-16px)",
                transition: `opacity 0.4s ease ${i * 0.15}s, transform 0.4s ease ${i * 0.15}s`,
              }}
            >
              {/* Vertical connector */}
              {i < NODES.length - 1 && (
                <div
                  className="absolute left-[18px] top-10 w-0.5 h-8 z-0 transition-all duration-500"
                  style={{
                    background: isLit ? "linear-gradient(to bottom, #c8965c, rgba(200,150,92,0.2))" : "rgba(0,0,0,0.08)",
                    transitionDelay: `${i * 0.15}s`,
                  }}
                />
              )}
              {/* Circle */}
              <div
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center z-10"
                style={{
                  background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
                  boxShadow: isLit ? "0 0 10px rgba(200,150,92,0.4)" : "none",
                  transition: `box-shadow 0.4s ease ${i * 0.15}s`,
                }}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
              {/* Text */}
              <div className="pb-8 pt-1">
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#9a5c2e" }}>Step {node.step}</span>
                <p className="text-sm font-bold text-foreground leading-snug">{node.label}</p>
                <p className="text-xs text-muted-foreground">{node.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateY(6px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
