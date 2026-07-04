import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert } from "lucide-react";

/**
 * Private admin-only launch-readiness summary card for the first launch scope.
 * Label is based ONLY on current app evidence — never on manual claims.
 */
export default function LaunchReadinessSummaryCard({ data }) {
  const caps = data?.capabilities || [];
  const proofLogsEmpty = data?.proof_logs_empty;
  const deliveryStats = data?.delivery_stats || {};
  const missedCallStats = data?.missed_call_stats || {};

  const coreKeys = [
    "instant_lead_response",
    "missed_call_text_back",
    "automation_proof_logs",
    "communication_event_logging",
  ];

  const coreCaps = caps.filter((c) => coreKeys.includes(c.key));
  const greenCore = coreCaps.filter((c) => c.status === "green");
  const redCore = coreCaps.filter((c) => c.status === "red");
  const yellowCore = coreCaps.filter((c) => c.status === "yellow");

  const hasDeliveredProof = (deliveryStats.delivered || 0) > 0 && (deliveryStats.with_provider_message_id || 0) > 0;
  const recoveryClean = !missedCallStats.has_404 && !missedCallStats.has_405 && (missedCallStats.successful_sends || 0) > 0;

  let label = "not_ready";
  let reason = "";
  let blockers = [];
  let requiredAction = "";

  if (proofLogsEmpty) {
    label = "not_ready";
    reason = "No AutomationProofLog records exist — no automation is production-trusted yet.";
    blockers.push("AutomationProofLog is empty");
    requiredAction = "Create proof pass records for instant_lead_response and missed_call_text_back.";
  } else if (redCore.length > 0) {
    label = "not_ready";
    reason = `${redCore.length} core launch capability(ies) have no usable evidence.`;
    blockers = redCore.flatMap((c) => c.blockers || [`${c.label} has no evidence`]);
    requiredAction = redCore[0]?.next_action || "Address the first red core capability blocker.";
  } else if (yellowCore.length > 0 || !hasDeliveredProof || !recoveryClean) {
    label = "needs_review";
    reason = "Core capabilities are partially built but evidence is incomplete or route health is not clean.";
    if (!hasDeliveredProof) blockers.push("No delivered SMS with valid provider message ID");
    if (!recoveryClean) blockers.push("Missed-call recovery route not clean (404/405 or no successful sends)");
    yellowCore.forEach((c) => blockers.push(`${c.label}: partial`));
    requiredAction = "Complete evidence records and verify route health for core capabilities.";
  } else if (greenCore.length === coreCaps.length && coreCaps.length > 0) {
    label = "ready";
    reason = "All core launch capabilities are proven by real evidence records.";
    requiredAction = "Maintain proof records and monitor for regressions.";
  } else {
    label = "needs_review";
    reason = "Core capabilities status is ambiguous — manual review required.";
    requiredAction = "Inspect capability matrix evidence sources.";
  }

  const STYLES = {
    ready: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Ready" },
    needs_review: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Needs Review" },
    not_ready: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Not Ready" },
  };

  const style = STYLES[label];
  const Icon = style.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <h3 className="text-sm font-bold text-gray-900">First Launch Readiness — Admin Only</h3>
      </div>

      <div
        className="rounded-lg p-4 flex items-center gap-3 mb-4"
        style={{ background: style.bg, border: `1px solid ${style.border}` }}
      >
        <Icon className="w-6 h-6 flex-shrink-0" style={{ color: style.color }} />
        <div>
          <p className="text-lg font-bold" style={{ color: style.color }}>{style.label}</p>
          <p className="text-[11px] text-gray-500">Based only on current app evidence (proof logs, delivery stats, route health, capability statuses)</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Reason</p>
          <p className="text-xs text-gray-600 leading-relaxed">{reason}</p>
        </div>

        {blockers.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Blockers</p>
            <ul className="space-y-1">
              {blockers.map((b, i) => (
                <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                  <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Required Action</p>
          <p className="text-xs text-gray-600">{requiredAction}</p>
        </div>
      </div>
    </div>
  );
}