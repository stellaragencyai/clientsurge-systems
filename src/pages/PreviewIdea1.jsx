import { useEffect, useRef, useState } from "react";
import { CalendarCheck, HeadphonesIcon, LayoutDashboard, MessageSquare, PhoneCall, RotateCcw, Send, Zap } from "lucide-react";

const stages = [
  { id: "lead-in", icon: Zap, eyebrow: "Trigger", title: "Lead comes in", copy: "A call, form, ad lead, or direct inquiry enters the system and gets captured immediately — nothing slips through the cracks." },
  { id: "instant-response", icon: MessageSquare, eyebrow: "Speed", title: "Instant response", copy: "The system replies within seconds so you show up first while the lead's intent is still at its peak." },
  { id: "missed-call", icon: PhoneCall, eyebrow: "Coverage", title: "Missed-call recovery", copy: "If nobody answers, a text-back fires immediately to keep the conversation alive before they call a competitor." },
  { id: "follow-up", icon: Send, eyebrow: "Nurture", title: "Follow-up runs", copy: "Automated sequences keep warm leads moving over 14 days until they reply, book, or clearly go cold." },
  { id: "booking", icon: CalendarCheck, eyebrow: "Conversion", title: "Booking handoff", copy: "Ready leads move into a frictionless booking path — fewer drop-offs, more confirmed appointments." },
  { id: "crm", icon: LayoutDashboard, eyebrow: "Visibility", title: "Pipeline updates", copy: "Statuses, tags, and handoffs stay organized automatically so your team always knows where every lead stands." },
  { id: "reactivation", icon: RotateCcw, eyebrow: "Recovery", title: "Old leads return", copy: "Dormant contacts get reactivated with proven campaigns — turning forgotten leads into fresh revenue." },
  { id: "optimization", icon: HeadphonesIcon, eyebrow: "Support", title: "System improves", copy: "Performance is reviewed and tuned after launch so the automation keeps getting stronger over time." },
];

const STAGE_DURATION = 3000;

