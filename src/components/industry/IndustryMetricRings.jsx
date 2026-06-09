import { useEffect, useRef, useState } from "react";

function useCountUp(target, duration = 1800, shouldStart = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!shouldStart) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, shouldStart]);
  return count;
}

function StatRing({ value, label, sublabel, color = "#0088CC", size = 120 }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const numericTarget = parseInt(String(value).replace(/[^0-9]/g, "")) || 0;
  const suffix = String(value).replace(/[0-9]/g, "").trim();
  const count = useCountUp(numericTarget, 1600, started);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStarted(true); observer.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const progress = numericTarget > 0 ? (count / numericTarget) * circumference : 0;

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(0,136,204,0.1)" strokeWidth="8" />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-black leading-none" style={{ fontSize: size > 100 ? "1.5rem" : "1.1rem", color }}>
            {count}{suffix}
          </p>
        </div>
      </div>
      <p className="font-bold text-sm text-foreground mt-2 leading-snug">{label}</p>
      {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
    </div>
  );
}

const RING_CONFIGS = {
  hvac: [
    { value: "85%", label: "Calls answered", sublabel: "Under 2 minutes" },
    { value: "5", label: "Extra service calls", sublabel: "Per week avg" },
    { value: "28%", label: "Revenue increase", sublabel: "Month one avg" },
    { value: "25%", label: "No-show reduction", sublabel: "With AI reminders" },
  ],
  roofing: [
    { value: "91%", label: "Inquiries answered", sublabel: "Under 5 minutes" },
    { value: "60%", label: "Storm claims won", sublabel: "First responder advantage" },
    { value: "2", label: "More estimates", sublabel: "Closed per week" },
    { value: "56%", label: "Old leads reactivated", sublabel: "With re-engagement" },
  ],
  contractors: [
    { value: "88%", label: "Inquiries answered", sublabel: "Under 2 hours" },
    { value: "80%", label: "Bid win increase", sublabel: "Under 2 min response" },
    { value: "4", label: "More job bids", sublabel: "Per month avg" },
    { value: "56%", label: "Old quotes reactivated", sublabel: "With follow-up" },
  ],
  "med-spa": [
    { value: "82%", label: "Inquiries answered", sublabel: "Under 60 seconds" },
    { value: "3", label: "More bookings", sublabel: "Per week avg" },
    { value: "75%", label: "Consult conversion lift", sublabel: "With instant response" },
    { value: "80%", label: "No-show reduction", sublabel: "With deposits & reminders" },
  ],
  dental: [
    { value: "68%", label: "Inquiries answered", sublabel: "Under 60 seconds" },
    { value: "3", label: "More confirmed appts", sublabel: "Per week avg" },
    { value: "35%", label: "Booking increase", sublabel: "2nd touch follow-up" },
    { value: "20%", label: "No-show reduction", sublabel: "Automated reminders" },
  ],
  chiropractic: [
    { value: "71%", label: "Inquiries answered", sublabel: "Under 60 seconds" },
    { value: "3", label: "More bookings", sublabel: "Per week avg" },
    { value: "88%", label: "Care plan compliance", sublabel: "With automated prompts" },
    { value: "25%", label: "No-show reduction", sublabel: "SMS reminder system" },
  ],
};

export default function IndustryMetricRings({ industry }) {
  const rings = RING_CONFIGS[industry] || RING_CONFIGS.hvac;

  return (
    <section className="px-4 py-14 md:px-6 md:py-20" style={{ background: "#ffffff" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Performance Metrics</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">What the System Delivers</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 place-items-center">
          {rings.map((r, i) => (
            <StatRing key={i} value={r.value} label={r.label} sublabel={r.sublabel} color="#0088CC" size={130} />
          ))}
        </div>
      </div>
    </section>
  );
}