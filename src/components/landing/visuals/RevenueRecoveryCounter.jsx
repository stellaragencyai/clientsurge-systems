/**
 * Revenue Recovery Counter — Premium iPad Pro mockup
 * All 10 enhancements: aluminum chassis, pill camera, deep bezels, physical buttons,
 * wallpaper, haptic tab switching, mouse-reactive reflection, Apple Pencil,
 * speaker grilles, boot/wake animation
 */
import { motion, useInView, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const SF = "-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',ui-sans-serif,sans-serif";
const SF_ROUNDED = "ui-rounded,'SF Pro Rounded','SF Pro Display',-apple-system,'Helvetica Neue',sans-serif";

const LEADS = [
  { name: "Sarah M.",  value: 480,  service: "Consultation" },
  { name: "James T.",  value: 720,  service: "Premium Package" },
  { name: "Lisa R.",   value: 340,  service: "Follow-Up Appt" },
  { name: "Carlos B.", value: 890,  service: "Full Service" },
  { name: "Nina W.",   value: 560,  service: "Intro Offer" },
];

function useCountUp(target, trigger, duration = 1.2) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [target, trigger, duration]);
  return val;
}

// iPhone-style status bar with Dynamic Island
function StatusBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      let h = d.getHours() % 12 || 12;
      const m = d.getMinutes().toString().padStart(2, "0");
      return `${h}:${m}`;
    };
    setTime(fmt());
    const t = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {/* Dynamic Island — iPhone 17 Pro slimmer pill shape */}
      <div style={{
        position: "absolute", left: "50%", top: "7px", transform: "translateX(-50%)",
        width: "72px", height: "19px", borderRadius: "999px", background: "#000",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.95), inset 0 1px 2px rgba(0,0,0,1)",
        zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
      }}>
        {/* Front camera — small circle on left */}
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0a0a14", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "inset 0 0 3px rgba(0,0,0,1), 0 0 4px rgba(60,80,200,0.35)" }} />
        {/* Face ID sensor array — tiny dot cluster on right */}
        <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
          <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#111" }} />
          <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#111" }} />
        </div>
      </div>

      {/* Status bar row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "30px 16px 4px", height: "52px",
      }}>
        <span style={{ fontSize: "12px", fontWeight: "800", color: "rgba(255,255,255,0.95)", letterSpacing: "-0.04em", fontFamily: SF, lineHeight: 1 }}>
          {time}
        </span>
        {/* Right: signal + wifi + battery */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Signal bars — iOS proportions, 4th bar at 0.25 opacity */}
          <svg width="17" height="12" viewBox="0 0 17 12">
            {[0,1,2,3].map(i => (
              <rect key={i} x={i*4.5} y={12-(i+1)*3} width="3.2" height={(i+1)*3} rx="1"
                fill={i < 3 ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.25)"} />
            ))}
          </svg>
          {/* Wifi */}
          <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
            <circle cx="7" cy="10" r="1.3" fill="rgba(255,255,255,0.85)" />
            <path d="M4.2 7.5C5.2 6.5 6 6.1 7 6.1C8 6.1 8.8 6.5 9.8 7.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
            <path d="M1.8 5C3.6 3.1 5.2 2.2 7 2.2C8.8 2.2 10.4 3.1 12.2 5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
          </svg>
          {/* Battery */}
          <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
            <div style={{ width: "24px", height: "12px", borderRadius: "3.5px", border: "1.5px solid rgba(255,255,255,0.5)", padding: "2px", display: "flex", alignItems: "center" }}>
              <div style={{ width: "72%", height: "100%", borderRadius: "1.5px", background: "linear-gradient(90deg,#4ade80,#22c55e)" }} />
            </div>
            <div style={{ width: "2px", height: "6px", borderRadius: "0 1.5px 1.5px 0", background: "rgba(255,255,255,0.4)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Dotted speaker grille
function SpeakerGrille({ count = 8, vertical = false }) {
  return (
    <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", gap: "3px", alignItems: "center", justifyContent: "center" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(255,255,255,0.12)", boxShadow: "inset 0 1px 1px rgba(0,0,0,0.6)" }} />
      ))}
    </div>
  );
}

