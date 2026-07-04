import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

function evaluateAuditTruthMapping(data) {
  const caps = data?.capabilities || [];
  const hasVisibleEvidence = caps.some(c => c.evidence_sources?.length > 0);
  const hasVisibleBlockers = caps.some(c => c.blockers?.length > 0);
  const hasVisibleNextActions = caps.some(c => c.next_action);

  return {
    should_mark_complete: hasVisibleEvidence && hasVisibleBlockers && hasVisibleNextActions,
    reason: hasVisibleEvidence && hasVisibleBlockers && hasVisibleNextActions
      ? "Capability status, evidence sources, blockers, and next actions are all visible in the audit matrix."
      : "The audit matrix must show capability status, evidence source, blocker, and next action for each capability before this can be checked off.",
    required_evidence_missing: [
      !hasVisibleEvidence && "No evidence sources are visible on any capability.",
      !hasVisibleBlockers && "No blockers are visible on any capability.",
      !hasVisibleNextActions && "No next actions are visible on any capability.",
    ].filter(Boolean),
    app_status: hasVisibleEvidence && hasVisibleBlockers && hasVisibleNextActions ? "complete" : hasVisibleEvidence ? "partial" : "missing",
  };
}

function evaluateAIReceptionist(data) {
  const vr = data?.voice_readiness || {};
  const pbs = data?.proof_by_service || {};
  const voiceProof = pbs["ai_voice_receptionist"] || { total: 0, passed: 0 };
  const hasConfig = vr.has_elevenlabs_agent_ids;
  const hasInbound = vr.inbound_voice_enabled;
  const hasTranscript = vr.has_transcript_proof;
  const hasProof = voiceProof.passed > 0;

  return {
    should_mark_complete: hasConfig && hasInbound && hasTranscript && hasProof,
    reason: hasConfig && hasInbound && hasTranscript && hasProof
      ? "Voice configuration exists, inbound voice is enabled, transcript/summary evidence exists, and proof log has passed."
      : "Voice agent cannot be marked complete without configuration, inbound enabled, transcript/summary evidence, AND a passed proof log.",
    required_evidence_missing: [
      !hasConfig && "ElevenLabs agent IDs not configured",
      !hasInbound && "inbound_voice_enabled is false",
      !hasTranscript && "No meaningful transcript/summary evidence record exists",
      !hasProof && "No passed AutomationProofLog for ai_voice_receptionist",
    ].filter(Boolean),
    app_status: hasConfig && hasInbound && hasTranscript && hasProof ? "complete" : (hasConfig || hasInbound) ? "partial" : "missing",
  };
}

function evaluateMissedCallRecovery(data) {
  const mc = data?.missed_call_stats || {};
  const pbs = data?.proof_by_service || {};
  const proof = pbs["missed_call_text_back"] || { total: 0, passed: 0 };
  const routeClean = !mc.has_404 && !mc.has_405 && mc.webhook_status !== "blocked";
  const hasRecoveryEvidence = mc.successful_sends > 0;
  const isOnlyAttempt = mc.sms_attempts > 0 && mc.successful_sends === 0;
  const hasProof = proof.passed > 0;

  return {
    should_mark_complete: routeClean && hasRecoveryEvidence && !isOnlyAttempt && hasProof,
    reason: routeClean && hasRecoveryEvidence && !isOnlyAttempt && hasProof
      ? "Route is clean (no 404/405), recovery evidence exists beyond a bare attempt, and proof log has passed."
      : "Missed-call recovery is not complete until route health is clean, a real recovery evidence record exists (not just a provider attempt), and proof has passed.",
    required_evidence_missing: [
      !routeClean && (mc.has_404 ? "Webhook returning 404" : mc.has_405 ? "Webhook returning 405" : "Webhook route is blocked"),
      !hasRecoveryEvidence && "No successful recovery SMS evidence (only attempts found)" ,
      isOnlyAttempt && "Latest evidence is only a provider attempt, not a final outcome",
      !hasProof && "No passed AutomationProofLog for missed_call_text_back",
    ].filter(Boolean),
    app_status: routeClean && hasRecoveryEvidence && hasProof ? "complete" : (routeClean || mc.sms_attempts > 0) ? "partial" : "missing",
  };
}

