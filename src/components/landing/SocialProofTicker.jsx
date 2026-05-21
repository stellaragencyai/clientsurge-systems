import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  countAutomatedBusinesses,
  formatAutomatedBusinessesStat,
} from "@/lib/socialProofStats";

const BASE_STATS = [
  "Under 60 sec lead response",
  "24-48 hr setup time",
  "100% done-for-you",
  "Up to 6 automations per client",
  "Serving Phoenix & Scottsdale",
];

export default function SocialProofTicker() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [stats, setStats] = useState(BASE_STATS);

  useEffect(() => {
    let cancelled = false;

    async function loadOrderCount() {
      try {
        const orders = await base44.entities.Order.filter({ payment_status: "paid" }, "-created_date", 2000);
        if (!cancelled) {
          const automatedBusinessesStat = formatAutomatedBusinessesStat(countAutomatedBusinesses(orders));
          setStats([automatedBusinessesStat, ...BASE_STATS]);
        }
      } catch {
        if (!cancelled) setStats(BASE_STATS);
      }
    }

    loadOrderCount();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % stats.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [stats.length]);

  return (
    <div
      style={{
        position: "sticky",
        top: "64px",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(154,92,46,0.12)",
        padding: "12px 24px",
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "#c8965c",
          animation: "pulse 2s ease-in-out infinite",
        }}
      />

      <motion.p
        key={activeIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5 }}
        style={{
          fontSize: "13px",
          fontWeight: "600",
          color: "#1b140d",
          margin: 0,
          textAlign: "center",
        }}
      >
        {stats[activeIndex]}
      </motion.p>

      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "#c8965c",
          animation: "pulse 2s ease-in-out infinite 0.3s",
        }}
      />

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
