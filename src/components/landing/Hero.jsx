import { useState, useEffect, useRef } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";

// Animated chat messages for the phone mockup
const chatMessages = [
  { role: "lead", text: "Hi! I saw your ad, how much are your facials?", delay: 0 },
  { role: "ai", text: "Hi Sarah! 👋 Our signature facial starts at $150. We'd love to get you booked — what days work best for you?", delay: 1200 },
  { role: "lead", text: "This week sometime, maybe Thursday?", delay: 2800 },
  { role: "ai", text: "Perfect! We have Thursday at 2pm or 4pm open. Want me to hold a spot? 📅", delay: 4000 },
  { role: "lead", text: "2pm works!", delay: 5400 },
  { role: "ai", text: "✅ Booked! Confirmation sent to your email. See you Thursday at 2pm!", delay: 6600 },
];

function PhoneMockup() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    chatMessages.forEach((msg, i) => {
      const timer = setTimeout(() => {
        setVisibleCount(i + 1);
      }, msg.delay + 800);
      return () => clearTimeout(timer);
    });
  }, []);

  // Loop the animation
  useEffect(() => {
    const loop = setInterval(() => {
      setVisibleCount(0);
      chatMessages.forEach((msg, i) => {
        setTimeout(() => setVisibleCount(i + 1), msg.delay + 800);
      });
    }, 10000);
    return () => clearInterval(loop);
  }, []);

  return (
    <div
      style={{
        width: "260px",
        height: "520px",
        borderRadius: "36px",
        background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)",
        border: "2px solid rgba(200,150,92,0.3)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.25), 0 8px 24px rgba(200,150,92,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Phone notch */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "14px", paddingBottom: "8px" }}>
        <div style={{ width: "80px", height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.15)" }} />
      </div>

      {/* Chat header */}
      <div style={{ padding: "8px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#f5e6d0" }}>AI</span>
          </div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: "700", color: "rgba(245,230,208,0.9)", margin: 0 }}>AI Assistant</p>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: "9px", color: "rgba(245,230,208,0.45)" }}>Responding instantly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: "12px 10px", overflowY: "hidden", display: "flex", flexDirection: "column", gap: "8px" }}>
        {chatMessages.slice(0, visibleCount).map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "ai" ? "flex-start" : "flex-end",
              animation: "msgIn 0.3s ease-out forwards",
            }}
          >
            <div
              style={{
                maxWidth: "82%",
                padding: "7px 10px",
                borderRadius: msg.role === "ai" ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                background: msg.role === "ai"
                  ? "linear-gradient(135deg, rgba(154,92,46,0.85), rgba(200,150,92,0.75))"
                  : "rgba(255,255,255,0.12)",
                fontSize: "10px",
                lineHeight: "1.45",
                color: msg.role === "ai" ? "#f5e6d0" : "rgba(245,230,208,0.85)",
                border: msg.role === "ai" ? "none" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* "Replied in X seconds" badge */}
      <div style={{ padding: "8px 12px 14px", textAlign: "center" }}>
        <span style={{ fontSize: "9px", fontWeight: "700", color: "rgba(200,150,92,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          ⚡ Replied in 4 seconds
        </span>
      </div>

      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function Hero() {
  const demoBooking = useDemoBooking();

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, hsl(40,35%,97%) 0%, hsl(38,30%,95%) 50%, hsl(36,25%,93%) 100%)",
        minHeight: "92vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Soft background blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(200,150,92,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "0", left: "-10%", width: "500px", height: "400px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(154,92,46,0.06) 0%, transparent 65%)" }} />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* LEFT: Text content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-4 py-1.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs font-bold text-primary tracking-widest uppercase">Done-For-You Automation</span>
            </div>

            {/* Heading */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-foreground mb-6">
              Turn Every Lead Into a{" "}
              <span style={{ color: "#9a5c2e" }}>Booked Appointment</span>
              {" "}— Automatically
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              We build AI-powered follow-up systems for service businesses that respond instantly, nurture leads, and fill your calendar — without you lifting a finger.
            </p>

            {/* Trust points */}
            <div className="flex flex-col gap-2.5 mb-9">
              {[
                "Instant response to every new lead",
                "Automated follow-up for 14 days",
                "Live in 5–7 business days",
              ].map((point) => (
                <div key={point} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground/80">{point}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <button
                onClick={demoBooking?.openDemoBooking}
                style={{
                  borderRadius: "9999px",
                  padding: "2px",
                  background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                  boxShadow: "0 4px 20px rgba(120,70,20,0.35)",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 36px rgba(120,70,20,0.5)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(120,70,20,0.35)"}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px", height: "52px", padding: "0 32px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "1rem" }}>
                  Book Your Free Demo
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
              <a
                href="#services"
                className="inline-flex items-center gap-2 h-[52px] px-6 rounded-full border-2 border-primary/25 text-sm font-semibold text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                See how it works
              </a>
            </div>

            {/* Social proof micro-line */}
            <p className="mt-6 text-xs text-muted-foreground">
              No contracts · Setup in 5–7 days · Most clients see ROI in 30 days
            </p>
          </div>

          {/* RIGHT: Phone mockup */}
          <div className="flex justify-center md:justify-end">
            <div style={{ position: "relative" }}>
              {/* Glow behind phone */}
              <div style={{ position: "absolute", inset: "-30px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(200,150,92,0.15) 0%, transparent 70%)", filter: "blur(12px)", zIndex: 0 }} />

              {/* Floating stat badge - top left */}
              <div
                style={{
                  position: "absolute", top: "30px", left: "-70px", zIndex: 10,
                  background: "white", borderRadius: "14px", padding: "10px 14px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)", border: "1px solid rgba(200,150,92,0.2)",
                  animation: "floatA 4s ease-in-out infinite",
                }}
              >
                <p style={{ fontSize: "9px", fontWeight: "700", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>New Lead</p>
                <p style={{ fontSize: "13px", fontWeight: "800", color: "#1a1a1a", margin: "2px 0 0" }}>Sarah M.</p>
                <p style={{ fontSize: "9px", color: "#888", margin: 0 }}>Instagram Ad · 2s ago</p>
              </div>

              {/* Floating stat badge - bottom right */}
              <div
                style={{
                  position: "absolute", bottom: "50px", right: "-80px", zIndex: 10,
                  background: "white", borderRadius: "14px", padding: "10px 14px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)", border: "1px solid rgba(200,150,92,0.2)",
                  animation: "floatB 5s ease-in-out infinite",
                }}
              >
                <p style={{ fontSize: "9px", fontWeight: "700", color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>✓ Booked</p>
                <p style={{ fontSize: "13px", fontWeight: "800", color: "#1a1a1a", margin: "2px 0 0" }}>Thu 2:00 PM</p>
                <p style={{ fontSize: "9px", color: "#888", margin: 0 }}>Glow Med Spa</p>
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <PhoneMockup />
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes floatA {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </section>
  );
}