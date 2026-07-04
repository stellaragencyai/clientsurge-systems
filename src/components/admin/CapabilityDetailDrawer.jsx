import {
  X, CheckCircle2, XCircle, AlertTriangle, MinusCircle,
  Database, FileText, ClipboardList, MessageSquare,
} from "lucide-react";
import OperatorNotesSection from "./OperatorNotesSection";

const STATUS_STYLES = {
  green: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Proven" },
  yellow: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Partial" },
  red: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Not Done" },
};

const ENTITIES_USED = {
  ai_voice_receptionist: ["AdminSettings", "AutomationProofLog", "WebsiteLead", "CommunicationEvent"],
  missed_call_text_back: ["AdminSettings", "CommunicationLog", "CommunicationEvent", "AutomationProofLog", "WebhookRegistration"],
  instant_lead_response: ["CommunicationLog", "CommunicationEvent", "AutomationProofLog", "WebsiteLead", "Leads"],
  nurture_sequence_14d: ["CommunicationLog", "AutomationProofLog", "Leads", "NurtureCampaign"],
  review_request: ["AutomationChecklist", "AutomationProofLog", "CommunicationEvent", "AdminSettings"],
  lead_reactivation: ["AutomationProofLog", "Leads", "CommunicationEvent", "LeadReactivation"],
  inbound_sms_assistant: ["CommunicationEvent", "AutomationProofLog", "AdminSettings"],
  ai_booking_agent: ["WebsiteLead", "AutomationProofLog", "CommunicationEvent"],
  voice_broadcasts: ["AdminSettings", "AutomationProofLog", "CommunicationEvent"],
  automation_proof_logs: ["AutomationProofLog"],
};

function formatDateTime(val) {
  if (!val) return "—";
  try { return new Date(val).toLocaleString(); } catch { return String(val); }
}

function LatestRecordCard({ icon: Icon, title, record, fields }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      </div>
      {!record ? (
        <p className="text-xs text-gray-400 italic">No record found</p>
      ) : (
        <div className="space-y-1">
          {fields.map(({ key, label }) => (
            <div key={key} className="flex items-start gap-2 text-[11px]">
              <span className="text-gray-400 font-medium min-w-[100px] flex-shrink-0">{label}:</span>
              <span className="text-gray-700 font-mono break-all">{String(record[key] ?? "—").slice(0, 200)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CapabilityDetailDrawer({ capability, data, onClose }) {
  if (!capability) return null;
  const style = STATUS_STYLES[capability.status] || STATUS_STYLES.red;
  const Icon = style.icon;
  const entities = ENTITIES_USED[capability.key] || ["AdminSettings", "AutomationProofLog"];
  const latest = data?.latest_records_by_service || {};
  const serviceKey = capability.service_key;

  const latestProof = serviceKey ? latest.proof?.[serviceKey] : null;
  const latestChecklist = serviceKey ? latest.checklist?.[serviceKey] : null;
  const latestCommLog = serviceKey ? latest.comm_log?.[serviceKey] : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
              <Icon className="w-5 h-5" style={{ color: style.color }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{capability.label}</h3>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold inline-block mt-0.5" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                {style.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 py-4 space-y-4">
          {/* Entities used */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Exact Entities Used to Evaluate</p>
            <div className="flex flex-wrap gap-1.5">
              {entities.map(e => (
                <span key={e} className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">{e}</span>
              ))}
            </div>
          </div>

          {/* Evidence summary */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Evidence Summary</p>
            {capability.evidence_sources?.length > 0 ? (
              <ul className="space-y-1">
                {capability.evidence_sources.map((src, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-gray-300 mt-0.5 flex-shrink-0" />
                    <span>{src}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 italic">No evidence checked</p>
            )}
          </div>

          {/* Proof summary */}
          {capability.proof && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Proof Log Summary</p>
              <div className="flex gap-4 text-xs">
                <span className="text-gray-400">Total: <span className="font-semibold text-gray-700">{capability.proof.total}</span></span>
                <span className="text-green-600">Pass: <span className="font-semibold">{capability.proof.passed}</span></span>
                <span className="text-amber-600">Pending: <span className="font-semibold">{capability.proof.pending}</span></span>
                <span className="text-red-600">Fail: <span className="font-semibold">{capability.proof.failed}</span></span>
              </div>
            </div>
          )}

          {/* Blockers */}
          {capability.blockers?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1.5">Blockers</p>
              <ul className="space-y-1">
                {capability.blockers.map((b, i) => (
                  <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                    <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Incomplete setup fields */}
          {serviceKey && latestChecklist && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Incomplete Setup Fields</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: "twilio_configured", label: "Twilio" },
                  { key: "resend_configured", label: "Resend" },
                  { key: "booking_link_set", label: "Booking Link" },
                  { key: "review_link_set", label: "Review Link" },
                  { key: "lead_form_connected", label: "Lead Form" },
                  { key: "communication_event_logging_verified", label: "Event Logging" },
                  { key: "test_lead_sent", label: "Test Lead Sent" },
                  { key: "test_response_received", label: "Test Response" },
                  { key: "client_approved", label: "Client Approved" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    {latestChecklist[key] ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <MinusCircle className="w-3 h-3 text-gray-300 flex-shrink-0" />
                    )}
                    <span className="text-[11px] text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Latest records */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Latest Related Records</p>
            <div className="space-y-2">
              <LatestRecordCard
                icon={FileText}
                title="Latest Proof Record"
                record={latestProof}
                fields={[
                  { key: "service_key", label: "Service" },
                  { key: "status", label: "Status" },
                  { key: "tested_at", label: "Tested At" },
                  { key: "evidence_summary", label: "Evidence" },
                ]}
              />
              <LatestRecordCard
                icon={ClipboardList}
                title="Latest Checklist Record"
                record={latestChecklist}
                fields={[
                  { key: "business_name", label: "Business" },
                  { key: "status", label: "Status" },
                  { key: "last_tested_at", label: "Last Tested" },
                  { key: "went_live_at", label: "Went Live" },
                ]}
              />
              <LatestRecordCard
                icon={MessageSquare}
                title="Latest Communication Record"
                record={latestCommLog}
                fields={[
                  { key: "trigger_name", label: "Trigger" },
                  { key: "delivery_status", label: "Delivery" },
                  { key: "provider_message_id", label: "Provider ID" },
                  { key: "created_date", label: "Created" },
                ]}
              />
            </div>
          </div>

          {/* Next action */}
          {capability.next_action && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-0.5">Next Admin Action</p>
              <p className="text-xs text-blue-700 font-medium">{capability.next_action}</p>
            </div>
          )}

          {/* Operator Notes — admin-only manual observations */}
          <OperatorNotesSection capabilityKey={capability.key} capabilityLabel={capability.label} />
        </div>
      </div>
    </div>
  );
}