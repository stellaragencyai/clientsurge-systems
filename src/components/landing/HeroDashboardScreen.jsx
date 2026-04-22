import { useEffect, useRef, useState } from "react";

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

  // Light theme colors
  const bg = "#f8f5f0";
  const cardBg = "#ffffff";
  const cardBorder = "rgba(0,0,0,0.07)";
  const textPrimary = "#1a1209";
  const textMuted = "rgba(26,18,9,0.45)";
  const headerBg = "#ffffff";
  const sectionBg = "#f0ece6";

  return (
    <div style={{ width: "100%", height: "100%", background: bg, borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>

      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: headerBg, borderRadius: "10px", padding: "8px 12px", border: `1px solid ${cardBorder}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#fff" }}>CS</span>
          </div>
          <span style={{ fontSize: "12px", fontWeight: "700", color: textPrimary }}>ClientSurge Dashboard</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", animation: "hPulse 2s infinite" }} />
          <span style={{ fontSize: "10px", color: textMuted, fontWeight: "600" }}>Live · Today</span>
        </div>
      </div>

      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
        {[
          { icon: "👥", label: "Total Leads",  val: leads,   suffix: "",   color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
          { icon: "⚡", label: "AI Replied",   val: replied,  suffix: "%",  color: "#c8965c", bg: "rgba(200,150,92,0.1)" },
          { icon: "📅", label: "Booked",       val: booked,   suffix: "%",  color: "#22c55e", bg: "rgba(34,197,94,0.08)"  },
          { icon: "💰", label: "Revenue Rec.", val: `$${revenue.toLocaleString()}`, raw: true, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
        ].map((s, i) => (
          <div key={i} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "12px 10px", position: "relative", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: s.color, borderRadius: "12px 12px 0 0" }} />
            <div style={{ fontSize: "14px", marginBottom: "5px" }}>{s.icon}</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: s.color, lineHeight: 1 }}>
              {s.raw ? s.val : `${s.val}${s.suffix}`}
            </div>
            <div style={{ fontSize: "9px", color: textMuted, marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", flex: 1, minHeight: 0 }}>

        {/* Pipeline */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Pipeline</span>
            <span style={{ fontSize: "9px", fontWeight: "700", color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(34,197,94,0.2)" }}>Live</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px", flex: 1 }}>
            {PIPELINE.map((p, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "10px", color: textMuted, fontWeight: "500" }}>{p.label}</span>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: p.color }}>{p.count}</span>
                </div>
                <div style={{ height: "4px", borderRadius: "2px", background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: p.w, background: p.color, borderRadius: "2px", transition: "width 1.4s cubic-bezier(0.34,1.2,0.64,1)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live SMS */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "9px", fontWeight: "800", color: "#fff" }}>AI</span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: textPrimary }}>Marcus D.</span>
              <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "1px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e" }} />
                <span style={{ fontSize: "9px", color: textMuted }}>AI responding</span>
              </div>
            </div>
            <div style={{ fontSize: "9px", fontWeight: "800", color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "3px 8px", borderRadius: "10px" }}>
              ⚡ 4s
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", justifyContent: "flex-end" }}>
            {SMS.slice(0, smsVis).map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.r === "ai" ? "flex-start" : "flex-end", animation: "sIn 0.3s ease-out" }}>
                <div style={{ maxWidth: "80%", padding: "6px 9px", borderRadius: m.r === "ai" ? "3px 10px 10px 10px" : "10px 3px 10px 10px", background: m.r === "ai" ? "linear-gradient(135deg,#22c55e,#16a34a)" : "#e8e4de", fontSize: "10px", lineHeight: 1.45, color: m.r === "ai" ? "#fff" : textPrimary, boxShadow: m.r === "ai" ? "0 2px 8px rgba(34,197,94,0.25)" : "none" }}>
                  {m.t}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lead feed */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "12px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Recent Leads</span>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", animation: "hPulse 2s infinite", boxShadow: "0 0 5px #22c55e" }} />
            <span style={{ fontSize: "9px", color: textMuted }}>Live feed</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {LEADS.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 6px", borderRadius: "8px", background: sectionBg }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: `${l.dot}18`, border: `1.5px solid ${l.dot}60`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "10px", fontWeight: "800", color: l.dot }}>{l.name[0]}</span>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "600", color: textPrimary, flex: 1 }}>{l.name}</span>
              <span style={{ fontSize: "9px", color: textMuted }}>{l.src}</span>
              <span style={{ fontSize: "9px", fontWeight: "700", color: l.dot, background: `${l.dot}15`, padding: "2px 7px", borderRadius: "8px", border: `1px solid ${l.dot}30` }}>{l.status}</span>
              <span style={{ fontSize: "9px", color: textMuted, minWidth: "22px", textAlign: "right" }}>{l.t}</span>
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