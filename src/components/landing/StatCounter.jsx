import { useEffect, useRef, useState } from "react";

function useCountUp(target, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

const stats = [
  { value: 4200, suffix: "+", label: "Leads Captured" },
  { value: 1800, suffix: "+", label: "Appointments Booked" },
  { value: 3.2, suffix: "M+", label: "Revenue Recovered", prefix: "$", isDecimal: true },
];

export default function StatCounter() {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const v0 = useCountUp(4200, 1800, started);
  const v1 = useCountUp(1800, 1800, started);

  return (
    <div ref={ref} className="mt-14 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
      <div className="text-center">
        <p className="font-display text-3xl font-semibold text-foreground tabular-nums">
          {v0.toLocaleString()}+
        </p>
        <p className="text-xs text-muted-foreground mt-1 tracking-wide uppercase">Leads Captured</p>
      </div>
      <div className="w-px h-8 bg-border hidden sm:block" />
      <div className="text-center">
        <p className="font-display text-3xl font-semibold text-foreground tabular-nums">
          {v1.toLocaleString()}+
        </p>
        <p className="text-xs text-muted-foreground mt-1 tracking-wide uppercase">Appointments Booked</p>
      </div>
      <div className="w-px h-8 bg-border hidden sm:block" />
      <div className="text-center">
        <p className="font-display text-3xl font-semibold text-foreground tabular-nums">
          {started ? "$3.2M+" : "$0"}
        </p>
        <p className="text-xs text-muted-foreground mt-1 tracking-wide uppercase">Revenue Recovered</p>
      </div>
    </div>
  );
}