import { Zap, ArrowRight, ShieldCheck, FileText, Wrench, Ban } from "lucide-react";
import TwilioGrowthEnginePhaseBadge from "../TwilioGrowthEnginePhaseBadge";
import { computeCapabilityPhase } from "@/lib/twilioGrowthEnginePhases";

const STATUS_LABELS = {
  green: "Proven (green)",
  yellow: "Partial (yellow)",
  red: "Not Done (red)",
};

const COMPLEXITY_STYLES = {
  low: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)" },
  medium: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)" },
  high: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)" },
};

/**
 * Builds the fastest safe path to green for a single capability.
 * Rules: never suggest skipping proof, never suggest public claims before trusted.
 */
function buildPath(cap, auditData) {
  const phaseInfo = computeCapabilityPhase(cap, auditData);
  const phase = phaseInfo.phase;
  const blockers = cap.blockers || [];
  const proof = cap.proof || { total: 0, passed: 0, pending: 0, failed: 0 };
  const deliveryStats = auditData?.delivery_stats;
  const voiceReadiness = auditData?.voice_readiness;
  const missedCallStats = auditData?.missed_call_stats;

  let nextProof = "";
  let nextConfig = "";
  nextBlocker: "";
  let complexity = "medium";
  let fastestStep = "";

  // ── Capability-specific path logic ──
  switch (cap.key) {
    case "instant_lead_response":
      nextProof = "AutomationProofLog pass for instant_lead_response + CommunicationLog with delivery_status=delivered on a real (non-test) lead.";
      nextConfig = "Twilio from number + SMS status callback URL configured and returning 200.";
      if (deliveryStats?.delivered === 0) {
        nextBlocker = "No delivered Twilio SMS proof — delivery_status=delivered missing.";
        complexity = "medium";
        fastestStep = "Submit a real test lead and confirm the SMS status callback records delivery_status=delivered in CommunicationLog.";
      } else if (proof.passed === 0) {
        nextBlocker = "No AutomationProofLog pass record exists.";
        complexity = "low";
        fastestStep = "Create and pass an AutomationProofLog for instant_lead_response once a delivered SMS exists.";
      } else {
        nextBlocker = "None — proof exists.";
        complexity = "low";
        fastestStep = "Maintain proof records. No public claim until Phase 4.";
      }
      break;

    case "missed_call_text_back":
      nextProof = "AutomationProofLog pass for missed_call_text_back + inbound call event with follow-up SMS evidence.";
      nextConfig = "Missed-call webhook URL configured in Twilio and returning 200 (no 404/405).";
      if (missedCallStats?.has_404 || missedCallStats?.has_405) {
        nextBlocker = `Webhook returning ${missedCallStats?.has_404 ? "404" : "405"} — route is broken.`;
        complexity = "medium";
        fastestStep = "Repair the missed-call webhook URL in Twilio console so it returns 200, then trigger a real test missed call.";
      } else if (missedCallStats?.sms_attempts === 0) {
        nextBlocker = "No missed-call SMS attempts logged.";
        complexity = "medium";
        fastestStep = "Trigger a real test missed call to generate SMS attempt logs in CommunicationLog.";
      } else if (proof.passed === 0) {
        nextBlocker = "No AutomationProofLog pass record exists.";
        complexity = "low";
        fastestStep = "Create and pass an AutomationProofLog for missed_call_text_back.";
      } else {
        nextBlocker = "None — proof exists.";
        complexity = "low";
        fastestStep = "Maintain proof records. No public claim until Phase 4.";
      }
      break;

    case "nurture_sequence_14d":
      nextProof = "AutomationProofLog pass + CommunicationLog with provider_message_id for each outbound step, valid lead ID, stop-on-reply behavior.";
      nextConfig = "Cadence settings configured (max attempts, pause-on-reply, engagement threshold).";
      if (!deliveryStats || deliveryStats.with_provider_message_id === 0) {
        nextBlocker = "Missing provider_message_id on outbound nurture messages.";
        complexity = "high";
        fastestStep = "Ensure nurture SMS sends include provider_message_id and valid lead IDs, then create proof log.";
      } else if (proof.passed === 0) {
        nextBlocker = "No AutomationProofLog pass record exists.";
        complexity = "medium";
        fastestStep = "Create and pass an AutomationProofLog for nurture_sequence_14d with stop-on-reply proof.";
      } else {
        nextBlocker = "None — proof exists.";
        complexity = "low";
        fastestStep = "Maintain proof records. No public claim until Phase 4.";
      }
      break;

    case "ai_voice_receptionist":
      nextProof = "AutomationProofLog pass + inbound voice CommunicationEvent with meaningful call_summary or non-empty transcript.";
      nextConfig = "ElevenLabs agent IDs + phone number IDs configured, inbound_voice_enabled=true.";
      if (!voiceReadiness?.has_elevenlabs_agent_ids) {
        nextBlocker = "Missing ElevenLabs agent IDs.";
        complexity = "high";
        fastestStep = "Configure ElevenLabs agent IDs and phone number IDs in AdminSettings.";
      } else if (!voiceReadiness?.has_transcript_proof) {
        nextBlocker = "No live call transcript proof — ringing-only events are insufficient.";
        complexity = "high";
        fastestStep = "Run a real inbound call test to generate a transcript on WebsiteLead or CommunicationEvent.";
      } else if (proof.passed === 0) {
        nextBlocker = "No AutomationProofLog pass record exists.";
        complexity = "medium";
        fastestStep = "Create and pass an AutomationProofLog for ai_voice_receptionist after transcript exists.";
      } else {
        nextBlocker = "None — proof exists.";
        complexity = "low";
        fastestStep = "Maintain proof records. No public claim until Phase 4.";
      }
      break;

    case "review_request":
      nextProof = "AutomationProofLog pass + review_link_set=true + logged outbound communication event.";
      nextConfig = "Review link configured in AutomationChecklist (review_link_set).";
      if (proof.passed === 0) {
        nextBlocker = "No AutomationProofLog pass record exists.";
        complexity = "medium";
        fastestStep = "Configure review link, send a real review request, then create and pass proof log.";
      } else {
        nextBlocker = "None — proof exists.";
        complexity = "low";
        fastestStep = "Maintain proof records. No public claim until Phase 4.";
      }
      break;

    case "lead_reactivation":
      nextProof = "AutomationProofLog pass + dormant lead segment identified + logged reactivation CommunicationEvent or CommunicationLog.";
      nextConfig = "Reactivation workflow/entity created (no placeholder).";
      if (proof.passed === 0) {
        nextBlocker = "No real referral/reactivation flow or automation exists.";
        complexity = "high";
        fastestStep = "Build a real reactivation flow with a dormant lead segment, send outreach, then create proof log.";
      } else {
        nextBlocker = "None — proof exists.";
        complexity = "low";
        fastestStep = "Maintain proof records. No public claim until Phase 4.";
      }
      break;

    case "inbound_sms_assistant":
      nextProof = "AutomationProofLog pass + inbound SMS CommunicationEvent with classification/response record.";
      nextConfig = "Inbound SMS webhook configured and returning 200.";
      if (proof.passed === 0) {
        nextBlocker = "No AutomationProofLog pass record exists.";
        complexity = "medium";
        fastestStep = "Send a real inbound SMS, confirm classification/response is logged, then create proof log.";
      } else {
        nextBlocker = "None — proof exists.";
        complexity = "low";
        fastestStep = "Maintain proof records. No public claim until Phase 4.";
      }
      break;

    case "ai_booking_agent":
      nextProof = "AutomationProofLog pass + live call transcript or call_summary on WebsiteLead.";
      nextConfig = "ElevenLabs agent configured for booking agent role.";
      if (!voiceReadiness?.has_transcript_proof) {
        nextBlocker = "No live call transcript proof.";
        complexity = "high";
        fastestStep = "Run a real inbound call to generate transcript proof on WebsiteLead.";
      } else if (proof.passed === 0) {
        nextBlocker = "No AutomationProofLog pass record exists.";
        complexity = "medium";
        fastestStep = "Create and pass an AutomationProofLog for ai_booking_agent.";
      } else {
        nextBlocker = "None — proof exists.";
        complexity = "low";
        fastestStep = "Maintain proof records. No public claim until Phase 4.";
      }
      break;

    case "voice_broadcasts":
      nextProof = "AutomationProofLog pass + outbound voice call evidence with delivery confirmation.";
      nextConfig = "voice_calls_enabled=true, ElevenLabs agent + phone number IDs configured.";
      if (!voiceReadiness?.voice_calls_enabled) {
        nextBlocker = "voice_calls_enabled is false.";
        complexity = "high";
        fastestStep = "Enable voice_calls_enabled after configuring ElevenLabs, then run a real broadcast test.";
      } else if (proof.passed === 0) {
        nextBlocker = "No AutomationProofLog pass record exists.";
        complexity = "medium";
        fastestStep = "Create and pass an AutomationProofLog for voice_broadcasts.";
      } else {
        nextBlocker = "None — proof exists.";
        complexity = "low";
        fastestStep = "Maintain proof records. No public claim until Phase 4.";
      }
      break;

    case "automation_proof_logs":
      nextProof = "At least one AutomationProofLog with status=pass.";
      nextConfig = "AutomationProofLog entity accessible and recordProofLog function available.";
      if (proof.total === 0) {
        nextBlocker = "AutomationProofLog is empty — no go-live proof evidence exists.";
        complexity = "low";
        fastestStep = "Create AutomationProofLog records for each automation service before claiming go-live.";
      } else if (proof.passed === 0) {
        nextBlocker = "Proof logs exist but none passed.";
        complexity = "low";
        fastestStep = "Review pending/failed proof logs and resolve blockers.";
      } else {
        nextBlocker = "None — proof logs exist and passed.";
        complexity = "low";
        fastestStep = "Continue maintaining proof logs for all automations.";
      }
      break;

    default:
      nextProof = "AutomationProofLog pass record.";
      nextConfig = "Service-specific configuration.";
      nextBlocker = blockers[0] || "Not configured.";
      complexity = "medium";
      fastestStep = cap.next_action || "Configure this capability and create proof evidence.";
  }

  // Already trusted
  if (phase === 4) {
    fastestStep = "Trusted. Maintain proof records and monitor for regressions. Do not make public claims that exceed what proof supports.";
  }

  return { phase, nextProof, nextConfig, nextBlocker, complexity, fastestStep };
}

