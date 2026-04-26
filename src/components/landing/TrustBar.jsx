import { useEffect, useRef, useState } from "react";
import { Building2, CalendarCheck, ShieldCheck, TrendingUp, Zap } from "lucide-react";

function useCountUp(value, inView, duration = 1400) {
  const [count, setCount] = useState(value);

  useEffect(() => {
    if (!inView || typeof value !== "number") {
      setCount(value);
      return;
    }

    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(step);
  }, [duration, inView, value]);

  return count;
}

const items = [
  {
    icon: Zap,
    label: "Lead response time",
    display: "Under 60 sec",
    animatedValue: null,
    story:
      "Your leads get an immediate response the moment they call or submit a form, even after hours.",
  },
  {
    icon: TrendingUp,
    label: "Average booking lift",
    display: "3x more bookings",
    animatedValue: 3,
    suffix: "x more bookings",
    story:
      "Most clients feel the lift from consistent follow-up long before they need to hire more front-desk coverage.",
  },
  {
    icon: CalendarCheck,
    label: "Average setup time",
    display: "5-7 business days",
    animatedValue: null,
    story:
      "We handle the build, setup, and launch prep so your team is not stuck piecing together tools.",
  },
  {
    icon: Building2,
    label: "Average recovery window",
    display: "30-day ROI",
    animatedValue: 30,
    suffix: "-day ROI",
    story:
      "A few additional booked appointments often cover the investment faster than teams expect.",
  },
  {
    icon: ShieldCheck,
    label: "Commitment structure",
    display: "Month-to-month",
    animatedValue: null,
    story:
      "The offer stays simple: no long lock-in and no need to add extra staff before you see improvement.",
  },
];

function StatCard({ item, index, inView }) {
  const Icon = item.icon;
  const count = useCountUp(item.animatedValue, inView);
  const statText =
    typeof item.animatedValue === "number" ? `${count}${item.suffix || ""}` : item.display;

  return (
    <article
      className="relative rounded-2xl border border-border px-5 py-5 text-left shadow-sm transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s`,
      }}
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center shadow-sm">
          <Icon className="w-[18px] h-[18px] text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-display text-xl font-semibold text-foreground leading-tight">
            {statText}
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-primary/80 mt-1.5 mb-2.5">
            {item.label}
          </p>
          <p className="text-sm text-foreground/68 leading-relaxed">{item.story}</p>
        </div>
      </div>
    </article>
  );
}

export default function TrustBar() {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold: 0.2 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="py-16 md:py-20 bg-gradient-to-b from-card to-background border-y border-border/50"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
          {items.map((item, index) => (
            <StatCard key={item.label} item={item} index={index} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
