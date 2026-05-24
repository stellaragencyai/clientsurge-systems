/**
 * NurtureCampaignPanel — 30-day nurture sequence management dashboard.
 * View progress, stop/start per lead, manually enroll leads.
 */

import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Activity, AlertCircle, BookOpen, CheckCircle, CheckCircle2,
  Clock, Heart, Lightbulb, Loader2, Pause, Play, Plus,
  RefreshCw, Send, Star, Users, XCircle, Zap,
} from "lucide-react";
import DeleteConfirmModal from "./DeleteConfirmModal";

const STEP_DEFINITIONS = [
  { num: 1, day: 0,  label: "Welcome",       theme: "welcome",       icon: Heart,     color: "bg-blue-100 text-blue-700" },
  { num: 2, day: 3,  label: "Case Study",    theme: "case_study_1",  icon: BookOpen,  color: "bg-purple-100 text-purple-700" },
  { num: 3, day: 7,  label: "Testimonial",   theme: "testimonial_1", icon: Star,      color: "bg-blue-100 text-blue-700" },
  { num: 4, day: 10, label: "Tip",           theme: "tip_1",         icon: Lightbulb, color: "bg-green-100 text-green-700" },
  { num: 5, day: 14, label: "Case Study 2",  theme: "case_study_2",  icon: BookOpen,  color: "bg-indigo-100 text-indigo-700" },
  { num: 6, day: 18, label: "Testimonial 2", theme: "testimonial_2", icon: Star,      color: "bg-rose-100 text-rose-700" },
  { num: 7, day: 23, label: "Tip + Offer",   theme: "tip_offer",     icon: Zap,       color: "bg-sky-100 text-sky-700" },
  { num: 8, day: 30, label: "Final CTA",     theme: "final_cta",     icon: Send,      color: "bg-red-100 text-red-700" },
];

const STATUS_CONFIG = {
  active:    { label: "Active",    color: "bg-green-100 text-green-700",  icon: Activity },
  paused:    { label: "Paused",    color: "bg-blue-100 text-blue-700",  icon: Pause },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700",    icon: CheckCircle2 },
  stopped:   { label: "Stopped",   color: "bg-gray-100 text-gray-600",    icon: XCircle },
};

const STEP_STATUS_STYLES = {
  sent:    "bg-green-100 text-green-700 border-green-200",
  pending: "bg-muted text-muted-foreground border-border",
  failed:  "bg-red-100 text-red-700 border-red-200",
  skipped: "bg-gray-100 text-gray-500 border-gray-200",
};

