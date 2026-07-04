import { CheckCircle2, Clock, XCircle, ShieldAlert } from "lucide-react";

export default function ProjectUpdateSummaryCard({ data }) {
  const caps = data?.capabilities || [];
  const completed = caps.filter((c) => c.status === "green");
  const inProgress = caps.filter((c) => c.status === "yellow");
  const blocked = caps.filter((c) => c.status === "red");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <h3 className="text-sm font-bold text-gray-900 mb-3">Project Update Summary — Admin Only</h3>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600">Completed</p>
          </div>
          <p className="text-lg font-bold text-green-700">{completed.length}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">In Progress</p>
          </div>
          <p className="text-lg font-bold text-amber-700">{inProgress.length}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-red-600">Blocked</p>
          </div>
          <p className="text-lg font-bold text-red-700">{blocked.length}</p>
        </div>
      </div>

      {completed.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-green-500 mb-1.5">Completed</p>
          <ul className="space-y-1">
            {completed.map((c) => (
              <li key={c.key} className="text-xs text-gray-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                <span>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {blocked.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1.5">Blocked</p>
          <ul className="space-y-1">
            {blocked.map((c) => (
              <li key={c.key} className="text-xs text-gray-600 flex items-center gap-1.5">
                <XCircle className="w-3 h-3 text-red-300 flex-shrink-0" />
                <span>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className="rounded-lg p-3 flex items-start gap-2"
        style={{ background: "rgba(217,119,6,0.05)", border: "1px solid rgba(217,119,6,0.2)" }}
      >
        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700 leading-relaxed">
          <strong>Rule:</strong> Build work should not be closed in Asana or any tracker until real app evidence
          (proof logs, delivery records, or communication events) supports it. Checklist toggles and configuration
          alone are not sufficient.
        </p>
      </div>
    </div>
  );
}