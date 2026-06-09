import { useState } from "react";
import { TrendingUp } from "lucide-react";

export default function IndustryROICalculator({ industry }) {
  const configs = {
    hvac: {
      label: "Missed Emergency Calls / Month",
      min: 5, max: 100, default: 20,
      avgTicket: 650,
      ticketLabel: "Avg Service Ticket",
      unit: "calls",
    },
    roofing: {
      label: "Missed Storm Leads / Month",
      min: 2, max: 50, default: 10,
      avgTicket: 8000,
      ticketLabel: "Avg Roofing Job Value",
      unit: "leads",
    },
    contractors: {
      label: "Missed Project Inquiries / Month",
      min: 2, max: 40, default: 8,
      avgTicket: 12000,
      ticketLabel: "Avg Project Value",
      unit: "inquiries",
    },
    "med-spa": {
      label: "Missed Consultation Inquiries / Month",
      min: 5, max: 80, default: 20,
      avgTicket: 800,
      ticketLabel: "Avg Consult Value",
      unit: "inquiries",
    },
    dental: {
      label: "Missed Patient Calls / Month",
      min: 5, max: 100, default: 25,
      avgTicket: 350,
      ticketLabel: "Avg Patient Visit",
      unit: "calls",
    },
    chiropractic: {
      label: "Missed New Patient Inquiries / Month",
      min: 5, max: 80, default: 20,
      avgTicket: 1800,
      ticketLabel: "Avg Care Plan Value",
      unit: "inquiries",
    },
  };

  const cfg = configs[industry] || configs.hvac;
  const [value, setValue] = useState(cfg.default);

  const recoveryRate = 0.65;
  const monthlyRecovered = Math.round(value * recoveryRate);
  const monthlyRevenue = monthlyRecovered * cfg.avgTicket;
  const annualRevenue = monthlyRevenue * 12;

  return (
    <section className="px-4 py-14 md:px-6 md:py-20" style={{ background: "linear-gradient(180deg, #f0f8ff 0%, #e8f4ff 100%)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Revenue Recovery</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            How Much Are Unanswered {cfg.unit === "calls" ? "Calls" : "Leads"} Costing You?
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Drag the slider to estimate your monthly revenue leakage — and how much ClientSurge recovers.
          </p>
        </div>

        <div
          className="rounded-2xl p-7 md:p-10"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(0,136,204,0.18)",
            boxShadow: "0 20px 56px rgba(0,59,143,0.1)",
          }}
        >
          <label className="block text-sm font-semibold text-foreground mb-2">
            {cfg.label}: <span className="text-primary font-black">{value} {cfg.unit}</span>
          </label>
          <input
            type="range"
            min={cfg.min}
            max={cfg.max}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full mb-8"
            style={{ accentColor: "#0088CC" }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl p-5 text-center" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
              <p className="text-2xl font-black" style={{ color: "#b91c1c" }}>
                {value}
              </p>
              <p className="text-xs font-semibold text-foreground/70 mt-1">Missed {cfg.unit}/month<br/><span className="text-[10px]">Without automation</span></p>
            </div>
            <div className="rounded-xl p-5 text-center" style={{ background: "rgba(0,174,239,0.07)", border: "1px solid rgba(0,136,204,0.2)" }}>
              <p className="text-2xl font-black text-primary">{monthlyRecovered}</p>
              <p className="text-xs font-semibold text-foreground/70 mt-1">Recovered/month<br/><span className="text-[10px]">With ClientSurge (65% recovery)</span></p>
            </div>
            <div className="rounded-xl p-5 text-center" style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)" }}>
              <p className="text-2xl font-black" style={{ color: "#15803d" }}>
                ${annualRevenue.toLocaleString()}
              </p>
              <p className="text-xs font-semibold text-foreground/70 mt-1">Annual recovery<br/><span className="text-[10px]">{cfg.ticketLabel}: ${cfg.avgTicket.toLocaleString()}</span></p>
            </div>
          </div>

          <div className="mt-6 rounded-xl px-5 py-4 flex items-center gap-3" style={{ background: "rgba(0,174,239,0.06)", border: "1px solid rgba(0,136,204,0.15)" }}>
            <TrendingUp style={{ width: "20px", height: "20px", color: "#0088CC", flexShrink: 0 }} />
            <p className="text-sm text-foreground/75">
              ClientSurge typically delivers <strong className="text-foreground">ROI in 2–3 weeks</strong> for businesses at this volume level.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}