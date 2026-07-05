/**
 * Sprint2Panel — Sprint 2 (Inbound SMS Assistant + 14-Day Nurture) verification panel.
 *
 * Shows three gates:
 *   1. inbound_sms_assistant
 *   2. nurture_sequence_14d
 *   3. sprint2_inbound_and_nurture_gate (combined)
 *
 * For each gate shows: status, evidence_quality, completion%, proof%, blocker, next_action.
 * Also shows proof logs and checklist reconciliation for Sprint 2 services.
 */
import { StatusPill, statusColorFromGate, EvidenceRow, safeJsonParse, fmtDate, isQaEvidence } from "./helpers";

const SPRINT2_KEYS = ["inbound_sms_assistant", "nurture_sequence_14d", "sprint2_inbound_and_nurture_gate"];

const GATE_LABELS = {
  inbound_sms_assistant: "Inbound SMS Assistant",
  nurture_sequence_14d: "14-Day Nurture Sequence",
  sprint2_inbound_and_nurture_gate: "Sprint 2 Combined Gate",
};

const GATE_DESCRIPTIONS = {
  inbound_sms_assistant: "Receive, match to lead, classify intent, handle STOP/opt-out, pause nurture, escalate hot/unclear replies",
  nurture_sequence_14d: "Controlled 14-day nurture for eligible leads with consent. Pauses on reply, stops on STOP",
  sprint2_inbound_and_nurture_gate: "Both inbound_sms_assistant and nurture_sequence_14d must pass proof before this gate advances",
};

