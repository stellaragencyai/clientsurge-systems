/**
 * LeadSourceAttribution — aggregates all Leads by their `source` field.
 * Shows total, qualified rate, booked rate, avg score, and pipeline breakdown per source.
 */

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  RefreshCw, TrendingUp, Target, Star, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Minus, Filter, MessageSquare,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_ORDER = ["New", "Contacted", "Replied", "Qualified", "Booking Prompt Sent", "Booked", "Closed"];

const SOURCE_COLORS = [
  "#0077B6", "#00AEEF", "#3b82f6", "#10b981", "#8b5cf6",
  "#00AEEF", "#ef4444", "#06b6d4", "#ec4899", "#6366f1",
];

function pct(num, den) {
  if (!den) return 0;
  return Math.round((num / den) * 100);
}

function avg(arr) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((s, n) => s + n, 0) / arr.length);
}

function buildEventBuckets(events) {
  return (events || []).reduce((acc, event) => {
    const leadId = event.lead_id || event.context_id;
    if (!leadId) return acc;
    if (!acc[leadId]) acc[leadId] = [];
    acc[leadId].push(event);
    return acc;
  }, {});
}

function PerformanceBadge({ rate, label }) {
  const isHigh = rate >= 30;
  const isMid  = rate >= 15;
  const Icon   = isHigh ? ArrowUpRight : isMid ? Minus : ArrowDownRight;
  const cls    = isHigh
    ? "bg-green-50 text-green-700 border-green-200"
    : isMid
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-red-50 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      <Icon className="h-2.5 w-2.5" /> {rate}% {label}
    </span>
  );
}

function SourceRow({ source, data, rank, color, isSelected, onSelect }) {
  const qualRate  = pct(data.qualified + data.booked + data.closed, data.total);
  const bookedRate = pct(data.booked + data.closed, data.total);
  const avgScore  = avg(data.scores);

  return (
    <button
      onClick={() => onSelect(source)}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-white hover:bg-muted/30"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Rank + color dot */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
          <div className="w-3 h-3 rounded-full" style={{ background: color }} />
          <span className="text-[10px] font-bold text-muted-foreground">#{rank}</span>
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-semibold text-foreground capitalize truncate">{source || "unknown"}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <PerformanceBadge rate={qualRate} label="qual." />
              <PerformanceBadge rate={bookedRate} label="booked" />
            </div>
          </div>

          {/* Mini pipeline bar */}
          <div className="mt-2 flex h-2 rounded-full overflow-hidden gap-px">
            {STATUS_ORDER.map((s) => {
              const count = data.by_status[s] || 0;
              const w = pct(count, data.total);
              if (!w) return null;
              return (
                <div
                  key={s}
                  style={{ width: `${w}%` }}
                  className={`h-full ${
                    s === "Booked" || s === "Closed" ? "bg-emerald-500" :
                    s === "Qualified" || s === "Booking Prompt Sent" ? "bg-green-400" :
                    s === "Replied" ? "bg-indigo-400" :
                    s === "Contacted" ? "bg-purple-400" :
                    "bg-blue-300"
                  }`}
                  title={`${s}: ${count}`}
                />
              );
            })}
          </div>

          {/* Stats row */}
          <div className="mt-2 flex items-center gap-4 flex-wrap">
            <span className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{data.total}</span> leads
            </span>
            <span className="text-xs text-muted-foreground">
              Avg score <span className="font-bold text-foreground">{avgScore}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{data.communication_count}</span> touches
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{data.reply_count}</span> replies
            </span>
            {data.high_score_count > 0 && (
              <span className="text-xs text-blue-700 font-semibold">
                ★ {data.high_score_count} high-score
              </span>
            )}
          </div>
        </div>

        {/* Total badge */}
        <div className="flex-shrink-0 text-right">
          <p className="text-2xl font-bold text-foreground">{data.total}</p>
          <p className="text-[10px] text-muted-foreground">leads</p>
        </div>
      </div>
    </button>
  );
}