export default function PreviewIdea1() {
  const [activeStage, setActiveStage] = useState(0);
  const [contentVisible, setContentVisible] = useState(true);
  const [contentKey, setContentKey] = useState(0);

  const advanceTo = (index) => {
    setContentVisible(false);
    setTimeout(() => {
      setActiveStage(index);
      setContentKey((k) => k + 1);
      setContentVisible(true);
    }, 340);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      advanceTo((activeStage + 1) % stages.length);
    }, STAGE_DURATION);
    return () => clearInterval(interval);
  }, [activeStage]);

  const active = stages[activeStage];
  const ActiveIcon = active.icon;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fdfcfa 0%, #f8f4ee 100%)", fontFamily: "var(--font-inter, Inter, sans-serif)", padding: "60px 40px" }}>

      {/* Label */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <span style={{ display: "inline-block", background: "linear-gradient(135deg, #6b3f1f, #9a5c2e)", color: "#f5d9a8", fontSize: "11px", fontWeight: "700", letterSpacing: "0.18em", textTransform: "uppercase", padding: "6px 18px", borderRadius: "9999px", marginBottom: "16px" }}>
          Preview — Idea 1: Vertical Split Layout
        </span>
        <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: "800", color: "#1a1209", margin: "0 0 8px" }}>
          See the Full <span style={{ color: "#9a5c2e" }}>System</span> in Motion
        </h1>
        <p style={{ color: "rgba(26,18,9,0.5)", fontSize: "15px" }}>Vertical timeline left · Live content panel right</p>
      </div>

      {/* Two-column layout */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "280px 1fr", gap: "32px", alignItems: "start" }}>

        {/* LEFT — Vertical timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = activeStage === index;
            const isPast = index < activeStage;
            return (
              <button
                key={stage.id}
                onClick={() => advanceTo(index)}
                style={{ display: "flex", alignItems: "center", gap: "16px", padding: "10px 16px", borderRadius: "14px", border: "none", cursor: "pointer", textAlign: "left", position: "relative", background: isActive ? "linear-gradient(135deg, rgba(154,92,46,0.12) 0%, rgba(200,150,92,0.08) 100%)" : "transparent", transition: "background 0.3s ease" }}
              >
                {/* Vertical connector line */}
                {index < stages.length - 1 && (
                  <div style={{ position: "absolute", left: "30px", top: "52px", width: "2px", height: "32px", background: isPast || isActive ? "linear-gradient(to bottom, #c8965c, rgba(200,150,92,0.3))" : "rgba(154,92,46,0.12)", transition: "background 0.5s ease", zIndex: 0 }} />
                )}

                {/* Icon circle */}
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, background: isActive ? "linear-gradient(135deg, #7a4825, #c8965c)" : isPast ? "rgba(154,92,46,0.15)" : "rgba(255,255,255,0.9)", border: isActive ? "2px solid rgba(200,150,92,0.6)" : isPast ? "2px solid rgba(154,92,46,0.3)" : "1.5px solid rgba(154,92,46,0.18)", boxShadow: isActive ? "0 0 0 5px rgba(200,150,92,0.14), 0 6px 18px rgba(154,92,46,0.28)" : "0 2px 8px rgba(0,0,0,0.06)", transition: "all 0.4s ease" }}>
                  <Icon style={{ width: "18px", height: "18px", color: isActive ? "#fff5e0" : isPast ? "#9a5c2e" : "#c8965c" }} />
                </div>

                {/* Label */}
                <div>
                  <p style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.2em", color: isActive ? "#9a5c2e" : "rgba(90,60,30,0.4)", marginBottom: "2px", transition: "color 0.3s" }}>{stage.eyebrow}</p>
                  <p style={{ fontSize: "13px", fontWeight: isActive ? "700" : "500", color: isActive ? "#1a1209" : "rgba(26,18,9,0.5)", transition: "all 0.3s" }}>{stage.title}</p>
                </div>

                {/* Active indicator dot */}
                {isActive && (
                  <div style={{ marginLeft: "auto", width: "8px", height: "8px", borderRadius: "50%", background: "#c8965c", boxShadow: "0 0 10px rgba(200,150,92,0.7)", animation: "pulse 1.8s ease-in-out infinite" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* RIGHT — Detail panel */}
        <div style={{ position: "sticky", top: "40px" }}>
          {/* Step counter */}
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(154,92,46,0.6)", textTransform: "uppercase", letterSpacing: "0.2em" }}>Step {activeStage + 1} of {stages.length}</span>
            <div style={{ flex: 1, height: "3px", borderRadius: "9999px", background: "rgba(154,92,46,0.1)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${((activeStage + 1) / stages.length) * 100}%`, background: "linear-gradient(90deg, #7a4825, #c8965c)", borderRadius: "9999px", transition: `width ${STAGE_DURATION * 0.85}ms linear` }} />
            </div>
          </div>

          {/* Content card */}
          <div
            key={contentKey}
            style={{
              background: "linear-gradient(135deg, rgba(245,246,248,0.98) 0%, rgba(228,231,236,0.97) 100%)",
              border: "1.5px solid rgba(180,185,195,0.5)",
              boxShadow: "0 12px 48px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.85)",
              borderRadius: "20px",
              padding: "36px",
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 340ms ease, transform 340ms ease",
            }}
          >
            {/* Icon */}
            <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "linear-gradient(135deg, #7a4825, #c8965c)", boxShadow: "0 8px 24px rgba(154,92,46,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
              <ActiveIcon style={{ width: "28px", height: "28px", color: "#fff5e0" }} />
            </div>

            <p style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.28em", color: "#9a5c2e", marginBottom: "10px" }}>{active.eyebrow}</p>
            <h3 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: "800", color: "#1a1209", marginBottom: "16px", lineHeight: 1.2 }}>{active.title}</h3>
            <p style={{ fontSize: "16px", color: "rgba(26,18,9,0.62)", lineHeight: 1.75 }}>{active.copy}</p>

            {/* Nav arrows */}
            <div style={{ display: "flex", gap: "10px", marginTop: "32px" }}>
              <button onClick={() => advanceTo((activeStage - 1 + stages.length) % stages.length)} style={{ padding: "10px 20px", borderRadius: "9999px", border: "1.5px solid rgba(154,92,46,0.25)", background: "transparent", color: "#9a5c2e", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>← Prev</button>
              <button onClick={() => advanceTo((activeStage + 1) % stages.length)} style={{ padding: "10px 24px", borderRadius: "9999px", border: "none", background: "linear-gradient(135deg, #7a4825, #c8965c)", color: "#f5e6d0", fontWeight: "700", fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 14px rgba(154,92,46,0.3)" }}>Next →</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}