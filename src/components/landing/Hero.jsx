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
      {/* ── Dark atmospheric wash — right side only (Fix 1) ── */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
        {/* Main dark radial field centered-right — creates deep space effect */}
        <div style={{ position: "absolute", top: "50%", right: "15%", width: "100vw", height: "100vh", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(13,15,30,0.75) 0%, rgba(13,15,30,0.4) 35%, rgba(13,15,30,0.15) 60%, transparent 85%)", transform: "translateY(-50%)", filter: "blur(3px)" }} />
        {/* Warm accent layers — still present but now against dark backdrop */}
        <div style={{ position: "absolute", top: "-10%", right: "-10%", width: "80vw", height: "120vh", background: "radial-gradient(ellipse at 65% 45%, rgba(200,150,92,0.08) 0%, rgba(154,92,46,0.04) 30%, transparent 55%)", filter: "blur(2px)" }} />
        {/* Green glow — pipeline booked stat */}
        <div style={{ position: "absolute", top: "30%", right: "15%", width: "40vw", height: "50vh", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(34,197,94,0.05) 0%, transparent 65%)", filter: "blur(8px)" }} />
        {/* Purple glow — SMS section */}
        <div style={{ position: "absolute", bottom: "15%", right: "10%", width: "30vw", height: "40vh", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(167,139,250,0.03) 0%, transparent 65%)", filter: "blur(10px)" }} />
      </div>

      {/* ── LEFT-side ghost panel bleeding off-screen (Fix 2) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "-8%",
          transform: "translateY(-50%)",
          width: "42vw",
          maxWidth: "620px",
          height: "68vh",
          minHeight: "420px",
          background: "linear-gradient(145deg, rgba(26,18,9,0.12) 0%, rgba(200,150,92,0.06) 100%)",
          borderRadius: "20px",
          border: "none",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          opacity: 0.35,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
          maskImage: "radial-gradient(ellipse at right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 50%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 50%, transparent 85%)",
        }}
      >
        {/* Left panel content — mini dashboard preview */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", opacity: 0.65 }}>
          <div style={{ height: "12px", width: "70%", borderRadius: "6px", background: "rgba(154,92,46,0.3)" }} />
          <div style={{ height: "10px", width: "90%", borderRadius: "6px", background: "rgba(154,92,46,0.2)" }} />
          <div style={{ marginTop: "16px", height: "80px", borderRadius: "12px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ height: "10px", width: "45%", borderRadius: "4px", background: "rgba(34,197,94,0.35)" }} />
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            {[65, 48, 72, 55, 80].map((w, i) => (
              <div key={i} style={{ flex: 1, height: "45px", borderRadius: "10px", background: `rgba(154,92,46,${0.08 + i * 0.03})`, border: "1px solid rgba(154,92,46,0.12)" }} />
            ))}
          </div>
          <div style={{ height: "10px", width: "85%", borderRadius: "6px", background: "rgba(154,92,46,0.15)", marginTop: "8px" }} />
          <div style={{ height: "8px", width: "65%", borderRadius: "6px", background: "rgba(154,92,46,0.1)" }} />
        </div>
      </div>

      {/* ── IDEA 5: Dot-grid mesh texture overlay (IdentityIQ subtle depth texture) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          backgroundImage: "radial-gradient(circle, rgba(154,92,46,0.09) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 70% 100% at 75% 50%, rgba(0,0,0,0.5) 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 100% at 75% 50%, rgba(0,0,0,0.5) 0%, transparent 75%)",
        }}
      />

      {/* ── Ghost panel TOP RIGHT — medium depth blur (Fix 3 + Fix 4) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-8%",
          right: "-2%",
          width: "44vw",
          maxWidth: "640px",
          height: "55vh",
          minHeight: "360px",
          background: "linear-gradient(145deg, rgba(26,18,9,0.06) 0%, rgba(200,150,92,0.04) 100%)",
          borderRadius: "22px",
          border: "none",
          filter: "blur(12px)",
          transform: "perspective(2200px) rotateY(-14deg) rotateX(6deg) rotateZ(0.5deg)",
          transformOrigin: "right top",
          opacity: 0.55,
          zIndex: 1,
          pointerEvents: "none",
          overflow: "hidden",
          maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, transparent 85%)",
        }}
      >
        {/* Top panel readable UI (Fix 7) — dashboard preview with legible content */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px", opacity: 0.75 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "6px", background: "rgba(154,92,46,0.65)" }} />
            <div style={{ height: "10px", width: "55%", borderRadius: "4px", background: "rgba(154,92,46,0.58)" }} />
          </div>
          {/* Stat row — legible numbers */}
          <div style={{ display: "flex", justifyContent: "space-around", gap: "8px" }}>
            {["247", "94%", "$4.2k"].map((val, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px", borderRadius: "10px", background: "rgba(154,92,46,0.18)", border: "1px solid rgba(154,92,46,0.28)" }}>
                <div style={{ height: "14px", background: `linear-gradient(to bottom, rgba(154,92,46,0.${55 + i*15}), rgba(154,92,46,0.${45 + i*10}))`, borderRadius: "2px", marginBottom: "3px" }} />
                <div style={{ height: "8px", width: "70%", borderRadius: "3px", background: "rgba(154,92,46,0.42)", margin: "0 auto" }} />
              </div>
            ))}
          </div>
          {/* Pipeline bar */}
          <div style={{ marginTop: "8px" }}>
            <div style={{ height: "8px", width: "40%", borderRadius: "3px", background: "rgba(154,92,46,0.48)", marginBottom: "6px" }} />
            <div style={{ height: "20px", borderRadius: "6px", background: "rgba(34,197,94,0.25)", border: "1px solid rgba(34,197,94,0.35)", position: "relative", overflow: "hidden" }}>
              <div style={{ height: "100%", width: "72%", background: "rgba(34,197,94,0.55)", borderRadius: "6px" }} />
            </div>
          </div>
          {/* Mini chart bars */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "50px", marginTop: "10px" }}>
            {[35, 52, 68, 44, 76].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: "4px", background: `rgba(200,150,92,${0.28 + i*0.12})`, border: "1px solid rgba(200,150,92,0.28)" }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Ghost panel BOTTOM RIGHT — heavy depth blur (Fix 3 + Fix 4) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-12%",
          right: "6%",
          width: "38vw",
          maxWidth: "560px",
          height: "48vh",
          minHeight: "300px",
          background: "linear-gradient(145deg, rgba(26,18,9,0.05) 0%, rgba(200,150,92,0.03) 100%)",
          borderRadius: "20px",
          border: "none",
          filter: "blur(20px)",
          transform: "perspective(2200px) rotateY(-10deg) rotateX(-4deg) rotateZ(-1deg)",
          transformOrigin: "right bottom",
          opacity: 0.45,
          zIndex: 1,
          pointerEvents: "none",
          overflow: "hidden",
          maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 55%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 55%, transparent 80%)",
        }}
      >
        {/* Ghost UI — lead list rows */}
        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "8px", opacity: 0.7 }}>
          {[90, 75, 60, 80, 55, 70].map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "10px", background: "rgba(154,92,46,0.04)", border: "1px solid rgba(154,92,46,0.08)" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: `rgba(154,92,46,${0.12 + i * 0.03})`, flexShrink: 0 }} />
              <div style={{ height: "7px", width: `${w}%`, borderRadius: "4px", background: "rgba(26,18,9,0.12)" }} />
              <div style={{ marginLeft: "auto", height: "7px", width: "15%", borderRadius: "4px", background: "rgba(34,197,94,0.2)", flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Frosted reflection pool behind tablet ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "52%",
          right: "2%",
          width: "52vw",
          maxWidth: "780px",
          height: "20vh",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(200,150,92,0.09) 0%, rgba(253,252,250,0.5) 50%, transparent 80%)",
          filter: "blur(28px)",
          transform: "translateY(30%) scaleY(0.35)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* ── Pulsing warm amber glow halo behind bezel + floating effect ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          right: "2%",
          width: "60vw",
          maxWidth: "900px",
          height: "84vh",
          minHeight: "580px",
          borderRadius: "32px",
          background: "transparent",
          boxShadow: "0 0 60px 16px rgba(200,150,92,0.16), 0 0 130px 50px rgba(154,92,46,0.09)",
          transform: "translateY(-48%) perspective(2200px) rotateY(-10deg) rotateX(4deg) rotateZ(0.5deg)",
          transformOrigin: "center center",
          animation: "haloglow 4s ease-in-out infinite, floatTablet 6s ease-in-out infinite",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* ── Glass desk reflection beneath tablet ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-18%",
          right: "2%",
          width: "60vw",
          maxWidth: "900px",
          height: "40vh",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(220,220,220,0.15) 30%, transparent 70%)",
          borderRadius: "50% 50% 0 0",
          filter: "blur(20px)",
          transform: "scaleY(0.4) perspective(2200px) rotateX(75deg)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* ── Pencil silhouette under tablet (left side) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "14%",
          right: "32%",
          width: "12vw",
          maxWidth: "180px",
          height: "2px",
          background: "linear-gradient(to right, rgba(200,150,92,0.8) 0%, rgba(200,150,92,0.3) 100%)",
          borderRadius: "1px",
          transform: "perspective(2200px) rotateX(80deg) rotateZ(-15deg)",
          zIndex: 0,
          pointerEvents: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      />

      {/* ── Ultra-glass desk surface shine ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "0",
          right: "0",
          width: "80vw",
          height: "25vh",
          background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 40%, transparent 100%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* ── CAST SHADOW — ground shadow beneath tablet ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "88%",
          right: "4%",
          width: "60vw",
          maxWidth: "900px",
          height: "60px",
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.18) 0%, transparent 70%)",
          filter: "blur(18px)",
          transform: "perspective(2200px) rotateX(80deg) scaleY(0.4)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* ── TABLET FRAME — fully visible, scaled larger (Fix 6) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          right: "2%",
          transform: "translateY(-48%) perspective(2500px) rotateY(-12deg) rotateX(8deg) rotateZ(2.8deg)",
          transformOrigin: "center center",
          transformStyle: "preserve-3d",
          width: "60vw",
          maxWidth: "900px",
          height: "84vh",
          minHeight: "580px",
          opacity: 0.99,
          background: "linear-gradient(160deg, #22253a 0%, #141620 60%, #0e1018 100%)",
          borderRadius: "36px",
          border: "1.5px solid rgba(255,255,255,0.12)",
          boxShadow: `
            0 0 0 8px #0d0f18,
            0 0 0 10px rgba(255,255,255,0.04),
            0 0 0 11px rgba(200,150,92,0.08),
            0 80px 160px rgba(0,0,0,0.65),
            0 35px 80px rgba(0,0,0,0.45),
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -1px 0 rgba(0,0,0,0.3)
          `,
          padding: "16px",
          zIndex: 2,
        }}
      >
        {/* Idea 3: Glass-shine highlight streak across top of bezel with shimmer */}
        <div style={{
          position: "absolute",
          top: "6px",
          left: "12%",
          right: "12%",
          height: "2px",
          borderRadius: "9999px",
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.28) 30%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.28) 70%, transparent)",
          pointerEvents: "none",
          zIndex: 15,
          animation: "glassShine 3s ease-in-out infinite",
        }} />

        {/* Idea 6: Frosted edge — left side of bezel fades into bg via mask */}
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "28px",
          background: "linear-gradient(to right, rgba(248,244,238,0.18) 0%, transparent 18%)",
          pointerEvents: "none",
          zIndex: 11,
        }} />

        {/* Screen inner bezel ring */}
        <div style={{ position: "absolute", inset: "12px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.07)", pointerEvents: "none", zIndex: 10 }} />

        {/* Screen content */}
        <div style={{ width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden", position: "relative" }}>
          <HeroDashboardScreen />
          {/* Scanline depth texture */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.012) 2px, rgba(0,0,0,0.012) 4px)", pointerEvents: "none", zIndex: 5 }} />
        </div>

        {/* Camera dot */}
        <div style={{ position: "absolute", top: "8px", left: "50%", transform: "translateX(-50%)", width: "6px", height: "6px", borderRadius: "50%", background: "#2a2d3e", border: "1px solid rgba(255,255,255,0.12)" }} />
      </div>

      {/* Frosted glass fade below tablet — blends into page */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "0",
          right: "2%",
          width: "60vw",
          maxWidth: "900px",
          height: "100px",
          background: "linear-gradient(to top, rgba(253,252,250,1) 0%, rgba(248,244,238,0.5) 50%, transparent 100%)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 3,
          pointerEvents: "none",
          borderRadius: "0 0 32px 32px",
        }}
      />

      {/* ── Top-to-bottom atmospheric light gradient (Fix 5) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.2) 100%)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* ── Left-to-right gradient overlay — text side stays clean ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, rgba(253,252,250,1) 0%, rgba(253,252,250,0.98) 28%, rgba(253,252,250,0.55) 44%, rgba(253,252,250,0.08) 58%, transparent 70%)",
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



          {/* Headline */}
          <h1
            style={{
              fontFamily: "var(--font-titles)",
              fontSize: "clamp(2.5rem, 4.5vw, 3.8rem)",
              fontWeight: "700",
              lineHeight: 1.07,
              letterSpacing: "-0.01em",
              color: "#1a1209",
              marginBottom: "20px",
            }}
          >
            Turn Every Lead Into a{" "}
            <span style={{ color: "#1a1209" }}>
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

      {/* ── Live indicator strip — anchored below the tablet like a product caption ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "13%",
          right: "3%",
          width: "60vw",
          maxWidth: "900px",
          zIndex: 8,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderRadius: "9999px",
          padding: "7px 18px",
          border: "1px solid rgba(154,92,46,0.15)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          fontSize: "10px",
          color: "rgba(26,18,9,0.55)",
          fontWeight: "600",
          whiteSpace: "nowrap",
          gap: "14px",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", display: "inline-block", animation: "hpulse 2s infinite" }} />
            Live system
          </span>
          <span style={{ color: "rgba(26,18,9,0.2)" }}>·</span>
          <span>⚡ AI replies in 4 sec</span>
          <span style={{ color: "rgba(26,18,9,0.2)" }}>·</span>
          <span>💰 $4,200 recovered this week</span>
          <span style={{ color: "rgba(26,18,9,0.2)" }}>·</span>
          <span>👥 247 leads captured</span>
        </div>
      </div>

      <style>{`
        @keyframes hpulse    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes haloglow  { 0%,100%{opacity:0.7} 50%{opacity:1} }
        @keyframes floatTablet { 0%,100%{transform: translateY(-48%) perspective(2200px) rotateY(-10deg) rotateX(4deg) rotateZ(0.5deg)} 50%{transform: translateY(-52%) perspective(2200px) rotateY(-10deg) rotateX(4deg) rotateZ(0.5deg)} }
        @keyframes glassShine { 0%,100%{opacity:0.4} 50%{opacity:0.8} }

        @media (max-width: 1024px) {
          /* On tablet/mobile, hide the background tablet and go stacked */
        }
      `}</style>
    </section>
  );
}