function DrillDown({ source, data, color }) {
  if (!source) return null;
  const qualRate   = pct(data.qualified + data.booked + data.closed, data.total);
  const bookedRate = pct(data.booked + data.closed, data.total);
  const avgScore   = avg(data.scores);

  const statusData = STATUS_ORDER
    .map(s => ({ name: s, count: data.by_status[s] || 0 }))
    .filter(d => d.count > 0);

  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: color }} />
        <h3 className="text-lg font-semibold text-foreground capitalize">{source}</h3>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {data.total} leads
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Leads",    value: data.total,             color: "blue" },
          { label: "Qual. Rate",     value: `${qualRate}%`,         color: "green" },
          { label: "Booked Rate",    value: `${bookedRate}%`,       color: "emerald" },
          { label: "Avg Lead Score", value: avgScore,               color: "blue" },
        ].map(k => (
          <div key={k.label} className={`rounded-lg border border-border p-3 bg-${k.color}-50`}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{k.label}</p>
            <p className={`text-xl font-bold mt-1 text-${k.color}-700`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Live Touches", value: data.communication_count, color: "blue" },
          { label: "Outbound", value: data.outbound_count, color: "purple" },
          { label: "Replies", value: data.reply_count, color: "green" },
          { label: "Failures", value: data.failed_count, color: "blue" },
        ].map((k) => (
          <div key={k.label} className={`rounded-lg border border-border p-3 bg-${k.color}-50`}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{k.label}</p>
            <p className={`text-xl font-bold mt-1 text-${k.color}-700`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Status bar chart */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Pipeline Breakdown</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={statusData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={24} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
              {statusData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={
                    entry.name === "Booked" || entry.name === "Closed" ? "#10b981" :
                    entry.name === "Qualified" || entry.name === "Booking Prompt Sent" ? "#22c55e" :
                    entry.name === "Replied" ? "#6366f1" :
                    entry.name === "Contacted" ? "#8b5cf6" : "#3b82f6"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Underperformance alert */}
      {bookedRate < 10 && data.total >= 5 && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <AlertTriangle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            <strong>Underperforming channel.</strong> Less than 10% of leads from <em>{source}</em> have booked. Consider reviewing messaging or qualification criteria for this source.
          </p>
        </div>
      )}
      {bookedRate >= 30 && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
          <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">
            <strong>Top performing channel.</strong> <em>{source}</em> converts {bookedRate}% of leads to bookings — consider investing more here.
          </p>
        </div>
      )}
    </div>
  );
}

export default function LeadSourceAttribution() {
  const [leads, setLeads] = useState([]);
  const [eventsByLead, setEventsByLead] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState(null);
  const [sortBy, setSortBy] = useState("total"); // total | qualified | booked | score

  useEffect(() => { loadLeads(); }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Leads.list("-created_date", 1000);
      const nextLeads = data || [];
      const leadIds = nextLeads.map((lead) => lead.id).filter(Boolean);
      const communicationEvents = leadIds.length
        ? await base44.asServiceRole.entities.CommunicationEvent.filter(
            { lead_id: { $in: leadIds } },
            "-created_date",
            2000
          ).catch(() => [])
        : [];

      setLeads(nextLeads);
      setEventsByLead(buildEventBuckets(communicationEvents));
    } finally {
      setLoading(false);
    }
  };

  // Aggregate by source
  const attribution = {};
  for (const lead of leads) {
    const src = (lead.source || "unknown").toLowerCase().trim();
    if (!attribution[src]) {
      attribution[src] = {
        total: 0, qualified: 0, booked: 0, closed: 0,
        by_status: {}, scores: [], high_score_count: 0,
        communication_count: 0, outbound_count: 0, reply_count: 0, failed_count: 0,
      };
    }
    const d = attribution[src];
    const events = eventsByLead[lead.id] || [];
    d.total++;
    d.by_status[lead.status] = (d.by_status[lead.status] || 0) + 1;
    if (lead.lead_score != null) d.scores.push(lead.lead_score);
    if ((lead.lead_score || 0) >= 60) d.high_score_count++;
    if (["Qualified", "Booking Prompt Sent"].includes(lead.status)) d.qualified++;
    if (lead.status === "Booked") d.booked++;
    if (lead.status === "Closed") d.closed++;

    d.communication_count += events.length;
    d.outbound_count += events.filter((event) => event.direction === "outbound").length;
    d.reply_count += events.filter((event) => event.direction === "inbound" || event.status === "received").length;
    d.failed_count += events.filter((event) => event.status === "failed").length;
  }

  // Sort sources
  const sortedSources = Object.entries(attribution).sort(([, a], [, b]) => {
    if (sortBy === "qualified") return pct(b.qualified + b.booked + b.closed, b.total) - pct(a.qualified + a.booked + a.closed, a.total);
    if (sortBy === "booked")    return pct(b.booked + b.closed, b.total) - pct(a.booked + a.closed, a.total);
    if (sortBy === "score")     return avg(b.scores) - avg(a.scores);
    return b.total - a.total; // default: total
  });

  // Chart data — top 8 sources by total
  const chartData = sortedSources.slice(0, 8).map(([src, d]) => ({
    source: src.length > 12 ? src.slice(0, 12) + "…" : src,
    fullSource: src,
    total:      d.total,
    qualified:  d.qualified + d.booked + d.closed,
    booked:     d.booked + d.closed,
  }));

  const totalLeads = leads.length;
  const totalSources = sortedSources.length;
  const totalTouches = Object.values(attribution).reduce((sum, data) => sum + data.communication_count, 0);
  const totalReplies = Object.values(attribution).reduce((sum, data) => sum + data.reply_count, 0);
  const topSource = sortedSources[0]?.[0] || "—";
  const bestConvSource = [...sortedSources]
    .filter(([, d]) => d.total >= 3)
    .sort(([, a], [, b]) => pct(b.booked + b.closed, b.total) - pct(a.booked + a.closed, a.total))[0]?.[0] || "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
        <h2 className="text-2xl font-semibold text-foreground">Lead Source Attribution</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Which marketing channels drive the most qualified traffic — with live CommunicationEvent touches and replies layered in by source.
          </p>
        </div>
        <button
          onClick={loadLeads}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: "Total Leads",    value: totalLeads,   color: "blue"    },
          { icon: Filter,     label: "Sources",        value: totalSources, color: "purple"  },
          { icon: MessageSquare, label: "Live Touches", value: totalTouches, color: "blue"   },
          { icon: Star,       label: "Top Volume",     value: topSource,    color: "blue"   },
          { icon: Target,     label: "Best Conv.",     value: bestConvSource, color: "green" },
          { icon: RefreshCw,  label: "Replies",        value: totalReplies, color: "emerald" },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`rounded-xl border border-border p-4 bg-${k.color}-50`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{k.label}</p>
                <Icon className={`h-4 w-4 text-${k.color}-600`} />
              </div>
              <p className={`text-xl font-bold text-${k.color}-700 capitalize truncate`}>{loading ? "—" : k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      {!loading && chartData.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-sm font-semibold text-foreground mb-4">Volume vs. Qualification (Top Sources)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="source" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={24} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="total"     name="Total"     fill="#0077B6" radius={[4,4,0,0]} opacity={0.4} />
              <Bar dataKey="qualified" name="Qualified+" fill="#0077B6" radius={[4,4,0,0]} opacity={0.75} />
              <Bar dataKey="booked"    name="Booked"    fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#0077B6] opacity-40 inline-block" />Total</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#0077B6] opacity-75 inline-block" />Qualified+</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />Booked</span>
          </div>
        </div>
      )}

      {/* Sort controls + source list */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Source list */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{sortedSources.length} Sources</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort:</span>
              {[
                { key: "total",     label: "Volume"    },
                { key: "qualified", label: "Qual. Rate" },
                { key: "booked",    label: "Booked Rate" },
                { key: "score",     label: "Avg Score" },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    sortBy === s.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : sortedSources.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No leads with source data yet.</p>
          ) : (
            <div className="space-y-2">
              {sortedSources.map(([src, data], idx) => (
                <SourceRow
                  key={src}
                  source={src}
                  data={data}
                  rank={idx + 1}
                  color={SOURCE_COLORS[idx % SOURCE_COLORS.length]}
                  isSelected={selectedSource === src}
                  onSelect={(s) => setSelectedSource(prev => prev === s ? null : s)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Drill-down panel */}
        {selectedSource && (
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <DrillDown
              source={selectedSource}
              data={attribution[selectedSource]}
              color={SOURCE_COLORS[sortedSources.findIndex(([s]) => s === selectedSource) % SOURCE_COLORS.length]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
