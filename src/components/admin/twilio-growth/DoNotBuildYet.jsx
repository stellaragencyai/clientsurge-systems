import { Ban, AlertTriangle, ArrowRight } from "lucide-react";

/**
 * Do Not Build Yet — lists capabilities that should not be prioritized until the first launch scope is stable.
 * For each item: why not now, prerequisite required, what would make it safe to start.
 */
export default function DoNotBuildYet({ data }) {
  if (!data) return null;

  const caps = data.capabilities || [];
  const delivery = data.delivery_stats || {};
  const missed = data.missed_call_stats || {};
  const voice = data.voice_readiness || {};
  const proofEmpty = data.proof_logs_empty;

  // Determine launch scope stability
  const speedToLeadCap = caps.find(c => c.key === "instant_lead_response");
  const missedCallCap = caps.find(c => c.key === "missed_call_text_back");
  const launchScopeStable = speedToLeadCap?.status === "green" && missedCallCap?.status === "green" && !proofEmpty;

  const items = [
    {
      id: "referral_engine",
      label: "Referral Engine (Lead Reactivation)",
      capability_key: "lead_reactivation",
      whyNotNow: "The referral/reactivation engine depends on a healthy lead pipeline with proven first-response and nurture flows. If leads aren't being contacted and nurtured reliably, reactivating dormant leads will produce unreliable results and waste effort.",
      prerequisiteRequired: "Speed-to-Lead (instant_lead_response) and Nurture Sequence (nurture_sequence_14d) must both be trusted (green) with real delivered proof. The lead pipeline must have production leads with completed first-response evidence.",
      whatWouldMakeItSafe: "instant_lead_response and nurture_sequence_14d both at green status with passed AutomationProofLog records, and at least 10 production leads with delivered first-response SMS/email.",
      currentStatus: caps.find(c => c.key === "lead_reactivation")?.status || "red",
    },
    {
      id: "voice_broadcasts",
      label: "Voice Broadcasts / Promotional Calling",
      capability_key: "voice_broadcasts",
      whyNotNow: "Voice broadcasts require a stable ElevenLabs voice infrastructure with proven inbound voice handling. Building promotional calling before inbound voice is trusted risks sending low-quality AI calls that damage brand reputation.",
      prerequisiteRequired: "AI Voice Receptionist (ai_voice_receptionist) must be trusted with a real transcript proof. ElevenLabs agent IDs and phone number IDs must be configured. inbound_voice_enabled must be true with a passed call test.",
      whatWouldMakeItSafe: "ai_voice_receptionist at green status with a real call transcript, ElevenLabs agent and phone IDs configured, and voice_webhook_url returning 200.",
      currentStatus: caps.find(c => c.key === "voice_broadcasts")?.status || "red",
    },
    {
      id: "advanced_public_claims",
      label: "Advanced Public Proof Claims",
      capability_key: null,
      whyNotNow: "Public claims about automation capabilities must be backed by real evidence. Expanding public claims before proof records exist creates legal and reputational risk. Every public claim must map to a green capability.",
      prerequisiteRequired: "AutomationProofLog must have passed records for instant_lead_response and missed_call_text_back at minimum. No capability should be publicly claimed unless it's green with no active blockers.",
      whatWouldMakeItSafe: "At least 3 capabilities at green status with passed proof logs, no active blockers across the capability matrix, and test data fully excluded from production metrics.",
      currentStatus: proofEmpty ? "red" : "yellow",
    },
    {
      id: "proof_dependent_automations",
      label: "Automations That Depend on Missing Proof Records",
      capability_key: null,
      whyNotNow: "Any automation that depends on proof records (e.g., booking agent, review request, SMS assistant) cannot be reliably built until the foundational proof infrastructure exists. Building on top of missing proof creates untraceable, unverifiable systems.",
      prerequisiteRequired: "AutomationProofLog must not be empty. At minimum, instant_lead_response and missed_call_text_back must have passed proof records. CommunicationEvent logging must be verified (communication_event_logging_verified=true).",
      whatWouldMakeItSafe: "AutomationProofLog has at least 2 passed records (instant_lead_response + missed_call_text_back), CommunicationEvent logging is verified on at least one AutomationChecklist, and no weak/null provider message IDs in delivery stats.",
      currentStatus: proofEmpty ? "red" : "yellow",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Launch scope status */}
      <div className="rounded-xl p-5 flex items-start gap-3" style={{
        background: launchScopeStable
          ? "linear-gradient(135deg, rgba(5,150,105,0.06), rgba(5,150,105,0.02))"
          : "linear-gradient(135deg, rgba(220,38,38,0.06), rgba(220,38,38,0.02))",
        border: `1px solid ${launchScopeStable ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.2)"}`,
      }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{
          background: launchScopeStable ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)",
          border: `1px solid ${launchScopeStable ? "rgba(5,150,105,0.25)" : "rgba(220,38,38,0.25)"}`,
        }}>
          {launchScopeStable
            ? <ArrowRight className="w-4 h-4 text-green-600" />
            : <Ban className="w-4 h-4 text-red-600" />}
        </div>
        <div>
          <p className="text-sm font-bold mb-1" style={{ color: launchScopeStable ? "#059669" : "#DC2626" }}>
            {launchScopeStable
              ? "First launch scope is stable — lower-priority capabilities may be considered"
              : "First launch scope is NOT stable — do not prioritize lower-priority capabilities yet"}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Speed-to-Lead: {speedToLeadCap?.status || "unknown"} · Missed Call Recovery: {missedCallCap?.status || "unknown"} · Proof Logs: {proofEmpty ? "empty" : "exist"}
          </p>
        </div>
      </div>

      {/* Do not build yet items */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Ban className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Do Not Build Yet — Admin Only</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          These capabilities should not be prioritized until the first launch scope (Speed-to-Lead + Missed Call Recovery) is stable and trusted.
          Building them prematurely wastes effort and creates untraceable systems.
        </p>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="rounded-lg border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900">{item.label}</h4>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{
                      color: item.currentStatus === "green" ? "#059669" : item.currentStatus === "yellow" ? "#D97706" : "#DC2626",
                      background: item.currentStatus === "green" ? "rgba(5,150,105,0.06)" : item.currentStatus === "yellow" ? "rgba(217,119,6,0.06)" : "rgba(220,38,38,0.05)",
                      border: `1px solid ${item.currentStatus === "green" ? "rgba(5,150,105,0.15)" : item.currentStatus === "yellow" ? "rgba(217,119,6,0.15)" : "rgba(220,38,38,0.12)"}`,
                    }}>
                      {item.currentStatus === "green" ? "Stable" : item.currentStatus === "yellow" ? "Partial" : "Not Started"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Why Not Now</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.whyNotNow}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-!400 mb-0.5">Prerequisite Required</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.prerequisiteRequired}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-green-500 mb-0.5">What Would Make It Safe to Start</p>
                  <p className="text-xs text-green-700 leading-relaxed">{item.whatWouldMakeItSafe}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}