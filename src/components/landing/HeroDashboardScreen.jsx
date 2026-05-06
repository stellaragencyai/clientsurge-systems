import { useEffect, useRef, useState } from "react";

// ─── Industry Cycles ──────────────────────────────────────────────────────────
const INDUSTRIES = [
  {
    badge: "MED SPA",
    accent: "Bookings.",
    headline: "AI That Fills Your",
    sub: "Respond to every lead in under 60 seconds — even after hours. Our system handles the follow-up so your staff can focus on patients.",
    cardTitle: "Lead Conversion",
    cardSub: "Glow Med Spa · 3 Locations",
    metrics: [{ label: "LEADS TODAY", val: 24 }, { label: "RESPONDED", val: 24 }],
    checks: ["Instant SMS sent", "Follow-up queued", "Booking link shared", "Reminder scheduled"],
    footer: "Avg response: 38 seconds",
    color: "#00AEEF",
  },
  {
    badge: "DENTAL",
    accent: "Appointments.",
    headline: "AI That Books More",
    sub: "Turn missed calls and web inquiries into confirmed appointments — automatically. No extra staff. No dropped leads.",
    cardTitle: "Missed Call Recovery",
    cardSub: "Summit Dental · 2 Offices",
    metrics: [{ label: "MISSED CALLS", val: 11 }, { label: "RECOVERED", val: 10 }],
    checks: ["Text-back sent in 60s", "Patient matched", "Booking link delivered", "Follow-up active"],
    footer: "Recovery rate: 91%",
    color: "#009DFF",
  },
  {
    badge: "HVAC",
    accent: "Service Calls.",
    headline: "AI That Wins More",
    sub: "Beat the competition to every hot lead. Our AI responds instantly, qualifies the job, and books the appointment before they call someone else.",
    cardTitle: "Speed-to-Lead",
    cardSub: "CoolBreeze HVAC · Phoenix",
    metrics: [{ label: "LEADS THIS WEEK", val: 47 }, { label: "BOOKED", val: 39 }],
    checks: ["Lead captured", "Responded in 44s", "Job qualified by AI", "Tech dispatched"],
    footer: "Booking rate: 83%",
    color: "#0088CC",
  },
  {
    badge: "ROOFING",
    accent: "Estimates.",
    headline: "AI That Schedules More",
    sub: "Capture storm-season leads instantly and schedule estimates before your competitors even see the inquiry.",
    cardTitle: "Storm Season Pipeline",
    cardSub: "Peak Roofing · 5 Crews",
    metrics: [{ label: "INQUIRIES", val: 63 }, { label: "ESTIMATES SET", val: 58 }],
    checks: ["Inquiry captured", "Rapid SMS sent", "Estimate scheduled", "Crew notified"],
    footer: "Avg booking time: 6 min",
    color: "#003B8F",
  },
];

