import { CheckCircle2, XCircle, AlertTriangle, ClipboardList, ShieldCheck } from "lucide-react";

const GATE_STYLES = {
  yes: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Yes" },
  no: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "No" },
  conditional: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Conditional" },
};

function evaluateAuditGate(data) {
  const caps = data.capabilities || [];
  const hasAllFields = caps.length > 0 && caps.every(c => c.status && c.evidence_sources && c.blockers !== undefined && c.next_action !== undefined);
  const missing = [];
  if (caps.length === 0) missing.push("No capabilities returned from audit");
  if (!hasAllFields) missing.push("Not all capabilities have status/evidence/blocker/next_action");

  return {
    should_mark_complete: hasAllFields ? "yes" : "no",
    reason: hasAllFields
      ? "Audit shows capability status, evidence source, blockers, and next actions for all rows."
      : "Audit does not yet expose all required fields for every capability.",
    missingEvidence: missing,
    currentStatus: `${caps.length} capabilities mapped`,
  };
}

function evaluateVoiceGate(data) {
  const vr = data.voice_readiness || {};
  const pbs = data.proof_by_service || {};
  const proof = pbs.ai_voice_receptionist || { passed: 0 };
  const missing = [];

  if (!vr.voice_webhook_url) missing.push("voice_webhook_url not configured");
  if (!vr.inbound_voice_enabled) missing.push("inbound_voice_enabled is false");
  if (!vr.has_elevenlabs_agent_ids) missing.push("No ElevenLabs agent IDs");
  if (!vr.has_elevenlabs_phone_number_ids) missing.push("No ElevenLabs phone number IDs");
  if (!vr.has_transcript_proof) missing.push("No transcript/summary evidence");
  if (proof.passed === 0) missing.push("No AutomationProofLog passed for ai_voice_receptionist");

  const shouldComplete = missing.length === 0;

  return {
    should_mark_complete: shouldComplete ? "yes" : "no",
    reason: shouldComplete
      ? "Voice agent has configuration, inbound voice enabled, prerequisites met, and transcript evidence."
      : "Voice agent is missing required configuration, prerequisites, or transcript evidence.",
    missingEvidence: missing,
    currentStatus: `Inbound: ${vr.inbound_voice_enabled ? "on" : "off"}, Agent IDs: ${vr.has_elevenlabs_agent_ids ? "yes" : "no"}, Transcript: ${vr.has_transcript_proof ? "yes" : "no"}, Proof: ${proof.passed} passed`,
  };
}

function evaluateMissedCallGate(data) {
  const mc = data.missed_call_stats || {};
  const pbs = data.proof_by_service || {};
  const proof = pbs.missed_call_text_back || { passed: 0 };
  const missing = [];

  if (mc.has_404) missing.push("Webhook returning 404");
  if (mc.has_405) missing.push("Webhook returning 405");
  if (mc.sms_attempts === 0) missing.push("No missed-call SMS attempts logged");
  if (proof.passed === 0) missing.push("No AutomationProofLog passed for missed_call_text_back");

  const shouldComplete = missing.length === 0;

  return {
    should_mark_complete: shouldComplete ? "yes" : "no",
    reason: shouldComplete
      ? "Route health is clean, recovery evidence exists, and proof has passed."
      : "Route is blocked, no recovery evidence, or proof has not passed.",
    missingEvidence: missing,
    currentStatus: `Webhook: ${mc.webhook_status || "unknown"}, SMS attempts: ${mc.sms_attempts || 0}, Proof: ${proof.passed} passed`,
  };
}

function evaluateSpeedToLeadGate(data) {
  const ds = data.delivery_stats || {};
  const pbs = data.proof_by_service || {};
  const ilr = pbs.instant_lead_response || { passed: 0 };
  const ns = pbs.nurture_sequence_14d || { passed: 0 };
  const missing = [];

  if (ds.delivered === 0) missing.push("No delivered SMS evidence");
  if (ds.with_provider_message_id === 0) missing.push("No logs with provider_message_id");
  if (ilr.passed === 0) missing.push("No AutomationProofLog passed for instant_lead_response");
  if (ns.passed === 0) missing.push("No AutomationProofLog passed for nurture_sequence_14d");

  const shouldComplete = missing.length === 0;

  return {
    should_mark_complete: shouldComplete ? "yes" : "no",
    reason: shouldComplete
      ? "Real eligible lead has first-response evidence and sequence readiness is proven."
      : "No delivered first-response evidence or sequence proof is missing.",
    missingEvidence: missing,
    currentStatus: `Delivered: ${ds.delivered || 0}, Provider IDs: ${ds.with_provider_message_id || 0}, ILR proof: ${ilr.passed}, Nurture proof: ${ns.passed}`,
  };
}

