import { useEffect, useRef, useState } from "react";
import { CalendarCheck, ShieldCheck, TimerReset, Zap } from "lucide-react";
import { motion } from "framer-motion";

function useCountUp(value, inView, duration = 1800) {
  const [count, setCount] = useState(typeof value === "number" ? 1 : value);

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
    label: "Fast first response",
    display: "Under 60 sec",
    animatedValue: null,
    story:
      "New web leads get an immediate response path so fewer prospects bounce to the next company before your team can engage.",
  },
  {
    icon: CalendarCheck,
    label: "Launch target",
    display: "5-7 business days",
    animatedValue: null,
    story:
      "The site, routing, and automation setup are built for a fast go-live without dragging you through a long custom implementation cycle.",
  },
  {
    icon: TimerReset,
    label: "Review window",
    display: "30-day review",
    animatedValue: null,
    story:
      "After launch, the system is reviewed against response speed, follow-up completion, missed-call recovery, and lead conversion movement.",
  },
  {
    icon: ShieldCheck,
    label: "Commitment structure",
    display: "Month-to-month",
    animatedValue: null,
    story:
      "The offer stays simple: no long-term lock-in and no need to add extra staff before you see whether the system is working.",
  },
];

function StatCard({ item, index, inView }) {
  const Icon = item.icon;
  const count = useCountUp(item.animatedValue, inView);
  const statText =
    typeof item.animatedValue === "number" ? `${count}${item.suffix || ""}` : item.display;

  const isHighlighted = index === 0;

  return (
    <motion.article
      className="relative rounded-lg border border-border text-left shadow-sm"
      aria-label={`${statText} - ${item.label}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "hsl(var(--card))",
        minHeight: "clamp(165px, 22vw, 210px)",
        padding: "clamp(16px, 3vw, 22px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: isHighlighted
          ? "0 0 20px rgba(0,174,239,0.18), 0 6px 22px rgba(0,0,0,0.06)"
          : "0 6px 22px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shadow-sm mb-3"
        style={isHighlighted ? { boxShadow: "0 0 12px rgba(0,174,239,0.3)" } : {}}
      >
        <Icon className="w-[17px] h-[17px] text-primary" />
      </div>
      <div>
        <p
          className="font-display text-xl font-semibold text-foreground leading-tight"
          style={isHighlighted ? { fontSize: "1.35rem" } : {}}
        >
          {statText}
        </p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-primary/80 mt-1 mb-2">
          {item.label}
        </p>
        <p className="text-xs text-foreground/60 leading-relaxed">{item.story}</p>
      </div>
    </motion.article>
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
      className="pt-14 md:pt-16 pb-14 md:pb-20 bg-gradient-to-b from-card via-background to-background/60 border-y border-primary/10"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-10">
          <p className="cs-eyebrow mb-4">What You Can Expect</p>
          <div className="flex items-center gap-4">
            <div className="cs-section-bar" style={{ minHeight: "48px" }} />
            <h2 className="font-titles text-[#001B44] text-4xl md:text-5xl font-bold tracking-tight">
              Clear Commitments. Cleaner Buying Decision.
            </h2>
          </div>
          <p className="mt-4 max-w-3xl text-sm md:text-base text-foreground/65 leading-relaxed">
            No guessing. No long contracts. Here's exactly what you can expect when you work with ClientSurge Systems — from first response speed to how the engagement is structured.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          {items.map((item, index) => (
            <StatCard key={item.label} item={item} index={index} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}