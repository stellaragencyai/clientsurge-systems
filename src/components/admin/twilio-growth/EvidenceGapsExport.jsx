import { useState } from "react";
import { Copy, Check, Table } from "lucide-react";

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

const CAPABILITY_ENTITIES = {
  ai_voice_receptionist: "AdminSettings, CommunicationEvent, AutomationProofLog, WebsiteLead",
  missed_call_text_back: "AdminSettings, CommunicationLog, CommunicationEvent, AutomationProofLog",
  instant_lead_response: "CommunicationLog, CommunicationEvent, AutomationProofLog, WebsiteLead",
  nurture_sequence_14d: "CommunicationLog, AutomationProofLog, AdminSettings",
  review_request: "AutomationChecklist, AutomationProofLog, CommunicationEvent",
  lead_reactivation: "AutomationProofLog, Leads",
  inbound_sms_assistant: "CommunicationEvent, AutomationProofLog",
  ai_booking_agent: "WebsiteLead, AutomationProofLog",
  automation_proof_logs: "AutomationProofLog",
  voice_broadcasts: "AdminSettings, AutomationProofLog",
};

function buildGapRows(data) {
  if (!data) return [];
  const rows = [];
  const caps = data.capabilities || [];
  const pbs = data.proof_by_service || {};
  const ds = data.delivery_stats || {};
  const es = data.event_stats || {};
  const mc = data.missed_call_stats || {};
  const vr = data.voice_readiness || {};

  for (const cap of caps) {
    if (cap.status === "green") continue;
    const entities = CAPABILITY_ENTITIES[cap.key] || "AutomationProofLog";
    const proof = cap.service_key ? pbs[cap.service_key] : null;

    if (!proof || proof.total === 0) {
      rows.push({
        gapTitle: "No proof record exists",
        capability: cap.label,
        severity: "Critical",
        evidenceMissing: `AutomationProofLog for ${cap.service_key || cap.key} — 0 records`,
        evidenceFound: cap.evidence_sources?.join("; ") || "None",
        nextAction: cap.next_action || `Create and pass AutomationProofLog for ${cap.service_key || cap.key}.`,
        relatedEntities: entities,
      });
    } else if (proof.passed === 0) {
      rows.push({
        gapTitle: "Proof records exist but none passed",
        capability: cap.label,
        severity: "High",
        evidenceMissing: `Passing AutomationProofLog for ${cap.service_key || cap.key} — ${proof.total} records, 0 passed`,
        evidenceFound: `${proof.total} proof records exist (pending/failed)`,
        nextAction: `Review and resolve pending/failed proof logs for ${cap.service_key || cap.key}.`,
        relatedEntities: entities,
      });
    }

    if (cap.key === "missed_call_text_back" && (mc.has_404 || mc.has_405)) {
      rows.push({
        gapTitle: `Webhook returning ${mc.has_404 ? "404" : "405"}`,
        capability: cap.label,
        severity: "Critical",
        evidenceMissing: "Healthy webhook response (200 OK)",
        evidenceFound: `Current status: ${mc.webhook_status}`,
        nextAction: "Repair missed-call webhook URL in Twilio console.",
        relatedEntities: "AdminSettings, WebhookRegistration",
      });
    }

    if (cap.key === "instant_lead_response" && ds.delivered === 0) {
      rows.push({
        gapTitle: "No delivered SMS proof",
        capability: cap.label,
        severity: "High",
        evidenceMissing: "CommunicationLog with delivery_status=delivered",
        evidenceFound: `${ds.total} total SMS logs, 0 delivered`,
        nextAction: "Trigger a real lead and confirm delivered Twilio status callback.",
        relatedEntities: entities,
      });
    }

    if (cap.key === "ai_voice_receptionist" && !vr.has_transcript_proof) {
      rows.push({
        gapTitle: "No transcript or summary evidence",
        capability: cap.label,
        severity: "High",
        evidenceMissing: "WebsiteLead with non-empty transcript from a real call",
        evidenceFound: vr.has_elevenlabs_agent_ids ? "ElevenLabs agent IDs configured" : "No agent IDs configured",
        nextAction: "Run a real inbound call test to generate transcript proof.",
        relatedEntities: entities,
      });
    }

    if (cap.key === "review_request" && (!proof || proof.passed === 0)) {
      rows.push({
        gapTitle: "Review request workflow has no evidence",
        capability: cap.label,
        severity: "Medium",
        evidenceMissing: "AutomationProofLog for review_request",
        evidenceFound: "No proof records found",
        nextAction: "Create and pass AutomationProofLog for review_request.",
        relatedEntities: entities,
      });
    }

    if (cap.key === "lead_reactivation" && (!proof || proof.passed === 0)) {
      rows.push({
        gapTitle: "Referral engine has no evidence",
        capability: cap.label,
        severity: "Medium",
        evidenceMissing: "AutomationProofLog for lead_reactivation + real reactivation workflow",
        evidenceFound: "No proof records found",
        nextAction: "Build a real referral/reactivation flow and create proof records.",
        relatedEntities: entities,
      });
    }
  }

  // Data quality gaps
  if (ds.weak_proof_count > 0) {
    rows.push({
      gapTitle: "Weak evidence records (no provider_message_id)",
      capability: "SMS Delivery",
      severity: "Medium",
      evidenceMissing: "provider_message_id on all outbound SMS logs",
      evidenceFound: `${ds.weak_proof_count} logs with status=sent but no provider_message_id`,
      nextAction: "Verify SMS status callback URL is set and Twilio returns message SIDs.",
      relatedEntities: "CommunicationLog, AdminSettings",
    });
  }

  if (es.twilio_400_errors > 0) {
    rows.push({
      gapTitle: "Twilio 400 errors in event logs",
      capability: "SMS / CommunicationEvent",
      severity: "High",
      evidenceMissing: "Zero Twilio 400 errors",
      evidenceFound: `${es.twilio_400_errors} events with 400 errors`,
      nextAction: "Inspect error_message fields and fix request payloads.",
      relatedEntities: "CommunicationEvent",
    });
  }

  const sevOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  rows.sort((a, b) => (sevOrder[a.severity] || 9) - (sevOrder[b.severity] || 9));
  return rows;
}

