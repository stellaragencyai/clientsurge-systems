/**
 * AILeadInsightPanel — per-lead AI qualification card.
 *
 * Shows:
 *  - Qualification tier (Hot/Warm/Cold/Not Qualified)
 *  - AI-generated qualification summary
 *  - Key signals that drove the score
 *  - 3 personalized follow-up action suggestions
 *  - Recommended offer + reason
 *  - Lead score breakdown
 */

import { useState } from "react";
import {
  AlertCircle, BrainCircuit, CheckCircle2, ChevronDown, ChevronUp,
  Clock, Flame, Loader2, Mail, Phone, RefreshCw, Send, Sparkles,
  Tag, TrendingUp, Zap,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const TIER_CONFIG = {
  Hot: {
    label: "🔥 Hot Lead",
    color: "bg-red-50 border-red-300 text-red-800",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
  Warm: {
    label: "☀️ Warm Lead",
    color: "bg-amber-50 border-amber-300 text-amber-800",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400",
  },
  Cold: {
    label: "🧊 Cold Lead",
    color: "bg-blue-50 border-blue-300 text-blue-800",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-400",
  },
  "Not Qualified": {
    label: "❌ Not Qualified",
    color: "bg-gray-50 border-gray-300 text-gray-700",
    badge: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
};

const CHANNEL_ICONS = {
  sms: Phone,
  email: Mail,
  call: Phone,
  internal: BrainCircuit,
};

const TIMING_COLOR = {
  now: "text-red-600 font-bold",
  "within 24h": "text-amber-600 font-semibold",
  "within 48h": "text-blue-600",
  "this week": "text-muted-foreground",
};

function ScoreBar({ score }) {
  const pct = Math.min(100, Math.max(0, score || 0));
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 45 ? "bg-amber-400" : "bg-slate-300";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-foreground w-12 text-right">{pct}/100</span>
    </div>
  );
}

export default function AILeadInsightPanel({ lead, onLeadUpdated }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(() => {
    // Parse existing classification if saved on lead
    if (lead?.ai_last_classification) {
      try {
        return JSON.parse(lead.ai_last_classification);
      } catch (_) {
        return null;
      }
    }
    return null;
  });
  const [error, setError] = useState("");
  const [actionsExpanded, setActionsExpanded] = useState(true);

  const runQualification = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("aiQualifyLead", { lead_id: lead.id });
      const data = res.data;
      setResult({
        tier: data.qualification_tier,
        summary: data.qualification_summary,
        signals: data.key_signals,
        actions: data.follow_up_actions,
        recommended_offer: data.recommended_offer,
        offer_reason: data.offer_reason,
        generated_at: new Date().toISOString(),
      });
      // Notify parent to refresh lead data
      onLeadUpdated?.();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Qualification failed");
    } finally {
      setLoading(false);
    }
  };

  const tier = result?.tier;
  const tierCfg = TIER_CONFIG[tier] || null;

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">AI Lead Qualification</h3>
          {result?.generated_at && (
            <span className="text-[10px] text-muted-foreground">
              · Updated {new Date(result.generated_at).toLocaleDateString()}
            </span>
          )}
        </div>
        <button
          onClick={runQualification}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…</>
            : <><Sparkles className="w-3.5 h-3.5" /> {result ? "Re-analyze" : "Run AI Analysis"}</>
          }
        </button>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Score bar always visible */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lead Score</p>
            {lead?.lead_category && (
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-bold">
                {lead.lead_category}
              </span>
            )}
          </div>
          <ScoreBar score={lead?.lead_score} />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Scored on: status · recency · communication activity · inbound replies · enrichment data
          </p>
        </div>

        {/* Existing quick signals */}
        <div className="flex flex-wrap gap-2">
          {lead?.reply_sentiment && lead.reply_sentiment !== "Unknown" && (
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${
              lead.reply_sentiment === "Positive" ? "bg-green-50 border-green-200 text-green-700"
              : lead.reply_sentiment === "Negative" ? "bg-red-50 border-red-200 text-red-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
            }`}>
              {lead.reply_sentiment === "Positive" ? "😊" : lead.reply_sentiment === "Negative" ? "😟" : "😐"} {lead.reply_sentiment} Sentiment
            </span>
          )}
          {lead?.ai_intent && lead.ai_intent !== "other" && (
            <span className="rounded-full px-2.5 py-1 text-[11px] font-bold border bg-purple-50 border-purple-200 text-purple-700">
              🎯 {lead.ai_intent.replace(/_/g, " ")}
            </span>
          )}
          {lead?.industry_tags?.map(tag => (
            <span key={tag} className="rounded-full px-2.5 py-1 text-[11px] font-semibold border bg-slate-50 border-slate-200 text-slate-600">
              <Tag className="inline w-2.5 h-2.5 mr-1" />{tag}
            </span>
          ))}
        </div>

        {/* Empty state — no analysis yet */}
        {!result && !loading && (
          <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/3 px-5 py-8 text-center">
            <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">No AI analysis yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Click "Run AI Analysis" to have AI review this lead's full communication history, enrichment data, and signals to produce a qualification tier and personalized follow-up plan.
            </p>
            <p className="text-[10px] text-muted-foreground mt-2">Uses Claude Sonnet — uses more integration credits than standard analysis</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Tier badge */}
            {tierCfg && (
              <div className={`rounded-xl border-2 px-5 py-4 ${tierCfg.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${tierCfg.dot}`} />
                  <span className="text-sm font-bold">{tierCfg.label}</span>
                  {lead?.ai_confidence && (
                    <span className="ml-auto text-[11px] opacity-70">{Math.round(lead.ai_confidence * 100)}% confidence</span>
                  )}
                </div>
                <p className="text-sm leading-relaxed opacity-90">{result.summary}</p>
              </div>
            )}

            {/* Key signals */}
            {result.signals?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Signals</p>
                <div className="flex flex-wrap gap-2">
                  {result.signals.map((signal, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary px-3 py-1 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> {signal}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended offer */}
            {result.recommended_offer && (
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recommended Offer</p>
                  <span className="rounded-full bg-primary text-primary-foreground px-3 py-0.5 text-[11px] font-bold">
                    {result.recommended_offer}
                  </span>
                </div>
                {result.offer_reason && (
                  <p className="text-xs text-foreground/70">{result.offer_reason}</p>
                )}
              </div>
            )}

            {/* Follow-up actions */}
            {result.actions?.length > 0 && (
              <div>
                <button
                  onClick={() => setActionsExpanded(e => !e)}
                  className="flex items-center justify-between w-full mb-3"
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    AI-Suggested Follow-Up Actions ({result.actions.length})
                  </p>
                  {actionsExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {actionsExpanded && (
                  <div className="space-y-3">
                    {result.actions.map((action, i) => {
                      const Icon = CHANNEL_ICONS[action.channel] || Send;
                      const timingClass = TIMING_COLOR[action.timing] || "text-muted-foreground";
                      return (
                        <div key={i} className="rounded-xl border border-border bg-white px-4 py-4 hover:border-primary/30 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              i === 0 ? "bg-red-100" : i === 1 ? "bg-amber-100" : "bg-muted"
                            }`}>
                              <span className="text-xs font-black text-foreground/70">#{i + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="text-sm font-semibold text-foreground">{action.action}</p>
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                  <Icon className="w-2.5 h-2.5" /> {action.channel}
                                </span>
                              </div>
                              <p className="text-xs text-foreground/70 leading-relaxed">{action.detail}</p>
                              <p className={`mt-1.5 text-[10px] flex items-center gap-1 ${timingClass}`}>
                                <Clock className="w-2.5 h-2.5" /> {action.timing}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}