export default function FastestPathToGreen({ capabilities, auditData }) {
  if (!capabilities || capabilities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-400">No capabilities available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-2">
        <Zap className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-blue-700 font-semibold mb-1">Fastest Path to Green — Admin Only</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            For each capability, the shortest safe path from current phase to trusted (Phase 4).
            Proof is never skippable. No public claims should be made until Phase 4 is reached.
          </p>
        </div>
      </div>

      {/* Capability cards */}
      {capabilities.map((cap) => {
        const path = buildPath(cap, auditData);
        const phaseInfo = computeCapabilityPhase(cap, auditData);
        const complexityStyle = COMPLEXITY_STYLES[path.complexity] || COMPLEXITY_STYLES.medium;
        const isTrusted = path.phase === 4;

        return (
          <div
            key={cap.key}
            className="bg-white rounded-xl border p-5"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)", borderColor: isTrusted ? "rgba(5,150,105,0.25)" : "#E5E7EB" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-900">{cap.label}</p>
                <TwilioGrowthEnginePhaseBadge phase={path.phase} showLabel />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Complexity</span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ color: complexityStyle.color, background: complexityStyle.bg, border: `1px solid ${complexityStyle.border}` }}
                >
                  {path.complexity}
                </span>
              </div>
            </div>

            {/* Current status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Current Phase / Status</p>
                <p className="text-xs text-gray-700">
                  {phaseInfo.phase_label} · {STATUS_LABELS[cap.status] || cap.status}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Fastest Safe Next Step</p>
                <p className="text-xs text-gray-700 flex items-start gap-1.5">
                  <ArrowRight className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{path.fastestStep}</span>
                </p>
              </div>
            </div>

            {/* Path details */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              {/* Next required proof */}
              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Next Required Proof</p>
                  <p className="text-xs text-gray-600 mt-0.5">{path.nextProof}</p>
                </div>
              </div>

              {/* Next required configuration */}
              <div className="flex items-start gap-2">
                <Wrench className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Next Required Configuration</p>
                  <p className="text-xs text-gray-600 mt-0.5">{path.nextConfig}</p>
                </div>
              </div>

              {/* Next blocker to remove */}
              <div className="flex items-start gap-2">
                {isTrusted ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Ban className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-wide ${isTrusted ? "text-green-500" : "text-red-400"}`}>
                    Next Blocker to Remove
                  </p>
                  <p className={`text-xs mt-0.5 ${isTrusted ? "text-green-600" : "text-red-600"}`}>{path.nextBlocker}</p>
                </div>
              </div>
            </div>

            {/* Safety reminder */}
            {!isTrusted && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 italic">
                  ⚠ Do not make public claims for this capability until it reaches Phase 4 (trusted). Do not skip proof steps.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}