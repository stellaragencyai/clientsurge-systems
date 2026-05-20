import { useEffect, useRef, useState } from "react";
import { PhoneOff, Zap, CheckCircle2, TrendingUp, Calendar } from "lucide-react";

const STEPS = [
  {
    id: "trigger",
    number: "01",
    label: "Trigger",
    title: "Customer calls. You miss it.",
    description: "A potential customer calls your business but you're busy with another job.",
    color: "#ef4444",
    bgColor: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.3)",
  },
  {
    id: "detect",
    number: "02",
    label: "AI Detects",
    title: "System captures the number instantly.",
    description: "Our system detects the missed call and identifies the caller in under 1 second.",
    color: "#f59e0b",
    bgColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.3)",
  },
  {
    id: "action",
    number: "03",
    label: "Action",
    title: "Personalized SMS sent in 5 seconds.",
    description: "An automated text goes out immediately — personal, professional, and on-brand.",
    color: "#0088CC",
    bgColor: "rgba(0,136,204,0.08)",
    borderColor: "rgba(0,136,204,0.3)",
  },
  {
    id: "result",
    number: "04",
    label: "Result",
    title: "Lost call becomes a booked job.",
    description: "The lead replies, books, and revenue that would have been lost is recovered.",
    color: "#22c55e",
    bgColor: "rgba(34,197,94,0.08)",
    borderColor: "rgba(34,197,94,0.3)",
  },
];

