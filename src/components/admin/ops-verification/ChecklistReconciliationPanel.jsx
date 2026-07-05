import { AlertTriangle, CheckCircle2 } from "lucide-react";
import QuickApproveButton from "./QuickApproveButton";

const RECONCILE_KEYS = ["instant_lead_response", "missed_call_text_back", "inbound_sms_assistant", "nurture_sequence_14d", "ai_booking_agent"];

function ReconcileRow({ serviceKey, gate, proofLog, checklist, onApproved }) {
  const warnings = [];

  // Gate says proof_passed but checklist is pending/not_started
  if (gate?.status === "proof_passed" && checklist && checklist.status !== "active") {
    warnings.push(`Gate is proof_passed but checklist status is "${checklist.status}" — should be active`);
  }

  // Proof exists but client_approved is false
  if (proofLog?.status === "pass" && checklist && !checklist.client_approved) {
    warnings.push("Proof passed but client_approved is false");
  }

  // went_live_at is null
  if (checklist && !checklist.went_live_at && gate?.status === "proof_passed") {
    warnings.push("went_live_at is null — not yet live");
  }

  // communication_event_logging_verified is false
  if (checklist && !checklist.communication_event_logging_verified) {
    warnings.push("communication_event_logging_verified is false");
  }

  const hasIssue = warnings.length > 0;
  const alreadyApproved = checklist?.status === "active" && checklist?.client_approved;

  return (
    <tr className={`border-b border-gray-50 last:border-0 ${hasIssue ? "bg-amber-50/30" : ""}`}>
      <td className="px-3 py-2.5 font-semibold text-gray-800 text-xs">{serviceKey}</td>
      <td className="px-3 py-2.5 text-gray-600 text-xs">{gate?.status || "no gate"}</td>
      <td className="px-3 py-2.5 text-gray-600 text-xs">{proofLog?.status || "no proof"}</td>
      <td className="px-3 py-2.5 text-gray-600 text-xs">{checklist?.status || "no checklist"}</td>
      <td className="px-3 py-2.5">
        {hasIssue ? (
          <div className="space-y-1">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1 text-amber-700 text-[10px] font-medium">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {w}
              </div>
            ))}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-green-600 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> Aligned
          </span>
        )}
      </td>
      <td className="px-3 py-2.5">
        {checklist && !alreadyApproved ? (
          <QuickApproveButton
            checklistId={checklist.id}
            onApproved={onApproved}
            compact
          />
        ) : alreadyApproved ? (
          <span className="inline-flex items-center gap-1 text-green-600 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        ) : (
          <span className="text-[10px] text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}

export default function ChecklistReconciliationPanel({ gates, proofLogs, checklists, onApproved }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
        <h3 className="text-sm font-bold text-gray-900">Checklist Reconciliation</h3>
        <span className="text-[11px] text-gray-400">(Quick Approve moves blocked items to ready)</span>
      </div>
      <div className="rounded-xl border overflow-x-auto" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Service</th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Gate Status</th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Proof Status</th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Checklist Status</th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Warnings</th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Quick Approve</th>
            </tr>
          </thead>
          <tbody>
            {RECONCILE_KEYS.map((key) => {
              const gate = (gates || []).find((g) => g.gate_key === key);
              const proofLog = (proofLogs || []).find((p) => p.service_key === key && p.status === "pass");
              const checklist = (checklists || []).find((c) => c.service_key === key);
              return <ReconcileRow key={key} serviceKey={key} gate={gate} proofLog={proofLog} checklist={checklist} onApproved={onApproved} />;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}