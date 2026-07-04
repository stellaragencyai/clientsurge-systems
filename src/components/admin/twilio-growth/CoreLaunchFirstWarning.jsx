import { AlertTriangle, Ban, CheckCircle2 } from "lucide-react";

const CORE_LAUNCH_ITEMS = [
  { key: "speed_to_lead", label: "Speed-to-Lead Readiness", capKey: "instant_lead_response" },
  { key: "recovery_flow", label: "Recovery Flow Readiness", capKey: "missed_call_text_back" },
  { key: "evidence_logging", label: "Evidence Logging Readiness", capKey: "automation_proof_logs" },
  { key: "internal_exclusion", label: "Internal Record Exclusion Readiness", capKey: "internal_record_exclusion" },
];

const LATER_SCOPE_KEYS = [
  "ai_voice_receptionist",
  "review_request",
  "lead_reactivation",
  "nurture_sequence_14d",
  "inbound_sms_assistant",
];

function isCoreReady(data, item) {
  const caps = data?.capabilities || [];
  const cap = caps.find((c) => c.key === item.capKey);

  if (item.key === "evidence_logging") {
    return !data?.proof_logs_empty;
  }
  if (item.key === "internal_exclusion") {
    const q = data?.quarantine;
    return !!q && q.excluded_leads_count >= 0;
  }
  if (!cap) return false;
  return cap.status === "green";
}

export default function CoreLaunchFirstWarning({ data, activeView }) {
  const caps = data?.capabilities || [];
  const viewingLaterScope =
    activeView === "capabilities" || activeView === "proof" || activeView === "qa"
      ? caps.some((c) => LATER_SCOPE_KEYS.includes(c.key))
      : true;

  const coreStatus = CORE_LAUNCH_ITEMS.map((item) => ({
    ...item,
    ready: isCoreReady(data, item),
  }));
  const notReady = coreStatus.filter((c) => !c.ready);

  if (notReady.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-4 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
        <p className="text-xs text-green-700 font-semibold">
          All core launch items are ready — later-scope capabilities can proceed safely.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-5 flex items-start gap-3"
      style={{
        background: "linear-gradient(135deg, rgba(220,38,38,0.06), rgba(220,38,38,0.02))",
        border: "1px solid rgba(220,38,38,0.2)",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)" }}
      >
        <Ban className="w-4 h-4 text-red-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-red-700 mb-1">Core Launch First — Admin Only</p>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          Later-scope capabilities are visible, but {notReady.length} core launch {notReady.length === 1 ? "item" : "items"}{" "}
          {notReady.length === 1 ? "is" : "are"} not yet ready. Lower-priority work should not advance until core launch
          items are proven.
        </p>
        <div className="space-y-1.5">
          {notReady.map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-red-700">{item.label}</span>
              <span className="text-[11px] text-gray-400">— not ready</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}