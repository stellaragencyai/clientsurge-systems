/**
 * Revenue Recovery Counter — Premium iPad Pro mockup
 * All 10 enhancements: aluminum chassis, pill camera, deep bezels, physical buttons,
 * wallpaper, haptic tab switching, mouse-reactive reflection, Apple Pencil,
 * speaker grilles, boot/wake animation
 */
import { motion, useInView, animate, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const SF = "-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',ui-sans-serif,sans-serif";

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

// iPadOS status bar
function StatusBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      let h = d.getHours() % 12 || 12;
      const m = d.getMinutes().toString().padStart(2, "0");
      const ap = d.getHours() >= 12 ? "PM" : "AM";
      return `${h}:${m} ${ap}`;
    };
    setTime(fmt());
    const t = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "6px 18px 4px", height: "30px", position: "relative", flexShrink: 0,
    }}>
      <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.85)", letterSpacing: "-0.02em", minWidth: "52px" }}>
        {time}
      </span>
      {/* Pill camera — centered */}
      <div style={{
        position: "absolute", left: "50%", top: "6px", transform: "translateX(-50%)",
        width: "62px", height: "16px", borderRadius: "999px", background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 2px rgba(0,0,0,0.8)",
        zIndex: 10,
      }}>
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#0d1020", border: "1px solid rgba(80,100,180,0.6)", boxShadow: "0 0 4px rgba(60,80,160,0.7)" }} />
        <div style={{ width: "16px", height: "3px", borderRadius: "2px", background: "#111", border: "1px solid rgba(255,255,255,0.05)" }} />
      </div>
      {/* System icons */}
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <svg width="13" height="10" viewBox="0 0 13 10">
          {[0,1,2,3].map(i => <rect key={i} x={i*3.2} y={10-(i+1)*2.4} width="2.4" height={(i+1)*2.4} rx="0.6" fill={i<3?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.2)"} />)}
        </svg>
        <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
          <circle cx="6.5" cy="9" r="1.2" fill="rgba(255,255,255,0.8)" />
          <path d="M3.8 6.8C4.7 5.9 5.5 5.5 6.5 5.5C7.5 5.5 8.3 5.9 9.2 6.8" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          <path d="M1.5 4.5C3.1 2.8 4.7 2 6.5 2C8.3 2 9.9 2.8 11.5 4.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
          <div style={{ width: "22px", height: "10px", borderRadius: "3px", border: "1.5px solid rgba(255,255,255,0.5)", padding: "1.5px", display: "flex", alignItems: "center" }}>
            <div style={{ width: "75%", height: "100%", borderRadius: "1.5px", background: "linear-gradient(90deg,#4ade80,#22c55e)" }} />
          </div>
          <div style={{ width: "2px", height: "5px", borderRadius: "0 1.5px 1.5px 0", background: "rgba(255,255,255,0.4)" }} />
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

      {/* iPad body */}
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        style={{
          position: "relative",
          width: "480px",
          borderRadius: "32px",
          background: "#000000",
          boxShadow: `
            0 50px 120px rgba(0,0,0,0.75),
            0 20px 50px rgba(0,0,0,0.45),
            inset 0 1px 0 rgba(255,255,255,0.06),
            inset 0 -1px 0 rgba(0,0,0,0.6)
          `,
          transformStyle: "preserve-3d",
          perspective: "1200px",
          cursor: "default",
          userSelect: "none",
        }}
      >
        {/* Subtle top edge */}
        <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), rgba(255,255,255,0.08), rgba(255,255,255,0.06), transparent)", borderRadius: "999px", zIndex: 15 }} />

        {/* Left edge — volume buttons — black */}
        <div style={{ position: "absolute", left: "-5px", top: "100px", width: "5px", height: "44px", borderRadius: "3px 0 0 3px", background: "#1a1a1a", boxShadow: "-1px 0 3px rgba(0,0,0,0.7)", zIndex: 20 }} />
        <div style={{ position: "absolute", left: "-5px", top: "156px", width: "5px", height: "44px", borderRadius: "3px 0 0 3px", background: "#1a1a1a", boxShadow: "-1px 0 3px rgba(0,0,0,0.7)", zIndex: 20 }} />

        {/* Right edge — power button — black */}
        <div style={{ position: "absolute", right: "-5px", top: "112px", width: "5px", height: "64px", borderRadius: "0 3px 3px 0", background: "#1a1a1a", boxShadow: "1px 0 3px rgba(0,0,0,0.7)", zIndex: 20 }} />

        {/* Top speaker grille */}
        <div style={{ position: "absolute", top: "12px", left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
          <SpeakerGrille count={10} />
        </div>

        {/* Bottom speaker grille */}
        <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
          <SpeakerGrille count={10} />
        </div>

        {/* Screen inset with deep bezel */}
        <div style={{
          margin: "14px",
          borderRadius: "22px",
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

          {/* Wallpaper layer */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            background: "linear-gradient(145deg, #0f1520 0%, #1a0a2e 35%, #0a1525 65%, #151020 100%)",
          }}>
            <div style={{ position: "absolute", top: "-10%", left: "20%", width: "60%", height: "60%", borderRadius: "50%", background: "radial-gradient(circle, rgba(100,60,180,0.5) 0%, transparent 70%)", filter: "blur(30px)" }} />
            <div style={{ position: "absolute", bottom: "0%", right: "5%", width: "50%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, rgba(30,100,200,0.4) 0%, transparent 70%)", filter: "blur(25px)" }} />
          </div>

          {/* Content */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: awake ? 1 : 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <StatusBar />

              <div style={{ padding: "16px 18px 18px" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.18em", color: "#c8965c", marginBottom: "4px", fontFamily: SF }}>Revenue Recovered</p>
                    <motion.p style={{ fontFamily: SF, fontSize: "34px", fontWeight: "800", color: "#f5d9a8", lineHeight: 1, letterSpacing: "-0.03em", margin: 0 }}>
                      ${displayTotal.toLocaleString()}
                    </motion.p>
                  </div>
                  <div style={{ borderRadius: "8px", padding: "4px 12px", fontSize: "12px", fontWeight: "800", background: "rgba(34,197,94,0.18)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)", letterSpacing: "0.06em" }}>
                    LIVE
                  </div>
                </div>

                {/* Lead rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                  {LEADS.map((lead, i) => {
                    const recovered = i < recoveredCount;
                    return (
                      <motion.div
                        key={lead.name}
                        style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          borderRadius: "10px", padding: "10px 14px", position: "relative", overflow: "hidden",
                          background: recovered ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                          border: recovered ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(255,255,255,0.06)",
                          transition: "all 0.45s ease",
                        }}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                      >
                        {recovered && (
                          <motion.div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, rgba(74,222,128,0.2) 0%, transparent 70%)", pointerEvents: "none" }}
                            animate={{ scale: [0.4, 2] }} transition={{ duration: 0.55 }} />
                        )}
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", background: recovered ? "rgba(34,197,94,0.22)" : "rgba(255,255,255,0.07)", color: recovered ? "#4ade80" : "rgba(255,255,255,0.3)", transition: "all 0.4s", fontFamily: SF }}>
                          {recovered ? "✓" : lead.name[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: "600", color: recovered ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.3)", transition: "color 0.4s", margin: 0, fontFamily: SF, letterSpacing: "-0.01em" }}>{lead.name}</p>
                          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)", margin: 0, fontFamily: SF }}>{lead.service}</p>
                        </div>
                        <span style={{ fontSize: "15px", fontWeight: "800", fontVariantNumeric: "tabular-nums", color: recovered ? "#4ade80" : "rgba(255,255,255,0.18)", transition: "color 0.4s", fontFamily: SF, letterSpacing: "-0.01em" }}>${lead.value}</span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div style={{ borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(200,150,92,0.1)", border: "1px solid rgba(200,150,92,0.18)" }}>
                  <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(200,150,92,0.75)", margin: 0, letterSpacing: "0.04em", fontFamily: SF }}>Automated by ClientSurge</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button onClick={handleReplay} disabled={replaying} style={{ background: replaying ? "rgba(200,150,92,0.06)" : "rgba(200,150,92,0.18)", border: "1px solid rgba(200,150,92,0.28)", borderRadius: "5px", padding: "3px 10px", fontSize: "11px", fontWeight: "800", color: replaying ? "rgba(200,150,92,0.35)" : "rgba(200,150,92,0.95)", cursor: replaying ? "not-allowed" : "pointer", letterSpacing: "0.06em", transition: "all 0.2s" }}>
                      {replaying ? "···" : "↺ Replay"}
                    </button>
                    <motion.div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c8965c" }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
                  </div>
                </div>
              </div>

              {/* Home indicator */}
              <div style={{ height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "100px", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.2)" }} />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}