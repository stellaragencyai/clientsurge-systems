/**
 * Priority 1: Inbound Follow-Up Readiness Panel
 *
 * Admin-only, read-only dashboard showing:
 * - WebsiteLead audit (production vs internal/test, missing fields)
 * - AutomationJob / DeadLetterLog / EventQueue health
 * - Infrastructure counts (RateLimitConfig, IdempotencyKey, LeadNextBestAction)
 * - Latest simulation proof result
 * - Overall readiness score and label
 * - Remediation recommendations
 * - "Run Inbound Follow-Up Simulation" button (non-sending)
 */
import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, RefreshCw, Loader2, PlayCircle, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { StatusPill, fmtDate, safeJsonParse } from "./helpers";

const READINESS_LABELS = {
  BLOCKED: { color: "red", label: "BLOCKED" },
  PARTIAL: { color: "yellow", label: "PARTIAL" },
  READY_FOR_LIVE_PROOF: { color: "blue", label: "READY FOR LIVE PROOF" },
  PROOF_PASSED: { color: "green", label: "PROOF PASSED" },
};

function MetricCard({ title, value, subtitle, warning }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: "#fff", borderColor: warning ? "rgba(245,158,11,0.3)" : "#E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${warning ? "text-amber-600" : "text-gray-900"}`}>{value}</p>
      {subtitle && <p className="text-[10px] text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function HygieneRow({ label, count, examples }) {
  if (count === 0) return null;
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 w-56 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs font-bold text-amber-600">{count}</span>
      {examples && examples.length > 0 && (
        <span className="text-[10px] text-gray-400 ml-2">
          e.g. {examples.slice(0, 2).map(e => e.id?.slice(0, 8) || "?").join(", ")}
        </span>
      )}
    </div>
  );
}

function CaseRow({ caseItem }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
      {caseItem.passed
        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
        : <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />}
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-700">{caseItem.name}</p>
        <p className="text-[10px] text-gray-400">{caseItem.detail}</p>
      </div>
    </div>
  );
}

