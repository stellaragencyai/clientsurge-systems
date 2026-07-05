import { StatusPill, isQaEvidence, safeJsonParse } from "./helpers";
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight } from "lucide-react";

export default function Sprint1ApprovalSummary({ gates, readinessState }) {
  const instantGate = gates?.find((g) => g.gate_key === "instant_lead_response");
  const missedGate = gates?.find((g) => g.gate_key === "missed_call_text_back");

  const getAudit = (gate) => {
    const evidence = safeJsonParse(gate?.evidence_summary, {});
    return evidence?.sprint1_approval;
  };

  const instantAudit = getAudit(instantGate);
  const missedAudit = getAudit(missedGate);

  // ── Internal launch approval state ──
  const instantInternalApproved = instantGate?.status === "approved" && isQaEvidence(instantGate?.evidence_quality);
  const missedInternalApproved = missedGate?.status === "approved" && isQaEvidence(missedGate?.evidence_quality);
  const bothInternalApproved = instantInternalApproved && missedInternalApproved;

  // ── Production proof state ──
  const instantProdProofed = instantGate?.evidence_quality === "production_customer" && instantGate?.status === "approved";
  const missedProdProofed = missedGate?.evidence_quality === "production_customer" && missedGate?.status === "approved";
  const bothProdProofed = instantProdProofed && missedProdProofed;

  // ── Public launch readiness ──
  const platformGo = readinessState?.go_no_go_decision === "go";

  // ── Remaining blockers ──
  const blockers = [];
  if (!instantInternalApproved) blockers.push("instant_lead_response: awaiting admin approval decision");
  if (!missedInternalApproved) blockers.push("missed_call_text_back: awaiting admin approval decision");
  if (!bothProdProofed) blockers.push("Both automations need production_customer evidence quality for public/client launch");
  if (!platformGo) blockers.push("Full platform readiness is not 'go'");

  // ── Sprint 1 internal launch status ──
  let internalLabel, internalColor;
  if (bothInternalApproved) {
    internalLabel = "Internal Launch Approved";
    internalColor = "green";
  } else if (instantInternalApproved || missedInternalApproved) {
    internalLabel = "Partially Approved — One Remaining";
    internalColor = "yellow";
  } else {
    internalLabel = "Pending Admin Decision";
    internalColor = "yellow";
  }

  // ── Sprint 1 public/client launch status ──
  let publicLabel, publicColor;
  if (bothProdProofed && platformGo) {
    publicLabel = "Public/Client Launch Ready";
    publicColor = "green";
  } else if (bothProdProofed && !platformGo) {
    publicLabel = "Production Proof Complete — Platform Not Ready";
    publicColor = "yellow";
  } else {
    publicLabel = "Not Ready — Production Proof Required";
    publicColor = "red";
  }

  // ── Closeout logic ──
  const sprint1Closeout = bothInternalApproved;
  const nextSprint = "inbound_sms_assistant + nurture_sequence_14d";

  const rows = [
    { label: "Instant Lead Response", sub: "Internal Approved", value: instantInternalApproved, gate: instantGate, audit: instantAudit },
    { label: "Missed Call Text-Back", sub: "Internal Approved", value: missedInternalApproved, gate: missedGate, audit: missedAudit },
    { label: "Instant Lead Response", sub: "Production Proofed", value: instantProdProofed, gate: instantGate },
    { label: "Missed Call Text-Back", sub: "Production Proofed", value: missedProdProofed, gate: missedGate },
  ];

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "#fff", borderColor: "#E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
          <h3 className="text-sm font-bold text-gray-900">Sprint 1 Approval Summary</h3>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4">
        {/* Status rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="rounded-lg border border-gray-100 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Internal Launch Status</p>
            <StatusPill color={internalColor} label={internalLabel} />
          </div>
          <div className="rounded-lg border border-gray-100 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Public/Client Launch Status</p>
            <StatusPill color={publicColor} label={publicLabel} />
          </div>
        </div>

        {/* Both-approved quick checks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: bothInternalApproved ? "rgba(34,197,94,0.06)" : "rgba(245,158,11,0.06)" }}>
            {bothInternalApproved ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
            <div>
              <p className="text-[11px] font-bold text-gray-900">Both Approved for Internal Launch</p>
              <p className="text-[10px] text-gray-500">{bothInternalApproved ? "Yes" : "No"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: bothProdProofed ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)" }}>
            {bothProdProofed ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
            <div>
              <p className="text-[11px] font-bold text-gray-900">Both Production-Proofed</p>
              <p className="text-[10px] text-gray-500">{bothProdProofed ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        {/* Remaining blockers */}
        {blockers.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 mb-2">Remaining Approval Blockers</p>
            <ul className="space-y-1">
              {blockers.map((b, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-amber-700">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Closeout banner */}
        {sprint1Closeout && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-blue-900">Sprint 1 Core Twilio: Internal Launch Approved</p>
                <div className="mt-2 space-y-0.5 text-[11px] text-blue-700">
                  <p>• Production Proof: {bothProdProofed ? "Complete" : "Not Complete — production_customer evidence required"}</p>
                  <p>• Full Platform: {platformGo ? "Launch Ready" : "Not Fully Launch Ready"}</p>
                  <p>• Next Major Sprint: {nextSprint}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Public launch warning badge — always visible when not ready */}
        {!bothProdProofed && (
          <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.20)" }}>
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-red-700">Public Launch Not Ready</p>
              <p className="text-[10px] text-red-600">Production-quality proof required for both automations before public/client launch</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}