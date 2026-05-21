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
}];

const CYCLE_DURATION = 5000;

// ─── Enhancement 1: Realistic iOS App Icons (SVG-based) ───────────────────
function AppIcon({ type, size = 32 }) {
  const r = Math.round(size * 0.225);
  if (type === "messages") return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs><linearGradient id="msg-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5DF075"/><stop offset="100%" stopColor="#19C335"/></linearGradient></defs>
      <rect width="32" height="32" rx={r} fill="url(#msg-g)"/>
      <path d="M7 9.5C7 8.12 8.12 7 9.5 7h13C23.88 7 25 8.12 25 9.5v8C25 18.88 23.88 20 22.5 20H18l-4 4.5-1.5-4.5H9.5C8.12 20 7 18.88 7 17.5V9.5z" fill="white"/>
    </svg>
  );
  if (type === "calendar") return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx={r} fill="white"/>
      <rect x="0" y="0" width="32" height="9" rx={r} fill="#FC3D39"/>
      <rect x="0" y="5" width="32" height="4" fill="#FC3D39"/>
      <text x="16" y="7.5" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="800" fontFamily="-apple-system,sans-serif">{new Date().toLocaleString('en-US',{month:'short'}).toUpperCase()}</text>
      <text x="16" y="22" textAnchor="middle" fill="#1a1a1a" fontSize="12" fontWeight="800" fontFamily="-apple-system,sans-serif">{new Date().getDate()}</text>
    </svg>
  );
  if (type === "clientsurge") return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs><linearGradient id="cs-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00AEEF"/><stop offset="100%" stopColor="#003B8F"/></linearGradient></defs>
      <rect width="32" height="32" rx={r} fill="url(#cs-g)"/>
      <polygon points="18,6 10,17 15.5,17 14,26 22,15 16.5,15" fill="white" opacity="0.95"/>
    </svg>
  );
  if (type === "settings") return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs><linearGradient id="set-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A0A0A5"/><stop offset="100%" stopColor="#636366"/></linearGradient></defs>
      <rect width="32" height="32" rx={r} fill="url(#set-g)"/>
      {[0,45,90,135,180,225,270,315].map((deg,i)=>{
        const rad=(deg*Math.PI)/180;
        return <line key={i} x1={16+Math.cos(rad)*6.5} y1={16+Math.sin(rad)*6.5} x2={16+Math.cos(rad)*9.5} y2={16+Math.sin(rad)*9.5} stroke="white" strokeWidth="2.8" strokeLinecap="round"/>;
      })}
      <circle cx="16" cy="16" r="4.5" fill="url(#set-g)"/><circle cx="16" cy="16" r="2.2" fill="white"/>
    </svg>
  );
  if (type === "safari") return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs><linearGradient id="saf-g" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#1A8BFF"/><stop offset="100%" stopColor="#38CFFF"/></linearGradient></defs>
      <rect width="32" height="32" rx={r} fill="url(#saf-g)"/>
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="white" strokeWidth="1.2" opacity="0.5"/>
      <line x1="16" y1="8" x2="16" y2="24" stroke="white" strokeWidth="0.8" opacity="0.35"/>
      <line x1="8" y1="16" x2="24" y2="16" stroke="white" strokeWidth="0.8" opacity="0.35"/>
      <polygon points="16,8.5 19.5,19.5 16,17.5 12.5,19.5" fill="white" opacity="0.95"/>
      <polygon points="16,23.5 12.5,12.5 16,14.5 19.5,12.5" fill="#FF3B30" opacity="0.85"/>
    </svg>
  );
  if (type === "maps") return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs><linearGradient id="map-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#34C759"/><stop offset="100%" stopColor="#1CA34C"/></linearGradient></defs>
      <rect width="32" height="32" rx={r} fill="url(#map-g)"/>
      <path d="M6 20 Q12 16 16 12 Q20 8 26 10" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <circle cx="17" cy="11" r="4" fill="#FF3B30"/>
      <circle cx="17" cy="11" r="2" fill="white"/>
      <line x1="17" y1="15" x2="17" y2="19" stroke="#FF3B30" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  return null;
}

