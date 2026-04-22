import { useState, useEffect, useRef } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";
import {
  KeywordDriftCanvas,
  RadialSpotlight,
  GrainOverlay,
  WatermarkTypography,
  GhostStatCards,
} from "./HeroBackground";

// ── Animated iPhone chat mockup ──────────────────────────────────────────────
const chatMessages = [
  { role: "lead",  text: "Hi! I saw your ad — how much are your facials?",                        delay: 0    },
  { role: "ai",    text: "Hey Sarah! 👋 Our signature facial starts at $150. What days work for you?", delay: 1400 },
  { role: "lead",  text: "Thursday maybe?",                                                          delay: 3000 },
  { role: "ai",    text: "We have Thu at 2pm or 4pm — want me to hold a spot? 📅",                  delay: 4400 },
  { role: "lead",  text: "2pm works!",                                                               delay: 5800 },
  { role: "ai",    text: "✅ Booked! Confirmation sent. See you Thursday at 2pm!",                   delay: 7000 },
];

function IPhoneMockup() {
  const [visibleCount, setVisibleCount] = useState(0);
  const timersRef = useRef([]);

  const startAnimation = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setVisibleCount(0);
    chatMessages.forEach((msg, i) => {
      const t = setTimeout(() => setVisibleCount(i + 1), msg.delay + 600);
      timersRef.current.push(t);
    });
  };

  useEffect(() => {
    startAnimation();
    const loop = setInterval(startAnimation, 11000);
    return () => {
      clearInterval(loop);
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      style={{
        width: "270px",
        height: "540px",
        borderRadius: "44px",
        background: "linear-gradient(160deg, #fafafa 0%, #f0f0f0 100%)",
        border: "10px solid #e8e8e8",
        boxShadow:
          "0 0 0 1px rgba(0,0,0,0.08), 0 40px 100px rgba(0,0,0,0.45), 0 16px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.9)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Status bar */}
      <div style={{ background: "#fff", padding: "10px 18px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: "700", color: "#111" }}>9:41</span>
        <div style={{ width: "90px", height: "22px", borderRadius: "11px", background: "#111", margin: "0 auto", position: "absolute", left: "50%", transform: "translateX(-50%)", top: "6px" }} />
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <div style={{ width: "14px", height: "8px", border: "1.5px solid #111", borderRadius: "2px", position: "relative" }}>
            <div style={{ position: "absolute", inset: "1px 1px 1px", background: "#111", borderRadius: "1px", width: "70%" }} />
          </div>
        </div>
      </div>

      {/* Chat header */}
      <div style={{ background: "#fff", padding: "8px 14px 10px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #9a5c2e, #c8965c)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "12px", fontWeight: "800", color: "#fff" }}>AI</span>
        </div>
        <div>
          <p style={{ fontSize: "13px", fontWeight: "700", color: "#111", margin: 0, lineHeight: 1.2 }}>ClientSurge AI</p>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: "10px", color: "#888" }}>Responding instantly</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, background: "#f7f7f7", padding: "12px 10px", display: "flex", flexDirection: "column", gap: "7px", overflowY: "hidden" }}>
        {chatMessages.slice(0, visibleCount).map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "ai" ? "flex-start" : "flex-end",
              animation: "msgPop 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
          >
            <div
              style={{
                maxWidth: "78%",
                padding: "8px 11px",
                borderRadius: msg.role === "ai" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                background: msg.role === "ai" ? "linear-gradient(135deg, #22c55e, #16a34a)" : "#111",
                fontSize: "11px",
                lineHeight: "1.5",
                color: "#fff",
                boxShadow: msg.role === "ai" ? "0 2px 8px rgba(34,197,94,0.3)" : "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{ background: "#fff", padding: "8px 12px 10px", borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ flex: 1, background: "#f3f3f3", borderRadius: "20px", padding: "7px 12px", fontSize: "11px", color: "#bbb" }}>Message...</div>
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #9a5c2e, #c8965c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowRight style={{ width: "12px", height: "12px", color: "#fff" }} />
        </div>
      </div>

      <style>{`
        @keyframes msgPop {
          from { opacity: 0; transform: scale(0.85) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Main Hero ─────────────────────────────────────────────────────────────────
export default function Hero() {
  const demoBooking = useDemoBooking();

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a0c14 0%, #0f1220 40%, #0c0e18 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Background layers */}
      <KeywordDriftCanvas />
      <RadialSpotlight />
      <GrainOverlay />
      <WatermarkTypography />
      <GhostStatCards />

      {/* Content */}
      <div className="relative w-full max-w-6xl mx-auto px-6 py-28 md:py-36" style={{ zIndex: 5 }}>
        <div className="grid md:grid-cols-2 gap-16 items-center">

          {/* LEFT: copy */}
          <div>
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
              style={{
                background: "rgba(200,150,92,0.1)",
                border: "1px solid rgba(200,150,92,0.25)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c8965c", display: "inline-block" }} />
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#c8965c", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Done-For-You AI Automation
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-display font-bold tracking-tight leading-[1.08] mb-6"
              style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", color: "#f5e6d0" }}
            >
              Turn Every Lead Into a{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #c8965c 0%, #f5d9a8 50%, #c8965c 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Booked Appointment
              </span>
              {" "}— Automatically
            </h1>

            <p style={{ fontSize: "1.1rem", color: "rgba(245,230,208,0.65)", lineHeight: 1.7, marginBottom: "2rem", maxWidth: "480px" }}>
              We build AI-powered follow-up systems that respond in seconds, nurture leads for 14 days, and fill your calendar — without you lifting a finger.
            </p>

            {/* Checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "2.5rem" }}>
              {[
                "Instant SMS response to every new lead",
                "14-day automated follow-up sequence",
                "Missed call text-back — 0 leads lost",
                "Live in 5–7 business days, fully built for you",
              ].map((pt) => (
                <div key={pt} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CheckCircle2 style={{ width: "16px", height: "16px", color: "#22c55e", flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", fontWeight: "500", color: "rgba(245,230,208,0.8)" }}>{pt}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <button
                onClick={demoBooking?.openDemoBooking}
                style={{
                  borderRadius: "9999px",
                  padding: "2px",
                  background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                  boxShadow: "0 4px 24px rgba(120,70,20,0.5)",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.7)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 24px rgba(120,70,20,0.5)"}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px", height: "54px", padding: "0 36px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "1rem" }}>
                  Book Your Free Demo
                  <ArrowRight style={{ width: "16px", height: "16px" }} />
                </span>
              </button>
              <a
                href="#services"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "54px", padding: "0 24px", borderRadius: "9999px", border: "1.5px solid rgba(200,150,92,0.3)", color: "rgba(245,230,208,0.7)", fontSize: "14px", fontWeight: "600", textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(200,150,92,0.6)"; e.currentTarget.style.color = "#f5e6d0"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(200,150,92,0.3)"; e.currentTarget.style.color = "rgba(245,230,208,0.7)"; }}
              >
                See how it works
              </a>
            </div>

            <p style={{ marginTop: "20px", fontSize: "11px", color: "rgba(245,230,208,0.3)", letterSpacing: "0.04em" }}>
              No contracts · Most clients see ROI within 30 days
            </p>
          </div>

          {/* RIGHT: 3D tilted iPhone */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ position: "relative" }}>

              {/* Glow behind phone */}
              <div style={{
                position: "absolute",
                inset: "-60px",
                borderRadius: "50%",
                background: "radial-gradient(ellipse at center, rgba(200,150,92,0.18) 0%, rgba(34,197,94,0.06) 50%, transparent 75%)",
                filter: "blur(20px)",
                zIndex: 0,
              }} />

              {/* 3D tilted phone */}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  transform: "perspective(1400px) rotateY(-22deg) rotateX(6deg) rotateZ(1.5deg)",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.6s ease",
                  filter: "drop-shadow(0 60px 80px rgba(0,0,0,0.6)) drop-shadow(0 20px 40px rgba(0,0,0,0.4))",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "perspective(1400px) rotateY(-14deg) rotateX(4deg) rotateZ(0.5deg)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "perspective(1400px) rotateY(-22deg) rotateX(6deg) rotateZ(1.5deg)"}
              >
                <IPhoneMockup />
              </div>

              {/* Floating stat — top left */}
              <div
                style={{
                  position: "absolute", top: "20px", left: "-90px", zIndex: 10,
                  background: "rgba(15,18,32,0.9)", backdropFilter: "blur(12px)",
                  borderRadius: "14px", padding: "10px 14px",
                  border: "1px solid rgba(200,150,92,0.2)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  animation: "floatA 4s ease-in-out infinite",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
                  <span style={{ fontSize: "9px", fontWeight: "700", color: "rgba(200,150,92,0.7)", textTransform: "uppercase", letterSpacing: "0.1em" }}>New Lead</span>
                </div>
                <p style={{ fontSize: "13px", fontWeight: "800", color: "#f5e6d0", margin: "0 0 2px" }}>Sarah M.</p>
                <p style={{ fontSize: "9px", color: "rgba(245,230,208,0.4)", margin: 0 }}>Instagram Ad · 2s ago</p>
              </div>

              {/* Floating stat — bottom right */}
              <div
                style={{
                  position: "absolute", bottom: "60px", right: "-95px", zIndex: 10,
                  background: "rgba(15,18,32,0.9)", backdropFilter: "blur(12px)",
                  borderRadius: "14px", padding: "10px 14px",
                  border: "1px solid rgba(34,197,94,0.2)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  animation: "floatB 5s ease-in-out infinite",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
                  <span style={{ fontSize: "9px", fontWeight: "700", color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.1em" }}>✓ Booked</span>
                </div>
                <p style={{ fontSize: "13px", fontWeight: "800", color: "#f5e6d0", margin: "0 0 2px" }}>Thu 2:00 PM</p>
                <p style={{ fontSize: "9px", color: "rgba(245,230,208,0.4)", margin: 0 }}>Glow Med Spa</p>
              </div>

              {/* Floating stat — top right */}
              <div
                style={{
                  position: "absolute", top: "160px", right: "-85px", zIndex: 10,
                  background: "rgba(15,18,32,0.9)", backdropFilter: "blur(12px)",
                  borderRadius: "14px", padding: "10px 14px",
                  border: "1px solid rgba(167,139,250,0.2)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  animation: "floatC 4.5s ease-in-out infinite",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a78bfa" }} />
                  <span style={{ fontSize: "9px", fontWeight: "700", color: "rgba(167,139,250,0.8)", textTransform: "uppercase", letterSpacing: "0.1em" }}>AI Replied</span>
                </div>
                <p style={{ fontSize: "13px", fontWeight: "800", color: "#f5e6d0", margin: "0 0 2px" }}>4 seconds</p>
                <p style={{ fontSize: "9px", color: "rgba(245,230,208,0.4)", margin: 0 }}>Before any competitor</p>
              </div>

            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes floatC { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>
    </section>
  );
}