import { Ban, ArrowRight } from "lucide-react";

const DO_NOT_BUILD = [
  {
    item: "Referral Engine (lead_reactivation)",
    whyNotNow: "Depends on a working lead pipeline with proven nurture and reactivation flows. Building referral mechanics before the core lead pipeline is trusted creates a fragile system with no proof.",
    prerequisite: "Passed AutomationProofLog for instant_lead_response, missed_call_text_back, and nurture_sequence_14d. A real dormant lead segment must exist.",
    safeToStart: "When lead_reactivation has a passed AutomationProofLog and a real reactivation CommunicationEvent logged.",
  },
  {
    item: "Voice Broadcasts / Promotional Calling",
    whyNotNow: "Requires a proven inbound voice receptionist with ElevenLabs agent IDs, phone number IDs, and a real transcript. Promotional calling before inbound voice works risks compliance violations and broken calls.",
    prerequisite: "inbound_voice_enabled=true, ElevenLabs agent IDs configured, and a live call transcript on a WebsiteLead record.",
    safeToStart: "When voice_broadcasts has a passed AutomationProofLog and voice_calls_enabled is true with a real test call completed.",
  },
  {
    item: "Advanced Public Proof Claims",
    whyNotNow: "Public claims (e.g. '24/7 AI Receptionist', 'instant lead response in under 60 seconds') require trusted status with real evidence. Claiming before proof creates legal and trust risk.",
    prerequisite: "The capability being claimed must be at Phase 4 (trusted) with passed proof log, no blockers, and checklist client approval.",
    safeToStart: "When the Claim Safety panel shows 'safe' for the specific claim, backed by real evidence records.",
  },
  {
    item: "Any automation that depends on missing proof records",
    whyNotNow: "If AutomationProofLog is empty or the relevant capability has 0 passed proofs, building dependent automations builds on a foundation of sand.",
    prerequisite: "At minimum, AutomationProofLog must have passed records for the core capabilities the new automation depends on.",
    safeToStart: "When all dependency capabilities have passed proof logs and the new automation's own proof log is created and passed.",
  },
];

export default function TwilioGrowthEngineDoNotBuildYet({ data }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.04), rgba(220,38,38,0.01))", border: "1px solid rgba(220,38,38,0.15)" }}>
        <Ban className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-700">Do Not Build Yet — Admin Only</p>
          <p className="text-xs text-gray-500 mt-1">These capabilities should not be prioritized until the first launch scope is stable. Building them prematurely wastes effort and creates false trust.</p>
        </div>
      </div>

      {DO_NOT_BUILD.map((d, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
              <span className="text-xs font-bold text-red-600">{i + 1}</span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 pt-0.5">{d.item}</h4>
          </div>
          <div className="space-y-3 text-xs ml-10">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-0.5">Why Not Now</p>
              <p className="text-gray-600 leading-relaxed">{d.whyNotNow}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Prerequisite Required</p>
              <p className="text-gray-600 leading-relaxed">{d.prerequisite}</p>
            </div>
            <div className="rounded-lg border border-green-100 bg-green-50 p-3 flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700 mb-0.5">What Would Make It Safe to Start</p>
                <p className="text-gray-600 leading-relaxed">{d.safeToStart}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}