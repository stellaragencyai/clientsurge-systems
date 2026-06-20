import React, { useState, useEffect } from "react";
import { Flame, TrendingUp, PhoneIcon, Mail, AlertCircle, Loader2, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LeadIntelligenceQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const response = await base44.functions.invoke("getLeadIntelligenceOverview", {});
        setQueue(response?.data?.priority_queue || []);
      } catch (err) {
        setError(err.message || "Failed to load priority queue");
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 120000); // Refresh every 2 minutes
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
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  const getSegmentColor = (segment) => {
    const colors = {
      HOT_LEADS: "bg-red-100 text-red-800 border-red-300",
      HIGH_INTENT: "bg-orange-100 text-orange-800 border-orange-300",
      WARM: "bg-amber-100 text-amber-800 border-amber-300",
      ENGAGED: "bg-blue-100 text-blue-800 border-blue-300",
      DORMANT: "bg-slate-100 text-slate-800 border-slate-300",
      COLD: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return colors[segment] || "bg-gray-100 text-gray-800";
  };

  const getActionIcon = (action) => {
    if (action.includes("Call")) return <PhoneIcon className="w-4 h-4" />;
    if (action.includes("SMS")) return <AlertCircle className="w-4 h-4" />;
    if (action.includes("email")) return <Mail className="w-4 h-4" />;
    return <TrendingUp className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Priority Outreach Queue</h3>
        <span className="text-xs font-semibold text-muted-foreground">{queue.length} leads</span>
      </div>

      <div className="space-y-2">
        {queue.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground rounded-lg border border-dashed border-border">
            No leads in priority queue
          </div>
        ) : (
          queue.map((lead, idx) => (
            <div
              key={lead.id}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow"
            >
              {/* Rank Badge */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm flex-shrink-0">
                {idx + 1}
              </div>

              {/* Lead Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="font-semibold text-foreground">{lead.full_name}</p>
                    <p className="text-sm text-muted-foreground">{lead.business_name}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 border ${getSegmentColor(lead.intelligence_segment)}`}>
                    {lead.intelligence_segment?.replace("_", " ") || "Unknown"}
                  </span>
                </div>

                {/* Contact & Status */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                  {lead.phone && <span>{lead.phone}</span>}
                  {lead.email && <span>{lead.email}</span>}
                  {lead.status && <span className="px-1.5 py-0.5 rounded bg-muted">{lead.status}</span>}
                </div>

                {/* Score & Action */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Score:</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${i < Math.round(lead.intelligence_score / 20) ? "bg-primary" : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <span className="ml-1 font-bold text-foreground">{lead.intelligence_score}</span>
                  </div>

                  <div className="flex-1" />

                  {/* Recommended Action */}
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                    {getActionIcon(lead.recommended_action)}
                    <span className="hidden sm:inline">{lead.recommended_action}</span>
                  </div>

                  {/* Revenue Impact */}
                  {lead.revenue_impact > 0 && (
                    <div className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                      ${lead.revenue_impact.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
            </div>
          ))
        )}
      </div>

      <button className="w-full text-sm font-semibold text-primary hover:text-primary/80 transition-colors py-2 rounded-lg border border-primary/20 hover:border-primary/40">
        View all leads in intelligence system →
      </button>
    </div>
  );
}