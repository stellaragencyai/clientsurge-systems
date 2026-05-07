import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Zap, PhoneMissed, MailCheck, CalendarCheck, Star, Repeat2,
  FileInput, Brain, MessageSquare, Mail, Clock, CheckCircle, Phone,
  Send, RotateCcw, BookOpen, AlertCircle, DollarSign } from
"lucide-react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

const BRAND_COLOR = "#00D4FF";
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


// Animated SVG pipeline with traveling data pulse
function PipelineStrip({ activeId, onSelect }) {
  const activeIndex = AUTOMATIONS.findIndex((a) => a.id === activeId);
  const [pulsePos, setPulsePos] = useState(0);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const DURATION = 3000;

  useEffect(() => {
    startTimeRef.current = null;
    const animate = (ts) => {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const progress = elapsed % DURATION / DURATION;
      setPulsePos(progress);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Node positions — evenly spaced
  const NODE_COUNT = AUTOMATIONS.length;
  const SVG_W = 600;
  const SVG_H = 56;
  const NODE_Y = SVG_H / 2;
  const PAD = 40;
  const spacing = (SVG_W - PAD * 2) / (NODE_COUNT - 1);
  const nodeXs = AUTOMATIONS.map((_, i) => PAD + i * spacing);

  // Pulse x position along the line
  const pulseX = PAD + pulsePos * (SVG_W - PAD * 2);

  return (
    <div className="w-full mb-10 md:mb-14">
      {/* SVG pipeline line — desktop */}
      <div className="hidden sm:flex justify-center">
        <div style={{ position: "relative", width: "100%", maxWidth: 640 }}>
          <svg
            width="100%"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ overflow: "visible", display: "block" }}>
            
            <defs>
              <linearGradient id="pipelineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={BRAND_COLOR} stopOpacity="0.15" />
                <stop offset="100%" stopColor={BRAND_COLOR} stopOpacity="0.35" />
              </linearGradient>
              <radialGradient id="pulseGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={BRAND_COLOR} stopOpacity="0.9" />
                <stop offset="100%" stopColor={BRAND_COLOR} stopOpacity="0" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Base pipeline track */}
            <line
              x1={PAD} y1={NODE_Y} x2={SVG_W - PAD} y2={NODE_Y}
              stroke="rgba(0,212,255,0.12)"
              strokeWidth="2"
              strokeDasharray="6 4" />
            

            {/* Lit segment — up to active node */}
            {activeIndex > 0 &&
            <line
              x1={nodeXs[0]} y1={NODE_Y}
              x2={nodeXs[activeIndex]} y2={NODE_Y}
              stroke={BRAND_COLOR}
              strokeWidth="2"
              strokeOpacity="0.45" />

            }

            {/* Traveling pulse dot */}
            <circle
              cx={pulseX}
              cy={NODE_Y}
              r="5"
              fill={BRAND_COLOR}
              filter="url(#glow)"
              opacity="0.85" />
            
            <circle
              cx={pulseX}
              cy={NODE_Y}
              r="10"
              fill="url(#pulseGlow)"
              opacity="0.4" />
            

            {/* Node circles (clickable via foreignObject overlay) */}
            {AUTOMATIONS.map((a, i) => {
              const isActive = a.id === activeId;
              return (
                <g key={a.id}>
                  {isActive &&
                  <circle
                    cx={nodeXs[i]}
                    cy={NODE_Y}
                    r="24"
                    fill={BRAND_COLOR}
                    opacity="0.08" />

                  }
                  <circle
                   cx={nodeXs[i]}
                   cy={NODE_Y}
                   r="18"
                   fill={isActive ? BRAND_COLOR : "rgba(255,255,255,0.06)"}
                   stroke={isActive ? BRAND_COLOR : "rgba(0,212,255,0.2)"}
                   strokeWidth={isActive ? "2" : "1.5"}
                   filter={isActive ? "url(#glow)" : "none"}
                   style={{ cursor: "pointer" }}
                   onClick={() => onSelect(a.id)} />
                  
                </g>);

            })}
          </svg>

          {/* Icon + label overlays positioned over SVG nodes */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: SVG_H,
              pointerEvents: "none"
            }}>
            
            {AUTOMATIONS.map((a, i) => {
              const isActive = a.id === activeId;
              const Icon = a.icon;
              const xPct = (nodeXs[i] / SVG_W * 100).toFixed(2);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelect(a.id)}
                  style={{
                    position: "absolute",
                    left: `${xPct}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "auto",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36
                  }}>
                  
                  <motion.div
                    animate={isActive ?
                    { scale: 1.2 } :
                    { scale: 1 }
                    }
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}>
                    
                    <Icon
                      style={{
                        width: 16,
                        height: 16,
                        color: isActive ? "#040d1a" : BRAND_COLOR,
                        opacity: isActive ? 1 : 0.7
                      }} />
                    
                  </motion.div>
                </button>);

            })}
          </div>
        </div>
      </div>

      {/* Labels row */}
      <div className="hidden sm:flex justify-center mt-3">
        <div style={{ width: "100%", maxWidth: 640, display: "flex", justifyContent: "space-between", padding: `0 ${PAD - 20}px` }}>
          {AUTOMATIONS.map((a) => {
            const isActive = a.id === activeId;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelect(a.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "center",
                  width: 72,
                  marginLeft: -16,
                  padding: 0
                }}>
                
                <span
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? BRAND_COLOR : "rgba(0,0,0,0.4)",
                    lineHeight: 1.3,
                    transition: "color 0.2s ease"
                  }}>
                  
                  {a.title.split(" ").slice(0, 2).join(" ")}
                </span>
              </button>);

          })}
        </div>
      </div>

      {/* Mobile horizontal scroll fallback */}
      <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 px-2">
        {AUTOMATIONS.map((a) => {
          const isActive = a.id === activeId;
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a.id)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 focus:outline-none">
              
              <div
                style={{
                  width: 44, height: 44, borderRadius: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive ? BRAND_COLOR : "rgba(0,136,204,0.07)",
                  border: isActive ? "none" : "1.5px solid rgba(0,136,204,0.18)",
                  boxShadow: isActive ? `0 0 0 3px rgba(0,136,204,0.2), 0 0 22px rgba(0,136,204,0.35)` : "none",
                  transition: "all 0.25s ease"
                }}>
                
                <Icon style={{ width: 18, height: 18, color: isActive ? "#ffffff" : BRAND_COLOR }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? BRAND_COLOR : "rgba(0,0,0,0.4)", textAlign: "center", maxWidth: 60, lineHeight: 1.3 }}>
                {a.title.split(" ").slice(0, 2).join(" ")}
              </span>
            </button>);

        })}
      </div>

      <p className="text-center text-[11px] mt-4 tracking-wide text-muted-foreground">
        One connected pipeline — each system hands off to the next
      </p>
    </div>);

}

// Flow diagram with Lucide icons + line-draw connectors
function AnimatedFlowDiagram({ automation }) {
  const [visibleStep, setVisibleStep] = useState(-1);
  const [hovered, setHovered] = useState(false);
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
      className="rounded-2xl p-5 flex flex-col gap-3 h-full"
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
      
      <p className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: BRAND_COLOR }}>
        Live Flow
      </p>
      <div className="flex flex-col gap-0" style={{ position: "relative" }}>
        {automation.steps.map((step, i) => {
          const Icon = step.icon;
          const isVisible = i <= visibleStep;
          const isActive = i === visibleStep;
          const isLast = i === automation.steps.length - 1;

          return (
            <div key={i} className="flex items-stretch gap-3">
              {/* Left column: icon + animated line */}
              <div className="flex flex-col items-center" style={{ width: 36 }}>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={isVisible ?
                  { scale: 1, opacity: 1 } :
                  { scale: 0.6, opacity: 0.15 }
                  }
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    background: isVisible ? `rgba(0,136,204,0.1)` : "rgba(0,0,0,0.03)",
                    border: `1.5px solid ${isVisible ? "rgba(0,136,204,0.3)" : "rgba(0,0,0,0.08)"}`,
                    boxShadow: isActive ? `0 0 14px rgba(0,136,204,0.35)` : "none",
                    position: "relative"
                  }}>
                  
                  <Icon style={{ width: 16, height: 16, color: isVisible ? BRAND_COLOR : "rgba(0,0,0,0.25)" }} />
                  {isActive &&
                  <motion.div
                    style={{
                      position: "absolute", inset: -3, borderRadius: 13,
                      border: `1.5px solid ${BRAND_COLOR}`,
                      opacity: 0
                    }}
                    animate={{ opacity: [0, 0.6, 0], scale: [0.9, 1.15, 0.9] }}
                    transition={{ duration: 0.9, repeat: 2 }} />

                  }
                </motion.div>

                {/* Animated line-draw connector */}
                {!isLast &&
                <div style={{ width: 2, flex: 1, minHeight: 18, position: "relative", margin: "3px 0", overflow: "hidden" }}>
                    <motion.div
                    style={{
                      position: "absolute", top: 0, left: 0, right: 0,
                      background: `linear-gradient(to bottom, ${BRAND_COLOR}, rgba(0,174,239,0.3))`,
                      borderRadius: 2
                    }}
                    initial={{ height: "0%" }}
                    animate={i < visibleStep ? { height: "100%" } : { height: "0%" }}
                    transition={{ duration: 0.4, ease: "easeOut" }} />
                  
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,174,239,0.08)", borderRadius: 2 }} />
                  </div>
                }
              </div>

              {/* Text */}
              <motion.div
                className="pb-3 pt-1"
                initial={{ opacity: 0, x: -10 }}
                animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0.15, x: -6 }}
                transition={{ duration: 0.3, ease: "easeOut" }}>
                
                <p className="text-sm font-semibold leading-tight text-foreground">{step.label}</p>
                <p className="text-xs mt-0.5 text-muted-foreground">{step.sub}</p>
              </motion.div>
            </div>);

        })}
      </div>
    </div>);

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

  const handleSelect = (id) => {
    if (id === activeId) return;
    setRippleKey(id + Date.now());
    setActiveId(id);
  };

  return (
    <section className="py-20 md:py-28 overflow-hidden" style={{ position: "relative" }}>

      <div className="max-w-6xl mx-auto px-4 sm:px-6" style={{ position: "relative", zIndex: 1 }}>
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
            Click any automation to see exactly how it works and what it changes for your business.
          </p>
        </div>

        {/* Pipeline Strip */}
        <PipelineStrip activeId={activeId} onSelect={handleSelect} />

        {/* Active automation detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}>
            
            {/* Hero bar with ripple */}
            <div
              className="rounded-2xl p-6 mb-6 flex items-center gap-4"
              style={{
                background: `linear-gradient(135deg, #001f5c 0%, #003B8F 45%, #0055b3 100%)`,
                border: "1px solid rgba(0,212,255,0.2)",
                boxShadow: "0 8px 40px rgba(0,59,143,0.5), 0 0 0 1px rgba(0,212,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
                position: "relative",
                overflow: "hidden"
              }}>
              
              {rippleKey &&
              <RippleEffect
                key={rippleKey}
                color="#ffffff"
                onDone={() => setRippleKey(null)} />

              }

              <motion.div
                key={activeId + "-icon"}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ position: "relative", zIndex: 2 }}>
                
                <active.icon className="w-6 h-6 text-white" />
              </motion.div>

              <div className="flex-1 min-w-0" style={{ position: "relative", zIndex: 2 }}>
                <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">{active.title}</h3>
                <p className="text-white/85 text-sm mt-0.5">{active.tagline}</p>
              </div>
              <div className="hidden sm:block text-right flex-shrink-0" style={{ position: "relative", zIndex: 2 }}>
                <p className="text-white/60 text-[10px] uppercase tracking-widest mb-1">Pipeline Step</p>
                <p className="text-white font-bold text-lg">{AUTOMATIONS.findIndex((a) => a.id === activeId) + 1} of 6</p>
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
    </section>);

}