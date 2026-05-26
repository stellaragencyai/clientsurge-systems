import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Zap, PhoneMissed, MailCheck, CalendarCheck, Star, Repeat2,
  FileInput, Brain, MessageSquare, Mail, Clock, CheckCircle,
  Send, RotateCcw, AlertCircle, DollarSign } from
"lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BRAND_COLOR = "#00AEEF"; // #33: unified with site brand blue
const BRAND_GRADIENT_FROM = "#003B8F";
const BRAND_GRADIENT_TO = "#0066CC";

const AUTOMATIONS = [
{
  id: "instant-lead-response",
  icon: Zap,
  title: "Instant Lead Response",
  tagline: "Reply to every new lead in under 60 seconds — automatically.",
  description:
  "The moment a lead fills out a form, calls, or submits online — your AI fires a personalized SMS and email within 60 seconds. No manual work. No missed opportunities.",
  before: "Leads wait hours for a reply — most go cold",
  after: "Every lead hears from you before any competitor",
  stat: "5× more likely to convert when contacted in 60s",
  steps: [
  { icon: FileInput, label: "Lead submits form", sub: "Web, Facebook, or referral" },
  { icon: Brain, label: "AI scores & classifies", sub: "<2 sec routing" },
  { icon: Zap, label: "Personalized SMS fires", sub: "Within 60 seconds" },
  { icon: Mail, label: "Confirmation email sent", sub: "With booking link" },
  { icon: CheckCircle, label: "Lead engaged", sub: "Before any competitor" }]

},
{
  id: "missed-call-textback",
  icon: PhoneMissed,
  title: "Missed Call Text-Back",
  tagline: "Every missed call gets an instant follow-up text.",
  description:
  "When a call goes unanswered, the system automatically texts the caller back within seconds. Your leads get a response even when you're on another job.",
  before: "Missed calls = lost revenue, no follow-up ever happens",
  after: "Every missed call gets a text back in under 60 seconds",
  stat: "Businesses recover 30–40% of calls they previously lost",
  steps: [
  { icon: PhoneMissed, label: "Call goes unanswered", sub: "Any time, any day" },
  { icon: AlertCircle, label: "System detects missed call", sub: "Webhook fires instantly" },
  { icon: MessageSquare, label: "Text-back sent in 60s", sub: "\"We missed you! Book here\"" },
  { icon: RotateCcw, label: "Follow-up sequence starts", sub: "2 min → 1 hr → 24 hr" },
  { icon: CalendarCheck, label: "Lead books appointment", sub: "Recovered revenue" }]

},
{
  id: "nurture-sequence",
  icon: MailCheck,
  title: "14-Day Nurture Sequence",
  tagline: "Automated follow-up that keeps leads warm for 2 weeks.",
  description:
  "A multi-touch SMS + email sequence that runs on autopilot for 14 days. Each message is personalized to the lead's industry and behavior — warming them until they're ready to book.",
  before: "1 follow-up attempt, then the lead is forgotten forever",
  after: "14 days of automated touchpoints convert cold leads",
  stat: "3× more appointments booked vs. 1-touch follow-up",
  steps: [
  { icon: FileInput, label: "New lead enters sequence", sub: "Day 0 — instant welcome" },
  { icon: MessageSquare, label: "Day 1 SMS touchpoint", sub: "Personalized to industry" },
  { icon: Mail, label: "Day 3 email follow-up", sub: "Case study or testimonial" },
  { icon: RotateCcw, label: "Days 5–14 — 6 more steps", sub: "SMS + email alternating" },
  { icon: CalendarCheck, label: "Lead books or opts out", sub: "Sequence auto-stops on reply" }]

},
{
  id: "ai-booking-agent",
  icon: CalendarCheck,
  title: "AI Booking Agent",
  tagline: "Turns conversations into confirmed appointments.",
  description:
  "When a lead signals intent to book, the AI takes over — sends the booking link, follows up if they don't click, and confirms the appointment automatically.",
  before: "\"Interested\" leads fall through because no one follows up",
  after: "AI detects booking intent and closes the appointment automatically",
  stat: "40% more confirmed bookings without lifting a finger",
  steps: [
  { icon: MessageSquare, label: "Lead signals booking intent", sub: "\"I want to book\" or similar" },
  { icon: Brain, label: "AI detects intent", sub: "Classification fires instantly" },
  { icon: Send, label: "Booking link sent via SMS", sub: "Personalized CTA message" },
  { icon: Clock, label: "Reminder if no click in 2h", sub: "Automatic nudge" },
  { icon: CheckCircle, label: "Appointment confirmed", sub: "Confirmation + calendar invite" }]

},
{
  id: "review-request",
  icon: Star,
  title: "Review Request Automation",
  tagline: "Automatically request 5-star reviews after every appointment.",
  description:
  "After a job is done, the system sends a perfectly-timed review request via SMS. Happy customers leave reviews. You build social proof on autopilot.",
  before: "Happy clients leave — you never ask for a review",
  after: "Every completed appointment triggers a perfectly-timed review ask",
  stat: "2–4× more Google reviews within the first 30 days",
  steps: [
  { icon: CheckCircle, label: "Appointment marked complete", sub: "Trigger event fires" },
  { icon: Clock, label: "Wait 30–60 minutes", sub: "Configurable delay" },
  { icon: Star, label: "Review request SMS sent", sub: "Google or platform link" },
  { icon: Mail, label: "Email follow-up at 24h", sub: "If SMS not clicked" },
  { icon: Star, label: "5-star review received", sub: "Reputation grows passively" }]

},
{
  id: "lead-reactivation",
  icon: Repeat2,
  title: "Lead Reactivation",
  tagline: "Wake up cold leads and turn them into paying clients.",
  description:
  "Old leads who never booked get a targeted re-engagement campaign. A single reactivation blast can recover thousands in dormant revenue.",
  before: "Old leads sit ignored — dormant revenue never recovered",
  after: "A targeted re-engagement campaign wakes up leads up to 90 days old",
  stat: "Many clients recover $3k–$10k from their first reactivation run",
  steps: [
  { icon: Clock, label: "Lead dormant 14–60 days", sub: "Daily scan detects it" },
  { icon: Brain, label: "Reactivation tier assigned", sub: "14d / 30d / 60d offer" },
  { icon: MessageSquare, label: "Special offer SMS sent", sub: "\"20% off — limited time\"" },
  { icon: Mail, label: "Email follow-up at 24h", sub: "If SMS unanswered" },
  { icon: DollarSign, label: "Dormant revenue recovered", sub: "Up to 90 days back" }]

}];


