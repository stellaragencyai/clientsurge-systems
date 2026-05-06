import { useEffect, useRef, useState, useCallback } from "react";

// ─── Industry Data ─────────────────────────────────────────────────────────
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
  notification: "🔔 New lead captured · Glow Med Spa",
  navIcon: "💆"
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
  notification: "📅 Appointment booked · Summit Dental",
  navIcon: "🦷"
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
  notification: "⚡ Lead responded · CoolBreeze HVAC",
  navIcon: "❄️"
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
  notification: "🏠 Estimate scheduled · Peak Roofing",
  navIcon: "🏗️"
}];


const CYCLE_DURATION = 5000;

// ─── Animated Counter ─────────────────────────────────────────────────────
function useCounter(target, duration = 1200) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
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

// ─── Live Clock ──────────────────────────────────────────────────────────
function useLiveClock() {
  const [time, setTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  });
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setTime(d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    }, 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

// ─── iOS Status Bar ──────────────────────────────────────────────────────
function StatusBar({ color }) {
  const time = useLiveClock();
  return (
    <div style={{
      height: "28px",
      background: "rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px",
      fontSize: "11px", fontWeight: "700",
      color: "rgba(255,255,255,0.92)",
      letterSpacing: "0.01em",
      flexShrink: 0
    }}>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{time}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        {/* Signal bars */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "2px" }}>
          {[4, 6, 8, 10].map((h, i) =>
          <div key={i} style={{ width: "3px", height: `${h}px`, background: i < 3 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)", borderRadius: "1px" }} />
          )}
        </div>
        {/* WiFi icon */}
        <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
          <path d="M6.5 8.5a1 1 0 100 2 1 1 0 000-2z" fill="rgba(255,255,255,0.9)" />
          <path d="M3.5 6.2C4.4 5.4 5.4 5 6.5 5s2.1.4 3 1.2" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M1 3.8C2.6 2.3 4.4 1.5 6.5 1.5S10.4 2.3 12 3.8" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </svg>
        {/* Battery */}
        <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
          <div style={{ width: "20px", height: "10px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.6)", padding: "1.5px", display: "flex", alignItems: "center" }}>
            <div style={{ width: "70%", height: "100%", background: "#4ade80", borderRadius: "1px" }} />
          </div>
          <div style={{ width: "2px", height: "5px", background: "rgba(255,255,255,0.5)", borderRadius: "0 1px 1px 0" }} />
        </div>
      </div>
    </div>);

}

