import { AlertTriangle, ShieldAlert } from "lucide-react";

const CORE_LAUNCH_ITEMS = [
  { key: "speed_to_lead", label: "Speed-to-Lead Readiness", capKey: "instant_lead_response" },
  { key: "recovery_flow", label: "Recovery Flow Readiness", capKey: "missed_call_text_back" },
  { key: "evidence_logging", label: "Evidence Logging Readiness", capKey: "automation_proof_logs" },
  { key: "record_exclusion", label: "Internal Record Exclusion Readiness", capKey: null },
];

const LATER_SCOPE_KEYS = [
  "ai_voice_receptionist",
  "nurture_sequence_14d",
  "review_request",
  "lead_reactivation",
  "ai_booking_agent",
  "daily_lead_digest",
  "inbound_sms_assistant",
];

/**
 * Private admin-only warning: shows when lower-priority (later-scope) capabilities
 * are visible before core launch items are ready.
 */
export default function CoreLaunchFirstWarning({ data }) {
  const caps = data?.capabilities || [];
  const proofLogsEmpty = data?.proof_logs_empty;
  const quarantine = data?.quarantine || {};
  const missedCallStats = data?.missed_call_stats || {};

  const isCoreReady = (item) => {
    if (item.key === "record_exclusion") {
      return quarantine && quarantine.rules?.length > 0 && (quarantine.excluded_leads_count || 0) >= 0;
    }
    if (item.key === "evidence_logging") {
      return !proofLogsEmpty;
    }
    if (item.key === "recovery_flow") {
      return !missedCallStats.has_404 && !missedCallStats.has_405 && (missedCallStats.successful_sends || 0) > 0;
    }
    const cap = caps.find((c) => c.key === item.capKey);
    return cap?.status === "green";
  };

  const notReadyCore = CORE_LAUNCH_ITEMS.filter((item) => !isCoreReady(item));
  const visibleLaterScope = caps.filter(
    (c) => LATER_SCOPE_KEYS.includes(c.key) && c.status !== "red"
  );

  if (notReadyCore.length === 0 || visibleLaterScope.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "linear-gradient(135deg, rgba(220,38,38,0.06), rgba(220,38,38,0.02))",
        border: "1px solid rgba(220,38,38,0.2)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)" }}
        >
          <AlertTriangle className="w-4 h-4 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-red-600 mb-1">Core Launch First — Admin Only</p>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">
            Later-scope capabilities are visible before core launch items are ready. Do not invest in
            later-scope features until core launch items are proven by app evidence.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1.5">
                Core Launch Items Not Ready ({notReadyCore.length})
              </p>
              <ul className="space-y-1">
                {notReadyCore.map((item) => (
                  <li key={item.key} className="text-xs text-red-600 flex items-start gap-1.5">
                    <span className="text-red-300 mt-0.5">•</span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-500 mb-1.5">
                Later-Scope Capabilities Visible ({visibleLaterScope.length})
              </p>
              <ul className="space-y-1">
                {visibleLaterScope.map((cap) => (
                  <li key={cap.key} className="text-xs text-amber-600 flex items-start gap-1.5">
                    <span className="text-amber-300 mt-0.5">•</span>
                    <span>{cap.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-white/60 p-2.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-600 leading-relaxed">
              <span className="font-semibold text-red-600">Rule:</span> Later-scope capabilities must stay
              blocked until all four core launch items are proven by real app evidence. Do not mark
              later-scope features as ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}