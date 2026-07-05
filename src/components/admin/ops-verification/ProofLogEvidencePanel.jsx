import { StatusPill, classifyEvidenceQuality, isQaEvidence, timeAgo } from "./helpers";
import { AlertTriangle } from "lucide-react";

const STATUS_COLOR = { pass: "green", fail: "red", pending: "yellow" };

function ProofLogRow({ log }) {
  const eq = classifyEvidenceQuality(log);
  const qaWarning = isQaEvidence(eq) && log.status === "pass";
  const missingIds = !log.communication_log_id && !log.communication_event_id;

  return (
    <tr className="border-b border-gray-50 last:border-0">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusPill color={STATUS_COLOR[log.status] || "gray"} label={log.status} />
          {qaWarning && <StatusPill color="yellow" label={`QA: ${eq}`} />}
        </div>
      </td>
      <td className="px-3 py-2.5 font-semibold text-gray-800 text-xs">{log.service_key}</td>
      <td className="px-3 py-2.5 text-gray-500 text-xs">{log.test_type}</td>
      <td className="px-3 py-2.5 text-gray-600 text-xs">
        <p className="font-medium">{log.business_name || "—"}</p>
        <p className="text-[10px] text-gray-400">{log.client_email || "—"}</p>
      </td>
      <td className="px-3 py-2.5 text-gray-500 text-[10px] font-mono">{log.provider_message_id ? log.provider_message_id.slice(0, 20) + "…" : "—"}</td>
      <td className="px-3 py-2.5 text-[10px]">
        {log.communication_log_id ? (
          <span className="text-gray-600 font-mono">{log.communication_log_id.slice(0, 12)}…</span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
        <br />
        {log.communication_event_id ? (
          <span className="text-gray-600 font-mono">{log.communication_event_id.slice(0, 12)}…</span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-gray-500 text-[10px]">
        <p>{timeAgo(log.tested_at)}</p>
        <p className="text-gray-400">{log.tested_by?.split("@")[0] || "—"}</p>
      </td>
      <td className="px-3 py-2.5 text-gray-600 text-[10px] max-w-[200px] truncate" title={log.evidence_summary}>{log.evidence_summary || "—"}</td>
      {(missingIds || qaWarning) && (
        <td className="px-3 py-2.5">
          {missingIds && (
            <div className="flex items-center gap-1 text-amber-600 text-[10px] font-bold mb-1">
              <AlertTriangle className="w-3 h-3" /> Missing evidence IDs
            </div>
          )}
          {qaWarning && (
            <div className="flex items-center gap-1 text-amber-600 text-[10px] font-bold">
              <AlertTriangle className="w-3 h-3" /> QA/internal evidence — not production
            </div>
          )}
        </td>
      )}
    </tr>
  );
}

export default function ProofLogEvidencePanel({ proofLogs }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
        <h3 className="text-sm font-bold text-gray-900">Proof Log Evidence</h3>
        <span className="text-[11px] text-gray-400">({proofLogs?.length || 0} recent)</span>
      </div>
      <div className="rounded-xl border overflow-x-auto" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Status</th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Service</th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Test Type</th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Business</th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Provider Msg ID</th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Comm IDs</th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Tested</th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Evidence</th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Warnings</th>
            </tr>
          </thead>
          <tbody>
            {(proofLogs || []).map((log) => <ProofLogRow key={log.id} log={log} />)}
            {(!proofLogs || proofLogs.length === 0) && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400 text-xs">No proof logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}