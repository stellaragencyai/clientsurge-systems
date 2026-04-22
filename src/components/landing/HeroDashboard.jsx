import { useEffect, useRef, useState } from "react";

// Animated counter hook
function useCounter(target, duration = 2000, startDelay = 0) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const delay = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(ease * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, startDelay);
    return () => clearTimeout(delay);
  }, [target, duration, startDelay]);
  return val;
}

const PIPELINE = [
  { label: "New",       count: 24, color: "#6366f1", bg: "rgba(99,102,241,0.08)",  bar: 0.95 },
  { label: "Contacted", count: 18, color: "#c8965c", bg: "rgba(200,150,92,0.1)",   bar: 0.72 },
  { label: "Replied",   count: 11, color: "#a78bfa", bg: "rgba(167,139,250,0.1)",  bar: 0.44 },
  { label: "Booked",    count: 7,  color: "#22c55e", bg: "rgba(34,197,94,0.1)",    bar: 0.28 },
  { label: "Closed",   count: 4,  color: "#f59e0b", bg: "rgba(245,158,11,0.1)",   bar: 0.16 },
];

const RECENT_LEADS = [
  { name: "Sarah M.",   source: "Instagram", status: "Booked",    time: "2m ago",  dot: "#22c55e" },
  { name: "Marcus D.",  source: "Google Ad", status: "Contacted", time: "7m ago",  dot: "#c8965c" },
  { name: "Priya K.",   source: "Facebook",  status: "Replied",   time: "12m ago", dot: "#a78bfa" },
  { name: "Jordan T.",  source: "Referral",  status: "New",       time: "18m ago", dot: "#6366f1" },
  { name: "Alyssa R.",  source: "Instagram", status: "Booked",    time: "31m ago", dot: "#22c55e" },
];

const SMS_THREAD = [
  { role: "ai",   text: "Hey Marcus! Thanks for reaching out 👋 Are you looking to book a consultation this week?" },
  { role: "lead", text: "Yeah, what times do you have?" },
  { role: "ai",   text: "We have Tue 10am, Wed 2pm, or Thu 3pm — which works best for you? 📅" },
];

export default function HeroDashboard() {
  const leads    = useCounter(247, 2200, 300);
  const replied  = useCounter(94,  1800, 500);
  const booked   = useCounter(61,  2000, 700);
  const revenue  = useCounter(4200, 2400, 900);

  const [smsVisible, setSmsVisible] = useState(0);
  useEffect(() => {
    SMS_THREAD.forEach((_, i) => {
      const t = setTimeout(() => setSmsVisible(i + 1), 1200 + i * 1400);
      return () => clearTimeout(t);
    });
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "720px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── TOP STATS ROW ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "10px" }}>
        {[
          { label: "Total Leads",    val: leads,   suffix: "",   color: "#6366f1", icon: "👥" },
          { label: "AI Replied",     val: replied,  suffix: "%",  color: "#c8965c", icon: "⚡" },
          { label: "Booked",         val: booked,   suffix: "%",  color: "#22c55e", icon: "📅" },
          { label: "Revenue Rec.",   val: `$${revenue.toLocaleString()}`, suffix: "", color: "#f59e0b", icon: "💰", raw: true },
        ].map((stat, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(12px)",
            borderRadius: "14px",
            padding: "14px 12px",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: "16px", marginBottom: "4px" }}>{stat.icon}</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: stat.color, lineHeight: 1.1 }}>
              {stat.raw ? stat.val : `${stat.val}${stat.suffix}`}
            </div>
            <div style={{ fontSize: "10px", color: "#999", fontWeight: "600", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── MIDDLE ROW: Pipeline + SMS ────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>

        {/* Pipeline funnel */}
        <div style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderRadius: "14px",
          padding: "16px",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#222", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pipeline</span>
            <span style={{ fontSize: "9px", fontWeight: "600", color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 8px", borderRadius: "20px" }}>Live</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {PIPELINE.map((stage, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "600", color: "#555" }}>{stage.label}</span>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: stage.color }}>{stage.count}</span>
                </div>
                <div style={{ height: "5px", borderRadius: "3px", background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${stage.bar * 100}%`,
                    borderRadius: "3px",
                    background: stage.color,
                    transition: "width 1.2s cubic-bezier(0.34,1.56,0.64,1)",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live SMS thread */}
        <div style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderRadius: "14px",
          padding: "16px",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "9px", fontWeight: "800", color: "#fff" }}>AI</span>
            </div>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#222" }}>Marcus D.</span>
              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: "9px", color: "#888" }}>AI responding</span>
              </div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: "9px", fontWeight: "700", color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 7px", borderRadius: "10px" }}>
              ⚡ 4s
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            {SMS_THREAD.slice(0, smsVisible).map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "ai" ? "flex-start" : "flex-end", animation: "smsIn 0.3s ease-out" }}>
                <div style={{
                  maxWidth: "85%",
                  padding: "6px 9px",
                  borderRadius: msg.role === "ai" ? "3px 10px 10px 10px" : "10px 3px 10px 10px",
                  background: msg.role === "ai" ? "linear-gradient(135deg,#22c55e,#16a34a)" : "#f3f4f6",
                  fontSize: "10px",
                  lineHeight: 1.45,
                  color: msg.role === "ai" ? "#fff" : "#333",
                  boxShadow: msg.role === "ai" ? "0 2px 6px rgba(34,197,94,0.25)" : "none",
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM: Recent Leads Feed ─────────────────────────────── */}
      <div style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderRadius: "14px",
        padding: "16px",
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#222", textTransform: "uppercase", letterSpacing: "0.08em" }}>Recent Leads</span>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "9px", color: "#888", fontWeight: "600" }}>Live feed</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {RECENT_LEADS.map((lead, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 8px", borderRadius: "8px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `${lead.dot}18`, border: `1.5px solid ${lead.dot}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: lead.dot }}>{lead.name[0]}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#222" }}>{lead.name}</span>
                  <span style={{ fontSize: "9px", color: "#aaa" }}>{lead.source}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "9px", fontWeight: "700", color: lead.dot, background: `${lead.dot}15`, padding: "2px 8px", borderRadius: "10px" }}>{lead.status}</span>
                <span style={{ fontSize: "9px", color: "#bbb" }}>{lead.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes smsIn { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}