// ─── Notification Banner ─────────────────────────────────────────────────
function NotificationBanner({ text, visible }) {
  return (
    <div style={{
      position: "absolute",
      top: "34px",
      left: "50%",
      transform: `translateX(-50%) translateY(${visible ? "0" : "-60px"})`,
      opacity: visible ? 1 : 0,
      transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
      zIndex: 30,
      background: "rgba(30,30,35,0.92)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: "16px",
      padding: "8px 16px",
      display: "flex", alignItems: "center", gap: "8px",
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      whiteSpace: "nowrap",
      fontSize: "11px", fontWeight: "600",
      color: "rgba(255,255,255,0.92)"
    }}>
      <div style={{ width: "20px", height: "20px", borderRadius: "5px", background: "linear-gradient(135deg,#00AEEF,#003B8F)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
        ⚡
      </div>
      <span>{text}</span>
    </div>);

}

// ─── Progress Dots ───────────────────────────────────────────────────────
function ProgressDots({ activeIdx, progress, onSelect }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", padding: "8px 0" }}>
      {INDUSTRIES.map((_, i) =>
      <button
        key={i}
        onClick={() => onSelect(i)}
        style={{
          width: i === activeIdx ? "24px" : "7px",
          height: "7px",
          borderRadius: "9999px",
          background: i === activeIdx ? "linear-gradient(90deg,#00AEEF,#003B8F)" : "rgba(255,255,255,0.25)",
          border: "none", cursor: "pointer", padding: 0,
          transition: "width 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.3s ease",
          position: "relative", overflow: "hidden"
        }}>
        
          {i === activeIdx &&
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${progress}%`,
          background: "rgba(255,255,255,0.45)",
          borderRadius: "9999px",
          transition: "width 0.1s linear"
        }} className="hidden" />
        }
        </button>
      )}
    </div>);

}

// ─── Left Nav Sidebar ────────────────────────────────────────────────────
function NavSidebar({ activeIdx, onSelect, color }) {
  return null;





































}

// ─── Dashboard Card (Glassmorphism) ─────────────────────────────────────
function DashboardCard({ industry, visible }) {
  const val0 = useCounter(industry.metrics[0].val, 1200);
  const val1 = useCounter(industry.metrics[1].val, 1400);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setTick(0);
    let i = 0;
    const interval = setInterval(() => {i++;setTick(i);}, 900);
    return () => clearInterval(interval);
  }, [industry]);

  const visibleChecks = Math.min(tick, industry.checks.length);

  return (
    <div style={{
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: `translateY(-50%) ${visible ? "translateX(0) scale(1)" : "translateX(30px) scale(0.95)"}`,
      opacity: visible ? 1 : 0,
      transition: "transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease",
      width: "190px",
      // Enhancement #14: iOS glassmorphism card
      background: "rgba(255,255,255,0.12)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderRadius: "18px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
      border: "1px solid rgba(255,255,255,0.2)",
      padding: "14px",
      zIndex: 10
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
        <div>
          <p style={{ fontSize: "10px", fontWeight: "800", color: "rgba(255,255,255,0.9)", margin: 0, letterSpacing: "-0.01em" }}>{industry.cardTitle}</p>
          <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.45)", margin: "2px 0 0", fontWeight: "600" }}>{industry.cardSub}</p>
        </div>
        <span style={{ fontSize: "8px", fontWeight: "800", color: "#4ade80", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", padding: "2px 7px", borderRadius: "999px", letterSpacing: "0.04em" }}>LIVE</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "10px" }}>
        {[{ label: industry.metrics[0].label, val: val0 }, { label: industry.metrics[1].label, val: val1 }].map((m) =>
        <div key={m.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "10px", padding: "7px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ fontSize: "7px", fontWeight: "700", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 3px" }}>{m.label}</p>
            <p style={{ fontSize: "18px", fontWeight: "900", color: "#fff", margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>{m.val}</p>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "8px" }}>
        {industry.checks.map((check, i) =>
        <div key={check} style={{
          display: "flex", alignItems: "center", gap: "6px",
          opacity: i < visibleChecks ? 1 : 0.2,
          transform: i < visibleChecks ? "translateX(0)" : "translateX(-4px)",
          transition: `opacity 0.3s ease ${i * 0.08}s, transform 0.3s ease ${i * 0.08}s`
        }}>
            <div style={{
            width: "13px", height: "13px", borderRadius: "50%", flexShrink: 0,
            background: i < visibleChecks ? `linear-gradient(135deg,#00AEEF,#003B8F)` : "rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: i < visibleChecks ? "0 2px 6px rgba(0,174,239,0.4)" : "none"
          }}>
              {i < visibleChecks && <svg width="7" height="7" viewBox="0 0 10 10" fill="none"><polyline points="2,5 4,7.5 8,2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
            <span style={{ fontSize: "9px", fontWeight: i < visibleChecks ? "700" : "500", color: i < visibleChecks ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)" }}>{check}</span>
          </div>
        )}
      </div>

      <div style={{ paddingTop: "7px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "5px" }}>
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 5px #4ade80", animation: "ipadPulse 2s infinite", flexShrink: 0 }} />
        <span style={{ fontSize: "8px", fontWeight: "700", color: "rgba(255,255,255,0.5)" }}>{industry.footer}</span>
      </div>
    </div>);

}

// ─── App Dock ────────────────────────────────────────────────────────────
function AppDock() {
  const apps = [
  { icon: "💬", label: "Messages" },
  { icon: "📅", label: "Calendar" },
  { icon: "⚡", label: "ClientSurge" },
  { icon: "⚙️", label: "Settings" }];

  return (
    <div style={{
      display: "flex", justifyContent: "center",
      padding: "6px 0 8px",
      background: "rgba(0,0,0,0.2)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      flexShrink: 0
    }}>
      <div style={{
        display: "flex", gap: "14px", alignItems: "center",
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.15)",
        padding: "6px 14px"
      }}>
        {apps.map((app) =>
        <div key={app.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}>
              {app.icon}
            </div>
            <span style={{ fontSize: "7px", color: "rgba(255,255,255,0.55)", fontWeight: "600" }}>{app.label}</span>
          </div>
        )}
      </div>
    </div>);

}

// ─── Main Screen Content ─────────────────────────────────────────────────
function ScreenContent({ industry, fading, cardVisible }) {
  const PILLS = ["⚡ 60s Response", "🤖 AI-Powered", "📍 All Industries", "✅ No Contracts"];

  return (
    <div style={{
      flex: 1, display: "flex", overflow: "hidden", position: "relative"
    }}>
      {/* Grid background */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04, pointerEvents: "none" }} xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="ipadgrid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#00AEEF" strokeWidth="0.5" />
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#ipadgrid)" />
      </svg>

      {/* Blue glow orbs */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-15%", left: "-5%", width: "55%", height: "55%", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,174,239,0.2) 0%, transparent 70%)", filter: "blur(30px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "15%", width: "50%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,59,143,0.28) 0%, transparent 70%)", filter: "blur(30px)" }} />
      </div>

      {/* Main content area — split view */}
      <div style={{
        flex: 1, padding: "16px 200px 12px 16px",
        display: "flex", flexDirection: "column", gap: "10px",
        position: "relative", zIndex: 2,
        opacity: fading ? 0 : 1,
        transform: fading ? "translateY(4px)" : "translateY(0)",
        transition: "opacity 0.35s ease, transform 0.35s ease"
      }}>
        {/* Industry badge */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          background: "rgba(0,174,239,0.15)", border: "1px solid rgba(0,174,239,0.4)",
          borderRadius: "999px", padding: "3px 12px",
          fontSize: "9px", fontWeight: "800", color: "#00AEEF",
          letterSpacing: "0.12em", textTransform: "uppercase",
          alignSelf: "flex-start"
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00AEEF", display: "inline-block", animation: "ipadPulse 1.8s infinite" }} />
          {industry.badge}
        </span>

        {/* Headline */}
        <h2 style={{
          fontSize: "clamp(1.1rem, 2.8vw, 1.6rem)",
          fontWeight: "800", color: "#ffffff", lineHeight: 1.1,
          margin: 0, letterSpacing: "-0.03em",
          fontFamily: "-apple-system,'SF Pro Display','Helvetica Neue',sans-serif"
        }}>
          {industry.headline}{" "}
          <span style={{ color: industry.color, filter: `drop-shadow(0 0 10px ${industry.color}80)` }}>
            {industry.accent}
          </span>
        </h2>
        {/* iOS hairline divider */}
        <div style={{ width: "36px", height: "2px", background: `linear-gradient(90deg, ${industry.color}, transparent)`, borderRadius: "2px" }} />

        {/* Subtext */}
        <p style={{
          fontSize: "11px", color: "rgba(255,255,255,0.62)", lineHeight: 1.6,
          maxWidth: "260px", margin: 0,
          fontFamily: "-apple-system,'SF Pro Text','Helvetica Neue',sans-serif",
          fontWeight: "400"
        }}>
          {industry.sub}
        </p>

        {/* Trust pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {PILLS.map((pill) =>
          <span key={pill} style={{
            display: "inline-flex", alignItems: "center",
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)",
            borderRadius: "999px", padding: "3px 9px",
            fontSize: "9px", fontWeight: "700", color: "rgba(255,255,255,0.78)"
          }}>{pill}</span>
          )}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("clientsurge:open-demo"))}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px", alignSelf: "flex-start",
            background: "linear-gradient(135deg, #00AEEF 0%, #0088CC 50%, #003B8F 100%)",
            color: "#ffffff", fontWeight: "700", fontSize: "11px",
            padding: "8px 18px", borderRadius: "999px", border: "none", cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0,174,239,0.45)",
            transition: "transform 0.2s, box-shadow 0.2s",
            fontFamily: "-apple-system,'SF Pro Display','Helvetica Neue',sans-serif"
          }}
          onMouseEnter={(e) => {e.currentTarget.style.transform = "scale(1.05)";}}
          onMouseLeave={(e) => {e.currentTarget.style.transform = "scale(1)";}}>
          
          Make the Leap
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        {/* iOS-style section divider */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", borderRadius: "1px", margin: "2px 0" }} />

        {/* Stats ticker */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {["Pay-as-you-go", "3x avg bookings", "Live in 24–48 hrs"].map((item) =>
          <span key={item} style={{
            display: "inline-flex", alignItems: "center",
            background: "rgba(0,0,0,0.2)", borderRadius: "999px",
            padding: "2px 8px", fontSize: "8px", fontWeight: "700",
            color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.07)"
          }}>{item}</span>
          )}
        </div>
      </div>

      {/* Floating Glassmorphism Card */}
      <DashboardCard industry={industry} visible={cardVisible} />
    </div>);

}

// ─── iPad Chassis ────────────────────────────────────────────────────────
function iPadChassis({ children }) {
  return (
    <div style={{
      position: "relative",
      // Enhancement #1: Realistic chassis with metallic gradient
      background: "linear-gradient(145deg, #2a2a2e 0%, #1c1c1f 30%, #141416 60%, #1a1a1d 100%)",
      borderRadius: "28px",
      padding: "14px",
      boxShadow: [
      "0 0 0 1px rgba(255,255,255,0.06)", // inner rim
      "0 2px 0 1px rgba(255,255,255,0.12)", // top highlight
      "0 32px 80px rgba(0,0,0,0.6)", // deep ambient shadow
      "0 8px 24px rgba(0,0,0,0.4)", // mid shadow
      "0 2px 6px rgba(0,0,0,0.3)" // close shadow
      ].join(", "),
      // Enhancement #5: Depth highlight rim
      outline: "1.5px solid rgba(255,255,255,0.05)"
    }}>
      {/* Enhancement #2: Sleep/wake button on right side */}
      <div style={{
        position: "absolute", right: "-4px", top: "80px",
        width: "4px", height: "36px",
        background: "linear-gradient(to right, #1c1c1f, #2a2a2e)",
        borderRadius: "0 3px 3px 0",
        boxShadow: "2px 0 4px rgba(0,0,0,0.4)"
      }} />
      {/* Volume buttons on left */}
      <div style={{ position: "absolute", left: "-4px", top: "70px", width: "4px", height: "26px", background: "linear-gradient(to left,#1c1c1f,#2a2a2e)", borderRadius: "3px 0 0 3px", boxShadow: "-2px 0 4px rgba(0,0,0,0.3)" }} />
      <div style={{ position: "absolute", left: "-4px", top: "104px", width: "4px", height: "26px", background: "linear-gradient(to left,#1c1c1f,#2a2a2e)", borderRadius: "3px 0 0 3px", boxShadow: "-2px 0 4px rgba(0,0,0,0.3)" }} />

      {/* Enhancement #3: Front camera dot at top bezel */}
      <div style={{
        position: "absolute", top: "7px", left: "50%",
        transform: "translateX(-50%)",
        width: "7px", height: "7px", borderRadius: "50%",
        background: "#0d0d0f",
        boxShadow: "inset 0 0 2px rgba(255,255,255,0.1), 0 0 3px rgba(0,174,239,0.15)",
        border: "1px solid rgba(255,255,255,0.06)"
      }} />

      {/* Screen bezel inset with subtle inner shadow */}
      <div style={{
        borderRadius: "18px",
        overflow: "hidden",
        background: "#0A1628",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.5), inset 0 2px 8px rgba(0,0,0,0.4)",
        position: "relative"
      }}>
        {/* Enhancement #4: Screen glare overlay */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, zIndex: 50, pointerEvents: "none",
          borderRadius: "18px",
          background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 25%, transparent 50%)"
        }} />
        {children}
      </div>

      {/* Enhancement #2: Home indicator bar at bottom */}
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        paddingTop: "8px"
      }}>
        <div style={{
          width: "36px", height: "4px", borderRadius: "9999px",
          background: "rgba(255,255,255,0.18)"
        }} />
      </div>
    </div>);

}

