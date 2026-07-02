import React, { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { DashboardTruthBanner } from "./AdminDashboardCards";

export default function LeadIntelligenceMiniPanel({ onNavigate }) {
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await base44.functions.invoke("getLeadIntelligenceOverview", {});
        setKpis(response?.data?.kpis || null);
      } catch {}
    };
    load();
  }, []);

  if (!kpis) {
    return <DashboardTruthBanner />;
  }

  const cards = [
    {
      label: "🔥 Hot Leads",
      value: kpis.hot_leads,
      sub: "Immediate outreach",
      color: "border-red-200 bg-red-50",
      textColor: "text-red-700",
      segment: "lead-intelligence",
      urgent: kpis.hot_leads > 0,
    },
    {
      label: "⚡ High Intent",
      value: kpis.high_intent_leads,
      sub: "Booking likely",
      color: "border-orange-200 bg-orange-50",
      textColor: "text-orange-700",
      segment: "lead-intelligence",
    },
    {
      label: "💤 Dormant",
      value: kpis.dormant_leads,
      sub: "Available for reactivation",
      color: "border-slate-200 bg-slate-50",
      textColor: "text-slate-700",
      segment: "lead-intelligence",
    },
    {
      label: "💰 Revenue at Risk",
      value: `$${(kpis.total_revenue_at_risk || 0).toLocaleString()}`,
      sub: "From top 20 leads",
      color: "border-green-200 bg-green-50",
      textColor: "text-green-700",
      segment: "lead-intelligence",
    },
  ];

  return (
    <div className="space-y-4">
      <DashboardTruthBanner />
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Lead Intelligence Layer</h3>
          </div>
          <button
            onClick={() => onNavigate("lead-intelligence")}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Open full view →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map((card, i) => (
            <button
              key={i}
              onClick={() => onNavigate(card.segment)}
              className={`rounded-lg border p-3 text-left transition hover:shadow-sm relative ${card.color} ${card.urgent ? "ring-2 ring-red-300" : ""}`}
            >
              {card.urgent && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
              <p className="text-xs font-semibold text-muted-foreground mb-1">{card.label}</p>
              <p className={`text-2xl font-black ${card.textColor}`}>{card.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{card.sub}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}