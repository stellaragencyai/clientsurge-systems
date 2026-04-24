import { useEffect, useRef, useState } from "react";
import { Building2, CalendarCheck, ShieldCheck, TrendingUp, Zap } from "lucide-react";

function useCountUp(target, inView, duration = 1400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const isNumber = /^[\d.]+$/.test(String(target).replace(/[x%+]/g, ""));
    if (!isNumber) return;
    const numVal = parseFloat(String(target).replace(/[x%+]/g, ""));
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * numVal));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(numVal);
    };
    requestAnimationFrame(step);
  }, [inView, target]);
  return count;
}

const items = [
  {
    icon: Zap,
    stat: "Under 60 sec",
    label: "Lead response time",
    story: "Your leads get an immediate response the moment they call or submit a form, even after hours.",
  },
  {
    icon: TrendingUp,
    stat: "3x avg. bookings",
    label: "Increase for clients",
    story: "A med spa in Scottsdale went from 14% to 61% lead-to-consultation conversion within 30 days of going live.",
  },
  {
    icon: CalendarCheck,
    stat: "5-7 days",
    label: "Average setup time",
    story: "We handle the build and setup. You join one onboarding call and review the finished system before launch.",
  },
  {
    icon: Building2,
    stat: "30-day ROI",
    label: "Average recovery window",
    story: "Most clients recover their investment within the first 30 days — often from leads they were already getting but not converting.",
  },
  {
    icon: ShieldCheck,
    stat: "Month-to-month",
    label: "No lock-in contracts",
    story: "The offer stays simple: no long-term contract and no need to hire additional front-desk or follow-up staff first.",
  },
];

function StatCard({ item, index, inView }) {
  const Icon = item.icon;
  // Extract numeric portion for count-up
  const numMatch = item.stat.match(/[\d.]+/);
  const prefix = item.stat.split(/[\d.]+/)[0] || "";
  const suffix = numMatch ? item.stat.slice(item.stat.indexOf(numMatch[0]) + numMatch[0].length) : "";
  const count = useCountUp(numMatch ? numMatch[0] : "0", inView);

  return (
    <article
      className="relative rounded-2xl border border-border px-4 pb-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s`,
        paddingTop: "36px",
        borderTop: "3px solid rgba(154,92,46,0.35)",
      }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shadow-lg backdrop-blur-sm">
        <Icon className="w-[18px] h-[18px] text-primary" />
      </div>
      <div className="relative z-10">
        <p className="font-display text-lg font-semibold text-foreground leading-tight">
          {numMatch ? `${prefix}${count}${suffix}` : item.stat}
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
      if (entry.isIntersecting) {
        setInView(true);
      }
    }, { threshold: 0.2 });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-16 bg-gradient-to-b from-card to-background border-y border-border/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <StatCard key={item.label} item={item} index={index} inView={inView} />
            );
          })}
        </div>
      </div>
    </section>
  );
}