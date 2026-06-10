import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MessageSquare, Calendar, Star, RefreshCw, Zap, CheckCircle, Clock, ArrowRight } from "lucide-react";

const WORKFLOWS = [
  {
    id: "missed_call",
    icon: Phone,
    label: "Missed Call Recovery",
    color: "#00AEEF",
    bg: "rgba(0,174,239,0.08)",
    border: "rgba(0,174,239,0.22)",
    scenario: "Roofing company misses a call at 6:47 PM",
    steps: [
      { time: "0s", from: "system", text: "Missed call detected from (602) 555-0182", type: "event" },
      { time: "12s", from: "ai", text: "Hey! Sorry we missed your call — we're wrapping up a job. I'm Jordan with Desert Roofing. What can we help you with?", type: "sms" },
      { time: "2m", from: "lead", text: "Hi yes my roof is leaking after the storm last night, pretty urgent", type: "sms" },
      { time: "2m 14s", from: "ai", text: "Totally understand — storm damage is stressful. We have emergency slots tomorrow morning. Can I get you booked for a free inspection?", type: "sms" },
      { time: "3m", from: "lead", text: "Yes please, 8am works", type: "sms" },
      { time: "3m 8s", from: "system", text: "Appointment booked — 8:00 AM inspection. Admin notified.", type: "event" },
    ],
  },
  {
    id: "lead_followup",
    icon: MessageSquare,
    label: "AI Lead Follow-Up",
    color: "#006BB0",
    bg: "rgba(0,107,176,0.08)",
    border: "rgba(0,107,176,0.22)",
    scenario: "New form submission from med spa website",
    steps: [
      { time: "0s", from: "system", text: "New lead: Sarah M. — interested in 'Botox consultation'", type: "event" },
      { time: "45s", from: "ai", text: "Hi Sarah! Thanks for reaching out to Luxe Med Spa. I'd love to get you set up for a complimentary Botox consultation. Do mornings or afternoons work better for you?", type: "email" },
      { time: "4h", from: "system", text: "No reply — follow-up sequence triggered", type: "event" },
      { time: "4h 5m", from: "ai", text: "Hey Sarah — just following up! Our consultations fill up fast. We have openings this Thursday & Friday. Want me to hold a spot?", type: "sms" },
      { time: "4h 22m", from: "lead", text: "Friday at 2pm would be perfect!", type: "sms" },
      { time: "4h 23m", from: "system", text: "Lead status → Booked. Confirmation email sent.", type: "event" },
    ],
  },
  {
    id: "booking",
    icon: Calendar,
    label: "Appointment Booking",
    color: "#0052A5",
    bg: "rgba(0,82,165,0.08)",
    border: "rgba(0,82,165,0.22)",
    scenario: "HVAC company booking an emergency service call",
    steps: [
      { time: "0s", from: "lead", text: "My AC stopped working, it's 108 degrees outside, I need someone today", type: "sms" },
      { time: "8s", from: "ai", text: "Oh no — that's an emergency in this heat! I'm checking our emergency slots right now...", type: "sms" },
      { time: "22s", from: "ai", text: "Great news — we have a tech available at 1:30 PM today. Can I get your address to confirm?", type: "sms" },
      { time: "1m", from: "lead", text: "4821 W Cactus Rd, Phoenix", type: "sms" },
      { time: "1m 12s", from: "ai", text: "Confirmed! Tech arrives 1:30 PM. You'll get a text when they're 30 min away. Anything else I should tell the tech?", type: "sms" },
      { time: "1m 40s", from: "system", text: "Job scheduled. Tech notified. Reminder set for 1:00 PM.", type: "event" },
    ],
  },
  {
    id: "review",
    icon: Star,
    label: "Review Requests",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.22)",
    scenario: "Dental practice requesting a review post-visit",
    steps: [
      { time: "0s", from: "system", text: "Appointment completed: Mark T. — cleaning & whitening", type: "event" },
      { time: "2h", from: "ai", text: "Hi Mark! Hope your smile is feeling great after today's visit. Dr. Chen and the team would really appreciate a quick Google review — it takes 30 seconds and helps other families find us! 😊", type: "sms" },
      { time: "2h 18m", from: "lead", text: "Of course, happy to!", type: "sms" },
      { time: "2h 19m", from: "ai", text: "You're amazing, thank you! Here's the direct link: g.page/sunrisedental/review ⭐", type: "sms" },
      { time: "2h 45m", from: "system", text: "5-star review posted on Google. Review count: 127 → 128", type: "event" },
    ],
  },
  {
    id: "reactivation",
    icon: RefreshCw,
    label: "Lead Reactivation",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.22)",
    scenario: "Reactivating a 90-day cold chiropractic lead",
    steps: [
      { time: "0s", from: "system", text: "Dormant lead identified: Tom R. — last contact 91 days ago, never booked", type: "event" },
      { time: "9:02 AM", from: "ai", text: "Hey Tom — it's been a while since you reached out about back pain. Wanted to check in: how are you feeling? We're running a new patient special this month.", type: "sms" },
      { time: "9:31 AM", from: "lead", text: "Honestly still struggling, I just kept putting it off", type: "sms" },
      { time: "9:31 AM", from: "ai", text: "Totally get it — let's finally get you in. I can book you for a free consultation + assessment, no commitment. Tuesday or Wednesday work?", type: "sms" },
      { time: "9:48 AM", from: "lead", text: "Tuesday at 4pm works", type: "sms" },
      { time: "9:49 AM", from: "system", text: "Cold lead reactivated → Booked. Revenue recovered: $180 new patient value.", type: "event" },
    ],
  },
];

