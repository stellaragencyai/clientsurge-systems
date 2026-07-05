/**
 * JobFailureDeadLetterRecoveryCard — Admin card for non-sending failure recovery.
 * Shows counts of failed/stale AutomationJob, EventQueue, and DeadLetterLog records,
 * root cause breakdowns, and simulation + safe annotation actions.
 *
 * Does NOT send messages. Does NOT call external providers.
 */
import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, FlaskConical, ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight, Activity, Inbox, Ban } from "lucide-react";

const ROOT_CAUSE_LABELS = {
  lead_not_found: "Lead Not Found",
  stale_processing: "Stale Processing",
  provider_error: "Provider Error",
  missing_tenant_scope: "Missing Tenant Scope",
  internal_test_suppressed: "Internal/Test Suppressed",
  duplicate_suppressed: "Duplicate Suppressed",
  missing_consent: "Missing Consent",
  invalid_phone_or_email: "Invalid Phone/Email",
  unknown_error: "Unknown Error",
};

const ACTION_LABELS = {
  safe_to_retry_later: "Safe to Retry Later",
  resolve_as_internal_test: "Resolve as Internal Test",
  needs_lead_id_repair: "Needs Lead ID Repair",
  needs_tenant_scope_repair: "Needs Tenant Scope Repair",
  needs_provider_config_review: "Needs Provider Config Review",
  mark_unrecoverable: "Mark Unrecoverable",
  manual_review_required: "Manual Review Required",
};

