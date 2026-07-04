import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

/**
 * Admin-only launch-readiness summary card for the first launch scope.
 * Shows one of three labels: ready, needs review, or not ready.
 * Label is based only on current app evidence (computed capabilities + proof logs + quarantine).
 */
export default function LaunchReadinessSummary({ data }) {
  if (!data) return null;

  const capabilities = data.capabilities || [];
  const proofLogsEmpty = data.proof_logs_empty;
  const quarantine = data.quarantine || {};
  const deliveryStats = data.delivery_stats || {};

  // Core launch capabilities
  const coreCaps = capabilities.filter(c =>
    ["instant_lead_response", "missed_call_text_back", "automation_proof_logs"].includes(c.key)
  );

  const allCoreGreen = coreCaps.length > 0 && coreCaps.every(c => c.status === "green");
  const anyCoreRed = coreCaps.some(c => c.status === "red");
  const anyCoreYellow = coreCaps.some(c => c.status === "yellow");

  // Internal record exclusion check
  const exclusionReady = quarantine.rules?.length > 0 && (quarantine.excluded_leads_count === 0 || quarantine.production_leads_count > 0);

  // Delivery evidence
  const hasDeliveredProof = (deliveryStats.delivered || 0) > 0;

  // Determine label
  let label, color, reason, blockers = [], requiredAction = "";

  if (proofLogsEmpty || anyCoreRed || !exclusionReady) {
    label = "Not Ready";
    color = "#DC2626";
    if (proofLogsEmpty) {
      blockers.push("AutomationProofLog is empty — no go-live proof evidence exists.");
      requiredAction = "Create AutomationProofLog records for every service key before claiming go-live.";
    }
    coreCaps.filter(c => c.status === "red").forEach(c => {
      blockers.push(`${c.label}: ${c.blockers?.[0] || "not configured"}`);
    });
    if (!exclusionReady) {
      blockers.push("Internal record exclusion is not ready — quarantine rules missing or all data is test data.");
    }
    reason = blockers[0] || "Core launch items are missing.";
  } else if (anyCoreYellow || !hasDeliveredProof) {
    label = "Needs Review";
    color = "#D97706";
    if (anyCoreYellow) {
      blockers.push("Some core capabilities are partially configured — proof is incomplete.");
    }
    if (!hasDeliveredProof) {
      blockers.push("No delivered Twilio SMS proof in CommunicationLog.");
    }
    reason = "Core infrastructure exists but proof is incomplete. Review and close remaining gaps.";
    requiredAction = "Generate real delivered SMS events with provider_message_id and pass proof logs for all core services.";
  } else {
    label = "Ready";
    color = "#059669";
    reason = "All core launch capabilities are proven by real records and proof logs.";
    requiredAction = "No action — maintain proof records and monitor.";
  }

  const Icon = label === "Ready" ? CheckCircle2 : label === "Needs Review" ? AlertTriangle : XCircle;

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: `linear-gradient(135deg, ${color}0D, ${color}05)`,
        border: `1px solid ${color}33`,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}14`, border: `1px solid ${color}33` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">First Launch Readiness</p>
          <p className="text-lg font-bold" style={{ color }}>{label}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Reason</p>
          <p className="text-xs text-gray-600 leading-relaxed">{reason}</p>
        </div>

        {blockers.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Blockers</p>
            <ul className="space-y-1">
              {blockers.map((b, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-gray-300 mt-0.5">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {requiredAction && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Required Action</p>
            <p className="text-xs text-gray-600 leading-relaxed">{requiredAction}</p>
          </div>
        )}
      </div>

      {/* Core capability indicators */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Core Launch Items</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {coreCaps.map(cap => (
            <div key={cap.key} className="flex items-center justify-between gap-2 rounded-md border border-gray-100 bg-white/50 px-3 py-1.5">
              <span className="text-[11px] text-gray-600 truncate">{cap.label}</span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide flex-shrink-0"
                style={{
                  color: cap.status === "green" ? "#059669" : cap.status === "yellow" ? "#D97706" : "#DC2626",
                  background: cap.status === "green" ? "rgba(5,150,105,0.06)" : cap.status === "yellow" ? "rgba(217,119,6,0.06)" : "rgba(220,38,38,0.06)",
                  border: `1px solid ${cap.status === "green" ? "rgba(5,150,105,0.2)" : cap.status === "yellow" ? "rgba(217,119,6,0.2)" : "rgba(220,38,38,0.2)"}`,
                }}
              >
                {cap.status}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-2 rounded-md border border-gray-100 bg-white/50 px-3 py-1.5">
            <span className="text-[11px] text-gray-600 truncate">Internal Record Exclusion</span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide flex-shrink-0"
              style={{
                color: exclusionReady ? "#059669" : "#DC2626",
                background: exclusionReady ? "rgba(5,150,105,0.06)" : "rgba(220,38,38,0.06)",
                border: `1px solid ${exclusionReady ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.2)"}`,
              }}
            >
              {exclusionReady ? "ready" : "not ready"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}