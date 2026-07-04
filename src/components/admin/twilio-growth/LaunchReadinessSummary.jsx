import { CheckCircle2, AlertTriangle, XCircle, Rocket } from "lucide-react";

const READY_STYLES = {
  ready: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Ready" },
  needs_review: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Needs Review" },
  not_ready: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Not Ready" },
};

const FIRST_LAUNCH_CAPS = ["instant_lead_response", "missed_call_text_back"];

/**
 * Launch-readiness summary card for the first launch scope.
 * Label is based ONLY on current app evidence — no manual overrides.
 *
 * Logic:
 *   - "ready"       = all first-launch capabilities are green
 *   - "not_ready"   = any first-launch capability is red, OR proof_logs_empty
 *   - "needs_review" = first-launch caps are yellow/partial but none red
 *
 * Also shows reason, blockers, and required action.
 */
export default function LaunchReadinessSummary({ data }) {
  const capabilities = data?.capabilities || [];
  const proofLogsEmpty = data?.proof_logs_empty;
  const deliveryStats = data?.delivery_stats;
  const missedCallStats = data?.missed_call_stats;

  const firstLaunchCaps = capabilities.filter((c) => FIRST_LAUNCH_CAPS.includes(c.key));

  const hasRed = firstLaunchCaps.some((c) => c.status === "red");
  const allGreen = firstLaunchCaps.length > 0 && firstLaunchCaps.every((c) => c.status === "green");

  let readiness = "needs_review";
  if (proofLogsEmpty || hasRed) {
    readiness = "not_ready";
  } else if (allGreen) {
    readiness = "ready";
  }

  const style = READY_STYLES[readiness];
  const Icon = style.icon;

  const blockers = [];
  const reasons = [];

  if (proofLogsEmpty) {
    blockers.push("AutomationProofLog is empty — no go-live proof evidence exists");
    reasons.push("No proof logs have been created for any service");
  }

  for (const cap of firstLaunchCaps) {
    if (cap.status === "red") {
      blockers.push(`${cap.label}: ${cap.blockers?.[0] || "no evidence or implementation"}`);
      reasons.push(`${cap.label} has no proven evidence`);
    } else if (cap.status === "yellow") {
      reasons.push(`${cap.label} is partially configured — proof incomplete`);
    }
  }

  if (missedCallStats?.has_404) {
    blockers.push("Missed-call webhook returning 404");
  }
  if (missedCallStats?.has_405) {
    blockers.push("Missed-call webhook returning 405");
  }
  if (deliveryStats && deliveryStats.delivered === 0) {
    blockers.push("No delivered SMS in CommunicationLog — delivery proof missing");
  }

  let requiredAction = "";
  if (readiness === "not_ready") {
    if (proofLogsEmpty) {
      requiredAction = "Create and pass AutomationProofLog records for instant_lead_response and missed_call_text_back before go-live.";
    } else if (missedCallStats?.has_404 || missedCallStats?.has_405) {
      requiredAction = "Repair the missed-call webhook URL so Twilio gets 200, then retest with a real inbound call.";
    } else if (deliveryStats?.delivered === 0) {
      requiredAction = "Generate a real delivered Twilio SMS on a new non-test lead to prove speed-to-lead delivery.";
    } else {
      requiredAction = "Resolve all red blockers for instant_lead_response and missed_call_text_back.";
    }
  } else if (readiness === "needs_review") {
    requiredAction = "Complete remaining proof for all first-launch capabilities — create passed AutomationProofLog records and verify delivery evidence.";
  } else {
    requiredAction = "All first-launch capabilities are proven. Proceed with go-live and maintain proof monitoring.";
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: style.bg, border: `1px solid ${style.border}` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${style.color}15`, border: `1px solid ${style.color}30` }}
        >
          <Icon className="w-5 h-5" style={{ color: style.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Rocket className="w-3.5 h-3.5 text-gray-400" />
            <h3 className="text-sm font-bold text-gray-900">First Launch Readiness — Admin Only</h3>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-bold flex-shrink-0"
              style={{ color: style.color, background: `${style.color}11`, border: `1px solid ${style.color}30` }}
            >
              {style.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">
            Scope: Instant Lead Response + Missed Call Text-Back. Label is computed only from current app evidence —
            no manual overrides, no operator notes, no inferred trust.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg bg-white/60 border border-gray-100 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Reason</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {reasons.length > 0 ? reasons.join("; ") : "All first-launch capabilities are proven by real records and passed proof logs."}
              </p>
            </div>
            <div className="rounded-lg bg-white/60 border border-gray-100 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Blockers</p>
              {blockers.length > 0 ? (
                <ul className="space-y-1">
                  {blockers.map((b, i) => (
                    <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                      <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-green-600 font-medium">No blockers detected</p>
              )}
            </div>
            <div className="rounded-lg bg-white/60 border border-gray-100 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Required Action</p>
              <p className="text-xs text-gray-600 leading-relaxed">{requiredAction}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}