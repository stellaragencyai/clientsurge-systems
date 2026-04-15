import { useEffect, useRef, useState } from "react";

const metrics = [
  { value: 2.4, suffix: "×", label: "More consultations booked", desc: "Average across active med spa clients" },
  { value: 34, suffix: "%", label: "Fewer no-shows", desc: "With automated reminder sequences" },
  { value: 12, prefix: "$", suffix: "k/mo", label: "Revenue recovered on average", desc: "From missed & cold leads reactivated" },
  { value: 7, suffix: " days", label: "To go fully live", desc: "From onboarding call to system running" },
];

function CountUp({ target, suffix, prefix, run }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!run) return;
    let start = 0;
    const duration = 1400;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(parseFloat(start.toFixed(1)));
    }, step);
    return () => clearInterval(timer);
  }, [run, target]);
  return <span>{prefix || ""}{val}{suffix}</span>;
}

export default function MedSpaTrustBar() {
  const ref = useRef(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setRun(true); }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-14 px-6 bg-white border-b border-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">Results from active med spa clients</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <div key={i} className="text-center p-6 rounded-2xl bg-primary/4 border border-primary/12 hover:border-primary/25 transition-all">
              <p className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">
                <CountUp target={m.value} suffix={m.suffix} prefix={m.prefix} run={run} />
              </p>
              <p className="text-sm font-semibold text-foreground mb-1">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}