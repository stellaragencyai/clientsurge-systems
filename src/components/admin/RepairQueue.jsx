import {
  AlertTriangle, XCircle, AlertOctagon, Info, Wrench, ShieldAlert,
} from "lucide-react";

const SEVERITY_STYLES = {
  critical: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.2)", icon: AlertOctagon, label: "Critical" },
  high: { color: "#EA580C", bg: "rgba(234,88,12,0.05)", border: "rgba(234,88,12,0.2)", icon: ShieldAlert, label: "High" },
  medium: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Medium" },
  low: { color: "#6B7280", bg: "rgba(107,114,128,0.05)", border: "rgba(107,114,128,0.2)", icon: Info, label: "Low" },
};

export default function RepairQueue({ repairQueue }) {
  if (!repairQueue || repairQueue.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-6 flex items-center gap-2">
        <Wrench className="w-4 h-4 text-green-600" />
        <p className="text-sm text-green-700 font-semibold">No repair items detected — all evidence checks passed.</p>
      </div>
    );
  }

  const criticalCount = repairQueue.filter(r => r.severity === "critical").length;
  const highCount = repairQueue.filter(r => r.severity === "high").length;

  return (
    <div className="space-y-4">
      {/* Explanation */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          This repair queue is generated from current app data. Items are not marked complete unless proven by evidence.
          No external providers are contacted and no public pages are modified.
        </p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm font-bold text-gray-900">{repairQueue.length} repair items</span>
        {criticalCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <AlertOctagon className="w-3.5 h-3.5" /> {criticalCount} critical
          </span>
        )}
        {highCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-600">
            <ShieldAlert className="w-3.5 h-3.5" /> {highCount} high
          </span>
        )}
        <span className="ml-auto text-[11px] text-gray-400">safe_to_mark_complete defaults to false unless proven</span>
      </div>

      {/* Repair items */}
      {repairQueue.map((item, idx) => {
        const style = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.low;
        const Icon = style.icon;
        return (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: style.bg, border: `1px solid ${style.border}` }}
                >
                  <Icon className="w-4 h-4" style={{ color: style.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{item.repair_type}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Affected: <span className="font-semibold text-gray-700">{item.affected_capability}</span></p>
                </div>
              </div>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0"
                style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}
              >
                {style.label}
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Evidence Source</p>
                <p className="text-xs text-gray-600 font-mono">{item.evidence_source}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Why It Matters</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.why_it_matters}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Recommended Next Admin Action</p>
                <p className="text-xs text-gray-700 font-medium">{item.recommended_next_admin_action}</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Safe to Mark Complete:</span>
                <span className={`text-xs font-bold ${item.safe_to_mark_complete ? "text-green-600" : "text-red-600"}`}>
                  {item.safe_to_mark_complete ? "Yes" : "No — not proven"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}