function evaluateSpeedToLeadFollowUp(data) {
  const ds = data?.delivery_stats || {};
  const pbs = data?.proof_by_service || {};
  const ilrProof = pbs["instant_lead_response"] || { total: 0, passed: 0 };
  const nurtureProof = pbs["nurture_sequence_14d"] || { total: 0, passed: 0 };
  const hasDeliveredResponse = ds.delivered > 0;
  const hasProviderMessageId = ds.with_provider_message_id > 0;
  const hasIlrProof = ilrProof.passed > 0;
  const hasNurtureProof = nurtureProof.passed > 0;

  return {
    should_mark_complete: hasDeliveredResponse && hasProviderMessageId && hasIlrProof && hasNurtureProof,
    reason: hasDeliveredResponse && hasProviderMessageId && hasIlrProof && hasNurtureProof
      ? "A real eligible lead has first-response delivery evidence with provider message ID, and both instant response and nurture proof logs have passed."
      : "Speed-to-lead & follow-up is not complete until a real lead has first-response evidence and sequence readiness is proven by passed proof logs.",
    required_evidence_missing: [
      !hasDeliveredResponse && "No delivered first-response SMS evidence tied to a real lead",
      !hasProviderMessageId && "No logs with provider_message_id (cannot confirm real delivery)",
      !hasIlrProof && "No passed AutomationProofLog for instant_lead_response",
      !hasNurtureProof && "No passed AutomationProofLog for nurture_sequence_14d",
    ].filter(Boolean),
    app_status: hasDeliveredResponse && hasIlrProof && hasNurtureProof ? "complete" : (hasDeliveredResponse || ds.total > 0) ? "partial" : "missing",
  };
}

function evaluateReviewReferralClientComms(data) {
  const pbs = data?.proof_by_service || {};
  const reviewProof = pbs["review_request"] || { total: 0, passed: 0 };
  const reactivationProof = pbs["lead_reactivation"] || { total: 0, passed: 0 };
  const smsProof = pbs["inbound_sms_assistant"] || { total: 0, passed: 0 };
  const caps = data?.capabilities || [];

  const reviewCap = caps.find(c => c.key === "review_request");
  const reactivationCap = caps.find(c => c.key === "lead_reactivation");

  const reviewConfigured = reviewCap && reviewCap.status !== "red";
  const reactivationIsOnlySchema = reactivationCap && reactivationCap.blockers?.some(b => b.includes("schema/service key") || b.includes("No real referral"));

  return {
    should_mark_complete: reviewProof.passed > 0 && reactivationProof.passed > 0 && smsProof.passed > 0 && !reactivationIsOnlySchema,
    reason: reviewProof.passed > 0 && reactivationProof.passed > 0 && smsProof.passed > 0 && !reactivationIsOnlySchema
      ? "Review requests, referral/reactivation, and client SMS communication all have passed proof logs and are not just schema/service keys."
      : "Review/referral & client communication is not complete until each is configured, has evidence, and is not just a schema/service key placeholder.",
    required_evidence_missing: [
      !reviewConfigured && "Review request workflow is not configured (red status)",
      reviewProof.passed === 0 && "No passed AutomationProofLog for review_request",
      reactivationProof.passed === 0 && "No passed AutomationProofLog for lead_reactivation",
      reactivationIsOnlySchema && "Referral engine is only a schema/service key — no real workflow exists",
      smsProof.passed === 0 && "No passed AutomationProofLog for inbound_sms_assistant",
    ].filter(Boolean),
    app_status: reviewProof.passed > 0 && reactivationProof.passed > 0 && smsProof.passed > 0 ? "complete" : (reviewConfigured || reviewProof.total > 0) ? "partial" : "missing",
  };
}

