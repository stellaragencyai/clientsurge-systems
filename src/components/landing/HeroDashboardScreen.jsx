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
  { label: "New",       count: 24, color: "#6366f1", w: "95%" },
  { label: "Contacted", count: 18, color: "#c8965c", w: "72%" },
  { label: "Replied",   count: 11, color: "#a78bfa", w: "44%" },
  { label: "Booked",    count:  7, color: "#22c55e", w: "28%" },
  { label: "Closed",   count:  4, color: "#f59e0b", w: "16%" },
];

const CONVERSATIONS = [
  {
    lead: "Marcus D.",
    messages: [
      { r: "ai",   t: "Hey Marcus! Looking to book a consult this week? 👋" },
      { r: "lead", t: "Yeah what times do you have?" },
      { r: "ai",   t: "Tue 10am, Wed 2pm, or Thu 3pm — which works? 📅" },
    ],
  },
  {
    lead: "Priya K.",
    messages: [
      { r: "ai",   t: "Hi Priya! Saw your inquiry about our services 😊" },
      { r: "lead", t: "Yes! What's included in the starter plan?" },
      { r: "ai",   t: "Instant response + 14-day follow-up + booking flow ✅" },
    ],
  },
  {
    lead: "Jordan T.",
    messages: [
      { r: "ai",   t: "Hey Jordan! Ready to turn more leads into bookings? 🚀" },
      { r: "lead", t: "Definitely — how fast does it get set up?" },
      { r: "ai",   t: "Live in 5–7 days, we handle everything for you 🙌" },
    ],
  },
];

const NOTIFICATIONS = [
  { from: "Glow Med Spa",    preview: "Interested in your services, what's the pricing?" },
  { from: "Peak Health Clinic", preview: "Can we book a demo for next Tuesday?" },
  { from: "Luxe Aesthetics",  preview: "Just submitted the intake form — follow up?" },
];

const PAYMENT_NOTIFICATIONS = [
  { type: "venmo", from: "Zenith Wellness", amount: "+$280", sender: "Maya Chen", avatar: "🎯" },
  { type: "cashapp", from: "Radiant Spas Inc", amount: "+$420", sender: "Jordan T.", avatar: "💚" },
  { type: "venmo", from: "Luxe Aesthetics", amount: "+$150", sender: "Sarah M.", avatar: "✨" },
  { type: "cashapp", from: "Peak Health", amount: "+$320", sender: "Alex K.", avatar: "💚" },
];

const LIVE_LEADS_POOL = [
  { name: "Sarah M.",   src: "Instagram", status: "Booked",    dot: "#22c55e" },
  { name: "Marcus D.",  src: "Google Ad", status: "Contacted", dot: "#c8965c" },
  { name: "Priya K.",   src: "Facebook",  status: "Replied",   dot: "#a78bfa" },
  { name: "Jordan T.",  src: "Referral",  status: "New",       dot: "#6366f1" },
  { name: "Alyssa R.",  src: "Instagram", status: "Booked",    dot: "#22c55e" },
  { name: "Devon L.",   src: "TikTok",    status: "New",       dot: "#6366f1" },
  { name: "Maya S.",    src: "Google Ad", status: "Replied",   dot: "#a78bfa" },
  { name: "Carlos R.",  src: "Referral",  status: "Booked",    dot: "#22c55e" },
];

// iOS-style Status Bar
function StatusBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      let h = d.getHours(), m = d.getMinutes();
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
    };
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 14px 2px", height: "20px" }}>
      {/* Time */}
      <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(26,18,9,0.75)", letterSpacing: "0.02em" }}>{time}</span>

      {/* Right icons */}
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        {/* Signal bars */}
        <svg width="14" height="10" viewBox="0 0 14 10">
          {[0,1,2,3].map((i) => (
            <rect key={i} x={i * 3.5} y={10 - (i + 1) * 2.5} width="2.5" height={(i + 1) * 2.5} rx="0.5"
              fill={i < 4 ? "rgba(26,18,9,0.65)" : "rgba(26,18,9,0.2)"} />
          ))}
        </svg>
        {/* WiFi */}
        <svg width="14" height="10" viewBox="0 0 14 10">
          <path d="M7 8.5 C7 8.5 7 8.5 7 8.5" stroke="rgba(26,18,9,0.65)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4.5 6.5 C5.2 5.8 5.9 5.5 7 5.5 C8.1 5.5 8.8 5.8 9.5 6.5" stroke="rgba(26,18,9,0.65)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M2.2 4.2 C3.5 2.9 5.1 2.2 7 2.2 C8.9 2.2 10.5 2.9 11.8 4.2" stroke="rgba(26,18,9,0.65)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </svg>
        {/* Battery */}
        <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
          <div style={{ width: "18px", height: "9px", borderRadius: "2px", border: "1px solid rgba(26,18,9,0.5)", padding: "1px", display: "flex", alignItems: "center" }}>
            <div style={{ width: "75%", height: "100%", borderRadius: "1px", background: "#22c55e" }} />
          </div>
          <div style={{ width: "2px", height: "4px", borderRadius: "0 1px 1px 0", background: "rgba(26,18,9,0.4)" }} />
        </div>
      </div>
    </div>
  );
}

