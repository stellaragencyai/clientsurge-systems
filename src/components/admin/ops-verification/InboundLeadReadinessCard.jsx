import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Loader2, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const REMEDIATION_CHECKLIST = [
  "Backfill WebsiteLead tenant scope (client_id + client_project_id)",
  "Backfill WebsiteLead dedupe keys (dedup_key)",
  "Link WebsiteLead records to canonical Leads records (crm_lead_id)",
  "Add idempotency key tracking before live provider sends",
  "Resolve pending dead letter log entries",
  "Repair failed/stale automation jobs",
  "Generate LeadNextBestAction records for active leads",
  "Run live-safe provider proof only after simulation passes",
];

function MetricRow({ label, value, warning, danger }) {
  const color = danger ? "text-red-700" : warning ? "text-yellow-700" : "text-gray-700";
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}

function ChecklistItem({ text, done }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      {done ? (
        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      )}
      <span className={`text-xs ${done ? "text-gray-400 line-through" : "text-gray-700"}`}>{text}</span>
    </div>
  );
}

export default function InboundLeadReadinessCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchReadiness = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        rateLimitConfigs,
        idempotencyKeys,
        leadNextBestActions,
        deadLetterPending,
        automationJobsFailed,
        automationJobsQueued,
      ] = await Promise.all([
        base44.entities.RateLimitConfig.list("", 200).catch(() => []),
        base44.entities.IdempotencyKey.list("", 200).catch(() => []),
        base44.entities.LeadNextBestAction.list("", 200).catch(() => []),
        base44.entities.DeadLetterLog.filter({ status: "pending_review" }, "-created_date", 200).catch(() => []),
        base44.entities.AutomationJob.filter({ status: "failed" }, "-created_date", 200).catch(() => []),
        base44.entities.AutomationJob.filter({ status: "queued" }, "-created_date", 200).catch(() => []),
      ]);

      const websiteLeads = await base44.entities.WebsiteLead.list("-created_date", 500).catch(() => []);
      const wl = websiteLeads || [];
      const missingClientId = wl.filter((l) => !l.client_id || l.client_id === "").length;
      const missingProjectId = wl.filter((l) => !l.client_project_id || l.client_project_id === "").length;
      const missingDedupKey = wl.filter((l) => !l.dedup_key || l.dedup_key === "").length;
      const missingCrmLeadId = wl.filter((l) => !l.crm_lead_id || l.crm_lead_id === "").length;

      const rateLimitCount = rateLimitConfigs?.length || 0;
      const idempotencyCount = idempotencyKeys?.length || 0;
      const nbaCount = leadNextBestActions?.length || 0;
      const deadLetterCount = deadLetterPending?.length || 0;
      const failedJobs = automationJobsFailed?.length || 0;
      const queuedJobs = automationJobsQueued?.length || 0;

      const criticalBlockers = [];
      if (rateLimitCount === 0) criticalBlockers.push("No RateLimitConfig records");
      if (idempotencyCount === 0) criticalBlockers.push("No IdempotencyKey records");
      if (deadLetterCount > 0) criticalBlockers.push(`${deadLetterCount} pending dead letter(s)`);
      if (failedJobs > 0) criticalBlockers.push(`${failedJobs} failed automation job(s)`);
      if (missingClientId > 0) criticalBlockers.push(`${missingClientId} WebsiteLead(s) missing client_id`);
      if (missingProjectId > 0) criticalBlockers.push(`${missingProjectId} WebsiteLead(s) missing client_project_id`);

      const hasGuardrails = rateLimitCount > 0;
      const hasProofGaps = idempotencyCount === 0 || nbaCount === 0 || missingDedupKey > 0 || missingCrmLeadId > 0;

      let status = "READY_FOR_LIVE_PROOF";
      let statusColor = "green";
      if (criticalBlockers.length > 0) {
        status = "BLOCKED";
        statusColor = "red";
      } else if (hasProofGaps) {
        status = "PARTIAL";
        statusColor = "yellow";
      }

      setData({
        rateLimitCount,
        idempotencyCount,
        nbaCount,
        deadLetterCount,
        failedJobs,
        queuedJobs,
        missingClientId,
        missingProjectId,
        missingDedupKey,
        missingCrmLeadId,
        totalWebsiteLeads: wl.length,
        status,
        statusColor,
        criticalBlockers,
      });
    } catch (err) {
      setError(err.message || "Failed to load inbound lead readiness data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReadiness();
  }, [fetchReadiness]);

  const StatusIcon = data?.statusColor === "green" ? ShieldCheck : data?.statusColor === "yellow" ? AlertTriangle : ShieldAlert;
  const statusBg =
    data?.statusColor === "green"
      ? "bg-green-50 border-green-200 text-green-700"
      : data?.statusColor === "yellow"
      ? "bg-yellow-50 border-yellow-200 text-yellow-700"
      : "bg-red-50 border-red-200 text-red-700";

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full" style={{ background: "#00AEEF" }} />
          <div>
            <h3 className="text-sm font-bold text-gray-900">Inbound Lead Readiness</h3>
            <p className="text-[11px] text-gray-400">Guardrail configuration, data gaps, and proof prerequisites for safe live lead capture</p>
          </div>
        </div>
        <button
          onClick={fetchReadiness}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {loading ? "Checking…" : "Recheck"}
        </button>
      </div>

      {error && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-100">
          <p className="text-xs text-red-700 font-semibold">Error: {error}</p>
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : data ? (
        <div className="px-5 py-4">
          {/* Status Banner */}
          <div className={`rounded-lg border px-4 py-3 mb-4 flex items-center gap-3 ${statusBg}`}>
            <StatusIcon className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold uppercase tracking-wide">{data.status.replace(/_/g, " ")}</p>
              {data.criticalBlockers.length > 0 ? (
                <p className="text-xs mt-0.5 opacity-80">
                  {data.criticalBlockers.length} critical blocker(s): {data.criticalBlockers.join("; ")}
                </p>
              ) : (
                <p className="text-xs mt-0.5 opacity-80">No critical blockers detected. Run live-safe proof to advance.</p>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Guardrails</p>
              <MetricRow label="RateLimitConfig records" value={data.rateLimitCount} danger={data.rateLimitCount === 0} />
              <MetricRow label="IdempotencyKey records" value={data.idempotencyCount} danger={data.idempotencyCount === 0} />
              <MetricRow label="LeadNextBestAction records" value={data.nbaCount} warning={data.nbaCount === 0} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Queue Health</p>
              <MetricRow label="Pending dead letters" value={data.deadLetterCount} danger={data.deadLetterCount > 0} />
              <MetricRow label="Failed automation jobs" value={data.failedJobs} danger={data.failedJobs > 0} />
              <MetricRow label="Stale queued jobs" value={data.queuedJobs} warning={data.queuedJobs > 0} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">WebsiteLead Tenant Scope</p>
              <MetricRow label="Total WebsiteLead records" value={data.totalWebsiteLeads} />
              <MetricRow label="Missing client_id" value={data.missingClientId} danger={data.missingClientId > 0} />
              <MetricRow label="Missing client_project_id" value={data.missingProjectId} danger={data.missingProjectId > 0} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">WebsiteLead Data Quality</p>
              <MetricRow label="Missing dedup_key" value={data.missingDedupKey} warning={data.missingDedupKey > 0} />
              <MetricRow label="Missing crm_lead_id" value={data.missingCrmLeadId} warning={data.missingCrmLeadId > 0} />
            </div>
          </div>

          {/* Remediation Checklist */}
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Remediation Checklist</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <ChecklistItem text={REMEDIATION_CHECKLIST[0]} done={data.missingClientId === 0 && data.missingProjectId === 0} />
              <ChecklistItem text={REMEDIATION_CHECKLIST[1]} done={data.missingDedupKey === 0} />
              <ChecklistItem text={REMEDIATION_CHECKLIST[2]} done={data.missingCrmLeadId === 0} />
              <ChecklistItem text={REMEDIATION_CHECKLIST[3]} done={data.idempotencyCount > 0} />
              <ChecklistItem text={REMEDIATION_CHECKLIST[4]} done={data.deadLetterCount === 0} />
              <ChecklistItem text={REMEDIATION_CHECKLIST[5]} done={data.failedJobs === 0} />
              <ChecklistItem text={REMEDIATION_CHECKLIST[6]} done={data.nbaCount > 0} />
              <ChecklistItem text={REMEDIATION_CHECKLIST[7]} done={data.status === "READY_FOR_LIVE_PROOF"} />
            </div>
          </div>

          <p className="text-[10px] text-gray-400 mt-3">
            Safe patch v1 — read-only. No SMS, email, or provider calls triggered. RateLimitConfig seeded by system_safe_patch.
          </p>
        </div>
      ) : null}
    </div>
  );
}