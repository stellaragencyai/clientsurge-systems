import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, CheckCircle2 } from "lucide-react";
import { launchTimelineSteps, iconMap } from "./coreOfferData";
import { useDemoBooking } from "@/components/landing/DemoBookingContext";

const STEP_WEIGHTS = [1, 0.5, 0.5, 2.5, 0.5];
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

function ProgressRing({ activeStep }) {
  const [ringRef, ringVisible] = useInView(0.3);
  const circumference = 2 * Math.PI * 45;
  const progress = ((activeStep + 1) / launchTimelineSteps.length) * 100;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      ref={ringRef}
      className="mb-8 mx-auto flex flex-col items-center"
      style={{
        opacity: ringVisible ? 1 : 0,
        transform: ringVisible ? "scale(1)" : "scale(0.8)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      <div style={{ position: "relative", width: "140px", height: "140px" }}>
        <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="70" cy="70" r="45" fill="none" stroke="rgba(154,92,46,0.1)" strokeWidth="6" />
          <motion.circle
            cx="70"
            cy="70"
            r="45"
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            animate={{ strokeDashoffset: offset }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            style={{ filter: "drop-shadow(0 0 8px rgba(200,150,92,0.4))" }}
          />
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9a5c2e" />
              <stop offset="50%" stopColor="#c8965c" />
              <stop offset="100%" stopColor="#7a4825" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#9a5c2e" }}>{activeStep + 1}/{launchTimelineSteps.length}</div>
          <div style={{ fontSize: "10px", color: "rgba(154,92,46,0.6)", fontWeight: "600", marginTop: "2px" }}>STEPS</div>
        </div>
      </div>
      <p style={{ marginTop: "16px", fontSize: "12px", fontWeight: "600", color: "#9a5c2e" }}>{launchTimelineSteps[activeStep].title}</p>
    </div>
  );
}

function TimelineSummaryBar({ activeStep, onStepClick }) {
  const [barRef, barVisible] = useInView(0.3);

  return (
    <div
      ref={barRef}
      className="mb-4 mx-auto max-w-2xl"
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
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-foreground">Your estimated setup timeline</p>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(154,92,46,0.1)", color: "#9a5c2e" }}
          >
            ~3–5 hours total
          </span>
        </div>

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

/* ─── PREMIUM STEP ROW ──────────────────────────────────────────────────── */
function StepRow({ step, idx }) {
  const isEven = idx % 2 === 0;
  const [ref, visible] = useInView(0.08);

  const stepVariants = {
    hidden: { 
      rotateY: -90,
      opacity: 0,
      y: 20,
    },
    visible: { 
      rotateY: 0,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 40,
        damping: 20,
        duration: 1.4,
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
    visible: { 
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: "easeOut", delay: 0.2 }
    }
  };

  const contentDelay = idx * 80;
  const imageDelay   = idx * 80 + 120;

  const contentFrom = `translateX(${isEven ? "-72px" : "72px"}) translateY(28px) scale(0.94)`;
  const imageFrom   = `translateX(${isEven ? "72px" : "-72px"}) translateY(28px) scale(0.94)`;

  const cardBg     = "rgba(255,255,255,0.95)";
  const cardBorder  = "1.5px solid rgba(154,92,46,0.13)";
  const cardShadow  = "0 10px 32px rgba(111,67,31,0.08)";
  const accentBar   = "linear-gradient(90deg, #9a5c2e 0%, #c8965c 60%, rgba(154,92,46,0.2) 100%)";
  const stepLabelBg = "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)";
  const stepLabelColor = "#ffffff";
  const stepLabelBorder = "none";
  const titleColor  = "hsl(var(--foreground))";
  const bulletColor = "rgba(15,23,42,0.7)";
  const checkColor  = "#22c55e";
  const imgBorder   = "1.5px solid rgba(154,92,46,0.12)";
  const imgShadow   = "0 8px 24px rgba(111,67,31,0.1)";

  return (
    <div ref={ref} className="relative" data-step-id={step.id}>
      {/* Center numbered dot — desktop only */}
      <div
        className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-8 w-11 h-11 rounded-full items-center justify-center z-10"
        style={{
          background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)",
          boxShadow: "0 0 0 5px rgba(154,92,46,0.12), 0 4px 14px rgba(154,92,46,0.35)",
          transition: `opacity 0.7s ease ${contentDelay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${contentDelay}ms`,
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateX(-50%)" : "scale(0.3) translateX(-50%)",
        }}
      >
        <span className="text-white font-black text-sm">{step.number}</span>
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 ${isEven ? "" : "md:[&>:first-child]:order-2 md:[&>:last-child]:order-1"}`}
        style={{ alignItems: "stretch", perspective: "1200px" }}
      >
        {/* ── CONTENT CARD ── */}
        <motion.div
          variants={stepVariants}
          initial="hidden"
          animate={visible ? "visible" : "hidden"}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate={visible ? "visible" : "hidden"}
            className="rounded-2xl overflow-hidden h-full"
            style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, position: "relative" }}
          >
            {/* Top accent bar */}
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: accentBar }} />

            {/* Step badge */}
            <div className="px-6 md:px-7 pt-6 pb-0">
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  background: stepLabelBg,
                  color: stepLabelColor,
                  border: stepLabelBorder,
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                Step {step.number}
              </div>
            </div>

            <div className="px-6 md:px-7 pb-6 md:pb-7">
              <h4 className="text-lg md:text-xl font-bold mb-4" style={{ color: titleColor }}>
                {step.title}
              </h4>
              <ul className="space-y-2.5">
                {step.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: checkColor }} />
                    <span className="text-sm leading-relaxed" style={{ color: bulletColor }}>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>

        {/* ── IMAGE ── */}
        <div
          style={{
            transition: `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${imageDelay}ms, transform 0.85s cubic-bezier(0.16,1,0.3,1) ${imageDelay}ms, filter 0.85s ease ${imageDelay}ms`,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0) translateY(0) scale(1)" : imageFrom,
            filter: visible ? "blur(0px)" : "blur(3px)",
            display: "flex",
            alignItems: "stretch",
          }}
        >
          <div
            className="rounded-2xl overflow-hidden w-full"
            style={{ border: imgBorder, boxShadow: imgShadow, minHeight: "360px" }}
          >
            <img src={step.image} alt={step.title} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineArrowCTA({ onBookDemo }) {
  const [ref, visible] = useInView(0.2);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      className="hidden md:flex flex-col items-center"
      initial={{ opacity: 0, y: 30 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Animated connector line */}
      <motion.div
        style={{ width: "2px", background: "linear-gradient(180deg, rgba(154,92,46,0.4) 0%, #c8965c 100%)" }}
        initial={{ height: 0 }}
        animate={visible ? { height: 56 } : { height: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Enhanced pulsing arrow icon */}
      <motion.div
        whileHover={{ scale: 1.25, y: -4 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: "44px", height: "44px", borderRadius: "50%",
          background: "linear-gradient(135deg, #9a5c2e, #c8965c)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 8px rgba(154,92,46,0.1), 0 8px 24px rgba(154,92,46,0.3)",
          cursor: "pointer",
          position: "relative",
        }}
      >
        <motion.div
          animate={isHovered ? { y: [0, 3, 0] } : { y: 0 }}
          transition={{ duration: 0.6, repeat: isHovered ? Infinity : 0 }}
        >
          <ArrowDown style={{ width: "20px", height: "20px", color: "#fff", strokeWidth: 2.5 }} />
        </motion.div>
      </motion.div>

      {/* CTA Card */}
      <motion.div
        className="mt-8 rounded-3xl px-8 py-8 text-center max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        whileHover={{ boxShadow: "0 20px 60px rgba(111,67,31,0.18)" }}
        style={{
          background: "linear-gradient(135deg, rgba(154,92,46,0.09) 0%, rgba(200,150,92,0.06) 100%)",
          border: "1.5px solid rgba(154,92,46,0.25)",
          boxShadow: "0 12px 40px rgba(111,67,31,0.1)",
          transition: "border-color 0.3s ease",
          borderColor: isHovered ? "rgba(154,92,46,0.4)" : "rgba(154,92,46,0.25)",
        }}
      >
        <p className="font-display text-2xl font-bold text-foreground mb-3 leading-snug">
          Ready to see which systems fit your business?
        </p>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          We'll show you the exact AI stack we'd recommend based on your lead flow and goals.
        </p>
        <motion.button
          type="button"
          onClick={onBookDemo}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          style={{
            borderRadius: "9999px", padding: "2px",
            background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
            boxShadow: isHovered ? "0 8px 28px rgba(120,70,20,0.45)" : "0 4px 18px rgba(120,70,20,0.3)",
            border: "none", cursor: "pointer", width: "100%",
            transition: "box-shadow 0.3s ease",
          }}
        >
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            height: "48px", padding: "0 28px", borderRadius: "9999px",
            background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
            color: "#f5e6d0", fontWeight: "700", fontSize: "0.95rem",
          }}>
            Book Your Free Demo
            <ArrowRight className="w-4 h-4" />
          </span>
        </motion.button>
      </motion.div>

      <style>{`
        @keyframes ctaPulse {
          0%, 100% { box-shadow: 0 0 0 8px rgba(154,92,46,0.1), 0 8px 24px rgba(154,92,46,0.3); }
          50%       { box-shadow: 0 0 0 14px rgba(154,92,46,0.06), 0 8px 32px rgba(154,92,46,0.4); }
        }
      `}</style>
    </motion.div>
  );
}

export default function LaunchTimeline() {
  const [headerRef, headerVisible] = useInView(0.2);
  const [activeStep, setActiveStep] = useState(0);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(null);
  const stepRefs = useRef([]);
  const lineContainerRef = useRef(null);
  const { openDemoBooking } = useDemoBooking();



  const handleTrackerClick = (idx) => {
    setActiveStep(idx);
    clearAutoAdvanceTimer();
    const el = stepRefs.current[idx];
    if (el) {
      setTimeout(() => {
        const targetTop = el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2;
        const startTop = window.scrollY;
        const distance = targetTop - startTop;
        const duration = 2400;
        let startTime = null;
        const ease = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const scroll = (currentTime) => {
          if (!startTime) startTime = currentTime;
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          window.scrollTo(0, startTop + distance * ease(progress));
          if (progress < 1) requestAnimationFrame(scroll);
        };
        requestAnimationFrame(scroll);
      }, 100);
    }
  };

  const clearAutoAdvanceTimer = () => {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
  };

  const startAutoAdvanceTimer = () => {
    clearAutoAdvanceTimer();
    const timer = setTimeout(() => {
      const nextIdx = (activeStep + 1) % launchTimelineSteps.length;
      handleTrackerClick(nextIdx);
    }, 3000);
    setAutoAdvanceTimer(timer);
  };

  useEffect(() => {
    startAutoAdvanceTimer();
    return () => clearAutoAdvanceTimer();
  }, [activeStep]);

  useEffect(() => {
    const handleScroll = () => {
      clearAutoAdvanceTimer();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [activeStep]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleTrackerClick((activeStep + 1) % launchTimelineSteps.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleTrackerClick((activeStep - 1 + launchTimelineSteps.length) % launchTimelineSteps.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const el = stepRefs.current[activeStep];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStep]);

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

      {/* Desktop horizontal tracker */}
      <div className="hidden sm:flex justify-center items-start gap-7 md:gap-10 px-4 mb-6">
        {launchTimelineSteps.map((step, idx) => {
          const Icon = iconMap[step.icon];
          const isActive = activeStep === idx;
          return (
            <div key={step.id} className="flex items-start gap-7 md:gap-10">
              <button
                type="button"
                onClick={() => handleTrackerClick(idx)}
                className="flex flex-col items-center gap-3 border-none bg-transparent cursor-pointer group"
              >
                <motion.div
                  className="rounded-full flex items-center justify-center flex-shrink-0 relative group/icon"
                  whileHover={{
                    boxShadow: "0 0 0 3px rgba(0,0,0,0.08), 0 0 24px rgba(154,92,46,0.5), 0 0 40px rgba(154,92,46,0.3), inset 0 0 20px rgba(154,92,46,0.15)",
                  }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTrackerClick(idx);
                  }}
                  style={{
                    width: "70px", height: "70px",
                    background: isActive
                      ? "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)"
                      : "rgba(154,92,46,0.12)",
                    border: "2px solid #000000",
                    boxShadow: isActive
                      ? "0 0 0 5px rgba(154,92,46,0.15), 0 4px 14px rgba(154,92,46,0.35)"
                      : "none",
                    transition: "all 0.3s ease",
                    outline: "none",
                  }}
                  onFocus={() => handleTrackerClick(idx)}
                >
                  {/* Animated gradient pulse background on hover */}
                  <div
                    className="absolute inset-0 rounded-full opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "radial-gradient(circle at 30% 30%, rgba(245,217,168,0.4) 0%, transparent 60%)",
                      animation: "none",
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-full opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "radial-gradient(circle at 70% 70%, rgba(200,150,92,0.3) 0%, transparent 60%)",
                    }}
                  />
                  <span className="font-black leading-none relative z-10" style={{ fontSize: "28px", color: isActive ? "#fff" : "#9a5c2e" }}>{step.number}</span>
                  <motion.div
                    className="absolute rounded-full flex items-center justify-center"
                    whileHover={{ scale: 1.2 }}
                    style={{ width: "24px", height: "24px", bottom: "-3px", right: "-3px", background: "#f5e6d0", border: "2px solid #000000", zIndex: 20 }}
                  >
                    <Icon style={{ width: "14px", height: "14px", color: "#9a5c2e" }} />
                  </motion.div>
                </motion.div>
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

      {/* Progress Ring */}
      <ProgressRing activeStep={activeStep} />

      {/* Summary bar — pushed further down with extra top margin */}
      <div style={{ marginTop: "32px" }}>
        <TimelineSummaryBar activeStep={activeStep} onStepClick={handleTrackerClick} />
      </div>

      {/* Extra breathing room before detail cards */}
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
      <div ref={lineContainerRef} className="relative">
        {/* Background static line */}
        <div
          className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 hidden md:block"
          style={{ background: "rgba(154,92,46,0.1)", transform: "translateX(-50%)" }}
        />
        {/* Static line */}
        <div
          className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 hidden md:block pointer-events-none"
          style={{
            background: "linear-gradient(180deg, #9a5c2e 0%, #c8965c 50%, rgba(200,150,92,0.6) 100%)",
            transform: "translateX(-50%)",
          }}
        />

        <div className="space-y-10 md:space-y-20 relative z-10">
          {launchTimelineSteps.map((step, idx) => (
            <div key={step.id} ref={(el) => (stepRefs.current[idx] = el)}>
              <StepRow step={step} idx={idx} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <TimelineArrowCTA onBookDemo={openDemoBooking} />
      </div>
    </div>
  );
}