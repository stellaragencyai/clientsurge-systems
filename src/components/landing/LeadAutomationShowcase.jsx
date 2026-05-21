import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  MessageSquareText,
  PhoneCall,
  Send,
  Sparkles,
} from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";

const workflowItems = [
  {
    id: "instant",
    label: "Instant Replies",
    title: "Instant Lead Response",
    body: "Personalized SMS and email replies within seconds",
    beforeText: "Reply delayed 47m",
    afterText: "Response sent in 12s",
    metric: "12s avg. response",
    icon: Send,
    accent: "rgba(200,150,92,0.9)",
    glow: "rgba(200,150,92,0.35)",
  },
  {
    id: "missed",
    label: "Missed Calls",
    title: "Missed-Call Text Back",
    body: "Automatic text-back when your team can't answer",
    beforeText: "3 calls missed",
    afterText: "18 calls recovered",
    metric: "18 recovered this week",
    icon: PhoneCall,
    accent: "rgba(184,97,73,0.95)",
    glow: "rgba(184,97,73,0.28)",
  },
  {
    id: "followup",
    label: "Follow-Up",
    title: "Smart Follow-Up Sequences",
    body: "14-day nurture that keeps leads warm",
    beforeText: "No nurture running",
    afterText: "Follow-up running",
    metric: "14-day nurture live",
    icon: MessageSquareText,
    accent: "rgba(122,140,106,0.95)",
    glow: "rgba(122,140,106,0.28)",
  },
  {
    id: "booking",
    label: "Booking Flow",
    title: "Booking Flow Automation",
    body: "Guide qualified leads straight to your calendar",
    beforeText: "8 pending leads",
    afterText: "34 consults booked",
    metric: "34 appointments booked",
    icon: CalendarCheck2,
    accent: "rgba(147,106,59,0.95)",
    glow: "rgba(147,106,59,0.3)",
  },
];

const outcomeStats = [
  { value: "4 workflows", label: "Shown in the live preview" },
  { value: "12s", label: "Fastest sample response" },
  { value: "34", label: "Booked consults in the after state" },
];

const cardPositions = {
  instant: {
    initial: { x: 55, y: 25, rotate: -1 },
    final: { x: 72, y: 15, rotate: -4 },
    width: 31,
    height: 17,
    z: 22,
  },
  missed: {
    initial: { x: 46, y: 40, rotate: -1 },
    final: { x: 20, y: 43, rotate: -6 },
    width: 30,
    height: 18,
    z: 20,
  },
  followup: {
    initial: { x: 61, y: 43, rotate: 1 },
    final: { x: 79, y: 42, rotate: 5 },
    width: 31,
    height: 18,
    z: 21,
  },
  booking: {
    initial: { x: 57, y: 65, rotate: 0 },
    final: { x: 60, y: 77, rotate: 2 },
    width: 36,
    height: 20,
    z: 19,
  },
};

const signalLines = {
  instant: { x1: 56, y1: 21, x2: 68, y2: 16 },
  missed: { x1: 42, y1: 45, x2: 28, y2: 42 },
  followup: { x1: 65, y1: 44, x2: 72, y2: 41 },
  booking: { x1: 57, y1: 67, x2: 58, y2: 74 },
};

function BenefitItem({ item, active, onFocus }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onMouseEnter={() => onFocus(item.id)}
      onFocus={() => onFocus(item.id)}
      onClick={() => onFocus(item.id)}
      className="lead-showcase-benefit group w-full rounded-[24px] border px-5 py-4 text-left transition-all duration-300"
      style={{
        background: active
          ? "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(252,247,242,0.94) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(252,247,242,0.8) 100%)",
        borderColor: active ? "rgba(154,92,46,0.36)" : "rgba(154,92,46,0.15)",
        boxShadow: active
          ? "0 18px 36px rgba(154,92,46,0.12), inset 0 1px 0 rgba(255,255,255,0.65)"
          : "0 8px 22px rgba(84,48,20,0.06), inset 0 1px 0 rgba(255,255,255,0.55)",
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border transition-all duration-300"
          style={{
            background: active ? "rgba(154,92,46,0.16)" : "rgba(154,92,46,0.08)",
            borderColor: active ? "rgba(154,92,46,0.28)" : "rgba(154,92,46,0.14)",
          }}
        >
          <Icon className="h-[18px] w-[18px]" style={{ color: "#9a5c2e" }} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground md:text-[15px]">{item.title}</p>
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{
                background: active ? "rgba(154,92,46,0.12)" : "rgba(154,92,46,0.06)",
                borderColor: active ? "rgba(154,92,46,0.22)" : "rgba(154,92,46,0.12)",
                color: "#8a5229",
              }}
            >
              {item.metric}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-foreground/70 md:text-[15px]">{item.body}</p>
        </div>
      </div>
    </button>
  );
}