function evaluateComplianceReliabilityQA(data) {
  const q = data?.quarantine || {};
  const es = data?.event_stats || {};
  const ds = data?.delivery_stats || {};
  const caps = data?.capabilities || [];
  const proofLogsEmpty = data?.proof_logs_empty;

  const internalExcluded = q.excluded_leads_count >= 0; // rules exist
  const providerErrorsSurfaced = es.twilio_400_errors > 0 || es.failed_events > 0 || ds.failed > 0;
  const hasRedCapabilities = caps.some(c => c.status === "red");
  const incompleteProofStaysBlocked = proofLogsEmpty || caps.some(c => c.status !== "green");

  return {
    should_mark_complete: internalExcluded && providerErrorsSurfaced !== null && incompleteProofStaysBlocked && !hasRedCapabilities ? true : false,
    reason: !hasRedCapabilities && incompleteProofStaysBlocked
      ? "Internal records are excluded from production views, provider errors are surfaced, and incomplete proof stays blocked."
      : "Compliance/reliability is not complete until internal records are excluded, provider errors are surfaced, and capabilities with incomplete proof stay blocked (red).",
    required_evidence_missing: [
      !internalExcluded && "Internal/test record exclusion rules are not active",
      hasRedCapabilities && "One or more capabilities are at red status — incomplete proof must stay blocked",
      !incompleteProofStaysBlocked && "All capabilities appear green but proof logs may be empty — verify this is real",
    ].filter(Boolean),
    app_status: !hasRedCapabilities && incompleteProofStaysBlocked ? "complete" : hasRedCapabilities ? "partial" : "missing",
  };
}

const WORKSTREAMS = [
  { id: "audit", label: "Audit & Truth Mapping", evaluator: evaluateAuditTruthMapping },
  { id: "voice", label: "AI Receptionist / Voice Agent", evaluator: evaluateAIReceptionist },
  { id: "missed_call", label: "Missed Call Recovery", evaluator: evaluateMissedCallRecovery },
  { id: "speed_to_lead", label: "Speed-to-Lead & Follow-Up", evaluator: evaluateSpeedToLeadFollowUp },
  { id: "review_referral", label: "Review, Referral & Client Communication", evaluator: evaluateReviewReferralClientComms },
  { id: "compliance", label: "Compliance, Reliability & QA", evaluator: evaluateComplianceReliabilityQA },
];

const STATUS_STYLES = {
  complete: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Complete" },
  partial: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Partial" },
  missing: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Missing" },
};

export default function AsanaCompletionGate({ data }) {
  if (!data) return null;

  const results = WORKSTREAMS.map(ws => ({ ...ws, ...ws.evaluator(data) }));

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-900">Asana Completion Gate — Guidance Only</p>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            This panel evaluates whether each Asana workstream has enough app evidence to be checked off.
            Nothing is marked complete automatically. Build workstreams cannot be complete if proof records are missing.
            The admin must manually verify and check off the Asana task.
          </p>
        </div>
      </div>

      {/* Workstream cards */}
      {results.map(ws => {
        const style = STATUS_STYLES[ws.app_status] || STATUS_STYLES.missing;
        const StatusIcon = style.icon;
        return (
          <div key={ws.id} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                  <StatusIcon className="w-4 h-4" style={{ color: style.color }} />
                </div>
                <h4 className="text-sm font-bold text-gray-900">{ws.label}</h4>
              </div>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0"
                style={{ color: ws.should_mark_complete ? "#059669" : "#DC2626", background: ws.should_mark_complete ? "rgba(5,150,105,0.06)" : "rgba(220,38,38,0.05)", border: `1px solid ${ws.should_mark_complete ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.18)"}` }}
              >
                {ws.should_mark_complete ? "✓ Can check off" : "✗ Do not check off"}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Current App Status</p>
                <p className="text-xs text-gray-600">
                  <span className="font-semibold" style={{ color: style.color }}>{style.label}</span>
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Reason</p>
                <p className="text-xs text-gray-600 leading-relaxed">{ws.reason}</p>
              </div>

              {ws.required_evidence_missing.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Required Evidence Still Missing</p>
                  <ul className="space-y-0.5">
                    {ws.required_evidence_missing.map((item, i) => (
                      <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                        <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ws.should_mark_complete && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-xs text-green-700 font-medium">
                    ✓ All required evidence exists. Admin may manually check off this Asana task after final review.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}