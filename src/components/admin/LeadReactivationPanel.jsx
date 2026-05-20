/**
 * LeadReactivationPanel
 * Admin UI to select dormant leads, create LeadReactivation records,
 * trigger reactivateLeadOutreach, and view AutomationJob status.
 */

import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  AlertCircle, CheckCircle2, Loader2, RefreshCw,
  Send, Users, Zap, ChevronDown, ChevronUp,
} from "lucide-react";

const STATUS_COLORS = {
  queued:     "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  completed:  "bg-green-100 text-green-700",
  failed:     "bg-red-100 text-red-700",
};

const SEGMENT_FILTERS = [
  { key: "all_dormant",   label: "All Dormant (no activity 14+ days)" },
  { key: "closed",        label: "Closed leads" },
  { key: "low_priority",  label: "Low priority" },
];

// ─── Job Status Row ────────────────────────────────────────────
function JobRow({ job }) {
  const colorClass = STATUS_COLORS[job.status] || "bg-gray-100 text-gray-600";
  const meta = (() => { try { return JSON.parse(job.result_metadata || "{}"); } catch { return {}; } })();
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium text-foreground truncate">{job.lead_id}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {job.job_type === "reactivation_sms" ? "📱 SMS" : "✉️ Email"} ·{" "}
          attempt {meta.attempt || "—"} ·{" "}
          {job.processed_at
            ? `processed ${new Date(job.processed_at).toLocaleString()}`
            : `scheduled ${new Date(job.scheduled_for || job.created_date).toLocaleString()}`}
        </p>
        {job.last_error && (
          <p className="text-xs text-red-600 mt-0.5 truncate">{job.last_error}</p>
        )}
      </div>
      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colorClass}`}>
        {job.status}
      </span>
    </div>
  );
}

// ─── Lead Selector Row ─────────────────────────────────────────
function LeadRow({ lead, selected, onToggle }) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(lead.id)}
        className="w-4 h-4 accent-primary"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{lead.full_name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {lead.business_name} · {lead.status} · {lead.phone || "no phone"} · {lead.email || "no email"}
        </p>
      </div>
      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
        lead.activation_priority === "Hot" ? "bg-red-100 text-red-700" :
        lead.activation_priority === "High" ? "bg-orange-100 text-orange-700" :
        "bg-gray-100 text-gray-600"
      }`}>
        {lead.activation_priority || "Low"}
      </span>
    </label>
  );
}