// Accent colors per automation
const AUTOMATION_ACCENTS = [
  "#00AEEF", // Instant Lead — electric blue
  "#f97316", // Missed Call — orange
  "#a855f7", // Nurture — purple
  "#10b981", // Booking — emerald
  "#f59e0b", // Review — amber
  "#ef4444", // Reactivation — red
];

// Vertical card-based pipeline selector
function PipelineStrip({ activeId, onSelect }) {
  return (
    <div className="w-full mb-10 md:mb-12">
      {/* Desktop: vertical card list on left, content on right — but here we do horizontal pills row */}
      <div className="flex flex-col gap-2">
        {AUTOMATIONS.map((a, i) => {
          const isActive = a.id === activeId;
          const Icon = a.icon;
          const accent = AUTOMATION_ACCENTS[i];
          return (
            <motion.button
              key={a.id}
              type="button"
              onClick={() => onSelect(a.id)}
              whileHover={{ x: isActive ? 0 : 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 18px",
                borderRadius: "14px",
                border: isActive ? `1.5px solid ${accent}40` : "1.5px solid rgba(0,0,0,0.07)",
                background: isActive
                  ? `linear-gradient(135deg, ${accent}12 0%, ${accent}06 100%)`
                  : "rgba(255,255,255,0.6)",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                position: "relative",
                overflow: "hidden",
                boxShadow: isActive
                  ? `0 4px 20px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.6)`
                  : "0 1px 4px rgba(0,0,0,0.05)",
                transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
              }}>

              {/* Left accent bar */}
              <div style={{
                position: "absolute",
                left: 0, top: 0, bottom: 0,
                width: isActive ? "4px" : "0px",
                background: `linear-gradient(to bottom, ${accent}, ${accent}88)`,
                borderRadius: "14px 0 0 14px",
                transition: "width 0.25s ease",
              }} />

              {/* Icon badge */}
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isActive ? `${accent}20` : "rgba(0,0,0,0.05)",
                border: isActive ? `1.5px solid ${accent}40` : "1.5px solid rgba(0,0,0,0.08)",
                boxShadow: isActive ? `0 0 12px ${accent}40` : "none",
                transition: "all 0.25s ease",
              }}>
                <Icon style={{ width: 18, height: 18, color: isActive ? accent : "rgba(0,0,0,0.4)" }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p style={{
                  fontSize: "13px",
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? "#0a1628" : "rgba(0,0,0,0.55)",
                  margin: 0,
                  lineHeight: 1.2,
                  transition: "color 0.2s ease",
                }}>{a.title}</p>
                <p style={{
                  fontSize: "11px",
                  color: isActive ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.35)",
                  margin: "2px 0 0",
                  lineHeight: 1.3,
                  transition: "color 0.2s ease",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}>{a.tagline}</p>
              </div>

              {/* Step number */}
              <div style={{
                flexShrink: 0,
                width: 24, height: 24, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isActive ? accent : "rgba(0,0,0,0.06)",
                fontSize: "10px",
                fontWeight: 800,
                color: isActive ? "#fff" : "rgba(0,0,0,0.35)",
                transition: "all 0.25s ease",
              }}>{i + 1}</div>
            </motion.button>
          );
        })}
      </div>
      <p className="text-center text-[11px] mt-5 tracking-wide text-muted-foreground">
        One connected pipeline — each system hands off to the next
      </p>
    </div>
  );
}

