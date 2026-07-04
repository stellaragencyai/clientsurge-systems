import {
  AlertTriangle, XCircle, AlertOctagon, MinusCircle, ShieldAlert,
  FileX, ClipboardX, ServerCrash, FileWarning, MicOff, Database,
} from "lucide-react";

const SEVERITY_STYLES = {
  critical: { color: "#DC2626", bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.2)", icon: XCircle, label: "Critical" },
  high: { color: "#EA580C", bg: "rgba(234,88,12,0.06)", border: "rgba(234,88,12,0.2)", icon: AlertOctagon, label: "High" },
  medium: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Medium" },
  low: { color: "#6B7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.2)", icon: MinusCircle, label: "Low" },
};

const REPAIR_TYPE_ICONS = {
  missing_proof_record: FileX,
  incomplete_checklist: ClipboardX,
  provider_error_in_logs: ServerCrash,
  weak_evidence_record: FileWarning,
  missing_voice_prerequisite: MicOff,
  test_data_in_production: Database,
  missing_client_facing_trust: ShieldAlert,
};

const SERVICE_LABELS = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  inbound_sms_assistant: "Inbound SMS Assistant",
  ai_voice_receptionist: "AI Voice Receptionist",
  nurture_sequence_14d: "Nurture Sequence (14-Day)",
  review_request: "Review Request",
  lead_reactivation: "Lead Reactivation",
  ai_booking_agent: "AI Booking Agent",
};

const REPAIR_TYPE_LABELS = {
  missing_proof_record: "Missing Proof Record",
  incomplete_checklist: "Incomplete Automation Checklist",
  provider_error_in_logs: "Provider Error in Logs",
  weak_evidence_record: "Weak Evidence Record",
  missing_voice_prerequisite: "Missing Voice Assistant Prerequisite",
  test_data_in_production: "Internal/Test Data in Production View",
  missing_client_facing_trust: "Missing Client-Facing Trust Evidence",
};

const REVENUE_IMPACT = {
  instant_lead_response: { label: "Critical", color: "#DC2626" },
  missed_call_text_back: { label: "Critical", color: "#DC2626" },
  ai_voice_receptionist: { label: "High", color: "#EA580C" },
  nurture_sequence_14d: { label: "High", color: "#EA580C" },
  inbound_sms_assistant: { label: "Medium", color: "#D97706" },
  review_request: { label: "Medium", color: "#D97706" },
  lead_reactivation: { label: "Low", color: "#6B7280" },
  ai_booking_agent: { label: "High", color: "#EA580C" },
};

function getRevenueImpactForCapability(affectedCapability) {
  for (const [key, val] of Object.entries(REVENUE_IMPACT)) {
    if (affectedCapability && affectedCapability.includes(key)) return val;
  }
  return { label: "Low", color: "#6B7280" };
}

/**
 * Derives repair items from the existing audit data returned by getTwilioGrowthEngineAudit.
 * No external calls, no provider triggers — purely computed from app data.
 */
