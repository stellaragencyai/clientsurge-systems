import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";
import HeroDashboardScreen from "./HeroDashboardScreen";

export default function Hero() {
  const demoBooking = useDemoBooking();

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        background: "linear-gradient(135deg, #fdfcfa 0%, #f8f4ee 40%, #faf7f2 100%)",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* ── STEP 7: Ambient light rays glowing BEHIND the tablet ────── */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
        {/* Main amber glow — right side, behind tablet */}
        <div style={{ position: "absolute", top: "10%", right: "-5%", width: "70vw", height: "90vh", borderRadius: "50%", background: "radial-gradient(ellipse at 70% 40%, rgba(200,150,92,0.13) 0%, rgba(154,92,46,0.07) 35%, transparent 65%)", filter: "blur(4px)" }} />
        {/* Green glow — pipeline booked stat */}
        <div style={{ position: "absolute", top: "30%", right: "15%", width: "40vw", height: "50vh", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(34,197,94,0.07) 0%, transparent 65%)", filter: "blur(8px)" }} />
        {/* Purple glow — SMS section */}
        <div style={{ position: "absolute", bottom: "15%", right: "10%", width: "30vw", height: "40vh", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(167,139,250,0.06) 0%, transparent 65%)", filter: "blur(10px)" }} />
        {/* Indigo glow — pipeline */}
        <div style={{ position: "absolute", top: "50%", right: "30%", width: "25vw", height: "30vh", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(99,102,241,0.05) 0%, transparent 65%)", filter: "blur(12px)" }} />
      </div>

      {/* ── STEP 2+3: Giant tablet frame — absolute, bleeds off right + bottom ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          /* Position so it bleeds off right edge and bottom — just like IdentityIQ */
          top: "50%",
          right: "-6%",
          transform: "translateY(-46%) perspective(2200px) rotateY(-18deg) rotateX(8deg) rotateZ(1.5deg)",
          transformOrigin: "right center",
          transformStyle: "preserve-3d",
          /* Tablet bezel size — massive, 60vw wide */
          width: "60vw",
          maxWidth: "900px",
          height: "72vh",
          minHeight: "520px",
          /* White tablet bezel */
          background: "linear-gradient(145deg, #f0ede8 0%, #e8e4de 100%)",
          borderRadius: "28px",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: `
            0 0 0 8px #d8d4ce,
            0 0 0 10px rgba(0,0,0,0.06),
            0 60px 120px rgba(0,0,0,0.22),
            0 30px 60px rgba(0,0,0,0.14),
            inset 0 1px 0 rgba(255,255,255,0.9),
            0 0 80px rgba(200,150,92,0.1)
          `,
          padding: "16px",
          zIndex: 2,
          /* Step 5: filter glow around the bezel */
          filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.35))",
        }}
      >
        {/* Screen inner bezel ring */}
        <div style={{ position: "absolute", inset: "12px", borderRadius: "18px", border: "1px solid rgba(0,0,0,0.06)", pointerEvents: "none", zIndex: 10 }} />
        {/* Screen content */}
        <div style={{ width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden", position: "relative" }}>
          <HeroDashboardScreen />
          {/* Step 8: subtle scanline texture overlay for depth */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.015) 2px, rgba(0,0,0,0.015) 4px)", pointerEvents: "none", zIndex: 5 }} />
        </div>
        {/* Camera dot */}
        <div style={{ position: "absolute", top: "8px", left: "50%", transform: "translateX(-50%)", width: "6px", height: "6px", borderRadius: "50%", background: "#c8c4be", border: "1px solid rgba(0,0,0,0.1)" }} />
      </div>

      {/* ── STEP 4: Left-to-right gradient overlay — text side stays clean ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, rgba(253,252,250,1) 0%, rgba(253,252,250,0.98) 30%, rgba(253,252,250,0.7) 52%, rgba(253,252,250,0.15) 68%, transparent 80%)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* ── STEP 5: Bottom fade — blends into next section ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "180px",
          background: "linear-gradient(to top, rgba(253,252,250,1) 0%, transparent 100%)",
          zIndex: 4,
          pointerEvents: "none",
        }}
      />

      {/* ── STEP 9: Copy — left side, above gradients ─────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 48px",
          paddingTop: "60px",
          paddingBottom: "120px",
        }}
      >
        <div style={{ maxWidth: "540px" }}>

          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "9999px",
              padding: "6px 16px",
              marginBottom: "28px",
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
            className="font-display"
            style={{
              fontSize: "clamp(2.5rem, 4.5vw, 3.8rem)",
              fontWeight: "800",
              lineHeight: 1.07,
              letterSpacing: "-0.02em",
              color: "#1a1209",
              marginBottom: "20px",
            }}
          >
            Turn Every Lead Into a{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #7a3f1a 0%, #c8965c 50%, #9a5c2e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Booked Appointment
            </span>
            {" "}— Automatically
          </h1>

          <p style={{ fontSize: "1.1rem", color: "rgba(26,18,9,0.58)", lineHeight: 1.75, marginBottom: "28px" }}>
            We build AI-powered systems that respond in seconds, nurture leads for 14 days, and fill your calendar — without you lifting a finger.
          </p>

          {/* Checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: "11px", marginBottom: "36px" }}>
            {[
              "Instant SMS response to every new lead",
              "14-day automated follow-up sequence",
              "Missed call text-back — 0 leads lost",
              "Live in 5–7 business days, fully built for you",
            ].map((pt) => (
              <div key={pt} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckCircle2 style={{ width: "17px", height: "17px", color: "#22c55e", flexShrink: 0 }} />
                <span style={{ fontSize: "14.5px", fontWeight: "500", color: "rgba(26,18,9,0.72)" }}>{pt}</span>
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
                boxShadow: "0 6px 28px rgba(120,70,20,0.38)",
                border: "none",
                cursor: "pointer",
                transition: "box-shadow 0.3s ease, transform 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 10px 44px rgba(120,70,20,0.55)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 6px 28px rgba(120,70,20,0.38)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px", height: "56px", padding: "0 38px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "1rem" }}>
                Book Your Free Demo
                <ArrowRight style={{ width: "17px", height: "17px" }} />
              </span>
            </button>

            <a
              href="#services"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "56px", padding: "0 26px", borderRadius: "9999px", border: "1.5px solid rgba(154,92,46,0.28)", color: "rgba(26,18,9,0.6)", fontSize: "14px", fontWeight: "600", textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(154,92,46,0.55)"; e.currentTarget.style.color = "#1a1209"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(154,92,46,0.28)"; e.currentTarget.style.color = "rgba(26,18,9,0.6)"; }}
            >
              See how it works
            </a>
          </div>

          <p style={{ marginTop: "18px", fontSize: "11px", color: "rgba(26,18,9,0.3)", letterSpacing: "0.04em" }}>
            No contracts · Most clients see ROI within 30 days
          </p>
        </div>
      </div>

      {/* ── STEP 8: Floating stat chips — hover OUTSIDE the tablet frame ─ */}
      {/* Revenue chip */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "22%",
          right: "38%",
          zIndex: 8,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "16px",
          padding: "12px 16px",
          border: "1px solid rgba(245,158,11,0.25)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 0 20px rgba(245,158,11,0.12)",
          animation: "hfloatA 4.5s ease-in-out infinite",
        }}
      >
        <p style={{ fontSize: "9px", fontWeight: "700", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>💰 Revenue Recovered</p>
        <p style={{ fontSize: "20px", fontWeight: "800", color: "#1a1209", margin: "0 0 2px", lineHeight: 1 }}>$4,200</p>
        <p style={{ fontSize: "9px", color: "#aaa", margin: 0 }}>This week · reactivated leads</p>
      </div>

      {/* Response time chip */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "18%",
          right: "33%",
          zIndex: 8,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "16px",
          padding: "12px 16px",
          border: "1px solid rgba(34,197,94,0.25)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1), 0 0 20px rgba(34,197,94,0.1)",
          animation: "hfloatB 5.5s ease-in-out infinite",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "hpulse 2s infinite" }} />
          <span style={{ fontSize: "9px", fontWeight: "700", color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Response</span>
        </div>
        <p style={{ fontSize: "22px", fontWeight: "800", color: "#1a1209", margin: "0 0 2px", lineHeight: 1 }}>⚡ 4 sec</p>
        <p style={{ fontSize: "9px", color: "#aaa", margin: 0 }}>Average AI reply time</p>
      </div>

      <style>{`
        @keyframes hfloatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes hfloatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes hpulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }

        @media (max-width: 1024px) {
          /* On tablet/mobile, hide the background tablet and go stacked */
        }
      `}</style>
    </section>
  );
}