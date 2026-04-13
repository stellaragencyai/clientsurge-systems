import { useState } from "react";

const items = [
  {
    stat: "Under 60 seconds",
    label: "Lead response time",
    story: "Our systems fire an automated, personalized reply the moment a lead submits a form or calls — day, night, or weekend.",
  },
  {
    stat: "3× avg. booking rate",
    label: "Increase for clients",
    story: "A med spa in Miami went from 14% to 61% lead-to-consultation conversion within 30 days of going live.",
  },
  {
    stat: "5–7 business days",
    label: "Average setup time",
    story: "We handle every step of the build. You attend one onboarding call. Your system is live in less than a week.",
  },
  {
    stat: "Med Spas · HVAC · Real Estate",
    label: "Industries served",
    story: "We've built systems for appointment-based businesses across aesthetics, home services, real estate, and more.",
  },
  {
    stat: "Month-to-month",
    label: "No lock-in contracts",
    story: "We earn your business every month. If the system isn't performing, you can leave. Simple as that.",
  },
];

export default function TrustBar() {
  const [tooltip, setTooltip] = useState(null);

  return (
    <section className="py-8 bg-gradient-to-b from-background via-card to-background relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => setTooltip(tooltip === i ? null : i)}
              className="flex flex-col items-center gap-0.5 group relative"
            >
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {item.stat}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                {item.label}
                <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 text-[9px] flex items-center justify-center leading-none text-muted-foreground">
                  ?
                </span>
              </span>

              {tooltip === i && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 bg-foreground text-background text-xs rounded-xl px-4 py-3 shadow-xl z-20 text-left leading-relaxed">
                  {item.story}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}