function buildRepairItems(data) {
  if (!data) return [];
  const items = [];

  const proofByService = data.proof_by_service || {};
  const capabilities = data.capabilities || [];
  const deliveryStats = data.delivery_stats || {};
  const eventStats = data.event_stats || {};
  const missedCallStats = data.missed_call_stats || {};
  const voiceReadiness = data.voice_readiness || {};
  const qaChecklists = data.qa_checklists || [];
  const quarantine = data.quarantine || {};
  const proofLogsEmpty = data.proof_logs_empty;

  // 1. Missing proof record — for each service_key with zero proof logs
  for (const [serviceKey, proof] of Object.entries(proofByService)) {
    if (proof.total === 0) {
      const cap = capabilities.find(c => c.service_key === serviceKey);
      items.push({
        repair_type: "missing_proof_record",
        affected_capability: SERVICE_LABELS[serviceKey] || serviceKey,
        evidence_source: "AutomationProofLog",
        severity: serviceKey === "instant_lead_response" || serviceKey === "missed_call_text_back" ? "critical" : "high",
        why_it_matters: "No proof log exists for this capability. It cannot be marked trusted without a passed proof record.",
        recommended_next_admin_action: `Create and pass an AutomationProofLog for ${serviceKey}.`,
        safe_to_mark_complete: false,
      });
    } else if (proof.passed === 0) {
      const cap = capabilities.find(c => c.service_key === serviceKey);
      items.push({
        repair_type: "missing_proof_record",
        affected_capability: SERVICE_LABELS[serviceKey] || serviceKey,
        evidence_source: `AutomationProofLog (${proof.total} records, 0 passed)`,
        severity: "high",
        why_it_matters: "Proof logs exist but none have passed. The capability remains untrusted.",
        recommended_next_admin_action: `Review pending/failed proof logs for ${serviceKey} and resolve blockers.`,
        safe_to_mark_complete: false,
      });
    }
  }

  // 2. Incomplete automation checklist — checklists with missing required flags
  for (const cl of qaChecklists) {
    const missingFlags = [];
    if (!cl.twilio_configured) missingFlags.push("twilio_configured");
    if (!cl.resend_configured) missingFlags.push("resend_configured");
    if (!cl.booking_link_set) missingFlags.push("booking_link_set");
    if (!cl.review_link_set) missingFlags.push("review_link_set");
    if (!cl.lead_form_connected) missingFlags.push("lead_form_connected");
    if (!cl.communication_event_logging_verified) missingFlags.push("communication_event_logging_verified");
    if (!cl.test_lead_sent) missingFlags.push("test_lead_sent");
    if (!cl.test_response_received) missingFlags.push("test_response_received");
    if (!cl.client_approved) missingFlags.push("client_approved");

    if (missingFlags.length > 0) {
      const isAllFalse = cl.all_false;
      items.push({
        repair_type: "incomplete_checklist",
        affected_capability: `${cl.business_name || "Unknown"} — ${SERVICE_LABELS[cl.service_key] || cl.service_key || "unknown"}`,
        evidence_source: `AutomationChecklist (${missingFlags.length} missing flags)`,
        severity: isAllFalse ? "critical" : missingFlags.length > 5 ? "high" : "medium",
        why_it_matters: `Checklist has ${missingFlags.length} unmet requirement(s): ${missingFlags.join(", ")}. Cannot go live until all required flags are true and client has signed off.`,
        recommended_next_admin_action: isAllFalse
          ? "Configure all checklist fields — this record has no setup completed."
          : `Complete: ${missingFlags.join(", ")}.`,
        safe_to_mark_complete: false,
      });
    }
  }

  // 3. Provider error present in logs
  if (eventStats.twilio_400_errors > 0) {
    items.push({
      repair_type: "provider_error_in_logs",
      affected_capability: "SMS / Twilio delivery",
      evidence_source: `CommunicationEvent (${eventStats.twilio_400_errors} Twilio 400 errors)`,
      severity: "high",
      why_it_matters: "Twilio is returning 400 errors. This indicates bad request payloads, invalid sender permissions, or credential issues.",
      recommended_next_admin_action: "Inspect the error_message field on failed CommunicationEvent records. Check request payloads and Twilio sender permissions.",
      safe_to_mark_complete: false,
    });
  }

  if (eventStats.failed_events > 0) {
    items.push({
      repair_type: "provider_error_in_logs",
      affected_capability: "SMS / Twilio delivery",
      evidence_source: `CommunicationEvent (${eventStats.failed_events} failed events)`,
      severity: "medium",
      why_it_matters: "Failed communication events indicate delivery or processing failures that need investigation.",
      recommended_next_admin_action: "Review failed CommunicationEvent records and identify the failure pattern.",
      safe_to_mark_complete: false,
    });
  }

  if (deliveryStats.failed > 0) {
    items.push({
      repair_type: "provider_error_in_logs",
      affected_capability: "SMS / Twilio delivery",
      evidence_source: `CommunicationLog (${deliveryStats.failed} failed SMS logs)`,
      severity: "medium",
      why_it_matters: "SMS delivery failures are present in the log. These need investigation before claiming SMS is trusted.",
      recommended_next_admin_action: "Inspect error_message on failed CommunicationLog records.",
      safe_to_mark_complete: false,
    });
  }

  if (missedCallStats.has_404) {
    items.push({
      repair_type: "provider_error_in_logs",
      affected_capability: "Missed Call Text-Back",
      evidence_source: "AdminSettings.last_webhook_test_result (404 detected)",
      severity: "critical",
      why_it_matters: "The missed-call webhook is returning 404. Twilio cannot reach the function, so the entire missed-call flow is broken.",
      recommended_next_admin_action: "Repair the missed-call webhook URL in Twilio console so it returns 200.",
      safe_to_mark_complete: false,
    });
  }

  if (missedCallStats.has_405) {
    items.push({
      repair_type: "provider_error_in_logs",
      affected_capability: "Missed Call Text-Back",
      evidence_source: "AdminSettings.last_webhook_test_result (405 detected)",
      severity: "critical",
      why_it_matters: "The missed-call webhook is returning 405 Method Not Allowed.",
      recommended_next_admin_action: "Fix the webhook HTTP method configuration.",
      safe_to_mark_complete: false,
    });
  }

  // 4. Weak evidence record
  if (deliveryStats.weak_proof_count > 0) {
    items.push({
      repair_type: "weak_evidence_record",
      affected_capability: "SMS delivery",
      evidence_source: `CommunicationLog (${deliveryStats.weak_proof_count} records with null provider_message_id + status=sent/queued)`,
      severity: "medium",
      why_it_matters: "SMS logs show 'sent' status without a Twilio provider_message_id. This is weak proof — cannot confirm actual delivery.",
      recommended_next_admin_action: "Inspect why provider_message_id is null. Check Twilio API response handling and sender configuration.",
      safe_to_mark_complete: false,
    });
  }

  if (eventStats.weak_outbound_proof > 0) {
    items.push({
      repair_type: "weak_evidence_record",
      affected_capability: "SMS / CommunicationEvent",
      evidence_source: `CommunicationEvent (${eventStats.weak_outbound_proof} outbound events without provider_message_id)`,
      severity: "medium",
      why_it_matters: "Outbound communication events lack a provider_message_id, meaning delivery cannot be confirmed.",
      recommended_next_admin_action: "Verify that outbound SMS functions are capturing the Twilio message SID.",
      safe_to_mark_complete: false,
    });
  }

  if (deliveryStats.without_provider_message_id > 0 && deliveryStats.weak_proof_count === 0) {
    items.push({
      repair_type: "weak_evidence_record",
      affected_capability: "SMS delivery",
      evidence_source: `CommunicationLog (${deliveryStats.without_provider_message_id} records without provider_message_id)`,
      severity: "low",
      why_it_matters: "Communication logs are missing provider message IDs. While not all may be weak, this reduces evidence quality.",
      recommended_next_admin_action: "Ensure all outbound SMS logs capture the Twilio message SID.",
      safe_to_mark_complete: false,
    });
  }

  // 5. Missing voice assistant prerequisite
  if (voiceReadiness.blockers && voiceReadiness.blockers.length > 0) {
    for (const blocker of voiceReadiness.blockers) {
      let severity = "high";
      if (blocker.includes("inbound_voice_enabled")) severity = "medium";
      if (blocker.includes("agent IDs")) severity = "high";
      if (blocker.includes("transcript")) severity = "high";
      items.push({
        repair_type: "missing_voice_prerequisite",
        affected_capability: "AI Voice Receptionist",
        evidence_source: "AdminSettings + WebsiteLead (transcript check)",
        severity,
        why_it_matters: `Voice readiness blocker: ${blocker}. AI voice features cannot be trusted until this is resolved.`,
        recommended_next_admin_action: blocker.includes("agent IDs")
          ? "Configure ElevenLabs agent IDs in AdminSettings."
          : blocker.includes("transcript")
            ? "Run a real inbound call to generate transcript proof on WebsiteLead."
            : "Enable inbound_voice_enabled after prerequisites are met.",
        safe_to_mark_complete: false,
      });
    }
  }

  // 6. Internal/test data included in production view
  if (quarantine.excluded_leads_count > 0) {
    items.push({
      repair_type: "test_data_in_production",
      affected_capability: "Production data cleanliness",
      evidence_source: `WebsiteLead sample (${quarantine.excluded_leads_count} excluded test/internal records)`,
      severity: "low",
      why_it_matters: "Internal, smoke, or test records exist in the production database. They are excluded from metrics but should be reviewed.",
      recommended_next_admin_action: "Review excluded records and confirm they are correctly quarantined from production KPIs.",
      safe_to_mark_complete: false,
    });
  }

  // 7. Missing client-facing trust evidence
  if (proofLogsEmpty) {
    items.push({
      repair_type: "missing_client_facing_trust",
      affected_capability: "All automations",
      evidence_source: "AutomationProofLog (empty)",
      severity: "critical",
      why_it_matters: "AutomationProofLog is empty. No automation can be presented as production-trusted to clients.",
      recommended_next_admin_action: "Create and pass AutomationProofLog records for each automation service before claiming go-live.",
      safe_to_mark_complete: false,
    });
  }

  // Also check for capabilities that are red — meaning client-facing trust is missing
  const redCapabilities = capabilities.filter(c => c.status === "red" && c.key !== "automation_proof_logs");
  if (redCapabilities.length > 0 && !proofLogsEmpty) {
    items.push({
      repair_type: "missing_client_facing_trust",
      affected_capability: `${redCapabilities.length} capability(ies) at red status`,
      evidence_source: "Capability Matrix (computed from audit data)",
      severity: "high",
      why_it_matters: `These capabilities have no proven infrastructure: ${redCapabilities.map(c => c.label).join(", ")}. They cannot be shown as trusted to clients.`,
      recommended_next_admin_action: "Configure infrastructure and create proof records for each red capability.",
      safe_to_mark_complete: false,
    });
  }

  // Sort by severity: critical > high > medium > low
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

  return items;
}

