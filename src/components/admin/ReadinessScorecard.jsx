import {
  CheckCircle2, AlertTriangle, XCircle, Info, ChevronDown, ChevronRight,
} from "lucide-react";
import { useState } from "react";

const STATUS_STYLES = {
  complete: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Complete" },
  partial: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Partial" },
  missing: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Missing" },
};

export default function ReadinessScorecard({ scorecard }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (idx) => setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));

  if (!scorecard || scorecard.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-400">No scorecard data available.</p>
      </div>
    );
  }

  const completeCount = scorecard.filter(s => s.status === "complete").length;
  const partialCount = scorecard.filter(s => s.status === "partial").length;
  const missingCount = scorecard.filter(s => s.status === "missing").length;

  return (
    <div className="space-y-4">
      {/* Explanation banner */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          This scorecard is for internal operational truth. It does not prove customer-facing readiness unless proof records exist.
          No category is marked complete unless the app data proves it.
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-xs font-semibold text-gray-700">{completeCount} Complete</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold text-gray-700">{partialCount} Partial</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <span className="text-xs font-semibold text-gray-700">{missingCount} Missing</span>
        </div>
        <span className="ml-auto text-[11px] text-gray-400">Computed from live database records only.</span>
      </div>

      {/* Category cards */}
      {scorecard.map((cat, idx) => {
        const style = STATUS_STYLES[cat.status] || STATUS_STYLES.missing;
        const Icon = style.icon;
        const isOpen = expanded[idx];
        return (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <button
              onClick={() => toggle(idx)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: style.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{cat.category}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {cat.blocking_issue || cat.evidence_checked?.[0] || "No issues detected"}
                </p>
              </div>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0"
                style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}
              >
                {style.label}
              </span>
              {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </button>
            {isOpen && (
              <div className="px-5 pb-4 pt-1 space-y-3 bg-gray-50/50">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Evidence Checked</p>
                  <ul className="space-y-1">
                    {cat.evidence_checked?.map((src, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-gray-300 mt-0.5 flex-shrink-0" />
                        <span>{src}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {cat.blocking_issue && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Blocking Issue</p>
                    <p className="text-xs text-red-600">{cat.blocking_issue}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Next Admin Action</p>
                  <p className="text-xs text-gray-600">{cat.next_admin_action}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}