import { useEffect, useMemo, useRef, useState } from "react";

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

// iPadOS status bar
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px 4px", height: "28px", position: "relative" }}>
      <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(26,18,9,0.82)", letterSpacing: "-0.02em", minWidth: "48px" }}>{time}</span>
      {/* Pill camera */}
      <div style={{ position: "absolute", left: "50%", top: "5px", transform: "translateX(-50%)", width: "56px", height: "14px", borderRadius: "999px", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", boxShadow: "0 0 0 1px rgba(0,0,0,0.2), inset 0 1px 2px rgba(0,0,0,0.5)", zIndex: 10 }}>
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#1a1a2e", border: "1px solid rgba(60,80,160,0.5)", boxShadow: "0 0 3px rgba(60,80,160,0.6)" }} />
        <div style={{ width: "14px", height: "3px", borderRadius: "2px", background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <svg width="13" height="10" viewBox="0 0 13 10">
          {[0,1,2,3].map(i => <rect key={i} x={i*3.2} y={10-(i+1)*2.4} width="2.4" height={(i+1)*2.4} rx="0.6" fill={i<3?"rgba(26,18,9,0.75)":"rgba(26,18,9,0.2)"} />)}
        </svg>
        <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
          <circle cx="6.5" cy="9" r="1.2" fill="rgba(26,18,9,0.75)" />
          <path d="M3.8 6.8C4.7 5.9 5.5 5.5 6.5 5.5C7.5 5.5 8.3 5.9 9.2 6.8" stroke="rgba(26,18,9,0.75)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          <path d="M1.5 4.5C3.1 2.8 4.7 2 6.5 2C8.3 2 9.9 2.8 11.5 4.5" stroke="rgba(26,18,9,0.5)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
          <div style={{ width: "22px", height: "10px", borderRadius: "3px", border: "1.5px solid rgba(26,18,9,0.5)", padding: "1.5px", display: "flex", alignItems: "center" }}>
            <div style={{ width: "80%", height: "100%", borderRadius: "1.5px", background: "linear-gradient(90deg,#34d399,#22c55e)" }} />
          </div>
          <div style={{ width: "2px", height: "5px", borderRadius: "0 1.5px 1.5px 0", background: "rgba(26,18,9,0.4)" }} />
        </div>
      </div>
    </div>
  );
}

// Speaker grille dots
function SpeakerGrille({ count = 8, light = false }) {
  return (
    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ width: "3px", height: "3px", borderRadius: "50%", background: light ? "rgba(26,18,9,0.18)" : "rgba(255,255,255,0.12)", boxShadow: "inset 0 1px 1px rgba(0,0,0,0.5)" }} />
      ))}
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px", padding: "7px 10px", background: "#f0ece6", borderRadius: "3px 10px 10px 10px", width: "fit-content" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(26,18,9,0.35)", animation: `typingDot ${scaleMs(1200)}ms ease-in-out ${Math.round(i*280)}ms infinite` }} />
      ))}
    </div>
  );
}

