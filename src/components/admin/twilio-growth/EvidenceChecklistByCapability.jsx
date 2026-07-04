import { CheckCircle2, XCircle, MinusCircle, Table } from "lucide-react";

const SERVICE_LABELS = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  inbound_sms_assistant: "Inbound SMS Assistant",
  ai_voice_receptionist: "AI Voice Receptionist",
  nurture_sequence_14d: "Nurture Sequence (14-Day)",
  review_request: "Review Request",
  lead_reactivation: "Lead Reactivation",
};

const CAPABILITY_KEYS = [
  "instant_lead_response",
  "missed_call_text_back",
  "inbound_sms_assistant",
  "ai_voice_receptionist",
  "nurture_sequence_14d",
  "review_request",
  "lead_reactivation",
];

function yn(value) {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "unknown";
}

function deriveRow(cap, proofByService, voiceReadiness, missedCallStats, deliveryStats) {
  const proof = proofByService?.[cap.key] || {};
  const capData = cap || {};

  const configPresent = capData.evidence_sources?.some((s) => s.includes("AdminSettings") || s.includes("AutomationChecklist") || s.includes("config"));
  const eventPresent = capData.evidence_sources?.some((s) => s.includes("CommunicationLog") || s.includes("CommunicationEvent") || s.includes("Communication"));
  const proofPresent = (proof.passed || 0) > 0;
  const blockerPresent = (capData.blockers?.length || 0) > 0 || capData.status === "red";
  const launchReady = capData.status === "green" && proofPresent && !blockerPresent;

  return {
    key: cap.key,
    label: SERVICE_LABELS[cap.key] || cap.label || cap.key,
    config: yn(configPresent),
    event: yn(eventPresent),
    proof: yn(proofPresent),
    blocker: yn(blockerPresent),
    launchReady: yn(launchReady),
  };
}

const CELL_STYLES = {
  yes: { color: "#059669", bg: "rgba(5,150,105,0.08)", label: "Yes", icon: CheckCircle2 },
  no: { color: "#DC2626", bg: "rgba(220,38,38,0.06)", label: "No", icon: XCircle },
  unknown: { color: "#6B7280", bg: "rgba(107,114,128,0.08)", label: "—", icon: MinusCircle },
};

function Cell({ value }) {
  const s = CELL_STYLES[value] || CELL_STYLES.unknown;
  const Icon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
      style={{ color: s.color, background: s.bg }}
    >
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
}

export default function EvidenceChecklistByCapability({ data }) {
  const caps = data?.capabilities || [];
  const proofByService = data?.proof_by_service || {};
  const voiceReadiness = data?.voice_readiness || {};
  const missedCallStats = data?.missed_call_stats || {};
  const deliveryStats = data?.delivery_stats || {};

  const rows = CAPABILITY_KEYS.map((key) => {
    const cap = caps.find((c) => c.key === key) || { key };
    return deriveRow(cap, proofByService, voiceReadiness, missedCallStats, deliveryStats);
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Table className="w-4 h-4 text-gray-400" />
        <div>
          <h3 className="text-sm font-bold text-gray-900">Evidence Checklist by Capability — Admin Only</h3>
          <p className="text-xs text-gray-400 mt-0.5">Yes / No / Unknown — computed from current app data. Launch-ready requires config + event + proof + no blocker.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="text-left font-semibold uppercase tracking-wide px-4 py-2.5">Capability</th>
              <th className="text-center font-semibold uppercase tracking-wide px-3 py-2.5">Config</th>
              <th className="text-center font-semibold uppercase tracking-wide px-3 py-2.5">Event / Log</th>
              <th className="text-center font-semibold uppercase tracking-wide px-3 py-2.5">Proof Artifact</th>
              <th className="text-center font-semibold uppercase tracking-wide px-3 py-2.5">Blocker</th>
              <th className="text-center font-semibold uppercase tracking-wide px-3 py-2.5">Launch-Ready</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.key} className="hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-semibold text-gray-900">{r.label}</td>
                <td className="text-center px-3 py-2.5"><Cell value={r.config} /></td>
                <td className="text-center px-3 py-2.5"><Cell value={r.event} /></td>
                <td className="text-center px-3 py-2.5"><Cell value={r.proof} /></td>
                <td className="text-center px-3 py-2.5"><Cell value={r.blocker} /></td>
                <td className="text-center px-3 py-2.5"><Cell value={r.launchReady} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}