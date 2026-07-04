import { CheckCircle2, XCircle, AlertTriangle, ListChecks } from "lucide-react";
import EvidenceQualityBadge from "./EvidenceQualityBadge";
import { overallEvidenceQuality } from "./evidenceQuality";

const WORKSTREAMS = [
  {
    id: "audit_truth",
    label: "Audit & Truth Mapping",
    capability_keys: ["automation_proof_logs"],
    description: "Proof log coverage and audit trail for all automations.",
  },
  {
    id: "ai_voice",
    label: "AI Receptionist / Voice Agent",
    capability_keys: ["ai_voice_receptionist", "voice_broadcasts"],
    description: "Inbound voice handling, AI agent, call transcription.",
  },
  {
    id: "missed_call",
    label: "Missed Call Recovery",
    capability_keys: ["missed_call_text_back"],
    description: "Missed-call text-back automation and webhook reliability.",
  },
  {
    id: "speed_to_lead",
    label: "Speed-to-Lead & Follow-Up",
    capability_keys: ["instant_lead_response", "nurture_sequence_14d", "ai_booking_agent"],
    description: "Instant lead response, nurture sequences, booking agent.",
  },
  {
    id: "review_referral",
    label: "Review, Referral & Client Communication",
    capability_keys: ["review_request", "lead_reactivation", "inbound_sms_assistant"],
    description: "Review requests, reactivation, client SMS onboarding.",
  },
  {
    id: "compliance_qa",
    label: "Compliance, Reliability & QA",
    capability_keys: [],
    description: "Test data exclusion, webhook reliability, provider error tracking.",
    cross_cutting: true,
  },
];

export default function AsanaSyncNotes({ capabilities, deliveryStats, missedCallStats, voiceReadiness, proofLogsEmpty }) {
  const capMap = {};
  for (const c of capabilities || []) {
    capMap[c.key] = c;
  }

  const workstreamResults = WORKSTREAMS.map((ws) => {
    const relatedCaps = ws.capability_keys.map((k) => capMap[k]).filter(Boolean);
    const allGreen = relatedCaps.length > 0 && relatedCaps.every((c) => c.status === "green");
    const anyYellow = relatedCaps.some((c) => c.status === "yellow");
    const anyPartialOrGreen = relatedCaps.some((c) => c.status !== "red");

    let status, evidenceExists = [], needsProof = [];

    if (ws.cross_cutting) {
      // Cross-cutting QA/compliance workstream
      const hasFailures = (deliveryStats?.failed || 0) > 0 || (deliveryStats?.without_provider_message_id || 0) > 0;
      const hasWebhookBlock = missedCallStats?.has_404 || missedCallStats?.has_405;
      const hasVoiceConfig = voiceReadiness?.has_elevenlabs_agent_ids || voiceReadiness?.inbound_voice_enabled;

      if (!hasFailures && !hasWebhookBlock && !proofLogsEmpty) {
        status = "complete";
        evidenceExists.push("No active provider failures");
        evidenceExists.push("Webhook route not blocked");
      } else {
        status = "partial";
        if (hasFailures) { evidenceExists.push(`${deliveryStats.failed} failed SMS, ${deliveryStats.without_provider_message_id} without provider ID`); needsProof.push("Resolve provider errors and weak-proof records"); }
        if (hasWebhookBlock) { evidenceExists.push(`Webhook blocked (${missedCallStats.has_404 ? "404" : "405"})`); needsProof.push("Repair webhook route to return 200"); }
        if (proofLogsEmpty) { evidenceExists.push("AutomationProofLog is empty"); needsProof.push("Create proof logs for all automations"); }
      }
    } else {
      if (allGreen) {
        status = "complete";
        relatedCaps.forEach((c) => evidenceExists.push(`${c.label}: proven`));
      } else if (anyPartialOrGreen) {
        status = "partial";
        relatedCaps.forEach((c) => {
          if (c.status === "green") evidenceExists.push(`${c.label}: proven`);
          else if (c.status === "yellow") { evidenceExists.push(`${c.label}: partial`); needsProof.push(`${c.label}: ${c.next_action || "complete remaining proof"}`); }
          else { evidenceExists.push(`${c.label}: not started`); needsProof.push(`${c.label}: ${c.next_action || "implement and prove"}`); }
        });
      } else {
        status = "missing";
        relatedCaps.forEach((c) => {
          evidenceExists.push(`${c.label}: not started`);
          needsProof.push(`${c.label}: ${c.next_action || "implement and prove"}`);
        });
      }
    }

    const markComplete = status === "complete";

    return { ...ws, status, evidenceExists, needsProof, markComplete };
  });

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex items-start gap-2">
        <ListChecks className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          These notes map Twilio Growth Engine workstreams to Asana task completion. A task should only be marked complete in Asana when app data proves the workstream is fully proven. No external systems are contacted from this view.
        </p>
      </div>

      {workstreamResults.map((ws) => (
        <div key={ws.id} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h4 className="text-sm font-bold text-gray-900">{ws.label}</h4>
              <p className="text-xs text-gray-400 mt-0.5">{ws.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusPill status={ws.status} />
              <AsanaCompleteBadge markComplete={ws.markComplete} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">What Evidence Exists</p>
              {ws.evidenceExists.length > 0 ? (
                <ul className="space-y-1">
                  {ws.evidenceExists.map((e, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-gray-300 mt-0.5 flex-shrink-0" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">No evidence found.</p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-500 mb-1.5">What Still Needs Proof</p>
              {ws.needsProof.length > 0 ? (
                <ul className="space-y-1">
                  {ws.needsProof.map((p, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-green-600">Nothing — all proven.</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ status }) {
  const config = {
    complete: { color: "#059669", label: "Complete" },
    partial: { color: "#D97706", label: "Partial" },
    missing: { color: "#DC2626", label: "Missing" },
  };
  const c = config[status] || config.missing;
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap" style={{ color: c.color, background: `${c.color}11`, border: `1px solid ${c.color}30` }}>
      {c.label}
    </span>
  );
}

function AsanaCompleteBadge({ markComplete }) {
  return markComplete ? (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap" style={{ color: "#059669", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.25)" }}>
      <CheckCircle2 className="w-3 h-3" /> Mark Asana: Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap" style={{ color: "#DC2626", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
      <XCircle className="w-3 h-3" /> Mark Asana: No
    </span>
  );
}