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

function StatCard({ item, index, inView, compact = false, featured = false }) {
  const Icon = item.icon;
  const count = useCountUp(item.animatedValue, inView);
  const statText =
    typeof item.animatedValue === "number" ? `${count}${item.suffix || ""}` : item.display;

  const isHighlighted = index === 1;

  return (
    <article
      className={`relative rounded-2xl border border-border text-left shadow-sm transition-all duration-300 ${
        compact ? "px-4 py-4" : "px-5 py-5"
      } ${featured ? "overflow-hidden" : ""}`}
      style={{
        background: featured
          ? "linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(252,246,237,0.9) 100%)"
          : isHighlighted
          ? "linear-gradient(180deg, rgba(245,217,168,0.3) 0%, rgba(255,255,255,0.9) 100%)"
          : "rgba(255,255,255,0.82)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s`,
        boxShadow: featured
          ? "0 16px 40px rgba(154,92,46,0.1), inset 0 1px 0 rgba(255,255,255,0.82)"
          : isHighlighted && inView
          ? "0 0 20px rgba(245,217,168,0.4), 0 6px 22px rgba(0,0,0,0.06)"
          : undefined,
      }}
    >
      {featured ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 18% 22%, rgba(245,217,168,0.22) 0%, transparent 28%), radial-gradient(circle at 86% 14%, rgba(154,92,46,0.12) 0%, transparent 24%)",
          }}
        />
      ) : null}
      <div className={`flex items-start ${compact ? "gap-3" : "gap-4"} relative z-10`}>
        <div
          className={`${compact ? "w-10 h-10 rounded-xl" : "w-11 h-11 rounded-2xl"} bg-primary/10 border border-primary/15 flex items-center justify-center shadow-sm`}
          style={isHighlighted ? { boxShadow: "0 0 12px rgba(34,199,89,0.4)" } : {}}
        >
          <Icon className="w-[18px] h-[18px] text-primary" />
        </div>
        <div className="flex-1">
          <p
            className={`font-display font-semibold text-foreground leading-tight ${
              featured ? "text-2xl" : compact ? "text-lg" : "text-xl"
            }`}
            style={isHighlighted && !featured ? { fontSize: compact ? "1.2rem" : "1.35rem" } : {}}
          >
            {statText}
          </p>
          <p className={`uppercase tracking-[0.18em] text-primary/80 ${compact ? "text-[9px] mt-1 mb-2" : "text-[10px] mt-1.5 mb-2.5"}`}>
            {item.label}
          </p>
          <p className={`${compact ? "text-[13px]" : "text-sm"} text-foreground/68 leading-relaxed`}>
            {item.story}
          </p>
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
      className="py-10 md:py-20 bg-gradient-to-b from-card to-background border-y border-border/50"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="md:hidden">
          <div className="space-y-3">
            <StatCard item={items[0]} index={0} inView={inView} featured />
            <div className="grid grid-cols-2 gap-3">
              {items.slice(1).map((item, index) => (
                <StatCard
                  key={item.label}
                  item={item}
                  index={index + 1}
                  inView={inView}
                  compact
                />
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-5 gap-5">
          {items.map((item, index) => (
            <StatCard key={item.label} item={item} index={index} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