function WorkflowCard({ item, active, expanded, delay }) {
  const position = cardPositions[item.id];
  const Icon = item.icon;
  const current = expanded ? position.final : position.initial;
  const transitionDelay = expanded ? `${delay}ms` : "0ms";

  return (
    <div
      aria-hidden="true"
      className="absolute transition-[left,top,transform,box-shadow,opacity,border-color,filter]"
      style={{
        left: `${current.x}%`,
        top: `${current.y}%`,
        width: `${position.width}%`,
        height: `${position.height}%`,
        transform: `translate(-50%, -50%) rotate(${current.rotate}deg) scale(${active ? 1.03 : 1})`,
        transformOrigin: "center center",
        transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        transitionDuration: "900ms",
        transitionDelay,
        zIndex: active ? 30 : position.z,
        filter: expanded ? "blur(0px)" : "blur(0.1px)",
        opacity: expanded ? 1 : 0.92,
      }}
    >
      <div
        className="flex h-full flex-col justify-between rounded-[24px] border px-4 py-3 backdrop-blur-md"
        style={{
          background: active
            ? "linear-gradient(155deg, rgba(255,255,255,0.98) 0%, rgba(250,243,236,0.96) 100%)"
            : "linear-gradient(155deg, rgba(255,255,255,0.92) 0%, rgba(251,246,240,0.88) 100%)",
          borderColor: active ? "rgba(154,92,46,0.34)" : "rgba(154,92,46,0.16)",
          boxShadow: expanded
            ? active
              ? `0 24px 55px rgba(50, 28, 10, 0.18), 0 0 0 1px rgba(255,255,255,0.45), 0 0 26px ${item.glow}`
              : "0 20px 48px rgba(50, 28, 10, 0.14), 0 0 0 1px rgba(255,255,255,0.4)"
            : "0 0 0 rgba(0,0,0,0), inset 0 1px 0 rgba(255,255,255,0.45)",
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl border"
              style={{
                background: active ? "rgba(154,92,46,0.14)" : "rgba(154,92,46,0.08)",
                borderColor: "rgba(154,92,46,0.14)",
              }}
            >
              <Icon className="h-4 w-4" style={{ color: "#8a5229" }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-foreground">{item.afterText}</p>
            </div>
          </div>
          <Sparkles
            className={`h-4 w-4 ${active ? "lead-showcase-card-spark" : ""}`}
            style={{ color: "#c8965c" }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-foreground/55">ClientSurge flow</p>
            <p className="text-xs font-semibold text-foreground/85">{item.metric}</p>
          </div>
          <span
            className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{
              background: active ? "rgba(122,140,106,0.14)" : "rgba(154,92,46,0.07)",
              borderColor: active ? "rgba(122,140,106,0.2)" : "rgba(154,92,46,0.14)",
              color: active ? "#6f8462" : "#8a5229",
            }}
          >
            Live
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LeadAutomationShowcase() {
  const demoBooking = useDemoBooking();
  const sectionRef = useRef(null);
  const timeoutRef = useRef([]);
  const focusTimeoutRef = useRef(null);
  const [activeWorkflow, setActiveWorkflow] = useState(workflowItems[0].id);
  const [showAfter, setShowAfter] = useState(false);
  const [cardsExpanded, setCardsExpanded] = useState(false);
  const [signalTarget, setSignalTarget] = useState(workflowItems[0].id);
  const [signalKey, setSignalKey] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [focusPulse, setFocusPulse] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const clearTimers = () => {
    timeoutRef.current.forEach((timeout) => window.clearTimeout(timeout));
    timeoutRef.current = [];
  };

  const triggerFocusPulse = () => {
    if (focusTimeoutRef.current) {
      window.clearTimeout(focusTimeoutRef.current);
    }

    setFocusPulse(true);
    focusTimeoutRef.current = window.setTimeout(() => {
      setFocusPulse(false);
    }, 1800);
  };

  const triggerSignal = (workflowId) => {
    setSignalTarget(workflowId);
    setSignalKey((current) => current + 1);
  };

  const handleWorkflowFocus = (workflowId) => {
    setActiveWorkflow(workflowId);
    if (cardsExpanded || prefersReducedMotion) {
      triggerSignal(workflowId);
    }
  };

  const resetSequence = () => {
    clearTimers();
    setShowAfter(false);
    setCardsExpanded(false);
    setSignalTarget(workflowItems[0].id);
    setActiveWorkflow(workflowItems[0].id);
  };

  const startSequence = ({ forceReplay = false } = {}) => {
    if (hasAnimated && !forceReplay) {
      setShowAfter(true);
      setCardsExpanded(true);
      triggerSignal(activeWorkflow);
      return;
    }

    resetSequence();
    setHasAnimated(true);

    if (prefersReducedMotion) {
      setShowAfter(true);
      setCardsExpanded(true);
      triggerSignal(workflowItems[0].id);
      return;
    }

    timeoutRef.current.push(window.setTimeout(() => setShowAfter(true), 650));
    timeoutRef.current.push(window.setTimeout(() => setCardsExpanded(true), 1450));
    timeoutRef.current.push(window.setTimeout(() => triggerSignal(workflowItems[0].id), 2200));
  };

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    syncMotionPreference();
    mediaQuery.addEventListener("change", syncMotionPreference);

    return () => mediaQuery.removeEventListener("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setShowAfter(true);
      setCardsExpanded(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startSequence();
        }
      },
      { threshold: 0.42 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
      clearTimers();
    };
  }, [prefersReducedMotion, hasAnimated, activeWorkflow]);

  useEffect(() => {
    if (!cardsExpanded || prefersReducedMotion) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setSignalTarget(activeWorkflow);
      setSignalKey((current) => current + 1);
    }, 40);

    return () => window.clearTimeout(timeout);
  }, [activeWorkflow, cardsExpanded, prefersReducedMotion]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleFocusRequest = () => {
      startSequence({ forceReplay: true });
      triggerFocusPulse();
    };

    window.addEventListener("lead-showcase-focus", handleFocusRequest);

    if (window.location.hash === "#lead-automation-showcase") {
      const hashTimeout = window.setTimeout(handleFocusRequest, 160);
      return () => {
        window.removeEventListener("lead-showcase-focus", handleFocusRequest);
        window.clearTimeout(hashTimeout);
        if (focusTimeoutRef.current) {
          window.clearTimeout(focusTimeoutRef.current);
        }
      };
    }

    return () => {
      window.removeEventListener("lead-showcase-focus", handleFocusRequest);
      if (focusTimeoutRef.current) {
        window.clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [prefersReducedMotion, hasAnimated, activeWorkflow]);

  return (
    <section
      id="lead-automation-showcase"
      ref={sectionRef}
      className="relative overflow-hidden px-4 py-24 md:px-6 md:py-28"
      style={{ scrollMarginTop: "18px" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 18% 24%, rgba(200,150,92,0.14) 0%, transparent 62%), radial-gradient(ellipse 52% 45% at 80% 20%, rgba(245,217,168,0.14) 0%, transparent 60%), linear-gradient(180deg, rgba(253,252,249,0.92) 0%, rgba(249,245,239,0.96) 54%, rgba(255,255,255,0.98) 100%)",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-8 mx-auto h-20 max-w-4xl rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at center, rgba(200,150,92,0.18) 0%, rgba(245,217,168,0.08) 48%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-center justify-center">
          <div
            className={`lead-showcase-anchor-cue inline-flex items-center gap-3 rounded-full border px-5 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-primary ${focusPulse ? "lead-showcase-anchor-cue-active" : ""}`}
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(251,246,240,0.88) 100%)",
              borderColor: "rgba(154,92,46,0.16)",
              boxShadow: focusPulse
                ? "0 0 0 6px rgba(200,150,92,0.08), 0 16px 40px rgba(84,48,20,0.12)"
                : "0 10px 28px rgba(84,48,20,0.08)",
            }}
          >
            <span
              aria-hidden="true"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/15 bg-primary/10"
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-90" />
            </span>
            Next: Watch The System Take Over
          </div>
          <div
            aria-hidden="true"
            className="mt-3 h-14 w-px rounded-full"
            style={{
              background:
                "linear-gradient(180deg, rgba(200,150,92,0.75) 0%, rgba(200,150,92,0.22) 45%, transparent 100%)",
            }}
          />
        </div>

        <div
          className={`rounded-[36px] border px-6 py-8 shadow-[0_24px_70px_rgba(54,29,10,0.08)] md:px-10 md:py-10 ${focusPulse ? "lead-showcase-shell-active" : ""}`}
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(252,248,243,0.74) 100%)",
            borderColor: "rgba(154,92,46,0.16)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-primary">
                See The System In Action
              </p>

              <h2
                className="mt-5 max-w-2xl text-4xl font-bold leading-[1.02] text-foreground md:text-5xl lg:text-[3.9rem]"
                style={{ fontFamily: "var(--font-titles)" }}
              >
                Turn Every New Lead Into a Faster Reply, Better Follow-Up, and More{" "}
                <span className="lead-showcase-appointments">Appointments</span>.
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-foreground/72 md:text-lg">
                A before-and-after look at how ClientSurge replaces delayed responses, missed calls,
                and cold leads with a cleaner system that moves people toward a booked consultation.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {outcomeStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[22px] border px-4 py-4"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(252,247,242,0.9) 100%)",
                      borderColor: "rgba(154,92,46,0.14)",
                      boxShadow: "0 10px 26px rgba(84,48,20,0.06)",
                    }}
                  >
                    <p className="text-xl font-semibold text-foreground">{item.value}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4">
                {workflowItems.map((item) => (
                  <BenefitItem
                    key={item.id}
                    item={item}
                    active={activeWorkflow === item.id}
                    onFocus={handleWorkflowFocus}
                  />
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="lead-showcase-stage relative mx-auto aspect-[1.04/1] w-full max-w-[620px] overflow-visible">
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full overflow-visible"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {workflowItems.map((item) => {
                    const line = signalLines[item.id];
                    const active = signalTarget === item.id;

                    return (
                      <g key={item.id}>
                        <path
                          d={`M ${line.x1} ${line.y1} C ${(line.x1 + line.x2) / 2} ${line.y1 - 2}, ${(line.x1 + line.x2) / 2} ${line.y2 + 2}, ${line.x2} ${line.y2}`}
                          fill="none"
                          stroke="rgba(154,92,46,0.16)"
                          strokeWidth="0.35"
                          strokeLinecap="round"
                        />
                        <path
                          key={`${item.id}-${signalKey}`}
                          d={`M ${line.x1} ${line.y1} C ${(line.x1 + line.x2) / 2} ${line.y1 - 2}, ${(line.x1 + line.x2) / 2} ${line.y2 + 2}, ${line.x2} ${line.y2}`}
                          fill="none"
                          stroke={active ? item.accent : "transparent"}
                          strokeWidth={active ? "0.52" : "0"}
                          strokeLinecap="round"
                          className={active ? "lead-showcase-signal-path" : undefined}
                        />
                      </g>
                    );
                  })}
                </svg>

                <div
                  aria-hidden="true"
                  className="absolute bottom-[8%] left-[28%] h-[14%] w-[48%] rounded-full blur-[28px]"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(200,150,92,0.18) 0%, rgba(245,217,168,0.08) 40%, transparent 76%)",
                    transform: "translateY(10%) scaleY(0.52)",
                  }}
                />

                <div
                  aria-hidden="true"
                  className="absolute left-[34%] top-[4%] h-[82%] w-[44%] rounded-[38px]"
                  style={{
                    background: "linear-gradient(160deg, #25252b 0%, #14151b 55%, #0d0f15 100%)",
                    boxShadow:
                      "0 0 0 8px #111217, 0 0 0 10px rgba(255,255,255,0.03), 0 36px 90px rgba(0,0,0,0.38), 0 18px 38px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="absolute left-1/2 top-[2.6%] h-[1.6%] w-[28%] -translate-x-1/2 rounded-full bg-white/10" />

                  <div
                    className="absolute inset-[3.2%] overflow-hidden rounded-[30px]"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(249,246,241,1) 0%, rgba(244,238,231,1) 100%)",
                    }}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(circle at 16% 16%, rgba(200,150,92,0.08) 0%, transparent 30%), radial-gradient(circle at 80% 18%, rgba(122,140,106,0.08) 0%, transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.74) 0%, rgba(247,241,233,0.48) 100%)",
                      }}
                    />

                    <div className="relative z-10 flex h-full flex-col">
                      <div className="flex items-center justify-between border-b border-[rgba(154,92,46,0.08)] px-[7%] py-[5%]">
                        <div>
                          <p className="text-[0.5rem] font-bold uppercase tracking-[0.28em] text-primary/70">
                            Lead Handling
                          </p>
                          <p className="mt-1 text-[0.86rem] font-semibold text-foreground">Before vs After</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[rgba(184,97,73,0.14)] px-2.5 py-1 text-[0.48rem] font-bold uppercase tracking-[0.24em] text-[#b86149]">
                            Before
                          </span>
                          <span
                            className="rounded-full px-2.5 py-1 text-[0.48rem] font-bold uppercase tracking-[0.24em] transition-all duration-700"
                            style={{
                              background: showAfter ? "rgba(122,140,106,0.16)" : "rgba(122,140,106,0.08)",
                              color: showAfter ? "#6f8462" : "rgba(111,132,98,0.62)",
                            }}
                          >
                            After
                          </span>
                        </div>
                      </div>

                      <div className="relative flex-1">
                        <div className="absolute inset-0 px-[7%] py-[7%]">
                          <div className="grid h-full grid-rows-[auto_auto_1fr] gap-[5%]">
                            <div className="rounded-[18px] border border-[rgba(184,97,73,0.12)] bg-[rgba(255,255,255,0.6)] px-4 py-3">
                              <p className="text-[0.48rem] font-bold uppercase tracking-[0.22em] text-[#b86149]">
                                Slow response
                              </p>
                              <p className="mt-1 text-[0.95rem] font-semibold text-foreground/85">
                                New inquiries sit for too long.
                              </p>
                              <div className="mt-3 h-1.5 rounded-full bg-[rgba(184,97,73,0.12)]">
                                <div className="h-1.5 w-[32%] rounded-full bg-[rgba(184,97,73,0.55)]" />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-[16px] border border-[rgba(154,92,46,0.1)] bg-white/65 px-3 py-3">
                                <p className="text-[0.48rem] font-bold uppercase tracking-[0.22em] text-foreground/45">
                                  Missed Calls
                                </p>
                                <p className="mt-1 text-[1.18rem] font-semibold text-foreground/84">3</p>
                                <p className="text-[0.62rem] text-foreground/48">No reply sent</p>
                              </div>
                              <div className="rounded-[16px] border border-[rgba(154,92,46,0.1)] bg-white/65 px-3 py-3">
                                <p className="text-[0.48rem] font-bold uppercase tracking-[0.22em] text-foreground/45">
                                  Pipeline
                                </p>
                                <p className="mt-1 text-[1.18rem] font-semibold text-foreground/84">8</p>
                                <p className="text-[0.62rem] text-foreground/48">Waiting to book</p>
                              </div>
                            </div>

                            <div className="rounded-[20px] border border-[rgba(154,92,46,0.1)] bg-white/55 px-4 py-3">
                              <p className="text-[0.48rem] font-bold uppercase tracking-[0.22em] text-foreground/45">
                                Follow-Up Status
                              </p>
                              <div className="mt-3 space-y-2.5">
                                {workflowItems.map((item) => (
                                  <div
                                    key={`before-${item.id}`}
                                    className="flex items-center justify-between rounded-[14px] border border-[rgba(154,92,46,0.08)] bg-[rgba(255,255,255,0.72)] px-3 py-2"
                                  >
                                    <span className="text-[0.68rem] font-medium text-foreground/72">{item.title}</span>
                                    <span className="text-[0.62rem] font-semibold text-[#b86149]">{item.beforeText}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          className="absolute inset-y-0 right-0 overflow-hidden border-l border-[rgba(154,92,46,0.08)] transition-[width,opacity]"
                          style={{
                            width: showAfter ? "56%" : "0%",
                            opacity: showAfter ? 1 : 0.22,
                            background:
                              "linear-gradient(180deg, rgba(250,247,242,0.98) 0%, rgba(245,239,231,0.98) 100%)",
                            boxShadow: showAfter ? "-12px 0 38px rgba(255,255,255,0.55)" : "none",
                            transitionDuration: "850ms",
                          }}
                        >
                          <div className="h-full px-[10%] py-[11%]">
                            <div
                              className="rounded-[18px] border px-4 py-3 transition-all duration-700"
                              style={{
                                borderColor: "rgba(122,140,106,0.18)",
                                background: "linear-gradient(135deg, rgba(122,140,106,0.14) 0%, rgba(255,255,255,0.78) 100%)",
                                transform: showAfter ? "translateY(0)" : "translateY(10px)",
                              }}
                            >
                              <p className="text-[0.48rem] font-bold uppercase tracking-[0.22em] text-[#6f8462]">
                                Booked Consults
                              </p>
                              <p className="mt-1 text-[1.55rem] font-semibold text-foreground">34</p>
                              <p className="text-[0.64rem] text-foreground/58">This month from automated follow-up</p>
                            </div>

                            <div className="mt-4 space-y-2.5">
                              {workflowItems.map((item) => {
                                const active = activeWorkflow === item.id;

                                return (
                                  <div
                                    key={`after-${item.id}`}
                                    className="rounded-[16px] border px-3 py-2.5 transition-all duration-300"
                                    style={{
                                      background: active
                                        ? "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,244,237,0.96) 100%)"
                                        : "rgba(255,255,255,0.82)",
                                      borderColor: active ? "rgba(154,92,46,0.2)" : "rgba(154,92,46,0.1)",
                                      boxShadow: active ? `0 0 0 1px rgba(255,255,255,0.4), 0 0 20px ${item.glow}` : "none",
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="text-[0.64rem] font-semibold text-foreground/84">{item.title}</p>
                                        <p className="mt-1 text-[0.58rem] text-foreground/55">{item.afterText}</p>
                                      </div>
                                      <span
                                        className="rounded-full px-2 py-1 text-[0.46rem] font-bold uppercase tracking-[0.18em]"
                                        style={{
                                          background: active ? `${item.glow}` : "rgba(154,92,46,0.08)",
                                          color: active ? "#7a4825" : "rgba(122,80,41,0.82)",
                                        }}
                                      >
                                        Live
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div
                          aria-hidden="true"
                          className="absolute inset-y-[10%] rounded-full transition-all"
                          style={{
                            left: showAfter ? "44%" : "98%",
                            width: "2px",
                            background:
                              "linear-gradient(180deg, rgba(200,150,92,0.08) 0%, rgba(200,150,92,0.45) 48%, rgba(200,150,92,0.08) 100%)",
                            opacity: showAfter ? 1 : 0,
                            boxShadow: showAfter ? "0 0 18px rgba(200,150,92,0.22)" : "none",
                            transitionDuration: "850ms",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {workflowItems.map((item, index) => (
                  <WorkflowCard
                    key={item.id}
                    item={item}
                    active={activeWorkflow === item.id}
                    expanded={cardsExpanded || prefersReducedMotion}
                    delay={index * 170}
                  />
                ))}
              </div>
            </div>
          </div>

          <div
            className="mt-12 flex flex-col gap-4 rounded-[32px] border px-4 py-4 md:px-6 md:py-5 lg:flex-row lg:items-center lg:justify-between"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(250,245,239,0.9) 100%)",
              borderColor: "rgba(154,92,46,0.14)",
              boxShadow: "0 18px 42px rgba(84,48,20,0.08), inset 0 1px 0 rgba(255,255,255,0.52)",
            }}
          >
            <div className="flex flex-1 flex-col gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#005f99]">
                Preview the system flows
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {workflowItems.map((item) => {
                  const active = activeWorkflow === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleWorkflowFocus(item.id)}
                      className="rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-300"
                      style={{
                        background: active
                          ? "linear-gradient(135deg, rgba(154,92,46,0.14) 0%, rgba(245,217,168,0.24) 100%)"
                          : "rgba(255,255,255,0.78)",
                        borderColor: active ? "rgba(154,92,46,0.24)" : "rgba(154,92,46,0.12)",
                        color: active ? "#7a4825" : "rgba(58,35,19,0.78)",
                        boxShadow: active ? "0 12px 24px rgba(154,92,46,0.08)" : "none",
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => demoBooking?.openDemoBooking?.()}
              className="lead-showcase-cta inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white md:px-7"
              style={{
                background: "linear-gradient(135deg, #8b572f 0%, #c8965c 48%, #9a5c2e 100%)",
                boxShadow: "0 16px 32px rgba(122,72,37,0.22)",
              }}
            >
              Book Your Demo
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .lead-showcase-appointments {
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 600;
          background: linear-gradient(135deg, #7a4825 0%, #c8965c 45%, #9a5c2e 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 10px 30px rgba(200, 150, 92, 0.18);
          position: relative;
          display: inline-block;
        }

        .lead-showcase-appointments::after {
          content: "";
          position: absolute;
          left: 2%;
          right: 4%;
          bottom: 0.1em;
          height: 0.11em;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(200,150,92,0.05) 0%, rgba(200,150,92,0.48) 50%, rgba(200,150,92,0.05) 100%);
          opacity: 0.9;
        }

        .lead-showcase-signal-path {
          stroke-dasharray: 2.4 7;
          animation: leadShowcaseSignal 1150ms ease-out forwards;
          filter: drop-shadow(0 0 5px rgba(200,150,92,0.45));
        }

        .lead-showcase-card-spark {
          animation: leadShowcaseSpark 1.8s ease-in-out infinite;
        }

        .lead-showcase-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 36px rgba(122,72,37,0.3);
        }

        .lead-showcase-shell-active {
          animation: leadShowcaseShellFocus 1.3s ease-out;
        }

        .lead-showcase-anchor-cue-active {
          animation: leadShowcaseCuePulse 1.2s ease-out;
        }

        .lead-showcase-cta {
          transition: transform 220ms ease, box-shadow 220ms ease;
        }

        @keyframes leadShowcaseSignal {
          0% {
            stroke-dashoffset: 20;
            opacity: 0;
          }
          18% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        @keyframes leadShowcaseSpark {
          0%, 100% {
            transform: scale(1);
            opacity: 0.65;
          }
          50% {
            transform: scale(1.12);
            opacity: 1;
          }
        }

        @keyframes leadShowcaseShellFocus {
          0% {
            transform: translateY(16px) scale(0.985);
            box-shadow: 0 0 0 rgba(0,0,0,0);
          }
          45% {
            transform: translateY(0) scale(1.005);
            box-shadow: 0 0 0 10px rgba(200,150,92,0.08), 0 30px 80px rgba(54,29,10,0.12);
          }
          100% {
            transform: translateY(0) scale(1);
            box-shadow: 0 24px 70px rgba(54,29,10,0.08);
          }
        }

        @keyframes leadShowcaseCuePulse {
          0% {
            transform: translateY(10px);
            opacity: 0.55;
          }
          45% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 1023px) {
          .lead-showcase-stage {
            max-width: 540px;
          }
        }

        @media (max-width: 767px) {
          .lead-showcase-stage {
            max-width: 430px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lead-showcase-signal-path,
          .lead-showcase-card-spark,
          .lead-showcase-cta {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}
