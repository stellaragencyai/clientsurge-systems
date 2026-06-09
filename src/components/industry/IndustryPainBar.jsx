import { useEffect, useRef, useState } from "react";

function useCountUp(target, duration = 1600, shouldStart = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!shouldStart) return;
    const numericTarget = parseFloat(String(target).replace(/[^0-9.]/g, "")) || 0;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * numericTarget * 10) / 10);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, shouldStart]);
  return count;
}

function PainStatCard({ stat, delay = 0 }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const numericTarget = parseFloat(String(stat.value).replace(/[^0-9.]/g, "")) || 0;
  const suffix = String(stat.value).replace(/[0-9.]/g, "").trim();
  const count = useCountUp(numericTarget, 1600, started);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStarted(true); observer.disconnect(); }
    }, { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const displayValue = numericTarget > 0 ? `${count}${suffix}` : stat.value;

  return (
    <div
      ref={ref}
      className="rounded-xl px-6 py-6 text-center transition-all duration-300"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0,136,204,0.14)",
        boxShadow: "0 14px 36px rgba(0,59,143,0.09)",
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="text-3xl mb-2">{stat.icon}</div>
      <p
        className="font-black mb-1"
        style={{ fontSize: "clamp(1.8rem, 3.8vw, 2.6rem)", color: "#005f99", lineHeight: 1.02, fontFamily: "var(--font-display)" }}
      >
        {displayValue}
      </p>
      <p className="text-sm font-semibold leading-snug" style={{ color: "rgba(5,19,46,0.82)" }}>
        {stat.label}
      </p>
      {stat.sub && (
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{stat.sub}</p>
      )}
    </div>
  );
}

export default function IndustryPainBar({ stats }) {
  return (
    <section className="relative z-20 px-4 pb-12 md:px-6 md:pb-16" style={{ background: "#ffffff" }}>
      <div className="max-w-6xl mx-auto" style={{ marginTop: "clamp(-3.5rem, -5vw, -2rem)" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {stats.map((stat, i) => (
            <PainStatCard key={i} stat={stat} delay={i * 120} />
          ))}
        </div>
      </div>
    </section>
  );
}