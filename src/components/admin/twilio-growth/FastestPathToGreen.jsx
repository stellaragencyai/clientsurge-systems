import { computePhase } from "@/lib/twilioGrowthEnginePhases";
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const STATUS_LABELS = {
  green: "Trusted (Green)",
  yellow: "Partial (Yellow)",
  red: "Missing (Red)",
};

const COMPLEXITY_STYLES = {
  low: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)" },
  medium: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)" },
  high: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)" },
};

/**
 * Fastest Path to Green — shows the shortest safe path from current phase/status to trusted status.
 * Does not suggest skipping proof. Does not suggest public claims before trusted status.
 */
export default function FastestPathToGreen({ data }) {
  if (!data) return null;

  const caps = data.capabilities || [];
  const delivery = data.delivery_stats || {};
  const missed = data.missed_call_stats || {};
  const voice = data.voice_readiness || {};
  const proofByService = data.proof_by_service || {};

  const items = caps.map(cap => {
    const phaseInfo = computePhase(cap);
    const proof = cap.service_key ? (proofByService[cap.service_key] || {}) : {};
    const hasProofPassed = (proof.passed || 0) > 0;
    const hasBlockers = (cap.blockers || []).length > 0;

    // Determine next required proof
    let nextRequiredProof = "Create and pass an AutomationProofLog record for this capability.";
    if (cap.key === "instant_lead_response") {
      nextRequiredProof = "AutomationProofLog pass for instant_lead_response, plus a delivered SMS tied to a real production lead with valid provider_message_id.";
    } else if (cap.key === "missed_call_text_back") {
      nextRequiredProof = "AutomationProofLog pass for missed_call_text_back, plus a missed-call SMS attempt with successful delivery (no 404/405 webhook blocker).";
    } else if (cap.key === "ai_voice_receptionist") {
      nextRequiredProof = "AutomationProofLog pass for ai_voice_receptionist, plus a real inbound call with a meaningful transcript or call summary.";
    } else if (cap.key === "nurture_sequence_14d") {
      nextRequiredProof = "AutomationProofLog pass for nurture_sequence_14d, plus sequence enrollment with valid lead IDs and delivery proof for each step.";
    } else if (cap.key === "review_request") {
      nextRequiredProof = "AutomationProofLog pass for review_request, plus review_link_set=true and a logged outbound review communication event.";
    } else if (cap.key === "lead_reactivation") {
      nextRequiredProof = "AutomationProofLog pass for lead_reactivation, plus a dormant lead segment with a logged reactivation CommunicationEvent.";
    } else if (cap.key === "inbound_sms_assistant") {
      nextRequiredProof = "AutomationProofLog pass for inbound_sms_assistant, plus an inbound SMS CommunicationEvent with classification/response record.";
    } else if (cap.key === "ai_booking_agent") {
      nextRequiredProof = "AutomationProofLog pass for ai_booking_agent, plus a real call transcript on a WebsiteLead record.";
    } else if (cap.key === "voice_broadcasts") {
      nextRequiredProof = "AutomationProofLog pass for voice broadcasts, plus voice_calls_enabled=true with a real outbound call test.";
    } else if (cap.key === "automation_proof_logs") {
      nextRequiredProof = "Maintain passed AutomationProofLog records for all automation services.";
    }

    // Determine next required configuration
    let nextRequiredConfig = "Verify AdminSettings and AutomationChecklist configuration for this service.";
    if (cap.key === "ai_voice_receptionist") {
      nextRequiredConfig = voice.has_elevenlabs_agent_ids
        ? "Enable inbound_voice_enabled in AdminSettings (agent IDs already configured)."
        : "Configure ElevenLabs agent IDs and phone number IDs in AdminSettings.";
    } else if (cap.key === "missed_call_text_back") {
      nextRequiredConfig = missed.has_404 || missed.has_405
        ? "Repair missed_call_webhook_url — currently returning 404/405."
        : "Verify missed_call_webhook_url is set and returning 200.";
    } else if (cap.key === "instant_lead_response") {
      nextRequiredConfig = "Verify twilio_from_number, twilio_account_sid, and twilio_auth_token are configured in AdminSettings.";
    } else if (cap.key === "review_request") {
      nextRequiredConfig = "Set review_link_set=true on the AutomationChecklist for this client.";
    }

    // Determine next blocker to remove
    const nextBlocker = cap.blockers?.[0] || (hasBlockers ? "Resolve active blockers listed in the capability matrix." : "No active blockers — maintain current state.");

    // Determine complexity
    let complexity = "medium";
    if (cap.status === "green") complexity = "low";
    else if (cap.status === "red" && phaseInfo.phase <= 1) complexity = "high";
    else if (cap.key === "ai_voice_receptionist" || cap.key === "voice_broadcasts") complexity = "high";
    else if (cap.key === "lead_reactivation") complexity = "high";
    else if (cap.key === "instant_lead_response" || cap.key === "missed_call_text_back") complexity = "low";

    // Fastest safe next step
    let fastestStep = "";
    if (cap.status === "green") {
      fastestStep = "Already trusted. Maintain proof records and monitor for regressions.";
    } else if (phaseInfo.phase === 0) {
      fastestStep = "Configure schema and integration settings to begin. No proof can be generated until configuration exists.";
    } else if (phaseInfo.phase === 1) {
      fastestStep = "Generate real activity logs or events tied to a production lead. Do not skip to proof without real activity.";
    } else if (phaseInfo.phase === 2) {
      fastestStep = "Create and pass an AutomationProofLog record. Do not mark as trusted until proof passes.";
    } else if (phaseInfo.phase === 3) {
      fastestStep = "Resolve all active blockers. Proof exists but blockers prevent trusted status. Do not make public claims until blockers are cleared.";
    } else {
      fastestStep = "Create and pass AutomationProofLog, then resolve any blockers. Do not skip proof or make public claims before trusted status.";
    }

    return {
      key: cap.key,
      label: cap.label,
      currentPhase: phaseInfo.phase,
      currentStatus: cap.status,
      statusLabel: STATUS_LABELS[cap.status] || cap.status,
      nextRequiredProof,
      nextRequiredConfig,
      nextBlocker,
      complexity,
      fastestStep,
      hasProofPassed,
      hasBlockers,
    };
  });

  return (
    <div className="space-y-4">
      {/* Explanation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <p className="text-xs text-gray-500 leading-relaxed">
          Shows the shortest safe path from current phase/status to trusted (green) for each capability.
          Proof is never skipped. Public claims are never suggested before trusted status.
        </p>
      </div>

      {/* Items */}
      {items.map(item => {
        const phaseLabel = `Phase ${item.currentPhase}`;
        const complexityStyle = COMPLEXITY_STYLES[item.complexity];
        const Icon = item.currentStatus === "green" ? CheckCircle2 : item.currentStatus === "yellow" ? AlertTriangle : XCircle;
        return (
          <div key={item.key} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" style={{ color: item.currentStatus === "green" ? "#059669" : item.currentStatus === "yellow" ? "#D97706" : "#DC2626" }} />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{item.label}</h4>
                  <p className="text-[11px] text-gray-400">{item.statusLabel} · {phaseLabel}</p>
                </div>
              </div>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{
                color: complexityStyle.color,
                background: complexityStyle.bg,
                border: `1px solid ${complexityStyle.border}`,
              }}>
                {item.complexity.toUpperCase()} complexity
              </span>
            </div>
            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Next Required Proof</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.nextRequiredProof}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Next Required Configuration</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.nextRequiredConfig}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Next Blocker to Remove</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.nextBlocker}</p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 mt-2">
                <div className="flex items-start gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-400 mb-0.5">Fastest Safe Next Step</p>
                    <p className="text-xs text-blue-700 leading-relaxed">{item.fastestStep}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}