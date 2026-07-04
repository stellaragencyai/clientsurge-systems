import {
  X, CheckCircle2, XCircle, AlertTriangle, FileText, ClipboardList,
  Database, Settings, ArrowRight, ListChecks,
} from "lucide-react";

const STATUS_STYLES = {
  green: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Proven" },
  yellow: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Partial" },
  red: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Not Done" },
};

const CAPABILITY_META = {
  ai_voice_receptionist: {
    entities: ["AdminSettings.elevenlabs_agent_ids", "AdminSettings.elevenlabs_phone_number_ids", "AdminSettings.inbound_voice_enabled", "CommunicationEvent (channel=voice)", "AutomationProofLog (service_key=ai_voice_receptionist)", "WebsiteLead.transcript"],
    setupFields: [
      { key: "inbound_voice_enabled", label: "Inbound Voice Enabled", source: "voice_readiness" },
      { key: "voice_calls_enabled", label: "Voice Calls Enabled", source: "voice_readiness" },
      { key: "has_elevenlabs_agent_ids", label: "ElevenLabs Agent IDs", source: "voice_readiness" },
      { key: "has_elevenlabs_phone_number_ids", label: "ElevenLabs Phone Number IDs", source: "voice_readiness" },
      { key: "has_transcript_proof", label: "Transcript Proof", source: "voice_readiness" },
      { key: "voice_webhook_url", label: "Voice Webhook URL", source: "voice_readiness" },
    ],
  },
  missed_call_text_back: {
    entities: ["AdminSettings.missed_call_webhook_url", "CommunicationLog (trigger_name contains missed_call)", "CommunicationEvent (event_type contains missed_call)", "AutomationProofLog (service_key=missed_call_text_back)"],
    setupFields: [
      { key: "webhook_status", label: "Webhook Status", source: "missed_call" },
      { key: "has_404", label: "Webhook 404 Error", source: "missed_call", invert: true },
      { key: "has_405", label: "Webhook 405 Error", source: "missed_call", invert: true },
    ],
  },
  instant_lead_response: {
    entities: ["CommunicationLog (channel=sms)", "CommunicationEvent (channel=sms)", "AutomationProofLog (service_key=instant_lead_response)"],
    setupFields: [
      { key: "delivered", label: "Delivered SMS Records", source: "delivery" },
      { key: "with_provider_message_id", label: "Records with Provider Message ID", source: "delivery" },
    ],
  },
  nurture_sequence_14d: {
    entities: ["CommunicationLog (trigger_name contains nurture)", "AutomationProofLog (service_key=nurture_sequence_14d)", "AdminSettings (cadence settings)"],
    setupFields: [
      { key: "with_provider_message_id", label: "Records with Provider Message ID", source: "delivery" },
    ],
  },
  review_request: {
    entities: ["AutomationChecklist (service_key=review_request)", "AutomationProofLog (service_key=review_request)", "AdminSettings.review_link_set"],
    setupFields: [],
  },
  lead_reactivation: {
    entities: ["AutomationProofLog (service_key=lead_reactivation)", "Leads (segment=DORMANT)"],
    setupFields: [],
  },
  inbound_sms_assistant: {
    entities: ["CommunicationEvent (channel=sms, direction=inbound)", "AutomationProofLog (service_key=inbound_sms_assistant)"],
    setupFields: [],
  },
  ai_booking_agent: {
    entities: ["WebsiteLead.transcript", "AutomationProofLog (service_key=ai_booking_agent)"],
    setupFields: [
      { key: "has_transcript_proof", label: "Transcript Proof", source: "voice_readiness" },
    ],
  },
  automation_proof_logs: {
    entities: ["AutomationProofLog (all records)"],
    setupFields: [],
  },
};

function getLatestChecklist(data, serviceKey) {
  if (!serviceKey) return null;
  const cls = (data.qa_checklists || []).filter(c => c.service_key === serviceKey);
  if (cls.length === 0) return null;
  return cls[0];
}

function getProofStats(data, serviceKey) {
  if (!serviceKey) {
    const proof = data.proof_by_service || {};
    const allProofs = Object.values(proof);
    return {
      total: allProofs.reduce((s, p) => s + (p.total || 0), 0),
      passed: allProofs.reduce((s, p) => s + (p.passed || 0), 0),
      failed: allProofs.reduce((s, p) => s + (p.failed || 0), 0),
      pending: allProofs.reduce((s, p) => s + (p.pending || 0), 0),
    };
  }
  return data.proof_by_service?.[serviceKey] || { total: 0, passed: 0, failed: 0, pending: 0 };
}

