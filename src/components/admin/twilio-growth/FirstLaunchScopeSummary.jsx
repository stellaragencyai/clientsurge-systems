import {
  CheckCircle2, AlertTriangle, XCircle, Rocket, ArrowRight,
} from "lucide-react";

/**
 * Admin-only launch-readiness summary card for the First Launch Scope.
 *
 * The First Launch Scope = Speed-to-Lead (instant_lead_response) + Missed Call Recovery (missed_call_text_back).
 *
 * Label logic (derived only from current app evidence):
 * - ready: both first-scope capabilities are green (proven by proof logs + evidence)
 * - needs_review: at least one is yellow (partial), none are red
 * - not_ready: at least one is red, or proof_logs_empty is true
 *
 * Shows: current readiness label, what's already supported, what's still missing,
 * highest priority gap, and next internal action.
 */

const FIRST_SCOPE_CAPABILITY_KEYS = [
  "instant_lead_response",
  "missed_call_text_back",
];

const CAPABILITY_LABELS = {
  instant_lead_response: "Speed-to-Lead (Instant Lead Response)",
  missed_call_text_back: "Missed Call Recovery",
};

const LABEL_STYLES = {
  ready: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Ready" },
  needs_review: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Needs Review" },
  not_ready: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Not Ready" },
};

function computeReadiness(data) {
  const capabilities = data?.capabilities || [];
  const proofByService = data?.proof_by_service || {};
  const proofLogsEmpty = data?.proof_logs_empty;

  const scopeCaps = capabilities.filter(c => FIRST_SCOPE_CAPABILITY_KEYS.includes(c.key));

  // If proof logs are empty entirely, we cannot be ready
  if (proofLogsEmpty) {
    return { label: "not_ready" };
  }

  // If we can't find the scope capabilities at all
  if (scopeCaps.length === 0) {
    return { label: "not_ready" };
  }

  const hasRed = scopeCaps.some(c => c.status === "red");
  const hasYellow = scopeCaps.some(c => c.status === "yellow");
  const allGreen = scopeCaps.every(c => c.status === "green");

  if (hasRed) return { label: "not_ready" };
  if (allGreen) return { label: "ready" };
  if (hasYellow) return { label: "needs_review" };

  return { label: "not_ready" };
}

function buildSupportedItems(data) {
  const items = [];
  const capabilities = data?.capabilities || [];
  const deliveryStats = data?.delivery_stats || {};
  const missedCallStats = data?.missed_call_stats || {};
  const settings = data?.settings_summary || {};
  const proofByService = data?.proof_by_service || {};

  // Speed-to-Lead evidence
  const ilrCap = capabilities.find(c => c.key === "instant_lead_response");
  const ilrProof = proofByService["instant_lead_response"] || { passed: 0 };
  if (ilrCap?.status === "green") items.push("Speed-to-Lead capability marked green (proven)");
  if (ilrProof.passed > 0) items.push(`Speed-to-Lead proof log passed (${ilrProof.passed} record${ilrProof.passed !== 1 ? "s" : ""})`);
  if (deliveryStats.delivered > 0) items.push(`${deliveryStats.delivered} delivered SMS in CommunicationLog`);
  if (deliveryStats.with_provider_message_id > 0) items.push(`${deliveryStats.with_provider_message_id} SMS logs with valid provider_message_id`);
  if (settings.twilio_enabled && settings.twilio_from_number) items.push("Twilio enabled with from-number configured");

  // Missed call recovery evidence
  const mcCap = capabilities.find(c => c.key === "missed_call_text_back");
  const mcProof = proofByService["missed_call_text_back"] || { passed: 0 };
  if (mcCap?.status === "green") items.push("Missed Call Recovery capability marked green (proven)");
  if (mcProof.passed > 0) items.push(`Missed Call proof log passed (${mcProof.passed} record${mcProof.passed !== 1 ? "s" : ""})`);
  if (missedCallStats.sms_attempts > 0) items.push(`${missedCallStats.sms_attempts} missed-call SMS attempts logged`);
  if (missedCallStats.successful_sends > 0) items.push(`${missedCallStats.successful_sends} successful missed-call sends`);
  if (missedCallStats.webhook_url && missedCallStats.webhook_status !== "blocked") items.push("Missed-call webhook configured and not blocked");

  return items;
}

