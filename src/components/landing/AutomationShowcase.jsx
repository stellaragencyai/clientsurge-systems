import { useState, useEffect, useRef } from "react";
import { ArrowRight, Zap, Phone, Mail, Calendar, Star, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AUTOMATIONS = [
  {
    id: "instant-lead-response",
    icon: Zap,
    color: "#00AEEF",
    gradientFrom: "#0088CC",
    gradientTo: "#00AEEF",
    title: "Instant Lead Response",
    tagline: "Reply to every new lead in under 60 seconds — automatically.",
    description:
      "The moment a lead fills out a form, calls, or submits online — your AI fires a personalized SMS and email within 60 seconds. No manual work. No missed opportunities.",
    before: "Leads wait hours for a reply — most go cold",
    after: "Every lead hears from you before any competitor",
    stat: "5× more likely to convert when contacted in 60s",
    steps: [
      { icon: "📥", label: "Lead submits form", sub: "Web, Facebook, or referral" },
      { icon: "🧠", label: "AI scores & classifies", sub: "<2 sec routing" },
      { icon: "⚡", label: "Personalized SMS fires", sub: "Within 60 seconds" },
      { icon: "📧", label: "Confirmation email sent", sub: "With booking link" },
      { icon: "✅", label: "Lead engaged", sub: "Before any competitor" },
    ],
  },
  {
    id: "missed-call-textback",
    icon: Phone,
    color: "#8b5cf6",
    gradientFrom: "#7c3aed",
    gradientTo: "#a78bfa",
    title: "Missed Call Text-Back",
    tagline: "Every missed call gets an instant follow-up text.",
    description:
      "When a call goes unanswered, the system automatically texts the caller back within seconds. Your leads get a response even when you're on another job.",
    before: "Missed calls = lost revenue, no follow-up ever happens",
    after: "Every missed call gets a text back in under 60 seconds",
    stat: "Businesses recover 30–40% of calls they previously lost",
    steps: [
      { icon: "📵", label: "Call goes unanswered", sub: "Any time, any day" },
      { icon: "🔔", label: "System detects missed call", sub: "Webhook fires instantly" },
      { icon: "💬", label: "Text-back sent in 60s", sub: "\"We missed you! Book here\"" },
      { icon: "🔁", label: "Follow-up sequence starts", sub: "2 min → 1 hr → 24 hr" },
      { icon: "📅", label: "Lead books appointment", sub: "Recovered revenue" },
    ],
  },
  {
    id: "nurture-sequence",
    icon: Mail,
    color: "#10b981",
    gradientFrom: "#059669",
    gradientTo: "#34d399",
    title: "14-Day Nurture Sequence",
    tagline: "Automated follow-up that keeps leads warm for 2 weeks.",
    description:
      "A multi-touch SMS + email sequence that runs on autopilot for 14 days. Each message is personalized to the lead's industry and behavior — warming them until they're ready to book.",
    before: "1 follow-up attempt, then the lead is forgotten forever",
    after: "14 days of automated touchpoints convert cold leads",
    stat: "3× more appointments booked vs. 1-touch follow-up",
    steps: [
      { icon: "🆕", label: "New lead enters sequence", sub: "Day 0 — instant welcome" },
      { icon: "📱", label: "Day 1 SMS touchpoint", sub: "Personalized to industry" },
      { icon: "📧", label: "Day 3 email follow-up", sub: "Case study or testimonial" },
      { icon: "🔄", label: "Days 5–14 — 6 more steps", sub: "SMS + email alternating" },
      { icon: "📅", label: "Lead books or opts out", sub: "Sequence auto-stops on reply" },
    ],
  },
  {
    id: "ai-booking-agent",
    icon: Calendar,
    color: "#f97316",
    gradientFrom: "#ea580c",
    gradientTo: "#fb923c",
    title: "AI Booking Agent",
    tagline: "Turns conversations into confirmed appointments.",
    description:
      "When a lead signals intent to book, the AI takes over — sends the booking link, follows up if they don't click, and confirms the appointment automatically.",
    before: "\"Interested\" leads fall through because no one follows up",
    after: "AI detects booking intent and closes the appointment automatically",
    stat: "40% more confirmed bookings without lifting a finger",
    steps: [
      { icon: "💬", label: "Lead signals booking intent", sub: "\"I want to book\" or similar" },
      { icon: "🤖", label: "AI detects intent", sub: "Classification fires instantly" },
      { icon: "🔗", label: "Booking link sent via SMS", sub: "Personalized CTA message" },
      { icon: "⏰", label: "Reminder if no click in 2h", sub: "Automatic nudge" },
      { icon: "✅", label: "Appointment confirmed", sub: "Confirmation + calendar invite" },
    ],
  },
  {
    id: "review-request",
    icon: Star,
    color: "#eab308",
    gradientFrom: "#ca8a04",
    gradientTo: "#facc15",
    title: "Review Request Automation",
    tagline: "Automatically request 5-star reviews after every appointment.",
    description:
      "After a job is done, the system sends a perfectly-timed review request via SMS. Happy customers leave reviews. You build social proof on autopilot.",
    before: "Happy clients leave — you never ask for a review",
    after: "Every completed appointment triggers a perfectly-timed review ask",
    stat: "2–4× more Google reviews within the first 30 days",
    steps: [
      { icon: "🏁", label: "Appointment marked complete", sub: "Trigger event fires" },
      { icon: "⏱️", label: "Wait 30–60 minutes", sub: "Configurable delay" },
      { icon: "⭐", label: "Review request SMS sent", sub: "Google or platform link" },
      { icon: "📧", label: "Email follow-up at 24h", sub: "If SMS not clicked" },
      { icon: "🏆", label: "5-star review received", sub: "Reputation grows passively" },
    ],
  },
  {
    id: "lead-reactivation",
    icon: RefreshCw,
    color: "#ef4444",
    gradientFrom: "#dc2626",
    gradientTo: "#f87171",
    title: "Lead Reactivation",
    tagline: "Wake up cold leads and turn them into paying clients.",
    description:
      "Old leads who never booked get a targeted re-engagement campaign. A single reactivation blast can recover thousands in dormant revenue.",
    before: "Old leads sit ignored — dormant revenue never recovered",
    after: "A targeted re-engagement campaign wakes up leads up to 90 days old",
    stat: "Many clients recover $3k–$10k from their first reactivation run",
    steps: [
      { icon: "😴", label: "Lead dormant 14–60 days", sub: "Daily scan detects it" },
      { icon: "🎯", label: "Reactivation tier assigned", sub: "14d / 30d / 60d offer" },
      { icon: "💌", label: "Special offer SMS sent", sub: "\"20% off — limited time\"" },
      { icon: "📧", label: "Email follow-up at 24h", sub: "If SMS unanswered" },
      { icon: "💰", label: "Dormant revenue recovered", sub: "Up to 90 days back" },
    ],
  },
];

// Pipeline connector — shows the 6 automations as one chain
function PipelineStrip({ activeId, onSelect }) {
  return (
    <div className="w-full overflow-x-auto pb-2 mb-10 md:mb-14">
      <div className="flex items-center min-w-max mx-auto gap-0 px-2">
        {AUTOMATIONS.map((a, i) => {
          const isActive = a.id === activeId;
          const Icon = a.icon;
          return (
            <div key={a.id} className="flex items-center">
              <button
                type="button"
                onClick={() => onSelect(a.id)}
                className="flex flex-col items-center gap-1.5 group focus:outline-none"
                style={{ minWidth: 72 }}
              >
                <motion.div
                  animate={isActive
                    ? { scale: 1.15, boxShadow: `0 0 0 3px ${a.color}40, 0 0 18px ${a.color}50` }
                    : { scale: 1, boxShadow: "none" }
                  }
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center relative"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${a.gradientFrom}, ${a.gradientTo})`
                      : "rgba(0,0,0,0.04)",
                    border: isActive ? "none" : "1.5px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isActive ? "#fff" : a.color }}
                  />
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      animate={{ opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ background: `${a.color}30` }}
                    />
                  )}
                </motion.div>
                <span
                  className="text-[10px] font-semibold text-center leading-tight max-w-[68px]"
                  style={{ color: isActive ? a.color : "rgba(0,0,0,0.45)" }}
                >
                  {a.title.split(" ").slice(0, 2).join(" ")}
                </span>
              </button>
              {i < AUTOMATIONS.length - 1 && (
                <div className="flex items-center mx-1 mb-5">
                  <motion.div
                    className="h-px w-8"
                    style={{
                      background: i < AUTOMATIONS.findIndex(x => x.id === activeId)
                        ? `linear-gradient(to right, ${AUTOMATIONS[i].color}, ${AUTOMATIONS[i + 1].color})`
                        : "rgba(0,0,0,0.1)",
                    }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: i < AUTOMATIONS.findIndex(x => x.id === activeId)
                        ? AUTOMATIONS[i + 1].color
                        : "rgba(0,0,0,0.15)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-[11px] text-muted-foreground mt-3 tracking-wide">
        One connected pipeline — each system hands off to the next
      </p>
    </div>
  );
}

// Animated flow diagram with step-by-step reveal
function AnimatedFlowDiagram({ automation }) {
  const [visibleStep, setVisibleStep] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    setVisibleStep(0);
    intervalRef.current = setInterval(() => {
      setVisibleStep(prev => {
        if (prev >= automation.steps.length - 1) {
          clearInterval(intervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 700);
    return () => clearInterval(intervalRef.current);
  }, [automation.id]);

  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-3 h-full"
      style={{ background: `${automation.color}08`, borderColor: `${automation.color}20` }}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: automation.color }}>
        Live Flow
      </p>
      <div className="flex flex-col gap-0">
        {automation.steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={i <= visibleStep ? { opacity: 1, x: 0 } : { opacity: 0.15, x: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex items-stretch gap-3"
          >
            <div className="flex flex-col items-center" style={{ width: 36 }}>
              <motion.div
                animate={i === visibleStep ? {
                  scale: [1, 1.15, 1],
                  boxShadow: [`0 0 0px ${automation.color}00`, `0 0 12px ${automation.color}60`, `0 0 0px ${automation.color}00`]
                } : {}}
                transition={{ duration: 0.6 }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{
                  background: i <= visibleStep ? `${automation.color}18` : "rgba(0,0,0,0.04)",
                  border: `1.5px solid ${i <= visibleStep ? automation.color + "35" : "rgba(0,0,0,0.08)"}`,
                }}
              >
                {step.icon}
              </motion.div>
              {i < automation.steps.length - 1 && (
                <motion.div
                  className="w-px flex-1 my-1"
                  animate={i < visibleStep ? { opacity: 1 } : { opacity: 0.15 }}
                  style={{ background: automation.color, minHeight: 16 }}
                />
              )}
            </div>
            <div className="pb-3 pt-1">
              <p className="text-sm font-semibold text-foreground leading-tight">{step.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{step.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Before/After stat card with credible framing
function BeforeAfterStat({ automation }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 flex flex-col justify-between gap-5">
      <div className="space-y-3">
        <div className="rounded-xl p-3.5" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-400 mb-1">Before</p>
          <p className="text-sm text-foreground/75 leading-relaxed">{automation.before}</p>
        </div>
        <div className="rounded-xl p-3.5" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 mb-1">After</p>
          <p className="text-sm text-foreground/80 font-medium leading-relaxed">{automation.after}</p>
        </div>
      </div>
      <div>
        <div
          className="rounded-xl p-3.5 mb-4"
          style={{ background: `${automation.color}0d`, border: `1px solid ${automation.color}25` }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: automation.color }}>
            Typical Result
          </p>
          <p className="text-sm font-bold text-foreground">{automation.stat}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Based on system capabilities — individual results vary.</p>
        </div>
        <a
          href="/store"
          className="w-full inline-flex items-center justify-center gap-2 text-white text-sm font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity"
          style={{ background: `linear-gradient(135deg, ${automation.gradientFrom}, ${automation.gradientTo})` }}
        >
          Get This System <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export default function AutomationShowcase() {
  const [activeId, setActiveId] = useState(AUTOMATIONS[0].id);
  const active = AUTOMATIONS.find((a) => a.id === activeId);

  return (
    <section className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: "#00AEEF" }}>
            The Complete System
          </p>
          <h2
            className="font-bold tracking-tight text-foreground leading-tight"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)", fontFamily: "Montserrat, sans-serif" }}
          >
            One System.{" "}
            <span style={{ color: "#00AEEF", textShadow: "0 0 28px rgba(0,174,239,0.3)" }}>
              Six Automations.
            </span>{" "}
            Zero Leads Lost.
          </h2>
          <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Click any automation to see exactly how it works and what it changes for your business.
          </p>
        </div>

        {/* Pipeline Strip — visual continuity */}
        <PipelineStrip activeId={activeId} onSelect={setActiveId} />

        {/* Active automation detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Hero bar */}
            <div
              className="rounded-2xl p-6 mb-6 flex items-center gap-4"
              style={{
                background: `linear-gradient(135deg, ${active.gradientFrom}, ${active.gradientTo})`,
              }}
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <active.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">{active.title}</h3>
                <p className="text-white/85 text-sm mt-0.5">{active.tagline}</p>
              </div>
              <div className="hidden sm:block text-right flex-shrink-0">
                <p className="text-white/60 text-[10px] uppercase tracking-widest mb-1">Pipeline Step</p>
                <p className="text-white font-bold text-lg">{AUTOMATIONS.findIndex(a => a.id === activeId) + 1} of 6</p>
              </div>
            </div>

            {/* 2-col: flow diagram + before/after */}
            <div className="grid md:grid-cols-2 gap-6">
              <AnimatedFlowDiagram automation={active} key={activeId} />
              <BeforeAfterStat automation={active} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}