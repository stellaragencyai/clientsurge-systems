/**
 * LeadActivityFeed — read-only client portal view of their lead pipeline.
 * Shows aggregate stats + recent lead movement from the Leads entity,
 * filtered to only the leads generated for this client.
 * Supports bulk selection with floating action toolbar.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Users, TrendingUp, CheckCircle2, MessageSquare,
  Loader2, RefreshCw, AlertCircle, Zap, PhoneCall,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import LeadScoreCard from "./LeadScoreCard";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

const STATUS_COLORS = {
  New: "bg-blue-100 text-blue-700",
  Contacted: "bg-purple-100 text-purple-700",
  Replied: "bg-indigo-100 text-indigo-700",
  Qualified: "bg-green-100 text-green-700",
  "Booking Prompt Sent": "bg-amber-100 text-amber-700",
  Booked: "bg-emerald-100 text-emerald-700",
  Closed: "bg-gray-100 text-gray-700",
};

const STATUS_DOT = {
  Booked: "bg-emerald-500",
  Qualified: "bg-green-500",
  Replied: "bg-indigo-500",
  Contacted: "bg-purple-400",
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-800",
    green: "bg-green-50 border-green-100 text-green-800",
    amber: "bg-amber-50 border-amber-100 text-amber-800",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-800",
    purple: "bg-purple-50 border-purple-100 text-purple-800",
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color] || "bg-white border-border"}`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">
        <Icon className="w-4 h-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
    </div>
  );
}

function LeadRow({ lead }) {
  const daysSinceContact = lead.last_contacted_at
    ? Math.floor((Date.now() - new Date(lead.last_contacted_at)) / 86400000)
    : null;

  return (
    <div
      className="flex items-start gap-3 py-3 border-b border-border last:border-0 transition-colors rounded-lg px-2 -mx-2 hover:bg-muted/40"
    >
      {/* Status dot */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-0.5">
        <div className={`w-3 h-3 rounded-full ${STATUS_DOT[lead.status] || "bg-blue-400"}`} />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground truncate">{lead.full_name}</p>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-700"}`}>
            {lead.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{lead.business_name || lead.business_type}</p>
        {lead.lead_score !== undefined && lead.lead_score !== null && (
          <LeadScoreCard lead={lead} />
        )}
      </div>

      <div className="text-right flex-shrink-0">
        {daysSinceContact !== null && (
          <p className="text-[10px] text-muted-foreground">
            {daysSinceContact === 0 ? "Contacted today" : `${daysSinceContact}d ago`}
          </p>
        )}
        {lead.last_contacted_at === null && (
          <p className="text-[10px] text-amber-600 font-medium">Pending</p>
        )}
      </div>
    </div>
  );
}

export default function LeadActivityFeed({ project, portalState, isAdmin = false }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Phase A.3: Proof gate — aggregate stats suppressed until proof-validated
  const cardState = getCardState(portalState, "lead_capture");
  const isProofLive = cardState.status === CARD_STATUS.LIVE;
  const displayValue = (val) => isProofLive ? val : "Pending";

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Load leads in chunks to handle large datasets (5000+)
      let allLeads = [];
      let skip = 0;
      const pageSize = 500;
      let hasMore = true;

      while (hasMore) {
        const res = await base44.functions.invoke("getClientPortalLeads", {
          skip,
          limit: pageSize,
        });
        const pageLeads = res.data?.leads || [];
        allLeads = [...allLeads, ...pageLeads];
        hasMore = pageLeads.length === pageSize;
        skip += pageSize;
      }

      setLeads(allLeads);
    } catch (err) {
      setError("Unable to load lead activity right now.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const recentLeads = [...leads].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)).slice(0, 30);

  // Stats
  const total = leads.length;
  const contacted = leads.filter(l => ["Contacted","Replied","Qualified","Booking Prompt Sent","Booked"].includes(l.status)).length;
  const booked = leads.filter(l => l.status === "Booked").length;
  const qualified = leads.filter(l => l.status === "Qualified").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your lead activity…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground">Your Lead Activity</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time view of the leads our AI system is working through on your behalf.
        </p>
      </div>

      {/* How it works banner */}
      <div
        className="rounded-2xl p-5 text-sm space-y-3"
        style={{ background: "rgba(154,92,46,0.06)", border: "1px solid rgba(154,92,46,0.15)" }}
      >
        <p className="font-semibold text-foreground">How your automated system works:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { Icon: Zap, label: "Instant Response", desc: "New leads get an SMS within seconds of contacting you." },
            { Icon: MessageSquare, label: "Follow-Up Sequence", desc: "Leads that don't reply are followed up on Day 1, 3, and 7." },
            { Icon: PhoneCall, label: "Missed Call Recovery", desc: "Missed calls trigger an automatic text-back to recover the lead." },
          ].map(({ Icon, label, desc }) => (
            <div key={label} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(154,92,46,0.12)" }}>
                <Icon className="w-4 h-4" style={{ color: "#9a5c2e" }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase A.3: Proof notice */}
      {!isProofLive && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 text-sm text-blue-700 font-medium">
          {cardState.display_text}
        </div>
      )}

      {/* Stats — values suppressed when proof not Live */}
      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-foreground">No leads yet</p>
          <p className="text-sm mt-1">Once your system goes live, leads will appear here automatically.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Leads" value={displayValue(total)} sub="All time" color="blue" />
            <StatCard icon={MessageSquare} label="Contacted" value={displayValue(contacted)} sub={isProofLive ? "Reached by your system" : "Verifying"} color="purple" />
            <StatCard icon={TrendingUp} label="Qualified" value={displayValue(qualified)} sub={isProofLive ? "High-intent leads" : "Verifying"} color="amber" />
            <StatCard icon={CheckCircle2} label="Booked" value={displayValue(booked)} sub={isProofLive ? "Converted to appointment" : "Verifying"} color="emerald" />
          </div>

          {/* Conversion bar — suppressed when proof not Live */}
          {isProofLive ? (
            <div className="rounded-2xl border border-border bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">Pipeline Conversion</p>
                <p className="text-xs text-muted-foreground">{booked} of {total} leads booked</p>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.round((booked / total) * 100)}%`,
                    background: "linear-gradient(90deg, #7a4825, #c8965c)",
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
                <span>0%</span>
                <span className="font-semibold text-foreground">{Math.round((booked / total) * 100)}% book rate</span>
                <span>100%</span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5 text-sm text-blue-700 font-medium">
              Pipeline conversion metrics will display once your system is verified.
            </div>
          )}

          {/* Leads table with bulk select */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(154,92,46,0.12)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Recent Lead Activity</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Most recently updated leads in your pipeline
                </p>
              </div>
              <button
                onClick={loadLeads}
                disabled={loading}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No recent activity yet.</p>
            ) : (
              <div>
                {recentLeads.map(lead => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Status breakdown — suppressed when proof not Live */}
          {isProofLive ? (
            <div className="rounded-2xl border border-border bg-white p-5">
              <h3 className="font-semibold text-foreground mb-4">Status Breakdown</h3>
              <div className="space-y-2">
                {["New","Contacted","Replied","Qualified","Booking Prompt Sent","Booked","Closed"].map(status => {
                  const count = leads.filter(l => l.status === status).length;
                  if (count === 0) return null;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold w-28 justify-center flex-shrink-0 ${STATUS_COLORS[status]}`}>
                        {status}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#9a5c2e,#c8965c)" }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      )}

      <PortalAdminDiagnostics card={cardState} isAdmin={isAdmin} />
    </div>
  );
}