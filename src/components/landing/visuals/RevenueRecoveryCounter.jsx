/**
 * Visual 3: Revenue Recovery Counter
 * A dramatic, dark-glass card showing a real-time "recovering" revenue ticker.
 * Lost-lead rows cross off one by one as recovered revenue climbs — creating
 * instant visceral understanding of what the system does.
 * Distinct from the other two: dark background, financial/number-forward, no orbit.
 */
import { motion, useInView, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

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
      className="rounded-3xl p-6 max-w-sm w-full"
      style={{
        background: "linear-gradient(160deg, #1a100600 0%, #1a1008 100%)",
        background: "linear-gradient(160deg, #110b04 0%, #1e1509 100%)",
        border: "1.5px solid rgba(200,150,92,0.28)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(200,150,92,0.15)",
      }}
      aria-label="Revenue recovery visual"
    >
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
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{
                background: recovered ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)",
                border: recovered ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.5s ease",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
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
  );
}