function toTSV(rows) {
  const headers = ["Gap Title", "Capability", "Severity", "Evidence Missing", "Current Evidence Found", "Next Admin Action", "Related Entities"];
  const lines = [headers.join("\t")];
  for (const r of rows) {
    lines.push([r.gapTitle, r.capability, r.severity, r.evidenceMissing, r.evidenceFound, r.nextAction, r.relatedEntities].map(v => `"${String(v).replace(/"/g, '""')}"`).join("\t"));
  }
  return lines.join("\n");
}

export default function EvidenceGapsExport({ data }) {
  const [copied, setCopied] = useState(false);
  const rows = buildGapRows(data);

  const copyAll = () => {
    navigator.clipboard.writeText(toTSV(rows)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const sevColor = (sev) => {
    if (sev === "Critical") return "#DC2626";
    if (sev === "High") return "#EA580C";
    if (sev === "Medium") return "#D97706";
    return "#6B7280";
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm font-bold text-gray-900">Evidence Gaps Export</p>
            <p className="text-[11px] text-gray-400">{rows.length} gap{rows.length === 1 ? "" : "s"} found — copy into Asana</p>
          </div>
        </div>
        <button
          onClick={copyAll}
          disabled={rows.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy as TSV"}
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <p className="text-xs text-green-700 font-semibold">No evidence gaps detected — all capabilities are proven.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left font-semibold text-gray-500 px-3 py-2 whitespace-nowrap">Gap Title</th>
                  <th className="text-left font-semibold text-gray-500 px-3 py-2 whitespace-nowrap">Capability</th>
                  <th className="text-left font-semibold text-gray-500 px-3 py-2 whitespace-nowrap">Severity</th>
                  <th className="text-left font-semibold text-gray-500 px-3 py-2 whitespace-nowrap">Evidence Missing</th>
                  <th className="text-left font-semibold text-gray-500 px-3 py-2 whitespace-nowrap">Current Evidence</th>
                  <th className="text-left font-semibold text-gray-500 px-3 py-2 whitespace-nowrap">Next Admin Action</th>
                  <th className="text-left font-semibold text-gray-500 px-3 py-2 whitespace-nowrap">Related Entities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-gray-900 font-medium align-top">{r.gapTitle}</td>
                    <td className="px-3 py-2 text-gray-600 align-top whitespace-nowrap">{r.capability}</td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">
                      <span className="font-semibold" style={{ color: sevColor(r.severity) }}>{r.severity}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-600 align-top">{r.evidenceMissing}</td>
                    <td className="px-3 py-2 text-gray-500 align-top">{r.evidenceFound}</td>
                    <td className="px-3 py-2 text-gray-700 align-top">{r.nextAction}</td>
                    <td className="px-3 py-2 text-gray-400 font-mono align-top text-[10px] whitespace-nowrap">{r.relatedEntities}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}