export default function RevenueRecoveryCounter() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [recoveredCount, setRecoveredCount] = useState(0);
  const [replaying, setReplaying] = useState(false);
  const [awake, setAwake] = useState(false);
  const [glareX, setGlareX] = useState(30);
  const [glareY, setGlareY] = useState(20);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const total = LEADS.slice(0, recoveredCount).reduce((s, l) => s + l.value, 0);
  const displayTotal = useCountUp(total, inView, 0.9);

  // Boot/wake animation on scroll in
  useEffect(() => {
    if (!inView) return;
    setTimeout(() => setAwake(true), 300);
  }, [inView]);

  const runSequence = () => {
    let i = 0;
    const tick = () => {
      if (i < LEADS.length) { i++; setRecoveredCount(i); setTimeout(tick, 680); }
      else setReplaying(false);
    };
    setTimeout(tick, 400);
  };

  useEffect(() => {
    if (!inView) return;
    runSequence();
  }, [inView]);

  const handleReplay = () => {
    if (replaying) return;
    setReplaying(true);
    setRecoveredCount(0);
    setTimeout(runSequence, 200);
  };

  // Mouse-reactive reflection + tilt
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlareX(x);
    setGlareY(y);
    const tiltX = ((y - 50) / 50) * -8;
    const tiltY = ((x - 50) / 50) * 8;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "16px" }}>

      {/* Apple Pencil */}
      <div style={{
        position: "absolute",
        right: "-32px",
        top: "50%",
        transform: "translateY(-50%) rotate(8deg)",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        filter: "drop-shadow(2px 4px 8px rgba(0,0,0,0.4))",
      }}>
        <div style={{ width: "10px", height: "18px", borderRadius: "3px 3px 0 0", background: "linear-gradient(to right, #e8e8e8, #f5f5f5, #d0d0d0)", boxShadow: "inset -1px 0 2px rgba(0,0,0,0.15)" }} />
        <div style={{ width: "10px", height: "180px", background: "linear-gradient(to right, #d8d8d8 0%, #f8f8f8 30%, #ffffff 50%, #e8e8e8 70%, #c8c8c8 100%)", boxShadow: "inset -2px 0 4px rgba(0,0,0,0.12), 1px 0 3px rgba(0,0,0,0.08)" }}>
          <div style={{ marginTop: "60px", textAlign: "center", fontSize: "6px", color: "rgba(120,120,120,0.5)", fontWeight: "300", letterSpacing: "0.08em", transform: "rotate(180deg)", writingMode: "vertical-lr" }}>Apple Pencil</div>
        </div>
        <div style={{ width: "10px", height: "22px", background: "linear-gradient(to bottom, #d0d0d0, #a8a8a8)", clipPath: "polygon(0 0, 100% 0, 60% 100%, 40% 100%)" }} />
      </div>

      {/* iPhone 17 Pro Max body */}
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        style={{
          position: "relative",
          width: "340px",
          borderRadius: "64px",
          /* Enhancement 1: Titanium chassis — warm brushed titanium finish */
          background: "linear-gradient(160deg, #3a3733 0%, #2c2926 30%, #232120 60%, #1e1c1a 100%)",
          boxShadow: `
            0 50px 120px rgba(0,0,0,0.8),
            0 20px 50px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(210,195,175,0.18),
            inset 0 -1px 0 rgba(0,0,0,0.7),
            inset 1px 0 0 rgba(200,185,165,0.1),
            inset -1px 0 0 rgba(200,185,165,0.1)
          `,
          transformStyle: "preserve-3d",
          perspective: "1200px",
          cursor: "default",
          userSelect: "none",
        }}
      >
        {/* Titanium top edge highlight */}
        <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(210,195,175,0.22), rgba(230,215,195,0.28), rgba(210,195,175,0.22), transparent)", borderRadius: "999px", zIndex: 15 }} />

        {/* Left edge — Action button + volume buttons (titanium) */}
        <div style={{ position: "absolute", left: "-4px", top: "110px", width: "4px", height: "28px", borderRadius: "3px 0 0 3px", background: "linear-gradient(to right, #3a3530, #2a2520)", boxShadow: "-1px 0 3px rgba(0,0,0,0.9), inset 0 1px 0 rgba(210,195,175,0.15)", zIndex: 20 }} />
        <div style={{ position: "absolute", left: "-4px", top: "158px", width: "4px", height: "46px", borderRadius: "3px 0 0 3px", background: "linear-gradient(to right, #3a3530, #2a2520)", boxShadow: "-1px 0 3px rgba(0,0,0,0.9), inset 0 1px 0 rgba(210,195,175,0.15)", zIndex: 20 }} />
        <div style={{ position: "absolute", left: "-4px", top: "216px", width: "4px", height: "46px", borderRadius: "3px 0 0 3px", background: "linear-gradient(to right, #3a3530, #2a2520)", boxShadow: "-1px 0 3px rgba(0,0,0,0.9), inset 0 1px 0 rgba(210,195,175,0.15)", zIndex: 20 }} />

        {/* Right edge — power button (titanium) */}
        <div style={{ position: "absolute", right: "-4px", top: "170px", width: "4px", height: "66px", borderRadius: "0 3px 3px 0", background: "linear-gradient(to left, #3a3530, #2a2520)", boxShadow: "1px 0 3px rgba(0,0,0,0.9), inset 0 1px 0 rgba(210,195,175,0.15)", zIndex: 20 }} />

        {/* Titanium chassis ring — warm metallic rim */}
        <div style={{
          position: "absolute", inset: "8px", borderRadius: "54px", zIndex: 1, pointerEvents: "none",
          boxShadow: "inset 0 0 0 1px rgba(210,195,175,0.13), inset 0 1px 0 rgba(230,215,195,0.2), inset 0 -1px 0 rgba(0,0,0,0.5)",
          background: "linear-gradient(160deg, rgba(210,195,175,0.08) 0%, transparent 40%, rgba(0,0,0,0.2) 100%)",
        }} />

        {/* Enhancement 2: ProMotion OLED bloom — ambient glow around screen edge */}
        <div style={{
          position: "absolute", inset: "9px", borderRadius: "53px", zIndex: 1, pointerEvents: "none",
          boxShadow: `0 0 18px 2px rgba(88,54,170,0.18), 0 0 8px 1px rgba(20,80,200,0.12)`,
          opacity: awake ? 1 : 0,
          transition: "opacity 0.8s ease",
        }} />

        {/* Screen inset with deep bezel */}
        <div style={{
          margin: "10px",
          borderRadius: "52px",
          overflow: "hidden",
          background: "#000",
          boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.05), inset 0 2px 12px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,0.6)",
          position: "relative",
        }}>
          {/* Boot/wake overlay */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: awake ? 0 : 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              position: "absolute", inset: 0, zIndex: 50, pointerEvents: "none",
              background: "linear-gradient(160deg, #0a0a1a 0%, #000 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <motion.div
              animate={{ opacity: awake ? 0 : [0, 1, 1, 0] }}
              transition={{ duration: 1.2, times: [0, 0.2, 0.8, 1] }}
              style={{ fontSize: "28px", color: "rgba(255,255,255,0.9)" }}
            >
              <svg width="28" height="34" viewBox="0 0 814 1000" fill="rgba(255,255,255,0.85)">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 376.7 0 249.4 0 128.3 0 57.3 17.5-.4 52.9-32.4c35.4-32 82.3-51.2 127.3-51.2 49.2 0 91.4 20.7 121.5 53.9 30.1 33.2 53.3 84.1 53.3 143.6 0 2.6 0 5.2-.1 7.8 53.7-26.2 101.5-69.7 132.7-126.5C521.6-58.4 528-65.4 552-79.5c24-14.1 51.5-21.1 79.7-21.1 28.7 0 56.9 7.6 80.7 21.8 23.8 14.2 44.6 35.4 59.5 62.7 14.9 27.3 22.4 58.1 22.4 89.2-.1 0-.1 268.5-.1 268.5z"/>
              </svg>
            </motion.div>
          </motion.div>

          {/* Mouse-reactive glare overlay — follows cursor across glass */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", borderRadius: "42px", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              left: `${glareX}%`, top: `${glareY}%`,
              transform: "translate(-50%, -50%)",
              width: "180px", height: "180px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)",
              transition: "left 0.08s ease-out, top 0.08s ease-out",
              pointerEvents: "none",
            }} />
            {/* Static top-left specular highlight */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "35%",
              background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)",
              pointerEvents: "none",
            }} />
          </div>

          {/* Wallpaper layer — true OLED black with iOS 17-style aurora */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            background: "#000000",
          }}>
            <div style={{ position: "absolute", top: "-20%", left: "10%", width: "70%", height: "65%", borderRadius: "50%", background: "radial-gradient(circle, rgba(88,54,170,0.55) 0%, rgba(50,30,120,0.25) 50%, transparent 75%)", filter: "blur(38px)" }} />
            <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: "60%", height: "55%", borderRadius: "50%", background: "radial-gradient(circle, rgba(20,80,200,0.45) 0%, rgba(10,40,120,0.2) 50%, transparent 75%)", filter: "blur(32px)" }} />
            <div style={{ position: "absolute", top: "40%", left: "-10%", width: "50%", height: "40%", borderRadius: "50%", background: "radial-gradient(circle, rgba(140,60,200,0.2) 0%, transparent 70%)", filter: "blur(28px)" }} />
          </div>

          {/* Content */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: awake ? 1 : 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <StatusBar />

              <div style={{ padding: "18px 18px 20px" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.18em", color: "#00AEEF", marginBottom: "3px", fontFamily: SF }}>Revenue Recovered</p>
                    {/* Enhancement 3: SF Pro Rounded for numerics — matches iOS Lock Screen/Live Activity */}
                    <motion.p style={{ fontFamily: SF_ROUNDED, fontSize: "17px", fontWeight: "600", color: "#DDF4FF", lineHeight: 1, letterSpacing: "-0.02em", margin: 0, textShadow: "0 0 8px rgba(245,217,168,0.18)" }}>
                      ${displayTotal.toLocaleString()}
                    </motion.p>
                  </div>
                  {/* LIVE badge — iOS green with pulsing ring */}
                  <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "5px", borderRadius: "20px", padding: "4px 10px 4px 8px", fontSize: "11px", fontWeight: "800", background: "rgba(48,209,88,0.15)", border: "1px solid rgba(48,209,88,0.28)", letterSpacing: "0.08em", color: "#30D158" }}>
                    <div style={{ position: "relative", width: "5px", height: "5px", flexShrink: 0 }}>
                      <motion.div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#30D158" }} animate={{ scale: [1, 1.9, 1], opacity: [0.9, 0, 0.9] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }} />
                      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#30D158" }} />
                    </div>
                    LIVE
                  </div>
                </div>

                {/* Lead rows — real-time notification stack */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                  {LEADS.map((lead, i) => {
                    const recovered = i < recoveredCount;
                    const justArrived = i === recoveredCount - 1;
                    return (
                      <motion.div
                        key={lead.name}
                        initial={{ opacity: 0, y: -28, scaleX: 0.88 }}
                        animate={recovered
                          ? { opacity: 1, y: 0, scaleX: 1 }
                          : { opacity: 0, y: -28, scaleX: 0.88 }}
                        transition={recovered
                          ? { type: "spring", stiffness: 420, damping: 28, mass: 0.8 }
                          : { duration: 0 }}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          borderRadius: "12px", padding: "11px 15px", position: "relative", overflow: "hidden",
                          background: "rgba(48,209,88,0.1)",
                          boxShadow: justArrived
                            ? "inset 0 0 0 1px rgba(48,209,88,0.45), 0 0 12px rgba(48,209,88,0.25)"
                            : "inset 0 0 0 1px rgba(48,209,88,0.22)",
                          originX: 0.5, originY: 0,
                          transformOrigin: "top center",
                        }}
                        whileTap={{ scale: 0.97, transition: { type: "spring", stiffness: 500, damping: 30 } }}
                      >
                        {/* Flash on arrival */}
                        {justArrived && (
                          <motion.div
                            style={{ position: "absolute", inset: 0, background: "rgba(48,209,88,0.22)", pointerEvents: "none", borderRadius: "10px" }}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        )}
                        {/* iOS green checkmark badge */}
                        <motion.div
                          initial={recovered ? { scale: 0 } : { scale: 1 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 22, delay: 0.1 }}
                          style={{ width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#30D158", boxShadow: "0 2px 6px rgba(48,209,88,0.45)" }}
                        >
                          <svg width="9" height="7" viewBox="0 0 13 10" fill="none">
                            <path d="M1.5 5L5 8.5L11.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </motion.div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.95)", margin: 0, fontFamily: SF, letterSpacing: "-0.01em" }}>{lead.name}</p>
                          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", margin: 0, fontFamily: SF }}>{lead.service}</p>
                        </div>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.15 }}
                          style={{ fontSize: "14px", fontWeight: "800", fontVariantNumeric: "tabular-nums", color: "#30D158", fontFamily: SF_ROUNDED, letterSpacing: "-0.02em" }}
                        >
                          +${lead.value}
                        </motion.span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer — frosted glass iOS widget */}
                <div style={{ borderRadius: "12px", padding: "11px 15px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.14)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "5px", background: "linear-gradient(135deg, #0077B6, #00AEEF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.5)", margin: 0, letterSpacing: "0.04em", fontFamily: SF }}>Automated by ClientSurge</p>
                  </div>
                  <button onClick={handleReplay} disabled={replaying} style={{ background: replaying ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)", border: "none", borderRadius: "7px", padding: "4px 10px", fontSize: "11px", fontWeight: "700", color: replaying ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)", cursor: replaying ? "not-allowed" : "pointer", letterSpacing: "0.04em", transition: "all 0.2s", fontFamily: SF }}>
                    {replaying ? "···" : "↺ Replay"}
                  </button>
                </div>
              </div>

              {/* iPhone home indicator */}
              <div style={{ height: "26px", display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: "6px" }}>
                <div style={{ width: "80px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.28)" }} />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}