function NotificationBanner({ notification, visible }) {
  if (!notification) return null;
  return (
    <div style={{
      position: "absolute", top: "24px", left: "10px", right: "10px", zIndex: 30,
      background: "rgba(255,255,255,0.92)", color: "#1a1209", backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)", borderRadius: "16px", padding: "10px 12px",
      boxShadow: "0 18px 40px rgba(15,23,42,0.14), 0 2px 8px rgba(0,0,0,0.08)",
      border: "1px solid rgba(255,255,255,0.55)", display: "flex", alignItems: "flex-start", gap: "9px",
      transform: visible ? "translateY(0)" : "translateY(-115%)", opacity: visible ? 1 : 0,
      transition: `transform ${scaleMs(350)}ms ease, opacity ${scaleMs(250)}ms ease`, pointerEvents: "none",
    }}>
      <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "9px", fontWeight: "800", color: "#fff" }}>CS</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
          <span style={{ fontSize: "10px", fontWeight: "800", color: "#111827" }}>{notification.appName}</span>
          <span style={{ fontSize: "9px", color: "rgba(26,18,9,0.35)" }}>now</span>
        </div>
        <p style={{ fontSize: "11px", fontWeight: "700", margin: "0 0 1px", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notification.title}</p>
        <p style={{ fontSize: "10px", margin: "0 0 1px", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notification.source}</p>
        <p style={{ fontSize: "10px", margin: 0, color: "rgba(26,18,9,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notification.detail}</p>
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
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(30);
  const [isHovered, setIsHovered] = useState(false);
  const [tabPress, setTabPress] = useState(null);
  const [awake, setAwake] = useState(false);
  const [todayTick, setTodayTick] = useState(0);
  const [ripple, setRipple] = useState(null);
  const cycleRef = useRef(0);
  const touchStartX = useRef(null);
  const outerRef = useRef(null);

  const initialLeads = useCounter(247, 2200, 400);
  const initialRevenue = useCounter(4200, 2400, 1000);
  const currentMode = useMemo(() => DEMO_MODES[activeMode], [activeMode]);

  // Boot on mount
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

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGlareX(((e.clientX-rect.left)/rect.width)*100);
    setGlareY(((e.clientY-rect.top)/rect.height)*100);
  };

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
  const sectionBg = "#f0ece6";

  return (
    <div
      ref={outerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        width: "100%", height: "100%", borderRadius: "12px",
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',sans-serif",
        overflow: "hidden", position: "relative",
        WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale",
        // Wallpaper
        background: "linear-gradient(160deg, #1a2a4a 0%, #0f1d35 18%, #1a3050 35%, #2d1a4a 55%, #1a2035 75%, #0d1525 100%)",
      }}
    >
      {/* Wallpaper orbs */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "20%", width: "55%", height: "55%", borderRadius: "50%", background: "radial-gradient(circle,rgba(120,80,200,0.55) 0%,transparent 70%)", filter: "blur(28px)" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "5%", width: "45%", height: "45%", borderRadius: "50%", background: "radial-gradient(circle,rgba(40,120,220,0.45) 0%,transparent 70%)", filter: "blur(24px)" }} />
        <div style={{ position: "absolute", top: "30%", left: "-5%", width: "40%", height: "40%", borderRadius: "50%", background: "radial-gradient(circle,rgba(200,80,120,0.3) 0%,transparent 70%)", filter: "blur(28px)" }} />
        {/* Frosted glass layer */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(248,245,240,0.88)" }} />
      </div>

      {/* Boot/wake overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 60, pointerEvents: awake ? "none" : "all",
        background: "#000", borderRadius: "12px",
        opacity: awake ? 0 : 1, transition: "opacity 0.9s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ opacity: awake ? 0 : 1, transition: "opacity 0.4s ease", transitionDelay: "0s" }}>
          <svg width="26" height="32" viewBox="0 0 814 1000" fill="rgba(255,255,255,0.85)">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 376.7 0 249.4 0 128.3 0 57.3 17.5-.4 52.9-32.4c35.4-32 82.3-51.2 127.3-51.2 49.2 0 91.4 20.7 121.5 53.9 30.1 33.2 53.3 84.1 53.3 143.6 0 2.6 0 5.2-.1 7.8 53.7-26.2 101.5-69.7 132.7-126.5C521.6-58.4 528-65.4 552-79.5c24-14.1 51.5-21.1 79.7-21.1 28.7 0 56.9 7.6 80.7 21.8 23.8 14.2 44.6 35.4 59.5 62.7 14.9 27.3 22.4 58.1 22.4 89.2-.1 0-.1 268.5-.1 268.5z"/>
          </svg>
        </div>
      </div>

      {/* Mouse-reactive glass reflection */}
      <div style={{ position: "absolute", inset: 0, zIndex: 55, pointerEvents: "none", overflow: "hidden", borderRadius: "12px" }}>
        <div style={{
          position: "absolute", width: "200%", height: "200%",
          left: `${glareX - 100}%`, top: `${glareY - 100}%`,
          background: "radial-gradient(circle at center, rgba(255,255,255,0.07) 0%, transparent 50%)",
          transition: isHovered ? "left 0.1s, top 0.1s" : "left 0.8s ease, top 0.8s ease",
          pointerEvents: "none",
        }} />
        <div style={{ position: "absolute", top: "-30%", left: "-20%", width: "60%", height: "160%", background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.04) 50%,transparent 70%)", transform: "skewX(-15deg)", pointerEvents: "none" }} />
      </div>

      {/* Speaker grille — top */}
      <div style={{ position: "absolute", top: "6px", left: "50%", transform: "translateX(-50%)", zIndex: 65, pointerEvents: "none" }}>
        <SpeakerGrille count={10} light />
      </div>

      <NotificationBanner notification={currentMode.notification} visible={notifVisible} />

      <StatusBar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", padding: "0 14px 0", overflow: "hidden", position: "relative", zIndex: 2 }}>
        {/* App header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.82)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderRadius: "10px", padding: "7px 12px", border: "1px solid rgba(255,255,255,0.35)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "9px", fontWeight: "800", color: "#fff" }}>CS</span>
            </div>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: textPrimary, display: "block" }}>ClientSurge</span>
              <span style={{ fontSize: "8px", color: textMuted }}>{currentMode.helper}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "3px", background: "linear-gradient(135deg,rgba(154,92,46,0.12),rgba(200,150,92,0.1))", border: "1px solid rgba(154,92,46,0.2)", borderRadius: "8px", padding: "2px 6px" }}>
              <span style={{ fontSize: "8px", fontWeight: "800", color: "#9a5c2e", letterSpacing: "0.04em" }}>+{todayTick+3} today</span>
            </div>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: `hPulse ${scaleMs(2000)}ms infinite` }} />
            <span style={{ fontSize: "9px", color: textMuted, fontWeight: "600" }}>{currentMode.status}</span>
          </div>
        </div>

        {/* Tab switcher with haptic-style press */}
        <div style={{ display: "flex", gap: "6px", background: "rgba(255,255,255,0.75)", borderRadius: "11px", padding: "4px", border: "1px solid rgba(0,0,0,0.05)" }}>
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
                  border: isActive ? "1.5px solid rgba(200,150,92,0.55)" : "1.5px solid transparent",
                  borderRadius: "8px", padding: "8px 6px",
                  background: isActive ? "linear-gradient(135deg,#1a1209 0%,#2a1e0f 100%)" : "transparent",
                  color: isActive ? "#f5e6d0" : textPrimary,
                  cursor: "pointer",
                  // Haptic-style scale press
                  transform: isPressed ? "scale(0.93)" : "scale(1)",
                  transition: `transform ${isPressed ? "80ms" : "180ms"} cubic-bezier(0.34,1.56,0.64,1), background 220ms ease, color 220ms ease, border-color 220ms ease`,
                  boxShadow: isActive ? "0 6px 14px rgba(26,18,9,0.2),inset 0 1px 0 rgba(200,150,92,0.2)" : "none",
                }}
              >
                {ripple?.key === key && (
                  <span style={{ position: "absolute", borderRadius: "50%", background: "rgba(255,255,255,0.35)", width: "80px", height: "80px", left: ripple.x-40, top: ripple.y-40, animation: "rippleOut 0.5s ease-out forwards", pointerEvents: "none" }} />
                )}
                <span style={{ display: "block", fontSize: "10px", fontWeight: "800", position: "relative", zIndex: 1 }}>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "7px" }}>
          {currentMode.stats.map((stat) => (
            <div key={stat.label} style={{ background: cardBg, border: `1.5px solid ${cardBorder}`, borderRadius: "11px", padding: "10px 8px", position: "relative", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg,${stat.accent}80,${stat.accent})` }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "8px", fontWeight: "700", color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{stat.label}</div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: stat.accent, lineHeight: 1.15, marginTop: "5px" }}>{stat.value}</div>
                </div>
                <svg width="28" height="16" viewBox="0 0 28 16" style={{ marginTop: "2px", opacity: 0.7 }}>
                  <polyline points="0,14 5,10 9,11 13,6 17,8 22,3 28,1" fill="none" stroke={stat.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="28" cy="1" r="2" fill={stat.accent}/>
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div style={{ display: "grid", gridTemplateColumns: "0.92fr 1.08fr", gap: "10px", flex: 1, minHeight: 0 }}>
          {/* Queue */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "11px", padding: "12px", display: "flex", flexDirection: "column", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "9px", fontWeight: "700", color: textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{currentMode.headerTitle}</span>
              <span style={{ fontSize: "8px", fontWeight: "700", color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 7px", borderRadius: "8px", border: "1px solid rgba(34,197,94,0.2)" }}>Running</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px", flex: 1 }}>
              {currentMode.queueItems.map((item, index) => (
                <div key={item.title} style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "8px 9px", borderRadius: "10px", background: sectionBg, border: index===freshStep ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(0,0,0,0.04)", boxShadow: index===freshStep ? "0 0 0 2px rgba(34,197,94,0.08)" : "none", transition: "border-color 240ms ease, box-shadow 240ms ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", color: textPrimary }}>{item.title}</span>
                    <span style={{ fontSize: "8px", fontWeight: "800", color: "#22c55e", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", padding: "2px 6px", borderRadius: "999px" }}>{item.badge}</span>
                  </div>
                  <span style={{ fontSize: "8px", color: textMuted }}>{item.meta}</span>
                </div>
              ))}
              <div style={{ marginTop: "auto", padding: "8px 9px", borderRadius: "10px", background: "#f9f7f3", border: "1px dashed rgba(154,92,46,0.18)" }}>
                <div style={{ fontSize: "8px", color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Today</div>
                <div style={{ fontSize: "12px", fontWeight: "800", color: textPrimary, marginTop: "2px" }}>{displayLeads}</div>
                <div style={{ fontSize: "8px", color: revenueFlash ? "#16a34a" : textMuted, fontWeight: revenueFlash ? "800" : "400", transition: "color 0.3s", background: revenueFlash ? "rgba(34,197,94,0.1)" : "transparent", borderRadius: "4px", padding: revenueFlash ? "1px 4px" : "0" }}>
                  active leads / ${displayRevenue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Conversation */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "11px", padding: "12px", display: "flex", flexDirection: "column", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                <span style={{ fontSize: "8px", fontWeight: "800", color: "#fff" }}>AI</span>
                {[0,1,2].map(i => <div key={i} style={{ position: "absolute", width: "3px", height: "3px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 4px #22c55e", top: "-6px", left: `${4+i*3}px`, opacity: aiDot===i?1:0.28, transition: `opacity 220ms ease` }} />)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "10px", fontWeight: "700", color: textPrimary, display: "block" }}>Automation conversation</span>
                <span style={{ fontSize: "8px", color: textMuted }}>{currentMode.label} workflow</span>
              </div>
              <div style={{ fontSize: "8px", fontWeight: "800", color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "2px 7px", borderRadius: "8px", flexShrink: 0 }}>Live</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", justifyContent: "flex-end", opacity: fadingOut?0.45:1, transition: `opacity ${scaleMs(420)}ms ease`, minHeight: 0 }}>
              {currentMode.messages.slice(0, visibleMessages).map((msg, idx) => {
                const isAi = msg.role==="ai";
                const isSys = msg.role==="system";
                return (
                  <div key={`${activeMode}-${idx}`} style={{ display: "flex", justifyContent: isSys?"center":isAi?"flex-start":"flex-end", animation: `sIn ${scaleMs(300)}ms ease-out` }}>
                    <div style={{ maxWidth: isSys?"92%":"82%", padding: "5px 8px", borderRadius: isSys?"999px":isAi?"3px 9px 9px 9px":"9px 3px 9px 9px", background: isSys?"rgba(99,102,241,0.08)":isAi?"linear-gradient(135deg,#22c55e,#16a34a)":"#e8e4de", fontSize: isSys?"8px":"9px", lineHeight: 1.45, color: isSys?"#4f46e5":isAi?"#fff":textPrimary, boxShadow: isAi?"0 2px 8px rgba(34,197,94,0.18)":"none", border: isSys?"1px solid rgba(99,102,241,0.12)":"none", textAlign: isSys?"center":"left" }}>
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
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "11px", padding: "10px 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "7px" }}>
            <span style={{ fontSize: "9px", fontWeight: "700", color: textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>What happens automatically</span>
            <span style={{ fontSize: "8px", color: textMuted }}>1 / 2 / 3</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px" }}>
            {currentMode.steps.map((step, idx) => {
              const isActive = idx <= freshStep;
              return (
                <div key={step} style={{ padding: "7px 8px", borderRadius: "9px", background: isActive?"rgba(34,197,94,0.12)":sectionBg, border: isActive?"1px solid rgba(34,197,94,0.2)":"1px solid rgba(0,0,0,0.04)", transition: "background 220ms ease, border-color 220ms ease" }}>
                  <div style={{ fontSize: "8px", color: isActive?"#15803d":textMuted, marginBottom: "3px", fontWeight: "800" }}>STEP {idx+1}</div>
                  <div style={{ fontSize: "9px", color: textPrimary, lineHeight: 1.35, fontWeight: "600" }}>{step}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* iPadOS Dock */}
      <div style={{ flexShrink: 0, padding: "6px 16px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: "rgba(255,255,255,0.28)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: "18px", padding: "7px 16px", border: "1px solid rgba(255,255,255,0.45)", boxShadow: "0 2px 16px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.5)" }}>
          {[
            { bg: "linear-gradient(145deg,#007aff,#00c4ff)", child: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/><line x1="12" y1="2" x2="12" y2="22" stroke="white" strokeWidth="1" opacity="0.5"/><line x1="2" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1" opacity="0.5"/><polygon points="12,5 15,12 12,19 9,12" fill="none" stroke="white" strokeWidth="1.2"/><circle cx="12" cy="12" r="2" fill="white"/></svg>, shadow: "rgba(0,122,255,0.4)" },
            { bg: "linear-gradient(145deg,#34c759,#30d158)", child: <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.04 2 11c0 2.64 1.14 5.01 2.97 6.72L4 20l2.5-.83C7.9 19.67 9.9 20 12 20c5.52 0 10-4.04 10-9S17.52 2 12 2z"/></svg>, shadow: "rgba(52,199,89,0.4)" },
            { bg: "linear-gradient(145deg,#fff,#f5f5f5)", child: <div style={{ textAlign: "center", lineHeight: 1 }}><div style={{ fontSize: "5px", fontWeight: "800", color: "#ff3b30", textTransform: "uppercase", letterSpacing: "0.04em" }}>MAY</div><div style={{ fontSize: "11px", fontWeight: "700", color: "#1c1c1e" }}>{new Date().getDate()}</div></div>, shadow: "rgba(0,0,0,0.15)", border: "1px solid rgba(0,0,0,0.08)" },
            { bg: "linear-gradient(145deg,#8e8e93,#636366)", child: <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.92c.04-.34.07-.68.07-1.08s-.03-.74-.07-1.08l2.3-1.82c.21-.16.27-.45.14-.68l-2.2-3.84c-.12-.22-.39-.3-.61-.22l-2.72 1.1c-.57-.44-1.18-.8-1.85-1.07L14.17 3c-.04-.24-.24-.42-.5-.42h-4.4c-.26 0-.46.18-.5.42l-.41 2.89c-.67.27-1.28.63-1.85 1.07l-2.72-1.1c-.23-.08-.5 0-.61.22L1.38 9.92c-.14.23-.08.52.14.68l2.3 1.82a7.6 7.6 0 000 2.16l-2.3 1.82c-.22.16-.28.45-.14.68l2.2 3.84c.12.22.39.3.61.22l2.72-1.1c.57.44 1.18.8 1.85 1.07l.41 2.89c.04.24.24.42.5.42h4.4c.26 0 .46-.18.5-.42l.41-2.89c.67-.27 1.28-.63 1.85-1.07l2.72 1.1c.23.08.5 0 .61-.22l2.2-3.84c.14-.23.08-.52-.14-.68l-2.3-1.82z"/></svg>, shadow: "rgba(100,100,100,0.35)" },
          ].map((app, i) => (
            <div key={i} style={{ width: "32px", height: "32px", borderRadius: "8px", background: app.bg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 6px ${app.shadow}`, border: app.border || "none", flexShrink: 0 }}>
              {app.child}
            </div>
          ))}
        </div>
        {/* Speaker grille — bottom */}
        <SpeakerGrille count={10} light />
        {/* Home indicator */}
        <div style={{ width: "28%", height: "4px", borderRadius: "9999px", background: "rgba(26,18,9,0.2)" }} />
      </div>

      <style>{`
        @keyframes hPulse { 0%,100%{opacity:1}50%{opacity:0.35} }
        @keyframes sIn { from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)} }
        @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-3px);opacity:1} }
        @keyframes rippleOut { from{transform:scale(0);opacity:1}to{transform:scale(3);opacity:0} }
      `}</style>
    </div>
  );
}