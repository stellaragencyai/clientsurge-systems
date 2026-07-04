import { Database, CheckCircle2, MinusCircle } from "lucide-react";

/**
 * Admin-only static reference: maps each Twilio Growth Engine capability
 * to the exact entity sources that should be checked for evidence.
 *
 * Does not run queries — it is a reference table for operators.
 */

const EVIDENCE_SOURCE_MAP = [
  {
    capability_key: "instant_lead_response",
    label: "Instant Lead Response",
    required: [
      { source: "AutomationProofLog", purpose: "Passed proof record for this service", field: "service_key=instant_lead_response, status=pass" },
      { source: "CommunicationLog", purpose: "Delivered SMS to a real lead", field: "delivery_status=delivered, provider_message_id != null" },
      { source: "Leads", purpose: "Real (non-test) lead that triggered the response", field: "quality_review_status != quarantined, status != New" },
    ],
    optional: [
      { source: "CommunicationEvent", purpose: "Cross-check outbound event log", field: "direction=outbound, provider_message_id != null" },
      { source: "AdminSettings", purpose: "sms_webhook_url + twilio_from_number configured", field: "twilio_enabled=true, sms_webhook_url set" },
    ],
  },
  {
    capability_key: "missed_call_text_back",
    label: "Missed Call Text-Back",
    required: [
      { source: "AutomationProofLog", purpose: "Passed proof record for this service", field: "service_key=missed_call_text_back, status=pass" },
      { source: "CommunicationLog", purpose: "Follow-up SMS triggered by missed call", field: "trigger_name contains 'missed_call', delivery_status=delivered" },
      { source: "AdminSettings", purpose: "Missed-call webhook URL set and not returning 404/405", field: "missed_call_webhook_url set, last_webhook_test_result has no 404/405" },
    ],
    optional: [
      { source: "CommunicationEvent", purpose: "Inbound call event record", field: "event_type contains 'missed_call'" },
      { source: "Leads", purpose: "Lead whose missed call triggered recovery", field: "missed_call_step_sent > 0" },
    ],
  },
  {
    capability_key: "nurture_sequence_14d",
    label: "Nurture Sequence (14-Day)",
    required: [
      { source: "AutomationProofLog", purpose: "Passed proof record for this service", field: "service_key=nurture_sequence_14d, status=pass" },
      { source: "CommunicationLog", purpose: "Outbound sequence messages with provider IDs", field: "provider_message_id != null, trigger_name contains sequence step" },
      { source: "Leads", purpose: "Lead enrolled in sequence with valid lead ID", field: "outreach_status=contacted, next_follow_up_at set" },
    ],
    optional: [
      { source: "CommunicationEvent", purpose: "Stop-on-reply behavior proof", field: "direction=inbound, status=received" },
      { source: "AdminSettings", purpose: "Cadence config (max attempts, pause on reply)", field: "cadence_pause_on_reply=true, cadence_max_attempts set" },
    ],
  },
  {
    capability_key: "ai_voice_receptionist",
    label: "AI Voice Receptionist",
    required: [
      { source: "AutomationProofLog", purpose: "Passed proof record for this service", field: "service_key=ai_voice_receptionist, status=pass" },
      { source: "AdminSettings", purpose: "ElevenLabs agent IDs + inbound voice enabled", field: "inbound_voice_enabled=true, elevenlabs_agent_ids populated" },
      { source: "WebsiteLead", purpose: "Live call transcript or summary evidence", field: "transcript is not empty" },
    ],
    optional: [
      { source: "CommunicationEvent", purpose: "Inbound voice event log", field: "channel=voice, direction=inbound" },
      { source: "AdminSettings", purpose: "Voice webhook URL + forwarding phone", field: "voice_webhook_url set, voice_forwarding_phone set" },
    ],
  },
  {
    capability_key: "review_request",
    label: "Review Request",
    required: [
      { source: "AutomationProofLog", purpose: "Passed proof record for this service", field: "service_key=review_request, status=pass" },
      { source: "AutomationChecklist", purpose: "Review link configured", field: "review_link_set=true" },
      { source: "CommunicationLog", purpose: "Logged outbound review request", field: "trigger_name contains 'review', delivery_status=delivered" },
    ],
    optional: [
      { source: "CommunicationEvent", purpose: "Cross-check outbound event", field: "direction=outbound" },
      { source: "AdminSettings", purpose: "Review link default", field: "booking_link_default or review_link set" },
    ],
  },
  {
    capability_key: "lead_reactivation",
    label: "Lead Reactivation",
    required: [
      { source: "AutomationProofLog", purpose: "Passed proof record for this service", field: "service_key=lead_reactivation, status=pass" },
      { source: "Leads", purpose: "Dormant lead segment identified", field: "lead_state=DORMANT or segment=DORMANT" },
      { source: "CommunicationLog", purpose: "Logged reactivation outreach", field: "trigger_name contains 'reactivation' or 'reactivate'" },
    ],
    optional: [
      { source: "CommunicationEvent", purpose: "Cross-check reactivation events", field: "direction=outbound" },
    ],
  },
  {
    capability_key: "inbound_sms_assistant",
    label: "Inbound SMS Assistant",
    required: [
      { source: "AutomationProofLog", purpose: "Passed proof record for this service", field: "service_key=inbound_sms_assistant, status=pass" },
      { source: "CommunicationEvent", purpose: "Inbound SMS event + classification/response", field: "channel=sms, direction=inbound" },
    ],
    optional: [
      { source: "CommunicationLog", purpose: "Outbound reply to inbound SMS", field: "trigger_name contains 'inbound' or 'reply'" },
    ],
  },
  {
    capability_key: "ai_booking_agent",
    label: "Live Call Transcription / Summaries",
    required: [
      { source: "WebsiteLead", purpose: "Call transcript or summary evidence", field: "transcript is not empty" },
      { source: "AutomationProofLog", purpose: "Passed proof record", field: "service_key=ai_booking_agent, status=pass" },
    ],
    optional: [
      { source: "CommunicationEvent", purpose: "Voice event cross-check", field: "channel=voice" },
    ],
  },
  {
    capability_key: "voice_broadcasts",
    label: "Voice Broadcasts",
    required: [
      { source: "AutomationProofLog", purpose: "Passed proof record", field: "service_key=ai_voice_receptionist, status=pass" },
      { source: "AdminSettings", purpose: "voice_calls_enabled flag", field: "voice_calls_enabled=true" },
    ],
    optional: [
      { source: "CommunicationEvent", purpose: "Outbound voice event", field: "channel=voice, direction=outbound" },
    ],
  },
  {
    capability_key: "automation_proof_logs",
    label: "Formal Automation Proof Logs",
    required: [
      { source: "AutomationProofLog", purpose: "At least one passed proof record exists", field: "status=pass (any service_key)" },
    ],
    optional: [
      { source: "AutomationChecklist", purpose: "Cross-reference checklist status", field: "status=active" },
    ],
  },
];