// ─── Animated Counter ──────────────────────────────────────────────────────────
function useCounter(target, duration = 1400) {
  const [val, setVal] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    const from = prevTarget.current;
    prevTarget.current = target;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + e * (target - from)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

// ─── Floating Dashboard Card ───────────────────────────────────────────────────
function DashboardCard({ industry, visible }) {
  const val0 = useCounter(industry.metrics[0].val, 1200);
  const val1 = useCounter(industry.metrics[1].val, 1400);
  const [tick, setTick] = useState(0);
  const [flashIdx, setFlashIdx] = useState(null);

  useEffect(() => {
    setTick(0);
    setFlashIdx(null);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTick(i);
      setFlashIdx(i - 1 < industry.checks.length ? i - 1 : null);
    }, 900);
    return () => clearInterval(interval);
  }, [industry]);

  const visibleChecks = Math.min(tick, industry.checks.length);

  return (
    <div
      style={{
        position: "absolute",
        right: "16px",
        top: "50%",
        transform: `translateY(-50%) ${visible ? "translateX(0) scale(1)" : "translateX(40px) scale(0.95)"}`,
        opacity: visible ? 1 : 0,
        transition: "transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease",
        width: "220px",
        background: "rgba(255,255,255,0.96)",
        borderRadius: "18px",
        boxShadow: "0 24px 60px rgba(0,59,143,0.22), 0 4px 16px rgba(0,174,239,0.12)",
        border: "1.5px solid rgba(0,174,239,0.18)",
        padding: "16px",
        zIndex: 10,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: "800", color: "#0A1628", margin: 0, letterSpacing: "-0.01em" }}>{industry.cardTitle}</p>
          <p style={{ fontSize: "9px", color: "rgba(10,22,40,0.45)", margin: "2px 0 0", fontWeight: "600" }}>{industry.cardSub}</p>
        </div>
        <div style={{
          fontSize: "9px", fontWeight: "800", color: industry.color,
          background: `${industry.color}18`, border: `1px solid ${industry.color}40`,
          padding: "2px 8px", borderRadius: "999px", flexShrink: 0,
          letterSpacing: "0.04em",
        }}>
          LIVE
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        {[{ label: industry.metrics[0].label, val: val0 }, { label: industry.metrics[1].label, val: val1 }].map((m) => (
          <div key={m.label} style={{ background: "rgba(0,174,239,0.04)", borderRadius: "10px", padding: "8px", border: "1px solid rgba(0,174,239,0.1)" }}>
            <p style={{ fontSize: "8px", fontWeight: "700", color: "rgba(10,22,40,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>{m.label}</p>
            <p style={{ fontSize: "20px", fontWeight: "900", color: "#0A1628", margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>{m.val}</p>
          </div>
        ))}
      </div>

      {/* Animated checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "10px" }}>
        {industry.checks.map((check, i) => (
          <div
            key={check}
            style={{
              display: "flex", alignItems: "center", gap: "7px",
              opacity: i < visibleChecks ? 1 : 0.2,
              transform: i < visibleChecks ? "translateX(0)" : "translateX(-6px)",
              transition: `opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s`,
            }}
          >
            <div style={{
              width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0,
              background: i < visibleChecks ? "linear-gradient(135deg,#00AEEF,#003B8F)" : "rgba(0,0,0,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.3s ease",
              boxShadow: i < visibleChecks ? "0 2px 6px rgba(0,174,239,0.35)" : "none",
            }}>
              {i < visibleChecks && (
                <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                  <polyline points="2,5 4,7.5 8,2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: "10px", fontWeight: i < visibleChecks ? "700" : "500", color: i < visibleChecks ? "#0A1628" : "rgba(10,22,40,0.35)", transition: "color 0.3s, font-weight 0.3s" }}>{check}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ paddingTop: "8px", borderTop: "1px solid rgba(0,174,239,0.1)", display: "flex", alignItems: "center", gap: "5px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "cardPulse 2s infinite", flexShrink: 0 }} />
        <span style={{ fontSize: "9px", fontWeight: "700", color: "rgba(10,22,40,0.55)" }}>{industry.footer}</span>
      </div>
    </div>
  );
}

// ─── Trust Pills ───────────────────────────────────────────────────────────────
const PILLS = ["⚡ 60s Response", "🤖 AI-Powered", "📍 All Industries", "✅ No Contracts"];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function HeroDashboardScreen() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);

  useEffect(() => {
    // Show card after mount
    const t = setTimeout(() => setCardVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setCardVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % INDUSTRIES.length);
        setFading(false);
        setTimeout(() => setCardVisible(true), 200);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const industry = INDUSTRIES[idx];

  return (
    <div style={{
      position: "relative",
      width: "100%",
      minHeight: "520px",
      borderRadius: "20px",
      overflow: "hidden",
      fontFamily: "-apple-system,'SF Pro Display','Helvetica Neue',sans-serif",
    }}>
      {/* Dark overlay background */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, #0A1628 0%, #0d2044 40%, #061230 100%)",
        borderRadius: "20px",
      }} />

      {/* Blue radial glow */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "20px", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "70%", height: "70%", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,174,239,0.18) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "20%", width: "60%", height: "60%", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,59,143,0.25) 0%, transparent 70%)", filter: "blur(40px)" }} />
        {/* Grid lines */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00AEEF" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Main content */}
      <div style={{
        position: "relative", zIndex: 2,
        padding: "32px 240px 28px 32px",
        display: "flex", flexDirection: "column", gap: "16px",
        minHeight: "520px",
      }}>

        {/* Industry badge */}
        <div style={{
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(-4px)" : "translateY(0)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
          display: "inline-flex",
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(0,174,239,0.12)",
            border: "1px solid rgba(0,174,239,0.35)",
            borderRadius: "999px", padding: "4px 14px",
            fontSize: "10px", fontWeight: "800", color: "#00AEEF",
            letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00AEEF", boxShadow: "0 0 6px #00AEEF", animation: "cardPulse 1.8s infinite", display: "inline-block" }} />
            {industry.badge}
          </span>
        </div>

        {/* Headline */}
        <div style={{
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(6px)" : "translateY(0)",
          transition: "opacity 0.4s ease 0.05s, transform 0.4s ease 0.05s",
        }}>
          <h2 style={{
            fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
            fontWeight: "800",
            color: "#ffffff",
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: "-0.03em",
          }}>
            {industry.headline}{" "}
            <span style={{
              color: industry.color,
              display: "inline-block",
              filter: `drop-shadow(0 0 12px ${industry.color}80)`,
            }}>
              {industry.accent}
            </span>
          </h2>
          {/* Blue underline accent */}
          <div style={{ width: "40px", height: "3px", background: `linear-gradient(90deg, ${industry.color}, transparent)`, borderRadius: "2px", marginTop: "10px" }} />
        </div>

        {/* Subtext */}
        <p style={{
          fontSize: "13px", color: "rgba(255,255,255,0.65)", lineHeight: 1.65,
          maxWidth: "320px", margin: 0,
          opacity: fading ? 0 : 1,
          transition: "opacity 0.4s ease 0.1s",
        }}>
          {industry.sub}
        </p>

        {/* Trust pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
          {PILLS.map((pill, i) => (
            <span key={pill} style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "999px",
              padding: "4px 12px",
              fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.8)",
              animation: `pillFadeIn 0.4s ease ${i * 0.07}s both`,
            }}>
              {pill}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              // bubble up to Hero's openDemoBooking via window event
              window.dispatchEvent(new CustomEvent("clientsurge:open-demo"));
            }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              background: "linear-gradient(135deg, #00AEEF 0%, #0088CC 50%, #003B8F 100%)",
              color: "#ffffff", fontWeight: "700", fontSize: "12px",
              padding: "10px 22px", borderRadius: "999px", border: "none", cursor: "pointer",
              boxShadow: "0 4px 18px rgba(0,174,239,0.45)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,174,239,0.6)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,174,239,0.45)"; }}
          >
            Make the Leap
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button
            type="button"
            style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              background: "transparent", color: "rgba(255,255,255,0.7)",
              fontWeight: "600", fontSize: "12px",
              padding: "10px 0", border: "none", cursor: "pointer",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#ffffff"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
          >
            See How It Works
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>

        {/* Bottom stats ticker */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "8px",
          paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)",
          marginTop: "auto",
        }}>
          {["Pay-as-you-go", "3x avg bookings", "0 upfront deposit", "Live in 24–48 hrs"].map((item) => (
            <span key={item} style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              background: "rgba(0,0,0,0.25)", borderRadius: "999px",
              padding: "3px 10px", fontSize: "9px", fontWeight: "700",
              color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Floating Dashboard Card */}
      <DashboardCard industry={industry} visible={cardVisible} />

      <style>{`
        @keyframes cardPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
        @keyframes pillFadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}