// Email Notification banner
function NotificationBanner({ notif, visible }) {
  return (
    <div style={{
      position: "absolute",
      top: "24px",
      left: "10px",
      right: "10px",
      zIndex: 30,
      background: "rgba(255,255,255,0.96)",
      backdropFilter: "blur(12px)",
      borderRadius: "14px",
      padding: "10px 12px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
      border: "1px solid rgba(154,92,46,0.15)",
      display: "flex",
      alignItems: "flex-start",
      gap: "9px",
      transform: visible ? "translateY(0)" : "translateY(-110%)",
      opacity: visible ? 1 : 0,
      transition: "transform 0.4s cubic-bezier(0.34,1.2,0.64,1), opacity 0.3s ease",
      pointerEvents: "none",
    }}>
      <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
        <span style={{ fontSize: "13px" }}>📧</span>
        <div style={{ position: "absolute", top: "-3px", right: "-3px", width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", border: "1.5px solid #fff" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.08em" }}>New Lead · Email</span>
          <span style={{ fontSize: "9px", color: "rgba(26,18,9,0.35)" }}>now</span>
        </div>
        <p style={{ fontSize: "11px", fontWeight: "700", color: "#1a1209", margin: "0 0 1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{notif.from}</p>
        <p style={{ fontSize: "10px", color: "rgba(26,18,9,0.5)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>"{notif.preview}"</p>
      </div>
    </div>
  );
}

// Payment Notification banner (Venmo, Cash App, Zelle)
function PaymentNotificationBanner({ payment, visible }) {
  const isVenmo = payment.type === "venmo";
  const isCashApp = payment.type === "cashapp";
  
  const bgColor = isCashApp ? "#00D54B" : "#3D95CE";
  const logo = isCashApp ? "💵" : "✓";
  
  return (
    <div style={{
      position: "absolute",
      top: "24px",
      left: "10px",
      right: "10px",
      zIndex: 30,
      background: isCashApp ? "rgba(0,213,75,0.95)" : "rgba(61,149,206,0.95)",
      backdropFilter: "blur(12px)",
      borderRadius: "14px",
      padding: "10px 12px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)",
      border: `1px solid ${isCashApp ? "rgba(0,213,75,0.3)" : "rgba(61,149,206,0.3)"}`,
      display: "flex",
      alignItems: "flex-start",
      gap: "9px",
      transform: visible ? "translateY(0)" : "translateY(-110%)",
      opacity: visible ? 1 : 0,
      transition: "transform 0.4s cubic-bezier(0.34,1.2,0.64,1), opacity 0.3s ease",
      pointerEvents: "none",
    }}>
      <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "14px", fontWeight: "800" }}>
        {logo}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em" }}>Payment Received</span>
          <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)" }}>now</span>
        </div>
        <p style={{ fontSize: "11px", fontWeight: "700", color: "#fff", margin: "0 0 1px" }}>{payment.sender}</p>
        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)", margin: 0 }}>{payment.from} • {payment.amount}</p>
      </div>
    </div>
  );
}

// Typing indicator
function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px", padding: "7px 10px", background: "#f0ece6", borderRadius: "3px 10px 10px 10px", width: "fit-content" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(26,18,9,0.35)", animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );
}

export default function HeroDashboardScreen() {
  const [aiRespondingDot, setAiRespondingDot] = useState(0);
  const [dashboardFade, setDashboardFade] = useState(0);
  const [colorTone, setColorTone] = useState(0);
  
  useEffect(() => {
    const t1 = setInterval(() => setAiRespondingDot((v) => (v + 1) % 3), 300);
    const t2 = setInterval(() => setDashboardFade((v) => (v + 1) % 2), 6000);
    const t3 = setInterval(() => setColorTone((v) => (v + 1) % 2), 6000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, []);

  const initLeads   = useCounter(247,  2200, 400);
  const replied     = useCounter(94,   1800, 600);
  const booked      = useCounter(61,   2000, 800);
  const initRevenue = useCounter(4200, 2400, 1000);

  // Live incrementing stats
  const [liveLeads, setLiveLeads]     = useState(0);
  const [liveRevenue, setLiveRevenue] = useState(0);
  const [flashLead, setFlashLead]     = useState(false);
  useEffect(() => {
    setLiveLeads(247);
    setLiveRevenue(4200);
    const id = setInterval(() => {
      const addLead = Math.random() > 0.4;
      if (addLead) {
        setLiveLeads((v) => v + 1);
        setFlashLead(true);
        setTimeout(() => setFlashLead(false), 700);
      }
      if (Math.random() > 0.3) setLiveRevenue((v) => v + Math.floor(Math.random() * 120 + 40));
    }, 9000);
    return () => clearInterval(id);
  }, []);

  // SMS conversation looping
  const [convIdx, setConvIdx]       = useState(0);
  const [smsVis, setSmsVis]         = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [fadingOut, setFadingOut]   = useState(false);

  useEffect(() => {
    let timers = [];
    const runConv = (ci) => {
      const msgs = CONVERSATIONS[ci].messages;
      // Show messages one by one with typing indicator before AI messages
      let delay = 0;
      msgs.forEach((msg, i) => {
        if (msg.r === "ai" && i > 0) {
          timers.push(setTimeout(() => setShowTyping(true), delay));
          delay += 1400;
          timers.push(setTimeout(() => { setShowTyping(false); setSmsVis(i + 1); }, delay));
        } else {
          timers.push(setTimeout(() => setSmsVis(i + 1), delay));
        }
        delay += 1600;
      });
      // Fade out and switch conversation
      timers.push(setTimeout(() => setFadingOut(true), delay + 2000));
      timers.push(setTimeout(() => {
        setFadingOut(false);
        setSmsVis(0);
        setShowTyping(false);
        const next = (ci + 1) % CONVERSATIONS.length;
        setConvIdx(next);
        runConv(next);
      }, delay + 2700));
    };
    // Initial delay before first conversation starts
    const init = setTimeout(() => runConv(0), 1200);
    return () => { clearTimeout(init); timers.forEach(clearTimeout); };
  }, []);

  // Email notification cycling
  const [notifIdx, setNotifIdx]     = useState(0);
  const [notifVisible, setNotifVisible] = useState(false);
  
  // Payment notification cycling
  const [paymentIdx, setPaymentIdx] = useState(0);
  const [paymentVisible, setPaymentVisible] = useState(false);
  
  useEffect(() => {
    const showEmail = (idx) => {
      setNotifIdx(idx);
      setNotifVisible(true);
      setTimeout(() => setNotifVisible(false), 3500);
    };
    const showPayment = (idx) => {
      setPaymentIdx(idx);
      setPaymentVisible(true);
      setTimeout(() => setPaymentVisible(false), 3500);
    };
    
    const t1 = setTimeout(() => showEmail(0), 4000);
    const t2 = setTimeout(() => showPayment(0), 10000);
    const t3 = setTimeout(() => showEmail(1), 16000);
    const t4 = setTimeout(() => showPayment(1), 22000);
    const t5 = setTimeout(() => showEmail(2), 28000);
    const t6 = setTimeout(() => showPayment(2), 34000);
    
    const loopEmail = setInterval(() => {
      showEmail(Math.floor(Math.random() * NOTIFICATIONS.length));
    }, 20000);
    const loopPayment = setInterval(() => {
      showPayment(Math.floor(Math.random() * PAYMENT_NOTIFICATIONS.length));
    }, 20000);
    
    return () => { 
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
      clearInterval(loopEmail); clearInterval(loopPayment);
    };
  }, []);

  // Live lead feed — new row pops in
  const [feedLeads, setFeedLeads] = useState(LIVE_LEADS_POOL.slice(0, 5).map((l, i) => ({ ...l, id: i, age: `${(i + 1) * 6 + 1}m`, fresh: false })));
  const poolIdx = useRef(5);
  useEffect(() => {
    const id = setInterval(() => {
      const next = LIVE_LEADS_POOL[poolIdx.current % LIVE_LEADS_POOL.length];
      poolIdx.current++;
      setFeedLeads((prev) => {
        const newRow = { ...next, id: Date.now(), age: "just now", fresh: true };
        const updated = [newRow, ...prev.slice(0, 4)];
        // Age labels
        return updated.map((l, i) => i === 0 ? l : { ...l, age: `${i * 6 + 1}m`, fresh: false });
      });
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const bg = "#f8f5f0";
  const cardBg = "#ffffff";
  const cardBorder = "rgba(0,0,0,0.07)";
  const textPrimary = "#1a1209";
  const textMuted = "rgba(26,18,9,0.45)";
  const sectionBg = "#f0ece6";
  const conv = CONVERSATIONS[convIdx];

  const displayLeads   = liveLeads   || initLeads;
  const displayRevenue = liveRevenue || initRevenue;

  const bgColor = colorTone === 0 ? "#f8f5f0" : "#f5f3f0";
  
  return (
    <div style={{ width: "100%", height: "100%", background: bgColor, borderRadius: "12px", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif", overflow: "hidden", position: "relative", opacity: dashboardFade === 0 ? 1 : 0.7, transition: "opacity 1s ease-in-out, background 3s ease-in-out", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", textRendering: "optimizeLegibility", imageRendering: "crisp-edges", willChange: "auto" }}>

      {/* Email Notification banner — absolutely positioned over content */}
      <NotificationBanner notif={NOTIFICATIONS[notifIdx]} visible={notifVisible} />
      
      {/* Payment Notification banner */}
      <PaymentNotificationBanner payment={PAYMENT_NOTIFICATIONS[paymentIdx]} visible={paymentVisible} />

      {/* ── iOS Status Bar ── */}
      <StatusBar />

      {/* ── Notch pill ── */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "2px" }}>
        <div style={{ width: "80px", height: "3px", borderRadius: "9999px", background: "rgba(26,18,9,0.12)" }} />
      </div>

      {/* Dashboard content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", padding: "0 14px 0", overflow: "hidden" }}>

        {/* Header bar — Glassmorphic */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderRadius: "10px", padding: "7px 12px", border: `1px solid rgba(255,255,255,0.3)`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "9px", fontWeight: "800", color: "#fff" }}>CS</span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: textPrimary }}>ClientSurge Dashboard</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#c8965c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", animation: "syncPulse 1.5s ease-in-out infinite" }}>⟳</div>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", animation: "hPulse 2s infinite" }} />
            <span style={{ fontSize: "9px", color: textMuted, fontWeight: "600" }}>Live · Today</span>
          </div>
        </div>

        {/* Stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "7px" }}>
          {[
            { icon: "👥", label: "Total Leads",  val: displayLeads,   suffix: "",   color: "#6366f1", flash: flashLead },
            { icon: "⚡", label: "AI Replied",   val: replied,        suffix: "%",  color: "#c8965c", flash: false },
            { icon: "📅", label: "Booked",       val: booked,         suffix: "%",  color: "#22c55e", flash: false },
            { icon: "💰", label: "Revenue",      val: `$${displayRevenue.toLocaleString()}`, raw: true, color: "#f59e0b", flash: false },
          ].map((s, i) => (
            <div key={i} style={{ background: cardBg, border: `1.5px solid ${s.flash ? s.color : cardBorder}`, borderRadius: "11px", padding: "10px 8px", position: "relative", overflow: "hidden", boxShadow: s.flash ? `0 0 12px ${s.color}40` : "0 1px 4px rgba(0,0,0,0.04)", transition: "border-color 0.4s, box-shadow 0.4s" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: s.color, borderRadius: "11px 11px 0 0" }} />
              <div style={{ fontSize: "12px", marginBottom: "4px" }}>{s.icon}</div>
              <div style={{ fontSize: "17px", fontWeight: "800", color: s.color, lineHeight: 1 }}>
                {s.raw ? s.val : `${s.val}${s.suffix}`}
              </div>
              <div style={{ fontSize: "8px", color: textMuted, marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Middle row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", flex: 1, minHeight: 0 }}>

          {/* Pipeline */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "11px", padding: "12px", display: "flex", flexDirection: "column", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "9px", fontWeight: "700", color: textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Pipeline</span>
              <span style={{ fontSize: "8px", fontWeight: "700", color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 7px", borderRadius: "8px", border: "1px solid rgba(34,197,94,0.2)" }}>Live</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              {PIPELINE.map((p, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ fontSize: "9px", color: textMuted, fontWeight: "500" }}>{p.label}</span>
                    <span style={{ fontSize: "9px", fontWeight: "700", color: p.color }}>{p.count}</span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "2px", background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: p.w, background: p.color, borderRadius: "2px", transition: "width 1.4s cubic-bezier(0.34,1.2,0.64,1)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live SMS — looping conversations */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "11px", padding: "12px", display: "flex", flexDirection: "column", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
             <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
               <span style={{ fontSize: "8px", fontWeight: "800", color: "#fff" }}>AI</span>
               {/* Animated responding pulse dots */}
               {[0, 1, 2].map((i) => (
                 <div
                   key={i}
                   style={{
                     position: "absolute",
                     width: "3px",
                     height: "3px",
                     borderRadius: "50%",
                     background: "#22c55e",
                     boxShadow: "0 0 4px #22c55e",
                     top: "-6px",
                     left: `${4 + i * 3}px`,
                     opacity: aiRespondingDot === i ? 1 : 0.3,
                     transition: "opacity 0.2s ease",
                   }}
                 />
               ))}
             </div>
             <div style={{ flex: 1, minWidth: 0 }}>
               <span style={{ fontSize: "10px", fontWeight: "700", color: textPrimary, display: "block", transition: "opacity 0.4s" }}>{conv.lead}</span>
               <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "1px" }}>
                 <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e" }} />
                 <span style={{ fontSize: "8px", color: textMuted }}>AI responding</span>
               </div>
             </div>
              <div style={{ fontSize: "8px", fontWeight: "800", color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "2px 7px", borderRadius: "8px", flexShrink: 0 }}>⚡ 4s</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", justifyContent: "flex-end", opacity: fadingOut ? 0 : 1, transition: "opacity 0.5s ease" }}>
              {conv.messages.slice(0, smsVis).map((m, i) => (
                <div key={`${convIdx}-${i}`} style={{ display: "flex", justifyContent: m.r === "ai" ? "flex-start" : "flex-end", animation: "sIn 0.3s ease-out" }}>
                  <div style={{ maxWidth: "82%", padding: "5px 8px", borderRadius: m.r === "ai" ? "3px 9px 9px 9px" : "9px 3px 9px 9px", background: m.r === "ai" ? "linear-gradient(135deg,#22c55e,#16a34a)" : "#e8e4de", fontSize: "9px", lineHeight: 1.45, color: m.r === "ai" ? "#fff" : textPrimary, boxShadow: m.r === "ai" ? "0 2px 8px rgba(34,197,94,0.25)" : "none" }}>
                    {m.t}
                  </div>
                </div>
              ))}
              {showTyping && <TypingDots />}
            </div>
          </div>
        </div>

        {/* Live lead feed */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "11px", padding: "10px 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "7px" }}>
            <span style={{ fontSize: "9px", fontWeight: "700", color: textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Recent Leads</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", animation: "hPulse 2s infinite", boxShadow: "0 0 5px #22c55e" }} />
              <span style={{ fontSize: "8px", color: textMuted }}>Live feed</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {feedLeads.map((l) => (
              <div
                key={l.id}
                style={{
                  display: "flex", alignItems: "center", gap: "7px", padding: "4px 6px", borderRadius: "7px",
                  background: sectionBg,
                  borderLeft: l.fresh ? `2px solid ${l.dot}` : "2px solid transparent",
                  animation: l.fresh ? "rowPopin 0.5s cubic-bezier(0.34,1.2,0.64,1)" : "none",
                  transition: "border-left-color 2s ease",
                }}
              >
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: `${l.dot}18`, border: `1.5px solid ${l.dot}60`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "9px", fontWeight: "800", color: l.dot }}>{l.name[0]}</span>
                </div>
                <span style={{ fontSize: "10px", fontWeight: "600", color: textPrimary, flex: 1 }}>{l.name}</span>
                <span style={{ fontSize: "8px", color: textMuted }}>{l.src}</span>
                <span style={{ fontSize: "8px", fontWeight: "700", color: l.dot, background: `${l.dot}15`, padding: "2px 6px", borderRadius: "7px", border: `1px solid ${l.dot}30` }}>{l.status}</span>
                <span style={{ fontSize: "8px", color: textMuted, minWidth: "28px", textAlign: "right" }}>{l.age}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── iPad Home Bar ── */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "20px", flexShrink: 0 }}>
        <div style={{ width: "32%", height: "4px", borderRadius: "9999px", background: "rgba(26,18,9,0.18)" }} />
      </div>

      <style>{`
        @keyframes hPulse     { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes sIn        { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rowPopin   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typingDot  { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-3px);opacity:1} }
        @keyframes syncPulse  { 0%{opacity:0.4;transform:rotate(0deg)} 50%{opacity:1;transform:rotate(180deg)} 100%{opacity:0.4;transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}