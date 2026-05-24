import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Users, CheckCircle2, Zap, Loader2, RefreshCw, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const formatCurrency = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-800",
    green: "bg-emerald-50 border-emerald-100 text-emerald-800",
    purple: "bg-purple-50 border-purple-100 text-purple-800",
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color] || "bg-white border-border"}`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">
        <Icon className="w-4 h-4" />
        <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
}

export default function RevenueMetricsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getClientAnalytics", {});
      setData(res.data);
    } catch (e) {
      setError("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDownload = () => {
    if (!data) return;
    const { totals, pipeline, weeksData } = data;
    const lines = [
      "ClientSurge Systems — Monthly Performance Report",
      `Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      "",
      "=== OVERVIEW ===",
      `Total Leads,${totals.totalLeads}`,
      `Booked Appointments,${totals.bookedLeads}`,
      `Qualified Leads,${totals.qualifiedLeads}`,
      `Conversion Rate,${totals.conversionRate}%`,
      `Response Rate,${totals.responseRate}%`,
      `SMS Sent,${totals.smsSent}`,
      `Emails Sent,${totals.emailSent}`,
      `Total Automations Fired,${totals.totalAutomations}`,
      `Estimated Revenue,$${totals.estimatedRevenue}`,
      "",
      "=== PIPELINE BREAKDOWN ===",
      "Status,Count",
      ...pipeline.map(p => `${p.status},${p.count}`),
      "",
      "=== WEEKLY LEAD TREND ===",
      "Week,New Leads",
      ...weeksData.map(w => `${w.week},${w.leads}`),
    ];
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientsurge-report-${new Date().toISOString().slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading analytics…
    </div>
  );

  if (error) return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
  );

  const { totals, weeksData, pipeline } = data;

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Performance Analytics</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/25 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10 transition">
            <Download className="w-4 h-4" /> Download Report
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Leads" value={totals.totalLeads} sub="All time" color="blue" />
        <StatCard icon={CheckCircle2} label="Booked" value={totals.bookedLeads} sub={`${totals.conversionRate}% conversion`} color="green" />
        <StatCard icon={Zap} label="Automations Fired" value={totals.totalAutomations} sub={`${totals.smsSent} SMS · ${totals.emailSent} email`} color="blue" />
        <StatCard icon={TrendingUp} label="Est. Revenue" value={formatCurrency(totals.estimatedRevenue)} sub="Based on bookings" color="purple" />
      </div>

      {/* Weekly trend chart */}
      {weeksData?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h4 className="font-semibold text-foreground mb-4">Weekly Lead Trend</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeksData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                formatter={(v) => [v, "New Leads"]}
              />
              <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                {weeksData.map((_, i) => (
                  <Cell key={i} fill={i === weeksData.length - 1 ? "#0077B6" : "rgba(0,136,204,0.35)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pipeline breakdown */}
      {pipeline?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h4 className="font-semibold text-foreground mb-4">Pipeline Breakdown</h4>
          <div className="space-y-3">
            {pipeline.map(p => {
              const pct = totals.totalLeads > 0 ? Math.round((p.count / totals.totalLeads) * 100) : 0;
              return (
                <div key={p.status} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-32 flex-shrink-0">{p.status}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-foreground w-8 text-right">{p.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Key metrics table */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h4 className="font-semibold text-foreground mb-4">Key Metrics</h4>
        <div className="space-y-3">
          {[
            { label: "Conversion Rate", value: `${totals.conversionRate}%` },
            { label: "Response Rate", value: `${totals.responseRate}%` },
            { label: "SMS Messages Sent", value: totals.smsSent },
            { label: "Emails Sent", value: totals.emailSent },
            { label: "Failed Events", value: totals.failedEvents },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
