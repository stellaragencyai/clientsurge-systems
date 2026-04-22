import { useEffect, useRef, useState } from "react";
import { Building2, CalendarCheck, ShieldCheck, TrendingUp, Zap } from "lucide-react";

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
    stat: "6 industries",
    label: "Core industry tracks",
    story: "The current homepage supports med spas, dental, chiropractic, HVAC and home services, roofing, and contractors and trades.",
  },
  {
    icon: ShieldCheck,
    stat: "Month-to-month",
    label: "No lock-in contracts",
    story: "The offer stays simple: no long-term contract and no need to hire additional front-desk or follow-up staff first.",
  },
];

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.label}
                className="rounded-2xl border border-border bg-card/80 px-5 py-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(16px)",
                  transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s`,
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-4">
                  <Icon className="w-[18px] h-[18px] text-primary" />
                </div>
                <p className="font-display text-xl font-semibold text-foreground leading-tight">{item.stat}</p>
                <p className="text-[11px] uppercase tracking-wide text-primary/80 mt-1 mb-3">{item.label}</p>
                <p className="text-sm text-foreground/65 leading-relaxed">{item.story}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}