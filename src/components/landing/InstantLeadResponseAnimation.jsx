import { useEffect, useRef, useState } from "react";
import { Zap, CheckCircle2, TrendingUp, Calendar, Mail, MessageSquare } from "lucide-react";

const STEPS = [
  {
    id: "trigger",
    number: "01",
    label: "Lead Arrives",
    title: "New lead submits your form.",
    description: "A prospect fills out your contact form, ad landing page, or website — any time, day or night.",
    color: "#8b5cf6",
    bgColor: "rgba(139,92,246,0.08)",
    borderColor: "rgba(139,92,246,0.3)",
  },
  {
    id: "detect",
    number: "02",
    label: "AI Qualifies",
    title: "System scores & classifies instantly.",
    description: "AI reads the submission, scores the lead 0–100, and identifies buying intent in under a second.",
    color: "#0ea5e9",
    bgColor: "rgba(14,165,233,0.08)",
    borderColor: "rgba(14,165,233,0.3)",
  },
  {
    id: "action",
    number: "03",
    label: "Response Sent",
    title: "Personalized SMS + email in 5 seconds.",
    description: "A tailored message fires instantly — name, service interest, and booking link included.",
    color: "#0088CC",
    bgColor: "rgba(0,136,204,0.08)",
    borderColor: "rgba(0,136,204,0.3)",
  },
  {
    id: "result",
    number: "04",
    label: "Lead Booked",
    title: "Prospect responds and books.",
    description: "Because you replied in seconds — not hours — the lead stays warm and converts.",
    color: "#22c55e",
    bgColor: "rgba(34,197,94,0.08)",
    borderColor: "rgba(34,197,94,0.3)",
  },
];

