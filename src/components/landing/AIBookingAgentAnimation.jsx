import { useEffect, useRef, useState } from "react";
import { Bot, CheckCircle2, Calendar, MessageSquare, Clock, Sparkles, Phone } from "lucide-react";

const STEPS = [
  {
    id: "inquiry",
    number: "01",
    label: "Lead Asks",
    title: "Prospect asks about availability.",
    description: "A lead texts or messages asking about booking — any time of day, even at 2am on a Sunday.",
    color: "#f59e0b",
    bgColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.3)",
  },
  {
    id: "qualify",
    number: "02",
    label: "AI Qualifies",
    title: "AI asks smart qualifying questions.",
    description: "The agent gathers service interest, timing, and budget — just like your best receptionist would.",
    color: "#0ea5e9",
    bgColor: "rgba(14,165,233,0.08)",
    borderColor: "rgba(14,165,233,0.3)",
  },
  {
    id: "book",
    number: "03",
    label: "Slot Offered",
    title: "Available times presented instantly.",
    description: "The AI checks your calendar and presents real openings — no back-and-forth, no phone tag.",
    color: "#8b5cf6",
    bgColor: "rgba(139,92,246,0.08)",
    borderColor: "rgba(139,92,246,0.3)",
  },
  {
    id: "confirmed",
    number: "04",
    label: "Booked & Confirmed",
    title: "Appointment locked in automatically.",
    description: "Calendar invite sent, reminder scheduled, and your CRM updated — zero manual work.",
    color: "#22c55e",
    bgColor: "rgba(34,197,94,0.08)",
    borderColor: "rgba(34,197,94,0.3)",
  },
];

const CONVERSATION = [
  { role: "lead",  text: "Hi! Do you have any appointments available this week for a consult?", delay: 0 },
  { role: "agent", text: "Hi! 👋 Of course! What service are you interested in, and are mornings or afternoons better for you?", delay: 1400 },
  { role: "lead",  text: "Botox. Afternoons are best.", delay: 2800 },
  { role: "agent", text: "Perfect! I have Tuesday at 2pm or Thursday at 3pm available. Which works for you?", delay: 4200 },
  { role: "lead",  text: "Tuesday at 2pm!", delay: 5400 },
  { role: "agent", text: "✅ Done! You're booked for Tuesday at 2pm. A confirmation + reminder will be sent to your phone.", delay: 6600 },
];

