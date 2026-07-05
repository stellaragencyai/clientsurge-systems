import { StatusPill, statusColorFromGate, EvidenceRow, safeJsonParse, fmtDate, isQaEvidence } from "./helpers";


const SPRINT1_KEYS = ["instant_lead_response", "missed_call_text_back", "twilio_webhook_route_health", "automation_delivery_gate"];

const GATE_LABELS = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  twilio_webhook_route_health: "Twilio Webhook Route Health",
  automation_delivery_gate: "Automation Delivery Gate",
};

function GateCard({ gate }) {
  const color = statusColorFromGate(gate);
  const evidence = safeJsonParse(gate?.evidence_summary, {});
  const qaPending = gate?.status === "proof_passed" && isQaEvidence(gate?.evidence_quality);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: "#E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-bold text-gray-900">{GATE_LABELS[gate?.gate_key] || gate?.gate_key || "Unknown"}</p>
        <div className="flex gap-2 flex-wrap">
          <StatusPill color={color} label={gate?.status || "unknown"} />
          {qaPending && <StatusPill color="yellow" label="QA Proof — Prod Approval Pending" />}
        </div>
      </div>
      <div className="px-4 py-3">
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

export default function Sprint1Panel({ gates }) {
  const sprint1Gates = (gates || []).filter((g) => SPRINT1_KEYS.includes(g.gate_key));
  const ordered = SPRINT1_KEYS.map((k) => sprint1Gates.find((g) => g.gate_key === k)).filter(Boolean);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
        <h3 className="text-sm font-bold text-gray-900">Sprint 1 — Core Twilio Readiness</h3>
        <span className="text-[11px] text-gray-400">(conditional go scope only — not full platform)</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {ordered.map((g) => <GateCard key={g.gate_key} gate={g} />)}
        {ordered.length === 0 && <p className="text-xs text-gray-400">No Sprint 1 gates found.</p>}
      </div>
    </div>
  );
}