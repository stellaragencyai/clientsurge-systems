import {
  AlertTriangle, XCircle, AlertOctagon, Mic, Database,
  ShieldX, Wrench, ChevronRight,
} from "lucide-react";

const SEVERITY_STYLES = {
  critical: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", label: "Critical" },
  high: { color: "#EA580C", bg: "rgba(234,88,12,0.05)", border: "rgba(234,88,12,0.18)", label: "High" },
  medium: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", label: "Medium" },
  low: { color: "#6B7280", bg: "rgba(107,114,128,0.05)", border: "rgba(107,114,128,0.18)", label: "Low" },
};

const REPAIR_TYPE_ICONS = {
  missing_proof: ShieldX,
  incomplete_checklist: AlertOctagon,
  provider_error: XCircle,
  weak_evidence: AlertTriangle,
  voice_prerequisite: Mic,
  test_data_pollution: Database,
  missing_trust_evidence: ShieldX,
};

function buildRepairItems(data) {
  const items = [];
  const caps = data?.capabilities || [];
  const pbs = data?.proof_by_service || {};
  const ds = data?.delivery_stats || {};
  const es = data?.event_stats || {};
  const mc = data?.missed_call_stats || {};
  const vr = data?.voice_readiness || {};
  const q = data?.quarantine || {};
  const latest = data?.latest_records_by_service || {};

  // 1. Missing proof records
  for (const cap of caps) {
    if (!cap.service_key) continue;
    const proof = pbs[cap.service_key] || { total: 0, passed: 0 };
    if (proof.total === 0) {
      items.push({
        repair_type: "missing_proof",
        affected_capability: cap.label,
        evidence_source: `AutomationProofLog for ${cap.service_key}: 0 records`,
        severity: "critical",
        why_it_matters: "No formal proof record exists for this capability. It cannot be marked trusted without one.",
        recommended_next_action: `Create and pass an AutomationProofLog record for ${cap.service_key}.`,
        safe_to_mark_complete: false,
        latest_record: latest.proof?.[cap.service_key] || null,
      });
    } else if (proof.passed === 0) {
      items.push({
        repair_type: "missing_proof",
        affected_capability: cap.label,
        evidence_source: `AutomationProofLog for ${cap.service_key}: ${proof.total} records, 0 passed`,
        severity: "high",
        why_it_matters: "Proof records exist but none have passed. The capability is not trusted.",
        recommended_next_action: `Review pending/failed proof logs for ${cap.service_key} and resolve blockers.`,
        safe_to_mark_complete: false,
        latest_record: latest.proof?.[cap.service_key] || null,
      });
    }
  }

  // 2. Incomplete automation checklists
  const checklists = data?.qa_checklists || [];
  const allFalseChecklists = checklists.filter(c => c.all_false);
  for (const cl of allFalseChecklists) {
    items.push({
      repair_type: "incomplete_checklist",
      affected_capability: cl.service_key || "Unknown service",
      evidence_source: `AutomationChecklist for ${cl.business_name || "Unknown"} — all flags false`,
      severity: "high",
      why_it_matters: "This checklist has no configuration flags set. It cannot be used for go-live.",
      recommended_next_action: `Configure twilio_configured, resend_configured, booking_link_set, and other flags for ${cl.business_name || "this client"}.`,
      safe_to_mark_complete: false,
      latest_record: cl,
    });
  }
  const notLiveChecklists = checklists.filter(c => !c.all_false && !c.went_live_at);
  for (const cl of notLiveChecklists) {
    items.push({
      repair_type: "incomplete_checklist",
      affected_capability: cl.service_key || "Unknown service",
      evidence_source: `AutomationChecklist for ${cl.business_name || "Unknown"} — in progress, not went_live`,
      severity: "medium",
      why_it_matters: "Checklist is partially configured but has not been marked went_live. Testing or client approval may be pending.",
      recommended_next_action: `Complete testing and client sign-off for ${cl.business_name || "this client"}, then set went_live_at.`,
      safe_to_mark_complete: false,
      latest_record: cl,
    });
  }

  // 3. Provider errors present in logs
  if (es.twilio_400_errors > 0) {
    items.push({
      repair_type: "provider_error",
      affected_capability: "SMS / Twilio",
      evidence_source: `CommunicationEvent: ${es.twilio_400_errors} Twilio 400 errors`,
      severity: "high",
      why_it_matters: "Twilio is returning 400 Bad Request errors. Request payloads, sender permissions, or credentials may be wrong.",
      recommended_next_action: "Inspect error_message fields on failed CommunicationEvent records. Check sender ID, phone number validity, and request body.",
      safe_to_mark_complete: false,
      latest_record: null,
    });
  }
  if (ds.failed > 0) {
    items.push({
      repair_type: "provider_error",
      affected_capability: "SMS / Twilio",
      evidence_source: `CommunicationLog: ${ds.failed} failed SMS deliveries`,
      severity: "high",
      why_it_matters: "SMS messages are failing delivery. Recipients may not be receiving automated responses.",
      recommended_next_action: "Review failed CommunicationLog records for error codes. Verify Twilio phone number and recipient numbers.",
      safe_to_mark_complete: false,
      latest_record: null,
    });
  }
  if (es.failed_events > 0) {
    items.push({
      repair_type: "provider_error",
      affected_capability: "Communication Events",
      evidence_source: `CommunicationEvent: ${es.failed_events} failed events`,
      severity: "medium",
      why_it_matters: "Communication events are failing. Automation pipelines may be dropping messages.",
      recommended_next_action: "Review failed CommunicationEvent records and resolve error messages.",
      safe_to_mark_complete: false,
      latest_record: null,
    });
  }

  // 4. Weak evidence records
  if (ds.weak_proof_count > 0) {
    items.push({
      repair_type: "weak_evidence",
      affected_capability: "SMS / Twilio",
      evidence_source: `CommunicationLog: ${ds.weak_proof_count} records with no provider_message_id but status=sent`,
      severity: "medium",
      why_it_matters: "Messages are marked sent without a provider_message_id. Delivery cannot be independently verified.",
      recommended_next_action: "Ensure Twilio status callbacks populate provider_message_id on all outbound SMS.",
      safe_to_mark_complete: false,
      latest_record: null,
    });
  }
  if (ds.without_provider_message_id > 0) {
    items.push({
      repair_type: "weak_evidence",
      affected_capability: "SMS / Twilio",
      evidence_source: `CommunicationLog: ${ds.without_provider_message_id} records without provider_message_id`,
      severity: "medium",
      why_it_matters: "Without provider_message_id, delivery proof is incomplete.",
      recommended_next_action: "Verify SMS status callback URL is set and Twilio is returning message SIDs.",
      safe_to_mark_complete: false,
      latest_record: null,
    });
  }
  if (es.weak_outbound_proof > 0) {
    items.push({
      repair_type: "weak_evidence",
      affected_capability: "Communication Events",
      evidence_source: `CommunicationEvent: ${es.weak_outbound_proof} outbound events with no provider_message_id but status=sent`,
      severity: "low",
      why_it_matters: "Outbound events lack provider IDs — proof is weak.",
      recommended_next_action: "Backfill provider_message_id on outbound CommunicationEvent records.",
      safe_to_mark_complete: false,
      latest_record: null,
    });
  }

  // 5. Missing voice assistant prerequisites
  const voiceCap = caps.find(c => c.key === "ai_voice_receptionist");
  if (voiceCap && voiceCap.status !== "green") {
    for (const blocker of (vr.blockers || [])) {
      items.push({
        repair_type: "voice_prerequisite",
        affected_capability: "AI Receptionist / Voice Agent",
        evidence_source: `voice_readiness blocker: ${blocker}`,
        severity: blocker.includes("agent IDs") || blocker.includes("transcript") ? "high" : "medium",
        why_it_matters: "Voice assistant cannot function or be proven without this prerequisite.",
        recommended_next_action: `Resolve: ${blocker}. Configure ElevenLabs agent/phone IDs and run a real call test.`,
        safe_to_mark_complete: false,
        latest_record: null,
      });
    }
  }

  // 6. Internal/test data in production view
  if (q.excluded_leads_count > 0) {
    items.push({
      repair_type: "test_data_pollution",
      affected_capability: "Production Data Cleanliness",
      evidence_source: `Quarantine: ${q.excluded_leads_count} test/smoke/internal leads excluded from production metrics`,
      severity: "low",
      why_it_matters: "Test data exists alongside production data. It is excluded from metrics but should be cleaned up.",
      recommended_next_action: "Review quarantined records and permanently remove or archive test/smoke data.",
      safe_to_mark_complete: false,
      latest_record: null,
    });
  }

  // 7. Missing client-facing trust evidence
  if (data?.proof_logs_empty) {
    items.push({
      repair_type: "missing_trust_evidence",
      affected_capability: "All automations",
      evidence_source: "AutomationProofLog is empty — 0 records total",
      severity: "critical",
      why_it_matters: "No automation has formal proof. Nothing can be claimed as customer-facing ready.",
      recommended_next_action: "Create AutomationProofLog records for every service before any go-live claim.",
      safe_to_mark_complete: false,
      latest_record: null,
    });
  }
  const noPassServices = Object.keys(pbs).filter(sk => pbs[sk].passed === 0);
  if (!data?.proof_logs_empty && noPassServices.length > 0) {
    items.push({
      repair_type: "missing_trust_evidence",
      affected_capability: noPassServices.map(s => s).join(", "),
      evidence_source: `proof_by_service: ${noPassServices.length} services with 0 passed proof logs`,
      severity: "high",
      why_it_matters: "These services lack passing proof records and cannot be trusted for client-facing claims.",
      recommended_next_action: "Create and pass AutomationProofLog records for each listed service.",
      safe_to_mark_complete: false,
      latest_record: null,
    });
  }

  // Sort by severity
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => (order[a.severity] || 9) - (order[b.severity] || 9));
  return items;
}

