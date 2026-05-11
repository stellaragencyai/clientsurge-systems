/**
 * PerformanceDashboard — complete performance analytics panel.
 * Covers: conversion funnel, rep performance, drip stats, enrichment rate, time-to-contact.
 */

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Mail, RefreshCw, TrendingUp, User, Zap,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const FUNNEL_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#059669"];

function StatCard({ label, value, sub, icon: Icon, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
        {Icon && <Icon className="h-4 w-4 opacity-60" />}
      </div>
      <p className="text-3xl font-bold">{value ?? "—"}</p>
      {sub && <p className="mt-1.5 text-xs opacity-70">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div className="mb-4">
      <h3 className="font-semibold text-foreground">{title}</h3>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function PerformanceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await base44.functions.invoke("getAdminAnalytics", {});
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-2">
      <RefreshCw className="h-4 w-4 animate-spin" /> Loading performance data…
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 text-sm">
      <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
    </div>
  );

  const { funnel, rep_performance, drip, enrichment, avg_time_to_contact_hours, leads } = data || {};

  const funnelChartData = (funnel || []).map((f, i) => ({ ...f, fill: FUNNEL_COLORS[i] }));

  const dripStepData = [
    { step: "Day 1", sent: drip?.day1_sent || 0, failed: drip?.day1_failed || 0 },
    { step: "Day 3", sent: drip?.day3_sent || 0, failed: drip?.day3_failed || 0 },
    { step: "Day 7", sent: drip?.day7_sent || 0, failed: drip?.day7_failed || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Performance Dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Funnel conversion, rep stats, drip performance, and enrichment coverage.
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Avg Lead Score" value={leads?.avg_score ?? 0} sub={`${leads?.high_intent_count ?? 0} high-intent (≥60)`} icon={TrendingUp} color="amber" />
        <StatCard label="Avg Time to Contact" value={formatHours(avg_time_to_contact_hours)} sub="From lead create → first contact" icon={Clock} color="blue" />
        <StatCard label="Enriched Leads" value={`${enrichment?.rate ?? 0}%`} sub={`${enrichment?.enriched ?? 0} of ${(enrichment?.enriched ?? 0) + (enrichment?.not_enriched ?? 0)} leads`} icon={Zap} color="green" />
        <StatCard label="Drip Active" value={drip?.active ?? 0} sub={`${drip?.completed ?? 0} completed · ${drip?.stopped ?? 0} stopped`} icon={Mail} color="purple" />
      </div>

      {/* Funnel + Drip */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <div className="rounded-xl border border-border bg-white p-6">
          <SectionHeader title="Conversion Funnel" sub="Cumulative lead progression through pipeline stages" />
          <div className="space-y-3">
            {(funnel || []).map((stage, i) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{stage.stage}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">{stage.count}</span>
                    <span className="text-xs text-muted-foreground w-10 text-right">{stage.rate}%</span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${stage.rate}%`, backgroundColor: FUNNEL_COLORS[i] }}
                  />
                </div>
                {i < (funnel?.length || 0) - 1 && (
                  <div className="flex items-center gap-1 mt-1 ml-1">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {funnel[i + 1]?.count > 0 && stage.count > 0
                        ? `${Math.round((funnel[i + 1].count / stage.count) * 100)}% move forward`
                        : ""}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Drip Campaign Steps */}
        <div className="rounded-xl border border-border bg-white p-6">
          <SectionHeader title="Drip Campaign Performance" sub="Messages sent vs failed per follow-up step" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            {dripStepData.map((step) => (
              <div key={step.step} className="rounded-xl bg-muted/30 border border-border p-3 text-center">
                <p className="text-xs font-semibold text-muted-foreground mb-1">{step.step}</p>
                <p className="text-2xl font-bold text-foreground">{step.sent}</p>
                <p className="text-[10px] text-green-700 font-semibold">sent</p>
                {step.failed > 0 && <p className="text-[10px] text-red-600 font-semibold">{step.failed} failed</p>}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={dripStepData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="step" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={24} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="sent" fill="#10b981" radius={[4, 4, 0, 0]} name="Sent" />
              <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rep Performance */}
      <div className="rounded-xl border border-border bg-white p-6">
        <SectionHeader title="Rep Performance" sub="Per-assignee lead stats — assignments, bookings, and avg time to first contact" />
        {!rep_performance?.length ? (
          <p className="text-sm text-muted-foreground py-4">No rep data yet — assign leads to team members to see their stats here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-semibold text-muted-foreground py-2 pr-4">Rep</th>
                  <th className="text-right font-semibold text-muted-foreground py-2 px-4">Assigned</th>
                  <th className="text-right font-semibold text-muted-foreground py-2 px-4">Booked</th>
                  <th className="text-right font-semibold text-muted-foreground py-2 px-4">Book Rate</th>
                  <th className="text-right font-semibold text-muted-foreground py-2 pl-4">Avg Contact Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rep_performance.map((rep) => (
                  <tr key={rep.email} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{rep.name}</p>
                          <p className="text-[10px] text-muted-foreground">{rep.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-semibold text-foreground">{rep.assigned}</td>
                    <td className="text-right py-3 px-4">
                      <span className="font-semibold text-emerald-700">{rep.booked}</span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        rep.book_rate >= 30 ? "bg-green-100 text-green-700" :
                        rep.book_rate >= 15 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>{rep.book_rate}%</span>
                    </td>
                    <td className="text-right py-3 pl-4 text-muted-foreground">
                      {rep.avg_time_to_contact_hours != null ? formatHours(rep.avg_time_to_contact_hours) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enrichment Coverage */}
      <div className="rounded-xl border border-border bg-white p-6">
        <SectionHeader title="Lead Enrichment Coverage" sub="How many leads have been automatically enriched with website, tags, and social data" />
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Enriched</span>
              <span className="text-sm font-bold text-foreground">{enrichment?.enriched ?? 0} ({enrichment?.rate ?? 0}%)</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${enrichment?.rate ?? 0}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">Not yet enriched: {enrichment?.not_enriched ?? 0}</span>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Auto-enrichment active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function formatHours(h) {
    if (h == null) return "—";
    if (h < 1) return `${Math.round(h * 60)}m`;
    if (h < 24) return `${h}h`;
    return `${(h / 24).toFixed(1)}d`;
  }
}