import React, { useState, useEffect } from "react";
import { Flame, TrendingUp, DollarSign, Users, AlertCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LeadIntelligencePanel({ compact = false }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const response = await base44.functions.invoke("getLeadIntelligenceOverview", {});
        setOverview(response?.data);
      } catch (err) {
        setError(err.message || "Failed to load intelligence overview");
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
    const interval = setInterval(fetchOverview, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {error}
      </div>
    );
  }

  if (!overview) return null;

  const { kpis, distribution } = overview;

  const metrics = [
    { label: "Total Leads", value: kpis.total_leads, icon: Users, color: "bg-blue-100 text-blue-700" },
    { label: "Hot Leads", value: kpis.hot_leads, icon: Flame, color: "bg-red-100 text-red-700" },
    { label: "Warm Leads", value: kpis.warm_leads, icon: TrendingUp, color: "bg-orange-100 text-orange-700" },
    { label: "Revenue at Risk", value: `$${kpis.total_revenue_at_risk.toLocaleString()}`, icon: DollarSign, color: "bg-green-100 text-green-700" },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className={`rounded-lg ${m.color} p-3`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">{m.label}</span>
              </div>
              <p className="text-xl font-bold">{m.value}</p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className={`rounded-lg ${m.color} p-6`}>
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold opacity-75">{m.label}</p>
              <p className="text-3xl font-bold mt-2">{m.value}</p>
            </div>
          );
        })}
      </div>

      {/* Segment Distribution */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Segment Distribution</h3>
        <div className="space-y-3">
          {[
            { label: "Hot Leads", value: distribution.hot_percent, color: "bg-red-500" },
            { label: "Warm Leads", value: distribution.warm_percent, color: "bg-orange-500" },
            { label: "Engaged", value: distribution.engaged_percent, color: "bg-blue-500" },
            { label: "Cold Leads", value: distribution.cold_percent, color: "bg-slate-500" },
            { label: "Dormant", value: distribution.dormant_percent, color: "bg-gray-400" },
          ].map((seg, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{seg.label}</span>
                <span className="text-muted-foreground">{seg.value}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full ${seg.color} transition-all`}
                  style={{ width: `${seg.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Health Indicator */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-3">Outreach Health</h3>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            {kpis.hot_leads > 0 && (
              <span className="text-red-600 font-semibold">{kpis.hot_leads} HOT leads require immediate outreach</span>
            )}
            {kpis.hot_leads === 0 && <span>No hot leads requiring immediate action</span>}
          </p>
          <p className="text-muted-foreground">
            {kpis.dormant_leads > 0 && (
              <span className="text-amber-600">{kpis.dormant_leads} dormant leads available for reactivation</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}