// ─── Enhancement 2: Home Screen Grid (blurred behind content) ─────────────
function HomeScreenGrid() {
  const apps = ["safari","maps","calendar","messages","settings","clientsurge","safari","maps","calendar","messages","settings","safari"];
  return (
    <div style={{ position:"absolute", inset:0, zIndex:0, display:"grid", gridTemplateColumns:"repeat(4, 1fr)", alignContent:"start", gap:"18px", padding:"18px 14px", opacity:0.18, pointerEvents:"none", filter:"blur(1.5px)" }}>
      {apps.map((t,i) => <div key={i} style={{display:"flex",justifyContent:"center"}}><AppIcon type={t} size={36}/></div>)}
    </div>
  );
}

// ─── Animated Counter ──────────────────────────────────────────────────────
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

// ─── Live Clock ────────────────────────────────────────────────────────────
function useLiveClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit", hour12:true }));
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit", hour12:true })), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

// ─── Enhancement 3: Hyper-accurate iPadOS Status Bar ─────────────────────
function StatusBar() {
  const time = useLiveClock();
  return (
    <div style={{ height:"32px", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 18px", flexShrink:0, position:"relative", zIndex:20 }}>
      <span style={{ fontSize:"12px", fontWeight:"700", color:"rgba(255,255,255,0.95)", fontVariantNumeric:"tabular-nums", letterSpacing:"-0.3px", fontFamily:"-apple-system,'SF Pro Display',sans-serif" }}>{time}</span>

      {/* Dynamic Island */}
      <div style={{ position:"absolute", left:"50%", top:"6px", transform:"translateX(-50%)", width:"90px", height:"20px", background:"#000", borderRadius:"12px", boxShadow:"0 0 0 1.5px rgba(255,255,255,0.08), inset 0 0 8px rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
        <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#1a1a1a", border:"1px solid rgba(255,255,255,0.06)" }}/>
        <div style={{ width:"9px", height:"9px", borderRadius:"50%", background:"#0a0a0a", border:"1.5px solid rgba(255,255,255,0.08)", boxShadow:"0 0 3px rgba(0,140,255,0.25)" }}/>
      </div>

      {/* Right icons */}
      <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
        <div style={{ display:"flex", alignItems:"flex-end", gap:"1.5px" }}>
          {[5,8,11,14].map((h,i) => <div key={i} style={{ width:"3px", height:`${h}px`, background: i<3 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.3)", borderRadius:"1.5px" }}/>)}
        </div>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 10a1 1 0 100 2 1 1 0 000-2z" fill="rgba(255,255,255,0.95)"/>
          <path d="M4.5 7.5C5.6 6.5 6.7 6 8 6s2.4.5 3.5 1.5" stroke="rgba(255,255,255,0.95)" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
          <path d="M1.5 4.5C3.2 2.8 5.4 2 8 2s4.8.8 6.5 2.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
        </svg>
        <div style={{ display:"flex", alignItems:"center", gap:"1px" }}>
          <span style={{ fontSize:"10px", fontWeight:"600", color:"rgba(255,255,255,0.8)", marginRight:"2px", fontFamily:"-apple-system,sans-serif" }}>71%</span>
          <div style={{ width:"22px", height:"11px", borderRadius:"3px", border:"1.5px solid rgba(255,255,255,0.55)", padding:"1.5px", display:"flex", alignItems:"center" }}>
            <div style={{ width:"65%", height:"100%", background:"rgba(255,255,255,0.9)", borderRadius:"1px" }}/>
          </div>
          <div style={{ width:"2px", height:"5px", background:"rgba(255,255,255,0.45)", borderRadius:"0 1.5px 1.5px 0" }}/>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Banner ───────────────────────────────────────────────────
function NotificationBanner({ text, visible }) {
  return (
    <div style={{ position:"absolute", top:"40px", left:"50%", transform:`translateX(-50%) translateY(${visible?"0":"-70px"})`, opacity: visible?1:0, transition:"transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease", zIndex:30, background:"rgba(28,28,32,0.94)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:"18px", padding:"10px 14px", display:"flex", alignItems:"center", gap:"10px", border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 12px 32px rgba(0,0,0,0.5)", whiteSpace:"nowrap", minWidth:"240px" }}>
      <AppIcon type="clientsurge" size={28}/>
      <div>
        <p style={{ fontSize:"10px", fontWeight:"700", color:"rgba(255,255,255,0.55)", margin:0, letterSpacing:"0.02em", fontFamily:"-apple-system,sans-serif" }}>CLIENTSURGE · NOW</p>
        <p style={{ fontSize:"12px", fontWeight:"600", color:"rgba(255,255,255,0.95)", margin:"1px 0 0", fontFamily:"-apple-system,sans-serif" }}>{text}</p>
      </div>
    </div>
  );
}

// ─── Enhancement 4: Springboard Page Indicator ────────────────────────────
function PageIndicator({ activeIdx, total, onSelect }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"7px", justifyContent:"center", padding:"6px 0", position:"relative", zIndex:10 }}>
      {Array.from({ length: total }).map((_,i) => (
        <button key={i} type="button" aria-label={`Show dashboard panel ${i + 1}`} onClick={() => onSelect(i)} style={{ width: i===activeIdx?"20px":"6px", height:"6px", borderRadius:"9999px", background: i===activeIdx?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.3)", border:"none", cursor:"pointer", padding:0, transition:"width 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.3s ease" }}/>
      ))}
    </div>
  );
}

// ─── Dashboard Card ────────────────────────────────────────────────────────
function DashboardCard({ industry, visible }) {
  const val0 = useCounter(industry.metrics[0].val, 1200);
  const val1 = useCounter(industry.metrics[1].val, 1400);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick(0);
    let i = 0;
    const interval = setInterval(() => { i++; setTick(i); }, 900);
    return () => clearInterval(interval);
  }, [industry]);
  const visibleChecks = Math.min(tick, industry.checks.length);
  return (
    <div style={{ position:"absolute", right:"10px", top:"50%", transform:`translateY(-50%) ${visible?"translateX(0) scale(1)":"translateX(30px) scale(0.95)"}`, opacity: visible?1:0, transition:"transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease", width:"190px", background:"rgba(255,255,255,0.12)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:"18px", boxShadow:"0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.2)", padding:"14px", zIndex:10 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"10px" }}>
        <div>
          <p style={{ fontSize:"10px", fontWeight:"800", color:"rgba(255,255,255,0.9)", margin:0 }}>{industry.cardTitle}</p>
          <p style={{ fontSize:"9px", color:"rgba(255,255,255,0.45)", margin:"2px 0 0", fontWeight:"600" }}>{industry.cardSub}</p>
        </div>
        <span style={{ fontSize:"8px", fontWeight:"800", color:"#4ade80", background:"rgba(74,222,128,0.15)", border:"1px solid rgba(74,222,128,0.3)", padding:"2px 7px", borderRadius:"999px" }}>LIVE</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px", marginBottom:"10px" }}>
        {[{ label:industry.metrics[0].label, val:val0 },{ label:industry.metrics[1].label, val:val1 }].map(m => (
          <div key={m.label} style={{ background:"rgba(255,255,255,0.08)", borderRadius:"10px", padding:"7px", border:"1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ fontSize:"7px", fontWeight:"700", color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 3px" }}>{m.label}</p>
            <p style={{ fontSize:"18px", fontWeight:"900", color:"#fff", margin:0, lineHeight:1 }}>{m.val}</p>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginBottom:"8px" }}>
        {industry.checks.map((check,i) => (
          <div key={check} style={{ display:"flex", alignItems:"center", gap:"6px", opacity: i<visibleChecks?1:0.2, transform: i<visibleChecks?"translateX(0)":"translateX(-4px)", transition:`opacity 0.3s ease ${i*0.08}s, transform 0.3s ease ${i*0.08}s` }}>
            <div style={{ width:"13px", height:"13px", borderRadius:"50%", flexShrink:0, background: i<visibleChecks?"linear-gradient(135deg,#00AEEF,#003B8F)":"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow: i<visibleChecks?"0 2px 6px rgba(0,174,239,0.4)":"none" }}>
              {i<visibleChecks && <svg width="7" height="7" viewBox="0 0 10 10" fill="none"><polyline points="2,5 4,7.5 8,2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span style={{ fontSize:"9px", fontWeight: i<visibleChecks?"700":"500", color: i<visibleChecks?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.3)" }}>{check}</span>
          </div>
        ))}
      </div>
      <div style={{ paddingTop:"7px", borderTop:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", gap:"5px" }}>
        <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#4ade80", boxShadow:"0 0 5px #4ade80", animation:"ipadPulse 2s infinite", flexShrink:0 }}/>
        <span style={{ fontSize:"8px", fontWeight:"700", color:"rgba(255,255,255,0.5)" }}>{industry.footer}</span>
      </div>
    </div>
  );
}

// ─── Enhancement 1: Realistic iOS Dock ────────────────────────────────────
function AppDock() {
  const dockApps = [
    { type:"messages", label:"Messages" },
    { type:"calendar", label:"Calendar" },
    { type:"clientsurge", label:"ClientSurge" },
    { type:"settings", label:"Settings" },
  ];
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"5px 0 7px", background:"rgba(0,0,0,0.25)", borderTop:"0.5px solid rgba(255,255,255,0.1)", flexShrink:0, position:"relative", zIndex:10 }}>
      <div style={{ display:"flex", gap:"16px", alignItems:"center", background:"rgba(255,255,255,0.13)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", borderRadius:"20px", border:"0.5px solid rgba(255,255,255,0.2)", padding:"7px 16px", boxShadow:"0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
        {dockApps.map(app => (
          <div key={app.label} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"3px" }}>
            <div style={{ borderRadius:"9px", boxShadow:"0 3px 10px rgba(0,0,0,0.35)", overflow:"hidden" }}>
              <AppIcon type={app.type} size={34}/>
            </div>
            <span style={{ fontSize:"8px", color:"rgba(255,255,255,0.65)", fontWeight:"600", fontFamily:"-apple-system,sans-serif" }}>{app.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Screen Content ────────────────────────────────────────────────────────
function ScreenContent({ industry, fading, cardVisible }) {
  const PILLS = ["⚡ 60s Response", "🤖 AI-Powered", "📍 All Industries", "✅ No Contracts"];
  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative" }}>
      <HomeScreenGrid/>
      <div aria-hidden="true" style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:1 }}>
        <div style={{ position:"absolute", top:"-15%", left:"-5%", width:"55%", height:"55%", borderRadius:"50%", background:"radial-gradient(circle, rgba(0,174,239,0.2) 0%, transparent 70%)", filter:"blur(30px)" }}/>
        <div style={{ position:"absolute", bottom:"-10%", right:"15%", width:"50%", height:"50%", borderRadius:"50%", background:"radial-gradient(circle, rgba(0,59,143,0.28) 0%, transparent 70%)", filter:"blur(30px)" }}/>
      </div>
      <div style={{ flex:1, padding:"16px 200px 12px 16px", display:"flex", flexDirection:"column", gap:"10px", position:"relative", zIndex:2, opacity: fading?0:1, transform: fading?"translateY(4px)":"translateY(0)", transition:"opacity 0.35s ease, transform 0.35s ease" }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", background:"rgba(0,174,239,0.15)", border:"1px solid rgba(0,174,239,0.4)", borderRadius:"999px", padding:"3px 12px", fontSize:"9px", fontWeight:"800", color:"#00AEEF", letterSpacing:"0.12em", textTransform:"uppercase", alignSelf:"flex-start" }}>
          <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#00AEEF", display:"inline-block", animation:"ipadPulse 1.8s infinite" }}/>
          {industry.badge}
        </span>
        <h2 style={{ fontSize:"clamp(1.1rem, 2.8vw, 1.6rem)", fontWeight:"800", color:"#ffffff", lineHeight:1.1, margin:0, letterSpacing:"-0.03em", fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif" }}>
          {industry.headline}{" "}
          <span style={{ color:industry.color, filter:`drop-shadow(0 0 10px ${industry.color}80)` }}>{industry.accent}</span>
        </h2>
        <div style={{ width:"36px", height:"2px", background:`linear-gradient(90deg, ${industry.color}, transparent)`, borderRadius:"2px" }}/>
        <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.62)", lineHeight:1.6, maxWidth:"260px", margin:0, fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',sans-serif", fontWeight:"400" }}>{industry.sub}</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
          {PILLS.map(pill => <span key={pill} style={{ display:"inline-flex", alignItems:"center", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.13)", borderRadius:"999px", padding:"3px 9px", fontSize:"9px", fontWeight:"700", color:"rgba(255,255,255,0.78)" }}>{pill}</span>)}
        </div>
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("clientsurge:open-demo"))}
          style={{ display:"inline-flex", alignItems:"center", gap:"6px", alignSelf:"flex-start", background:"linear-gradient(135deg, #00AEEF 0%, #0088CC 50%, #003B8F 100%)", color:"#ffffff", fontWeight:"700", fontSize:"11px", padding:"8px 18px", borderRadius:"999px", border:"none", cursor:"pointer", boxShadow:"0 4px 14px rgba(0,174,239,0.45)", transition:"transform 0.15s ease", fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif" }}
          onMouseDown={e => e.currentTarget.style.transform="scale(0.96)"}
          onMouseUp={e => e.currentTarget.style.transform="scale(1)"}
          onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}>
          Make the Leap
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ height:"1px", background:"rgba(255,255,255,0.08)", borderRadius:"1px", margin:"2px 0" }}/>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
          {["Pay-as-you-go","3x avg bookings","Live in 24–48 hrs"].map(item => <span key={item} style={{ display:"inline-flex", alignItems:"center", background:"rgba(0,0,0,0.2)", borderRadius:"999px", padding:"2px 8px", fontSize:"8px", fontWeight:"700", color:"rgba(255,255,255,0.45)", border:"1px solid rgba(255,255,255,0.07)" }}>{item}</span>)}
        </div>
      </div>
      <DashboardCard industry={industry} visible={cardVisible}/>
    </div>
  );
}

// ─── Enhancement 5: Ultra-realistic iPad Pro Chassis ──────────────────────
function IPadChassis({ children }) {
  return (
    <div style={{ position:"relative", background:"linear-gradient(160deg, #3a3a3e 0%, #2c2c2f 15%, #1e1e21 40%, #161618 65%, #1c1c1f 85%, #252528 100%)", borderRadius:"30px", padding:"15px", boxShadow:["0 0 0 0.5px rgba(255,255,255,0.04)","0 1px 0 0.5px rgba(255,255,255,0.1)","0 40px 100px rgba(0,0,0,0.7)","0 16px 40px rgba(0,0,0,0.5)","0 4px 8px rgba(0,0,0,0.4)","inset 0 1px 0 rgba(255,255,255,0.06)"].join(", "), outline:"1px solid rgba(255,255,255,0.04)" }}>
      {/* Power button */}
      <div style={{ position:"absolute", right:"-3.5px", top:"90px", width:"3.5px", height:"48px", background:"linear-gradient(to right, #252528, #3a3a3e, #2c2c2f)", borderRadius:"0 4px 4px 0", boxShadow:"2px 0 5px rgba(0,0,0,0.5)" }}/>
      {/* Volume buttons */}
      <div style={{ position:"absolute", left:"-3.5px", top:"75px", width:"3.5px", height:"36px", background:"linear-gradient(to left, #252528, #3a3a3e)", borderRadius:"4px 0 0 4px", boxShadow:"-2px 0 5px rgba(0,0,0,0.4)" }}/>
      <div style={{ position:"absolute", left:"-3.5px", top:"120px", width:"3.5px", height:"36px", background:"linear-gradient(to left, #252528, #3a3a3e)", borderRadius:"4px 0 0 4px", boxShadow:"-2px 0 5px rgba(0,0,0,0.4)" }}/>
      <div style={{ position:"absolute", left:"-3.5px", top:"168px", width:"3.5px", height:"22px", background:"linear-gradient(to left, #252528, #3a3a3e)", borderRadius:"4px 0 0 4px" }}/>
      {/* Front camera */}
      <div style={{ position:"absolute", top:"6px", left:"50%", transform:"translateX(-50%)", display:"flex", alignItems:"center", gap:"4px" }}>
        <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:"#0d0d10", border:"0.5px solid rgba(255,255,255,0.04)" }}/>
        <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"radial-gradient(circle at 35% 35%, #1a1a22, #0a0a0e)", border:"1px solid rgba(255,255,255,0.07)", boxShadow:"0 0 4px rgba(0,120,255,0.12)" }}/>
        <div style={{ width:"3px", height:"3px", borderRadius:"50%", background:"#0d0d10" }}/>
      </div>
      {/* Screen */}
      <div style={{ borderRadius:"20px", overflow:"hidden", background:"#050810", boxShadow:"inset 0 0 0 1px rgba(0,0,0,0.8), inset 0 3px 12px rgba(0,0,0,0.6)", position:"relative" }}>
        <div aria-hidden="true" style={{ position:"absolute", inset:0, zIndex:50, pointerEvents:"none", borderRadius:"20px", background:"linear-gradient(130deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 20%, transparent 45%)" }}/>
        {children}
      </div>
      {/* Bottom bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"9px", paddingLeft:"20px", paddingRight:"20px" }}>
        <div style={{ display:"flex", gap:"5px" }}>{[0,1,2].map(i=><div key={i} style={{ width:"3px", height:"3px", borderRadius:"50%", background:"rgba(255,255,255,0.08)" }}/>)}</div>
        <div style={{ width:"40px", height:"4px", borderRadius:"9999px", background:"rgba(255,255,255,0.2)" }}/>
        <div style={{ display:"flex", gap:"5px" }}>{[0,1,2].map(i=><div key={i} style={{ width:"3px", height:"3px", borderRadius:"50%", background:"rgba(255,255,255,0.08)" }}/>)}</div>
      </div>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────
export default function HeroDashboardScreen() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const cycleRef = useRef(null);
  const touchStartX = useRef(null);

  const goToIndex = useCallback((newIdx) => {
    setFading(true);
    setCardVisible(false);
    setNotifVisible(false);
    clearTimeout(cycleRef.current);
    setTimeout(() => {
      setIdx(newIdx);
      setFading(false);
      setTimeout(() => {
        setCardVisible(true);
        setNotifVisible(true);
        setTimeout(() => setNotifVisible(false), 2800);
      }, 200);
    }, 380);
  }, []);

  useEffect(() => { const t = setTimeout(() => setCardVisible(true), 300); return () => clearTimeout(t); }, []);

  useEffect(() => {
    cycleRef.current = setTimeout(() => goToIndex((idx + 1) % INDUSTRIES.length), CYCLE_DURATION);
    return () => clearTimeout(cycleRef.current);
  }, [idx, goToIndex]);

  useEffect(() => {
    const t = setTimeout(() => { setNotifVisible(true); setTimeout(() => setNotifVisible(false), 2800); }, 800);
    return () => clearTimeout(t);
  }, []);

  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = e => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goToIndex(diff > 0 ? (idx+1)%INDUSTRIES.length : (idx-1+INDUSTRIES.length)%INDUSTRIES.length);
    touchStartX.current = null;
  };

  const industry = INDUSTRIES[idx];

  return (
    <div style={{ width:"100%", fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif" }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <IPadChassis>
        {/* Enhancement 3: Aurora wallpaper */}
        <div style={{ display:"flex", flexDirection:"column", background:"linear-gradient(150deg, #0d1f3c 0%, #0a2a5e 20%, #071535 40%, #0c1a3d 60%, #061028 80%, #0a1830 100%)", height:"600px", position:"relative", overflow:"hidden" }}>
          {/* Aurora layers */}
          <div aria-hidden="true" style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0 }}>
            <div style={{ position:"absolute", top:"-20%", left:"10%", width:"60%", height:"60%", borderRadius:"50%", background:"radial-gradient(ellipse, rgba(0,80,200,0.35) 0%, transparent 65%)", filter:"blur(40px)", animation:"auroraFloat 8s ease-in-out infinite" }}/>
            <div style={{ position:"absolute", top:"10%", right:"-10%", width:"50%", height:"50%", borderRadius:"50%", background:"radial-gradient(ellipse, rgba(0,140,240,0.25) 0%, transparent 65%)", filter:"blur(50px)", animation:"auroraFloat 10s ease-in-out infinite reverse" }}/>
            <div style={{ position:"absolute", bottom:"-10%", left:"20%", width:"55%", height:"45%", borderRadius:"50%", background:"radial-gradient(ellipse, rgba(30,0,180,0.3) 0%, transparent 65%)", filter:"blur(45px)", animation:"auroraFloat 12s ease-in-out infinite 2s" }}/>
            {[...Array(20)].map((_,i) => (
              <div key={i} style={{ position:"absolute", left:`${(i*37+11)%90+5}%`, top:`${(i*53+7)%85+5}%`, width:`${(i%3)+1}px`, height:`${(i%3)+1}px`, borderRadius:"50%", background:"rgba(255,255,255,0.6)", animation:`starTwinkle ${2+(i%3)}s ease-in-out infinite ${(i*0.3)%2}s` }}/>
            ))}
          </div>
          <StatusBar/>
          <NotificationBanner text={industry.notification} visible={notifVisible}/>
          <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative", zIndex:1 }}>
            <ScreenContent industry={industry} fading={fading} cardVisible={cardVisible}/>
          </div>
          {/* Enhancement 4: Page indicator */}
          <PageIndicator activeIdx={idx} total={INDUSTRIES.length} onSelect={goToIndex}/>
          <AppDock/>
        </div>
      </IPadChassis>
      <style>{`
        @keyframes ipadPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
        @keyframes auroraFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(15px,-10px) scale(1.05)} 66%{transform:translate(-10px,8px) scale(0.97)} }
        @keyframes starTwinkle { 0%,100%{opacity:0.6} 50%{opacity:0.1} }
      `}</style>
    </div>
  );
}
