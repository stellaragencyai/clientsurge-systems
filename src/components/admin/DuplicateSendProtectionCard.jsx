import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, AlertTriangle, Loader2, RefreshCw, FlaskConical, CheckCircle2, XCircle, SkipForward } from "lucide-react";

function MetricRow({ label, value, warning, accent }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-600">{label}</span>
      <span
        className={`text-xs font-bold ${warning ? "text-red-600" : value > 0 ? "text-gray-900" : "text-gray-400"}`}
        style={accent ? { color: accent } : undefined}
      >
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export default function DuplicateSendProtectionCard() {
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [simResult, setSimResult] = useState(null);

  const fetchReadiness = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("getInboundLeadReadiness", {});
      setData(res.data);
    } catch (err) {
      setError(err.message || "Failed to load readiness data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReadiness(); }, [fetchReadiness]);

  const handleSimulate = useCallback(async () => {
    setSimulating(true);
    setError(null);
    setSimResult(null);
    try {
      const res = await base44.functions.invoke("simulateInboundIdempotencyCheck", {});
      setSimResult(res.data);
      await fetchReadiness();
    } catch (err) {
      setError(err.message || "Failed to run idempotency simulation");
    } finally {
      setSimulating(false);
    }
  }, [fetchReadiness]);

  const counts = data?.counts || {};
  const hasSimulation = counts.idempotency_simulation_proof;
  const guardrailReady = data?.guardrail_ready;
  const totalKeys = counts.idempotency_key || 0;

  // READY if simulation proof exists and no failed keys
  // BLOCKED if no keys at all
  // PARTIAL if keys exist but no simulation proof or failed keys present
  let protectionStatus;
  if (totalKeys === 0) {
    protectionStatus = "BLOCKED";
  } else if (hasSimulation && counts.idempotency_failed === 0) {
    protectionStatus = "READY";
  } else if (hasSimulation) {
    protectionStatus = "PARTIAL";
  } else {
    protectionStatus = "PARTIAL";
  }

  const STATUS_STYLES = {
    BLOCKED: { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B", dot: "#DC2626", label: "BLOCKED" },
    PARTIAL: { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E", dot: "#F59E0B", label: "PARTIAL" },
    READY: { bg: "#F0FDF4", border: "#86EFAC", text: "#166534", dot: "#22C55E", label: "READY" },
  };
  const style = STATUS_STYLES[protectionStatus];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
          <h3 className="text-sm font-bold text-gray-900">Duplicate Send Protection</h3>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.dot }} />
              {style.label}
            </span>
          )}
          <button
            onClick={fetchReadiness}
            disabled={loading}
            className="p-1 rounded hover:bg-gray-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : (
          <>
            {/* Idempotency key breakdown */}
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Idempotency Keys</p>
              <MetricRow label="Total Keys" value={totalKeys} warning={totalKeys === 0} />
              <MetricRow label="Completed" value={counts.idempotency_completed || 0} accent="#16A34A" />
              <MetricRow label="Processing" value={counts.idempotency_processing || 0} accent="#D97706" />
              <MetricRow label="Failed" value={counts.idempotency_failed || 0} warning={counts.idempotency_failed > 0} />
              <MetricRow label="Skipped / Suppressed" value={counts.idempotency_skipped || 0} accent="#6B7280" />
              <MetricRow label="Pending" value={counts.idempotency_pending || 0} />
            </div>

            {/* Simulation proof status */}
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Simulation Evidence</p>
              <div className="flex items-center gap-2 py-1.5">
                {hasSimulation ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-gray-700">
                  {hasSimulation
                    ? `${counts.idempotency_simulation_keys || 0} simulation key(s) found`
                    : "No simulation proof — run simulation below"}
                </span>
              </div>
              {counts.idempotency_latest_timestamp && (
                <p className="text-[10px] text-gray-400 ml-6">
                  Latest: {new Date(counts.idempotency_latest_timestamp).toLocaleString()}
                </p>
              )}
            </div>

            {/* Guardrail status */}
            <div className="mb-3 rounded-lg border p-2.5" style={{
              background: guardrailReady ? "#F0FDF4" : "#FEF2F2",
              borderColor: guardrailReady ? "#86EFAC" : "#FCA5A5",
            }}>
              <div className="flex items-center gap-1.5">
                {guardrailReady ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                )}
                <p className="text-[11px] font-bold" style={{ color: guardrailReady ? "#166534" : "#991B1B" }}>
                  Guardrail: {guardrailReady ? "Rate Limit + Idempotency Active" : "Guardrails Incomplete"}
                </p>
              </div>
            </div>

            {/* Simulation action button */}
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="mb-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold transition-colors disabled:opacity-50"
              style={{
                background: hasSimulation ? "#F0FDF4" : "#EFF6FF",
                borderColor: hasSimulation ? "#86EFAC" : "#BFDBFE",
                color: hasSimulation ? "#166534" : "#1E40AF",
              }}
            >
              {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
              {simulating ? "Running Simulation…" : hasSimulation ? "Re-run Idempotency Simulation" : "Run Idempotency Simulation"}
            </button>

            {/* Simulation results */}
            {simResult && (
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-[11px] font-bold text-blue-700 mb-2">Simulation Proof Results</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-gray-700">{simResult.proof_summary?.first_execution_allowed || 0} first-exec allowed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <SkipForward className="w-3 h-3 text-blue-600" />
                    <span className="text-gray-700">{simResult.proof_summary?.duplicate_execution_suppressed || 0} duplicates suppressed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span className="text-gray-700">{simResult.proof_summary?.failed_key_marked_for_review || 0} failed → review</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <XCircle className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-700">{simResult.proof_summary?.internal_lead_remained_skipped || 0} internal skipped</span>
                  </div>
                </div>
                <p className="text-[10px] text-blue-600 mt-2">
                  No provider calls. No messages sent. Simulation-only records created.
                </p>
              </div>
            )}

            {/* Remediation guidance */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Remediation Path</p>
              <p className="text-[11px] text-gray-600 mb-1.5">
                {data?.remediation_next_step || "Run idempotency simulation to prove duplicate suppression"}
              </p>
              <p className="text-[10px] text-gray-400 italic">
                {data?.live_proof_blocked_reason || "Live provider proof remains blocked until data hygiene and dead-letter blockers are resolved"}
              </p>
            </div>

            {data?.checked_at && (
              <p className="mt-3 text-[10px] text-gray-300">Checked: {new Date(data.checked_at).toLocaleString()}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}