export default function RepairQueue({ data }) {
  if (!data) return null;
  const items = buildRepairItems(data);

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex items-start gap-3">
        <Wrench className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-800 mb-0.5">Repair Queue — Admin Only</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Generated from current app data. No item is safe to mark complete unless proven by real records.
            No external providers are contacted and no public pages are modified.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-green-50 rounded-xl border border-green-200 p-5 flex items-center gap-2">
          <span className="text-green-600 font-semibold text-sm">No repair items detected from current data.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const sev = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.medium;
            const Icon = REPAIR_TYPE_ICONS[item.repair_type] || AlertTriangle;
            return (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: sev.bg, border: `1px solid ${sev.border}` }}>
                      <Icon className="w-4 h-4" style={{ color: sev.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.affected_capability}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{item.repair_type}</p>
                    </div>
                  </div>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0" style={{ color: sev.color, background: sev.bg, border: `1px solid ${sev.border}` }}>
                    {sev.label}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Evidence Source</p>
                    <p className="text-xs text-gray-600 font-mono">{item.evidence_source}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Why It Matters</p>
                    <p className="text-xs text-gray-600">{item.why_it_matters}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Recommended Next Admin Action</p>
                    <p className="text-xs text-gray-700 font-medium">{item.recommended_next_action}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <span className={`text-[11px] font-semibold ${item.safe_to_mark_complete ? "text-green-600" : "text-red-600"}`}>
                    {item.safe_to_mark_complete ? "✓ Safe to mark complete" : "✗ NOT safe to mark complete — proof required"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}