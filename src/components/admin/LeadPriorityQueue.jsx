/**
 * LeadPriorityQueue — AI-powered lead prioritization view.
 * Surfaces top leads with urgency reasons, score breakdown, and next action.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, Clock, Flame, Loader2, RefreshCw,
  Star, Tag, TrendingUp, Users, Zap, ThumbsUp, ThumbsDown, Minus,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import LeadScoreBadge from "./LeadScoreBadge";

const STATUS_COLORS = {
  New: "bg-blue-100 text-blue-700",
  Contacted: "bg-sky-100 text-sky-700",
  Replied: "bg-indigo-100 text-indigo-700",
  Qualified: "bg-green-100 text-green-700",
  "Booking Prompt Sent": "bg-blue-100 text-blue-700",
  Booked: "bg-emerald-100 text-emerald-700",
  Closed: "bg-gray-100 text-gray-700",
};

function urgencyReasons(lead) {
  const reasons = [];
  const daysSince = (d) => d ? (Date.now() - new Date(d).getTime()) / 86400000 : 999;

  const age = daysSince(lead.created_date);
  const lastContact = daysSince(lead.last_contacted_at);

  if (age <= 1) reasons.push({ icon: Flame, label: "New today", color: "text-red-600" });
  else if (age <= 3) reasons.push({ icon: Clock, label: `${Math.round(age)}d old`, color: "text-blue-600" });

  if (lead.status === "Replied") reasons.push({ icon: Zap, label: "Replied — close now", color: "text-purple-700" });
  if (lead.status === "Qualified") reasons.push({ icon: Star, label: "Qualified", color: "text-green-700" });
  if (lead.status === "Booking Prompt Sent" && lastContact > 1)
    reasons.push({ icon: AlertTriangle, label: "Booking prompt — no response", color: "text-blue-700" });

  if (lead.lead_score >= 70) reasons.push({ icon: TrendingUp, label: `High score ${lead.lead_score}`, color: "text-emerald-700" });

  if (lead.reply_sentiment === "Positive") reasons.push({ icon: ThumbsUp, label: "Positive reply", color: "text-green-700" });
  if (lead.reply_sentiment === "Negative") reasons.push({ icon: ThumbsDown, label: "Negative sentiment", color: "text-red-500" });

  if (lead.industry_tags?.length) reasons.push({ icon: Tag, label: lead.industry_tags[0], color: "text-slate-600" });

  if (!lead.last_contacted_at) reasons.push({ icon: AlertTriangle, label: "Never contacted", color: "text-red-600" });
  else if (lastContact > 7) reasons.push({ icon: Clock, label: `${Math.round(lastContact)}d since contact`, color: "text-blue-600" });

  return reasons.slice(0, 3);
}

function nextAction(lead) {
  if (!lead.last_contacted_at) return "Send first message";
  if (lead.status === "Replied") return "Qualify and offer booking";
  if (lead.status === "Qualified") return "Send booking link";
  if (lead.status === "Booking Prompt Sent") return "Follow up on booking";
  if (lead.status === "Contacted") return "Wait for reply or follow up";
  return "Review and engage";
}

const SENTIMENT_CONFIG = {
  Positive: { label: "Positive", icon: ThumbsUp, color: "text-green-600", bg: "bg-green-50 border-green-200", boost: 40 },
  Neutral:  { label: "Neutral",  icon: Minus,    color: "text-blue-600", bg: "bg-blue-50 border-blue-200",  boost: 0  },
  Negative: { label: "Negative", icon: ThumbsDown, color: "text-red-600", bg: "bg-red-50 border-red-200",      boost: -10 },
  Unknown:  { label: "Unknown",  icon: Minus,    color: "text-slate-400", bg: "bg-slate-50 border-slate-200",  boost: 0  },
};

const PRIORITY_STYLE = {
  Hot:    "bg-red-100 text-red-800 border-red-300",
  High:   "bg-sky-100 text-sky-800 border-sky-300",
  Medium: "bg-blue-100 text-blue-800 border-blue-300",
  Low:    "bg-slate-100 text-slate-600 border-slate-300",
};

function ActivationPriorityBadge({ priority }) {
  if (!priority) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_STYLE[priority] || PRIORITY_STYLE.Low}`}>
      Priority: {priority}
    </span>
  );
}

function SentimentBadge({ sentiment }) {
  if (!sentiment || sentiment === "Unknown") return null;
  const cfg = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.Unknown;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
      <Icon className="h-2.5 w-2.5" /> {cfg.label}
    </span>
  );
}

function isHotLead(lead) {
  if (lead.status === "Closed" || lead.status === "Booked") return false;
  // Hot = high score AND (positive sentiment OR hot status OR replied recently)
  const score = lead.lead_score || 0;
  const hotStatus = ["Replied", "Qualified", "Booking Prompt Sent"].includes(lead.status);
  const positiveSignal = lead.reply_sentiment === "Positive";
  return score >= 70 && (hotStatus || positiveSignal);
}

function priorityScore(lead) {
  let p = lead.lead_score || 0;
  const daysSince = (d) => d ? (Date.now() - new Date(d).getTime()) / 86400000 : 999;

  // Hot tier gets pinned to very top
  if (isHotLead(lead)) p += 100;

  // Boost for hot statuses
  if (lead.status === "Replied") p += 30;
  if (lead.status === "Qualified") p += 20;
  if (lead.status === "Booking Prompt Sent") p += 15;

  // Sentiment boost — Positive Replied leads jump to the top
  const sentimentBoost = SENTIMENT_CONFIG[lead.reply_sentiment]?.boost ?? 0;
  p += sentimentBoost;

  // Boost for very new leads
  const age = daysSince(lead.created_date);
  if (age <= 1) p += 25;
  else if (age <= 3) p += 15;

  // Surface un-contacted leads
  if (!lead.last_contacted_at) p += 10;

  // Boost for enriched leads
  if (lead.enriched_at) p += 5;

  return Math.min(p, 350);
}

export default function LeadPriorityQueue() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [filter, setFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");

  useEffect(() => { loadLeads(); }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Leads.list("-lead_score", 500);
      setLeads(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScoring = async () => {
    setScoring(true);
    try {
      await base44.functions.invoke("scoreLeads", {});
      await loadLeads();
    } finally {
      setScoring(false);
    }
  };

  const STATUS_FILTERS = ["all", "hot", "New", "Contacted", "Replied", "Qualified", "Booking Prompt Sent"];

  const activeleads = leads.filter((l) => l.status !== "Closed" && l.status !== "Booked");

  const filtered = activeleads
    .filter((l) => filter === "all" || (filter === "hot" ? isHotLead(l) : l.status === filter))
    .filter((l) => sentimentFilter === "all" || l.reply_sentiment === sentimentFilter)
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, 50);

  const hotLeads = activeleads.filter(isHotLead);

  const urgentCount = leads.filter((l) => {
    const age = (Date.now() - new Date(l.created_date).getTime()) / 86400000;
    return (l.status === "Replied" || l.status === "Qualified" || age <= 1) && l.status !== "Closed";
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Lead Priority Queue</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked by urgency — score + status + recency + enrichment. Work top-to-bottom.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border overflow-hidden divide-x divide-border">
          <button
            onClick={handleRunScoring}
            disabled={scoring}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            Re-Score
          </button>
          <button
            onClick={loadLeads}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2">
          <Flame className="h-4 w-4 text-red-600" />
          <span className="text-sm font-bold text-red-700">{urgentCount} urgent</span>
          <span className="text-xs text-red-500">need action now</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-bold text-blue-700">{filtered.length} in queue</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2">
          <Star className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-bold text-emerald-700">
            {leads.filter((l) => l.lead_score >= 60).length} high-score
          </span>
          <span className="text-xs text-emerald-500">score ≥60</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-2">
          <ThumbsUp className="h-4 w-4 text-green-600" />
          <span className="text-sm font-bold text-green-700">
            {leads.filter((l) => l.reply_sentiment === "Positive").length} positive
          </span>
          <span className="text-xs text-green-500">reply sentiment</span>
        </div>
        <button
          onClick={() => setFilter("hot")}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 transition-colors ${
            filter === "hot"
              ? "bg-red-600 border-red-600 text-white"
              : "bg-red-50 border-red-200"
          }`}
        >
          <Flame className="h-4 w-4 text-red-600" style={filter === "hot" ? { color: "white" } : {}} />
          <span className={`text-sm font-bold ${filter === "hot" ? "text-white" : "text-red-700"}`}>
            {hotLeads.length} hot
          </span>
          <span className={`text-xs ${filter === "hot" ? "text-red-100" : "text-red-500"}`}>immediate outreach</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              s === "hot"
                ? filter === "hot"
                  ? "bg-red-600 text-white"
                  : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                : filter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s === "all" ? "All Active" : s === "hot" ? "🔥 Hot Leads" : s}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {["all", "Positive", "Neutral", "Negative"].map((s) => {
          const cfg = s !== "all" ? SENTIMENT_CONFIG[s] : null;
          const Icon = cfg?.icon;
          return (
            <button
              key={s}
              onClick={() => setSentimentFilter(s)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                sentimentFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : cfg ? `${cfg.bg} ${cfg.color}` : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              }`}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {s === "all" ? "All Sentiments" : s}
            </button>
          );
        })}
      </div>

      {/* Queue */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading leads…
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No active leads in this filter.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead, idx) => {
            const reasons = urgencyReasons(lead);
            const action = nextAction(lead);
            const hot = isHotLead(lead);
            const isUrgent = hot || reasons.some((r) => r.color.includes("red"));

            return (
              <div
                key={lead.id}
                className={`rounded-xl border p-4 transition-all hover:shadow-sm ${
                  hot ? "border-red-300 bg-gradient-to-r from-red-50/60 to-cyan-50/30 ring-1 ring-red-200" :
                  isUrgent ? "border-red-200 bg-red-50/30" :
                  idx < 5 ? "border-blue-200 bg-blue-50/20" : "border-border bg-white"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    hot ? "bg-red-600 text-white" :
                    idx === 0 ? "bg-red-100 text-red-700" :
                    idx < 3 ? "bg-blue-100 text-blue-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {hot ? "🔥" : idx + 1}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{lead.full_name}</span>
                      {hot && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white px-2 py-0.5 text-[10px] font-bold">
                          🔥 HOT — Outreach Now
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-700"}`}>
                        {lead.status}
                      </span>
                      {lead.lead_score != null && <LeadScoreBadge score={lead.lead_score} />}
                      <ActivationPriorityBadge priority={lead.activation_priority} />
                      <SentimentBadge sentiment={lead.reply_sentiment} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{lead.business_name} · {lead.business_type || "Unknown type"}</p>

                    {/* Urgency reasons */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {reasons.map((r, i) => {
                        const Icon = r.icon;
                        return (
                          <span key={i} className={`inline-flex items-center gap-1 text-[11px] font-semibold ${r.color}`}>
                            <Icon className="h-3 w-3" /> {r.label}
                          </span>
                        );
                      })}
                    </div>

                    {/* Enrichment chips */}
                    {lead.industry_tags?.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {lead.industry_tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold">
                            {tag}
                          </span>
                        ))}
                        {lead.company_size && lead.company_size !== "unknown" && (
                          <span className="rounded-full bg-blue-50 text-blue-600 px-2 py-0.5 text-[10px] font-semibold">
                            {lead.company_size}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Sentiment reason */}
                    {lead.reply_sentiment_reason && lead.reply_sentiment !== "Unknown" && (
                      <p className="text-[11px] text-muted-foreground italic">
                        "{lead.reply_sentiment_reason}"
                      </p>
                    )}

                    {/* Next action */}
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <ArrowRight className="h-3 w-3" />
                      {action}
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => navigate(`/admin/leads/${lead.id}`)}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    Open <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}