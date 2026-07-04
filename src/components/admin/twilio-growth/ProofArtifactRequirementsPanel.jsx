import { ShieldCheck, FileText, Database, Eye, EyeOff } from "lucide-react";

const ARTIFACT_REQUIREMENTS = [
  {
    capability_key: "ai_voice_receptionist",
    label: "AI Receptionist / Voice Agent",
    record_type: "CommunicationEvent (direction=inbound, channel=voice) + AutomationProofLog",
    required_fields: ["provider_message_id (call SID)", "call_summary or transcript (non-empty)", "direction=inbound", "duration > 0"],
    required_status: "status=delivered or completed; AutomationProofLog status=pass",
    internal_test_counts: false,
    customer_facing_proof_allowed: true,
    notes: "Ringing-only events are NOT sufficient. A meaningful transcript or call_summary must exist.",
  },
  {
    capability_key: "instant_lead_response",
    label: "Instant Lead Response (Speed-to-Lead)",
    record_type: "CommunicationLog or CommunicationEvent (channel=sms, direction=outbound)",
    required_fields: ["provider_message_id (Twilio Message SID)", "lead_id (valid, non-test)", "delivery_status=delivered", "trigger_name references instant_lead_response"],
    required_status: "delivery_status=delivered (not just 'sent')",
    internal_test_counts: false,
    customer_facing_proof_allowed: true,
    notes: "Status 'sent' without provider_message_id is weak proof — not trusted.",
  },
  {
    capability_key: "missed_call_text_back",
    label: "Missed-Call Recovery",
    record_type: "CommunicationEvent (inbound call) + CommunicationLog (outbound follow-up SMS)",
    required_fields: ["inbound event with call SID", "outbound SMS with provider_message_id", "delivery_status=delivered on follow-up", "no webhook 404/405"],
    required_status: "Webhook returns 200; follow-up SMS delivery_status=delivered",
    internal_test_counts: false,
    customer_facing_proof_allowed: true,
    notes: "If the missed-call webhook returns 404 or 405, this capability is blocked regardless of SMS logs.",
  },
  {
    capability_key: "nurture_sequence_14d",
    label: "Automated Follow-Up / Nurture Sequence",
    record_type: "AutomationProofLog + CommunicationLog per sequence step",
    required_fields: ["valid lead_id on enrollment", "provider_message_id per outbound step", "stop-on-reply behavior proven", "sequence enrollment record"],
    required_status: "AutomationProofLog status=pass; each step has delivery proof",
    internal_test_counts: false,
    customer_facing_proof_allowed: true,
    notes: "Sequence must prove it pauses when a lead replies. Steps without provider IDs are weak proof.",
  },
  {
    capability_key: "review_request",
    label: "Review Request Engine",
    record_type: "AutomationProofLog + CommunicationEvent (outbound review request)",
    required_fields: ["review_link_set=true on AutomationChecklist", "outbound communication event logged", "provider_message_id present"],
    required_status: "AutomationProofLog status=pass; review_link_set=true",
    internal_test_counts: false,
    customer_facing_proof_allowed: true,
    notes: "Review link must be configured before claiming this works.",
  },
  {
    capability_key: "lead_reactivation",
    label: "Referral / Reactivation Engine",
    record_type: "AutomationProofLog + CommunicationEvent or CommunicationLog (reactivation workflow)",
    required_fields: ["dormant lead segment identified", "reactivation workflow communication logged", "provider_message_id present"],
    required_status: "AutomationProofLog status=pass",
    internal_test_counts: false,
    customer_facing_proof_allowed: false,
    notes: "Do not claim publicly until a real referral/reactivation flow exists — not just a service key.",
  },
  {
    capability_key: "inbound_sms_assistant",
    label: "Client Status Updates / SMS Onboarding",
    record_type: "CommunicationEvent (inbound SMS) + classification/response record",
    required_fields: ["inbound SMS event", "AI classification or response record", "provider_message_id on response"],
    required_status: "AutomationProofLog status=pass",
    internal_test_counts: false,
    customer_facing_proof_allowed: false,
    notes: "Internal onboarding tool — customer-facing proof not typically required.",
  },
];

export default function ProofArtifactRequirementsPanel() {
  return (
    <div className="space-y-4">
      {/* Explanation */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-2">
        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Each capability requires a specific evidence artifact before it can be trusted. Internal/test records never count toward production trust.
          Customer-facing proof is only allowed where explicitly marked.
        </p>
      </div>

      {/* Artifact requirement cards */}
      {ARTIFACT_REQUIREMENTS.map((req) => (
        <div key={req.capability_key} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="text-sm font-bold text-gray-900">{req.label}</h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                {req.capability_key}
              </span>
            </div>
          </div>

          {/* Record type */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1 flex items-center gap-1">
              <Database className="w-3 h-3" /> Record Type Required
            </p>
            <p className="text-xs text-gray-700 font-mono leading-relaxed">{req.record_type}</p>
          </div>

          {/* Required fields */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Required Fields</p>
            <div className="flex flex-wrap gap-1.5">
              {req.required_fields.map((f, i) => (
                <span key={i} className="rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 font-mono">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Required status */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Required Status
            </p>
            <p className="text-xs text-gray-600">{req.required_status}</p>
          </div>

          {/* Internal/test + customer-facing flags */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className={`rounded-lg border p-3 ${req.internal_test_counts ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Internal/Test Records Count?</p>
              <p className={`text-xs font-bold ${req.internal_test_counts ? "text-amber-700" : "text-green-700"}`}>
                {req.internal_test_counts ? "Yes (QA only)" : "No — excluded"}
              </p>
            </div>
            <div className={`rounded-lg border p-3 ${req.customer_facing_proof_allowed ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1 flex items-center gap-1">
                {req.customer_facing_proof_allowed ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} Customer-Facing Proof Allowed?
              </p>
              <p className={`text-xs font-bold ${req.customer_facing_proof_allowed ? "text-blue-700" : "text-gray-500"}`}>
                {req.customer_facing_proof_allowed ? "Yes" : "No — internal only"}
              </p>
            </div>
          </div>

          {/* Notes */}
          {req.notes && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Notes</p>
              <p className="text-xs text-gray-500 leading-relaxed">{req.notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}