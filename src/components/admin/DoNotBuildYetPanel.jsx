import { Ban, AlertTriangle, Lock, ArrowRight } from "lucide-react";

const DO_NOT_BUILD_ITEMS = [
  {
    key: "referral_engine",
    label: "Referral Engine",
    icon: "🔄",
    why_not_now:
      "No referral entity, automation, or flow exists yet. Claiming this as active without a real flow would be a public misrepresentation. The underlying reactivation entity has not been built or seeded.",
    prerequisite:
      "A real referral entity or automation must exist, with at least one logged reactivation CommunicationEvent or CommunicationLog tied to a dormant lead segment.",
    safe_to_start:
      "After the first launch scope (instant lead response, missed-call text-back, speed-to-lead) is stable and proven, and an AutomationProofLog pass exists for lead_reactivation.",
  },
  {
    key: "voice_broadcasts",
    label: "Voice Broadcasts / Promotional Calling",
    icon: "📢",
    why_not_now:
      "Voice broadcasts require ElevenLabs agent IDs, phone number IDs, and voice_calls_enabled. Without these, any broadcast attempt would fail or send to the wrong audience. Promotional calling also carries TCPA compliance risk that is not yet reviewed.",
    prerequisite:
      "ElevenLabs agent IDs and phone number IDs configured in AdminSettings. voice_calls_enabled set to true. A real outbound voice call test with a transcript must pass first.",
    safe_to_start:
      "After inbound voice receptionist is proven (transcript proof exists), all foundational SMS automations are green, and TCPA review for promotional calling is complete.",
  },
  {
    key: "advanced_public_claims",
    label: "Advanced Public Proof Claims",
    icon: "📣",
    why_not_now:
      "Public marketing claims (e.g. 'We respond to every lead in under 60 seconds') require real production evidence. No AutomationProofLog pass records exist yet, so any advanced claim would be ahead of proof.",
    prerequisite:
      "AutomationProofLog pass records for every capability the claim references. CommunicationLog delivery_status=delivered for real (non-test) leads. Public Claim Safety Check must show 'safe' for each claim.",
    safe_to_start:
      "When the Public Claim Safety Check panel shows all referenced claims as 'safe to claim' with supporting evidence artifacts.",
  },
  {
    key: "automations_without_proof",
    label: "Any Automation That Depends on Missing Proof Records",
    icon: "🔗",
    why_not_now:
      "Any automation built on top of unproven foundational flows (nurture sequences, review requests, reactivation) inherits the same evidence gap. Shipping them before proof records exist propagulates the trust deficit.",
    prerequisite:
      "AutomationProofLog pass records for the foundational capability the new automation depends on. For example, a nurture sequence requires proof that the initial lead response actually delivered.",
    safe_to_start:
      "When the dependency capability has a green status in the Capability Matrix AND a passed AutomationProofLog record. Do not start until the dependency is proven, not just configured.",
  },
];

const SEVERITY_STYLES = {
  critical: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)" },
  high: { color: "#D97706", bg: "rgba(217,119,6,0.05)", border: "rgba(217,119,6,0.18)" },
};

export default function DoNotBuildYetPanel() {
  return (
    <div className="space-y-4">
      {/* Banner */}
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
        <div>
          <p className="text-sm font-bold text-red-600 mb-1">Do Not Build Yet — Admin Only</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            These capabilities should not be prioritized until the first launch scope (instant lead response, missed-call
            text-back, speed-to-lead) is stable and proven with real evidence. Building them prematurely risks public
            misrepresentation, compliance exposure, and propagated trust gaps.
          </p>
        </div>
      </div>

      {/* Item cards */}
      {DO_NOT_BUILD_ITEMS.map((item, i) => {
        const style = SEVERITY_STYLES[item.key === "automations_without_proof" ? "high" : "critical"];
        return (
          <div
            key={item.key}
            className="bg-white rounded-xl border p-5"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)", borderColor: style.border }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                style={{ background: style.bg }}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{item.label}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Priority #{i + 1} · Do not start yet
                </p>
              </div>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0"
                style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}
              >
                Blocked
              </span>
            </div>

            <div className="space-y-3">
              {/* Why not now */}
              <div className="rounded-lg bg-red-50/50 border border-red-100 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">Why Not Now</p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.why_not_now}</p>
              </div>

              {/* Prerequisite */}
              <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Prerequisite Required</p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.prerequisite}</p>
              </div>

              {/* Safe to start */}
              <div className="rounded-lg bg-green-50/50 border border-green-100 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowRight className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600">What Would Make It Safe to Start</p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.safe_to_start}</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Footer reminder */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Reminder:</span> These items are gated by foundational proof,
          not by development effort. Do not unblock them by removing checks or overriding statuses. Unblocking happens
          only when real evidence artifacts appear in the Capability Matrix.
        </p>
      </div>
    </div>
  );
}