function PhoneScreen({ step, smsVisible, typingDone }) {
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

      {/* Screen content */}
      <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #1c1c1e 0%, #000 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 12px" }}>

        {/* Step 1 — missed call */}
        {step === 0 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>ABC Plumbing</div>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "rgba(239,68,68,0.2)", border: "2px solid rgba(239,68,68,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 10px",
              animation: "phonePulse 1s ease-in-out infinite",
            }}>
              <PhoneOff style={{ width: "22px", height: "22px", color: "#ef4444" }} />
            </div>
            <div style={{ fontSize: "10px", color: "#ef4444", fontWeight: "700", letterSpacing: "0.05em" }}>MISSED CALL</div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Sarah M. · just now</div>
          </div>
        )}

        {/* Step 2 — detecting */}
        {step === 1 && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "rgba(245,158,11,0.15)", border: "2px solid rgba(245,158,11,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 10px",
            }}>
              <Zap style={{ width: "22px", height: "22px", color: "#f59e0b" }} />
            </div>
            <div style={{ fontSize: "10px", color: "#f59e0b", fontWeight: "700" }}>DETECTING</div>
            <div style={{ marginTop: "12px", display: "flex", gap: "4px", justifyContent: "center" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b", animation: `dot 1.2s ease-in-out ${i*0.2}s infinite` }} />
              ))}
            </div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginTop: "8px" }}>Capturing number...</div>
          </div>
        )}

        {/* Step 3 — SMS */}
        {step === 2 && (
          <div style={{ width: "100%", padding: "0 4px" }}>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: "8px" }}>Messages · ABC Plumbing</div>
            {/* Incoming bubble placeholder */}
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "6px" }}>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "12px 12px 12px 2px", padding: "6px 8px", maxWidth: "80%" }}>
                <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)" }}>Missed your call...</div>
              </div>
            </div>
            {/* Outbound SMS */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{
                background: "linear-gradient(135deg,#0084ff,#0055cc)",
                borderRadius: "12px 12px 2px 12px",
                padding: "7px 9px", maxWidth: "85%",
                animation: smsVisible ? "slideInRight 0.4s ease-out" : "none",
                opacity: smsVisible ? 1 : 0,
              }}>
                <div style={{ fontSize: "8px", color: "#ffffff", lineHeight: 1.4 }}>
                  Hi Sarah! Sorry we missed your call. How can ABC Plumbing help you today?
                </div>
                <div style={{ marginTop: "5px" }}>
                  <div style={{ fontSize: "7px", background: "rgba(255,255,255,0.2)", borderRadius: "6px", padding: "3px 6px", color: "#fff", textAlign: "center" }}>
                    Book Now →
                  </div>
                </div>
              </div>
            </div>
            {!smsVisible && (
              <div style={{ display: "flex", gap: "3px", justifyContent: "flex-end", marginTop: "6px" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#0084ff", animation: `dot 1s ${i*0.15}s infinite` }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4 — result */}
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
            <div style={{ fontSize: "10px", color: "#22c55e", fontWeight: "700" }}>BOOKED!</div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", marginTop: "6px", lineHeight: 1.4 }}>
              Sarah replied & booked a plumbing consultation
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MissedCallAnimation() {
  const [activeStep, setActiveStep] = useState(0);
  const [smsVisible, setSmsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const sectionRef = useRef(null);
  const timerRef = useRef(null);

  const runAnimation = () => {
    setIsPlaying(true);
    setHasStarted(true);
    setActiveStep(0);
    setSmsVisible(false);

    timerRef.current = setTimeout(() => setActiveStep(1), 1800);
    timerRef.current = setTimeout(() => setActiveStep(2), 3600);
    timerRef.current = setTimeout(() => setSmsVisible(true), 4400);
    timerRef.current = setTimeout(() => setActiveStep(3), 6200);
    timerRef.current = setTimeout(() => setIsPlaying(false), 7500);
  };

  // Auto-trigger on scroll into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !hasStarted) { runAnimation(); } },
      { threshold: 0.4 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  // Loop
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
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "9999px", padding: "4px 14px", marginBottom: "16px" }}>
            <PhoneOff style={{ width: "12px", height: "12px", color: "#ef4444" }} />
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.15em" }}>Missed Call Text-Back</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: "800", color: "#0A1628", margin: "0 0 12px", lineHeight: 1.15 }}>
            Every missed call is a missed<br />
            <span style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              $500–$5,000 opportunity.
            </span>
          </h2>
          <p style={{ fontSize: "16px", color: "rgba(10,22,40,0.55)", maxWidth: "520px", margin: "0 auto", lineHeight: 1.6 }}>
            Watch how our system turns a missed call into a booked appointment — automatically, in under 5 seconds.
          </p>
        </div>

        {/* Main animation area */}
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
                background: isPlaying ? "rgba(0,136,204,0.1)" : "linear-gradient(135deg,#0088CC,#003B8F)",
                border: "none", color: isPlaying ? "#0088CC" : "#fff",
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
                { IconComp: CheckCircle2, color: "#22c55e", label: "Lead Recovered", sub: "Call that would have been lost" },
                { IconComp: Calendar, color: "#0088CC", label: "Appointment Booked", sub: "Via the SMS booking link" },
                { IconComp: TrendingUp, color: "#9a5c2e", label: "Revenue Recovered", sub: "$500–$5,000 per job" },
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
                { value: "< 5s", label: "Response time" },
                { value: "100%", label: "Automated" },
                { value: "24/7", label: "Always on" },
                { value: "0", label: "Staff needed" },
              ].map(({ value, label }) => (
                <div key={label} style={{
                  padding: "14px 12px", borderRadius: "12px",
                  background: "#fafafa", border: "1.5px solid rgba(0,0,0,0.07)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#0088CC", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: "10px", color: "rgba(10,22,40,0.45)", marginTop: "3px" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom trust bar */}
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap", paddingTop: "32px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {[
            { icon: "🛡️", text: "100% Automated — zero staff needed" },
            { icon: "⚡", text: "Texts sent in under 5 seconds" },
            { icon: "💰", text: "Recovers $500–$5,000 per missed call" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>{icon}</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "rgba(10,22,40,0.6)" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes phonePulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 10px rgba(239,68,68,0)} }
        @keyframes dot { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-4px);opacity:1} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      ` }} />
    </section>
  );
}