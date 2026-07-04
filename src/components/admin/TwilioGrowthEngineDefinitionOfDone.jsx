import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Mic, Phone, Zap, Star, ShieldAlert } from "lucide-react";

const STATUS_CONFIG = {
  done: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Done" },
  partial: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Partial" },
  not_done: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Not Done" },
};

function evaluateAuditTruthMapping(data) {
  const caps = data.capabilities || [];
  const hasStatus = caps.length > 0 && caps.every(c => c.status);
  const hasEvidence = caps.every(c => c.evidence_sources && c.evidence_sources.length > 0);
  const hasBlockers = caps.every(c => c.blockers !== undefined);
  const hasNextAction = caps.every(c => c.next_action !== undefined);

  const met = hasStatus && hasEvidence && hasBlockers && hasNextAction;
  const unmet = [];
  if (!hasStatus) unmet.push("Capability status not visible for all rows");
  if (!hasEvidence) unmet.push("Evidence sources not shown for all rows");
  if (!hasBlockers) unmet.push("Blockers not shown for all rows");
  if (!hasNextAction) unmet.push("Next action not shown for all rows");

  return {
    met,
    status: met ? "done" : "not_done",
    metCriteria: ["Capability status visible", "Evidence source shown", "Blockers shown", "Next action shown"].filter((_, i) => [hasStatus, hasEvidence, hasBlockers, hasNextAction][i]),
    unmetCriteria: unmet,
    evidence: `${caps.length} capabilities with status, evidence, blockers, and next_action fields`,
  };
}

function evaluateVoiceAgent(data) {
  const vr = data.voice_readiness || {};
  const proofByService = data.proof_by_service || {};
  const voiceProof = proofByService.ai_voice_receptionist || { total: 0, passed: 0 };

  const checks = [
    { label: "Configuration exists (voice_webhook_url)", met: !!vr.voice_webhook_url },
    { label: "Inbound voice enabled", met: !!vr.inbound_voice_enabled },
    { label: "ElevenLabs agent IDs configured", met: !!vr.has_elevenlabs_agent_ids },
    { label: "ElevenLabs phone number IDs configured", met: !!vr.has_elevenlabs_phone_number_ids },
    { label: "Transcript/summary evidence exists", met: !!vr.has_transcript_proof },
    { label: "AutomationProofLog passed", met: voiceProof.passed > 0 },
  ];

  const metCount = checks.filter(c => c.met).length;
  const status = metCount === checks.length ? "done" : metCount > 0 ? "partial" : "not_done";

  return {
    met: metCount === checks.length,
    status,
    metCriteria: checks.filter(c => c.met).map(c => c.label),
    unmetCriteria: checks.filter(c => !c.met).map(c => c.label),
    evidence: `Voice readiness: ${metCount}/${checks.length} prerequisites met`,
  };
}

function evaluateMissedCallRecovery(data) {
  const mc = data.missed_call_stats || {};
  const proofByService = data.proof_by_service || {};
  const mcProof = proofByService.missed_call_text_back || { total: 0, passed: 0 };

  const routeClean = !mc.has_404 && !mc.has_405 && mc.webhook_status !== "blocked";
  const hasRecoveryEvidence = mc.sms_attempts > 0 || mcProof.passed > 0;
  const isRealOutcome = mcProof.passed > 0 || (mc.successful_sends > 0 && mc.webhook_status === "configured");

  const checks = [
    { label: "Route health clean (no 404/405)", met: routeClean },
    { label: "Recovery evidence record exists", met: hasRecoveryEvidence },
    { label: "Result is final outcome, not just attempt", met: isRealOutcome },
    { label: "AutomationProofLog passed", met: mcProof.passed > 0 },
  ];

  const metCount = checks.filter(c => c.met).length;
  const status = metCount === checks.length ? "done" : metCount > 0 ? "partial" : "not_done";

  return {
    met: metCount === checks.length,
    status,
    metCriteria: checks.filter(c => c.met).map(c => c.label),
    unmetCriteria: checks.filter(c => !c.met).map(c => c.label),
    evidence: `Webhook: ${mc.webhook_status || "unknown"}, SMS attempts: ${mc.sms_attempts || 0}, proof passed: ${mcProof.passed || 0}`,
  };
}

function evaluateSpeedToLead(data) {
  const ds = data.delivery_stats || {};
  const proofByService = data.proof_by_service || {};
  const ilrProof = proofByService.instant_lead_response || { total: 0, passed: 0 };
  const nsProof = proofByService.nurture_sequence_14d || { total: 0, passed: 0 };

  const checks = [
    { label: "Delivered SMS evidence exists (real lead response)", met: ds.delivered > 0 },
    { label: "Provider message IDs captured", met: ds.with_provider_message_id > 0 },
    { label: "Instant lead response proof passed", met: ilrProof.passed > 0 },
    { label: "Nurture sequence proof passed", met: nsProof.passed > 0 },
  ];

  const metCount = checks.filter(c => c.met).length;
  const status = metCount === checks.length ? "done" : metCount > 0 ? "partial" : "not_done";

  return {
    met: metCount === checks.length,
    status,
    metCriteria: checks.filter(c => c.met).map(c => c.label),
    unmetCriteria: checks.filter(c => !c.met).map(c => c.label),
    evidence: `Delivered: ${ds.delivered || 0}, with provider ID: ${ds.with_provider_message_id || 0}, ILR proof: ${ilrProof.passed || 0}, nurture proof: ${nsProof.passed || 0}`,
  };
}

