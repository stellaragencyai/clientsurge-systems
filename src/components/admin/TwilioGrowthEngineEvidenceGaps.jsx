import { useState } from "react";
import { Copy, Check, FileSpreadsheet, ShieldAlert } from "lucide-react";

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function buildGapRows(data) {
  if (!data) return [];
  const rows = [];
  const caps = data.capabilities || [];
  const pbs = data.proof_by_service || {};
  const ds = data.delivery_stats || {};
  const es = data.event_stats || {};
  const mc = data.missed_call_stats || {};
  const vr = data.voice_readiness || {};
  const qa = data.qa_checklists || [];

  // 1. Missing proof records per service
  for (const [sk, proof] of Object.entries(pbs)) {
    if (proof.total === 0) {
      const cap = caps.find(c => c.service_key === sk);
      rows.push({
        gap_title: `No proof record for ${sk}`,
        capability: cap?.label || sk,
        severity: (sk === "instant_lead_response" || sk === "missed_call_text_back") ? "critical" : "high",
        evidence_missing: "AutomationProofLog record with status=pass",
        current_evidence_found: "0 proof logs exist for this service",
        next_admin_action: `Create and pass AutomationProofLog for ${sk}`,
        related_entities: "AutomationProofLog",
      });
    } else if (proof.passed === 0) {
      const cap = caps.find(c => c.service_key === sk);
      rows.push({
        gap_title: `No passed proof for ${sk}`,
        capability: cap?.label || sk,
        severity: "high",
        evidence_missing: "AutomationProofLog with status=pass",
        current_evidence_found: `${proof.total} proof log(s) exist but none passed`,
        next_admin_action: `Review and resolve pending/failed proof logs for ${sk}`,
        related_entities: "AutomationProofLog",
      });
    }
  }

  // 2. Incomplete checklists
  for (const cl of qa) {
    if (cl.all_false) {
      rows.push({
        gap_title: `Checklist all-false: ${cl.business_name || "Unknown"}`,
        capability: cl.service_key || "unknown",
        severity: "critical",
        evidence_missing: "All checklist configuration flags (twilio_configured, resend_configured, booking_link_set, etc.)",
        current_evidence_found: "Checklist record exists but no setup completed",
        next_admin_action: "Configure all checklist fields and run test",
        related_entities: "AutomationChecklist",
      });
    }
  }

  // 3. Provider errors
  if (es.twilio_400_errors > 0) {
    rows.push({
      gap_title: "Twilio 400 errors in CommunicationEvent",
      capability: "SMS / Twilio delivery",
      severity: "high",
      evidence_missing: "Clean CommunicationEvent records without 400 errors",
      current_evidence_found: `${es.twilio_400_errors} event(s) with 400 error`,
      next_admin_action: "Inspect error_message on failed events",
      related_entities: "CommunicationEvent",
    });
  }
  if (mc.has_404) {
    rows.push({
      gap_title: "Missed-call webhook returning 404",
      capability: "Missed Call Text-Back",
      severity: "critical",
      evidence_missing: "Webhook returning 200",
      current_evidence_found: `last_webhook_test_result contains 404`,
      next_admin_action: "Repair missed-call webhook URL in Twilio console",
      related_entities: "AdminSettings",
    });
  }
  if (mc.has_405) {
    rows.push({
      gap_title: "Missed-call webhook returning 405",
      capability: "Missed Call Text-Back",
      severity: "critical",
      evidence_missing: "Webhook returning 200",
      current_evidence_found: `last_webhook_test_result contains 405`,
      next_admin_action: "Fix webhook HTTP method configuration",
      related_entities: "AdminSettings",
    });
  }

  // 4. Weak evidence
  if (ds.weak_proof_count > 0) {
    rows.push({
      gap_title: "Weak proof SMS logs (null provider_message_id + status=sent)",
      capability: "SMS delivery",
      severity: "medium",
      evidence_missing: "provider_message_id populated on all outbound SMS logs",
      current_evidence_found: `${ds.weak_proof_count} log(s) with null provider_message_id and sent/queued status`,
      next_admin_action: "Inspect why provider_message_id is null",
      related_entities: "CommunicationLog",
    });
  }
  if (es.weak_outbound_proof > 0) {
    rows.push({
      gap_title: "Weak outbound CommunicationEvent (no provider_message_id)",
      capability: "SMS / CommunicationEvent",
      severity: "medium",
      evidence_missing: "provider_message_id on outbound events",
      current_evidence_found: `${es.weak_outbound_proof} outbound event(s) without provider_message_id`,
      next_admin_action: "Verify outbound SMS functions capture Twilio message SID",
      related_entities: "CommunicationEvent",
    });
  }

  // 5. Voice prerequisites
  if (vr.blockers && vr.blockers.length > 0) {
    for (const blocker of vr.blockers) {
      let sev = "high";
      if (blocker.includes("inbound_voice_enabled")) sev = "medium";
      rows.push({
        gap_title: `Voice prerequisite: ${blocker}`,
        capability: "AI Voice Receptionist",
        severity: sev,
        evidence_missing: blocker,
        current_evidence_found: "Voice readiness check failed",
        next_admin_action: blocker.includes("agent IDs") ? "Configure ElevenLabs agent IDs" : blocker.includes("transcript") ? "Run real inbound call for transcript proof" : "Enable inbound_voice_enabled",
        related_entities: "AdminSettings, WebsiteLead",
      });
    }
  }

  // 6. Test data in production
  const q = data.quarantine || {};
  if (q.excluded_leads_count > 0) {
    rows.push({
      gap_title: "Internal/test records in production database",
      capability: "Production data cleanliness",
      severity: "low",
      evidence_missing: "Clean production database with no test/internal records",
      current_evidence_found: `${q.excluded_leads_count} test/internal record(s) excluded from metrics but present in DB`,
      next_admin_action: "Review excluded records and confirm quarantine",
      related_entities: "Leads, WebsiteLead",
    });
  }

  // 7. Missing client-facing trust
  if (data.proof_logs_empty) {
    rows.push({
      gap_title: "AutomationProofLog is empty",
      capability: "All automations",
      severity: "critical",
      evidence_missing: "Any AutomationProofLog record with status=pass",
      current_evidence_found: "0 proof log records in the database",
      next_admin_action: "Create AutomationProofLog records for each automation service",
      related_entities: "AutomationProofLog",
    });
  }

  // Sort by severity
  rows.sort((a, b) => (SEVERITY_ORDER[a.severity] || 3) - (SEVERITY_ORDER[b.severity] || 3));

  return rows;
}

