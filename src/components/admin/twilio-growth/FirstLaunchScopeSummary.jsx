import { CheckCircle2, AlertTriangle, XCircle, ArrowRight } from "lucide-react";

/**
 * Admin-only "First Launch Scope Summary".
 * Sections:
 * - current readiness label
 * - what is already supported by app data
 * - what is still missing
 * - highest priority gap
 * - next internal action
 */
export default function FirstLaunchScopeSummary({ data }) {
  if (!data) return null;

  const capabilities = data.capabilities || [];
  const proofLogsEmpty = data.proof_logs_empty;
  const quarantine = data.quarantine || {};
  const deliveryStats = data.delivery_stats || {};
  const missedCallStats = data.missed_call_stats || {};

  // ── Readiness label ──
  const coreCaps = capabilities.filter(c =>
    ["instant_lead_response", "missed_call_text_back", "automation_proof_logs"].includes(c.key)
  );
  const allCoreGreen = coreCaps.length > 0 && coreCaps.every(c => c.status === "green");
  const anyCoreRed = coreCaps.some(c => c.status === "red");
  const anyCoreYellow = coreCaps.some(c => c.status === "yellow");
  const exclusionReady = quarantine.rules?.length > 0 && (quarantine.excluded_leads_count === 0 || quarantine.production_leads_count > 0);

  let label, color, Icon;
  if (proofLogsEmpty || anyCoreRed || !exclusionReady) {
    label = "Not Ready";
    color = "#DC2626";
    Icon = XCircle;
  } else if (anyCoreYellow) {
    label = "Needs Review";
    color = "#D97706";
    Icon = AlertTriangle;
  } else {
    label = "Ready";
    color = "#059669";
    Icon = CheckCircle2;
  }

  // ── What is already supported ──
  const supported = [];
  if (!proofLogsEmpty) supported.push("AutomationProofLog records exist");
  coreCaps.filter(c => c.status === "green").forEach(c => {
    supported.push(`${c.label} — proven by real records`);
  });
  if ((deliveryStats.delivered || 0) > 0) supported.push(`${deliveryStats.delivered} delivered SMS in CommunicationLog`);
  if ((deliveryStats.with_provider_message_id || 0) > 0) supported.push(`${deliveryStats.with_provider_message_id} logs with provider_message_id`);
  if (exclusionReady) supported.push("Internal/test record exclusion is active");
  if (missedCallStats.webhook_status === "configured") supported.push("Missed-call webhook is configured and returning 200");

  // ── What is still missing ──
  const missing = [];
  if (proofLogsEmpty) missing.push("AutomationProofLog is empty — no proof records exist");
  coreCaps.filter(c => c.status !== "green").forEach(c => {
    missing.push(`${c.label} — ${c.blockers?.[0] || c.status}`);
  });
  if ((deliveryStats.delivered || 0) === 0) missing.push("No delivered Twilio SMS proof in CommunicationLog");
  if (missedCallStats.has_404) missing.push("Missed-call webhook returning 404");
  if (missedCallStats.has_405) missing.push("Missed-call webhook returning 405");
  if (!exclusionReady) missing.push("Internal record exclusion not ready");
  if ((deliveryStats.weak_proof_count || 0) > 0) missing.push(`${deliveryStats.weak_proof_count} weak proof records (null provider_message_id)`);

  // ── Highest priority gap ──
  let highestGap = null;
  if (proofLogsEmpty) {
    highestGap = { gap: "No proof logs exist", priority: "critical" };
  } else if (anyCoreRed) {
    const firstRed = coreCaps.find(c => c.status === "red");
    highestGap = { gap: `${firstRed?.label} is not ready`, priority: "critical" };
  } else if (missedCallStats.has_404 || missedCallStats.has_405) {
    highestGap = { gap: `Missed-call webhook returning ${missedCallStats.has_404 ? "404" : "405"}`, priority: "high" };
  } else if (!exclusionReady) {
    highestGap = { gap: "Internal record exclusion not ready", priority: "high" };
  } else if ((deliveryStats.delivered || 0) === 0) {
    highestGap = { gap: "No delivered SMS proof", priority: "high" };
  } else if (anyCoreYellow) {
    const firstYellow = coreCaps.find(c => c.status === "yellow");
    highestGap = { gap: `${firstYellow?.label} is partial`, priority: "medium" };
  } else {
    highestGap = { gap: "No gaps detected", priority: "none" };
  }

  // ── Next internal action ──
  let nextAction = "";
  if (proofLogsEmpty) {
    nextAction = "Create AutomationProofLog records for instant_lead_response and missed_call_text_back.";
  } else if (anyCoreRed) {
    const firstRed = coreCaps.find(c => c.status === "red");
    nextAction = firstRed?.next_action || `Resolve blockers for ${firstRed?.label}.`;
  } else if (missedCallStats.has_404 || missedCallStats.has_405) {
    nextAction = `Repair missed-call webhook URL — Twilio is returning ${missedCallStats.has_404 ? "404" : "405"}.`;
  } else if (!exclusionReady) {
    nextAction = "Verify quarantine rules are active and test records are properly tagged.";
  } else if ((deliveryStats.delivered || 0) === 0) {
    nextAction = "Trigger a real lead to generate delivered SMS proof with provider_message_id.";
  } else if (anyCoreYellow) {
    const firstYellow = coreCaps.find(c => c.status === "yellow");
    nextAction = firstYellow?.next_action || `Close remaining gaps for ${firstYellow?.label}.`;
  } else {
    nextAction = "Maintain proof records and monitor for regressions.";
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900">First Launch Scope Summary — Admin Only</h3>
      </div>

      {/* Readiness label */}
      <div
        className="rounded-lg p-3 mb-4 flex items-center gap-3"
        style={{ background: `${color}0D`, border: `1px solid ${color}33` }}
      >
        <Icon className="w-5 h-5 flex-shrink-0" style={{ color }} />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Current Readiness</p>
          <p className="text-base font-bold" style={{ color }}>{label}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* What is already supported */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-2">Already Supported by App Data</p>
          {supported.length > 0 ? (
            <ul className="space-y-1">
              {supported.map((s, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400 italic">Nothing proven yet.</p>
          )}
        </div>

        {/* What is still missing */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500 mb-2">Still Missing</p>
          {missing.length > 0 ? (
            <ul className="space-y-1">
              {missing.map((m, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400 italic">No gaps detected.</p>
          )}
        </div>
      </div>

      {/* Highest priority gap */}
      <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Highest Priority Gap</p>
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
            style={highestGap.priority === "critical"
              ? { color: "#DC2626", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }
              : highestGap.priority === "high"
              ? { color: "#D97706", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)" }
              : highestGap.priority === "medium"
              ? { color: "#6B7280", background: "rgba(107,114,128,0.06)", border: "1px solid rgba(107,114,128,0.2)" }
              : { color: "#059669", background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.2)" }
            }
          >
            {highestGap.priority}
          </span>
        </div>
        <p className="text-xs font-semibold text-gray-700">{highestGap.gap}</p>
      </div>

      {/* Next internal action */}
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
        <ArrowRight className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-0.5">Next Internal Action</p>
          <p className="text-xs text-gray-700 leading-relaxed">{nextAction}</p>
        </div>
      </div>
    </div>
  );
}