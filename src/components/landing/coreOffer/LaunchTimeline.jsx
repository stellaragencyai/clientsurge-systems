import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { launchTimelineSteps, iconMap } from "./coreOfferData";

// Step durations as proportional weights (for the timeline bar)
const STEP_WEIGHTS = [1, 0.5, 0.5, 2.5, 0.5]; // relative time weight per step
const TOTAL_WEIGHT = STEP_WEIGHTS.reduce((a, b) => a + b, 0);

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// Enhancement 5: Timeline summary bar
function TimelineSummaryBar({ activeStep, onStepClick }) {
  const [barRef, barVisible] = useInView(0.3);

  return (
    <div
      ref={barRef}
      className="mb-14 mx-auto max-w-2xl"
      style={{
        transition: "opacity 0.6s ease, transform 0.6s ease",
        opacity: barVisible ? 1 : 0,
        transform: barVisible ? "translateY(0)" : "translateY(16px)",
      }}
    >
      <div
        className="rounded-2xl px-5 py-4"
        style={{
          background: "rgba(255,255,255,0.9)",
          border: "1.5px solid rgba(154,92,46,0.14)",
          boxShadow: "0 6px 20px rgba(111,67,31,0.07)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-foreground">Your estimated setup timeline</p>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(154,92,46,0.1)", color: "#9a5c2e" }}
          >
            ~3–5 hours total
          </span>
        </div>

        {/* Proportional bar segments */}
        <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
          {launchTimelineSteps.map((step, idx) => {
            const widthPct = (STEP_WEIGHTS[idx] / TOTAL_WEIGHT) * 100;
            const isActive = activeStep === idx;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick(idx)}
                title={`${step.title} — ${step.duration}`}
                style={{
                  width: `${widthPct}%`,
                  background: isActive
                    ? "linear-gradient(90deg, #9a5c2e, #c8965c)"
                    : "rgba(154,92,46,0.18)",
                  transition: "background 0.3s ease, transform 0.2s ease",
                  transform: isActive ? "scaleY(1.3)" : "scaleY(1)",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                }}
              />
            );
          })}
        </div>

        {/* Step labels under bar */}
        <div className="flex">
          {launchTimelineSteps.map((step, idx) => {
            const widthPct = (STEP_WEIGHTS[idx] / TOTAL_WEIGHT) * 100;
            const isActive = activeStep === idx;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick(idx)}
                style={{ width: `${widthPct}%` }}
                className="text-left border-none bg-transparent cursor-pointer px-0"
              >
                <p
                  className="text-[10px] leading-tight truncate"
                  style={{
                    color: isActive ? "#9a5c2e" : "rgba(30,20,10,0.4)",
                    fontWeight: isActive ? "700" : "500",
                    transition: "color 0.25s ease",
                  }}
                >
                  {step.title}
                </p>
                <p className="text-[9px]" style={{ color: "rgba(154,92,46,0.55)" }}>
                  {step.duration}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Enhancement 3 + 4: Each step row with scroll reveal + collapsible
function StepRow({ step, idx, isOpen, onToggle }) {
  const isEven = idx % 2 === 0;
  const Icon = iconMap[step.icon];
  const [ref, visible] = useInView(0.08);

  const contentDelay = isEven ? idx * 80 : idx * 80 + 120;
  const imageDelay = isEven ? idx * 80 + 120 : idx * 80;

  return (
    <div ref={ref} className="relative">
      {/* Center numbered dot on desktop */}
      <div
        className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-8 w-11 h-11 rounded-full items-center justify-center z-10"
        style={{
          background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)",
          boxShadow: "0 0 0 5px rgba(154,92,46,0.12), 0 4px 14px rgba(154,92,46,0.35)",
          transition: `opacity 0.5s ease ${contentDelay}ms, transform 0.5s ease ${contentDelay}ms`,
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateX(-50%)" : "scale(0.6) translateX(-50%)",
        }}
      >
        <span className="text-white font-black text-sm">{step.number}</span>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-start ${isEven ? "" : "md:[&>:first-child]:order-2 md:[&>:last-child]:order-1"}`}>
        {/* Content card — Enhancement 4: collapsible */}
        <div
          style={{
            transition: `opacity 0.65s ease ${contentDelay}ms, transform 0.65s ease ${contentDelay}ms`,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : `translateX(${isEven ? "-40px" : "40px"})`,
          }}
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.94)",
              border: "1.5px solid rgba(154,92,46,0.13)",
              boxShadow: "0 8px 28px rgba(111,67,31,0.07)",
              position: "relative",
            }}
          >
            {/* Color band */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "4px",
                background: "linear-gradient(90deg, #9a5c2e 0%, #c8965c 60%, rgba(154,92,46,0.2) 100%)",
              }}
            />

            {/* Clickable header — toggles expansion */}
            <button
              type="button"
              onClick={onToggle}
              className="w-full text-left px-6 md:px-7 pt-7 pb-4 flex items-start justify-between gap-3 border-none bg-transparent cursor-pointer"
            >
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Step {step.number} — {step.duration}
                </p>
                <h4 className="text-lg md:text-xl font-bold text-foreground">
                  {step.title}
                </h4>
              </div>
              <ChevronDown
                className="w-5 h-5 flex-shrink-0 mt-2"
                style={{
                  color: "#9a5c2e",
                  transition: "transform 0.3s ease",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {/* Collapsible bullets */}
            <div
              style={{
                maxHeight: isOpen ? "400px" : "0px",
                overflow: "hidden",
                transition: "max-height 0.4s ease",
              }}
            >
              <ul className="space-y-2.5 px-6 md:px-7 pb-6">
                {step.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                    <span className="text-sm leading-relaxed text-foreground/75">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Image — only shown when expanded */}
        <div
          style={{
            transition: `opacity 0.65s ease ${imageDelay}ms, transform 0.65s ease ${imageDelay}ms`,
            opacity: visible && isOpen ? 1 : 0,
            transform: visible && isOpen ? "translateX(0)" : `translateX(${isEven ? "40px" : "-40px"})`,
            pointerEvents: isOpen ? "auto" : "none",
            maxHeight: isOpen ? "400px" : "0px",
            overflow: "hidden",
          }}
        >
          <div
            className="rounded-2xl overflow-hidden h-64 md:h-72"
            style={{
              border: "1.5px solid rgba(154,92,46,0.12)",
              boxShadow: "0 8px 24px rgba(111,67,31,0.1)",
            }}
          >
            <img src={step.image} alt={step.title} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LaunchTimeline() {
  const [headerRef, headerVisible] = useInView(0.2);
  // Enhancement 4: track which step is open (default: step 0 open)
  const [openStep, setOpenStep] = useState(0);
  const stepRefs = useRef([]);

  const handleTrackerClick = (idx) => {
    setOpenStep(idx);
    // Scroll to the detailed step row
    const el = stepRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleRowToggle = (idx) => {
    setOpenStep((prev) => (prev === idx ? -1 : idx));
  };

  return (
    <div className="mt-16 md:mt-20">
      {/* Section Header */}
      <div ref={headerRef}>
        <p
          className="text-xs font-semibold text-primary tracking-[0.24em] uppercase text-center mb-3"
          style={{ transition: "opacity 0.5s ease, transform 0.5s ease", opacity: headerVisible ? 1 : 0, transform: headerVisible ? "translateY(0)" : "translateY(12px)" }}
        >
          Get Live In 3–5 Hours
        </p>
        <h3
          className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-2"
          style={{ transition: "opacity 0.5s ease 80ms, transform 0.5s ease 80ms", opacity: headerVisible ? 1 : 0, transform: headerVisible ? "translateY(0)" : "translateY(12px)" }}
        >
          Our Process — Start To Launch
        </h3>
        <p
          className="text-center text-sm text-muted-foreground mb-10"
          style={{ transition: "opacity 0.5s ease 160ms, transform 0.5s ease 160ms", opacity: headerVisible ? 1 : 0, transform: headerVisible ? "translateY(0)" : "translateY(12px)" }}
        >
          From first contact to fully live in 5 clear steps — most setups complete in 3–5 hours.
        </p>
      </div>

      {/* Enhancement 1: Numbered step circles — Desktop horizontal tracker */}
      <div className="hidden sm:flex justify-center items-start gap-4 md:gap-6 px-4 mb-6">
        {launchTimelineSteps.map((step, idx) => {
          const Icon = iconMap[step.icon];
          const isActive = openStep === idx;
          return (
            <div key={step.id} className="flex items-start gap-4 md:gap-6">
              <button
                type="button"
                onClick={() => handleTrackerClick(idx)}
                className="flex flex-col items-center gap-2 border-none bg-transparent cursor-pointer"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 relative"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)"
                      : "rgba(154,92,46,0.12)",
                    boxShadow: isActive
                      ? "0 0 0 5px rgba(154,92,46,0.15), 0 4px 14px rgba(154,92,46,0.35)"
                      : "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  <span
                    className="font-black text-xl leading-none"
                    style={{ color: isActive ? "#fff" : "#9a5c2e" }}
                  >{step.number}</span>
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "#f5e6d0", border: "1.5px solid rgba(154,92,46,0.25)" }}
                  >
                    <Icon className="w-3 h-3" style={{ color: "#9a5c2e" }} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-foreground text-center max-w-[80px] leading-tight">{step.title}</p>
                <p className="text-[10px] text-muted-foreground text-center">{step.duration}</p>
              </button>
              {idx < launchTimelineSteps.length - 1 && (
                <div className="flex-shrink-0 text-primary/30 text-2xl mt-5">→</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Enhancement 5: Timeline summary bar */}
      <TimelineSummaryBar activeStep={openStep} onStepClick={handleTrackerClick} />

      {/* Mobile: Vertical Stepper */}
      <div className="sm:hidden relative pl-10 mb-12">
        <div
          className="absolute left-4 top-3 bottom-3 w-0.5"
          style={{ background: "linear-gradient(180deg, #9a5c2e 0%, rgba(154,92,46,0.2) 100%)" }}
        />
        <div className="space-y-6">
          {launchTimelineSteps.map((step, idx) => {
            const isActive = openStep === idx;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleRowToggle(idx)}
                className="relative flex items-start gap-4 w-full text-left border-none bg-transparent cursor-pointer"
              >
                <div
                  className="absolute -left-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)"
                      : "rgba(154,92,46,0.15)",
                    boxShadow: isActive ? "0 2px 8px rgba(154,92,46,0.4)" : "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  <span className="font-black text-sm" style={{ color: isActive ? "#fff" : "#9a5c2e" }}>{step.number}</span>
                </div>
                <div
                  className="rounded-xl px-4 py-3 flex-1 overflow-hidden relative"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: `1px solid ${isActive ? "rgba(154,92,46,0.3)" : "rgba(154,92,46,0.12)"}`,
                    boxShadow: isActive ? "0 4px 16px rgba(111,67,31,0.1)" : "0 4px 12px rgba(111,67,31,0.06)",
                    transition: "border 0.3s ease, box-shadow 0.3s ease",
                  }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "3px", background: "linear-gradient(90deg, #9a5c2e 0%, #c8965c 60%, rgba(154,92,46,0.2) 100%)" }} />
                  <p className="text-[11px] font-semibold text-foreground mb-0.5 mt-1">Step {step.number}</p>
                  <p className="text-sm font-bold text-foreground">{step.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(154,92,46,0.8)" }}>{step.duration}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed vertical timeline */}
      <div className="relative">
        <div
          className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 hidden md:block"
          style={{
            background: "linear-gradient(180deg, rgba(154,92,46,0.6) 0%, rgba(154,92,46,0.3) 50%, rgba(154,92,46,0.1) 100%)",
            transform: "translateX(-50%)",
          }}
        />
        <div className="space-y-10 md:space-y-14">
          {launchTimelineSteps.map((step, idx) => (
            <div key={step.id} ref={(el) => (stepRefs.current[idx] = el)}>
              <StepRow
                step={step}
                idx={idx}
                isOpen={openStep === idx}
                onToggle={() => handleRowToggle(idx)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}