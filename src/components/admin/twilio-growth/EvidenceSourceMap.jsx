import { Database, Map, CheckCircle2, Circle } from "lucide-react";

/**
 * Static mapping: each capability → the exact entity sources that should be checked.
 *
 * For each capability:
 * - required: entities that MUST have evidence for this capability to be trusted
 * - optional: entities that provide supporting context but aren't strictly required
 * - purpose: what the source is used for in the context of this capability
 * - fields: the specific fields/statuses that matter
 */
const EVIDENCE_SOURCE_MAP = [
  {
    capability_key: "instant_lead_response",
    capability_label: "Website Speed-to-Lead SMS/Email",
    sources: [
      {
        entity: "CommunicationLog",
        required: true,
        purpose: "SMS delivery proof for the instant lead response",
        fields: "channel=sms, delivery_status=delivered, provider_message_id (non-null), lead_id (valid non-test lead)",
      },
      {
        entity: "CommunicationEvent",
        required: true,
        purpose: "Event-level record of the outbound SMS and its provider response",
        fields: "direction=outbound, channel=sms, provider_message_id (non-null), status=sent or delivered",
      },
      {
        entity: "AutomationProofLog",
        required: true,
        purpose: "Formal proof record confirming the end-to-end test passed",
        fields: "service_key=instant_lead_response, status=pass",
      },
      {
        entity: "Leads",
        required: true,
        purpose: "The real lead that triggered the instant response — must be non-test",
        fields: "quality_reason_codes must NOT include internal_test/smoke_test/example_email; lead_state=NEW or higher",
      },
      {
        entity: "AdminSettings",
        required: true,
        purpose: "Twilio configuration and SMS webhook/callback URLs",
        fields: "twilio_enabled=true, twilio_from_number set, sms_webhook_url set, sms_status_callback_url set",
      },
      {
        entity: "AutomationChecklist",
        optional: true,
        purpose: "Per-client checklist confirming lead form connected and test lead verified",
        fields: "service_key=instant_lead_response, lead_form_connected=true, test_lead_sent=true, test_response_received=true",
      },
    ],
  },
  {
    capability_key: "missed_call_text_back",
    capability_label: "Missed Call Text-Back",
    sources: [
      {
        entity: "CommunicationEvent",
        required: true,
        purpose: "Inbound call event that triggered the missed-call flow",
        fields: "event_type contains missed_call, direction=inbound, channel=voice",
      },
      {
        entity: "CommunicationLog",
        required: true,
        purpose: "The outbound SMS sent in response to the missed call",
        fields: "channel=sms, delivery_status=delivered, trigger_name contains missed_call",
      },
      {
        entity: "AutomationProofLog",
        required: true,
        purpose: "Formal proof record confirming the missed-call recovery test passed",
        fields: "service_key=missed_call_text_back, status=pass",
      },
      {
        entity: "AdminSettings",
        required: true,
        purpose: "Missed-call webhook URL and voice forwarding configuration",
        fields: "missed_call_webhook_url set (not returning 404/405), last_webhook_test_result does not contain 404 or 405",
      },
      {
        entity: "AutomationChecklist",
        optional: true,
        purpose: "Per-client checklist confirming missed-call recovery is configured",
        fields: "service_key=missed_call_text_back, twilio_configured=true, test_lead_sent=true",
      },
    ],
  },
  {
    capability_key: "nurture_sequence_14d",
    capability_label: "AI Sales Follow-Up / Nurture",
    sources: [
      {
        entity: "AutomationProofLog",
        required: true,
        purpose: "Formal proof record confirming the nurture sequence test passed",
        fields: "service_key=nurture_sequence_14d, status=pass",
      },
      {
        entity: "CommunicationLog",
        required: true,
        purpose: "SMS/email delivery proof for each step in the 14-day nurture sequence",
        fields: "channel=sms or email, delivery_status=delivered, provider_message_id (non-null), lead_id (valid)",
      },
      {
        entity: "CommunicationEvent",
        required: true,
        purpose: "Event records for each outbound nurture step with provider confirmation",
        fields: "direction=outbound, provider_message_id (non-null), status=sent or delivered",
      },
      {
        entity: "Leads",
        required: true,
        purpose: "The lead enrolled in the nurture sequence — must be non-test and have valid contact info",
        fields: "lead_state=QUALIFIED or ENGAGED, email_unsubscribed=false, do_not_contact=false",
      },
      {
        entity: "AdminSettings",
        required: true,
        purpose: "Nurture template configuration and cadence settings",
        fields: "nurture_step1_subject through nurture_step8_body configured, cadence_pause_on_reply=true",
      },
      {
        entity: "AutomationChecklist",
        optional: true,
        purpose: "Per-client checklist confirming nurture sequence is active",
        fields: "service_key=nurture_sequence_14d, status=active, test_response_received=true",
      },
    ],
  },
  {
    capability_key: "ai_voice_receptionist",
    capability_label: "AI Receptionist / Voice Agent",
    sources: [
      {
        entity: "AutomationProofLog",
        required: true,
        purpose: "Formal proof record confirming the voice agent test passed",
        fields: "service_key=ai_voice_receptionist, status=pass",
      },
      {
        entity: "CommunicationEvent",
        required: true,
        purpose: "Inbound voice call event — must have more than just a ringing event",
        fields: "channel=voice, direction=inbound, must have call_summary or transcript (non-empty)",
      },
      {
        entity: "WebsiteLead",
        required: true,
        purpose: "Call transcript or summary evidence from a real inbound call",
        fields: "transcript field (non-empty) — ringing-only events are NOT sufficient proof",
      },
      {
        entity: "AdminSettings",
        required: true,
        purpose: "ElevenLabs agent/phone configuration and voice webhook URL",
        fields: "elevenlabs_agent_ids (at least one non-empty), elevenlabs_phone_number_ids (at least one), inbound_voice_enabled=true, voice_webhook_url set",
      },
      {
        entity: "AutomationChecklist",
        optional: true,
        purpose: "Per-client checklist confirming voice agent is configured",
        fields: "service_key=ai_voice_receptionist, twilio_configured=true, communication_event_logging_verified=true",
      },
    ],
  },
  {
    capability_key: "review_request",
    capability_label: "Review Request Engine",
    sources: [
      {
        entity: "AutomationProofLog",
        required: true,
        purpose: "Formal proof record confirming the review request flow passed",
        fields: "service_key=review_request, status=pass",
      },
      {
        entity: "CommunicationLog",
        required: true,
        purpose: "SMS or email delivery proof for the review request message",
        fields: "channel=sms or email, delivery_status=delivered, provider_message_id (non-null)",
      },
      {
        entity: "CommunicationEvent",
        required: true,
        purpose: "Event record for the outbound review request",
        fields: "direction=outbound, provider_message_id (non-null), status=sent or delivered",
      },
      {
        entity: "AdminSettings",
        required: true,
        purpose: "Review link configuration",
        fields: "review_link_set=true (in AutomationChecklist) or booking_link_default set",
      },
      {
        entity: "AutomationChecklist",
        required: true,
        purpose: "Per-client checklist confirming review link is set and test sent",
        fields: "service_key=review_request, review_link_set=true, test_lead_sent=true, test_response_received=true",
      },
      {
        entity: "Leads",
        optional: true,
        purpose: "The lead that received the review request — must be non-test and booked/won",
        fields: "lead_state=BOOKED or WON, quality_reason_codes must NOT include internal_test/smoke_test",
      },
    ],
  },
  {
    capability_key: "lead_reactivation",
    capability_label: "Referral Engine",
    sources: [
      {
        entity: "AutomationProofLog",
        required: true,
        purpose: "Formal proof record confirming the reactivation/referral flow passed",
        fields: "service_key=lead_reactivation, status=pass",
      },
      {
        entity: "Leads",
        required: true,
        purpose: "Dormant leads identified for reactivation outreach",
        fields: "lead_state=DORMANT, quality_reason_codes must NOT include internal_test/smoke_test",
      },
      {
        entity: "CommunicationLog",
        required: true,
        purpose: "SMS/email delivery proof for the reactivation outreach message",
        fields: "channel=sms or email, delivery_status=delivered, provider_message_id (non-null), trigger_name contains reactivation",
      },
      {
        entity: "CommunicationEvent",
        required: true,
        purpose: "Event record for the outbound reactivation message",
        fields: "direction=outbound, provider_message_id (non-null), status=sent or delivered",
      },
      {
        entity: "AutomationChecklist",
        optional: true,
        purpose: "Per-client checklist confirming reactivation flow is configured",
        fields: "service_key=lead_reactivation, status=active",
      },
      {
        entity: "ClientProject",
        optional: true,
        purpose: "Project context for which reactivation is running",
        fields: "status=active (project must be live for reactivation to be meaningful)",
      },
    ],
  },
  {
    capability_key: "inbound_sms_assistant",
    capability_label: "Client SMS Onboarding / Status Updates",
    sources: [
      {
        entity: "AutomationProofLog",
        required: true,
        purpose: "Formal proof record confirming the inbound SMS assistant test passed",
        fields: "service_key=inbound_sms_assistant, status=pass",
      },
      {
        entity: "CommunicationEvent",
        required: true,
        purpose: "Inbound SMS event plus a classification/response record",
        fields: "direction=inbound, channel=sms, must have a response or classification record",
      },
      {
        entity: "CommunicationLog",
        required: true,
        purpose: "Outbound response to the inbound SMS — delivery proof",
        fields: "channel=sms, delivery_status=delivered, provider_message_id (non-null)",
      },
      {
        entity: "AdminSettings",
        required: true,
        purpose: "Inbound SMS webhook URL configuration",
        fields: "sms_webhook_url set (not returning 404/405), twilio_enabled=true",
      },
      {
        entity: "AutomationChecklist",
        optional: true,
        purpose: "Per-client checklist confirming SMS assistant is configured",
        fields: "service_key=inbound_sms_assistant, communication_event_logging_verified=true",
      },
    ],
  },
  {
    capability_key: "ai_booking_agent",
    capability_label: "Live Call Transcription / Summaries",
    sources: [
      {
        entity: "AutomationProofLog",
        required: true,
        purpose: "Formal proof record confirming the transcription/summary test passed",
        fields: "service_key=ai_booking_agent, status=pass",
      },
      {
        entity: "WebsiteLead",
        required: true,
        purpose: "Call transcript or summary evidence from a real inbound call",
        fields: "transcript field (non-empty) — this is the primary evidence of transcription",
      },
      {
        entity: "CommunicationEvent",
        required: true,
        purpose: "Inbound voice call event that generated the transcript",
        fields: "channel=voice, direction=inbound, must have call_summary or transcript (non-empty)",
      },
      {
        entity: "AdminSettings",
        required: true,
        purpose: "Voice webhook and ElevenLabs configuration",
        fields: "voice_webhook_url set, elevenlabs_agent_ids configured",
      },
      {
        entity: "AutomationChecklist",
        optional: true,
        purpose: "Per-client checklist confirming booking agent is configured",
        fields: "service_key=ai_booking_agent, twilio_configured=true, booking_link_set=true",
      },
    ],
  },
  {
    capability_key: "voice_broadcasts",
    capability_label: "Voice Broadcasts / Promotional Calling",
    sources: [
      {
        entity: "AutomationProofLog",
        required: true,
        purpose: "Formal proof record confirming a voice broadcast test passed",
        fields: "service_key=ai_voice_receptionist (voice broadcasts share the voice agent proof), status=pass",
      },
      {
        entity: "AdminSettings",
        required: true,
        purpose: "Voice call configuration and ElevenLabs setup",
        fields: "voice_calls_enabled=true, elevenlabs_agent_ids configured, elevenlabs_phone_number_ids configured",
      },
      {
        entity: "CommunicationEvent",
        required: true,
        purpose: "Outbound voice call event with provider confirmation",
        fields: "channel=voice, direction=outbound, status=sent or delivered",
      },
      {
        entity: "CommunicationLog",
        required: true,
        purpose: "Delivery log for the voice broadcast",
        fields: "channel=voice, delivery_status=delivered or sent",
      },
      {
        entity: "Leads",
        required: true,
        purpose: "Target leads for the broadcast — must be non-test",
        fields: "quality_reason_codes must NOT include internal_test/smoke_test; lead_state >= QUALIFIED",
      },
      {
        entity: "AutomationChecklist",
        optional: true,
        purpose: "Per-client checklist confirming voice broadcast is configured",
        fields: "service_key=ai_voice_receptionist, twilio_configured=true",
      },
    ],
  },
  {
    capability_key: "automation_proof_logs",
    capability_label: "Formal Automation Proof Logs",
    sources: [
      {
        entity: "AutomationProofLog",
        required: true,
        purpose: "The proof log entity itself — must have at least one passed record",
        fields: "status=pass for each service_key; tested_at (recent); service_key must match a canonical service",
      },
      {
        entity: "AdminSettings",
        optional: true,
        purpose: "Provider configuration context for proof records",
        fields: "twilio_enabled, resend_enabled — proof records reference these provider configs",
      },
    ],
  },
];

