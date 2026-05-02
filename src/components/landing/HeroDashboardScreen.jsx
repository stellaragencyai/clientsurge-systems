import { useEffect, useMemo, useRef, useState } from "react";

const SF = "-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',ui-sans-serif,sans-serif";
const MOTION_MULTIPLIER = 1.4;
function scaleMs(d) { return Math.round(d * MOTION_MULTIPLIER); }

function useCounter(target, duration = 1800, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const e = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(e * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [delay, duration, target]);
  return value;
}

const DEMO_MODES = {
  lead_response: {
    label: "New Lead", helper: "Responds within 60 seconds, automatically.",
    headerTitle: "Lead inbox", status: "Replying in 4s",
    notification: { appName: "ClientSurge", title: "New lead captured", source: "Glow Med Spa", detail: "Form lead received / intro text sent" },
    stats: [
      { label: "Lead", value: "Marcus D.", accent: "#6366f1" },
      { label: "Source", value: "Website form", accent: "#c8965c" },
      { label: "Next step", value: "First text", accent: "#22c55e" },
    ],
    queueItems: [
      { title: "Marcus D.", meta: "Requested pricing", badge: "New" },
      { title: "Phone captured", meta: "(602) 555-0148", badge: "Ready" },
      { title: "Automation rule", meta: "Instant Lead Response", badge: "On" },
    ],
    messages: [
      { role: "system", text: "Lead synced from website form" },
      { role: "ai", text: "Hi Marcus. Thanks for reaching out to Glow Med Spa." },
      { role: "ai", text: "Would you like a quick pricing breakdown or a booking link first?" },
      { role: "lead", text: "Send me pricing first, please." },
    ],
    steps: ["New lead arrives", "Lead details land in the inbox", "First SMS sends automatically"],
  },
  missed_call: {
    label: "Missed Call", helper: "Turns missed calls into text conversations.",
    headerTitle: "Call recovery", status: "Text-back in 60s",
    notification: { appName: "ClientSurge", title: "Missed call recovered", source: "Peak Health Clinic", detail: "No answer / text-back queued" },
    stats: [
      { label: "Caller", value: "Priya K.", accent: "#6366f1" },
      { label: "Trigger", value: "Missed call", accent: "#c8965c" },
      { label: "Next step", value: "Recovery text", accent: "#22c55e" },
    ],
    queueItems: [
      { title: "Incoming call", meta: "11:42 AM / 23 sec", badge: "Missed" },
      { title: "Caller ID", meta: "(480) 555-0102", badge: "Matched" },
      { title: "Automation rule", meta: "Missed Call Text-Back", badge: "On" },
    ],
    messages: [
      { role: "system", text: "Call ended without answer" },
      { role: "ai", text: "Hi Priya. Sorry we missed your call." },
      { role: "ai", text: "Want us to text you details or help you book?" },
      { role: "lead", text: "Text me the details and the booking link." },
    ],
    steps: ["Missed call is detected", "Caller is matched to a record", "Text-back sends automatically"],
  },
  booking: {
    label: "Booking", helper: "Nudges the lead to a confirmed appointment.",
    headerTitle: "Booking handoff", status: "Booking in progress",
    notification: { appName: "ClientSurge", title: "Appointment confirmed", source: "Luxe Aesthetics", detail: "Jordan T. booked Thursday 2pm" },
    stats: [
      { label: "Lead", value: "Jordan T.", accent: "#6366f1" },
      { label: "Stage", value: "Ready to book", accent: "#c8965c" },
      { label: "Next step", value: "Booking link", accent: "#22c55e" },
    ],
    queueItems: [
      { title: "Jordan T.", meta: "Asked for next available slot", badge: "Hot" },
      { title: "Booking link", meta: "Shared automatically", badge: "Sent" },
      { title: "Follow-up", meta: "Reminder scheduled", badge: "Queued" },
    ],
    messages: [
      { role: "system", text: "Lead asked for the next available appointment" },
      { role: "ai", text: "Perfect. Here is your booking link for the next open slot." },
      { role: "ai", text: "Once you pick a time, we will send the confirmation for you." },
      { role: "lead", text: "Done. I booked for Thursday afternoon." },
    ],
    steps: ["Lead asks to move forward", "Booking link is shared", "Confirmation and reminders queued"],
  },
};

function StatusBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      let h = d.getHours() % 12 || 12;
      const m = d.getMinutes().toString().padStart(2, "0");
      return `${h}:${m} ${d.getHours() >= 12 ? "PM" : "AM"}`;
    };
    setTime(fmt());
    const t = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 14px 3px", height: "26px", position: "relative", fontFamily: SF }}>
      <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(26,18,9,0.82)", letterSpacing: "-0.02em", minWidth: "44px" }}>{time}</span>
      {/* Pill camera */}
      <div style={{ position: "absolute", left: "50%", top: "4px", transform: "translateX(-50%)", width: "52px", height: "13px", borderRadius: "999px", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", boxShadow: "0 0 0 1px rgba(0,0,0,0.2)", zIndex: 10 }}>
        <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#1a1a2e", border: "1px solid rgba(60,80,160,0.5)", boxShadow: "0 0 3px rgba(60,80,160,0.6)" }} />
        <div style={{ width: "12px", height: "2.5px", borderRadius: "2px", background: "#1a1a2e" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <svg width="11" height="9" viewBox="0 0 13 10">
          {[0,1,2,3].map(i => <rect key={i} x={i*3.2} y={10-(i+1)*2.4} width="2.4" height={(i+1)*2.4} rx="0.6" fill={i<3?"rgba(26,18,9,0.75)":"rgba(26,18,9,0.2)"} />)}
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
          <div style={{ width: "19px", height: "9px", borderRadius: "2.5px", border: "1.5px solid rgba(26,18,9,0.5)", padding: "1.5px", display: "flex", alignItems: "center" }}>
            <div style={{ width: "80%", height: "100%", borderRadius: "1px", background: "linear-gradient(90deg,#34d399,#22c55e)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SpeakerGrille({ count = 8, light = false }) {
  return (
    <div style={{ display: "flex", gap: "2.5px", alignItems: "center" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ width: "2.5px", height: "2.5px", borderRadius: "50%", background: light ? "rgba(26,18,9,0.15)" : "rgba(255,255,255,0.1)", boxShadow: "inset 0 1px 1px rgba(0,0,0,0.4)" }} />
      ))}
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px", padding: "5px 8px", background: "#f0ece6", borderRadius: "3px 8px 8px 8px", width: "fit-content" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(26,18,9,0.35)", animation: `typingDot ${scaleMs(1200)}ms ease-in-out ${Math.round(i*280)}ms infinite` }} />
      ))}
    </div>
  );
}

