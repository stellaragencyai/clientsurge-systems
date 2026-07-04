import { CheckCircle2, ArrowRight } from "lucide-react";
import { computePhase, PHASE_LABELS } from "@/lib/twilioGrowthEnginePhases";

const COMPLEXITY = {
  instant_lead_response: { complexity: "medium", reason: "Requires a real non-test lead, Twilio delivery callback, and proof log." },
  missed_call_text_back: { complexity: "medium", reason: "Requires webhook route repair if 404/405, plus real missed-call test and proof log." },
  inbound_sms_assistant: { complexity: "medium", reason: "Requires inbound SMS event, classification, and proof log." },
  ai_voice_receptionist: { complexity: "high", reason: "Requires ElevenLabs agent IDs, phone number IDs, live call test, transcript, and proof log." },
  nurture_sequence_14d: { complexity: "high", reason: "Requires valid lead IDs, provider IDs for each step, stop-on-reply proof, and multi-step proof logs." },
  review_request: { complexity: "low", reason: "Requires review_link_set=true, outbound communication event, and proof log." },
  lead_reactivation: { complexity: "high", reason: "Requires dormant lead segment, reactivation flow entity, and proof log." },
  voice_broadcasts: { complexity: "high", reason: "Depends on proven inbound voice first, plus ElevenLabs config and proof log." },
  automation_proof_logs: { complexity: "low", reason: "Requires creating and passing proof records for each service." },
};

function nextProof(cap) {
  if (cap.proof?.passed > 0) return "Already has passed proof — maintain it.";
  if (cap.proof?.total > 0) return "Proof records exist but none passed — resolve the failing proof.";
  return `Create and pass an AutomationProofLog for ${cap.service_key || cap.key}.`;
}

function nextConfig(cap, data) {
  const voice = data.voice_readiness || {};
  const missed = data.missed_call_stats || {};
  switch (cap.key) {
    case "ai_voice_receptionist":
      if (!voice.has_elevenlabs_agent_ids) return "Configure ElevenLabs agent IDs in AdminSettings.";
      if (!voice.inbound_voice_enabled) return "Enable inbound_voice_enabled in AdminSettings.";
      return "Voice config present — needs live call test.";
    case "missed_call_text_back":
      if (missed.has_404 || missed.has_405) return `Repair missed-call webhook (returning ${missed.has_404 ? "404" : "405"}).`;
      if (!missed.webhook_url) return "Set missed_call_webhook_url in AdminSettings.";
      return "Webhook configured — needs real missed-call test.";
    case "review_request":
      return "Set review_link_set=true on an AutomationChecklist.";
    case "lead_reactivation":
      return "Create a real referral/reactivation flow entity or automation.";
    case "voice_broadcasts":
      return "Enable voice_calls_enabled in AdminSettings after inbound voice is proven.";
    default:
      if (cap.status === "red") return "Configure the base integration in AdminSettings.";
      return "Configuration present — needs real activity.";
  }
}

function nextBlocker(cap) {
  if ((cap.blockers || []).length === 0) return "No active blockers.";
  return cap.blockers[0];
}

export default function TwilioGrowthEngineFastestPathToGreen({ data }) {
  if (!data) return null;
  const caps = data.capabilities || [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <h3 className="text-sm font-bold text-gray-900">Fastest Path to Green — Admin Only</h3>
        <p className="text-xs text-gray-500 mt-1">Shows the shortest safe path from current status to trusted. Proof is never skippable. Public claims are never suggested before trusted status.</p>
      </div>

      {caps.map(cap => {
        const phaseInfo = computePhase(cap);
        const phaseLabel = PHASE_LABELS[phaseInfo.phase];
        const comp = COMPLEXITY[cap.key] || { complexity: "medium", reason: "Standard proof and configuration required." };
        const isGreen = cap.status === "green";
        return (
          <div key={cap.key} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="text-sm font-bold text-gray-900">{cap.label}</h4>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold flex-shrink-0" style={{ color: phaseLabel.color, background: phaseLabel.bg, border: `1px solid ${phaseLabel.border}` }}>
                {phaseLabel.short} · {cap.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Current Phase / Status</p>
                <p className="text-gray-600">{phaseLabel.label} · {cap.status}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Next Required Proof</p>
                <p className="text-gray-600">{nextProof(cap)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Next Required Configuration</p>
                <p className="text-gray-600">{nextConfig(cap, data)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Next Blocker to Remove</p>
                <p className="text-gray-600">{nextBlocker(cap)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Estimated Complexity</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  comp.complexity === "low" ? "bg-green-50 text-green-700 border border-green-200"
                  : comp.complexity === "medium" ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {comp.complexity}
                </span>
                <p className="text-gray-400 mt-1 leading-snug">{comp.reason}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Fastest Safe Next Step</p>
                <div className="flex items-start gap-1.5">
                  <ArrowRight className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-600 leading-relaxed">
                    {isGreen
                      ? "Already trusted. Maintain proof records and monitor for regressions."
                      : `${nextProof(cap)} Then: ${nextConfig(cap, data)}`}
                  </p>
                </div>
              </div>
            </div>
            {isGreen && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Trusted — do not make public claims without re-checking proof.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}