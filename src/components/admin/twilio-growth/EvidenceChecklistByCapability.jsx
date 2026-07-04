import { Table, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

const CAPABILITY_KEYS = [
  "instant_lead_response",
  "missed_call_text_back",
  "inbound_sms_assistant",
  "ai_voice_receptionist",
  "nurture_sequence_14d",
  "review_request",
  "lead_reactivation",
];

const SERVICE_LABELS = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  inbound_sms_assistant: "Inbound SMS Assistant",
  ai_voice_receptionist: "AI Voice Receptionist",
  nurture_sequence_14d: "Nurture Sequence (14-Day)",
  review_request: "Review Request",
  lead_reactivation: "Lead Reactivation",
};

function yn(status) {
  if (status === true) return "yes";
  if (status === false) return "no";
  return "unknown";
}

const VALUE_STYLES = {
  yes: { color: "#059669", icon: CheckCircle2, label: "Yes" },
  no: { color: "#DC2626", icon: XCircle, label: "No" },
  unknown: { color: "#6B7280", icon: MinusCircle, label: "Unknown" },
};

function evalRow(data, capKey) {
  const caps = data?.capabilities || [];
  const cap = caps.find((c) => c.key === capKey);
  const proof = data?.proof_by_service?.[capKey] || {};

  const configPresent = cap ? cap.evidence_sources?.length > 0 : null;
  const eventPresent = cap ? cap.status !== "red" : null;
  const proofPresent = proof.passed > 0;
  const blockerPresent = cap ? (cap.blockers?.length || 0) > 0 : null;
  const launchReady = cap ? cap.status === "green" : false;

  return {
    label: SERVICE_LABELS[capKey] || capKey,
    config: yn(configPresent),
    event: yn(eventPresent),
    proof: yn(proofPresent),
    blocker: yn(blockerPresent),
    ready: yn(launchReady),
  };
}

export default function EvidenceChecklistByCapability({ data }) {
  const rows = CAPABILITY_KEYS.map((key) => evalRow(data, key));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Evidence Checklist by Capability — Admin Only</h3>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          Yes/no/unknown based on current app data. No status is inferred without evidence.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Capability</th>
              <th className="text-center">Config Present</th>
              <th className="text-center">Event/Log Present</th>
              <th className="text-center">Proof Artifact Present</th>
              <th className="text-center">Blocker Present</th>
              <th className="text-center">Launch-Ready</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="text-left font-semibold text-gray-900">{row.label}</td>
                {["config", "event", "proof", "blocker", "ready"].map((col) => {
                  const style = VALUE_STYLES[row[col]];
                  const Icon = style.icon;
                  return (
                    <td key={col} className="text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: style.color }}>
                        <Icon className="w-3 h-3" />
                        {style.label}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}