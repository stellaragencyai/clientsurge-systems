import { Ban, AlertTriangle } from "lucide-react";

const DO_NOT_BUILD = [
  {
    item: "Referral Engine / Lead Reactivation workflow",
    reason: "No evidence record exists for a real referral or reactivation flow. The service key exists in the schema but no workflow, entity, or automation has been built or proven.",
    requiredBefore: "Create a real referral entity/automation, generate evidence records, and pass an AutomationProofLog before building any UI or claiming it as active.",
  },
  {
    item: "Voice Broadcasts / Promotional Calling",
    reason: "voice_calls_enabled is false and no ElevenLabs phone number IDs are configured. No proof of a successful outbound voice broadcast exists.",
    requiredBefore: "Configure ElevenLabs phone number IDs, enable voice_calls_enabled, and run a real outbound call test with transcript proof.",
  },
  {
    item: "Public customer-facing trust claims",
    reason: "AutomationProofLog is empty. No capability has passed proof. Public-facing claims of completeness or trust are not supported by app data.",
    requiredBefore: "Create and pass AutomationProofLog records for every service key before making any public trust claim.",
  },
  {
    item: "Expanding to new automation services",
    reason: "Existing services have incomplete proof and unresolved blockers. Adding new services before resolving these will compound the trust gap.",
    requiredBefore: "Resolve all blockers in the Repair Queue and achieve green status on existing capabilities before expanding.",
  },
];

export default function DoNotBuildYetPanel() {
  return (
    <div className="space-y-4">
      <div className="bg-red-50 rounded-xl border border-red-200 p-4 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-800">
          <strong>Do Not Build Yet — Admin Only.</strong> These items must not be built, claimed, or expanded until the required evidence exists. Building prematurely will create untrustworthy status and misleading metrics.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Ban className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-bold text-gray-900">Blocked From Building — Admin Only</h3>
        </div>
        <div className="space-y-3">
          {DO_NOT_BUILD.map((d, i) => (
            <div key={i} className="rounded-lg border border-red-100 bg-red-50/30 p-3">
              <p className="text-sm font-semibold text-gray-900 mb-1">{i + 1}. {d.item}</p>
              <p className="text-xs text-gray-600 mb-2">{d.reason}</p>
              <div className="rounded border border-gray-200 bg-white p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Required Before Building</p>
                <p className="text-xs text-gray-700">{d.requiredBefore}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}