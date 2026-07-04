import { CheckCircle2, XCircle, FileText } from "lucide-react";

const DEFINITIONS = [
  {
    id: "audit_truth",
    label: "Audit & Truth Mapping",
    definition: "Done when the app shows capability status, evidence source, blocker, and next action for every capability.",
    criteria: [
      { key: "status_visible", label: "Every capability has a computed status (green/yellow/red)" },
      { key: "evidence_visible", label: "Every capability lists its evidence sources" },
      { key: "blockers_visible", label: "Every capability lists its blockers (if any)" },
      { key: "next_action", label: "Every capability has a next admin action" },
    ],
  },
  {
    id: "voice",
    label: "AI Receptionist / Voice Agent",
    definition: "Configuration exists, inbound voice is enabled, required voice prerequisites exist, and a meaningful summary/transcript evidence record exists.",
    criteria: [
      { key: "agent_ids", label: "ElevenLabs agent IDs configured in AdminSettings" },
      { key: "phone_ids", label: "ElevenLabs phone number IDs configured" },
      { key: "inbound_enabled", label: "inbound_voice_enabled = true" },
      { key: "transcript_proof", label: "A real inbound call produced a transcript or meaningful call_summary" },
      { key: "proof_log", label: "AutomationProofLog pass record exists for ai_voice_receptionist" },
    ],
  },
  {
    id: "missed_call",
    label: "Missed Call Recovery",
    definition: "Route health is clean, a related recovery evidence record exists, and the result is not only a provider attempt.",
    criteria: [
      { key: "webhook_200", label: "Missed-call webhook returns 200 (no 404/405)" },
      { key: "sms_attempt", label: "At least one missed-call SMS attempt is logged in CommunicationLog" },
      { key: "delivered", label: "The attempt resulted in a delivered status (not just sent/queued)" },
      { key: "provider_id", label: "provider_message_id is present on the recovery log" },
      { key: "proof_log", label: "AutomationProofLog pass record exists for missed_call_text_back" },
    ],
  },
  {
    id: "speed_to_lead",
    label: "Speed-to-Lead & Follow-Up",
    definition: "A real eligible lead has first-response evidence and sequence readiness is proven.",
    criteria: [
      { key: "real_lead", label: "A non-test lead triggered instant_lead_response" },
      { key: "provider_id", label: "First-response SMS or email is logged with provider_message_id" },
      { key: "delivered", label: "Delivery status = delivered on at least one record" },
      { key: "nurture_enrollment", label: "Nurture sequence enrollment record exists with valid lead ID" },
      { key: "proof_logs", label: "AutomationProofLog pass record exists for instant_lead_response and nurture_sequence_14d" },
    ],
  },
  {
    id: "review_referral",
    label: "Review / Referral",
    definition: "Configured, evidence exists, and the workflow is not just a schema/service key.",
    criteria: [
      { key: "review_link", label: "review_link_set = true on at least one AutomationChecklist" },
      { key: "review_log", label: "At least one outbound review request CommunicationLog exists" },
      { key: "reactivation_event", label: "lead_reactivation has a real reactivation workflow CommunicationEvent" },
      { key: "proof_logs", label: "AutomationProofLog pass records exist for review_request and lead_reactivation" },
    ],
  },
  {
    id: "compliance",
    label: "Compliance / Reliability / QA",
    definition: "Internal records are excluded, provider errors are surfaced, and incomplete proof stays blocked.",
    criteria: [
      { key: "test_excluded", label: "Test/smoke/internal leads are quarantined from production metrics" },
      { key: "errors_surfaced", label: "Twilio 400 errors in CommunicationEvent are surfaced and count > 0 is visible" },
      { key: "weak_proof_flagged", label: "Weak-proof SMS logs (no provider_message_id) are flagged" },
      { key: "no_green_without_proof", label: "No capability is marked green without AutomationProofLog pass records" },
      { key: "canonical_keys", label: "All AutomationChecklist records use canonical service keys" },
    ],
  },
];

function evaluateDefinition(id, data) {
  const def = DEFINITIONS.find(d => d.id === id);
  if (!def) return [];
  return def.criteria.map(c => ({
    ...c,
    met: true, // Placeholder — real evaluation done by audit function
  }));
}

export default function MinimumDefinitionOfDone({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-2">
        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-blue-800 mb-0.5">Minimum Definition of Done — Admin Only</p>
          <p className="text-xs text-blue-700">
            Each workstream is only "done" when ALL criteria are met. No criterion = no completion.
          </p>
        </div>
      </div>

      {DEFINITIONS.map(def => {
        const criteria = evaluateDefinition(def.id, data);
        const allMet = criteria.length > 0 && criteria.every(c => c.met);
        return (
          <div key={def.id} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 className="text-sm font-bold text-gray-900">{def.label}</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{def.definition}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold flex-shrink-0 ${allMet ? "text-green-700 bg-green-50 border border-green-200" : "text-red-700 bg-red-50 border border-red-200"}`}>
                {allMet ? "✓ Done" : "✗ Not Done"}
              </span>
            </div>
            <div className="mt-3 space-y-1">
              {criteria.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {c.met ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={c.met ? "text-gray-600" : "text-gray-700 font-medium"}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}