// ── Phone Screen ─────────────────────────────────────────────────────────────
function PhoneScreen({ step, smsVisible }) {
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

      <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #1c1c1e 0%, #000 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 12px" }}>

        {/* Step 0 — form submission */}
        {step === 0 && (
          <div style={{ textAlign: "center", width: "100%" }}>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>New Lead Form</div>
            <div style={{
              background: "rgba(255,255,255,0.06)", borderRadius: "10px",
              padding: "10px", width: "100%", textAlign: "left",
              animation: "fadeInUp 0.5s ease-out",
            }}>
              <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.35)", marginBottom: "6px" }}>Contact Form Submitted</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", color: "#fff", fontWeight: "800" }}>S</div>
                <div>
                  <div style={{ fontSize: "9px", color: "#fff", fontWeight: "700" }}>Sarah Mitchell</div>
                  <div style={{ fontSize: "7px", color: "rgba(255,255,255,0.4)" }}>Med Spa · Botox</div>
                </div>
              </div>
              <div style={{ fontSize: "7px", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                "Interested in Botox pricing — looking to book soon"
              </div>
            </div>
            <div style={{ marginTop: "10px", display: "flex", justifyContent: "center" }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#8b5cf6", animation: "pingPulse 1.5s ease-in-out infinite",
              }} />
            </div>
          </div>
        )}

        {/* Step 1 — AI scoring */}
        {step === 1 && (
          <div style={{ textAlign: "center", width: "100%" }}>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>AI Analysis</div>
            <div style={{
              background: "rgba(14,165,233,0.1)", borderRadius: "10px",
              border: "1px solid rgba(14,165,233,0.25)", padding: "10px",
              animation: "fadeInUp 0.4s ease-out",
            }}>
              <div style={{ fontSize: "8px", color: "#0ea5e9", fontWeight: "700", marginBottom: "6px" }}>SCORING LEAD...</div>
              {/* Score bar */}
              <div style={{ marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "7px", color: "rgba(255,255,255,0.5)" }}>Lead Score</span>
                  <span style={{ fontSize: "8px", color: "#22c55e", fontWeight: "800" }}>87</span>
                </div>
                <div style={{ height: "4px", borderRadius: "9999px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "87%", borderRadius: "9999px", background: "linear-gradient(90deg,#0ea5e9,#22c55e)", animation: "growBar 0.8s ease-out forwards" }} />
                </div>
              </div>
              {/* Tags */}
              <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                {["HOT LEAD", "HIGH INTENT", "BOTOX"].map(tag => (
                  <span key={tag} style={{ fontSize: "6px", fontWeight: "800", background: "rgba(14,165,233,0.2)", color: "#0ea5e9", padding: "2px 5px", borderRadius: "4px" }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — SMS sent */}
        {step === 2 && (
          <div style={{ width: "100%", padding: "0 4px" }}>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: "8px" }}>Messages · ABC Med Spa</div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{
                background: "linear-gradient(135deg,#7c3aed,#4c1d95)",
                borderRadius: "12px 12px 2px 12px",
                padding: "8px 9px", maxWidth: "88%",
                opacity: smsVisible ? 1 : 0,
                animation: smsVisible ? "slideInRight 0.4s ease-out" : "none",
              }}>
                <div style={{ fontSize: "7px", color: "rgba(255,255,255,0.6)", marginBottom: "3px" }}>ABC Med Spa</div>
                <div style={{ fontSize: "8px", color: "#ffffff", lineHeight: 1.4 }}>
                  Hi Sarah! 👋 Thanks for reaching out about Botox. I'd love to help — grab a free consultation spot here:
                </div>
                <div style={{ marginTop: "5px" }}>
                  <div style={{ fontSize: "7px", background: "rgba(255,255,255,0.2)", borderRadius: "6px", padding: "3px 6px", color: "#fff", textAlign: "center" }}>
                    Book Free Consult →
                  </div>
                </div>
              </div>
            </div>
            {!smsVisible && (
              <div style={{ display: "flex", gap: "3px", justifyContent: "flex-end", marginTop: "6px" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#8b5cf6", animation: `dot 1s ${i * 0.15}s infinite` }} />
                ))}
              </div>
            )}
            {/* Email indicator */}
            {smsVisible && (
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "5px", animation: "fadeInUp 0.4s 0.3s ease-out both" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "6px", background: "rgba(139,92,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Mail style={{ width: "10px", height: "10px", color: "#8b5cf6" }} />
                </div>
                <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.55)" }}>Email confirmation sent ✓</div>
              </div>
            )}
          </div>
        )}

        {/* Step 3 — booked */}
        {step === 3 && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 10px",
            }}>
              <CheckCircle2 style={{ width: "24px", height: "24px", color: "#22c55e" }} />
            </div>
            <div style={{ fontSize: "10px", color: "#22c55e", fontWeight: "700" }}>CONSULTATION BOOKED!</div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", marginTop: "6px", lineHeight: 1.4 }}>
              Sarah replied in 4 min & booked a free Botox consult
            </div>
            <div style={{ marginTop: "10px", fontSize: "8px", color: "rgba(34,197,94,0.7)", background: "rgba(34,197,94,0.08)", borderRadius: "6px", padding: "4px 8px" }}>
              Lead responded in 4 minutes
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function InstantLeadResponseAnimation() {
  const [activeStep, setActiveStep] = useState(0);
  const [smsVisible, setSmsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const sectionRef = useRef(null);

  const runAnimation = () => {
    setIsPlaying(true);
    setHasStarted(true);
    setActiveStep(0);
    setSmsVisible(false);

    setTimeout(() => setActiveStep(1), 1800);
    setTimeout(() => setActiveStep(2), 3600);
    setTimeout(() => setSmsVisible(true), 4400);
    setTimeout(() => setActiveStep(3), 6200);
    setTimeout(() => setIsPlaying(false), 7500);
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
      const loop = setTimeout(runAnimation, 3000);
      return () => clearTimeout(loop);
    }
  }, [isPlaying, hasStarted]);

  return (
    <section ref={sectionRef} style={{ background: "#ffffff", padding: "80px 24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "9999px", padding: "4px 14px", marginBottom: "16px" }}>
            <Zap style={{ width: "12px", height: "12px", color: "#8b5cf6" }} />
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.15em" }}>Instant Lead Response</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: "800", color: "#0A1628", margin: "0 0 12px", lineHeight: 1.15 }}>
            The first business to respond<br />
            <span style={{ background: "linear-gradient(135deg,#8b5cf6,#0088CC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              wins the customer. Every time.
            </span>
          </h2>
          <p style={{ fontSize: "16px", color: "rgba(10,22,40,0.55)", maxWidth: "520px", margin: "0 auto", lineHeight: 1.6 }}>
            Watch how a new lead goes from form submission to booked appointment — fully automated, in under 5 seconds.
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

          {/* Steps list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {STEPS.map((step, idx) => (
              <div
                key={step.id}
                onClick={() => { setActiveStep(idx); if (idx === 2) setSmsVisible(true); }}
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
            <PhoneScreen step={activeStep} smsVisible={smsVisible} />
            <button
              onClick={runAnimation}
              disabled={isPlaying}
              style={{
                padding: "8px 20px", borderRadius: "9999px",
                background: isPlaying ? "rgba(139,92,246,0.1)" : "linear-gradient(135deg,#8b5cf6,#6d28d9)",
                border: "none", color: isPlaying ? "#8b5cf6" : "#fff",
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
                { IconComp: Zap, color: "#8b5cf6", label: "Lead Captured", sub: "Every form submission tracked" },
                { IconComp: MessageSquare, color: "#0088CC", label: "Instant Response", sub: "SMS + email follow-up path" },
                { IconComp: Calendar, color: "#0ea5e9", label: "Appointment Booked", sub: "While they're still engaged" },
                { IconComp: TrendingUp, color: "#22c55e", label: "Booking Path", sub: "Tracked from inquiry to handoff" },
              ].map(({ IconComp, color, label, sub }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", opacity: activeStep === 3 ? 1 : 0.3, transition: "opacity 0.5s ease" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <IconComp style={{ width: "14px", height: "14px", color }} />
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
                { value: "Fast", label: "Response path" },
                { value: "Proof", label: "Before go-live" },
                { value: "24/7", label: "Always on" },
                { value: "0", label: "Staff needed" },
              ].map(({ value, label }) => (
                <div key={label} style={{
                  padding: "14px 12px", borderRadius: "12px",
                  background: "#fafafa", border: "1.5px solid rgba(0,0,0,0.07)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#8b5cf6", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: "10px", color: "rgba(10,22,40,0.45)", marginTop: "3px" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom trust bar */}
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap", paddingTop: "32px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {[
            { icon: "⚡", text: "Prompt response workflow" },
            { icon: "🧠", text: "AI-personalized for every lead" },
            { icon: "📈", text: "Performance reviewed after launch" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>{icon}</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "rgba(10,22,40,0.6)" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pingPulse { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,0.5)} 50%{box-shadow:0 0 0 10px rgba(139,92,246,0)} }
        @keyframes growBar { from{width:0} to{width:87%} }
        @keyframes dot { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-4px);opacity:1} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      ` }} />
    </section>
  );
}