function buildMissingItems(data) {
  const items = [];
  const capabilities = data?.capabilities || [];
  const deliveryStats = data?.delivery_stats || {};
  const missedCallStats = data?.missed_call_stats || {};
  const settings = data?.settings_summary || {};
  const proofByService = data?.proof_by_service || {};

  // Speed-to-Lead gaps
  const ilrCap = capabilities.find(c => c.key === "instant_lead_response");
  const ilrProof = proofByService["instant_lead_response"] || { passed: 0 };
  if (ilrProof.passed === 0) items.push("No passed AutomationProofLog for instant_lead_response");
  if (deliveryStats.delivered === 0) items.push("No delivered SMS proof in CommunicationLog");
  if (deliveryStats.weak_proof_count > 0) items.push(`${deliveryStats.weak_proof_count} weak-proof records (null provider_message_id + sent status)`);
  if (!settings.sms_webhook_url) items.push("sms_webhook_url not set in AdminSettings");

  // Missed call gaps
  const mcCap = capabilities.find(c => c.key === "missed_call_text_back");
  const mcProof = proofByService["missed_call_text_back"] || { passed: 0 };
  if (mcProof.passed === 0) items.push("No passed AutomationProofLog for missed_call_text_back");
  if (missedCallStats.has_404) items.push("Missed-call webhook returning 404");
  if (missedCallStats.has_405) items.push("Missed-call webhook returning 405");
  if (!missedCallStats.webhook_url) items.push("missed_call_webhook_url not set");
  if (missedCallStats.sms_attempts === 0) items.push("No missed-call SMS attempts logged");
  if (ilrCap?.status !== "green") items.push("Speed-to-Lead capability not yet green");
  if (mcCap?.status !== "green") items.push("Missed Call Recovery capability not yet green");

  return items;
}

function computeHighestPriorityGap(data) {
  const missing = buildMissingItems(data);
  const missedCallStats = data?.missed_call_stats || {};
  const proofByService = data?.proof_by_service || {};

  // Priority 1: proof logs
  const ilrProof = proofByService["instant_lead_response"] || { passed: 0 };
  const mcProof = proofByService["missed_call_text_back"] || { passed: 0 };
  if (ilrProof.passed === 0 && mcProof.passed === 0) {
    return "No passed proof logs exist for either first-scope capability — create and pass AutomationProofLog records for instant_lead_response and missed_call_text_back.";
  }
  if (ilrProof.passed === 0) {
    return "Speed-to-Lead has no passed proof log — create and pass an AutomationProofLog for instant_lead_response.";
  }
  if (mcProof.passed === 0) {
    return "Missed Call Recovery has no passed proof log — create and pass an AutomationProofLog for missed_call_text_back.";
  }

  // Priority 2: webhook blockers
  if (missedCallStats.has_404 || missedCallStats.has_405) {
    return `Missed-call webhook is returning ${missedCallStats.has_404 ? "404" : "405"} — repair the webhook URL before any recovery can be trusted.`;
  }

  // Priority 3: delivery proof
  const deliveryStats = data?.delivery_stats || {};
  if (deliveryStats.delivered === 0) {
    return "No delivered SMS proof in CommunicationLog — trigger a real non-test lead and confirm Twilio delivery callback.";
  }
  if (deliveryStats.weak_proof_count > 0) {
    return `${deliveryStats.weak_proof_count} weak-proof records — ensure Twilio status callbacks populate provider_message_id.`;
  }

  if (missing.length === 0) return null;
  return missing[0];
}

function computeNextAction(data) {
  const gap = computeHighestPriorityGap(data);
  if (gap) return gap;

  // If no gaps, maintain
  return "No blockers remain for first launch scope — maintain proof records and monitor for regression.";
}

export default function FirstLaunchScopeSummary({ data }) {
  if (!data) return null;

  const { label } = computeReadiness(data);
  const style = LABEL_STYLES[label];
  const Icon = style.icon;

  const supported = buildSupportedItems(data);
  const missing = buildMissingItems(data);
  const highestGap = computeHighestPriorityGap(data);
  const nextAction = computeNextAction(data);

  return (
    <div
      className="rounded-xl p-5 border"
      style={{ background: style.bg, borderColor: style.border }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "white", border: `1px solid ${style.border}` }}
        >
          <Rocket className="w-5 h-5" style={{ color: style.color }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-900">First Launch Scope Summary</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Speed-to-Lead + Missed Call Recovery — admin-only readiness assessment.
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold flex-shrink-0"
          style={{ color: style.color, background: "white", border: `1px solid ${style.border}` }}
        >
          <Icon className="w-3.5 h-3.5" />
          {style.label}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* What's already supported */}
        <div className="rounded-lg border border-gray-100 bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            Already Supported by App Data
          </p>
          {supported.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic">No supporting evidence found yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {supported.map((item, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* What's still missing */}
        <div className="rounded-lg border border-gray-100 bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
            <XCircle className="w-3 h-3 text-red-400" />
            Still Missing
          </p>
          {missing.length === 0 ? (
            <p className="text-[11px] text-green-600 font-semibold">No gaps detected — all evidence present.</p>
          ) : (
            <ul className="space-y-1.5">
              {missing.map((item, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Highest priority gap */}
      {highestGap && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50/50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500 mb-1">
            Highest Priority Gap
          </p>
          <p className="text-xs text-red-700 font-medium leading-relaxed">{highestGap}</p>
        </div>
      )}

      {/* Next internal action */}
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 flex items-start gap-3">
        <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Next Internal Action</p>
          <p className="text-xs text-gray-700 leading-relaxed">{nextAction}</p>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-4 text-[10px] text-gray-400 leading-relaxed">
        This label is computed only from current app data (AutomationProofLog, CommunicationLog, CommunicationEvent, AdminSettings).
        It does not reflect external provider state or manual claims. Admin-only — not shown on public pages.
      </p>
    </div>
  );
}