function evaluateReviewReferral(data) {
  const proofByService = data.proof_by_service || {};
  const rrProof = proofByService.review_request || { total: 0, passed: 0 };
  const lrProof = proofByService.lead_reactivation || { total: 0, passed: 0 };
  const caps = data.capabilities || [];
  const reviewCap = caps.find(c => c.key === "review_request");
  const referralCap = caps.find(c => c.key === "lead_reactivation");

  const checks = [
    { label: "Review request configured (checklist)", met: reviewCap?.status === "green" },
    { label: "Review request evidence record exists", met: rrProof.total > 0 },
    { label: "Review request proof passed", met: rrProof.passed > 0 },
    { label: "Referral/reactivation workflow exists (not just service key)", met: lrProof.total > 0 || referralCap?.status === "green" },
    { label: "Referral/reactivation proof passed", met: lrProof.passed > 0 },
  ];

  const metCount = checks.filter(c => c.met).length;
  const status = metCount === checks.length ? "done" : metCount > 0 ? "partial" : "not_done";

  return {
    met: metCount === checks.length,
    status,
    metCriteria: checks.filter(c => c.met).map(c => c.label),
    unmetCriteria: checks.filter(c => !c.met).map(c => c.label),
    evidence: `Review proof: ${rrProof.total} total / ${rrProof.passed} passed, Referral proof: ${lrProof.total} total / ${lrProof.passed} passed`,
  };
}

function evaluateComplianceReliability(data) {
  const q = data.quarantine || {};
  const es = data.event_stats || {};
  const ds = data.delivery_stats || {};
  const caps = data.capabilities || {};

  const checks = [
    { label: "Internal/test records excluded from production", met: q.rules && q.rules.length > 0 },
    { label: "Provider errors surfaced in audit", met: es.twilio_400_errors !== undefined || es.failed_events !== undefined },
    { label: "Weak proof records flagged", met: ds.weak_proof_count !== undefined },
    { label: "Incomplete proof stays blocked (no green without proof)", met: caps.length > 0 && caps.filter(c => c.status === "green").every(c => c.proof?.passed > 0) },
    { label: "Test data quarantine rules documented", met: q.rules && q.rules.length > 0 },
  ];

  const metCount = checks.filter(c => c.met).length;
  const status = metCount === checks.length ? "done" : metCount > 0 ? "partial" : "not_done";

  return {
    met: metCount === checks.length,
    status,
    metCriteria: checks.filter(c => c.met).map(c => c.label),
    unmetCriteria: checks.filter(c => !c.met).map(c => c.label),
    evidence: `Quarantine rules: ${q.rules?.length || 0}, 400 errors: ${es.twilio_400_errors || 0}, failed events: ${es.failed_events || 0}, weak proof: ${ds.weak_proof_count || 0}`,
  };
}

const WORKSTREAMS = [
  { id: "audit", label: "Audit & Truth Mapping", icon: ShieldCheck, evaluator: evaluateAuditTruthMapping, definition: "Done when the app shows capability status, evidence source, blocker, and next action for every capability." },
  { id: "voice", label: "AI Receptionist / Voice Agent", icon: Mic, evaluator: evaluateVoiceAgent, definition: "Done only when configuration exists, inbound voice is enabled, required voice prerequisites exist, and a meaningful summary/transcript evidence record exists." },
  { id: "missed_call", label: "Missed Call Recovery", icon: Phone, evaluator: evaluateMissedCallRecovery, definition: "Done only when route health is clean, a related recovery evidence record exists, and the result is not only a provider attempt." },
  { id: "speed_to_lead", label: "Speed-to-Lead & Follow-Up", icon: Zap, evaluator: evaluateSpeedToLead, definition: "Done only when a real eligible lead has first-response evidence and sequence readiness is proven." },
  { id: "review_referral", label: "Review, Referral & Client Communication", icon: Star, evaluator: evaluateReviewReferral, definition: "Done only when configured, evidence exists, and the workflow is not just a schema/service key." },
  { id: "compliance", label: "Compliance, Reliability & QA", icon: ShieldAlert, evaluator: evaluateComplianceReliability, definition: "Done only when internal records are excluded, provider errors are surfaced, and incomplete proof stays blocked." },
];

export default function TwilioGrowthEngineDefinitionOfDone({ data }) {
  if (!data) return null;
  const results = WORKSTREAMS.map(ws => ({ ...ws, ...ws.evaluator(data) }));
  const doneCount = results.filter(r => r.status === "done").length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-gray-700" />
          <h3 className="text-sm font-bold text-gray-900">Minimum Definition of Done</h3>
        </div>
        <p className="text-xs text-gray-500">Each workstream is "done" only when all criteria are met with real app evidence. Admin only — no public claims.</p>
        <p className="text-xs font-semibold text-gray-700 mt-2">{doneCount}/{results.length} workstreams fully done</p>
      </div>

      {results.map(ws => {
        const cfg = STATUS_CONFIG[ws.status];
        const Icon = cfg.icon;
        const WsIcon = ws.icon;
        return (
          <div key={ws.id} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                <WsIcon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-900">{ws.label}</h4>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{ws.definition}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ws.metCriteria.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1">Criteria Met</p>
                  <ul className="space-y-0.5">
                    {ws.metCriteria.map((c, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ws.unmetCriteria.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Criteria Not Met</p>
                  <ul className="space-y-0.5">
                    {ws.unmetCriteria.map((c, i) => (
                      <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                        <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-400 mt-2 font-mono break-all">{ws.evidence}</p>
          </div>
        );
      })}
    </div>
  );
}