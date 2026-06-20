import React, { useState, useEffect } from "react";
import { Flame, TrendingUp, DollarSign, Users, AlertCircle, Loader2, PhoneCall, Mail, MessageSquare, RotateCcw, Play, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PAGE_SIZE = 25;

const SEGMENT_CONFIG = {
  ALL: { label: "All Leads", filter: {} },
  HOT_LEADS: { label: "🔥 Hot Leads", filter: { intelligence_segment: "HOT_LEADS" } },
  HIGH_INTENT: { label: "⚡ High Intent", filter: { intelligence_segment: "HIGH_INTENT" } },
  NURTURE: { label: "🌱 Nurture Queue", filter: { intelligence_segment: "NURTURE" } },
  DORMANT: { label: "💤 Dormant", filter: { intelligence_segment: "DORMANT" } },
  COLD: { label: "❄️ Cold Leads", filter: { intelligence_segment: "COLD" } },
};

function ScoreBar({ score }) {
  const color = score >= 80 ? "bg-red-500" : score >= 50 ? "bg-orange-400" : "bg-slate-300";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-bold text-foreground">{score}</span>
    </div>
  );
}

function SegmentBadge({ segment }) {
  const styles = {
    HOT_LEADS: "bg-red-100 text-red-800",
    HIGH_INTENT: "bg-orange-100 text-orange-800",
    NURTURE: "bg-green-100 text-green-800",
    ENGAGED: "bg-blue-100 text-blue-800",
    DORMANT: "bg-slate-100 text-slate-600",
    COLD: "bg-gray-100 text-gray-600",
    UNKNOWN: "bg-gray-100 text-gray-500",
  };
  const labels = {
    HOT_LEADS: "🔥 Hot",
    HIGH_INTENT: "⚡ High Intent",
    NURTURE: "🌱 Nurture",
    ENGAGED: "💬 Engaged",
    DORMANT: "💤 Dormant",
    COLD: "❄️ Cold",
  };
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${styles[segment] || styles.UNKNOWN}`}>
      {labels[segment] || segment}
    </span>
  );
}

export default function LeadIntelligenceDashboard() {
  const [activeSegment, setActiveSegment] = useState("ALL");
  const [leads, setLeads] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [computeResult, setComputeResult] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  // Load KPIs and first page
  useEffect(() => {
    loadIntelligence();
  }, []);

  // Load leads when segment/page changes
  useEffect(() => {
    loadLeads();
  }, [activeSegment, page]);

  const loadIntelligence = async () => {
    try {
      const response = await base44.functions.invoke("getLeadIntelligenceOverview", {});
      setKpis(response?.data?.kpis || null);
    } catch (err) {
      console.error("Failed to load intelligence:", err);
    }
  };

  const loadLeads = async () => {
    setLoading(true);
    setError("");
    try {
      const segmentFilter = SEGMENT_CONFIG[activeSegment]?.filter || {};
      const offset = page * PAGE_SIZE;
      const result = await base44.asServiceRole.entities.Leads.filter(
        segmentFilter,
        "-intelligence_score",
        PAGE_SIZE,
        offset
      );
      setLeads(result || []);
    } catch (err) {
      setError(err.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const [computeProgress, setComputeProgress] = useState(0);

  const handleRecomputeAll = async () => {
    setComputing(true);
    setComputeResult(null);
    setComputeProgress(0);

    let skip = 0;
    let totalScored = 0;

    try {
      while (true) {
        const response = await base44.functions.invoke("computeLeadIntelligence", { skip });
        const data = response?.data;
        totalScored += data?.total_processed || 0;
        setComputeProgress(totalScored);

        if (data?.done || !data?.next_skip) break;
        skip = data.next_skip;
      }

      setComputeResult({ success: true, message: `Scored ${totalScored} leads successfully` });
      await loadIntelligence();
      await loadLeads();
    } catch (err) {
      setComputeResult({ success: false, message: err.message || "Compute failed" });
    } finally {
      setComputing(false);
      setComputeProgress(0);
    }
  };

  const kpiCards = kpis
    ? [
        { label: "Total Leads", value: kpis.total_leads, icon: Users, color: "bg-blue-50 text-blue-700" },
        { label: "Hot Leads", value: kpis.hot_leads, icon: Flame, color: "bg-red-50 text-red-700" },
        { label: "High Intent", value: kpis.high_intent_leads, icon: TrendingUp, color: "bg-orange-50 text-orange-700" },
        { label: "Revenue at Risk", value: `$${(kpis.total_revenue_at_risk || 0).toLocaleString()}`, icon: DollarSign, color: "bg-green-50 text-green-700" },
        { label: "Dormant", value: kpis.dormant_leads, icon: RotateCcw, color: "bg-slate-100 text-slate-700" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Lead Intelligence Layer</h2>
          <p className="text-muted-foreground text-sm mt-1">AI-scored prioritization engine for all ~5,800 leads</p>
        </div>
        <div className="flex items-center gap-3">
          {computeResult && (
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${computeResult.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {computeResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {computeResult.message}
            </span>
          )}
          <button
            onClick={handleRecomputeAll}
            disabled={computing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60"
          >
            {computing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {computing ? (computeProgress > 0 ? `Scored ${computeProgress} leads...` : "Starting...") : "Run Intelligence Scoring"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {kpiCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className={`rounded-xl border border-border p-5 ${card.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide">{card.label}</p>
                </div>
                <p className="text-3xl font-black">{card.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Segment Tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(SEGMENT_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { setActiveSegment(key); setPage(0); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              activeSegment === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground hover:bg-muted"
            }`}
          >
            {cfg.label}
            {kpis && key !== "ALL" && (
              <span className={`ml-2 text-xs rounded-full px-1.5 py-0.5 ${activeSegment === key ? "bg-white/20" : "bg-muted"}`}>
                {kpis[key.toLowerCase() + "_leads"] || kpis[(key === "HOT_LEADS" ? "hot" : key === "HIGH_INTENT" ? "high_intent" : key.toLowerCase()) + "_leads"] || ""}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Leads Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 p-4 text-sm text-red-700 bg-red-50 border-b border-red-200">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Lead</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Segment</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Intelligence Score</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Revenue Est.</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Recommended Action</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center text-muted-foreground">
                    No leads in this segment. Run Intelligence Scoring to populate.
                  </td>
                </tr>
              ) : (
                leads.map((lead, idx) => {
                  const rank = page * PAGE_SIZE + idx + 1;
                  const score = lead.intelligence_score || 0;
                  let action = score >= 80 ? "Call now" : score >= 70 ? "Send SMS" : score >= 50 ? "Nurture email" : "Drip campaign";
                  const ActionIcon = score >= 80 ? PhoneCall : score >= 70 ? MessageSquare : Mail;
                  return (
                    <tr key={lead.id} className={`hover:bg-muted/30 transition-colors ${score >= 80 ? "bg-red-50/30" : ""}`}>
                      <td className="px-4 py-3 text-muted-foreground text-xs font-semibold">{rank}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{lead.full_name}</p>
                        <p className="text-xs text-muted-foreground">{lead.business_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <SegmentBadge segment={lead.intelligence_segment || "UNKNOWN"} />
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBar score={score} />
                      </td>
                      <td className="px-4 py-3">
                        {lead.revenue_impact_estimate ? (
                          <span className="text-green-700 font-semibold text-xs">${lead.revenue_impact_estimate}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-muted">{lead.status || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                          <ActionIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          {action}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {lead.last_activity_at ? new Date(lead.last_activity_at).toLocaleDateString() : "No activity"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/10">
          <p className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + leads.length} in <span className="font-semibold">{SEGMENT_CONFIG[activeSegment].label}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
              className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              ← Prev
            </button>
            <span className="text-xs text-muted-foreground px-2">Page {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={leads.length < PAGE_SIZE || loading}
              className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}