function NotificationBanner({ notification, visible }) {
  if (!notification) return null;
  return (
    <div style={{
      position: "absolute", top: "22px", left: "8px", right: "8px", zIndex: 30,
      background: "rgba(255,255,255,0.94)", color: "#1a1209", backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)", borderRadius: "13px", padding: "8px 10px",
      boxShadow: "0 14px 32px rgba(15,23,42,0.12), 0 2px 6px rgba(0,0,0,0.06)",
      border: "1px solid rgba(255,255,255,0.6)", display: "flex", alignItems: "flex-start", gap: "7px",
      transform: visible ? "translateY(0)" : "translateY(-115%)", opacity: visible ? 1 : 0,
      transition: `transform ${scaleMs(350)}ms ease, opacity ${scaleMs(250)}ms ease`, pointerEvents: "none",
      fontFamily: SF,
    }}>
      <div style={{ width: "24px", height: "24px", borderRadius: "7px", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "7px", fontWeight: "800", color: "#fff" }}>CS</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
          <span style={{ fontSize: "9px", fontWeight: "700", color: "#111827" }}>{notification.appName}</span>
          <span style={{ fontSize: "8px", color: "rgba(26,18,9,0.35)" }}>now</span>
        </div>
        <p style={{ fontSize: "9px", fontWeight: "700", margin: "0 0 1px", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notification.title}</p>
        <p style={{ fontSize: "8px", margin: 0, color: "rgba(26,18,9,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notification.detail}</p>
      </div>
    </div>
  );
}

export default function HeroDashboardScreen() {
  const [activeMode, setActiveMode] = useState("lead_response");
  const [aiDot, setAiDot] = useState(0);
  const [notifVisible, setNotifVisible] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [liveLeads, setLiveLeads] = useState(247);
  const [liveRevenue, setLiveRevenue] = useState(4200);
  const [revenueFlash, setRevenueFlash] = useState(false);
  const [freshStep, setFreshStep] = useState(0);
  const [tabPress, setTabPress] = useState(null);
  const [ripple, setRipple] = useState(null);
  const [awake, setAwake] = useState(false);
  const [todayTick, setTodayTick] = useState(0);
  const cycleRef = useRef(0);
  const touchStartX = useRef(null);

  const initialLeads = useCounter(247, 2200, 400);
  const initialRevenue = useCounter(4200, 2400, 1000);
  const currentMode = useMemo(() => DEMO_MODES[activeMode], [activeMode]);

  useEffect(() => { setTimeout(() => setAwake(true), 500); }, []);
  useEffect(() => { const t = setInterval(() => setAiDot(v => (v+1)%3), scaleMs(400)); return () => clearInterval(t); }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveMode(prev => {
        const keys = Object.keys(DEMO_MODES);
        return keys[(keys.indexOf(prev)+1)%keys.length];
      });
    }, scaleMs(18000));
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setNotifVisible(true);
    const h = setTimeout(() => setNotifVisible(false), scaleMs(3600));
    return () => clearTimeout(h);
  }, [activeMode]);

  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random()>0.55) setLiveLeads(v=>v+1);
      if (Math.random()>0.5) { setLiveRevenue(v=>v+Math.floor(Math.random()*90+30)); setRevenueFlash(true); setTimeout(()=>setRevenueFlash(false),900); }
    }, scaleMs(16000));
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => { if(Math.random()>0.6) setTodayTick(v=>v+1); }, scaleMs(7000));
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setVisibleMessages(0); setShowTyping(false); setFadingOut(false); setFreshStep(0);
    cycleRef.current += 1;
    const runId = cycleRef.current;
    const msgs = currentMode.messages;
    const tids = [];
    let delay = scaleMs(700);
    msgs.forEach((msg, idx) => {
      if (msg.role==="ai" && idx>0) {
        tids.push(setTimeout(()=>{ if(cycleRef.current!==runId) return; setShowTyping(true); }, delay));
        delay += scaleMs(1000);
        tids.push(setTimeout(()=>{ if(cycleRef.current!==runId) return; setShowTyping(false); setVisibleMessages(idx+1); setFreshStep(Math.min(idx+1,currentMode.steps.length-1)); }, delay));
      } else {
        tids.push(setTimeout(()=>{ if(cycleRef.current!==runId) return; setVisibleMessages(idx+1); setFreshStep(Math.min(idx,currentMode.steps.length-1)); }, delay));
      }
      delay += scaleMs(1300);
    });
    tids.push(setTimeout(()=>{ if(cycleRef.current!==runId) return; setFadingOut(true); }, delay+scaleMs(2400)));
    tids.push(setTimeout(()=>{ if(cycleRef.current!==runId) return; setVisibleMessages(0); setShowTyping(false); setFadingOut(false); setFreshStep(0); }, delay+scaleMs(3200)));
    return () => { cycleRef.current+=1; tids.forEach(clearTimeout); };
  }, [currentMode]);

  const handleTabClick = (key, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ key, x: e.clientX-rect.left, y: e.clientY-rect.top });
    setTabPress(key);
    setTimeout(()=>{ setTabPress(null); setRipple(null); }, 220);
    setActiveMode(key);
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current===null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff)<40) return;
    const keys = Object.keys(DEMO_MODES);
    setActiveMode(prev => {
      const idx = keys.indexOf(prev);
      return diff>0 ? keys[(idx+1)%keys.length] : keys[(idx-1+keys.length)%keys.length];
    });
    touchStartX.current = null;
  };

  const displayLeads = liveLeads || initialLeads;
  const displayRevenue = liveRevenue || initialRevenue;
  const textPrimary = "#1a1209";
  const textMuted = "rgba(26,18,9,0.45)";
  const cardBg = "#ffffff";
  const cardBorder = "rgba(0,0,0,0.07)";
  const sectionBg = "#f5f2ee";

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        width: "100%", height: "100%", borderRadius: "12px",
        display: "flex", flexDirection: "column",
        fontFamily: SF,
        WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale",
        overflow: "hidden", position: "relative",
        background: "linear-gradient(160deg, #1a2a4a 0%, #0f1d35 18%, #1a3050 35%, #2d1a4a 55%, #1a2035 75%, #0d1525 100%)",
      }}
    >
      {/* Wallpaper orbs */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "20%", width: "55%", height: "55%", borderRadius: "50%", background: "radial-gradient(circle,rgba(120,80,200,0.55) 0%,transparent 70%)", filter: "blur(28px)" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "5%", width: "45%", height: "45%", borderRadius: "50%", background: "radial-gradient(circle,rgba(40,120,220,0.45) 0%,transparent 70%)", filter: "blur(24px)" }} />
        <div style={{ position: "absolute", top: "30%", left: "-5%", width: "40%", height: "40%", borderRadius: "50%", background: "radial-gradient(circle,rgba(200,80,120,0.3) 0%,transparent 70%)", filter: "blur(28px)" }} />
        {/* Frosted glass layer */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(248,245,240,0.9)" }} />
      </div>

      {/* Boot/wake overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 60, pointerEvents: awake ? "none" : "all",
        background: "#000", borderRadius: "12px",
        opacity: awake ? 0 : 1, transition: "opacity 0.9s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ opacity: awake ? 0 : 1, transition: "opacity 0.4s" }}>
          <svg width="22" height="27" viewBox="0 0 814 1000" fill="rgba(255,255,255,0.85)">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 376.7 0 249.4 0 128.3 0 57.3 17.5-.4 52.9-32.4c35.4-32 82.3-51.2 127.3-51.2 49.2 0 91.4 20.7 121.5 53.9 30.1 33.2 53.3 84.1 53.3 143.6 0 2.6 0 5.2-.1 7.8 53.7-26.2 101.5-69.7 132.7-126.5C521.6-58.4 528-65.4 552-79.5c24-14.1 51.5-21.1 79.7-21.1 28.7 0 56.9 7.6 80.7 21.8 23.8 14.2 44.6 35.4 59.5 62.7 14.9 27.3 22.4 58.1 22.4 89.2-.1 0-.1 268.5-.1 268.5z"/>
          </svg>
        </div>
      </div>

      {/* Speaker grille — top */}
      <div style={{ position: "absolute", top: "5px", left: "50%", transform: "translateX(-50%)", zIndex: 65, pointerEvents: "none" }}>
        <SpeakerGrille count={9} light />
      </div>

      <NotificationBanner notification={currentMode.notification} visible={notifVisible} />

      <StatusBar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px", padding: "0 10px 0", overflow: "hidden", position: "relative", zIndex: 2 }}>

        {/* App header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.84)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderRadius: "9px", padding: "5px 9px", border: "1px solid rgba(255,255,255,0.38)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "7px", fontWeight: "800", color: "#fff" }}>CS</span>
            </div>
            <div>
              <span style={{ fontSize: "9px", fontWeight: "700", color: textPrimary, display: "block", letterSpacing: "-0.01em" }}>ClientSurge</span>
              <span style={{ fontSize: "7px", color: textMuted, letterSpacing: "-0.01em" }}>{currentMode.helper}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ fontSize: "7px", fontWeight: "800", color: "#9a5c2e", background: "rgba(154,92,46,0.1)", border: "1px solid rgba(154,92,46,0.18)", borderRadius: "6px", padding: "1px 5px", letterSpacing: "0.02em" }}>+{todayTick+3} today</div>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e", animation: `hPulse ${scaleMs(2000)}ms infinite` }} />
            <span style={{ fontSize: "7px", color: textMuted, fontWeight: "600", letterSpacing: "-0.01em" }}>{currentMode.status}</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.78)", borderRadius: "9px", padding: "3px", border: "1px solid rgba(0,0,0,0.05)" }}>
          {Object.entries(DEMO_MODES).map(([key, mode]) => {
            const isActive = key === activeMode;
            const isPressed = tabPress === key;
            return (
              <button
                key={key}
                type="button"
                onClick={(e) => handleTabClick(key, e)}
                style={{
                  flex: 1, overflow: "hidden", position: "relative",
                  border: isActive ? "1px solid rgba(200,150,92,0.55)" : "1px solid transparent",
                  borderRadius: "7px", padding: "5px 4px",
                  background: isActive ? "linear-gradient(135deg,#1a1209 0%,#2a1e0f 100%)" : "transparent",
                  color: isActive ? "#f5e6d0" : textPrimary,
                  cursor: "pointer",
                  transform: isPressed ? "scale(0.93)" : "scale(1)",
                  transition: `transform ${isPressed ? "80ms" : "180ms"} cubic-bezier(0.34,1.56,0.64,1), background 220ms ease`,
                  boxShadow: isActive ? "0 4px 10px rgba(26,18,9,0.18)" : "none",
                  fontFamily: SF,
                }}
              >
                {ripple?.key === key && (
                  <span style={{ position: "absolute", borderRadius: "50%", background: "rgba(255,255,255,0.3)", width: "60px", height: "60px", left: ripple.x-30, top: ripple.y-30, animation: "rippleOut 0.5s ease-out forwards", pointerEvents: "none" }} />
                )}
                <span style={{ display: "block", fontSize: "8.5px", fontWeight: "700", position: "relative", zIndex: 1, letterSpacing: "-0.01em" }}>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "5px" }}>
          {currentMode.stats.map((stat) => (
            <div key={stat.label} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "9px", padding: "7px 6px", position: "relative", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2.5px", background: `linear-gradient(90deg,${stat.accent}80,${stat.accent})` }} />
              <div style={{ fontSize: "7px", fontWeight: "700", color: textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{stat.label}</div>
              <div style={{ fontSize: "12px", fontWeight: "800", color: stat.accent, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{stat.value}</div>
              <svg width="24" height="12" viewBox="0 0 28 16" style={{ marginTop: "3px", opacity: 0.65 }}>
                <polyline points="0,14 5,10 9,11 13,6 17,8 22,3 28,1" fill="none" stroke={stat.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="28" cy="1" r="2" fill={stat.accent}/>
              </svg>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: "7px", flex: 1, minHeight: 0 }}>

          {/* Queue */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "9px", padding: "9px", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", minHeight: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "7px" }}>
              <span style={{ fontSize: "7px", fontWeight: "700", color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{currentMode.headerTitle}</span>
              <span style={{ fontSize: "7px", fontWeight: "700", color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "1px 5px", borderRadius: "6px", border: "1px solid rgba(34,197,94,0.2)" }}>Running</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
              {currentMode.queueItems.map((item, index) => (
                <div key={item.title} style={{ padding: "6px 7px", borderRadius: "7px", background: sectionBg, border: index===freshStep ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(0,0,0,0.04)", transition: "border-color 240ms ease", boxShadow: index===freshStep ? "0 0 0 2px rgba(34,197,94,0.07)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "8.5px", fontWeight: "700", color: textPrimary, letterSpacing: "-0.01em" }}>{item.title}</span>
                    <span style={{ fontSize: "7px", fontWeight: "800", color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "1px 5px", borderRadius: "999px", flexShrink: 0 }}>{item.badge}</span>
                  </div>
                  <span style={{ fontSize: "7px", color: textMuted, letterSpacing: "-0.01em" }}>{item.meta}</span>
                </div>
              ))}
              <div style={{ marginTop: "auto", padding: "6px 7px", borderRadius: "7px", background: "#f9f7f3", border: "1px dashed rgba(154,92,46,0.16)" }}>
                <div style={{ fontSize: "7px", color: textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Today</div>
                <div style={{ fontSize: "13px", fontWeight: "800", color: textPrimary, letterSpacing: "-0.03em", margin: "1px 0" }}>{displayLeads}</div>
                <div style={{ fontSize: "7px", color: revenueFlash ? "#15803d" : textMuted, fontWeight: revenueFlash ? "800" : "400", transition: "color 0.3s" }}>
                  leads / ${displayRevenue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Conversation */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "9px", padding: "9px", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden", minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "7px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                <span style={{ fontSize: "7px", fontWeight: "800", color: "#fff" }}>AI</span>
                {[0,1,2].map(i => <div key={i} style={{ position: "absolute", width: "3px", height: "3px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 3px #22c55e", top: "-5px", left: `${3+i*3}px`, opacity: aiDot===i?1:0.25, transition: "opacity 220ms ease" }} />)}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "8.5px", fontWeight: "700", color: textPrimary, display: "block", letterSpacing: "-0.01em" }}>Automation conversation</span>
                <span style={{ fontSize: "7px", color: textMuted, letterSpacing: "-0.01em" }}>{currentMode.label} workflow</span>
              </div>
              <div style={{ fontSize: "7px", fontWeight: "800", color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "1px 5px", borderRadius: "6px" }}>Live</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", justifyContent: "flex-end", opacity: fadingOut?0.4:1, transition: `opacity ${scaleMs(420)}ms ease`, minHeight: 0 }}>
              {currentMode.messages.slice(0, visibleMessages).map((msg, idx) => {
                const isAi = msg.role==="ai";
                const isSys = msg.role==="system";
                return (
                  <div key={`${activeMode}-${idx}`} style={{ display: "flex", justifyContent: isSys?"center":isAi?"flex-start":"flex-end", animation: `sIn ${scaleMs(300)}ms ease-out` }}>
                    <div style={{ maxWidth: isSys?"92%":"82%", padding: "4px 7px", borderRadius: isSys?"999px":isAi?"3px 8px 8px 8px":"8px 3px 8px 8px", background: isSys?"rgba(99,102,241,0.08)":isAi?"linear-gradient(135deg,#22c55e,#16a34a)":"#e8e4de", fontSize: isSys?"7px":"8px", lineHeight: 1.4, color: isSys?"#4f46e5":isAi?"#fff":textPrimary, boxShadow: isAi?"0 1px 6px rgba(34,197,94,0.18)":"none", border: isSys?"1px solid rgba(99,102,241,0.1)":"none", letterSpacing: "-0.01em" }}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              {showTyping && <TypingDots />}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "9px", padding: "7px 9px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
            <span style={{ fontSize: "7px", fontWeight: "700", color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>What happens automatically</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "5px" }}>
            {currentMode.steps.map((step, idx) => {
              const isActive = idx <= freshStep;
              return (
                <div key={step} style={{ padding: "5px 6px", borderRadius: "7px", background: isActive?"rgba(34,197,94,0.1)":sectionBg, border: isActive?"1px solid rgba(34,197,94,0.18)":"1px solid rgba(0,0,0,0.04)", transition: "background 220ms ease" }}>
                  <div style={{ fontSize: "7px", color: isActive?"#15803d":textMuted, marginBottom: "2px", fontWeight: "800", letterSpacing: "0.04em" }}>STEP {idx+1}</div>
                  <div style={{ fontSize: "8px", color: textPrimary, lineHeight: 1.3, fontWeight: "600", letterSpacing: "-0.01em" }}>{step}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dock */}
      <div style={{ flexShrink: 0, padding: "5px 12px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "rgba(255,255,255,0.28)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: "14px", padding: "5px 12px", border: "1px solid rgba(255,255,255,0.42)", boxShadow: "0 2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.45)" }}>
          {[
            { bg: "linear-gradient(145deg,#007aff,#00c4ff)", shadow: "rgba(0,122,255,0.4)", child: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/><line x1="12" y1="2" x2="12" y2="22" stroke="white" strokeWidth="1" opacity="0.5"/><circle cx="12" cy="12" r="2.5" fill="white"/></svg> },
            { bg: "linear-gradient(145deg,#34c759,#30d158)", shadow: "rgba(52,199,89,0.4)", child: <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.04 2 11c0 2.64 1.14 5.01 2.97 6.72L4 20l2.5-.83C7.9 19.67 9.9 20 12 20c5.52 0 10-4.04 10-9S17.52 2 12 2z"/></svg> },
            { bg: "linear-gradient(145deg,#fff,#f5f5f5)", shadow: "rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.08)", child: <div style={{ textAlign: "center", lineHeight: 1 }}><div style={{ fontSize: "4px", fontWeight: "800", color: "#ff3b30", textTransform: "uppercase" }}>MAY</div><div style={{ fontSize: "10px", fontWeight: "700", color: "#1c1c1e", fontFamily: SF }}>{new Date().getDate()}</div></div> },
            { bg: "linear-gradient(145deg,#8e8e93,#636366)", shadow: "rgba(100,100,100,0.3)", child: <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.92c.04-.34.07-.68.07-1.08s-.03-.74-.07-1.08l2.3-1.82c.21-.16.27-.45.14-.68l-2.2-3.84c-.12-.22-.39-.3-.61-.22l-2.72 1.1c-.57-.44-1.18-.8-1.85-1.07L14.17 3c-.04-.24-.24-.42-.5-.42h-4.4c-.26 0-.46.18-.5.42l-.41 2.89c-.67.27-1.28.63-1.85 1.07l-2.72-1.1c-.23-.08-.5 0-.61.22L1.38 9.92c-.14.23-.08.52.14.68l2.3 1.82a7.6 7.6 0 000 2.16l-2.3 1.82c-.22.16-.28.45-.14.68l2.2 3.84c.12.22.39.3.61.22l2.72-1.1c.57.44 1.18.8 1.85 1.07l.41 2.89c.04.24.24.42.5.42h4.4c.26 0 .46-.18.5-.42l.41-2.89c.67-.27 1.28-.63 1.85-1.07l2.72 1.1c.23.08.5 0 .61-.22l2.2-3.84c.14-.23.08-.52-.14-.68l-2.3-1.82z"/></svg> },
          ].map((app, i) => (
            <div key={i} style={{ width: "27px", height: "27px", borderRadius: "7px", background: app.bg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 5px ${app.shadow}`, border: app.border || "none", flexShrink: 0 }}>
              {app.child}
            </div>
          ))}
        </div>
        <SpeakerGrille count={9} light />
        <div style={{ width: "25%", height: "3px", borderRadius: "9999px", background: "rgba(26,18,9,0.18)" }} />
      </div>

      <style>{`
        @keyframes hPulse { 0%,100%{opacity:1}50%{opacity:0.35} }
        @keyframes sIn { from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)} }
        @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-3px);opacity:1} }
        @keyframes rippleOut { from{transform:scale(0);opacity:1}to{transform:scale(3);opacity:0} }
      `}</style>
    </div>
  );
}