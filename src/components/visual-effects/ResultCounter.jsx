import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function ResultCounter({ yourMetric, benchmarkMetric, yourLabel, benchmarkLabel }) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [displayYour, setDisplayYour] = useState(0);
  const [displayBenchmark, setDisplayBenchmark] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isVisible) {
        setIsVisible(true);
      }
    }, { threshold: 0.3 });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let frame = 0;
    const duration = 60;
    const interval = setInterval(() => {
      frame++;
      const progress = Math.min(frame / duration, 1);

      setDisplayYour(Math.floor(yourMetric * progress));
      setDisplayBenchmark(Math.floor(benchmarkMetric * progress));

      if (progress === 1) clearInterval(interval);
    }, 16);

    return () => clearInterval(interval);
  }, [isVisible, yourMetric, benchmarkMetric]);

  const gap = Math.max(yourMetric - benchmarkMetric, 0);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        maxWidth: "400px",
      }}
    >
      {/* Your Metric */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: "center",
          padding: "24px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, rgba(200,150,92,0.15) 0%, rgba(245,217,168,0.1) 100%)",
          border: "1px solid rgba(200,150,92,0.25)",
        }}
      >
        <div style={{ fontSize: "36px", fontWeight: "900", color: "#c8965c", marginBottom: "8px" }}>
          {displayYour}x
        </div>
        <div style={{ fontSize: "12px", fontWeight: "600", color: "rgba(27,20,13,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {yourLabel}
        </div>
      </motion.div>

      {/* Benchmark Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        style={{
          textAlign: "center",
          padding: "16px",
          borderRadius: "12px",
          background: "rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: "600", color: "rgba(27,20,13,0.5)", marginBottom: "8px" }}>
          vs Industry Average
        </div>
        <div style={{ fontSize: "20px", fontWeight: "800", color: "rgba(27,20,13,0.6)" }}>
          {displayBenchmark}x
        </div>
        <div style={{ fontSize: "10px", fontWeight: "600", color: "rgba(27,20,13,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "4px" }}>
          {benchmarkLabel}
        </div>
      </motion.div>

      {/* Gap visualization */}
      {gap > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            textAlign: "center",
            fontSize: "11px",
            fontWeight: "700",
            color: "#22c55e",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          ↑ {gap}x better than average
        </motion.div>
      )}
    </div>
  );
}