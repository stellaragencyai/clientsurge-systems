import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";
import { KeywordDriftCanvas } from "./HeroBackground";
import HeroDashboard from "./HeroDashboard";

export default function Hero() {
  const demoBooking = useDemoBooking();

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #fdfcfa 0%, #f9f6f1 50%, #fdfaf6 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Very subtle warm keyword drift — low opacity for light bg */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.35 }}>
        <KeywordDriftCanvas />
      </div>

      {/* Soft ambient blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div style={{ position: "absolute", top: "-5%", right: "0%", width: "700px", height: "600px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(200,150,92,0.07) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: "550px", height: "500px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(154,92,46,0.05) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", top: "40%", left: "35%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(200,180,140,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-7xl mx-auto px-6 py-20 md:py-28" style={{ zIndex: 5 }}>
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── LEFT: Copy ─────────────────────────────────────────── */}
          <div>
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
              style={{
                background: "rgba(154,92,46,0.08)",
                border: "1px solid rgba(154,92,46,0.2)",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#9a5c2e", display: "inline-block" }} />
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#9a5c2e", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                Done-For-You AI Automation
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-display font-bold tracking-tight leading-[1.08] mb-6"
              style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.5rem)", color: "#1a1209" }}
            >
              Turn Every Lead Into a{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #9a5c2e 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Booked Appointment
              </span>
              {" "}— Automatically
            </h1>

            <p style={{ fontSize: "1.1rem", color: "rgba(26,18,9,0.6)", lineHeight: 1.75, marginBottom: "2rem", maxWidth: "480px" }}>
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
                  <span style={{ fontSize: "14px", fontWeight: "500", color: "rgba(26,18,9,0.75)" }}>{pt}</span>
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
                  boxShadow: "0 4px 24px rgba(120,70,20,0.35)",
                  border: "none",
                  cursor: "pointer",
                  transition: "box-shadow 0.3s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 40px rgba(120,70,20,0.5)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 24px rgba(120,70,20,0.35)"}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px", height: "54px", padding: "0 36px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "1rem" }}>
                  Book Your Free Demo
                  <ArrowRight style={{ width: "16px", height: "16px" }} />
                </span>
              </button>
              <a
                href="#services"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "54px", padding: "0 24px", borderRadius: "9999px", border: "1.5px solid rgba(154,92,46,0.3)", color: "rgba(26,18,9,0.65)", fontSize: "14px", fontWeight: "600", textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(154,92,46,0.6)"; e.currentTarget.style.color = "#1a1209"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(154,92,46,0.3)"; e.currentTarget.style.color = "rgba(26,18,9,0.65)"; }}
              >
                See how it works
              </a>
            </div>

            <p style={{ marginTop: "20px", fontSize: "11px", color: "rgba(26,18,9,0.35)", letterSpacing: "0.04em" }}>
              No contracts · Most clients see ROI within 30 days
            </p>
          </div>

          {/* ── RIGHT: Live dashboard wallpaper ────────────────────── */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ position: "relative" }}>

              {/* Subtle glow behind dashboard */}
              <div style={{
                position: "absolute",
                inset: "-40px",
                borderRadius: "32px",
                background: "radial-gradient(ellipse at 60% 40%, rgba(200,150,92,0.12) 0%, rgba(34,197,94,0.04) 50%, transparent 75%)",
                filter: "blur(24px)",
                zIndex: 0,
              }} />

              {/* 3D perspective tilt — just like IdentityIQ but on the whole dashboard */}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  transform: "perspective(1600px) rotateY(-16deg) rotateX(5deg) rotateZ(1deg)",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.7s ease",
                  filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.12)) drop-shadow(0 12px 30px rgba(0,0,0,0.08))",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "perspective(1600px) rotateY(-8deg) rotateX(3deg) rotateZ(0.3deg)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "perspective(1600px) rotateY(-16deg) rotateX(5deg) rotateZ(1deg)"}
              >
                {/* Dashboard container with frosted glass frame */}
                <div style={{
                  background: "rgba(248,245,240,0.85)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderRadius: "20px",
                  border: "1px solid rgba(200,150,92,0.15)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 1px rgba(200,150,92,0.08)",
                  padding: "16px",
                }}>
                  {/* Fake window chrome */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#febc2e" }} />
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
                    <div style={{ flex: 1, height: "24px", borderRadius: "6px", background: "rgba(0,0,0,0.05)", marginLeft: "8px", display: "flex", alignItems: "center", paddingLeft: "10px" }}>
                      <span style={{ fontSize: "10px", color: "#aaa", fontWeight: "500" }}>ClientSurge — Lead Automation Dashboard</span>
                    </div>
                  </div>

                  <HeroDashboard />
                </div>
              </div>

              {/* Floating badge — revenue */}
              <div
                style={{
                  position: "absolute", bottom: "30px", left: "-80px", zIndex: 10,
                  background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
                  borderRadius: "14px", padding: "10px 14px",
                  border: "1px solid rgba(245,158,11,0.25)",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.1)",
                  animation: "floatA 4.5s ease-in-out infinite",
                }}
              >
                <p style={{ fontSize: "9px", fontWeight: "700", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>💰 Revenue Recovered</p>
                <p style={{ fontSize: "18px", fontWeight: "800", color: "#1a1209", margin: "0 0 2px" }}>$4,200</p>
                <p style={{ fontSize: "9px", color: "#aaa", margin: 0 }}>This week · reactivated leads</p>
              </div>

              {/* Floating badge — response time */}
              <div
                style={{
                  position: "absolute", top: "20px", right: "-75px", zIndex: 10,
                  background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
                  borderRadius: "14px", padding: "10px 14px",
                  border: "1px solid rgba(34,197,94,0.2)",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.1)",
                  animation: "floatB 5s ease-in-out infinite",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
                  <span style={{ fontSize: "9px", fontWeight: "700", color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Response</span>
                </div>
                <p style={{ fontSize: "20px", fontWeight: "800", color: "#1a1209", margin: "0 0 1px" }}>⚡ 4 sec</p>
                <p style={{ fontSize: "9px", color: "#aaa", margin: 0 }}>Average reply time</p>
              </div>

            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.35} }
      `}</style>
    </section>
  );
}