const ALL_ENTITIES = [
  "AdminSettings",
  "CommunicationLog",
  "CommunicationEvent",
  "AutomationChecklist",
  "AutomationProofLog",
  "WebsiteLead",
  "Leads",
  "ClientProject",
  "ClientInstallationOS",
  "OnboardingClient",
];

export default function EvidenceSourceMap() {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-2">
        <Database className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Reference table — maps each capability to the exact entity sources that must be checked for evidence.
          This is a static guide; it does not run queries or modify data.
        </p>
      </div>

      {EVIDENCE_SOURCE_MAP.map((cap) => (
        <div key={cap.capability_key} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div className="mb-3">
            <p className="text-sm font-bold text-gray-900">{cap.label}</p>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{cap.capability_key}</p>
          </div>

          <div className="space-y-4">
            {/* Required sources */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                Required Sources
              </p>
              <div className="space-y-2">
                {cap.required.map((src, i) => (
                  <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">{src.source}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-1">{src.purpose}</p>
                    <p className="text-[10px] font-mono text-blue-600 bg-blue-50 rounded px-2 py-0.5 inline-block">
                      {src.field}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional sources */}
            {cap.optional.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
                  <MinusCircle className="w-3 h-3 text-gray-400" />
                  Optional Sources
                </p>
                <div className="space-y-2">
                  {cap.optional.map((src, i) => (
                    <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/30 p-3">
                      <span className="text-xs font-bold text-gray-700">{src.source}</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">{src.purpose}</p>
                      <p className="text-[10px] font-mono text-gray-500 bg-gray-50 rounded px-2 py-0.5 inline-block mt-1">
                        {src.field}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Entity coverage matrix */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Entity Coverage Matrix</h3>
        <p className="text-xs text-gray-400 mb-3">Which capabilities reference each entity.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Entity</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Capabilities Using It</th>
              </tr>
            </thead>
            <tbody>
              {ALL_ENTITIES.map((entity) => {
                const caps = EVIDENCE_SOURCE_MAP.filter(c =>
                  [...c.required, ...c.optional].some(s => s.source === entity)
                );
                return (
                  <tr key={entity} className="border-b border-gray-50">
                    <td className="py-2 px-2 font-semibold text-gray-700 whitespace-nowrap">{entity}</td>
                    <td className="py-2 px-2 text-gray-500">
                      {caps.length === 0 ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        caps.map(c => c.label).join(", ")
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}