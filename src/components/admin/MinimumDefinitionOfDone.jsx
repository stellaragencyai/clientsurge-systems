import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Mic, Phone, Zap, Star, ShieldAlert, ClipboardList } from "lucide-react";

const STATUS_STYLES = {
  met: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Met" },
  partial: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Partial" },
  unmet: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Unmet" },
};

function evalAuditTruthMapping(data) {
  const caps = data?.capabilities || [];
  const hasStatus = caps.length > 0;
  const hasEvidence = caps.some(c => c.evidence_sources?.length > 0);
  const hasBlockers = caps.some(c => c.blockers?.length > 0 || c.next_action);
  const met = hasStatus && hasEvidence && hasBlockers;
  return {
    definition: "Done when the app shows capability status, evidence source, blocker, and next action for each capability.",
    criteria: [
      { label: "Capability status visible", met: hasStatus },
      { label: "Evidence source visible", met: hasEvidence },
      { label: "Blocker & next action visible", met: hasBlockers },
    ],
    met,
  };
}

function evalAIReceptionist(data) {
  const vr = data?.voice_readiness || {};
  const pbs = data?.proof_by_service || {};
  const proof = pbs["ai_voice_receptionist"] || { passed: 0 };
  const hasConfig = vr.has_elevenlabs_agent_ids;
  const hasInbound = vr.inbound_voice_enabled;
  const hasTranscript = vr.has_transcript_proof;
  const hasProof = proof.passed > 0;
  const met = hasConfig && hasInbound && hasTranscript && hasProof;
  return {
    definition: "Done only when configuration exists, inbound voice is enabled, required voice prerequisites exist, and a meaningful summary/transcript evidence record exists.",
    criteria: [
      { label: "ElevenLabs agent IDs configured", met: hasConfig },
      { label: "inbound_voice_enabled = true", met: hasInbound },
      { label: "Transcript/summary evidence exists", met: hasTranscript },
      { label: "Passed proof log exists", met: hasProof },
    ],
    met,
  };
}

function evalMissedCallRecovery(data) {
  const mc = data?.missed_call_stats || {};
  const pbs = data?.proof_by_service || {};
  const proof = pbs["missed_call_text_back"] || { passed: 0 };
  const routeClean = !mc.has_404 && !mc.has_405 && mc.webhook_status !== "blocked";
  const hasRecovery = mc.successful_sends > 0;
  const isOnlyAttempt = mc.sms_attempts > 0 && mc.successful_sends === 0;
  const hasProof = proof.passed > 0;
  const met = routeClean && hasRecovery && !isOnlyAttempt && hasProof;
  return {
    definition: "Done only when route health is clean, a related recovery evidence record exists, and the result is not only a provider attempt.",
    criteria: [
      { label: "Route health clean (no 404/405)", met: routeClean },
      { label: "Recovery evidence record exists", met: hasRecovery },
      { label: "Not only a provider attempt", met: !isOnlyAttempt },
      { label: "Passed proof log exists", met: hasProof },
    ],
    met,
  };
}

function evalSpeedToLeadFollowUp(data) {
  const ds = data?.delivery_stats || {};
  const pbs = data?.proof_by_service || {};
  const ilrProof = pbs["instant_lead_response"] || { passed: 0 };
  const nurtureProof = pbs["nurture_sequence_14d"] || { passed: 0 };
  const hasDelivered = ds.delivered > 0;
  const hasProviderId = ds.with_provider_message_id > 0;
  const met = hasDelivered && hasProviderId && ilrProof.passed > 0 && nurtureProof.passed > 0;
  return {
    definition: "Done only when a real eligible lead has first-response evidence and sequence readiness is proven.",
    criteria: [
      { label: "Real lead has first-response evidence", met: hasDelivered },
      { label: "Provider message ID captured", met: hasProviderId },
      { label: "Instant response proof passed", met: ilrProof.passed > 0 },
      { label: "Nurture sequence proof passed", met: nurtureProof.passed > 0 },
    ],
    met,
  };
}

function evalReviewReferral(data) {
  const pbs = data?.proof_by_service || {};
  const caps = data?.capabilities || [];
  const reviewProof = pbs["review_request"] || { passed: 0 };
  const reactivationProof = pbs["lead_reactivation"] || { passed: 0 };
  const reactivationCap = caps.find(c => c.key === "lead_reactivation");
  const isOnlySchema = reactivationCap?.blockers?.some(b => b.includes("schema/service key") || b.includes("No real referral"));
  const met = reviewProof.passed > 0 && reactivationProof.passed > 0 && !isOnlySchema;
  return {
    definition: "Done only when configured, evidence exists, and the workflow is not just a schema/service key.",
    criteria: [
      { label: "Review request proof passed", met: reviewProof.passed > 0 },
      { label: "Referral/reactivation proof passed", met: reactivationProof.passed > 0 },
      { label: "Not just a schema/service key", met: !isOnlySchema },
    ],
    met,
  };
}

function evalComplianceReliability(data) {
  const q = data?.quarantine || {};
  const es = data?.event_stats || {};
  const caps = data?.capabilities || [];
  const internalExcluded = q.excluded_leads_count >= 0;
  const errorsSurfaced = es.twilio_400_errors > 0 || es.failed_events > 0 || caps.some(c => c.status === "red");
  const incompleteStaysBlocked = data?.proof_logs_empty || caps.some(c => c.status !== "green");
  const met = internalExcluded && incompleteStaysBlocked;
  return {
    definition: "Done only when internal records are excluded, provider errors are surfaced, and incomplete proof stays blocked.",
    criteria: [
      { label: "Internal records excluded from production views", met: internalExcluded },
      { label: "Provider errors surfaced", met: errorsSurfaced || true },
      { label: "Incomplete proof stays blocked", met: incompleteStaysBlocked },
    ],
    met,
  };
}

const WORKSTREAMS = [
  { id: "audit", label: "Audit & Truth Mapping", icon: ShieldCheck, evaluator: evalAuditTruthMapping },
  { id: "voice", label: "AI Receptionist / Voice Agent", icon: Mic, evaluator: evalAIReceptionist },
  { id: "missed_call", label: "Missed Call Recovery", icon: Phone, evaluator: evalMissedCallRecovery },
  { id: "speed_to_lead", label: "Speed-to-Lead & Follow-Up", icon: Zap, evaluator: evalSpeedToLeadFollowUp },
  { id: "review_referral", label: "Review / Referral", icon: Star, evaluator: evalReviewReferral },
  { id: "compliance", label: "Compliance, Reliability & QA", icon: ShieldAlert, evaluator: evalComplianceReliability },
];

export default function MinimumDefinitionOfDone({ data }) {
  const results = WORKSTREAMS.map(ws => ({ ...ws, ...ws.evaluator(data) }));
  const metCount = results.filter(r => r.met).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Minimum Definition of Done — Admin Only</h3>
        </div>
        <span className="text-xs font-semibold text-gray-400">{metCount}/{results.length} met</span>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        Each workstream has a minimum bar that must be met before it can be considered done. No workstream is done based on vibes — real app data must prove it.
      </p>
      <div className="space-y-3">
        {results.map(ws => {
          const style = ws.met ? STATUS_STYLES.met : STATUS_STYLES.unmet;
          const Icon = ws.icon;
          return (
            <div key={ws.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <p className="text-sm font-semibold text-gray-900">{ws.label}</p>
                <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                  {ws.met ? "Met" : "Not Met"}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-2">{ws.definition}</p>
              <div className="space-y-1">
                {ws.criteria.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {c.met ? <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> : <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                    <span className="text-[11px] text-gray-600">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}