import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  MessageSquareText,
  PhoneCall,
  Send,
} from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";

const workflowItems = [
  {
    id: "instant",
    label: "Instant Replies",
    title: "Instant Lead Response",
    body: "Personalized SMS and email replies within seconds",
    metric: "12s avg. response",
    icon: Send,
  },
  {
    id: "missed",
    label: "Missed Calls",
    title: "Missed-Call Text Back",
    body: "Automatic text-back when your team can't answer",
    metric: "18 recovered this week",
    icon: PhoneCall,
  },
  {
    id: "followup",
    label: "Follow-Up",
    title: "Smart Follow-Up Sequences",
    body: "14-day nurture that keeps leads warm",
    metric: "14-day nurture live",
    icon: MessageSquareText,
  },
  {
    id: "booking",
    label: "Booking Flow",
    title: "Booking Flow Automation",
    body: "Guide qualified leads straight to your calendar",
    metric: "34 appointments booked",
    icon: CalendarCheck2,
  },
];

function BenefitItem({ item, active, onFocus }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onMouseEnter={() => onFocus(item.id)}
      onFocus={() => onFocus(item.id)}
      onClick={() => onFocus(item.id)}
      className="w-full rounded-[24px] border px-5 py-4 text-left transition-all duration-300"
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

export default function LeadAutomationShowcase() {
  const demoBooking = useDemoBooking();
  const sectionRef = useRef(null);
  const focusTimeoutRef = useRef(null);
  const [activeWorkflow, setActiveWorkflow] = useState(workflowItems[0].id);
  const [focusPulse, setFocusPulse] = useState(false);

  const triggerFocusPulse = () => {
    if (focusTimeoutRef.current) {
      window.clearTimeout(focusTimeoutRef.current);
    }

    setFocusPulse(true);
    focusTimeoutRef.current = window.setTimeout(() => {
      setFocusPulse(false);
    }, 1800);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleFocusRequest = () => {
      triggerFocusPulse();
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
  }, []);

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
            className={`inline-flex items-center gap-3 rounded-full border px-5 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-primary ${focusPulse ? "lead-showcase-anchor-cue-active" : ""}`}
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
          <div className="grid items-start gap-12 lg:grid-cols-[1.02fr_0.98fr]">
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

              <div className="mt-8 grid gap-4">
                {workflowItems.map((item) => (
                  <BenefitItem
                    key={item.id}
                    item={item}
                    active={activeWorkflow === item.id}
                    onFocus={setActiveWorkflow}
                  />
                ))}
              </div>
            </div>

            <div aria-hidden="true" className="hidden lg:block" />
          </div>

          <div
            className="mt-12 flex flex-col gap-4 rounded-[32px] border px-4 py-4 md:px-6 md:py-5 lg:flex-row lg:items-center lg:justify-between"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(250,245,239,0.9) 100%)",
              borderColor: "rgba(154,92,46,0.14)",
              boxShadow: "0 18px 42px rgba(84,48,20,0.08), inset 0 1px 0 rgba(255,255,255,0.52)",
            }}
          >
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {workflowItems.map((item) => {
                const active = activeWorkflow === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveWorkflow(item.id)}
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
      `}</style>
    </section>
  );
}
