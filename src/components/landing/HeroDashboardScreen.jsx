import { useEffect, useRef, useState } from "react";

// ── Animated counter ──────────────────────────────────────────────────────────
function useCounter(target, duration = 2000, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(ease * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return val;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const PIPELINE = [
  { label: "New",        count: 24, color: "#6366f1", w: "95%" },
  { label: "Contacted",  count: 18, color: "#c8965c", w: "72%" },
  { label: "Replied",    count: 11, color: "#a78bfa", w: "44%" },
  { label: "Booked",     count:  7, color: "#22c55e", w: "28%" },
  { label: "Closed",     count:  4, color: "#f59e0b", w: "16%" },
];

const LEADS = [
  { name: "Sarah M.",  src: "Instagram", status: "Booked",    dot: "#22c55e", t: "2m" },
  { name: "Marcus D.", src: "Google Ad", status: "Contacted", dot: "#c8965c", t: "7m" },
  { name: "Priya K.",  src: "Facebook",  status: "Replied",   dot: "#a78bfa", t: "12m" },
  { name: "Jordan T.", src: "Referral",  status: "New",       dot: "#6366f1", t: "18m" },
  { name: "Alyssa R.", src: "Instagram", status: "Booked",    dot: "#22c55e", t: "31m" },
];

const SMS = [
  { r: "ai",   t: "Hey Marcus! Looking to book a consult this week? 👋" },
  { r: "lead", t: "Yeah what times do you have?" },
  { r: "ai",   t: "Tue 10am, Wed 2pm, or Thu 3pm — which works? 📅" },
];

// ── The full dashboard rendered inside the tablet screen ──────────────────────
export default function HeroDashboardScreen() {
  const leads   = useCounter(247,  2200, 400);
  const replied = useCounter(94,   1800, 600);
  const booked  = useCounter(61,   2000, 800);
  const revenue = useCounter(4200, 2400, 1000);
  const [smsVis, setSmsVis] = useState(0);

  useEffect(() => {
    SMS.forEach((_, i) => {
      const t = setTimeout(() => setSmsVis(i + 1), 1400 + i * 1500);
      return () => clearTimeout(t);
    });
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", background: "#0f1117", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>

      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#fff" }}>CS</span>
          </div>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>ClientSurge Dashboard</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", animation: "hPulse 2s infinite" }} />
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "600" }}>Live · Today</span>
        </div>
      </div>

      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
        {[
          { icon: "👥", label: "Total Leads",  val: leads,   suffix: "",   color: "#6366f1", glow: "rgba(99,102,241,0.3)" },
          { icon: "⚡", label: "AI Replied",   val: replied,  suffix: "%",  color: "#c8965c", glow: "rgba(200,150,92,0.3)" },
          { icon: "📅", label: "Booked",       val: booked,   suffix: "%",  color: "#22c55e", glow: "rgba(34,197,94,0.3)"  },
          { icon: "💰", label: "Revenue Rec.", val: `$${revenue.toLocaleString()}`, raw: true, color: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
        ].map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 10px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: s.color, boxShadow: `0 0 10px ${s.glow}` }} />
            <div style={{ fontSize: "14px", marginBottom: "5px" }}>{s.icon}</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: s.color, lineHeight: 1, textShadow: `0 0 20px ${s.glow}` }}>
              {s.raw ? s.val : `${s.val}${s.suffix}`}
            </div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", flex: 1, minHeight: 0 }}>

        {/* Pipeline */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pipeline</span>
            <span style={{ fontSize: "9px", fontWeight: "700", color: "#22c55e", background: "rgba(34,197,94,0.12)", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(34,197,94,0.2)" }}>Live</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px", flex: 1 }}>
            {PIPELINE.map((p, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)", fontWeight: "500" }}>{p.label}</span>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: p.color }}>{p.count}</span>
                </div>
                <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: p.w, background: p.color, borderRadius: "2px", boxShadow: `0 0 8px ${p.color}80`, transition: "width 1.4s cubic-bezier(0.34,1.2,0.64,1)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live SMS */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 10px rgba(200,150,92,0.4)" }}>
              <span style={{ fontSize: "9px", fontWeight: "800", color: "#fff" }}>AI</span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>Marcus D.</span>
              <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "1px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e" }} />
                <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)" }}>AI responding</span>
              </div>
            </div>
            <div style={{ fontSize: "9px", fontWeight: "800", color: "#22c55e", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", padding: "3px 8px", borderRadius: "10px", boxShadow: "0 0 10px rgba(34,197,94,0.2)" }}>
              ⚡ 4s
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", justifyContent: "flex-end" }}>
            {SMS.slice(0, smsVis).map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.r === "ai" ? "flex-start" : "flex-end", animation: "sIn 0.3s ease-out" }}>
                <div style={{ maxWidth: "80%", padding: "6px 9px", borderRadius: m.r === "ai" ? "3px 10px 10px 10px" : "10px 3px 10px 10px", background: m.r === "ai" ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(255,255,255,0.1)", fontSize: "10px", lineHeight: 1.45, color: "#fff", boxShadow: m.r === "ai" ? "0 2px 10px rgba(34,197,94,0.35)" : "none" }}>
                  {m.t}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lead feed */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Recent Leads</span>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", animation: "hPulse 2s infinite", boxShadow: "0 0 5px #22c55e" }} />
            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>Live feed</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {LEADS.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 6px", borderRadius: "8px", background: "rgba(255,255,255,0.03)" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: `${l.dot}20`, border: `1.5px solid ${l.dot}50`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 8px ${l.dot}40`, flexShrink: 0 }}>
                <span style={{ fontSize: "10px", fontWeight: "800", color: l.dot }}>{l.name[0]}</span>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "rgba(255,255,255,0.75)", flex: 1 }}>{l.name}</span>
              <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>{l.src}</span>
              <span style={{ fontSize: "9px", fontWeight: "700", color: l.dot, background: `${l.dot}15`, padding: "2px 7px", borderRadius: "8px", border: `1px solid ${l.dot}30` }}>{l.status}</span>
              <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", minWidth: "22px", textAlign: "right" }}>{l.t}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes hPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes sIn    { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}