import { XCircle, AlertCircle } from "lucide-react";

const STATUS_LABELS = { yellow: "Partial", red: "Missing" };

export default function BlockedFromGreen({ capabilities }) {
  const blocked = capabilities.filter(c => c.status !== "green");

  if (blocked.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-green-600" />
        <p className="text-xs text-green-700 font-semibold">All capabilities are proven. No blockers detected.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <h3 className="text-sm font-bold text-gray-900 mb-1">Blocked From Green — Admin Only</h3>
      <p className="text-xs text-gray-400 mb-4">
        Exact reasons each capability cannot be marked complete yet. No capability is marked green unless app data proves it.
      </p>
      <div className="space-y-3">
        {blocked.map(cap => (
          <div key={cap.key} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-sm font-semibold text-gray-900">{cap.label}</p>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0"
                style={{
                  color: cap.status === "red" ? "#DC2626" : "#D97706",
                  background: cap.status === "red" ? "rgba(220,38,38,0.05)" : "rgba(217,119,6,0.06)",
                  border: `1px solid ${cap.status === "red" ? "rgba(220,38,38,0.18)" : "rgba(217,119,6,0.2)"}`,
                }}
              >
                {STATUS_LABELS[cap.status] || cap.status}
              </span>
            </div>
            <ul className="space-y-1">
              {cap.blockers?.map((b, i) => (
                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                  <XCircle className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
              {!cap.blockers?.length && <li className="text-xs text-gray-400">No specific blockers recorded.</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}