import { useState, useEffect, useRef } from "react";
import { Zap, TrendingUp, CalendarCheck, Building2, ShieldCheck } from "lucide-react";

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
    stat: "6 Industries",
    label: "Phoenix-based",
    story: "We've built systems for appointment-based businesses in the Phoenix metro - med spas, dental, chiropractic, home services, legal, and real estate.",
  },
  {
    icon: ShieldCheck,
    stat: "Month-to-month",
    label: "No lock-in contracts",
    story: "The offer is simple: no long-term contract and no need to hire additional front-desk or follow-up staff first.",
  },
];

export default function TrustBar() {
  const [tooltip, setTooltip] = useState(null);
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-12 bg-gradient-to-b from-card to-background border-y border-border/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="hidden md:flex items-stretch justify-center divide-x divide-border">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={() => setTooltip(tooltip === i ? null : i)}
                className="relative flex flex-col items-center gap-2 px-8 py-4 group flex-1"
                style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)", transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s` }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all">
                  <Icon className="w-[18px] h-[18px] text-primary" />
                </div>
                <span className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {item.stat}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">{item.label}</span>
                {tooltip === i && (
                  <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 bg-foreground text-background text-xs rounded-xl px-4 py-3 shadow-xl z-20 text-left leading-relaxed">
                    {item.story}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-4 bg-card border border-border rounded-2xl">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-base font-semibold text-foreground leading-tight">{item.stat}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
