import { useState } from "react";
import { Zap, TrendingUp, CalendarCheck, Building2, ShieldCheck } from "lucide-react";

const items = [
  {
    icon: Zap,
    stat: "Under 60 sec",
    label: "Lead response time",
    story: "Our systems fire an automated, personalized reply the moment a lead submits a form or calls — day, night, or weekend.",
  },
  {
    icon: TrendingUp,
    stat: "3× avg. bookings",
    label: "Increase for clients",
    story: "A med spa in Miami went from 14% to 61% lead-to-consultation conversion within 30 days of going live.",
  },
  {
    icon: CalendarCheck,
    stat: "5–7 days",
    label: "Average setup time",
    story: "We handle every step of the build. You attend one onboarding call. Your system is live in less than a week.",
  },
  {
    icon: Building2,
    stat: "Med Spas · HVAC · RE",
    label: "Industries served",
    story: "We've built systems for appointment-based businesses across aesthetics, home services, real estate, and more.",
  },
  {
    icon: ShieldCheck,
    stat: "Month-to-month",
    label: "No lock-in contracts",
    story: "We earn your business every month. If the system isn't performing, you can leave. Simple as that.",
  },
];

export default function TrustBar() {
  const [tooltip, setTooltip] = useState(null);

  return (
    <section className="py-10 bg-gradient-to-b from-card via-background/50 to-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap items-stretch justify-center divide-y md:divide-y-0 md:divide-x divide-border">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={() => setTooltip(tooltip === i ? null : i)}
                className="relative flex flex-col items-center gap-2 px-6 py-4 group w-full md:w-auto md:flex-1"
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-[18px] h-[18px] text-primary" />
                </div>

                {/* Stat */}
                <span className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {item.stat}
                </span>

                {/* Label */}
                <span className="text-[11px] font-inter text-muted-foreground flex items-center gap-1 leading-tight">
                  {item.label}
                  <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 text-[9px] flex items-center justify-center text-muted-foreground/60">?</span>
                </span>

                {/* Tooltip */}
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
      </div>
    </section>
  );
}