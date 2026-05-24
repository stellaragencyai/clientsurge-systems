import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import DemoBookingModal from "../forms/DemoBookingModal";

export default function LeadValueCalculator() {
  const [leadsPerMonth, setLeadsPerMonth] = useState(40);
  const [avgJobValue, setAvgJobValue] = useState(800);
  const [currentCloseRate, setCurrentCloseRate] = useState(25);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [animated, setAnimated] = useState(false);

  const improvedClose = Math.min(currentCloseRate * 2.3, 85);
  const currentRevenue = Math.round((leadsPerMonth * (currentCloseRate / 100)) * avgJobValue);
  const newRevenue = Math.round((leadsPerMonth * (improvedClose / 100)) * avgJobValue);
  const gained = newRevenue - currentRevenue;

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(t);
  }, [leadsPerMonth, avgJobValue, currentCloseRate]);

  const formatCurrency = (n) =>
    n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n.toLocaleString()}`;

  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-gradient-to-b from-card to-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Revenue Calculator</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
            See Exactly What You're Leaving on the Table
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Adjust the sliders to match your business. See the revenue impact of faster follow-up in real time.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(0,136,204,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
          {/* Sliders */}
          <div className="bg-white p-8 md:p-10 grid md:grid-cols-3 gap-8">
            {[
              { label: "Monthly Leads", value: leadsPerMonth, min: 5, max: 300, step: 5, set: setLeadsPerMonth, format: (v) => v },
              { label: "Avg Job / Sale Value", value: avgJobValue, min: 100, max: 10000, step: 100, set: setAvgJobValue, format: (v) => `$${v.toLocaleString()}` },
              { label: "Current Close Rate", value: currentCloseRate, min: 5, max: 60, step: 1, set: setCurrentCloseRate, format: (v) => `${v}%` },
            ].map(({ label, value, min, max, step, set, format }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground/50">{label}</p>
                  <span className="text-base font-bold text-foreground">{format(value)}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={e => set(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#0077B6" }}
                />
                <div className="flex justify-between text-xs text-foreground/30 mt-1">
                  <span>{format(min)}</span><span>{format(max)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Results */}
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60" style={{ background: "linear-gradient(135deg,#005B99 0%,#0077B6 60%,#005B99 100%)" }}>
            {[
              { label: "Current Monthly Revenue", value: formatCurrency(currentRevenue), sub: `At ${currentCloseRate}% close rate`, muted: true },
              { label: "With ClientSurge System", value: formatCurrency(newRevenue), sub: `At ~${Math.round(improvedClose)}% close rate`, muted: false },
              { label: "Monthly Revenue Gained", value: `+${formatCurrency(gained)}`, sub: "Additional bookings per month", highlight: true },
            ].map(({ label, value, sub, highlight, muted }) => (
              <div key={label} className="px-8 py-7 text-center">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: muted ? "rgba(245,230,208,0.45)" : "rgba(245,230,208,0.65)" }}>{label}</p>
                <p
                  className="font-display font-bold mb-1 transition-all duration-500"
                  style={{
                    fontSize: highlight ? "2.4rem" : "1.9rem",
                    color: highlight ? "#DDF4FF" : "rgba(245,230,208,0.85)",
                    transform: animated ? "scale(1)" : "scale(0.92)",
                    transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), color 0.3s",
                  }}
                >
                  {value}
                </p>
                <p className="text-xs" style={{ color: "rgba(245,230,208,0.4)" }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* CTA strip */}
          <div className="bg-white px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-semibold text-foreground/70">
              That's <span className="text-foreground font-bold">{formatCurrency(gained * 12)}/year</span> you're currently missing.
            </p>
            <button
              onClick={() => setShowDemoModal(true)}
              style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "8px", height: "44px", padding: "0 24px", borderRadius: "9999px", background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)", color: "#ffffff", fontWeight: "700", fontSize: "0.875rem", border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,174,239,0.35)" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,174,239,0.46)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,174,239,0.35)"; }}
            >
              Recover This Revenue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {showDemoModal && <DemoBookingModal onClose={() => setShowDemoModal(false)} />}
    </section>
  );
}
