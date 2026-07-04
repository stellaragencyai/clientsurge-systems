import { CheckCircle2, Loader2, XCircle, ShieldCheck, FileBarChart } from "lucide-react";

/**
 * Private admin-only project update summary card.
 * Shows completed, in-progress, and blocked items derived from audit data,
 * plus the rule that build work should not be closed until app evidence supports it.
 */
export default function ProjectUpdateSummary({ data }) {
  const caps = data?.capabilities || [];
  const proofLogsEmpty = data?.proof_logs_empty;

  const completed = caps.filter((c) => c.status === "green");
  const inProgress = caps.filter((c) => c.status === "yellow");
  const blocked = caps.filter((c) => c.status === "red");

  // If proof logs are empty, nothing is truly "completed" by evidence
  const evidenceCompleted = proofLogsEmpty ? [] : completed;
  const evidenceInProgress = proofLogsEmpty ? completed.concat(inProgress) : inProgress;

  const Group = ({ icon: Icon, title, items, color, emptyNote }) => (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {title} ({items.length})
        </p>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 italic">{emptyNote}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((c, i) => (
            <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
              <span className="text-gray-300 mt-0.5">•</span>
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-4">
        <FileBarChart className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <h3 className="text-sm font-bold text-gray-900">Project Update Summary — Admin Only</h3>
      </div>

      <div className="space-y-4">
        <Group
          icon={CheckCircle2}
          title="Completed (Proven by Evidence)"
          items={evidenceCompleted}
          color="#059669"
          emptyNote="No capabilities are proven by real evidence yet."
        />

        <Group
          icon={Loader2}
          title="In Progress (Partial Evidence)"
          items={evidenceInProgress}
          color="#D97706"
          emptyNote="No capabilities are in partial state."
        />

        <Group
          icon={XCircle}
          title="Blocked (No Usable Evidence)"
          items={blocked}
          color="#DC2626"
          emptyNote="No blocked capabilities."
        />
      </div>

      <div
        className="mt-4 rounded-lg p-3 flex items-start gap-2"
        style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.15)" }}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-sky-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-600 leading-relaxed">
          <span className="font-semibold text-sky-700">Rule:</span> Build work must not be closed
          until app evidence supports it. A capability is only "completed" when real records
          (proof logs, delivery stats, route health) confirm it — not when code is written or
          config is set.
        </p>
      </div>
    </div>
  );
}