// Flow diagram with dark glassmorphism treatment
function AnimatedFlowDiagram({ automation, accent }) {
  const [visibleStep, setVisibleStep] = useState(-1);
  const intervalRef = useRef(null);

  useEffect(() => {
    setVisibleStep(-1);
    const startDelay = setTimeout(() => {
      setVisibleStep(0);
      intervalRef.current = setInterval(() => {
        setVisibleStep((prev) => {
          if (prev >= automation.steps.length - 1) {
            clearInterval(intervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 650);
    }, 200);
    return () => {
      clearTimeout(startDelay);
      clearInterval(intervalRef.current);
    };
  }, [automation.id]);

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4 h-full"
      style={{
        background: "linear-gradient(150deg, #0d1f3c 0%, #0a1a30 50%, #07121f 100%)",
        border: `1px solid ${accent}30`,
        boxShadow: `0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px ${accent}18, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: accent,
          boxShadow: `0 0 10px ${accent}`,
          animation: "flowPulse 2s ease-in-out infinite",
        }} />
        <p style={{ fontSize: "11px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.22em", margin: 0 }}>
          Live Flow
        </p>
      </div>

      <div className="flex flex-col gap-0" style={{ position: "relative" }}>
        {automation.steps.map((step, i) => {
          const Icon = step.icon;
          const isVisible = i <= visibleStep;
          const isActive = i === visibleStep;
          const isLast = i === automation.steps.length - 1;

          return (
            <div key={i} className="flex items-stretch gap-3">
              {/* Left column: icon + animated line */}
              <div className="flex flex-col items-center" style={{ width: 38 }}>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0.2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  style={{
                    width: 38, height: 38, borderRadius: 11,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    background: isVisible ? `${accent}20` : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${isVisible ? `${accent}50` : "rgba(255,255,255,0.08)"}`,
                    boxShadow: isActive ? `0 0 18px ${accent}50` : "none",
                    position: "relative",
                  }}>
                  <Icon style={{ width: 16, height: 16, color: isVisible ? accent : "rgba(255,255,255,0.2)" }} />
                  {isActive && (
                    <motion.div
                      style={{
                        position: "absolute", inset: -4, borderRadius: 15,
                        border: `1.5px solid ${accent}`,
                        opacity: 0,
                      }}
                      animate={{ opacity: [0, 0.7, 0], scale: [0.9, 1.2, 0.9] }}
                      transition={{ duration: 1, repeat: 2 }} />
                  )}
                </motion.div>

                {/* Animated line connector */}
                {!isLast && (
                  <div style={{ width: 2, flex: 1, minHeight: 18, position: "relative", margin: "3px 0", overflow: "hidden" }}>
                    <motion.div
                      style={{
                        position: "absolute", top: 0, left: 0, right: 0,
                        background: `linear-gradient(to bottom, ${accent}, ${accent}40)`,
                        borderRadius: 2,
                      }}
                      initial={{ height: "0%" }}
                      animate={i < visibleStep ? { height: "100%" } : { height: "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut" }} />
                    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.05)", borderRadius: 2 }} />
                  </div>
                )}
              </div>

              {/* Text */}
              <motion.div
                className="pb-3 pt-1"
                initial={{ opacity: 0, x: -10 }}
                animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0.15, x: -6 }}
                transition={{ duration: 0.3, ease: "easeOut" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.92)", margin: 0, lineHeight: 1.3 }}>{step.label}</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.42)", margin: "2px 0 0" }}>{step.sub}</p>
              </motion.div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes flowPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }`}</style>
    </div>
  );
}

// Before/After card
function BeforeAfterStat({ automation }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="rounded-2xl p-6 flex flex-col justify-between gap-5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        boxShadow: hovered
          ? "0 12px 40px rgba(0,136,204,0.15), 0 0 0 1px rgba(0,136,204,0.2)"
          : "0 4px 16px rgba(0,0,0,0.08)",
        transform: hovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)",
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease",
      }}>
      <div className="space-y-3">
        <div className="rounded-xl p-3.5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: "#dc2626" }}>Before</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{automation.before}</p>
        </div>
        <div className="rounded-xl p-3.5" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: "#16a34a" }}>After</p>
          <p className="text-sm font-medium leading-relaxed text-foreground">{automation.after}</p>
        </div>
      </div>
      <div>
        <div
          className="rounded-xl p-3.5 mb-4"
          style={{ background: `rgba(0,136,204,0.06)`, border: `1px solid rgba(0,136,204,0.18)` }}>
          
          <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: BRAND_COLOR }}>
            Typical Result
          </p>
          <p className="text-sm font-bold text-foreground">{automation.stat}</p>
          <p className="text-[11px] mt-1 text-muted-foreground">Based on system capabilities — individual results vary.</p>
        </div>
        <a
          href="/store"
          className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold px-5 py-3 rounded-xl transition-all"
          style={{
            background: "linear-gradient(135deg, #003B8F 0%, #0055CC 50%, #0088CC 100%)",
            color: "#ffffff",
            border: "1px solid rgba(0,212,255,0.25)",
            boxShadow: "0 4px 18px rgba(0,59,143,0.5)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,59,143,0.7)"; e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,59,143,0.5)"; e.currentTarget.style.transform = "scale(1)"; }}>
          
          Get This System <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>);

}

// Ripple effect component
function RippleEffect({ color, onDone }) {
  return (
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        background: `radial-gradient(circle, ${color}40 0%, ${color}00 70%)`,
        pointerEvents: "none",
        zIndex: 10
      }}
      initial={{ opacity: 1, scale: 0.5 }}
      animate={{ opacity: 0, scale: 2.5 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      onAnimationComplete={onDone} />);


}

export default function AutomationShowcase() {
  const [activeId, setActiveId] = useState(AUTOMATIONS[0].id);
  const [rippleKey, setRippleKey] = useState(null);
  const active = AUTOMATIONS.find((a) => a.id === activeId);
  const activeIndex = AUTOMATIONS.findIndex((a) => a.id === activeId);
  const accent = AUTOMATION_ACCENTS[activeIndex];

  const handleSelect = (id) => {
    if (id === activeId) return;
    setRippleKey(id + Date.now());
    setActiveId(id);
  };

  return (
    <section className="py-20 md:py-28 overflow-hidden" style={{ position: "relative" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6" style={{ position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: BRAND_COLOR }}>
            The Complete System
          </p>
          <h2
            className="font-bold tracking-tight leading-tight"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)", fontFamily: "Montserrat, sans-serif" }}>
            One System.{" "}
            <span style={{
              background: "linear-gradient(135deg, #0088CC, #003B8F)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Six Automations.
            </span>{" "}
            Zero Leads Lost.
          </h2>
          <p className="mt-4 text-base md:text-lg max-w-2xl mx-auto leading-relaxed text-muted-foreground">
            Select any automation to see exactly how it works and what it changes for your business.
          </p>
        </div>

        {/* Main layout: left rail (selector) + right panel (detail) */}
        <div className="grid md:grid-cols-[340px_1fr] gap-8 items-start">

          {/* Left: Vertical card selector */}
          <PipelineStrip activeId={activeId} onSelect={handleSelect} />

          {/* Right: Detail panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col gap-5">

              {/* Hero bar */}
              <div
                className="rounded-2xl p-6 flex items-center gap-4"
                style={{
                  background: `linear-gradient(135deg, #0a1628 0%, #0d1f40 50%, #0a1830 100%)`,
                  border: `1px solid ${accent}35`,
                  boxShadow: `0 8px 40px rgba(0,0,0,0.35), 0 0 0 1px ${accent}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
                  position: "relative",
                  overflow: "hidden",
                }}>

                {/* Accent glow blob */}
                <div style={{
                  position: "absolute", top: "-30%", right: "-10%",
                  width: "200px", height: "200px", borderRadius: "50%",
                  background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)`,
                  pointerEvents: "none",
                }} />

                {rippleKey && <RippleEffect key={rippleKey} color={accent} onDone={() => setRippleKey(null)} />}

                <motion.div
                  key={activeId + "-icon"}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  style={{
                    width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${accent}25`,
                    border: `1.5px solid ${accent}50`,
                    boxShadow: `0 0 20px ${accent}40`,
                    position: "relative", zIndex: 2,
                  }}>
                  <active.icon style={{ width: 24, height: 24, color: accent }} />
                </motion.div>

                <div className="flex-1 min-w-0" style={{ position: "relative", zIndex: 2 }}>
                  <h3 className="text-xl md:text-2xl font-bold leading-tight" style={{ color: "#ffffff" }}>{active.title}</h3>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", marginTop: 2 }}>{active.tagline}</p>
                </div>
                <div className="hidden sm:flex flex-col items-end flex-shrink-0" style={{ position: "relative", zIndex: 2 }}>
                  <span style={{
                    fontSize: "10px", fontWeight: 800, color: accent,
                    textTransform: "uppercase", letterSpacing: "0.15em",
                    background: `${accent}18`, border: `1px solid ${accent}35`,
                    padding: "3px 10px", borderRadius: "999px",
                  }}>
                    Step {activeIndex + 1} of 6
                  </span>
                </div>
              </div>

              {/* 2-col: flow + before/after */}
              <div className="grid sm:grid-cols-2 gap-5">
                <AnimatedFlowDiagram automation={active} accent={accent} key={activeId} />
                <BeforeAfterStat automation={active} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}