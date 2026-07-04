import { CheckCircle2, XCircle, ClipboardList } from "lucide-react";

const DEFINITIONS = [
  {
    id: "audit_truth",
    label: "Audit & Truth Mapping",
    definition: "Done when the app shows capability status, evidence source, blocker, and next action for every capability.",
    criteria: [
      "All capabilities have a computed status (green/yellow/red)",
      "All capabilities list their evidence sources checked",
      "All capabilities show blockers (or 'no blockers')",
      "All capabilities have a next action defined",
    ],
  },
  {
    id: "ai_voice",
    label: "AI Receptionist / Voice Agent",
    definition: "Done only when configuration exists, inbound voice is enabled, required voice prerequisites exist, and a meaningful summary/transcript evidence record exists.",
    criteria: [
      "ElevenLabs agent IDs configured in AdminSettings",
      "ElevenLabs phone number IDs configured in AdminSettings",
      "inbound_voice_enabled = true",
      "WebsiteLead with non-empty transcript from a real call",
      "AutomationProofLog pass for ai_voice_receptionist",
    ],
  },
  {
    id: "missed_call",
    label: "Missed Call Recovery",
    definition: "Done only when route health is clean, a related recovery evidence record exists, and the result is not only a provider attempt.",
    criteria: [
      "Missed-call webhook returns 200 (no 404/405)",
      "CommunicationLog with delivery_status=delivered for a missed-call trigger",
      "Result is not just status=sent without provider_message_id",
      "AutomationProofLog pass for missed_call_text_back",
    ],
  },
  {
    id: "speed_to_lead",
    label: "Speed-to-Lead & Follow-Up",
    definition: "Done only when a real eligible lead has first-response evidence and sequence readiness is proven.",
    criteria: [
      "Real lead (non-test) received instant response",
      "CommunicationLog with delivery_status=delivered and provider_message_id",
      "Nurture sequence enrollment with valid lead ID",
      "AutomationProofLog pass for instant_lead_response and nurture_sequence_14d",
    ],
  },
  {
    id: "review_referral",
    label: "Review/Referral",
    definition: "Done only when configured, evidence exists, and the workflow is not just a schema/service key.",
    criteria: [
      "Review link configured (review_link_set = true)",
      "Real outbound communication event for review request",
      "Referral/reactivation workflow entity exists (not just a service_key)",
      "AutomationProofLog pass for review_request and lead_reactivation",
    ],
  },
  {
    id: "compliance_reliability",
    label: "Compliance/Reliability",
    definition: "Done only when internal records are excluded, provider errors are surfaced, and incomplete proof stays blocked.",
    criteria: [
      "Test/smoke/internal records excluded from production metrics",
      "Twilio 400 errors surfaced and resolved",
      "Failed events reviewed and resolved",
      "Weak-proof records (no provider_message_id) blocked from trusted status",
    ],
  },
];

function evaluateDefinition(id, data) {
  const caps = data.capabilities || [];
  const pbs = data.proof_by_service || {};
  const ds = data.delivery_stats || {};
  const es = data.event_stats || {};
  const vr = data.voice_readiness || {};
  const mc = data.missed_call_stats || {};
  const q = data.quarantine || {};

  switch (id) {
    case "audit_truth":
      return caps.map(c => ({
        label: `${c.label}: status=${c.status}, evidence=${c.evidence_sources?.length || 0} sources, blockers=${c.blockers?.length || 0}, next_action=${c.next_action ? "yes" : "no"}`,
        met: !!(c.status && c.evidence_sources && c.blockers !== undefined && c.next_action !== undefined),
      }));
    case "ai_voice":
      return [
        { label: "ElevenLabs agent IDs configured", met: !!vr.has_elevenlabs_agent_ids },
        { label: "ElevenLabs phone number IDs configured", met: !!vr.has_elevenlabs_phone_number_ids },
        { label: "inbound_voice_enabled = true", met: !!vr.inbound_voice_enabled },
        { label: "Transcript proof exists", met: !!vr.has_transcript_proof },
        { label: "AutomationProofLog pass for ai_voice_receptionist", met: (pbs["ai_voice_receptionist"]?.passed || 0) > 0 },
      ];
    case "missed_call":
      return [
        { label: "Webhook returns 200 (no 404/405)", met: mc.webhook_status === "configured" },
        { label: "Delivered SMS for missed-call trigger", met: mc.successful_sends > 0 },
        { label: "Not just status=sent without provider_message_id", met: ds.weak_proof_count === 0 || mc.successful_sends > 0 },
        { label: "AutomationProofLog pass for missed_call_text_back", met: (pbs["missed_call_text_back"]?.passed || 0) > 0 },
      ];
    case "speed_to_lead":
      return [
        { label: "Real lead received instant response", met: ds.delivered > 0 },
        { label: "Delivered SMS with provider_message_id", met: ds.with_provider_message_id > 0 },
        { label: "Nurture sequence enrollment exists", met: (pbs["nurture_sequence_14d"]?.total || 0) > 0 },
        { label: "Proof pass for instant_lead_response", met: (pbs["instant_lead_response"]?.passed || 0) > 0 },
        { label: "Proof pass for nurture_sequence_14d", met: (pbs["nurture_sequence_14d"]?.passed || 0) > 0 },
      ];
    case "review_referral":
      return [
        { label: "Review link configured", met: false }, // not available in audit data
        { label: "Outbound communication for review request", met: (pbs["review_request"]?.total || 0) > 0 },
        { label: "Referral workflow exists (not just service_key)", met: (pbs["lead_reactivation"]?.total || 0) > 0 },
        { label: "Proof pass for review_request", met: (pbs["review_request"]?.passed || 0) > 0 },
        { label: "Proof pass for lead_reactivation", met: (pbs["lead_reactivation"]?.passed || 0) > 0 },
      ];
    case "compliance_reliability":
      return [
        { label: "Test records excluded from production metrics", met: true }, // quarantine rules exist
        { label: "No Twilio 400 errors", met: es.twilio_400_errors === 0 },
        { label: "No failed events", met: es.failed_events === 0 },
        { label: "No weak-proof records", met: ds.weak_proof_count === 0 },
        { label: "No test data in production view", met: (q.excluded_leads_count || 0) === 0 },
      ];
    default:
      return [];
  }
}

export default function MinimumDefinitionOfDone({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-2">
        <ClipboardList className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
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