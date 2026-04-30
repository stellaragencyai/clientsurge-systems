/**
 * Visual 3: Revenue Recovery Counter
 * A dramatic, dark-glass card showing a real-time "recovering" revenue ticker.
 * Lost-lead rows cross off one by one as recovered revenue climbs — creating
 * instant visceral understanding of what the system does.
 * Distinct from the other two: dark background, financial/number-forward, no orbit.
 */
import { motion, useInView, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// Status bar animation
const StatusBar = () => {
  const [time, setTime] = useState("9:41");
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 16px", fontSize: "11px", fontWeight: "600",
      background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(200,150,92,0.1)",
      color: "rgba(255,255,255,0.7)",
    }}>
      <span>{time}</span>
      <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
        <span>📶</span>
        <span>📡</span>
        <span>🔋 100%</span>
      </div>
    </div>
  );
};

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

export default function RevenueRecoveryCounter() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [recoveredCount, setRecoveredCount] = useState(0);
  const total = LEADS.slice(0, recoveredCount).reduce((s, l) => s + l.value, 0);
  const displayTotal = useCountUp(total, inView, 0.9);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const tick = () => {
      if (i < LEADS.length) {
        i++;
        setRecoveredCount(i);
        setTimeout(tick, 680);
      }
    };
    setTimeout(tick, 400);
  }, [inView]);

  return (
    <div
      ref={ref}
      className="rounded-3xl overflow-hidden max-w-sm w-full"
      style={{
        background: "linear-gradient(160deg, #110b04 0%, #1e1509 100%)",
        border: "2px solid rgba(200,150,92,0.3)",
        boxShadow: `
          0 40px 80px rgba(0,0,0,0.7),
          inset 0 1px 0 rgba(255,255,255,0.08),
          inset -2px -2px 8px rgba(0,0,0,0.6),
          0 0 40px rgba(200,150,92,0.15)
        `,
        position: "relative",
      }}
      aria-label="Revenue recovery visual"
    >
      {/* Screen reflection */}
      <div style={{
        position: "absolute", top: 0, left: "8%", right: "auto",
        width: "200px", height: "200px",
        background: "radial-gradient(circle at center, rgba(255,255,255,0.12) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none", zIndex: 1,
      }} />
      
      <div style={{ position: "relative", zIndex: 2 }}>
        <StatusBar />
        
        <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1" style={{ color: "#c8965c" }}>
            Revenue Recovered
          </p>
          <motion.p
            className="font-display text-3xl font-bold"
            style={{ color: "#f5d9a8" }}
          >
            ${displayTotal.toLocaleString()}
          </motion.p>
        </div>
        <div
          className="rounded-xl px-3 py-1.5 text-xs font-bold"
          style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}
        >
          Live
        </div>
      </div>

      {/* Lead rows */}
      <div className="space-y-2 mb-4">
        {LEADS.map((lead, i) => {
          const recovered = i < recoveredCount;
          return (
            <motion.div
              key={lead.name}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 relative overflow-hidden"
              style={{
                background: recovered ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)",
                border: recovered ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.5s ease",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onTap={() => {}} // Enable touch ripple
            >
              {/* Touch ripple */}
              {recovered && (
                <motion.div
                  style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(circle, rgba(74,222,128,0.3) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }}
                  animate={{ scale: [0.5, 2] }}
                  transition={{ duration: 0.6 }}
                />
              )}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: recovered ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)",
                  color: recovered ? "#4ade80" : "rgba(255,255,255,0.3)",
                  transition: "all 0.4s ease",
                }}
              >
                {recovered ? "✓" : lead.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold truncate"
                  style={{ color: recovered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)", transition: "color 0.4s" }}
                >
                  {lead.name}
                </p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{lead.service}</p>
              </div>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: recovered ? "#4ade80" : "rgba(255,255,255,0.2)", transition: "color 0.4s" }}
              >
                ${lead.value}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Footer bar */}
      <div className="rounded-xl px-3 py-2 flex items-center justify-between"
        style={{ background: "rgba(200,150,92,0.08)", border: "1px solid rgba(200,150,92,0.15)" }}>
        <p className="text-[10px] font-semibold" style={{ color: "rgba(200,150,92,0.7)" }}>
          Automated by ClientSurge
        </p>
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ background: "#c8965c" }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      </div>
      </div>

      {/* Side Buttons - Right Edge */}
      <div style={{
        position: "absolute",
        right: "-8px",
        top: "100px",
        width: "8px",
        height: "60px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        justifyContent: "flex-start",
      }}>
        {/* Power Button */}
        <div style={{
          width: "8px",
          height: "20px",
          borderRadius: "2px",
          background: "linear-gradient(to right, rgba(200,150,92,0.6), rgba(150,100,50,0.8))",
          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4)",
        }} />
        {/* Volume Up Button */}
        <div style={{
          width: "8px",
          height: "16px",
          borderRadius: "2px",
          background: "linear-gradient(to right, rgba(180,130,70,0.7), rgba(140,90,40,0.85))",
          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.35)",
        }} />
        {/* Volume Down Button */}
        <div style={{
          width: "8px",
          height: "16px",
          borderRadius: "2px",
          background: "linear-gradient(to right, rgba(180,130,70,0.7), rgba(140,90,40,0.85))",
          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.35)",
        }} />
      </div>

      {/* Bottom Port and Speakers */}
      <div style={{
        position: "absolute",
        bottom: "-12px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100px",
        height: "12px",
        display: "flex",
        gap: "8px",
        justifyContent: "center",
        alignItems: "center",
      }}>
        {/* Charging Port */}
        <div style={{
          width: "30px",
          height: "8px",
          borderRadius: "2px",
          background: "linear-gradient(to bottom, rgba(100,50,20,0.8), rgba(50,30,10,0.9))",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8), 0 1px 2px rgba(255,255,255,0.1)",
        }} />
        {/* Speaker Grille Left */}
        <div style={{
          width: "14px",
          height: "6px",
          borderRadius: "1px",
          background: "repeating-linear-gradient(90deg, rgba(80,40,20,0.9) 0px, rgba(80,40,20,0.9) 1px, rgba(60,30,10,0.95) 1px, rgba(60,30,10,0.95) 3px)",
        }} />
        {/* Speaker Grille Right */}
        <div style={{
          width: "14px",
          height: "6px",
          borderRadius: "1px",
          background: "repeating-linear-gradient(90deg, rgba(80,40,20,0.9) 0px, rgba(80,40,20,0.9) 1px, rgba(60,30,10,0.95) 1px, rgba(60,30,10,0.95) 3px)",
        }} />
      </div>

      {/* Front-Facing Camera */}
      <div style={{
        position: "absolute",
        top: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, rgba(150,150,150,0.9), rgba(40,40,50,0.95))",
        boxShadow: "inset -1px -1px 2px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.5), inset 0 0 3px rgba(100,100,120,0.3)",
        zIndex: 5,
      }}>
        {/* Camera Lens Gleam */}
        <div style={{
          position: "absolute",
          top: "2px",
          left: "2px",
          width: "3px",
          height: "3px",
          borderRadius: "50%",
          background: "rgba(200,200,220,0.6)",
          filter: "blur(0.5px)",
        }} />
      </div>

      {/* Home indicator */}
      <div style={{
       height: "20px", background: "rgba(0,0,0,0.3)",
       display: "flex", alignItems: "center", justifyContent: "center",
       borderTop: "1px solid rgba(200,150,92,0.08)",
      }}>
       <motion.div
         style={{
           width: "120px", height: "4px", borderRadius: "2px",
           background: "rgba(255,255,255,0.2)",
         }}
         animate={{ opacity: [0.3, 0.6, 0.3] }}
         transition={{ duration: 2, repeat: Infinity }}
       />
      </div>
      </div>
      </div>
      );
      }