function evaluateReviewReferralGate(data) {
  const pbs = data.proof_by_service || {};
  const caps = data.capabilities || [];
  const rr = pbs.review_request || { passed: 0, total: 0 };
  const lr = pbs.lead_reactivation || { passed: 0, total: 0 };
  const rrCap = caps.find(c => c.key === "review_request");
  const lrCap = caps.find(c => c.key === "lead_reactivation");
  const missing = [];

  if (rr.total === 0) missing.push("No proof logs for review_request");
  if (rr.passed === 0) missing.push("No passed proof logs for review_request");
  if (lr.total === 0) missing.push("No proof logs for lead_reactivation");
  if (lr.passed === 0) missing.push("No passed proof logs for lead_reactivation");
  if (rrCap?.status !== "green") missing.push("Review request capability not at green");
  if (lrCap?.status !== "green") missing.push("Referral/reactivation capability not at green");

  const shouldComplete = missing.length === 0;

  return {
    should_mark_complete: shouldComplete ? "yes" : "no",
    reason: shouldComplete
      ? "Review and referral workflows are configured with evidence records and passed proof logs."
      : "Review/referral workflows lack evidence records or proof — not just a schema/service key issue.",
    missingEvidence: missing,
    currentStatus: `Review proof: ${rr.total}/${rr.passed}, Referral proof: ${lr.total}/${lr.passed}`,
  };
}

function evaluateComplianceGate(data) {
  const q = data.quarantine || {};
  const es = data.event_stats || {};
  const ds = data.delivery_stats || {};
  const caps = data.capabilities || [];
  const missing = [];

  if (!q.rules || q.rules.length === 0) missing.push("No quarantine exclusion rules documented");
  if (es.twilio_400_errors === undefined) missing.push("Provider 400 errors not surfaced");
  if (ds.weak_proof_count === undefined) missing.push("Weak proof records not flagged");
  const greenWithoutProof = caps.filter(c => c.status === "green" && c.proof?.passed === 0);
  if (greenWithoutProof.length > 0) missing.push(`${greenWithoutProof.length} green capabilities without passed proof`);

  const shouldComplete = missing.length === 0;

  return {
    should_mark_complete: shouldComplete ? "yes" : "no",
    reason: shouldComplete
      ? "Internal records excluded, provider errors surfaced, and incomplete proof stays blocked."
      : "Compliance/reliability gaps remain — test data, provider errors, or proof blocking not fully in place.",
    missingEvidence: missing,
    currentStatus: `Quarantine rules: ${q.rules?.length || 0}, 400 errors: ${es.twilio_400_errors || 0}, Weak proof: ${ds.weak_proof_count || 0}`,
  };
}

const WORKSTREAMS = [
  { id: "audit", label: "Audit & Truth Mapping", evaluator: evaluateAuditGate },
  { id: "voice", label: "AI Receptionist / Voice Agent", evaluator: evaluateVoiceGate },
  { id: "missed_call", label: "Missed Call Recovery", evaluator: evaluateMissedCallGate },
  { id: "speed_to_lead", label: "Speed-to-Lead & Follow-Up", evaluator: evaluateSpeedToLeadGate },
  { id: "review_referral", label: "Review, Referral & Client Communication", evaluator: evaluateReviewReferralGate },
  { id: "compliance", label: "Compliance, Reliability & QA", evaluator: evaluateComplianceGate },
];

export default function TwilioGrowthEngineAsanaCompletionGate({ data }) {
  if (!data) return null;
  const results = WORKSTREAMS.map(ws => ({ ...ws, ...ws.evaluator(data) }));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="w-4 h-4 text-gray-700" />
          <h3 className="text-sm font-bold text-gray-900">Asana Completion Gate</h3>
        </div>
        <p className="text-xs text-gray-500">Guidance only — do not mark anything complete automatically. Build workstreams cannot be complete if proof is missing.</p>
      </div>

      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Guidance only.</strong> This panel tells you whether each Asana workstream should be checked off. It does not mark anything complete automatically. Always verify evidence before checking off a task.
        </p>
      </div>

      {results.map(ws => {
        const cfg = GATE_STYLES[ws.should_mark_complete] || GATE_STYLES.no;
        const Icon = cfg.icon;
        return (
          <div key={ws.id} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="text-sm font-bold text-gray-900">{ws.label}</h4>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide flex-shrink-0" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                Mark Complete: {cfg.label}
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Reason</p>
                <p className="text-xs text-gray-600">{ws.reason}</p>
              </div>

              {ws.missingEvidence.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-0.5">Required Evidence Still Missing</p>
                  <ul className="space-y-0.5">
                    {ws.missingEvidence.map((m, i) => (
                      <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                        <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Current App Status</p>
                <p className="text-xs text-gray-600 font-mono break-all">{ws.currentStatus}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}