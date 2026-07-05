/**
 * Sprint2BlockerCard — Focused card for a single Sprint 2 blocker proof workflow.
 *
 * Shows: status, required evidence checklist (with check/cross per item found),
 * current blocker, next action, and related proof logs.
 */
import { StatusPill, EvidenceRow, fmtDate } from "./helpers";
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from "lucide-react";

const STATUS_COLOR = {
  pending: "red",
  ready_for_proof: "yellow",
  pass: "green",
  fail: "red",
};

export default function Sprint2BlockerCard({ wf, evidenceCounts, proofLogs }) {
  const color = STATUS_COLOR[wf.current_status] || "gray";
  const isPassed = wf.current_status === "pass";
  const isReady = wf.current_status === "ready_for_proof";

  return (
    <div
      className="rounded-xl border overflow-hidden flex flex-col"
      style={{
        background: "#fff",
        borderColor: isPassed ? "rgba(34,197,94,0.30)" : isReady ? "rgba(245,158,11,0.30)" : "rgba(239,68,68,0.25)",
        boxShadow: isPassed
          ? "0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(34,197,94,0.08)"
          : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-sm font-bold text-gray-900">{wf.label}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Service: {wf.service_key.replace(/_/g, " ")}</p>
        </div>
        <StatusPill color={color} label={wf.current_status} />
      </div>

      <div className="px-4 py-3 flex-1 flex flex-col gap-3">
        {/* Required evidence checklist */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Required Evidence</p>
          <ul className="space-y-1.5">
            {wf.required_evidence.map((e, i) => {
              const met = isPassed || (isReady && i === 0);
              return (
                <li key={i} className="flex items-start gap-2">
                  {met ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-[11px] leading-relaxed ${met ? "text-gray-600" : "text-gray-500"}`}>{e}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Evidence counts — live data from the backend */}
        {evidenceCounts && Object.keys(evidenceCounts).length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(evidenceCounts).map(([key, val]) => (
              <div key={key} className="rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1.5">
                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">{key.replace(/_/g, " ")}</p>
                <p className={`text-base font-bold ${val > 0 ? "text-gray-900" : "text-gray-300"}`}>{val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Blocker */}
        {wf.blocker && !isPassed && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 leading-relaxed">{wf.blocker}</p>
          </div>
        )}

        {/* Next action */}
        <div className="flex items-start gap-2">
          <ArrowRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-700 leading-relaxed flex-1">{wf.next_action}</p>
        </div>

        {/* Related proof logs */}
        {proofLogs && proofLogs.length > 0 && (
          <div className="mt-auto pt-2 border-t border-gray-50">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">
              Proof Logs ({proofLogs.length})
            </p>
            <div className="space-y-1">
              {proofLogs.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-[11px]">
                  <StatusPill
                    color={p.status === "pass" ? "green" : p.status === "fail" ? "red" : "gray"}
                    label={p.status}
                  />
                  <span className="text-gray-500">{fmtDate(p.tested_at)}</span>
                  <span className="text-gray-400 truncate flex-1">{p.evidence_summary?.slice(0, 60)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safe to pass indicator */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-gray-50">
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Safe to Pass:</span>
          <StatusPill color={wf.safe_to_pass ? "green" : "red"} label={wf.safe_to_pass ? "Yes" : "No"} />
        </div>
      </div>
    </div>
  );
}