function PhoneScreen({ visibleMessages, step }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages]);

  return (
    <div style={{
      width: "180px",
      height: "320px",
      borderRadius: "28px",
      background: "#0a0a0a",
      border: "6px solid #1a1a1a",
      boxShadow: "0 24px 60px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.06)",
      position: "relative",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {/* Notch */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60px", height: "18px", background: "#0a0a0a", borderRadius: "0 0 12px 12px", zIndex: 10 }} />

      <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #1c1c1e 0%, #000 100%)", display: "flex", flexDirection: "column" }}>

        {/* Chat header */}
        <div style={{ padding: "22px 10px 8px", display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{
            width: "22px", height: "22px", borderRadius: "50%",
            background: "linear-gradient(135deg,#f59e0b,#d97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Bot style={{ width: "11px", height: "11px", color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: "9px", fontWeight: "700", color: "#fff" }}>AI Booking Agent</div>
            <div style={{ fontSize: "7px", color: "#22c55e", display: "flex", alignItems: "center", gap: "2px" }}>
              <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              Online · Always active
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {CONVERSATION.slice(0, visibleMessages).map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "lead" ? "flex-end" : "flex-start",
                animation: "fadeInUp 0.3s ease-out",
              }}
            >
              {msg.role === "agent" && (
                <div style={{
                  width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0, marginRight: "4px", alignSelf: "flex-end",
                  background: "linear-gradient(135deg,#f59e0b,#d97706)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "7px",
                }}>🤖</div>
              )}
              <div style={{
                maxWidth: "76%", padding: "6px 8px", fontSize: "7.5px", lineHeight: 1.45,
                borderRadius: msg.role === "lead" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                background: msg.role === "lead"
                  ? "linear-gradient(135deg,#0069C0,#003B8F)"
                  : "rgba(255,255,255,0.08)",
                color: msg.role === "lead" ? "#fff" : "rgba(255,255,255,0.85)",
                border: msg.role === "agent" ? "1px solid rgba(245,158,11,0.2)" : "none",
              }}>
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {visibleMessages < CONVERSATION.length && visibleMessages % 2 === 1 && (
            <div style={{ display: "flex", justifyContent: "flex-start", gap: "3px", paddingLeft: "20px" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#f59e0b", animation: `dot 1s ${i * 0.15}s infinite` }} />
              ))}
            </div>
          )}

          {/* Booked confirmation card */}
          {step === 3 && (
            <div style={{
              margin: "4px 0",
              padding: "8px", borderRadius: "10px",
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
              animation: "fadeInUp 0.4s ease-out",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                <CheckCircle2 style={{ width: "10px", height: "10px", color: "#22c55e" }} />
                <span style={{ fontSize: "8px", fontWeight: "800", color: "#22c55e" }}>CONFIRMED</span>
              </div>
              <div style={{ fontSize: "7px", color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
                📅 Tuesday, 2:00 PM<br />
                💉 Botox Consultation<br />
                📲 Reminder scheduled
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

export default function AIBookingAgentAnimation() {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const sectionRef = useRef(null);
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const runAnimation = () => {
    clearTimers();
    setIsPlaying(true);
    setHasStarted(true);
    setActiveStep(0);
    setVisibleMessages(0);

    // Step 0: show first message
    timersRef.current.push(setTimeout(() => setVisibleMessages(1), 600));
    // Step 1: AI responds
    timersRef.current.push(setTimeout(() => { setActiveStep(1); setVisibleMessages(2); }, 1800));
    // Lead replies
    timersRef.current.push(setTimeout(() => setVisibleMessages(3), 3200));
    // Step 2: slots offered
    timersRef.current.push(setTimeout(() => { setActiveStep(2); setVisibleMessages(4); }, 4600));
    // Lead picks
    timersRef.current.push(setTimeout(() => setVisibleMessages(5), 5800));
    // Step 3: confirmed
    timersRef.current.push(setTimeout(() => { setActiveStep(3); setVisibleMessages(6); }, 7000));
    timersRef.current.push(setTimeout(() => setIsPlaying(false), 8500));
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !hasStarted) runAnimation(); },
      { threshold: 0.4 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!isPlaying && hasStarted) {
      const loop = setTimeout(runAnimation, 3500);
      return () => clearTimeout(loop);
    }
  }, [isPlaying, hasStarted]);

  useEffect(() => () => clearTimers(), []);

  return (
    <section ref={sectionRef} style={{ background: "#ffffff", padding: "80px 24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "9999px", padding: "4px 14px", marginBottom: "16px" }}>
            <Bot style={{ width: "12px", height: "12px", color: "#f59e0b" }} />
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#d97706", textTransform: "uppercase", letterSpacing: "0.15em" }}>AI Booking Agent</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: "800", color: "#0A1628", margin: "0 0 12px", lineHeight: 1.15 }}>
            Your AI receptionist books<br />
            <span style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              appointments while you sleep.
            </span>
          </h2>
          <p style={{ fontSize: "16px", color: "rgba(10,22,40,0.55)", maxWidth: "520px", margin: "0 auto", lineHeight: 1.6 }}>
            Watch the AI qualify a lead, check availability, and lock in a confirmed appointment — entirely on autopilot.
          </p>
        </div>

        {/* Main grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: "32px",
          alignItems: "center",
          marginBottom: "48px",
        }}>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {STEPS.map((step, idx) => (
              <div
                key={step.id}
                onClick={() => setActiveStep(idx)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "14px",
                  padding: "16px 18px",
                  borderRadius: "16px",
                  border: `1.5px solid ${activeStep === idx ? step.borderColor : "rgba(0,0,0,0.07)"}`,
                  background: activeStep === idx ? step.bgColor : "#fafafa",
                  cursor: "pointer",
                  transition: "all 0.4s ease",
                  transform: activeStep === idx ? "translateX(4px)" : "translateX(0)",
                  boxShadow: activeStep === idx ? `0 4px 20px ${step.color}18` : "none",
                }}
              >
                <div style={{
                  width: "32px", height: "32px", borderRadius: "10px", flexShrink: 0,
                  background: activeStep === idx ? step.color : "rgba(0,0,0,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.3s ease",
                }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: activeStep === idx ? "#fff" : "rgba(0,0,0,0.3)" }}>{step.number}</span>
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: activeStep === idx ? step.color : "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "2px" }}>{step.label}</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: activeStep === idx ? "#0A1628" : "rgba(10,22,40,0.45)", marginBottom: "3px", transition: "color 0.3s" }}>{step.title}</div>
                  <div style={{ fontSize: "12px", color: activeStep === idx ? "rgba(10,22,40,0.6)" : "rgba(10,22,40,0.3)", lineHeight: 1.4, transition: "color 0.3s" }}>{step.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Phone */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
            <PhoneScreen visibleMessages={visibleMessages} step={activeStep} />
            <button
              onClick={runAnimation}
              disabled={isPlaying}
              style={{
                padding: "8px 20px", borderRadius: "9999px",
                background: isPlaying ? "rgba(245,158,11,0.1)" : "linear-gradient(135deg,#f59e0b,#d97706)",
                border: "none", color: isPlaying ? "#d97706" : "#fff",
                fontSize: "12px", fontWeight: "700", cursor: isPlaying ? "default" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {isPlaying ? "Playing…" : "▶  Replay"}
            </button>
          </div>

          {/* Results panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{
              padding: "20px",
              borderRadius: "16px",
              background: activeStep === 3 ? "rgba(34,197,94,0.06)" : "#fafafa",
              border: `1.5px solid ${activeStep === 3 ? "rgba(34,197,94,0.3)" : "rgba(0,0,0,0.07)"}`,
              transition: "all 0.5s ease",
            }}>
              <p style={{ fontSize: "10px", fontWeight: "700", color: activeStep === 3 ? "#16a34a" : "rgba(0,0,0,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 14px" }}>What you gain</p>
              {[
                { emoji: "🤖", color: "#f59e0b", label: "24/7 Booking Coverage", sub: "Never miss an after-hours inquiry" },
                { emoji: "✅", color: "#22c55e", label: "Zero Phone Tag", sub: "AI handles the back-and-forth" },
                { emoji: "📅", color: "#0ea5e9", label: "Calendar Auto-Updated", sub: "No manual scheduling needed" },
                { emoji: "💰", color: "#8b5cf6", label: "Revenue Recovered", sub: "Leads that would have gone cold" },
              ].map(({ emoji, color, label, sub }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", opacity: activeStep === 3 ? 1 : 0.3, transition: "opacity 0.5s ease" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "14px" }}>
                    {emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628" }}>{label}</div>
                    <div style={{ fontSize: "11px", color: "rgba(10,22,40,0.45)" }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { value: "24/7", label: "Always books" },
                { value: "3×", label: "More conversions" },
                { value: "< 60s", label: "Avg response" },
                { value: "0", label: "Staff needed" },
              ].map(({ value, label }) => (
                <div key={label} style={{
                  padding: "14px 12px", borderRadius: "12px",
                  background: "#fafafa", border: "1.5px solid rgba(0,0,0,0.07)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#d97706", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: "10px", color: "rgba(10,22,40,0.45)", marginTop: "3px" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap", paddingTop: "32px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {[
            { icon: "🤖", text: "Conversational AI — not a basic chatbot" },
            { icon: "📅", text: "Syncs with your existing calendar" },
            { icon: "🌙", text: "Books appointments at 2am if needed" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>{icon}</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "rgba(10,22,40,0.6)" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dot { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-4px);opacity:1} }
      ` }} />
    </section>
  );
}