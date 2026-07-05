/**
 * Sprint2BlockerVerification — Standalone admin page for verifying the two
 * Sprint 2 blockers that must be cleared before Sprint 3:
 *
 *   1. STOP / Opt-Out Handling (stop_reply_test)
 *   2. Inbound Reply Classification (inbound_reply_classification_test)
 *
 * Pulls scaffolding data from getSprint2Scaffolding, runs runSprint2ProofCheck
 * on demand, and shows a clear "Sprint 3 Clearance" verdict.
 */
import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AdminShell from "@/components/admin/AdminShell";
import Sprint2BlockerCard from "@/components/admin/ops-verification/Sprint2BlockerCard";
import { StatusPill, fmtDate } from "@/components/admin/ops-verification/helpers";
import { ShieldCheck, RefreshCw, Loader2, PlayCircle, Ban, MessageSquare, CheckCircle2, XCircle } from "lucide-react";

const BLOCKER_KEYS = ["inbound_reply_classification_test", "stop_reply_test"];

export default function Sprint2BlockerVerification() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [proofResult, setProofResult] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("getSprint2Scaffolding", {});
      setData(res.data);
    } catch (err) {
      setError(err.message || "Failed to load Sprint 2 scaffolding");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRunProofCheck = useCallback(async () => {
    setRunning(true);
    setError(null);
    setProofResult(null);
    try {
      const res = await base44.functions.invoke("runSprint2ProofCheck", {});
      setProofResult(res.data);
      // Refresh scaffolding data after proof check runs
      await fetchData();
    } catch (err) {
      setError(err.message || "Failed to run Sprint 2 proof check");
    } finally {
      setRunning(false);
    }
  }, [fetchData]);

  // Extract the two blocker workflows
  const blockerWorkflows = (data?.proof_workflows || []).filter((wf) => BLOCKER_KEYS.includes(wf.key));
  const classificationWf = blockerWorkflows.find((w) => w.key === "inbound_reply_classification_test");
  const stopWf = blockerWorkflows.find((w) => w.key === "stop_reply_test");

  // Sprint 3 clearance verdict
  const bothPassed = classificationWf?.current_status === "pass" && stopWf?.current_status === "pass";
  const bothSafeToPass = classificationWf?.safe_to_pass && stopWf?.safe_to_pass;

  let clearanceLabel, clearanceColor;
  if (bothPassed) {
    clearanceLabel = "Cleared — Ready for Sprint 3";
    clearanceColor = "green";
  } else if (bothSafeToPass) {
    clearanceLabel = "Evidence Ready — Create Proof Logs to Clear";
    clearanceColor = "yellow";
  } else {
    clearanceLabel = "Blocked — Cannot Start Sprint 3";
    clearanceColor = "red";
  }

  // Evidence counts per blocker
  const evidenceSummary = data?.evidence_summary || {};
  const classificationEvidence = {
    inbound_sms_events: evidenceSummary.inbound_sms_events || 0,
    events_with_intent: evidenceSummary.events_with_intent || 0,
  };
  const stopEvidence = {
    stop_opt_out_events: evidenceSummary.stop_opt_out_events || 0,
    paused_nurture_campaigns: evidenceSummary.paused_nurture_campaigns || 0,
    opt_out_campaigns: evidenceSummary.opt_out_campaigns || 0,
  };

  // Proof logs for these test types
  const allProofLogs = data?.proof_workflows || [];

  return (
    <AdminShell title="Sprint 2 Blocker Verification" activeId="ops-verification">
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #003B8F, #00AEEF)" }}>
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Sprint 2 Blocker Verification</h1>
              <p className="text-xs text-gray-400">
                STOP/opt-out handling + inbound reply classification — clear these before Sprint 3
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunProofCheck}
              disabled={running}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, #0079c1, #005691)", boxShadow: "0 2px 8px rgba(0,121,193,0.25)" }}
            >
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
              {running ? "Running…" : "Run Proof Check"}
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
            <p className="text-sm font-bold text-red-700">Error</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Sprint 3 Clearance Banner */}
        {!loading && (
          <div
            className="rounded-xl p-5 mb-6 flex items-center justify-between gap-4 flex-wrap"
            style={{
              background: bothPassed
                ? "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))"
                : bothSafeToPass
                ? "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))"
                : "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))",
              border: `1px solid ${bothPassed ? "rgba(34,197,94,0.25)" : bothSafeToPass ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)"}`,
            }}
          >
            <div className="flex items-center gap-3">
              {bothPassed ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : bothSafeToPass ? (
                <ShieldCheck className="w-8 h-8 text-amber-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Sprint 3 Clearance</p>
                <p className="text-base font-bold text-gray-900">{clearanceLabel}</p>
              </div>
            </div>
            <StatusPill color={clearanceColor} label={bothPassed ? "PASS" : bothSafeToPass ? "READY" : "BLOCKED"} />
          </div>
        )}

        {/* Proof check result */}
        {proofResult && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-bold text-blue-900">Proof check completed — {fmtDate(proofResult.ran_at)}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="font-bold text-gray-500 mb-1">Inbound SMS Assistant</p>
                <StatusPill color={proofResult.inbound_sms_assistant?.status === "proof_passed" ? "green" : "yellow"} label={proofResult.inbound_sms_assistant?.status || "—"} />
              </div>
              <div>
                <p className="font-bold text-gray-500 mb-1">Nurture Sequence 14d</p>
                <StatusPill color={proofResult.nurture_sequence_14d?.status === "proof_passed" ? "green" : "yellow"} label={proofResult.nurture_sequence_14d?.status || "—"} />
              </div>
              <div>
                <p className="font-bold text-gray-500 mb-1">Combined Gate</p>
                <StatusPill color={proofResult.sprint2_combined?.status === "proof_passed" ? "green" : "yellow"} label={proofResult.sprint2_combined?.status || "—"} />
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Two blocker cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Sprint2BlockerCard
                wf={classificationWf}
                evidenceCounts={classificationEvidence}
                proofLogs={[]}
              />
              <Sprint2BlockerCard
                wf={stopWf}
                evidenceCounts={stopEvidence}
                proofLogs={[]}
              />
            </div>

            {/* Intent classification reference */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-gray-900">Intent Classification Reference</h3>
                <span className="text-[11px] text-gray-400">— 7 labels the inbound SMS assistant must classify</span>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-3 py-2 font-bold text-gray-500">Label</th>
                        <th className="text-left px-3 py-2 font-bold text-gray-500">Description</th>
                        <th className="text-left px-3 py-2 font-bold text-gray-500">Example Triggers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.intent_labels || []).map((label) => (
                        <tr key={label.key} className={`border-b border-gray-50 last:border-0 ${label.key === "stop_opt_out" ? "bg-red-50/50" : ""}`}>
                          <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                            {label.key === "stop_opt_out" && <Ban className="w-3 h-3 text-red-500 inline mr-1" />}
                            {label.label}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{label.description}</td>
                          <td className="px-3 py-2 text-gray-500 text-[11px]">{label.example_triggers.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Evidence summary */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Live Evidence Summary</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(evidenceSummary).map(([key, val]) => (
                  <div key={key} className="rounded-lg border border-gray-200 bg-white p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{key.replace(/_/g, " ")}</p>
                    <p className={`text-lg font-bold ${val > 0 ? "text-gray-900" : "text-gray-300"}`}>{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Gate status */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Gate Status</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(data.gates || {}).map(([key, gate]) => (
                  <div key={key} className="rounded-xl border border-gray-200 bg-white p-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <p className="text-xs font-bold text-gray-900 mb-2">{key.replace(/_/g, " ")}</p>
                    {gate ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase text-gray-400">Status:</span>
                          <StatusPill
                            color={gate.status === "proof_passed" ? "green" : gate.status === "ready_for_proof" ? "yellow" : gate.status === "blocked" ? "red" : "gray"}
                            label={gate.status || "unknown"}
                          />
                        </div>
                        <p className="text-[11px] text-gray-600"><span className="font-bold">Blocker:</span> {gate.current_blocker || "None"}</p>
                        <p className="text-[11px] text-gray-600"><span className="font-bold">Next:</span> {gate.next_action || "—"}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-600">Gate not found — run seedSprint2Gates</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Next action */}
            {data.next_most_important_action && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-blue-600 flex-shrink-0 mt-0.5">Next Action:</span>
                <span className="text-xs text-blue-900 font-medium">{data.next_most_important_action}</span>
              </div>
            )}

            {data.checked_at && (
              <p className="text-[10px] text-gray-300">Last checked: {fmtDate(data.checked_at)}</p>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">
            Sprint 2 Blocker Verification — Read-only evidence display. "Run Proof Check" updates LaunchGate statuses based on real
            CommunicationEvent and NurtureCampaign evidence. No external messages are sent. Both blockers must pass before Sprint 3 begins.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}