export default function JobFailureDeadLetterRecoveryCard() {
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [applyResult, setApplyResult] = useState(null);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allJobs, allEvents, pendingDeadLetters, resolvedDeadLetters, latestResult] = await Promise.all([
        base44.asServiceRole.entities.AutomationJob.list("", 500).catch(() => []),
        base44.asServiceRole.entities.EventQueue.list("", 500).catch(() => []),
        base44.asServiceRole.entities.DeadLetterLog.filter({ status: "pending_review" }, "-created_date", 500).catch(() => []),
        base44.asServiceRole.entities.DeadLetterLog.filter({ status: "resolved" }, "-created_date", 500).catch(() => []),
        base44.asServiceRole.entities.FailureRecoveryResult.list("-run_at", 3).catch(() => []),
      ]);

      const jobs = allJobs || [];
      const events = allEvents || [];
      const pdl = pendingDeadLetters || [];
      const rdl = resolvedDeadLetters || [];

      const now = Date.now();
      const STALE_MS = 10 * 60 * 1000;

      const staleProcessingJobs = jobs.filter((j) => {
        if (j.status !== "processing") return false;
        const ts = j.processed_at || j.created_date;
        if (!ts) return true;
        return now - new Date(ts).getTime() > STALE_MS;
      });
      const staleQueuedJobs = jobs.filter((j) => {
        if (j.status !== "queued") return false;
        if (j.scheduled_for) return now - new Date(j.scheduled_for).getTime() > STALE_MS;
        if (j.created_date) return now - new Date(j.created_date).getTime() > STALE_MS;
        return false;
      });
      const stuckEvents = events.filter((e) => {
        if (e.status !== "processing") return false;
        const ts = e.last_retry_at || e.created_date;
        if (!ts) return true;
        return now - new Date(ts).getTime() > STALE_MS;
      });

      setCounts({
        total_jobs: jobs.length,
        failed_jobs: jobs.filter((j) => j.status === "failed").length,
        stale_jobs: staleProcessingJobs.length + staleQueuedJobs.length,
        stale_processing: staleProcessingJobs.length,
        stale_queued: staleQueuedJobs.length,
        processing_jobs: jobs.filter((j) => j.status === "processing").length,
        queued_jobs: jobs.filter((j) => j.status === "queued").length,
        completed_jobs: jobs.filter((j) => j.status === "completed").length,
        total_events: events.length,
        failed_events: events.filter((e) => e.status === "failed").length,
        dead_letter_events: events.filter((e) => e.status === "dead_letter").length,
        stuck_processing_events: stuckEvents.length,
        pending_dead_letters: pdl.length,
        resolved_dead_letters: rdl.length,
        latest_result: (latestResult || [])[0] || null,
      });
    } catch (err) {
      setError(err.message || "Failed to load failure data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const handleSimulate = useCallback(async () => {
    setSimulating(true);
    setError(null);
    setSimResult(null);
    try {
      const res = await base44.functions.invoke("simulateFailureRecoveryPlan", {});
      setSimResult(res.data);
      await fetchCounts();
    } catch (err) {
      setError(err.message || "Simulation failed");
    } finally {
      setSimulating(false);
    }
  }, [fetchCounts]);

  const handleApply = useCallback(async () => {
    setApplying(true);
    setError(null);
    setApplyResult(null);
    setShowApplyConfirm(false);
    try {
      const res = await base44.functions.invoke("applyFailureRecoverySafe", {});
      setApplyResult(res.data);
      await fetchCounts();
    } catch (err) {
      setError(err.message || "Safe apply failed");
    } finally {
      setApplying(false);
    }
  }, [fetchCounts]);

  const hasFailures = counts && (counts.failed_jobs > 0 || counts.stale_jobs > 0 || counts.failed_events > 0 || counts.dead_letter_events > 0 || counts.stuck_processing_events > 0 || counts.pending_dead_letters > 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.10)" }}>
            <Activity className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Job Failure + Dead Letter Recovery</p>
            <p className="text-[11px] text-gray-400">Non-sending annotation & resolution — no provider calls, no records deleted</p>
          </div>
        </div>
        <button onClick={fetchCounts} disabled={loading} className="p-1 rounded hover:bg-gray-50 disabled:opacity-50" title="Refresh">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" /> : <RefreshCw className="w-3.5 h-3.5 text-gray-500" />}
        </button>
      </div>

      <div className="px-4 py-3 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* AutomationJob counts */}
        {counts && (
          <>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">AutomationJob</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <CountTile label="Total" value={counts.total_jobs} />
                <CountTile label="Failed" value={counts.failed_jobs} color={counts.failed_jobs > 0 ? "red" : "green"} />
                <CountTile label="Stale" value={counts.stale_jobs} color={counts.stale_jobs > 0 ? "amber" : "green"} />
                <CountTile label="Processing" value={counts.processing_jobs} color={counts.processing_jobs > 0 ? "blue" : "green"} />
                <CountTile label="Queued" value={counts.queued_jobs} color="gray" />
                <CountTile label="Completed" value={counts.completed_jobs} color="green" />
                <CountTile label="Stale Processing" value={counts.stale_processing} color={counts.stale_processing > 0 ? "amber" : "green"} />
                <CountTile label="Stale Queued" value={counts.stale_queued} color={counts.stale_queued > 0 ? "amber" : "green"} />
              </div>
            </div>

            {/* EventQueue counts */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">EventQueue</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <CountTile label="Total" value={counts.total_events} />
                <CountTile label="Failed" value={counts.failed_events} color={counts.failed_events > 0 ? "red" : "green"} />
                <CountTile label="Dead Letter" value={counts.dead_letter_events} color={counts.dead_letter_events > 0 ? "red" : "green"} />
                <CountTile label="Stuck Processing" value={counts.stuck_processing_events} color={counts.stuck_processing_events > 0 ? "amber" : "green"} />
              </div>
            </div>

            {/* DeadLetterLog counts */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">DeadLetterLog</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <CountTile label="Pending Review" value={counts.pending_dead_letters} color={counts.pending_dead_letters > 0 ? "red" : "green"} />
                <CountTile label="Resolved" value={counts.resolved_dead_letters} color="green" />
                <CountTile label="Unresolved client_id" value={simResult?.counts?.unresolved_client_id ?? "—"} color="amber" />
                <CountTile label="Unresolved lead_id" value={simResult?.counts?.unresolved_lead_id ?? "—"} color="amber" />
              </div>
            </div>
          </>
        )}

        {/* Simulation result */}
        {simResult && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-xs font-bold text-blue-900">Simulation Result (read-only, no records modified)</p>
            </div>

            {/* Root causes */}
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Root Causes</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 text-[11px] mb-2">
              {Object.entries(simResult.root_cause_counts || {}).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-500">{ROOT_CAUSE_LABELS[key] || key}</span>
                  <span className={`font-bold ${val > 0 ? "text-gray-900" : "text-gray-300"}`}>{val}</span>
                </div>
              ))}
            </div>

            {/* Recommended actions */}
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Recommended Actions</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 text-[11px] mb-2">
              {Object.entries(simResult.recommended_action_counts || {}).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-500">{ACTION_LABELS[key] || key}</span>
                  <span className={`font-bold ${val > 0 ? "text-gray-900" : "text-gray-300"}`}>{val}</span>
                </div>
              ))}
            </div>

            {simResult.blockers?.length > 0 && (
              <div className="mt-2 space-y-1">
                {simResult.blockers.map((b, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-700">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {b}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-gray-400">Next:</span>
              <p className="text-[11px] text-blue-900">{simResult.next_step}</p>
            </div>
          </div>
        )}

        {/* Apply result */}
        {applyResult && (
          <div className="rounded-lg border p-3" style={{ borderColor: applyResult.blockers?.length > 0 ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)", background: applyResult.blockers?.length > 0 ? "rgba(245,158,11,0.05)" : "rgba(34,197,94,0.05)" }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <p className="text-xs font-bold text-gray-900">Safe Apply Result — no messages sent, no records deleted, no lead status changed</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
              <SimStat label="Records Annotated" value={applyResult.counts?.records_annotated} />
              <SimStat label="Records Resolved" value={applyResult.counts?.records_resolved} />
              <SimStat label="Records Left Blocked" value={applyResult.counts?.records_left_blocked} />
            </div>
            {applyResult.warnings?.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {applyResult.warnings.slice(0, 3).map((w, i) => (
                  <p key={i} className="text-[11px] text-amber-600">⚠ {w}</p>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center gap-2">
              <ArrowRight className="w-3 h-3 text-blue-500" />
              <p className="text-[11px] text-gray-700">{applyResult.next_step}</p>
            </div>
          </div>
        )}

        {/* Latest result record */}
        {counts?.latest_result && (
          <div className="text-[11px] text-gray-400">
            Last run: <span className="font-semibold text-gray-600">{counts.latest_result.mode}</span> at{" "}
            {new Date(counts.latest_result.run_at).toLocaleString()} —{" "}
            {counts.latest_result.records_annotated} annotated, {counts.latest_result.records_resolved} resolved,{" "}
            {counts.latest_result.records_left_blocked} blocked
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-50">
          <button
            onClick={handleSimulate}
            disabled={simulating || loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
            {simulating ? "Simulating…" : "Run Simulation"}
          </button>

          {!showApplyConfirm ? (
            <button
              onClick={() => setShowApplyConfirm(true)}
              disabled={applying || loading || !simResult}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(90deg, #0079c1, #005691)", boxShadow: "0 2px 8px rgba(0,121,193,0.25)" }}
              title={!simResult ? "Run simulation first" : "Apply safe annotation/resolution"}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {applying ? "Applying…" : "Apply Safe Recovery"}
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-amber-700 font-bold">Confirm: annotate & resolve failures? No messages will be sent.</span>
              <button
                onClick={handleApply}
                disabled={applying}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(90deg, #059669, #047857)" }}
              >
                {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Confirm Apply
              </button>
              <button
                onClick={() => setShowApplyConfirm(false)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Status banner */}
        {hasFailures ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 flex items-start gap-2">
            <Ban className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-700">
              Blocked: failed/stale jobs and dead letters remain. Priority 1 status stays BLOCKED until resolved.
              Run simulation → apply safe recovery to annotate/resolve. No READY_FOR_LIVE_PROOF until LeadNextBestAction exists and simulation proof passes.
            </p>
          </div>
        ) : counts && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-green-700">
              No failed/stale jobs or dead letters detected. Next step: generate LeadNextBestAction records, then run full non-sending inbound follow-up simulation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CountTile({ label, value, color = "gray" }) {
  const colors = {
    gray: { bg: "bg-gray-50", border: "border-gray-100", val: "text-gray-900" },
    green: { bg: "bg-green-50", border: "border-green-200", val: "text-green-700" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", val: "text-amber-700" },
    red: { bg: "bg-red-50", border: "border-red-200", val: "text-red-700" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", val: "text-blue-700" },
  };
  const c = colors[color] || colors.gray;
  return (
    <div className={`rounded-lg ${c.bg} border ${c.border} px-2.5 py-2`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`text-lg font-bold ${c.val}`}>{value}</p>
    </div>
  );
}

function SimStat({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-bold ${value > 0 ? "text-gray-900" : "text-gray-300"}`}>{value ?? "—"}</span>
    </div>
  );
}