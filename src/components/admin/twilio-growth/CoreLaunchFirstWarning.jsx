import { AlertTriangle, Ban } from "lucide-react";

const LATER_SCOPE_KEYS = [
  "ai_voice_receptionist",
  "nurture_sequence_14d",
  "review_request",
  "lead_reactivation",
  "inbound_sms_assistant",
];

const CORE_ITEMS = [
  { label: "Speed-to-Lead Readiness", key: "instant_lead_response" },
  { label: "Recovery Flow Readiness", key: "missed_call_text_back" },
  { label: "Evidence Logging Readiness", proofLogs: true },
  { label: "Internal Record Exclusion", quarantine: true },
];

function isCoreReady(data, item) {
  if (item.proofLogs) return !data?.proof_logs_empty;
  if (item.quarantine) return !!data?.quarantine;
  const cap = (data?.capabilities || []).find(c => c.key === item.key);
  return cap?.status === "green";
}

export default function CoreLaunchFirstWarning({ data, activeView }) {
  const unready = CORE_ITEMS.filter(item => !isCoreReady(data, item));
  const viewingLaterScope = activeView === "repair" || activeView === "blocked" || activeView === "asana";

  if (unready.length === 0 || !viewingLaterScope) return null;

  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{
        background: "linear-gradient(135deg, rgba(220,38,38,0.05), rgba(220,38,38,0.02))",
        border: "1px solid rgba(220,38,38,0.18)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}
      >
        <AlertTriangle className="w-4 h-4 text-red-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-red-700 mb-1">
          Core Launch First — {unready.length} core item{unready.length === 1 ? "" : "s"} not ready
        </p>
        <p className="text-xs text-gray-500 leading-relaxed mb-2">
          You are viewing later-scope capabilities. Core launch items must be proven first before
          investing in secondary features.
        </p>
        <ul className="space-y-1">
          {unready.map(item => (
            <li key={item.key || item.label} className="text-xs text-red-600 flex items-center gap-1.5">
              <Ban className="w-3 h-3 text-red-400 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}