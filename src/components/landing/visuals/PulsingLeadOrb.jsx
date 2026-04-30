/**
 * Visual 1: Pulsing Lead Orb
 * A live-feeling "lead arriving" animation — a glowing golden orb at the center
 * with concentric ripple rings radiating outward, surrounded by orbiting
 * micro-dots representing channels (SMS, Email, Call, Web).
 * Great for a hero accent or section intro.
 */
import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useState } from "react";

const CHANNELS = [
  { label: "SMS", angle: 0,   color: "#22c55e" },
  { label: "Call", angle: 90,  color: "#f59e0b" },
  { label: "Email", angle: 180, color: "#3b82f6" },
  { label: "Web",  angle: 270, color: "#a855f7" },
];

function OrbitDot({ label, angle, color, orbitRadius = 88 }) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * orbitRadius;
  const y = Math.sin(rad) * orbitRadius;

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-1 pointer-events-none"
      style={{ left: "50%", top: "50%", x: x - 20, y: y - 20 }}
      animate={{ x: [x - 20, x - 20 + 2, x - 20], y: [y - 20, y - 20 - 3, y - 20] }}
      transition={{ duration: 2.5 + angle * 0.005, repeat: Infinity, ease: "easeInOut", delay: angle * 0.01 }}
    >
      <motion.div
        className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
        style={{ background: color, boxShadow: `0 0 18px ${color}88` }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 2 + angle * 0.003, repeat: Infinity, ease: "easeInOut" }}
      >
        {label}
      </motion.div>
    </motion.div>
  );
}

function RippleRing({ delay, maxScale = 2.8 }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full border border-primary/30 pointer-events-none"
      style={{ margin: "auto", width: 72, height: 72 }}
      animate={{ scale: [1, maxScale], opacity: [0.6, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", delay }}
    />
  );
}

export default function PulsingLeadOrb({ size = 260 }) {
  const [count, setCount] = useState(0);
  const controls = useAnimationControls();

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + 1);
      controls.start({ scale: [1, 1.18, 1], transition: { duration: 0.45 } });
    }, 3200);
    return () => clearInterval(id);
  }, [controls]);

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Ripple rings */}
      <RippleRing delay={0} />
      <RippleRing delay={0.9} />
      <RippleRing delay={1.8} />

      {/* Central orb */}
      <motion.div
        animate={controls}
        className="relative z-10 w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #6b3f1f 0%, #c8965c 50%, #9a5c2e 100%)",
          boxShadow: "0 0 40px rgba(200,150,92,0.55), 0 0 80px rgba(154,92,46,0.25), inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        <span className="text-white font-display font-bold text-lg leading-none">{count}</span>
        <span className="text-white/70 text-[9px] font-semibold uppercase tracking-widest mt-0.5">Leads</span>
      </motion.div>

      {/* Orbiting channel dots */}
      {CHANNELS.map((ch) => (
        <OrbitDot key={ch.label} {...ch} />
      ))}
    </div>
  );
}