const ENTITY_DESCRIPTIONS = {
  AdminSettings: "Global provider configuration: Twilio, Resend, ElevenLabs, webhook URLs, templates.",
  CommunicationLog: "Delivery-level log for each outbound SMS/email — delivery_status, provider_message_id, error_message.",
  CommunicationEvent: "Event-level record for inbound and outbound communications — direction, channel, provider_message_id, status.",
  AutomationChecklist: "Per-client per-service checklist: twilio_configured, resend_configured, booking_link_set, test_lead_sent, client_approved.",
  AutomationProofLog: "Formal proof record for each automation service test — service_key, status (pass/fail/pending), tested_at.",
  WebsiteLead: "Website lead capture record — includes transcript field for call transcription evidence.",
  Leads: "Canonical CRM lead entity — lead_state, quality_reason_codes, email_unsubscribed, do_not_contact.",
  ClientProject: "Client project record — status (active/inactive), links to orders and onboarding.",
  ClientInstallationOS: "Installation workflow state — workflow_stage, activation_status, missing_requirements.",
  OnboardingClient: "Client onboarding record — onboarding stage, completion tracking, setup items.",
};

export default function EvidenceSourceMap() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Map className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Evidence Source Map — Admin Only</h3>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Maps each capability to the exact entity sources that should be checked when verifying trust.
          Required sources must have evidence for the capability to be marked trusted.
          Optional sources provide supporting context but aren't strictly required.
        </p>
      </div>

      {/* Entity reference */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-gray-400" />
          <h4 className="text-sm font-bold text-gray-900">Entity Reference</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(ENTITY_DESCRIPTIONS).map(([entity, desc]) => (
            <div key={entity} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <p className="text-xs font-bold text-gray-900 font-mono">{entity}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-capability source mappings */}
      {EVIDENCE_SOURCE_MAP.map((cap) => (
        <CapabilitySourceCard key={cap.capability_key} cap={cap} />
      ))}
    </div>
  );
}

function CapabilitySourceCard({ cap }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-bold text-gray-900">{cap.capability_label}</h4>
        <span className="text-[11px] text-gray-400 font-mono">({cap.capability_key})</span>
      </div>
      <div className="space-y-2">
        {cap.sources.map((src, i) => (
          <SourceRow key={i} src={src} />
        ))}
      </div>
    </div>
  );
}

function SourceRow({ src }) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        src.required
          ? "border-blue-100 bg-blue-50/30"
          : "border-gray-100 bg-gray-50/50"
      }`}
    >
      <div className="flex items-start gap-2">
        {src.required ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
        ) : (
          <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold text-gray-900 font-mono">{src.entity}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                src.required
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {src.required ? "Required" : "Optional"}
            </span>
          </div>
          <div className="space-y-1">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Purpose: </span>
              <span className="text-[11px] text-gray-600">{src.purpose}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Fields/Status: </span>
              <span className="text-[11px] text-gray-600">{src.fields}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}