function GateCard({ gate, proofLogs, checklists }) {
  const color = statusColorFromGate(gate);
  const evidence = safeJsonParse(gate?.evidence_summary, {});
  const qaPending = gate?.status === "proof_passed" && isQaEvidence(gate?.evidence_quality);
  const gateKey = gate?.gate_key;

  // Find related proof logs
  const relatedProofs = (proofLogs || []).filter(p => {
    if (gateKey === "inbound_sms_assistant") return p.service_key === "inbound_sms_assistant";
    if (gateKey === "nurture_sequence_14d") return p.service_key === "nurture_sequence_14d";
    return p.service_key === "inbound_sms_assistant" || p.service_key === "nurture_sequence_14d";
  });

  // Find related checklists
  const relatedChecklists = (checklists || []).filter(cl => {
    if (gateKey === "inbound_sms_assistant") return cl.service_key === "inbound_sms_assistant";
    if (gateKey === "nurture_sequence_14d") return cl.service_key === "nurture_sequence_14d";
    return cl.service_key === "inbound_sms_assistant" || cl.service_key === "nurture_sequence_14d";
  });

  // Checklist reconciliation
  const checklistMisaligned = relatedChecklists.filter(cl => {
    if (gate?.status === "proof_passed" && cl.status !== "active" && cl.status !== "in_progress") return true;
    return false;
  });

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: "#E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-sm font-bold text-gray-900">{GATE_LABELS[gate?.gate_key] || gate?.gate_key || "Unknown"}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{GATE_DESCRIPTIONS[gate?.gate_key] || ""}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <StatusPill color={color} label={gate?.status || "unknown"} />
          {qaPending && <StatusPill color="yellow" label="QA Proof — Prod Approval Pending" />}
        </div>
      </div>
      <div className="px-4 py-3">
        {/* Progress bars */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Completion</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${gate?.completion_percent || 0}%`, background: "linear-gradient(90deg, #0079c1, #00AEEF)" }} />
              </div>
              <span className="text-xs font-bold text-gray-700">{gate?.completion_percent || 0}%</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Proof</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${gate?.proof_percent || 0}%`, background: "linear-gradient(90deg, #0079c1, #00AEEF)" }} />
              </div>
              <span className="text-xs font-bold text-gray-700">{gate?.proof_percent || 0}%</span>
            </div>
          </div>
        </div>

        <EvidenceRow label="Evidence Quality" value={gate?.evidence_quality || "unknown"} warning={isQaEvidence(gate?.evidence_quality)} />
        <EvidenceRow label="Blocker" value={gate?.current_blocker} warning={!!gate?.current_blocker} />
        <EvidenceRow label="Next Action" value={gate?.next_action} />
        <EvidenceRow label="Last Checked" value={fmtDate(gate?.last_checked_at)} />
        <EvidenceRow label="Verdict" value={gate?.last_verdict} warning={qaPending} />

        {/* Checklist reconciliation */}
        {relatedChecklists.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-50">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">
              Checklist Reconciliation ({relatedChecklists.length})
            </p>
            {checklistMisaligned.length > 0 ? (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                ⚠ {checklistMisaligned.length} checklist(s) misaligned — gate is proof_passed but checklist is not active
              </div>
            ) : (
              <div className="text-xs text-green-700">✓ Aligned</div>
            )}
          </div>
        )}

        {/* Related proof logs */}
        {relatedProofs.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-50">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">
              Proof Logs ({relatedProofs.length})
            </p>
            <div className="space-y-1">
              {relatedProofs.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center gap-2 text-[11px]">
                  <StatusPill
                    color={p.status === "pass" ? "green" : p.status === "fail" ? "red" : "gray"}
                    label={p.test_type || "unknown"}
                  />
                  <span className="text-gray-500">{fmtDate(p.tested_at)}</span>
                  <span className="text-gray-400 truncate">{p.evidence_summary?.slice(0, 80)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence summary JSON */}
        {evidence && typeof evidence === "object" && Object.keys(evidence).length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-50">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Evidence Summary</p>
            <pre className="text-[10px] text-gray-600 bg-gray-50 rounded-lg p-2 overflow-x-auto max-h-32">{JSON.stringify(evidence, null, 1)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sprint2Panel({ gates, proofLogs, checklists }) {
  const sprint2Gates = (gates || []).filter((g) => SPRINT2_KEYS.includes(g.gate_key));
  const ordered = SPRINT2_KEYS.map((k) => sprint2Gates.find((g) => g.gate_key === k)).filter(Boolean);

  // Determine overall Sprint 2 status
  const inboundGate = sprint2Gates.find(g => g.gate_key === "inbound_sms_assistant");
  const nurtureGate = sprint2Gates.find(g => g.gate_key === "nurture_sequence_14d");
  const combinedGate = sprint2Gates.find(g => g.gate_key === "sprint2_inbound_and_nurture_gate");

  let sprint2Label = "Not Started";
  let sprint2Color = "gray";
  if (combinedGate?.status === "proof_passed") {
    sprint2Label = isQaEvidence(combinedGate.evidence_quality) ? "QA Proof Passed — Approval Pending" : "Production Proof Passed";
    sprint2Color = isQaEvidence(combinedGate.evidence_quality) ? "yellow" : "green";
  } else if (combinedGate?.status === "approved") {
    sprint2Label = "Internal Launch Approved";
    sprint2Color = "blue";
  } else if (inboundGate?.status === "ready_for_proof" || nurtureGate?.status === "ready_for_proof") {
    sprint2Label = "Ready for QA Proof";
    sprint2Color = "yellow";
  } else if (inboundGate?.status === "partial" || nurtureGate?.status === "partial") {
    sprint2Label = "Configured — Partial";
    sprint2Color = "yellow";
  } else if (inboundGate?.status === "blocked" && nurtureGate?.status === "blocked") {
    sprint2Label = "Not Started / Blocked";
    sprint2Color = "red";
  }

  // Next best action
  let nextBestAction = "No action needed";
  if (!inboundGate || inboundGate.status === "blocked") nextBestAction = "Seed Sprint 2 gates and run proof check";
  else if (inboundGate.status === "blocked" || inboundGate.status === "partial") nextBestAction = "Address inbound SMS assistant blockers";
  else if (inboundGate.status === "ready_for_proof") nextBestAction = "Create proof logs for inbound_reply_classification_test and stop_reply_test";
  else if (!nurtureGate || nurtureGate.status === "blocked") nextBestAction = "Enroll a test lead in 14-day nurture sequence";
  else if (nurtureGate.status === "ready_for_proof") nextBestAction = "Create proof log for enrollment_test";
  else if (combinedGate?.status === "proof_passed") nextBestAction = "Admin decision: approve for internal launch or require production proof";

  return (
    <div>
      {/* Sprint 2 header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
        <h3 className="text-sm font-bold text-gray-900">Sprint 2 — Inbound SMS Assistant + 14-Day Nurture</h3>
        <StatusPill color={sprint2Color} label={sprint2Label} />
      </div>

      {/* Next best action bar */}
      <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-blue-600 flex-shrink-0">Next Best Action:</span>
        <span className="text-xs text-blue-900 font-medium">{nextBestAction}</span>
      </div>

      {/* Gate cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {ordered.map((g) => (
          <GateCard key={g.gate_key} gate={g} proofLogs={proofLogs} checklists={checklists} />
        ))}
        {ordered.length === 0 && (
          <div className="col-span-2 rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-xs text-gray-400">No Sprint 2 gates found.</p>
            <p className="text-[11px] text-gray-400 mt-1">Run seedSprint2Gates to create them.</p>
          </div>
        )}
      </div>
    </div>
  );
}