function ProgressTimeline({ campaign }) {
  const daysSince = campaign.enrolled_at
    ? Math.floor((Date.now() - new Date(campaign.enrolled_at).getTime()) / 86400000)
    : 0;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">
          Day {daysSince} of 30 · enrolled {campaign.enrolled_at ? new Date(campaign.enrolled_at).toLocaleDateString() : "—"}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${Math.min(100, (daysSince / 30) * 100)}%` }}
        />
      </div>

      {/* Step grid */}
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
        {STEP_DEFINITIONS.map((step) => {
          const statusKey = `step${step.num}_status`;
          const status = campaign[statusKey] || "pending";
          const sentAt = campaign[`step${step.num}_sent_at`];
          const Icon = step.icon;
          const styleClass = STEP_STATUS_STYLES[status] || STEP_STATUS_STYLES.pending;
          const isDue = daysSince >= step.day;

          return (
            <div
              key={step.num}
              title={`Day ${step.day}: ${step.label} — ${status}${sentAt ? ` · sent ${new Date(sentAt).toLocaleDateString()}` : ""}`}
              className={`relative flex flex-col items-center gap-1 rounded-lg border px-1.5 py-2 text-center transition-all ${styleClass} ${isDue && status === "pending" ? "ring-1 ring-primary/40" : ""}`}
            >
              <Icon className="w-3 h-3" />
              <span className="text-[9px] font-bold leading-tight">{step.label}</span>
              <span className="text-[8px] font-semibold opacity-75">D{step.day}</span>
              {status === "sent" && <CheckCircle2 className="w-2.5 h-2.5 text-green-600 absolute top-1 right-1" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CampaignCard({ campaign, onPause, onResume, onStop, onRequestStop, actionLoading }) {
  const cfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.active;
  const Icon = cfg.icon;
  const isActive = campaign.status === "active";
  const isPaused = campaign.status === "paused";
  const sentCount = STEP_DEFINITIONS.filter(s => campaign[`step${s.num}_status`] === "sent").length;

  return (
    <div className={`rounded-xl border p-4 space-y-2 ${isActive ? "border-primary/20 bg-primary/3" : "border-border bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-semibold text-foreground truncate">{campaign.lead_name || "Unknown Lead"}</p>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
              <Icon className="w-2.5 h-2.5" />{cfg.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{sentCount}/8 emails sent</span>
          </div>
          <p className="text-xs text-muted-foreground">{campaign.lead_email} · {campaign.lead_business}</p>
          {campaign.stop_reason && (
            <p className="text-xs text-blue-700 mt-0.5 font-medium">
              Reason: {campaign.stop_reason.replace(/_/g, " ")}
            </p>
          )}
        </div>

        <div className="flex gap-1.5 flex-shrink-0">
          {isActive && (
            <button
              onClick={() => onPause(campaign.id)}
              disabled={actionLoading === campaign.id}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {actionLoading === campaign.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3" />}
              Pause
            </button>
          )}
          {isPaused && (
            <button
              onClick={() => onResume(campaign.id)}
              disabled={actionLoading === campaign.id}
              className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-2.5 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {actionLoading === campaign.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Resume
            </button>
          )}
          {(isActive || isPaused) && (
            <button
              onClick={() => onRequestStop(campaign.id)}
              disabled={actionLoading === campaign.id}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 text-red-600 bg-red-50 px-2.5 py-1.5 text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3 h-3" /> Stop
            </button>
          )}
        </div>
      </div>

      <ProgressTimeline campaign={campaign} />
    </div>
  );
}

function EnrollModal({ onClose, onEnrolled }) {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);

  useEffect(() => {
    base44.entities.Leads.list("-created_date", 200).then(data => {
      setLeads(data?.filter(l => l.email) || []);
      setLoading(false);
    });
  }, []);

  const filtered = leads.filter(l =>
    !search || l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEnroll = async (lead) => {
    setEnrolling(lead.id);
    try {
      await base44.functions.invoke("startNurtureCampaign", { lead_id: lead.id });
      onEnrolled();
      onClose();
    } catch (err) {
      console.error("Enroll error:", err);
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Enroll Lead in 30-Day Nurture</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Select a lead with an email address to start the sequence</p>
        </div>
        <div className="px-4 pt-3">
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading leads…
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No leads with email found.</p>
          ) : (
            filtered.slice(0, 30).map(lead => (
              <div key={lead.id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{lead.full_name}</p>
                  <p className="text-xs text-muted-foreground">{lead.business_name} · {lead.email}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                    lead.status === "New" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"
                  }`}>{lead.status}</span>
                </div>
                <button
                  onClick={() => handleEnroll(lead)}
                  disabled={!!enrolling}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {enrolling === lead.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Enroll
                </button>
              </div>
            ))
          )}
        </div>
        <div className="px-6 py-3 border-t border-border">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function NurtureCampaignPanel() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [confirmStopId, setConfirmStopId] = useState(null);

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await base44.entities.NurtureCampaign.list("-enrolled_at", 300);
      setCampaigns(data || []);
    } catch {
      setError("Failed to load nurture campaigns.");
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id) => {
    setActionLoading(id);
    try {
      await base44.entities.NurtureCampaign.update(id, { status: "paused", stop_reason: "manual_pause" });
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: "paused", stop_reason: "manual_pause" } : c));
    } finally { setActionLoading(null); }
  };

  const handleResume = async (id) => {
    setActionLoading(id);
    try {
      await base44.entities.NurtureCampaign.update(id, { status: "active", stop_reason: null });
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: "active", stop_reason: null } : c));
    } finally { setActionLoading(null); }
  };

  const handleStop = async (id) => {
    setActionLoading(id);
    try {
      await base44.entities.NurtureCampaign.update(id, { status: "stopped", stop_reason: "manual_stop" });
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: "stopped", stop_reason: "manual_stop" } : c));
    } finally { setActionLoading(null); setConfirmStopId(null); }
  };

  const handleRunNow = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await base44.functions.invoke("processNurtureCampaigns", {});
      setRunResult(res.data);
      await loadCampaigns();
    } catch (err) {
      setRunResult({ error: err?.response?.data?.error || "Run failed" });
    } finally { setRunning(false); }
  };

  const filtered = statusFilter === "all" ? campaigns : campaigns.filter(c => c.status === statusFilter);
  const counts = {
    all: campaigns.length,
    active: campaigns.filter(c => c.status === "active").length,
    paused: campaigns.filter(c => c.status === "paused").length,
    completed: campaigns.filter(c => c.status === "completed").length,
    stopped: campaigns.filter(c => c.status === "stopped").length,
  };
  const totalEmailsSent = campaigns.reduce((sum, c) =>
    sum + STEP_DEFINITIONS.filter(s => c[`step${s.num}_status`] === "sent").length, 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">30-Day Nurture Campaigns</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            8-step email sequence with case studies, testimonials &amp; tips. Auto-enrolls when a lead is tagged "Nurture".
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEnroll(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Plus className="h-4 w-4" /> Enroll Lead
          </button>
          <button
            onClick={handleRunNow}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Run Now
          </button>
          <button
            onClick={loadCampaigns}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Run result */}
      {runResult && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${runResult.error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-800"}`}>
          {runResult.error
            ? <><AlertCircle className="w-4 h-4 flex-shrink-0" />{runResult.error}</>
            : <><CheckCircle className="w-4 h-4 flex-shrink-0" />
              Checked {runResult.campaigns_checked} campaigns · {runResult.fired} emails sent · {runResult.stopped} stopped · {runResult.errors} errors</>
          }
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active", value: counts.active, color: "bg-green-50 text-green-700 border-green-100" },
          { label: "Paused", value: counts.paused, color: "bg-blue-50 text-blue-700 border-blue-100" },
          { label: "Completed", value: counts.completed, color: "bg-blue-50 text-blue-700 border-blue-100" },
          { label: "Emails Sent", value: totalEmailsSent, color: "bg-purple-50 text-purple-700 border-purple-100" },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-xl border p-4 ${kpi.color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{kpi.label}</p>
            <p className="text-3xl font-bold mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Sequence preview */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
          <Send className="w-3.5 h-3.5 text-primary" /> 30-Day Sequence Overview
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {STEP_DEFINITIONS.map(step => {
            const Icon = step.icon;
            return (
              <div key={step.num} className={`rounded-lg px-2 py-2 text-center text-[10px] ${step.color}`}>
                <Icon className="w-3 h-3 mx-auto mb-1" />
                <p className="font-bold">D{step.day}</p>
                <p className="font-semibold leading-tight">{step.label}</p>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          Auto-enrolled when a lead's tags include "Nurture" · Auto-stops on Booked or Closed · Resend email required
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {key === "all" ? "All" : key.charAt(0).toUpperCase() + key.slice(1)} ({count})
          </button>
        ))}
      </div>

      {/* Campaign list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading nurture campaigns…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-semibold">No {statusFilter !== "all" ? statusFilter : ""} nurture campaigns yet</p>
          <p className="text-sm mt-1">Tag a lead "Nurture" to auto-enroll, or click <strong>Enroll Lead</strong> above.</p>
          <button
            onClick={() => setShowEnroll(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Enroll a Lead
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              onRequestStop={setConfirmStopId}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {confirmStopId && (
        <DeleteConfirmModal
          title="Stop Nurture Campaign?"
          description="This will permanently stop this lead's nurture sequence. It cannot be restarted from the same position."
          confirmLabel="Stop Campaign"
          onConfirm={() => handleStop(confirmStopId)}
          onCancel={() => setConfirmStopId(null)}
        />
      )}

      {showEnroll && (
        <EnrollModal
          onClose={() => setShowEnroll(false)}
          onEnrolled={loadCampaigns}
        />
      )}
    </div>
  );
}