import { useEffect, useRef, useState } from "react";
import { Building2, CalendarCheck, ShieldCheck, TrendingUp, Zap } from "lucide-react";

const items = [
  {
    icon: Zap,
    stat: "Under 60 sec",
    statNum: 60,
    statPrefix: "Under ",
    statSuffix: " sec",
    label: "Lead response time",
    story: "Your leads get an immediate response the moment they call or submit a form, even after hours.",
  },
  {
    icon: TrendingUp,
    stat: "3x avg. bookings",
    statNum: 3,
    statPrefix: "",
    statSuffix: "x avg. bookings",
    label: "Increase for clients",
    story: "A med spa in Scottsdale went from 14% to 61% lead-to-consultation conversion within 30 days of going live.",
  },
  {
    icon: CalendarCheck,
    stat: "5-7 days",
    statNum: 7,
    statPrefix: "5–",
    statSuffix: " days",
    label: "Average setup time",
    story: "We handle the build and setup. You join one onboarding call and review the finished system before launch.",
  },
  {
    icon: Building2,
    stat: "6 industries",
    statNum: 6,
    statPrefix: "",
    statSuffix: " industries",
    label: "Core industry tracks",
    story: "The current homepage supports med spas, dental, chiropractic, HVAC and home services, roofing, and contractors and trades.",
  },
  {
    icon: ShieldCheck,
    stat: "Month-to-month",
    statNum: null,
    label: "No lock-in contracts",
    story: "The offer stays simple: no long-term contract and no need to hire additional front-desk or follow-up staff first.",
  },
];

function useCountUp(target, duration = 1200, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || target == null) return;
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return value;
}

function TrustCard({ item, index, inView }) {
  const [hovered, setHovered] = useState(false);
  const [shimmerDone, setShimmerDone] = useState(false);
  const count = useCountUp(item.statNum, 900, inView);

  useEffect(() => {
    if (inView) {
      const t = setTimeout(() => setShimmerDone(true), 1000 + index * 80);
      return () => clearTimeout(t);
    }
  }, [inView, index]);

  const Icon = item.icon;
  const displayStat = item.statNum != null
    ? `${item.statPrefix ?? ""}${count}${item.statSuffix ?? ""}`
    : item.stat;

  return (
    <article
      key={item.label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl border border-border px-4 pb-5 text-left shadow-sm overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        opacity: inView ? 1 : 0,
        transform: inView
          ? hovered ? "translateY(-5px)" : "translateY(0)"
          : "translateY(16px)",
        transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.35s ease, border-color 0.3s ease, box-shadow 0.3s ease`,
        borderColor: hovered ? "rgba(154,92,46,0.5)" : undefined,
        boxShadow: hovered
          ? "0 12px 36px rgba(154,92,46,0.18), inset 0 1px 0 rgba(255,255,255,0.9)"
          : "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.7)",
        paddingTop: "36px",
      }}
    >
      {/* Enhancement 1: Gold accent bar at top — fills on hover */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          borderRadius: "9999px 9999px 0 0",
          background: "linear-gradient(90deg, #7a4825, #c8965c, #f5d9a8, #c8965c, #7a4825)",
          transform: hovered ? "scaleX(1)" : "scaleX(0.3)",
          transformOrigin: "left",
          transition: "transform 0.4s cubic-bezier(0.34,1.2,0.64,1)",
          opacity: hovered ? 1 : 0.5,
        }}
      />

      {/* Enhancement 2: Shimmer sweep on entrance */}
      {!shimmerDone && inView && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
            animation: `trustShimmer 0.8s ease ${index * 0.12}s forwards`,
            pointerEvents: "none",
            zIndex: 20,
          }}
        />
      )}

      {/* Icon circle */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border flex items-center justify-center shadow-lg backdrop-blur-sm"
        style={{
          background: hovered
            ? "linear-gradient(135deg, rgba(154,92,46,0.2), rgba(200,150,92,0.12))"
            : "rgba(154,92,46,0.1)",
          borderColor: hovered ? "rgba(154,92,46,0.45)" : "rgba(154,92,46,0.22)",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        <Icon className="w-[18px] h-[18px] text-primary" />
      </div>

      <div className="relative z-10">
        {/* Enhancement 3: Animated count-up number */}
        <p className="font-display text-lg font-semibold text-foreground leading-tight">
          {displayStat}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-primary/80 mt-1.5 mb-2">{item.label}</p>
        <p className="text-xs text-foreground/65 leading-snug">{item.story}</p>
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
    <section ref={ref} className="py-16 bg-gradient-to-b from-card to-background border-y border-border/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {items.map((item, index) => (
            <TrustCard key={item.label} item={item} index={index} inView={inView} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes trustShimmer {
          0%   { background-position: -100% 0; opacity: 1; }
          100% { background-position: 200% 0; opacity: 0; }
        }
      `}</style>
    </section>
  );
}