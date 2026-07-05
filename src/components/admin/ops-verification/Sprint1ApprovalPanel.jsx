import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  StatusPill,
  EvidenceRow,
  safeJsonParse,
  fmtDate,
  isQaEvidence,
  statusColorFromGate,
} from "./helpers";
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Loader2, Lock } from "lucide-react";

const SPRINT1_APPROVAL_KEYS = ["instant_lead_response", "missed_call_text_back"];

const GATE_LABELS = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
};

function ApprovalCard({ gate, proofLog, checklist, onDecisionMade }) {
  const [decision, setDecision] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const evidence = safeJsonParse(gate?.evidence_summary, {});
  const auditTrail = evidence?.sprint1_approval;
  const qaPending = gate?.status === "proof_passed" && isQaEvidence(gate?.evidence_quality);
  const isApproved = gate?.status === "approved";
  const isRejected = auditTrail?.approval_type === "rejected_rerun_required";
  const prodProofRequired = auditTrail?.approval_type === "production_proof_required";

  const handleDecision = async (decisionType) => {
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const resp = await base44.functions.invoke("sprint1Approval", {
        gate_key: gate.gate_key,
        decision: decisionType,
        note: note || undefined,
      });
      setResult(resp.data);
      setDecision(decisionType);
      if (onDecisionMade) onDecisionMade();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Approval failed");
    } finally {
      setSubmitting(false);
    }
  };

  const decisions = [
    {
      key: "internal_qa_approval",
      label: "Approve QA Proof for Internal Launch",
      icon: CheckCircle2,
      color: "#0369a1",
      bg: "rgba(0,174,239,0.08)",
      border: "rgba(0,174,239,0.25)",
      desc: "Approves for internal launch only. Evidence quality stays internal_test. Does NOT imply public/client launch.",
    },
    {
      key: "production_proof_required",
      label: "Require Clean Production Proof",
      icon: AlertTriangle,
      color: "#b45309",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.25)",
      desc: "Keeps status as proof_passed / approval pending. Next action: rerun with production-quality evidence.",
    },
    {
      key: "rejected_rerun_required",
      label: "Reject Proof / Rerun",
      icon: XCircle,
      color: "#b91c1c",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.25)",
      desc: "Does NOT delete existing proof. Marks decision as rejected/rerun required. Updates blocker and next action.",
    },
  ];

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "#fff", borderColor: "#E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-bold text-gray-900">{GATE_LABELS[gate?.gate_key] || gate?.gate_key}</p>
        <div className="flex gap-2 flex-wrap">
          <StatusPill color={statusColorFromGate(gate)} label={gate?.status || "unknown"} />
          {qaPending && <StatusPill color="yellow" label="QA Proof — Approval Pending" />}
          {isApproved && isQaEvidence(gate?.evidence_quality) && (
            <StatusPill color="blue" label="Internal Launch Approved" />
          )}
          {isRejected && <StatusPill color="red" label="Rejected / Rerun Required" />}
          {prodProofRequired && <StatusPill color="yellow" label="Production Proof Required" />}
        </div>
      </div>

      {/* Gate details */}
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
        <EvidenceRow label="Last Verdict" value={gate?.last_verdict} warning={qaPending} />
        <EvidenceRow label="Last Checked" value={fmtDate(gate?.last_checked_at)} />

        {/* Proof log details */}
        {proofLog && (
          <div className="mt-2 pt-2 border-t border-gray-50">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Latest AutomationProofLog</p>
            <div className="bg-gray-50 rounded-lg p-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 w-28">Status</span>
                <StatusPill color={proofLog.status === "pass" ? "green" : proofLog.status === "fail" ? "red" : "yellow"} label={proofLog.status} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 w-28">Provider Msg ID</span>
                <span className="text-[11px] text-gray-700 font-mono break-all">{proofLog.provider_message_id || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 w-28">CommLog ID</span>
                <span className="text-[11px] text-gray-700 font-mono break-all">{proofLog.communication_log_id || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 w-28">CommEvent ID</span>
                <span className="text-[11px] text-gray-700 font-mono break-all">{proofLog.communication_event_id || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 w-28">Tested At</span>
                <span className="text-[11px] text-gray-700">{fmtDate(proofLog.tested_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 w-28">Tested By</span>
                <span className="text-[11px] text-gray-700">{proofLog.tested_by || "—"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Checklist details */}
        {checklist && (
          <div className="mt-2 pt-2 border-t border-gray-50">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">AutomationChecklist</p>
            <div className="bg-gray-50 rounded-lg p-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 w-28">Status</span>
                <StatusPill color={checklist.status === "active" ? "green" : "yellow"} label={checklist.status} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 w-28">Client Approved</span>
                <span className="text-[11px] text-gray-700">{checklist.client_approved ? "Yes" : "No"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 w-28">Went Live At</span>
                <span className="text-[11px] text-gray-700">{checklist.went_live_at ? fmtDate(checklist.went_live_at) : "Not set"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 w-28">Environment</span>
                <span className="text-[11px] text-gray-700">{checklist.environment || "unknown"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Audit trail */}
        {auditTrail && (
          <div className="mt-2 pt-2 border-t border-gray-50">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Approval Audit Trail</p>
            <div className="bg-blue-50 rounded-lg p-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 w-28">Type</span>
                <span className="text-[11px] text-gray-700 font-mono">{auditTrail.approval_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 w-28">Approved By</span>
                <span className="text-[11px] text-gray-700">{auditTrail.approved_by}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 w-28">Approved At</span>
                <span className="text-[11px] text-gray-700">{fmtDate(auditTrail.approved_at)}</span>
              </div>
              {auditTrail.approval_note && (
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400 w-28">Note</span>
                  <span className="text-[11px] text-gray-700 italic">"{auditTrail.approval_note}"</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approval note input */}
        {gate?.status === "proof_passed" && (
          <div className="mt-3">
            <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400 block mb-1">
              Approval Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context for this approval decision…"
              className="w-full text-xs rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              disabled={submitting}
            />
          </div>
        )}

        {/* Decision buttons */}
        {gate?.status === "proof_passed" && (
          <div className="mt-3 space-y-2">
            {decisions.map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.key}
                  onClick={() => handleDecision(d.key)}
                  disabled={submitting}
                  className="w-full text-left rounded-lg border p-3 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: d.bg, borderColor: d.border }}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: d.color }} />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-900">{d.label}</p>
                      <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{d.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Guardrails notice */}
        {gate?.status === "approved" && isQaEvidence(gate?.evidence_quality) && (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-900">Internal Launch Approved — QA Evidence</p>
                <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
                  This approval is for internal launch only. Evidence quality remains internal_test.
                  Public/client launch is NOT ready — production proof is still required.
                  went_live_at is NOT set. Full platform readiness is NOT affected.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error / result */}
        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-bold text-red-700">Error</p>
            <p className="text-[11px] text-red-600 mt-1">{error}</p>
          </div>
        )}
        {result && (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-xs font-bold text-green-700">Decision recorded: {result.label}</p>
            </div>
            <p className="text-[11px] text-green-600 mt-1">
              Evidence quality preserved: {String(result.evidence_quality_preserved)} ·
              went_live_at set: {String(result.went_live_at_set)} ·
              Public launch ready: {String(result.public_launch_ready)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sprint1ApprovalPanel({ gates, proofLogs, checklists, onDecisionMade }) {
  const approvalGates = (gates || []).filter((g) => SPRINT1_APPROVAL_KEYS.includes(g.gate_key));
  const ordered = SPRINT1_APPROVAL_KEYS.map((k) => approvalGates.find((g) => g.gate_key === k)).filter(Boolean);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
        <h3 className="text-sm font-bold text-gray-900">Sprint 1 Approval Layer</h3>
        <span className="text-[11px] text-gray-400">(admin-only — internal launch approval workflow)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {ordered.map((g) => {
          const latestProof = (proofLogs || [])
            .filter((p) => p.service_key === g.gate_key)
            .sort((a, b) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime())[0];
          const latestChecklist = (checklists || [])
            .filter((c) => c.service_key === g.gate_key)
            .sort((a, b) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime())[0];
          return (
            <ApprovalCard
              key={g.gate_key}
              gate={g}
              proofLog={latestProof}
              checklist={latestChecklist}
              onDecisionMade={onDecisionMade}
            />
          );
        })}
        {ordered.length === 0 && (
          <div className="col-span-2 text-center py-8">
            <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No Sprint 1 gates found. Run recalculateFirstLaunchGates first.</p>
          </div>
        )}
      </div>
    </div>
  );
}