export default function InboundFollowupReadinessPanel() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [simResult, setSimResult] = useState(null);

  const fetchReadiness = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke("getInboundFollowupReadiness", {});
      setData(response.data);
    } catch (err) {
      setError(err.message || "Failed to load readiness data");
    } finally {
      setLoading(false);
    }
  }, []);

  const runSimulation = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const response = await base44.functions.invoke("runInboundFollowupSimulation", {});
      setSimResult(response.data);
      // Refresh readiness data after simulation
      await fetchReadiness();
    } catch (err) {
      setError(err.message || "Simulation failed");
    } finally {
      setRunning(false);
    }
  }, [fetchReadiness]);

  // Initial load
  useState(() => { fetchReadiness(); });

  const readinessMeta = data ? READINESS_LABELS[data.readiness_label] || READINESS_LABELS.BLOCKED : null;
  const wl = data?.website_leads;
  const infra = data?.infrastructure;
  const eq = data?.event_queue;
  const jobs = data?.automation_jobs;
  const latestProof = data?.latest_proof_result;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
          <h3 className="text-sm font-bold text-gray-900">Priority 1 — Inbound Follow-Up Readiness</h3>
          <span className="text-[11px] text-gray-400">(non-sending audit — no external calls)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReadiness}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Refresh
          </button>
          <button
            onClick={runSimulation}
            disabled={running}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #0088CC, #00AEEF)" }}
          >
            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
            {running ? "Running Simulation…" : "Run Inbound Follow-Up Simulation"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-4">
          <p className="text-xs font-bold text-red-700">Error</p>
          <p className="text-[11px] text-red-600 mt-1">{error}</p>
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : data ? (
        <div className="space-y-5">
          {/* Readiness summary banner */}
          <div className="rounded-xl border p-4 flex items-center justify-between gap-4" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
            <div className="flex items-center gap-3">
              {readinessMeta.color === "green" && <ShieldCheck className="w-8 h-8 text-green-600" />}
              {readinessMeta.color === "red" && <AlertTriangle className="w-8 h-8 text-red-600" />}
              {readinessMeta.color === "yellow" && <AlertTriangle className="w-8 h-8 text-amber-600" />}
              {readinessMeta.color === "blue" && <ShieldCheck className="w-8 h-8 text-blue-600" />}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Overall Readiness</p>
                <p className="text-lg font-bold text-gray-900">{data.readiness_score}/100</p>
              </div>
            </div>
            <StatusPill color={readinessMeta.color} label={readinessMeta.label} />
          </div>

          {/* Simulation result banner */}
          {simResult && (
            <div className="rounded-xl border p-4" style={{ background: simResult.overall_status === "pass" ? "rgba(34,197,94,0.05)" : simResult.overall_status === "partial" ? "rgba(245,158,11,0.05)" : "rgba(239,68,68,0.05)", borderColor: simResult.overall_status === "pass" ? "rgba(34,197,94,0.2)" : simResult.overall_status === "partial" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)" }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-bold text-gray-900">Simulation Result</p>
                <StatusPill color={simResult.overall_status === "pass" ? "green" : simResult.overall_status === "partial" ? "yellow" : "red"} label={simResult.overall_status?.toUpperCase()} />
              </div>
              <p className="text-[11px] text-gray-500 mb-2">
                {simResult.cases_passed}/{simResult.total_cases} cases passed · Mode: simulation_only · No external calls made
              </p>
              {simResult.blockers?.length > 0 && (
                <div className="mt-2">
                  <p className="text-[11px] font-bold text-red-700 mb-1">Blockers:</p>
                  <ul className="text-[11px] text-red-600 list-disc pl-4 space-y-0.5">
                    {simResult.blockers.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* WebsiteLead audit metrics */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">WebsiteLead Audit</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <MetricCard title="Total Leads" value={wl?.total || 0} />
              <MetricCard title="Production" value={wl?.production || 0} subtitle="classified non-test" />
              <MetricCard title="Internal/Test" value={wl?.internal_test || 0} subtitle="QA/smoke/owner" warning={(wl?.internal_test || 0) > 0} />
              <MetricCard title="Waiting Response" value={wl?.waiting_initial_response || 0} warning={(wl?.waiting_initial_response || 0) > 0} />
              <MetricCard title="Missing client_id" value={wl?.missing_client_id || 0} warning={(wl?.missing_client_id || 0) > 0} />
              <MetricCard title="Missing project_id" value={wl?.missing_client_project_id || 0} warning={(wl?.missing_client_project_id || 0) > 0} />
              <MetricCard title="Missing dedup_key" value={wl?.missing_dedup_key || 0} warning={(wl?.missing_dedup_key || 0) > 0} />
              <MetricCard title="Missing crm_lead_id" value={wl?.missing_crm_lead_id || 0} warning={(wl?.missing_crm_lead_id || 0) > 0} />
              <MetricCard title="Missing UTM" value={wl?.missing_utm || 0} warning={(wl?.missing_utm || 0) > 0} />
              <MetricCard title="Missing consent" value={wl?.missing_consent || 0} warning={(wl?.missing_consent || 0) > 0} />
              <MetricCard title="No email+phone" value={wl?.no_email_no_phone || 0} warning={(wl?.no_email_no_phone || 0) > 0} />
              <MetricCard title="Cadence paused" value={wl?.cadence_paused || 0} warning={(wl?.cadence_paused || 0) > 0} />
              <MetricCard title="Archived" value={wl?.archived || 0} />
              <MetricCard title="Automation disabled" value={wl?.automation_disabled || 0} warning={(wl?.automation_disabled || 0) > 0} />
            </div>
          </div>

          {/* Infrastructure health */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">Infrastructure & Job Health</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <MetricCard title="Failed Jobs" value={jobs?.failed || 0} warning={(jobs?.failed || 0) > 0} />
              <MetricCard title="Stale Jobs" value={jobs?.stale || 0} warning={(jobs?.stale || 0) > 0} />
              <MetricCard title="DeadLetter Pending" value={data?.dead_letters?.pending_review || 0} warning={(data?.dead_letters?.pending_review || 0) > 0} />
              <MetricCard title="EQ Failed" value={eq?.failed || 0} warning={(eq?.failed || 0) > 0} />
              <MetricCard title="EQ Dead Letter" value={eq?.dead_letter || 0} warning={(eq?.dead_letter || 0) > 0} />
              <MetricCard title="EQ Stuck" value={eq?.stuck || 0} warning={(eq?.stuck || 0) > 0} />
              <MetricCard title="RateLimitConfig" value={infra?.rate_limit_configs || 0} warning={(infra?.rate_limit_configs || 0) === 0} />
              <MetricCard title="IdempotencyKeys" value={infra?.idempotency_keys || 0} warning={(infra?.idempotency_keys || 0) === 0} />
              <MetricCard title="LeadNextBestAction" value={infra?.lead_next_best_actions || 0} warning={(infra?.lead_next_best_actions || 0) === 0} />
            </div>
          </div>

          {/* Latest proof result */}
          {latestProof && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">Latest Simulation Proof</p>
              <div className="rounded-xl border p-4" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-bold text-gray-900">
                    {latestProof.overall_status?.toUpperCase()} — {latestProof.cases_passed}/{latestProof.total_cases} cases
                  </p>
                  <span className="text-[10px] text-gray-400">{fmtDate(latestProof.run_at)}</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">
                  Safe to enable live sends: <strong>{latestProof.safe_to_enable_live_sends ? "Yes" : "No"}</strong>
                </p>
                {latestProof.blockers?.length > 0 && (
                  <ul className="text-[11px] text-red-600 list-disc pl-4 space-y-0.5">
                    {latestProof.blockers.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Simulation cases */}
          {simResult?.cases && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">Simulation Cases</p>
              <div className="rounded-xl border p-3" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
                {simResult.cases.map((c, i) => <CaseRow key={i} caseItem={c} />)}
              </div>
            </div>
          )}

          {/* Remediation recommendations */}
          {data?.remediation?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">Recommended Remediation</p>
              <div className="rounded-xl border p-3" style={{ background: "#fff", borderColor: "rgba(0,174,239,0.2)" }}>
                <ul className="text-[11px] text-gray-700 space-y-1.5">
                  {data.remediation.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold flex-shrink-0">{i + 1}.</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Safety note */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-[10px] text-gray-400">
              This panel is read-only and non-sending. The simulation harness does NOT call Twilio, Resend, Gmail, or any external provider.
              No existing WebsiteLead, Leads, or AutomationJob records are modified. Only an InboundFollowupProofResult record is created per simulation run.
            </p>
          </div>
        </div>
      ) : !error && (
        <p className="text-xs text-gray-400">No data available.</p>
      )}
    </div>
  );
}