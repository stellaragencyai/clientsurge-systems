import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { launchTimelineSteps, iconMap } from "./coreOfferData";
import { useDemoBooking } from "@/components/landing/DemoBookingContext";

const STEP_WEIGHTS = [1, 0.5, 0.5, 2.5, 0.5];
const TOTAL_WEIGHT = STEP_WEIGHTS.reduce((a, b) => a + b, 0);

/* ─── Simple opacity-only fade — NO transforms, NO layout changes ─── */
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

function TimelineSummaryBar({ activeStep, onStepClick }) {
  return (
    <div className="mb-4 mx-auto max-w-2xl">
      <div
        className="px-5 py-4 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.9)",
          border: "1.5px solid rgba(154,92,46,0.14)",
          boxShadow: "0 6px 20px rgba(111,67,31,0.07)"
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-foreground">Your estimated setup timeline</p>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(154,92,46,0.1)", color: "#9a5c2e" }}>
            ~3–5 hours total
          </span>
        </div>

        <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
          {launchTimelineSteps.map((step, idx) => {
            const widthPct = STEP_WEIGHTS[idx] / TOTAL_WEIGHT * 100;
            const isActive = activeStep === idx;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick(idx)}
                title={`${step.title} — ${step.duration}`}
                style={{
                  width: `${widthPct}%`,
                  background: isActive ? "linear-gradient(90deg, #9a5c2e, #c8965c)" : "rgba(154,92,46,0.18)",
                  transition: "background 0.3s ease",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer"
                }}
              />
            );
          })}
        </div>

        <div className="flex">
          {launchTimelineSteps.map((step, idx) => {
            const widthPct = STEP_WEIGHTS[idx] / TOTAL_WEIGHT * 100;
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
                    transition: "color 0.25s ease"
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

/* ─── Step Row — opacity only, zero transforms ─── */
function StepRow({ step, idx }) {
  const isEven = idx % 2 === 0;
  const [ref, visible] = useInView(0.08);

  return (
    <div ref={ref} className="relative" style={{ opacity: visible ? 1 : 0, transition: "opacity 0.6s ease" }}>
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 ${isEven ? "" : "md:[&>:first-child]:order-2 md:[&>:last-child]:order-1"}`}
        style={{ alignItems: "stretch" }}
      >
        {/* Content Card */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            className="rounded-2xl overflow-hidden h-full"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1.5px solid rgba(154,92,46,0.13)",
              boxShadow: "0 10px 32px rgba(111,67,31,0.08)",
              position: "relative"
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: "linear-gradient(90deg, #9a5c2e 0%, #c8965c 60%, rgba(154,92,46,0.2) 100%)" }} />

            <div className="px-6 md:px-7 pt-6 pb-0">
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)",
                  color: "#ffffff", border: "none",
                  padding: "4px 12px", borderRadius: "6px",
                  fontSize: "11px", fontWeight: "800",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  marginBottom: "12px"
                }}
              >
                Step {step.number}
              </div>
            </div>

            <div className="px-6 md:px-7 pb-6 md:pb-7">
              <h4 className="text-lg md:text-xl font-bold mb-4" style={{ color: "hsl(var(--foreground))" }}>
                {step.title}
              </h4>
              <ul className="space-y-2.5">
                {step.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                    <span className="text-sm leading-relaxed" style={{ color: "rgba(15,23,42,0.7)" }}>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Image */}
        <div style={{ display: "flex", alignItems: "stretch" }}>
          <div
            className="rounded-2xl overflow-hidden w-full"
            style={{ border: "1.5px solid rgba(154,92,46,0.12)", boxShadow: "0 8px 24px rgba(111,67,31,0.1)", minHeight: "360px" }}
          >
            <img src={step.image} alt={step.title} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LaunchTimeline() {
  const [activeStep, setActiveStep] = useState(0);
  const { openDemoBooking } = useDemoBooking();

  return (
    <div className="mt-16 md:mt-20">
      {/* Section Header — static, no animation */}
      <p className="text-xs font-semibold text-primary tracking-[0.24em] uppercase text-center mb-3">
        Get Live In 3–5 Hours
      </p>
      <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
        Our Process — Start To Launch
      </h3>
      <p className="text-center text-sm text-muted-foreground mb-10">
        From first contact to fully live in 5 clear steps — most setups complete in 3–5 hours.
      </p>

      {/* Desktop horizontal tracker */}
      <div className="hidden sm:flex justify-center items-start gap-7 md:gap-10 px-4 mb-6">
        {launchTimelineSteps.map((step, idx) => {
          const Icon = iconMap[step.icon];
          const isActive = activeStep === idx;
          return (
            <div key={step.id} className="flex items-start gap-7 md:gap-10">
              <button
                type="button"
                onClick={() => setActiveStep(idx)}
                className="flex flex-col items-center gap-3 border-none bg-transparent cursor-pointer"
              >
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0 relative"
                  style={{
                    width: "70px", height: "70px",
                    background: isActive
                      ? "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)"
                      : "rgba(154,92,46,0.12)",
                    border: "2px solid #000000",
                    boxShadow: isActive ? "0 0 0 5px rgba(154,92,46,0.15), 0 4px 14px rgba(154,92,46,0.35)" : "none",
                    transition: "background 0.3s ease, box-shadow 0.3s ease",
                  }}
                >
                  <span className="font-black leading-none relative z-10" style={{ fontSize: "28px", color: isActive ? "#fff" : "#9a5c2e" }}>
                    {step.number}
                  </span>
                  <div
                    className="absolute rounded-full flex items-center justify-center"
                    style={{ width: "24px", height: "24px", bottom: "-3px", right: "-3px", background: "#f5e6d0", border: "2px solid #000000", zIndex: 20 }}
                  >
                    <Icon style={{ width: "14px", height: "14px", color: "#9a5c2e" }} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-foreground text-center max-w-[90px] leading-tight">{step.title}</p>
                <p className="text-[10px] text-muted-foreground text-center">{step.duration}</p>
              </button>
              {idx < launchTimelineSteps.length - 1 && (
                <div className="flex-shrink-0 text-primary/30 text-2xl mt-5">→</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary bar */}
      <div style={{ marginTop: "24px" }}>
        <TimelineSummaryBar activeStep={activeStep} onStepClick={setActiveStep} />
      </div>

      <div style={{ marginBottom: "64px" }} />

      {/* Mobile stepper */}
      <div className="sm:hidden relative pl-10 mb-12">
        <div className="absolute left-4 top-3 bottom-3 w-0.5" style={{ background: "linear-gradient(180deg, #9a5c2e 0%, rgba(154,92,46,0.2) 100%)" }} />
        <div className="space-y-6">
          {launchTimelineSteps.map((step) => (
            <div key={step.id} className="relative flex items-start gap-4">
              <div
                className="absolute -left-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                style={{ background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)", boxShadow: "0 2px 8px rgba(154,92,46,0.4)" }}
              >
                <span className="font-black text-sm" style={{ color: "#fff" }}>{step.number}</span>
              </div>
              <div
                className="rounded-xl px-4 py-3 flex-1 overflow-hidden relative"
                style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(154,92,46,0.12)", boxShadow: "0 4px 12px rgba(111,67,31,0.06)" }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "3px", background: "linear-gradient(90deg, #9a5c2e 0%, #c8965c 60%, rgba(154,92,46,0.2) 100%)" }} />
                <p className="text-[11px] font-semibold text-foreground mb-0.5 mt-1">Step {step.number}</p>
                <p className="text-sm font-bold text-foreground">{step.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(154,92,46,0.8)" }}>{step.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed vertical timeline */}
      <div className="relative">
        <div
          className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 hidden md:block pointer-events-none"
          style={{ background: "linear-gradient(180deg, #9a5c2e 0%, #c8965c 50%, rgba(200,150,92,0.6) 100%)", transform: "translateX(-50%)" }}
        />

        <div className="space-y-10 md:space-y-20 relative z-10">
          {launchTimelineSteps.map((step, idx) => (
            <StepRow key={step.id} step={step} idx={idx} />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="hidden md:flex flex-col items-center mt-6">
        <div style={{ width: "2px", height: "56px", background: "linear-gradient(180deg, rgba(154,92,46,0.4) 0%, #c8965c 100%)" }} />
        <button
          type="button"
          onClick={openDemoBooking}
          style={{
            marginTop: "24px",
            borderRadius: "9999px", padding: "2px",
            background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
            boxShadow: "0 4px 18px rgba(120,70,20,0.3)",
            border: "none", cursor: "pointer"
          }}
        >
          <span style={{
            display: "flex", alignItems: "center", gap: "8px",
            height: "48px", padding: "0 28px", borderRadius: "9999px",
            background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
            color: "#f5e6d0", fontWeight: "700", fontSize: "0.95rem"
          }}>
            Book Your Free Demo
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </div>
  );
}