// ─── Main Export ─────────────────────────────────────────────────────────
export default function HeroDashboardScreen() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);
  const touchStartX = useRef(null);
  const cycleRef = useRef(null);

  const goToIndex = useCallback((newIdx) => {
    setFading(true);
    setCardVisible(false);
    setNotifVisible(false);
    setProgress(0);
    clearInterval(cycleRef.current);
    setTimeout(() => {
      setIdx(newIdx);
      setFading(false);
      setTimeout(() => {
        setCardVisible(true);
        setNotifVisible(true);
        setTimeout(() => setNotifVisible(false), 2500);
      }, 200);
    }, 380);
  }, []);

  const advance = useCallback(() => {
    setIdx((i) => {
      const next = (i + 1) % INDUSTRIES.length;
      goToIndex(next);
      return i; // goToIndex handles the actual update
    });
  }, [goToIndex]);

  // Enhancement #8: Auto-cycle with progress tracking
  useEffect(() => {
    const t = setTimeout(() => setCardVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setProgress(0);
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(elapsed / CYCLE_DURATION * 100, 100));
    }, 50);

    cycleRef.current = setTimeout(() => {
      setIdx((i) => {
        const next = (i + 1) % INDUSTRIES.length;
        goToIndex(next);
        return i;
      });
    }, CYCLE_DURATION);

    return () => {
      clearInterval(progressRef.current);
      clearTimeout(cycleRef.current);
    };
  }, [idx]);

  // Enhancement #9: Notification on mount
  useEffect(() => {
    const t = setTimeout(() => {
      setNotifVisible(true);
      setTimeout(() => setNotifVisible(false), 2500);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // Enhancement #7: Swipe gesture support
  const handleTouchStart = (e) => {touchStartX.current = e.touches[0].clientX;};
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      const next = diff > 0 ?
      (idx + 1) % INDUSTRIES.length :
      (idx - 1 + INDUSTRIES.length) % INDUSTRIES.length;
      goToIndex(next);
    }
    touchStartX.current = null;
  };

  const industry = INDUSTRIES[idx];

  const ChassisEl = iPadChassis;

  return (
    <div
      style={{ width: "100%", fontFamily: "-apple-system,'SF Pro Display','Helvetica Neue',sans-serif" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}>
      
      <ChassisEl>
        {/* Full screen layout */}
        <div style={{
          display: "flex", flexDirection: "column",
          background: "linear-gradient(135deg, #0A1628 0%, #0d2044 45%, #061230 100%)",
          height: "480px"
        }}>
          {/* Enhancement #6/#11: iOS Status Bar */}
          <StatusBar color={industry.color} />

          {/* Enhancement #9: Notification Banner */}
          <NotificationBanner text={industry.notification} visible={notifVisible} />

          {/* Enhancement #13: Split-view layout — sidebar + content */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Enhancement #13: Left nav sidebar */}
            <NavSidebar activeIdx={idx} onSelect={goToIndex} color={industry.color} />

            {/* Main content */}
            <ScreenContent industry={industry} fading={fading} cardVisible={cardVisible} />
          </div>

          {/* Enhancement #8: Progress dots */}
          <ProgressDots activeIdx={idx} progress={progress} onSelect={goToIndex} />

          {/* Enhancement #12: App dock */}
          <AppDock />
        </div>
      </ChassisEl>

      <style>{`
        @keyframes ipadPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.4; transform:scale(0.85); }
        }
      `}</style>
    </div>);

}