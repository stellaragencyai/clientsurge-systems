import { CheckCircle2, XCircle, Target, ArrowRight } from "lucide-react";

const STATUS_STYLES = {
  ready: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Ready" },
  partial: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: CheckCircle2, label: "Partial" },
  not_ready: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Not Ready" },
};

function capabilityStatus(data, key) {
  const cap = (data?.capabilities || []).find(c => c.key === key);
  if (!cap) return "not_ready";
  if (cap.status === "green") return "ready";
  if (cap.status === "yellow") return "partial";
  return "not_ready";
}

export default function FirstLaunchScopeSummary({ data }) {
  const speedToLead = capabilityStatus(data, "instant_lead_response");
  const recovery = capabilityStatus(data, "missed_call_text_back");
  const evidenceLogging = data?.proof_logs_empty ? "not_ready" : "partial";
  const recordExclusion = data?.quarantine ? "ready" : "not_ready";

  const items = [
    { label: "Speed-to-Lead Readiness", status: speedToLead, evidence: "Instant lead response capability + delivery proof" },
    { label: "Recovery Flow Readiness", status: recovery, evidence: "Missed-call text-back with clean webhook route" },
    { label: "Evidence Logging Readiness", status: evidenceLogging, evidence: "AutomationProofLog records exist and are populated" },
    { label: "Internal Record Exclusion", status: recordExclusion, evidence: "Test/smoke/internal records quarantined from production metrics" },
  ];

  const readyCount = items.filter(i => i.status === "ready").length;
  const overall = readyCount === items.length ? "ready" : readyCount > 0 ? "partial" : "not_ready";
  const overallStyle = STATUS_STYLES[overall];

  const supported = items.filter(i => i.status === "ready" || i.status === "partial");
  const missing = items.filter(i => i.status === "not_ready");
  const highestGap = missing[0] || null;
  const nextAction = highestGap
    ? `Close the "${highestGap.label}" gap — ${highestGap.evidence}.`
    : "All core launch items ready — proceed to secondary scope review.";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">First Launch Scope Summary</h3>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ color: overallStyle.color, background: overallStyle.bg, border: `1px solid ${overallStyle.border}` }}
        >
          {readyCount}/{items.length} Ready
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {items.map(item => {
          const s = STATUS_STYLES[item.status];
          return (
            <div key={item.label} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: s.color }} />
                <p className="text-xs font-semibold text-gray-900">{item.label}</p>
                <span className="ml-auto text-[10px] font-bold" style={{ color: s.color }}>{s.label}</span>
              </div>
              <p className="text-[11px] text-gray-500">{item.evidence}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Supported by App Data</p>
          {supported.length > 0 ? (
            <ul className="space-y-0.5">
              {supported.map(i => (
                <li key={i.label} className="text-gray-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>{i.label} — {STATUS_STYLES[i.status].label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No core launch items have supporting evidence yet.</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Still Missing</p>
          {missing.length > 0 ? (
            <ul className="space-y-0.5">
              {missing.map(i => (
                <li key={i.label} className="text-red-600 flex items-center gap-1.5">
                  <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span>{i.label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-green-600">All core launch items have at least partial evidence.</p>
          )}
        </div>
        <div className="pt-2 border-t border-gray-100">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Highest Priority Gap</p>
          <p className="text-gray-700 font-medium">{highestGap ? highestGap.label : "None — all core items covered"}</p>
        </div>
        <div className="flex items-start gap-1.5 pt-2 border-t border-gray-100">
          <ArrowRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Next Internal Action</p>
            <p className="text-gray-700">{nextAction}</p>
          </div>
        </div>
      </div>
    </div>
  );
}