const SEVERITY_STYLES = {
  critical: { color: "#DC2626", bg: "rgba(220,38,38,0.05)" },
  high: { color: "#EA580C", bg: "rgba(234,88,12,0.05)" },
  medium: { color: "#D97706", bg: "rgba(217,119,6,0.05)" },
  low: { color: "#6B7280", bg: "rgba(107,114,128,0.05)" },
};

export default function TwilioGrowthEngineEvidenceGaps({ data }) {
  const [copied, setCopied] = useState(false);
  const rows = buildGapRows(data);

  const copyAsTSV = () => {
    const header = "Gap Title\tCapability\tSeverity\tEvidence Missing\tCurrent Evidence Found\tNext Admin Action\tRelated Entities";
    const body = rows.map(r =>
      `${r.gap_title}\t${r.capability}\t${r.severity}\t${r.evidence_missing}\t${r.current_evidence_found}\t${r.next_admin_action}\t${r.related_entities}`
    ).join("\n");
    const tsv = `${header}\n${body}`;
    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-gray-700" />
            <h3 className="text-sm font-bold text-gray-900">Evidence Gaps Export</h3>
          </div>
          <button
            onClick={copyAsTSV}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy as TSV"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Copy this table into Asana or a spreadsheet. Admin only — computed from live app data.</p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-green-50 rounded-xl border border-green-200 p-6 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-700 font-semibold">No evidence gaps detected from current data.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Gap Title</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Capability</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Severity</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Evidence Missing</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Current Evidence Found</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Next Admin Action</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Related Entities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, idx) => {
                  const sev = SEVERITY_STYLES[row.severity] || SEVERITY_STYLES.low;
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 text-gray-900 font-medium align-top">{row.gap_title}</td>
                      <td className="px-3 py-2.5 text-gray-600 align-top">{row.capability}</td>
                      <td className="px-3 py-2.5 align-top">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: sev.color, background: sev.bg }}>
                          {row.severity}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 align-top">{row.evidence_missing}</td>
                      <td className="px-3 py-2.5 text-gray-500 font-mono align-top">{row.current_evidence_found}</td>
                      <td className="px-3 py-2.5 text-gray-600 align-top">{row.next_admin_action}</td>
                      <td className="px-3 py-2.5 text-gray-500 font-mono align-top whitespace-nowrap">{row.related_entities}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}