function StepBubble({ step, index, isVisible }) {
  const isEvent = step.type === "event";
  const isLead = step.from === "lead";
  const isAI = step.from === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.35, delay: index * 0.18, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "flex",
        flexDirection: isLead ? "row-reverse" : "row",
        alignItems: "flex-start",
        gap: "8px",
        marginBottom: "10px",
        justifyContent: isEvent ? "center" : undefined,
      }}
    >
      {isEvent ? (
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "999px", padding: "4px 12px", fontSize: "11px",
          color: "rgba(255,255,255,0.55)", fontWeight: 600,
        }}>
          <Zap size={10} style={{ color: "#00AEEF" }} />
          {step.text}
          <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: "4px" }}>{step.time}</span>
        </div>
      ) : (
        <>
          {isAI && (
            <div style={{
              width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0, marginTop: "2px",
              background: "linear-gradient(135deg, #00AEEF, #006BB0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10px", fontWeight: 800, color: "#fff",
            }}>AI</div>
          )}
          <div style={{ maxWidth: "76%" }}>
            <div style={{
              borderRadius: isLead ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "8px 13px",
              background: isLead ? "rgba(255,255,255,0.12)" : "rgba(0,174,239,0.18)",
              border: isLead ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,174,239,0.3)",
              fontSize: "12px", lineHeight: 1.5,
              color: isLead ? "rgba(255,255,255,0.85)" : "#e0f4ff",
            }}>
              {step.type === "email" && (
                <span style={{ display: "block", fontSize: "9px", fontWeight: 700, color: "#00AEEF", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</span>
              )}
              {step.text}
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "3px", textAlign: isLead ? "right" : "left", paddingLeft: isAI ? "4px" : 0, paddingRight: isLead ? "4px" : 0 }}>
              {step.time}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default function AutomationShowcase() {
  const [activeId, setActiveId] = useState("missed_call");
  const active = WORKFLOWS.find(w => w.id === activeId);
  const Icon = active.icon;

  return (
    <section
      id="automation-showcase"
      style={{
        padding: "clamp(4rem, 8vw, 6rem) clamp(1.5rem, 5vw, 4rem)",
        background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(210,60%,97%) 50%, hsl(var(--background)) 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div aria-hidden="true" style={{
        position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
        width: "80%", height: "60%", borderRadius: "999px",
        background: "radial-gradient(ellipse at center, rgba(0,174,239,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(2rem, 4vw, 3rem)" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(0,174,239,0.1)", border: "1px solid rgba(0,174,239,0.25)",
            borderRadius: "999px", padding: "5px 14px", fontSize: "12px",
            fontWeight: 700, color: "#006BB0", letterSpacing: "0.07em", textTransform: "uppercase",
            marginBottom: "16px",
          }}>
            <Zap size={12} /> Live Workflow Demos
          </span>
          <h2 style={{
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, lineHeight: 1.1,
            color: "hsl(var(--foreground))", marginBottom: "14px",
            fontFamily: "var(--font-display)",
          }}>
            See Exactly How the AI Handles{" "}
            <span style={{ color: "#006BB0" }}>Real Conversations</span>
          </h2>
          <p style={{ fontSize: "clamp(0.95rem, 2vw, 1.05rem)", color: "hsl(var(--muted-foreground))", maxWidth: "560px", margin: "0 auto" }}>
            These are actual conversation flows — not mockups. This is how the system responds the moment a lead comes in.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "2rem",
        }}>
          {WORKFLOWS.map(w => {
            const WIcon = w.icon;
            const isActive = w.id === activeId;
            return (
              <button
                key={w.id}
                onClick={() => setActiveId(w.id)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "7px",
                  padding: "9px 18px", borderRadius: "999px", cursor: "pointer",
                  fontSize: "13px", fontWeight: 700, transition: "all 180ms ease",
                  border: isActive ? `1.5px solid ${w.color}` : "1.5px solid hsl(var(--border))",
                  background: isActive ? w.bg : "transparent",
                  color: isActive ? w.color : "hsl(var(--muted-foreground))",
                  boxShadow: isActive ? `0 0 18px ${w.color}22` : "none",
                }}
              >
                <WIcon size={14} />
                {w.label}
              </button>
            );
          })}
        </div>

        {/* Main demo panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "clamp(1rem, 3vw, 2rem)",
              alignItems: "start",
            }}
          >
            {/* Left: context + outcome */}
            <div style={{
              background: "hsl(var(--card))", borderRadius: "20px",
              border: "1px solid hsl(var(--border))", padding: "clamp(1.5rem, 3vw, 2rem)",
            }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "14px",
                background: active.bg, border: `1px solid ${active.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
              }}>
                <Icon size={22} style={{ color: active.color }} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "hsl(var(--foreground))", marginBottom: "8px" }}>
                {active.label}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", marginBottom: "20px", lineHeight: 1.6 }}>
                <strong style={{ color: "hsl(var(--foreground))" }}>Scenario:</strong> {active.scenario}
              </p>

              <div style={{ borderTop: "1px solid hsl(var(--border))", paddingTop: "20px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>What Happens</p>
                {[
                  "Lead detected instantly — no manual checking",
                  "AI responds within seconds, 24/7",
                  "Conversation handled until booking confirmed",
                  "Admin notified with full context",
                ].map((point, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "10px" }}>
                    <CheckCircle size={15} style={{ color: active.color, flexShrink: 0, marginTop: "1px" }} />
                    <span style={{ fontSize: "13px", color: "hsl(var(--foreground))", lineHeight: 1.5 }}>{point}</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: "20px", padding: "14px 16px", borderRadius: "12px",
                background: active.bg, border: `1px solid ${active.border}`,
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <Clock size={14} style={{ color: active.color, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: active.color }}>
                  Average response time: <strong>8–45 seconds</strong>, even at 2am
                </span>
              </div>

              <a
                href="/book"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "20px",
                  padding: "11px 22px", borderRadius: "999px", textDecoration: "none",
                  background: `linear-gradient(135deg, ${active.color}, #006BB0)`,
                  color: "#fff", fontSize: "13px", fontWeight: 700,
                  boxShadow: `0 4px 16px ${active.color}33`,
                }}
              >
                Get This System Built For You <ArrowRight size={14} />
              </a>
            </div>

            {/* Right: phone/chat mockup */}
            <div style={{
              borderRadius: "24px", overflow: "hidden",
              background: "linear-gradient(160deg, #0d1f3c 0%, #071535 60%, #04101f 100%)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)",
              padding: "0",
              minHeight: "420px",
            }}>
              {/* Mock phone top bar */}
              <div style={{
                background: "rgba(0,0,0,0.4)", padding: "12px 18px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>AI SYSTEM — LIVE</span>
                </div>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>{active.label}</span>
              </div>

              {/* Scenario badge */}
              <div style={{ padding: "12px 18px 0" }}>
                <div style={{
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px", padding: "8px 12px", fontSize: "11px",
                  color: "rgba(255,255,255,0.5)", lineHeight: 1.4,
                }}>
                  <span style={{ color: active.color, fontWeight: 700 }}>Trigger: </span>{active.scenario}
                </div>
              </div>

              {/* Chat messages */}
              <div style={{ padding: "16px 18px 20px" }}>
                {active.steps.map((step, i) => (
                  <StepBubble key={i} step={step} index={i} isVisible={true} />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom trust note */}
        <p style={{
          textAlign: "center", marginTop: "2rem", fontSize: "13px",
          color: "hsl(var(--muted-foreground))",
        }}>
          All workflows are installed and configured for your business — not templates you have to set up yourself.
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #automation-showcase > div > div:last-of-type > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}