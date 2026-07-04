import { Database, CheckCircle2, MinusCircle } from "lucide-react";

/**
 * Admin-only Evidence Source Map.
 * Maps each capability to the exact entity sources that should be checked.
 */

const EVIDENCE_SOURCE_MAP = {
  instant_lead_response: {
    label: "Website Speed-to-Lead SMS/Email",
    sources: [
      { entity: "AdminSettings", required: true, purpose: "Twilio from number, SMS webhook, status callback URL", key_fields: "twilio_enabled=true, twilio_from_number, sms_webhook_url, sms_status_callback_url" },
      { entity: "CommunicationLog", required: true, purpose: "SMS delivery proof with provider message ID", key_fields: "delivery_status=delivered, provider_message_id NOT NULL" },
      { entity: "CommunicationEvent", required: false, purpose: "Event-level delivery tracking", key_fields: "status=sent/delivered, provider_message_id" },
      { entity: "AutomationProofLog", required: true, purpose: "Formal proof record", key_fields: "service_key=instant_lead_response, status=pass" },
      { entity: "AutomationChecklist", required: false, purpose: "Per-client install checklist", key_fields: "twilio_configured=true, test_lead_sent=true" },
      { entity: "Leads", required: false, purpose: "Real lead with first-response timestamp", key_fields: "last_contacted_at set, status=Contacted" },
    ],
  },
  missed_call_text_back: {
    label: "Missed Call Text-Back",
    sources: [
      { entity: "AdminSettings", required: true, purpose: "Missed-call webhook URL", key_fields: "missed_call_webhook_url set, last_webhook_test_result no 404/405" },
      { entity: "CommunicationLog", required: true, purpose: "Recovery SMS delivery proof", key_fields: "trigger_name contains 'missed_call', delivery_status=delivered" },
      { entity: "CommunicationEvent", required: false, purpose: "Missed-call inbound event + outbound SMS event", key_fields: "event_type contains 'missed_call', direction=outbound" },
      { entity: "AutomationProofLog", required: true, purpose: "Formal proof record", key_fields: "service_key=missed_call_text_back, status=pass" },
      { entity: "AutomationChecklist", required: false, purpose: "Per-client install checklist", key_fields: "twilio_configured=true, test_lead_sent=true" },
    ],
  },
  nurture_sequence_14d: {
    label: "AI Sales Follow-Up / Nurture",
    sources: [
      { entity: "AdminSettings", required: true, purpose: "Nurture SMS/email templates, cadence settings", key_fields: "nurture_step1_subject/body … nurture_step8_subject/body, cadence_pause_on_reply=true" },
      { entity: "CommunicationLog", required: true, purpose: "Outbound nurture step delivery", key_fields: "delivery_status=delivered, provider_message_id NOT NULL, trigger_name contains 'nurture'" },
      { entity: "CommunicationEvent", required: false, purpose: "Event-level nurture step tracking", key_fields: "direction=outbound, status=sent/delivered" },
      { entity: "AutomationProofLog", required: true, purpose: "Formal proof record", key_fields: "service_key=nurture_sequence_14d, status=pass" },
      { entity: "Leads", required: false, purpose: "Lead enrolled in sequence with valid ID", key_fields: "next_follow_up_at set, lead_state=ENGAGED or QUALIFIED" },
    ],
  },
  ai_booking_agent: {
    label: "Live Call Transcription / Summaries",
    sources: [
      { entity: "WebsiteLead", required: true, purpose: "Call transcript / summary proof", key_fields: "transcript NOT NULL or call_summary NOT NULL" },
      { entity: "AutomationProofLog", required: true, purpose: "Formal proof record", key_fields: "service_key=ai_booking_agent, status=pass" },
      { entity: "AdminSettings", required: false, purpose: "Voice webhook URL", key_fields: "voice_webhook_url set" },
    ],
  },
  inbound_sms_assistant: {
    label: "Client SMS Onboarding / Status Updates",
    sources: [
      { entity: "CommunicationEvent", required: true, purpose: "Inbound SMS event + classification/response", key_fields: "direction=inbound, channel=sms, status=received" },
      { entity: "CommunicationLog", required: false, purpose: "Outbound response log", key_fields: "delivery_status=delivered, direction=outbound" },
      { entity: "AutomationProofLog", required: true, purpose: "Formal proof record", key_fields: "service_key=inbound_sms_assistant, status=pass" },
      { entity: "Leads", required: false, purpose: "Lead with reply classification", key_fields: "ai_intent set, reply_sentiment set" },
    ],
  },
  ai_voice_receptionist: {
    label: "AI Receptionist / Voice Agent",
    sources: [
      { entity: "AdminSettings", required: true, purpose: "ElevenLabs agent IDs, phone number IDs, voice webhook", key_fields: "inbound_voice_enabled=true, elevenlabs_agent_ids populated, voice_webhook_url set" },
      { entity: "CommunicationEvent", required: true, purpose: "Inbound voice call event", key_fields: "channel=voice, direction=inbound" },
      { entity: "WebsiteLead", required: true, purpose: "Call transcript / summary proof", key_fields: "transcript NOT NULL" },
      { entity: "AutomationProofLog", required: true, purpose: "Formal proof record", key_fields: "service_key=ai_voice_receptionist, status=pass" },
    ],
  },
  review_request: {
    label: "Review Request Engine",
    sources: [
      { entity: "AdminSettings", required: true, purpose: "Review link default", key_fields: "booking_link_default or review_link configured" },
      { entity: "AutomationChecklist", required: true, purpose: "Per-client review link confirmation", key_fields: "review_link_set=true" },
      { entity: "CommunicationLog", required: true, purpose: "Outbound review request SMS/email", key_fields: "delivery_status=delivered, trigger_name contains 'review'" },
      { entity: "AutomationProofLog", required: true, purpose: "Formal proof record", key_fields: "service_key=review_request, status=pass" },
    ],
  },
  lead_reactivation: {
    label: "Referral Engine",
    sources: [
      { entity: "Leads", required: true, purpose: "Dormant lead segment identified", key_fields: "lead_state=DORMANT, segment_label set" },
      { entity: "CommunicationLog", required: true, purpose: "Reactivation outreach log", key_fields: "delivery_status=delivered, trigger_name contains 'reactivation'" },
      { entity: "AutomationProofLog", required: true, purpose: "Formal proof record", key_fields: "service_key=lead_reactivation, status=pass" },
      { entity: "ClientProject", required: false, purpose: "Client project with reactivation enabled", key_fields: "project status active" },
    ],
  },
  voice_broadcasts: {
    label: "Voice Broadcasts / Promotional Calling",
    sources: [
      { entity: "AdminSettings", required: true, purpose: "Voice calls enabled flag, ElevenLabs config", key_fields: "voice_calls_enabled=true, elevenlabs_agent_ids populated" },
      { entity: "CommunicationEvent", required: true, purpose: "Outbound voice call events", key_fields: "channel=voice, direction=outbound" },
      { entity: "AutomationProofLog", required: true, purpose: "Formal proof record", key_fields: "service_key=ai_voice_receptionist, status=pass" },
    ],
  },
  automation_proof_logs: {
    label: "Formal Automation Proof Logs",
    sources: [
      { entity: "AutomationProofLog", required: true, purpose: "Proof records for every service key", key_fields: "status=pass for each service_key" },
      { entity: "AdminSettings", required: false, purpose: "Settings summary for context", key_fields: "twilio_enabled, resend_enabled" },
    ],
  },
};