function getEvidenceSummary(cap, data) {
  const parts = [];
  if (cap.evidence_sources?.length > 0) {
    parts.push(...cap.evidence_sources);
  }
  if (cap.proof) {
    parts.push(`Proof logs: ${cap.proof.total} total (${cap.proof.passed} passed, ${cap.proof.pending} pending, ${cap.proof.failed} failed)`);
  }
  return parts;
}

function getSetupFieldValue(field, data) {
  if (field.source === "voice_readiness") return data.voice_readiness?.[field.key];
  if (field.source === "missed_call") return data.missed_call_stats?.[field.key];
  if (field.source === "delivery") return data.delivery_stats?.[field.key];
  return null;
}

function isFieldComplete(field, value) {
  if (field.invert) return !value;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") return value === "configured" || value.length > 0;
  return !!value;
}

export default function CapabilityDetailDrawer({ capability, data, onClose }) {
  if (!capability) return null;
  const meta = CAPABILITY_META[capability.key] || { entities: [], setupFields: [] };
  const style = STATUS_STYLES[capability.status] || STATUS_STYLES.red;
  const StatusIcon = style.icon;
  const latestChecklist = getLatestChecklist(data, capability.service_key);
  const proofStats = getProofStats(data, capability.service_key);
  const evidenceSummary = getEvidenceSummary(capability, data);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-y-auto h-full">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-3 z-10">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
              <StatusIcon className="w-4 h-4" style={{ color: style.color }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{capability.label}</h3>
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold inline-block mt-1" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                {style.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Entities used */}
          <Section icon={Database} title="Entities Used to Evaluate">
            <ul className="space-y-1">
              {meta.entities.map((e, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-gray-300 mt-0.5">▸</span>
                  <code className="text-[11px] font-mono text-gray-700 break-all">{e}</code>
                </li>
              ))}
            </ul>
          </Section>

          {/* Evidence summary */}
          <Section icon={FileText} title="Evidence Summary">
            {evidenceSummary.length > 0 ? (
              <ul className="space-y-1">
                {evidenceSummary.map((e, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-gray-300 mt-0.5 flex-shrink-0" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">No evidence records found.</p>
            )}
          </Section>

          {/* Blockers */}
          <Section icon={AlertTriangle} title="Blockers">
            {capability.blockers?.length > 0 ? (
              <ul className="space-y-1">
                {capability.blockers.map((b, i) => (
                  <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                    <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-green-600 font-medium">No blockers detected.</p>
            )}
          </Section>

          {/* Incomplete setup fields */}
          <Section icon={Settings} title="Incomplete Setup Fields">
            {meta.setupFields.length > 0 ? (
              <div className="space-y-1.5">
                {meta.setupFields.map((field) => {
                  const value = getSetupFieldValue(field, data);
                  const complete = isFieldComplete(field, value);
                  return (
                    <div key={field.key} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-gray-600">{field.label}</span>
                      <span className={`font-semibold ${complete ? "text-green-600" : "text-red-600"}`}>
                        {complete ? "✓ Set" : "✗ Missing"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No specific setup fields tracked for this capability.</p>
            )}
          </Section>

          {/* Latest checklist record */}
          <Section icon={ClipboardList} title="Latest Related Checklist Record">
            {latestChecklist ? (
              <div className="space-y-1 text-xs text-gray-600">
                <p><span className="font-semibold text-gray-900">{latestChecklist.business_name || "Unknown"}</span></p>
                <p>Service: <code className="font-mono">{latestChecklist.service_key}</code></p>
                <p>Status: <span className="font-semibold">{latestChecklist.status || "unknown"}</span></p>
                <p>Last tested: {latestChecklist.last_tested_at ? new Date(latestChecklist.last_tested_at).toLocaleString() : "never"}</p>
                <p>Went live: {latestChecklist.went_live_at ? new Date(latestChecklist.went_live_at).toLocaleString() : "not yet"}</p>
                {latestChecklist.all_false && <p className="text-red-600 font-semibold mt-1">⚠ All checklist flags are false.</p>}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No AutomationChecklist record found for this service.</p>
            )}
          </Section>

          {/* Latest proof record */}
          <Section icon={CheckCircle2} title="Latest Related Proof Record">
            {proofStats && proofStats.total > 0 ? (
              <div className="space-y-1 text-xs text-gray-600">
                <p>Total proof logs: <span className="font-semibold text-gray-900">{proofStats.total}</span></p>
                <p>Passed: <span className="font-semibold text-green-600">{proofStats.passed}</span> · Pending: <span className="font-semibold text-amber-600">{proofStats.pending}</span> · Failed: <span className="font-semibold text-red-600">{proofStats.failed}</span></p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No AutomationProofLog records exist for this service.</p>
            )}
          </Section>

          {/* Latest communication/evidence record */}
          <Section icon={Database} title="Latest Communication / Evidence Record">
            <CommunicationEvidence capability={capability} data={data} />
          </Section>

          {/* Next admin action */}
          <Section icon={ArrowRight} title="Next Admin Action">
            <p className="text-xs text-gray-700 font-medium leading-relaxed">{capability.next_action || "No action specified."}</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: SectionIcon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <SectionIcon className="w-3.5 h-3.5 text-gray-400" />
        <h4 className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{title}</h4>
      </div>
      <div className="ml-5">{children}</div>
    </div>
  );
}

function CommunicationEvidence({ capability, data }) {
  const key = capability.key;
  if (key === "missed_call_text_back" && data.missed_call_stats) {
    const mc = data.missed_call_stats;
    return (
      <div className="space-y-1 text-xs text-gray-600">
        <p>Webhook status: <span className="font-semibold">{mc.webhook_status}</span></p>
        <p>SMS attempts: <span className="font-semibold">{mc.sms_attempts}</span></p>
        <p>Successful sends: <span className="font-semibold text-green-600">{mc.successful_sends}</span></p>
        <p>Failures: <span className="font-semibold text-red-600">{mc.failures}</span></p>
        {mc.last_error && <p className="text-red-500">Last error: {mc.last_error}</p>}
      </div>
    );
  }
  if (key === "instant_lead_response" && data.delivery_stats) {
    const ds = data.delivery_stats;
    return (
      <div className="space-y-1 text-xs text-gray-600">
        <p>Total SMS logs: <span className="font-semibold">{ds.total}</span></p>
        <p>Delivered: <span className="font-semibold text-green-600">{ds.delivered}</span></p>
        <p>Sent only: <span className="font-semibold text-amber-600">{ds.sent_only}</span></p>
        <p>Weak proof: <span className="font-semibold text-amber-600">{ds.weak_proof_count}</span></p>
      </div>
    );
  }
  if (key === "ai_voice_receptionist" && data.voice_readiness) {
    const vr = data.voice_readiness;
    return (
      <div className="space-y-1 text-xs text-gray-600">
        <p>Inbound voice enabled: <span className={vr.inbound_voice_enabled ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{String(vr.inbound_voice_enabled)}</span></p>
        <p>Has transcript proof: <span className={vr.has_transcript_proof ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{String(vr.has_transcript_proof)}</span></p>
        {vr.blockers?.length > 0 && <p className="text-red-500">Blockers: {vr.blockers.join(", ")}</p>}
      </div>
    );
  }
  if (key === "ai_booking_agent" && data.voice_readiness) {
    return (
      <div className="space-y-1 text-xs text-gray-600">
        <p>Transcript proof: <span className={data.voice_readiness.has_transcript_proof ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{String(data.voice_readiness.has_transcript_proof)}</span></p>
      </div>
    );
  }
  if (data.event_stats) {
    const es = data.event_stats;
    return (
      <div className="space-y-1 text-xs text-gray-600">
        <p>Total CommunicationEvents: <span className="font-semibold">{es.total}</span></p>
        <p>With provider message ID: <span className="font-semibold text-green-600">{es.with_provider_message_id}</span></p>
        <p>Twilio 400 errors: <span className="font-semibold text-red-600">{es.twilio_400_errors}</span></p>
        <p>Failed events: <span className="font-semibold text-red-600">{es.failed_events}</span></p>
      </div>
    );
  }
  return <p className="text-xs text-gray-400">No communication evidence available.</p>;
}