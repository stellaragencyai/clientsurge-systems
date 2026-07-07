import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Users, CheckCircle2, Zap, Loader2, RefreshCw, Download, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

const CLIENTSURGE_BLUE = "#00AEEF";
const CLIENTSURGE_BLUE_DEEP = "#006BB0";
const CLIENTSURGE_NAVY = "#003B8F";

const formatCurrency = (n) => {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(num);
};

function safeNumber(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-800",
    green: "bg-emerald-50 border-emerald-100 text-emerald-800",
    amber: "bg-amber-50 border-amber-100 text-amber-800",
    navy: "bg-sky-50 border-sky-100 text-sky-800",
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

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/30 p-10 text-center">
      <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-blue-300" />
      <p className="text-sm font-semibold text-foreground mb-1">No Analytics Data Yet</p>
      <p className="text-xs text-muted-foreground">{message || "Your performance metrics will appear here once your automation system is live and generating leads."}</p>
    </div>
  );
}

export default function RevenueMetricsPanel({ portalState, isAdmin = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Phase A.3: Proof gate — revenue/ROI numbers only show when proof-validated
  const cardState = getCardState(portalState, "roi_revenue_impact");
  const isProofLive = cardState.status === CARD_STATUS.LIVE;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getClientAnalytics", {});
      setData(res.data);
    } catch (e) {
      setError("Failed to load analytics. Please try again, or contact support if this persists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Null-safe extraction — never crash on partial/missing payloads
  const totals = data?.totals || {};
  const pipeline = Array.isArray(data?.pipeline) ? data.pipeline : [];
  const weeksData = Array.isArray(data?.weeksData) ? data.weeksData : [];
  const lastUpdated = data?.lastUpdated || data?.last_updated || null;

  const safeTotals = {
    totalLeads: safeNumber(totals.totalLeads),
    bookedLeads: safeNumber(totals.bookedLeads),
    qualifiedLeads: safeNumber(totals.qualifiedLeads),
    conversionRate: safeNumber(totals.conversionRate),
    responseRate: safeNumber(totals.responseRate),
    smsSent: safeNumber(totals.smsSent),
    emailSent: safeNumber(totals.emailSent),
    totalAutomations: safeNumber(totals.totalAutomations),
    estimatedRevenue: safeNumber(totals.estimatedRevenue),
    failedEvents: safeNumber(totals.failedEvents),
  };

  const hasData = safeTotals.totalLeads > 0 || safeTotals.totalAutomations > 0 || pipeline.length > 0 || weeksData.length > 0;

  const handleDownload = () => {
    const lines = [
      "ClientSurge Systems — Monthly Performance Report",
      `Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      "",
      "=== OVERVIEW ===",
      `Total Leads,${safeTotals.totalLeads}`,
      `Booked Appointments,${safeTotals.bookedLeads}`,
      `Qualified Leads,${safeTotals.qualifiedLeads}`,
      `Conversion Rate,${safeTotals.conversionRate}%`,
      `Response Rate,${safeTotals.responseRate}%`,
      `SMS Sent,${safeTotals.smsSent}`,
      `Emails Sent,${safeTotals.emailSent}`,
      `Total Automations Fired,${safeTotals.totalAutomations}`,
      `Estimated Revenue,$${safeTotals.estimatedRevenue}`,
      "",
      "=== PIPELINE BREAKDOWN ===",
      "Status,Count",
      ...pipeline.map(p => `${p?.status || "Unknown"},${safeNumber(p?.count)}`),
      "",
      "=== WEEKLY LEAD TREND ===",
      "Week,New Leads",
      ...weeksData.map(w => `${w?.week || ""},${safeNumber(w?.leads)}`),
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
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Analytics Unavailable</p>
          <p className="mt-1">{error}</p>
          <button onClick={load} className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-100 transition text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      </div>
    </div>
  );

  if (!hasData) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Performance Analytics</h3>
          <p className="text-xs text-muted-foreground mt-0.5">No data has been collected yet.</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      <EmptyState />
    </div>
  );

  // Phase A.3: When proof not Live, suppress unproven revenue/ROI numbers
  const displayValue = (val) => isProofLive ? val : "Pending";

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Performance Analytics</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}` : "Metrics scoped to your project"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          {isProofLive && (
            <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/25 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10 transition">
              <Download className="w-4 h-4" /> Download Report
            </button>
          )}
        </div>
      </div>

      {/* Phase A.3: Proof notice */}
      {!isProofLive && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 text-sm text-blue-700 font-medium">
          {cardState.display_text}
        </div>
      )}

      {/* KPI cards — values suppressed when proof not Live */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Leads" value={displayValue(safeTotals.totalLeads)} sub="All time" color="blue" />
        <StatCard icon={CheckCircle2} label="Booked" value={displayValue(safeTotals.bookedLeads)} sub={isProofLive ? `${safeTotals.conversionRate}% conversion` : "Verifying"} color="green" />
        <StatCard icon={Zap} label="Automations Fired" value={displayValue(safeTotals.totalAutomations)} sub={isProofLive ? `${safeTotals.smsSent} SMS · ${safeTotals.emailSent} email` : "Verifying"} color="amber" />
        <StatCard icon={TrendingUp} label="Est. Revenue" value={displayValue(formatCurrency(safeTotals.estimatedRevenue))} sub={isProofLive ? "Based on bookings" : "Verifying"} color="navy" />
      </div>

      {/* Phase A.4: Weekly trend chart — suppressed when proof not Live */}
      {isProofLive && weeksData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h4 className="font-semibold text-foreground mb-4">Weekly Lead Trend</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeksData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${CLIENTSURGE_BLUE}40` }}
                formatter={(v) => [v, "New Leads"]}
              />
              <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                {weeksData.map((_, i) => (
                  <Cell key={i} fill={i === weeksData.length - 1 ? CLIENTSURGE_NAVY : `${CLIENTSURGE_BLUE}66`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Phase A.4: Pipeline breakdown — suppressed when proof not Live */}
      {isProofLive && pipeline.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h4 className="font-semibold text-foreground mb-4">Pipeline Breakdown</h4>
          <div className="space-y-3">
            {pipeline.map(p => {
              const count = safeNumber(p?.count);
              const pct = safeTotals.totalLeads > 0 ? Math.round((count / safeTotals.totalLeads) * 100) : 0;
              return (
                <div key={p?.status || "unknown"} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-32 flex-shrink-0">{p?.status || "Unknown"}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: CLIENTSURGE_BLUE }} />
                  </div>
                  <span className="text-xs font-bold text-foreground w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Key metrics table — values suppressed when proof not Live */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h4 className="font-semibold text-foreground mb-4">Key Metrics</h4>
        <div className="space-y-3">
          {[
            { label: "Conversion Rate", value: isProofLive ? `${safeTotals.conversionRate}%` : "Pending" },
            { label: "Response Rate", value: isProofLive ? `${safeTotals.responseRate}%` : "Pending" },
            { label: "SMS Messages Sent", value: displayValue(safeTotals.smsSent) },
            { label: "Emails Sent", value: displayValue(safeTotals.emailSent) },
            { label: "Failed Events", value: displayValue(safeTotals.failedEvents) },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <PortalAdminDiagnostics card={cardState} isAdmin={isAdmin} />
    </div>
  );
}