export default function TwilioGrowthEngineRepairQueue({ data, onRefresh }) {
  const repairItems = buildRepairItems(data);

  const counts = {
    critical: repairItems.filter(i => i.severity === "critical").length,
    high: repairItems.filter(i => i.severity === "high").length,
    medium: repairItems.filter(i => i.severity === "medium").length,
    low: repairItems.filter(i => i.severity === "low").length,
  };

  return (
    <div className="space-y-4">
      {/* Explanation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            This repair queue is generated from current app data only. It shows the next concrete repair items
            without claiming any are complete. No feature is marked trusted based on vibes — every item must be
            resolved with real evidence before its status changes.
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(SEVERITY_STYLES).map(([key, style]) => {
          const Icon = style.icon;
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-3" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color: style.color }} />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{style.label}</p>
              </div>
              <p className="text-lg font-bold" style={{ color: style.color }}>{counts[key] || 0}</p>
            </div>
          );
        })}
      </div>

      {/* Repair items */}
      {repairItems.length === 0 ? (
        <div className="bg-green-50 rounded-xl border border-green-200 p-6 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-700 font-semibold">No repair items detected from current data. Keep maintaining proof records.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {repairItems.map((item, idx) => {
            const sevStyle = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.low;
            const SevIcon = sevStyle.icon;
            const TypeIcon = REPAIR_TYPE_ICONS[item.repair_type] || AlertTriangle;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border p-4"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)", borderColor: sevStyle.border }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: sevStyle.bg, border: `1px solid ${sevStyle.border}` }}
                  >
                    <TypeIcon className="w-4 h-4" style={{ color: sevStyle.color }} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900">{REPAIR_TYPE_LABELS[item.repair_type] || item.repair_type}</p>
                      {(() => {
                        const ri = getRevenueImpactForCapability(item.affected_capability);
                        return (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide flex-shrink-0" style={{ color: ri.color, background: `${ri.color}11`, border: `1px solid ${ri.color}30` }}>
                            {ri.label} Rev
                          </span>
                        );
                      })()}
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide flex-shrink-0"
                        style={{ color: sevStyle.color, background: sevStyle.bg, border: `1px solid ${sevStyle.border}` }}
                      >
                        {sevStyle.label}
                      </span>
                      {item.safe_to_mark_complete && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                          Safe to complete
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-700">{item.affected_capability}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Evidence Source</p>
                        <p className="text-gray-600 font-mono break-all">{item.evidence_source}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Recommended Next Action</p>
                        <p className="text-gray-600">{item.recommended_next_admin_action}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-400">Why it matters: </span>
                      {item.why_it_matters}
                    </p>
                    {!item.safe_to_mark_complete && (
                      <p className="text-[10px] text-gray-400 italic">
                        Not safe to mark complete — evidence must prove resolution first.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}