import { X, CheckCircle2, XCircle, AlertTriangle, FileText, Database } from "lucide-react";
import EvidenceQualityBadge from "./EvidenceQualityBadge";
import { classifyCapabilityEvidence, overallEvidenceQuality, EVIDENCE_QUALITY } from "./evidenceQuality";

const STATUS_STYLES = {
  green: { color: "#059669", label: "Proven" },
  yellow: { color: "#D97706", label: "Partial" },
  red: { color: "#DC2626", label: "Not Done" },
};

export default function CapabilityDetailDrawer({ capability, latestRecords, settingsSummary, onClose }) {
  if (!capability) return null;

  const statusStyle = STATUS_STYLES[capability.status] || STATUS_STYLES.red;
  const classifiedEvidence = classifyCapabilityEvidence(capability);
  const overallQuality = overallEvidenceQuality(capability);
  const qualityConfig = EVIDENCE_QUALITY[overallQuality];

  const entitiesUsed = getEntitiesUsed(capability);
  const incompleteFields = getIncompleteFields(capability, settingsSummary);
  const latestProof = latestRecords?.latest_proof || null;
  const latestChecklist = latestRecords?.latest_checklist || null;
  const latestSmsLog = latestRecords?.latest_sms_log || null;
  const latestEvent = latestRecords?.latest_event || null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-gray-900">{capability.label}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Admin-only detail view</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Status + Evidence Quality */}
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ color: statusStyle.color, background: `${statusStyle.color}11`, border: `1px solid ${statusStyle.color}30` }}
            >
              {statusStyle.label}
            </span>
            <EvidenceQualityBadge quality={overallQuality} />
          </div>

          {/* Entities used */}
          <Section title="Exact Entities Used for Evaluation" icon={Database}>
            <ul className="space-y-1">
              {entitiesUsed.map((e, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-gray-300 mt-0.5">•</span>
                  <span className="font-mono">{e}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Evidence summary */}
          <Section title="Evidence Summary" icon={FileText}>
            {classifiedEvidence.length === 0 ? (
              <p className="text-xs text-gray-400">No evidence checked.</p>
            ) : (
              <ul className="space-y-2">
                {classifiedEvidence.map((e, i) => (
                  <li key={i} className="flex items-start justify-between gap-3">
                    <span className="text-xs text-gray-600 flex-1">{e.source}</span>
                    <EvidenceQualityBadge quality={e.quality} />
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-gray-400 mt-2 italic">{qualityConfig?.description}</p>
          </Section>

          {/* Blockers */}
          {capability.blockers?.length > 0 && (
            <Section title="Blockers" icon={XCircle}>
              <ul className="space-y-1">
                {capability.blockers.map((b, i) => (
                  <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                    <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Incomplete setup fields */}
          {incompleteFields.length > 0 && (
            <Section title="Incomplete Setup Fields" icon={AlertTriangle}>
              <ul className="space-y-1">
                {incompleteFields.map((f, i) => (
                  <li key={i} className="text-xs text-amber-600 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="font-mono">{f}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Latest proof record */}
          <Section title="Latest Related Proof Record" icon={CheckCircle2}>
            {latestProof ? (
              <RecordPreview
                fields={[
                  { label: "service_key", value: latestProof.service_key },
                  { label: "status", value: latestProof.status },
                  { label: "tested_at", value: latestProof.tested_at },
                  { label: "evidence_summary", value: latestProof.evidence_summary },
                ]}
              />
            ) : (
              <p className="text-xs text-gray-400">No AutomationProofLog record found.</p>
            )}
          </Section>

          {/* Latest checklist record */}
          <Section title="Latest Related Checklist Record" icon={CheckCircle2}>
            {latestChecklist ? (
              <RecordPreview
                fields={[
                  { label: "business_name", value: latestChecklist.business_name },
                  { label: "service_key", value: latestChecklist.service_key },
                  { label: "status", value: latestChecklist.status },
                  { label: "went_live_at", value: latestChecklist.went_live_at },
                  { label: "twilio_configured", value: String(latestChecklist.twilio_configured) },
                  { label: "test_response_received", value: String(latestChecklist.test_response_received) },
                  { label: "client_approved", value: String(latestChecklist.client_approved) },
                ]}
              />
            ) : (
              <p className="text-xs text-gray-400">No AutomationChecklist record found.</p>
            )}
          </Section>

          {/* Latest communication/evidence record */}
          <Section title="Latest Communication / Evidence Record" icon={FileText}>
            {latestSmsLog ? (
              <RecordPreview
                fields={[
                  { label: "channel", value: latestSmsLog.channel },
                  { label: "delivery_status", value: latestSmsLog.delivery_status },
                  { label: "provider_message_id", value: latestSmsLog.provider_message_id },
                  { label: "trigger_name", value: latestSmsLog.trigger_name },
                  { label: "created_date", value: latestSmsLog.created_date },
                ]}
              />
            ) : latestEvent ? (
              <RecordPreview
                fields={[
                  { label: "channel", value: latestEvent.channel },
                  { label: "status", value: latestEvent.status },
                  { label: "event_type", value: latestEvent.event_type },
                  { label: "provider_message_id", value: latestEvent.provider_message_id },
                ]}
              />
            ) : (
              <p className="text-xs text-gray-400">No CommunicationLog or CommunicationEvent record found.</p>
            )}
          </Section>

          {/* Next admin action */}
          {capability.next_action && (
            <Section title="Next Admin Action" icon={AlertTriangle}>
              <p className="text-xs text-gray-600">{capability.next_action}</p>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      </div>
      {children}
    </div>
  );
}

function RecordPreview({ fields }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-1.5">
      {fields.map((f, i) => (
        <div key={i} className="flex items-start gap-2 text-xs">
          <span className="font-mono text-gray-400 flex-shrink-0 w-40">{f.label}:</span>
          <span className="text-gray-700 break-all">{f.value || "—"}</span>
        </div>
      ))}
    </div>
  );
}

function getEntitiesUsed(cap) {
  const entities = [];
  const sk = cap.service_key;

  if (cap.key === "automation_proof_logs") {
    entities.push("AutomationProofLog");
    return entities;
  }

  entities.push("AutomationProofLog");
  entities.push("AutomationChecklist");

  if (sk && ["instant_lead_response", "missed_call_text_back", "inbound_sms_assistant", "review_request", "lead_reactivation"].includes(sk)) {
    entities.push("CommunicationLog (sms)");
  }
  if (sk === "ai_voice_receptionist" || sk === "ai_booking_agent" || cap.key === "voice_broadcasts") {
    entities.push("CommunicationEvent (voice)");
    entities.push("AdminSettings (elevenlabs_*)");
  }
  if (sk === "nurture_sequence_14d") {
    entities.push("CommunicationLog (sms)");
    entities.push("CommunicationEvent");
  }
  if (sk === "missed_call_text_back") {
    entities.push("AdminSettings (missed_call_webhook_url)");
  }

  return entities;
}

function getIncompleteFields(cap, settingsSummary) {
  const fields = [];
  const s = settingsSummary || {};

  switch (cap.key) {
    case "ai_voice_receptionist":
    case "voice_broadcasts":
      if (!s.inbound_voice_enabled) fields.push("inbound_voice_enabled");
      if (!s.voice_calls_enabled) fields.push("voice_calls_enabled");
      if (!s.has_elevenlabs_agent_ids) fields.push("elevenlabs_agent_ids");
      if (!s.has_elevenlabs_phone_number_ids) fields.push("elevenlabs_phone_number_ids");
      if (!s.voice_webhook_url) fields.push("voice_webhook_url");
      break;
    case "missed_call_text_back":
      if (!s.missed_call_webhook_url) fields.push("missed_call_webhook_url");
      if (!s.twilio_enabled) fields.push("twilio_enabled");
      break;
    case "instant_lead_response":
      if (!s.twilio_enabled) fields.push("twilio_enabled");
      if (!s.twilio_from_number) fields.push("twilio_from_number");
      if (!s.sms_webhook_url) fields.push("sms_webhook_url");
      break;
    case "nurture_sequence_14d":
      if (!s.twilio_enabled) fields.push("twilio_enabled");
      break;
    case "review_request":
      // review_link_set is per-checklist, not in settings summary
      break;
    case "lead_reactivation":
      break;
    case "inbound_sms_assistant":
      if (!s.sms_webhook_url) fields.push("sms_webhook_url");
      break;
    case "ai_booking_agent":
      if (!s.has_elevenlabs_agent_ids) fields.push("elevenlabs_agent_ids");
      break;
    default:
      break;
  }

  return fields;
}