const ALL_ENTITIES = [
  "AdminSettings", "CommunicationLog", "CommunicationEvent", "AutomationChecklist",
  "AutomationProofLog", "WebsiteLead", "Leads", "ClientProject",
  "ClientInstallationOS", "OnboardingClient",
];

export default function EvidenceSourceMap() {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-2">
        <Database className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Admin-only reference: maps each capability to the exact entity sources that should be checked
          for evidence. Required sources must exist with valid data; optional sources add confidence.
        </p>
      </div>

      {/* Entity coverage legend */}
      <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Entities in Scope</p>
        <div className="flex flex-wrap gap-2">
          {ALL_ENTITIES.map(ent => (
            <span key={ent} className="text-[11px] font-mono text-gray-600 bg-gray-100 rounded px-2 py-0.5">
              {ent}
            </span>
          ))}
        </div>
      </div>

      {/* Per-capability source map */}
      {Object.entries(EVIDENCE_SOURCE_MAP).map(([capKey, capData]) => (
        <div key={capKey} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div className="mb-3">
            <h4 className="text-sm font-bold text-gray-900">{capData.label}</h4>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{capKey}</p>
          </div>
          <div className="space-y-2">
            {capData.sources.map((src, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                <div className="flex-shrink-0 mt-0.5">
                  {src.required ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <MinusCircle className="w-3.5 h-3.5 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-900 font-mono">{src.entity}</span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                      style={src.required
                        ? { color: "#DC2626", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }
                        : { color: "#6B7280", background: "rgba(107,114,128,0.06)", border: "1px solid rgba(107,114,128,0.2)" }
                      }
                    >
                      {src.required ? "Required" : "Optional"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    <span className="font-semibold text-gray-600">Purpose:</span> {src.purpose}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    <span className="font-semibold text-gray-600">Key fields/status:</span>{" "}
                    <code className="text-[10px] bg-gray-100 rounded px-1 py-0.5 text-gray-700">{src.key_fields}</code>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}