// ─── Main Panel ────────────────────────────────────────────────
export default function LeadReactivationPanel() {
  const [leads, setLeads] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [segment, setSegment] = useState("all_dormant");
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [showJobs, setShowJobs] = useState(true);

  useEffect(() => { loadLeads(); loadJobs(); }, [segment]);

  const loadLeads = async () => {
    setLoadingLeads(true);
    setSelected(new Set());
    setError("");
    try {
      let query = {};
      if (segment === "closed") query.status = "Closed";
      else if (segment === "low_priority") query.activation_priority = "Low";
      // all_dormant: fetch all non-booked leads, filter by last_contacted_at client-side
      const data = await base44.entities.Leads.list("-updated_date", 300);
      let filtered = data || [];
      if (segment === "all_dormant") {
        const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
        filtered = filtered.filter(l => {
          if (["Booked", "Closed"].includes(l.status)) return false;
          const last = l.last_contacted_at ? new Date(l.last_contacted_at).getTime() : 0;
          return last < cutoff;
        });
      } else if (segment === "closed") {
        filtered = filtered.filter(l => l.status === "Closed");
      } else if (segment === "low_priority") {
        filtered = filtered.filter(l => l.activation_priority === "Low" && !["Booked"].includes(l.status));
      }
      setLeads(filtered);
    } catch {
      setError("Failed to load leads.");
    } finally {
      setLoadingLeads(false);
    }
  };

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const data = await base44.entities.AutomationJob.filter(
        { job_type: { $in: ["reactivation_sms", "reactivation_email"] } },
        "-created_date",
        100
      );
      setJobs(data || []);
    } catch {
      // non-fatal
    } finally {
      setLoadingJobs(false);
    }
  };

  const toggleLead = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === leads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map(l => l.id)));
    }
  };

  const handleTrigger = async () => {
    if (!selected.size) return;
    setTriggering(true);
    setResults(null);
    setError("");

    const summary = { triggered: 0, skipped: 0, errors: [] };

    for (const leadId of selected) {
      try {
        // Create a LeadReactivation record if one doesn't exist
        const existing = await base44.entities.LeadReactivation
          .filter({ lead_id: leadId, status: { $nin: ["unrecoverable"] } }, "-created_date", 1)
          .catch(() => []);

        let reactivationId;
        if (existing?.length > 0) {
          reactivationId = existing[0].id;
        } else {
          const lead = leads.find(l => l.id === leadId);
          const rec = await base44.entities.LeadReactivation.create({
            lead_id: leadId,
            lead_email: lead?.email || "",
            lead_phone: lead?.phone || "",
            status: "pending",
            attempts: 0,
            days_dormant: lead?.last_contacted_at
              ? Math.floor((Date.now() - new Date(lead.last_contacted_at).getTime()) / 86400000)
              : 30,
          });
          reactivationId = rec.id;
        }

        await base44.functions.invoke("reactivateLeadOutreach", { reactivation_id: reactivationId });
        summary.triggered++;
      } catch (err) {
        summary.errors.push(`${leadId}: ${err?.response?.data?.error || err.message || "failed"}`);
        summary.skipped++;
      }
    }

    setResults(summary);
    setTriggering(false);
    setSelected(new Set());
    await loadJobs();
  };

  const jobCounts = {
    queued:    jobs.filter(j => j.status === "queued").length,
    completed: jobs.filter(j => j.status === "completed").length,
    failed:    jobs.filter(j => j.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Lead Reactivation</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select dormant leads, trigger outreach, and monitor delivery jobs. Jobs are sent by <strong>processAutomationJobs</strong> (runs every 5 min).
        </p>
      </div>

      {/* Segment Selector */}
      <div className="flex flex-wrap gap-2">
        {SEGMENT_FILTERS.map(s => (
          <button
            key={s.key}
            onClick={() => setSegment(s.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              segment === s.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={loadLeads}
          disabled={loadingLeads}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loadingLeads ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Result Banner */}
      {results && (
        <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
          results.errors.length ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800"
        }`}>
          {results.errors.length ? <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <div>
            <p className="font-semibold">
              {results.triggered} outreach{results.triggered !== 1 ? "es" : ""} queued
              {results.skipped > 0 ? `, ${results.skipped} skipped` : ""}
            </p>
            {results.errors.length > 0 && (
              <ul className="mt-1 text-xs space-y-0.5 list-disc list-inside">
                {results.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
            <p className="text-xs mt-1 opacity-75">Jobs will be processed within 5 minutes by processAutomationJobs.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Lead Selector */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {loadingLeads ? "Loading…" : `${leads.length} leads in segment`}
            </span>
            {selected.size > 0 && (
              <span className="rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold">
                {selected.size} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {leads.length > 0 && (
              <button
                onClick={toggleAll}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {selected.size === leads.length ? "Deselect all" : "Select all"}
              </button>
            )}
            <button
              onClick={handleTrigger}
              disabled={!selected.size || triggering}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {triggering ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              {triggering ? "Queuing…" : `Trigger Outreach (${selected.size})`}
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border">
          {loadingLeads ? (
            <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading leads…
            </div>
          ) : leads.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No leads in this segment.
            </div>
          ) : (
            leads.map(lead => (
              <LeadRow
                key={lead.id}
                lead={lead}
                selected={selected.has(lead.id)}
                onToggle={toggleLead}
              />
            ))
          )}
        </div>
      </div>

      {/* Job Status */}
      <div className="rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setShowJobs(v => !v)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-muted/30 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            Automation Job Queue
            <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold">{jobCounts.queued} queued</span>
            <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[10px] font-bold">{jobCounts.completed} done</span>
            {jobCounts.failed > 0 && (
              <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">{jobCounts.failed} failed</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); loadJobs(); }}
              disabled={loadingJobs}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loadingJobs ? "animate-spin" : ""}`} />
            </button>
            {showJobs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showJobs && (
          <div className="max-h-72 overflow-y-auto divide-y divide-border p-3 space-y-2 bg-white">
            {loadingJobs ? (
              <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading jobs…
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No reactivation jobs yet.</p>
            ) : (
              jobs.map(job => <JobRow key={job.id} job={job} />)
            )}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm space-y-1">
        <div className="flex items-center gap-2 font-semibold text-foreground mb-2">
          <Send className="w-4 h-4 text-primary" />
          How reactivation works
        </div>
        <ul className="list-disc list-inside text-xs text-foreground/75 space-y-1">
          <li>Select leads from the segment above and click <strong>Trigger Outreach</strong></li>
          <li>A <strong>LeadReactivation</strong> record is created (or reused) for each lead</li>
          <li><strong>Attempt 1</strong>: 20% off offer via SMS + email</li>
          <li><strong>Attempt 2</strong>: 25% off final offer — lead is archived after this</li>
          <li>Jobs are sent by <strong>processAutomationJobs</strong> which runs every 5 minutes</li>
          <li>Check the Job Queue below to monitor delivery status</li>
        </ul>
      </div>
    </div>
  );
}