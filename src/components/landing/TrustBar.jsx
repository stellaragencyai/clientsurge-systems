import { useEffect, useRef, useState } from "react";
import { Building2, CalendarCheck, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import FollowUpTimeline from "./visuals/FollowUpTimeline";
import { motion } from "framer-motion";

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
    label: "Your leads hear from you before competitors do",
    display: "Under 60 sec",
    animatedValue: null,
    story:
      "The moment a lead calls or submits a form, they get an instant response — even after business hours.",
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
    animatedValue: null,
    suffix: "",
    display: "30-day ROI",
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

  const isHighlighted = index === 1; // 3x more bookings stat
  
  return (
    <motion.article
      className="relative rounded-2xl border border-border text-left shadow-sm"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "#ffffff",
        minHeight: "clamp(140px, 20vw, 190px)",
        padding: "clamp(14px, 3vw, 20px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: isHighlighted ? "0 0 20px rgba(245,217,168,0.4), 0 6px 22px rgba(0,0,0,0.06)" : "0 6px 22px rgba(0,0,0,0.06)",
      }}
    >
      <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center shadow-sm mb-3" style={isHighlighted ? { boxShadow: "0 0 12px rgba(34,199,89,0.4)" } : {}}>
        <Icon className="w-[17px] h-[17px] text-primary" />
      </div>
      <div>
        <p className="font-display text-xl font-semibold text-foreground leading-tight" style={isHighlighted ? { fontSize: "1.35rem" } : {}}>
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
      className="pt-16 md:pt-24 pb-24 md:pb-32 bg-gradient-to-b from-card via-background to-slate-50/30 border-y border-primary/8"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3 text-primary">By The Numbers</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            What You Can Expect
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
          {items.map((item, index) => (
            <StatCard key={item.label} item={item} index={index} inView={inView} />
          ))}
        </div>

        {/* Follow-Up Timeline Visual */}
        <div className="mt-12 flex justify-center">
          <FollowUpTimeline />
        </div>
      </div>
    </section>
  );
}