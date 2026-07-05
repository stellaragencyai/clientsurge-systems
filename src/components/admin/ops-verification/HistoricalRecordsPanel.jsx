import { StatusPill, fmtDate, timeAgo } from "./helpers";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

function TruthCheckRow({ record, isLatest }) {
  return (
    <div className={`rounded-lg border p-3 ${isLatest ? "" : "opacity-60"}`} style={{ background: "#fff", borderColor: isLatest ? "#00AEEF40" : "#E5E7EB" }}>
      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
        <div className="flex items-center gap-2">
          <StatusPill color={record.truth_status === "trusted" ? "green" : record.truth_status === "warning" ? "yellow" : record.truth_status === "blocked" ? "red" : "gray"} label={record.truth_status} />
          {isLatest && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">CURRENT</span>}
          {!isLatest && <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">HISTORICAL</span>}
        </div>
        <span className="text-[10px] text-gray-400">{fmtDate(record.created_at || record.updated_at)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div>
          <span className="font-bold text-gray-400">Scope:</span> <span className="text-gray-700">{record.scope}</span>
        </div>
        <div>
          <span className="font-bold text-gray-400">Safe to Launch:</span>{" "}
          <span className={record.safe_to_launch ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{String(record.safe_to_launch)}</span>
        </div>
        <div>
          <span className="font-bold text-gray-400">Blockers:</span> <span className="text-gray-700">{record.blocker_count || 0}</span>
        </div>
      </div>
      {record.blockers?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 mb-1">Blockers:</p>
          <ul className="space-y-0.5">
            {record.blockers.slice(0, 3).map((b, i) => (
              <li key={i} className="text-[10px] text-red-600">• {b.code}: {b.message}</li>
            ))}
            {record.blockers.length > 3 && <li className="text-[10px] text-gray-400">+{record.blockers.length - 3} more…</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function ReadinessRow({ record, isLatest }) {
  return (
    <div className={`rounded-lg border p-3 ${isLatest ? "" : "opacity-60"}`} style={{ background: "#fff", borderColor: isLatest ? "#00AEEF40" : "#E5E7EB" }}>
      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
        <div className="flex items-center gap-2">
          <StatusPill color={record.go_no_go_decision === "go" ? "green" : record.go_no_go_decision === "conditional_go" ? "yellow" : "red"} label={record.go_no_go_decision} />
          {isLatest && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">CURRENT</span>}
          {!isLatest && <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">HISTORICAL</span>}
        </div>
        <span className="text-[10px] text-gray-400">{timeAgo(record.last_evaluated_at || record.created_at)}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-[10px]">
        <div><span className="font-bold text-gray-400">Overall:</span> <span className="text-gray-700">{record.overall_readiness_score}%</span></div>
        <div><span className="font-bold text-gray-400">System:</span> <span className="text-gray-700">{record.system_status}</span></div>
        <div><span className="font-bold text-gray-400">Sys Health:</span> <span className="text-gray-700">{record.system_health_score}%</span></div>
        <div><span className="font-bold text-gray-400">Ops:</span> <span className="text-gray-700">{record.ops_health_score}%</span></div>
      </div>
      {record.critical_blockers?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-50">
          <p className="text-[10px] font-bold text-red-400 mb-1">Critical Blockers:</p>
          <ul className="space-y-0.5">
            {record.critical_blockers.slice(0, 3).map((b, i) => <li key={i} className="text-[10px] text-red-600">• {b}</li>)}
          </ul>
        </div>
      )}
      {record.notes && <p className="mt-2 text-[10px] text-gray-500 italic">{record.notes}</p>}
    </div>
  );
}

export default function HistoricalRecordsPanel({ truthChecks, readinessStates }) {
  const [showHistory, setShowHistory] = useState(false);
  const truth = truthChecks || [];
  const readiness = readinessStates || [];
  const latestTruth = truth[0];
  const historicalTruth = truth.slice(1);
  const latestReadiness = readiness[0];
  const historicalReadiness = readiness.slice(1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
        <h3 className="text-sm font-bold text-gray-900">Current vs Historical Records</h3>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
        >
          {showHistory ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          {showHistory ? "Hide" : "Show"} History ({historicalTruth.length + historicalReadiness.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* DashboardTruthCheck */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Dashboard Truth Check</p>
          {latestTruth && <TruthCheckRow record={latestTruth} isLatest={true} />}
          {!latestTruth && <p className="text-xs text-gray-400">No records found.</p>}
          {showHistory && historicalTruth.length > 0 && (
            <div className="mt-2 space-y-2">
              {historicalTruth.slice(0, 5).map((r) => <TruthCheckRow key={r.id} record={r} isLatest={false} />)}
            </div>
          )}
        </div>

        {/* LaunchReadinessState */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Launch Readiness State</p>
          {latestReadiness && <ReadinessRow record={latestReadiness} isLatest={true} />}
          {!latestReadiness && <p className="text-xs text-gray-400">No records found.</p>}
          {showHistory && historicalReadiness.length > 0 && (
            <div className="mt-2 space-y-2">
              {historicalReadiness.slice(0, 5).map((r) => <ReadinessRow key={r.id} record={r} isLatest={false} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}