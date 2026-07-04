import {
  CheckCircle2, AlertTriangle, XCircle, Database, Mic,
  Phone, Zap, Star, MessageSquare, ShieldCheck,
} from "lucide-react";

const STATUS_STYLES = {
  complete: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Complete" },
  partial: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Partial" },
  missing: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Missing" },
};

function evaluateWorkstream(id, data) {
  const caps = data?.capabilities || [];
  const pbs = data?.proof_by_service || {};
  const vr = data?.voice_readiness || {};
  const ds = data?.delivery_stats || {};
  const es = data?.event_stats || {};
  const mc = data?.missed_call_stats || {};
  const cls = data?.qa_checklists || [];
  const q = data?.quarantine || {};

  if (id === "audit_truth") {
    const totalProofs = Object.values(pbs).reduce((a, p) => a + p.total, 0);
    const passedProofs = Object.values(pbs).reduce((a, p) => a + p.passed, 0);
    const evidence = [];
    const needsProof = [];
    if (totalProofs > 0) {
      evidence.push(`${totalProofs} AutomationProofLog records (${passedProofs} passed)`);
    } else {
      needsProof.push("No AutomationProofLog records exist");
    }
    if (passedProofs === 0 && totalProofs > 0) {
      needsProof.push("Proof logs exist but none passed");
    }
    const status = passedProofs > 0 ? "complete" : (totalProofs > 0 ? "partial" : "missing");
    return { status, evidence, needsProof, asanaComplete: status === "complete" };
  }

  if (id === "ai_voice") {
    const evidence = [];
    const needsProof = [];
    if (vr.inbound_voice_enabled) { evidence.push("inbound_voice_enabled = true"); }
    else { needsProof.push("inbound_voice_enabled is false"); }
    if (vr.has_elevenlabs_agent_ids) { evidence.push("ElevenLabs agent IDs configured"); }
    else { needsProof.push("No ElevenLabs agent IDs"); }
    if (vr.has_transcript_proof) { evidence.push("Transcript proof exists"); }
    else { needsProof.push("No transcript proof"); }
    if (vr.has_elevenlabs_phone_number_ids) { evidence.push("ElevenLabs phone number IDs configured"); }
    else { needsProof.push("No ElevenLabs phone number IDs"); }
    const proof = pbs["ai_voice_receptionist"] || { passed: 0, total: 0 };
    if (proof.passed > 0) { evidence.push(`${proof.passed} passed proof logs`); }
    else { needsProof.push("No passed proof logs for ai_voice_receptionist"); }
    const allPassed = vr.inbound_voice_enabled && vr.has_elevenlabs_agent_ids && vr.has_transcript_proof && proof.passed > 0;
    const anyPartial = vr.inbound_voice_enabled || vr.has_elevenlabs_agent_ids;
    const status = allPassed ? "complete" : (anyPartial ? "partial" : "missing");
    return { status, evidence, needsProof, asanaComplete: status === "complete" };
  }

  if (id === "missed_call") {
    const evidence = [];
    const needsProof = [];
    if (mc.webhook_status === "configured") {
      evidence.push("Missed-call webhook configured (200)");
    } else if (mc.webhook_status === "blocked") {
      needsProof.push(`Webhook blocked (${mc.has_404 ? "404" : "405"})`);
    } else {
      needsProof.push("Webhook status unknown or not set");
    }
    if (mc.sms_attempts > 0) { evidence.push(`${mc.sms_attempts} missed-call SMS attempts`); }
    else { needsProof.push("No missed-call SMS attempts logged"); }
    if (mc.successful_sends > 0) { evidence.push(`${mc.successful_sends} successful sends`); }
    const proof = pbs["missed_call_text_back"] || { passed: 0, total: 0 };
    if (proof.passed > 0) { evidence.push(`${proof.passed} passed proof logs`); }
    else { needsProof.push("No passed proof logs for missed_call_text_back"); }
    const allPassed = mc.webhook_status === "configured" && mc.sms_attempts > 0 && proof.passed > 0;
    const anyPartial = mc.sms_attempts > 0 || mc.webhook_status === "configured";
    const status = allPassed ? "complete" : (anyPartial ? "partial" : "missing");
    return { status, evidence, needsProof, asanaComplete: status === "complete" };
  }

  if (id === "speed_to_lead") {
    const evidence = [];
    const needsProof = [];
    if (ds.delivered > 0) { evidence.push(`${ds.delivered} delivered SMS logs`); }
    else { needsProof.push("No delivered SMS proof"); }
    if (ds.with_provider_message_id > 0) { evidence.push(`${ds.with_provider_message_id} logs with provider_message_id`); }
    else { needsProof.push("No logs have provider_message_id"); }
    const proof = pbs["instant_lead_response"] || { passed: 0, total: 0 };
    if (proof.passed > 0) { evidence.push(`${proof.passed} passed proof logs`); }
    else { needsProof.push("No passed proof logs for instant_lead_response"); }
    const nurtureProof = pbs["nurture_sequence_14d"] || { passed: 0, total: 0 };
    if (nurtureProof.passed > 0) { evidence.push(`${nurtureProof.passed} passed nurture proof logs`); }
    else { needsProof.push("No passed proof logs for nurture_sequence_14d"); }
    const allPassed = ds.delivered > 0 && proof.passed > 0;
    const anyPartial = ds.delivered > 0 || proof.total > 0;
    const status = allPassed ? "complete" : (anyPartial ? "partial" : "missing");
    return { status, evidence, needsProof, asanaComplete: status === "complete" };
  }

  if (id === "review_referral") {
    const reviewProof = pbs["review_request"] || { passed: 0, total: 0 };
    const reactProof = pbs["lead_reactivation"] || { passed: 0, total: 0 };
    const smsProof = pbs["inbound_sms_assistant"] || { passed: 0, total: 0 };
    const evidence = [];
    const needsProof = [];
    if (reviewProof.passed > 0) { evidence.push(`review_request: ${reviewProof.passed} passed proof logs`); }
    else { needsProof.push("No passed proof logs for review_request"); }
    if (reactProof.passed > 0) { evidence.push(`lead_reactivation: ${reactProof.passed} passed proof logs`); }
    else { needsProof.push("No passed proof logs for lead_reactivation"); }
    if (smsProof.passed > 0) { evidence.push(`inbound_sms_assistant: ${smsProof.passed} passed proof logs`); }
    else { needsProof.push("No passed proof logs for inbound_sms_assistant"); }
    const activeChecklists = cls.filter(c => c.went_live_at);
    if (activeChecklists.length > 0) { evidence.push(`${activeChecklists.length} checklists went live`); }
    const allPassed = reviewProof.passed > 0 && reactProof.passed > 0 && smsProof.passed > 0;
    const anyPartial = reviewProof.total > 0 || reactProof.total > 0 || smsProof.total > 0;
    const status = allPassed ? "complete" : (anyPartial ? "partial" : "missing");
    return { status, evidence, needsProof, asanaComplete: status === "complete" };
  }

  if (id === "compliance_reliability") {
    const evidence = [];
    const needsProof = [];
    if (es.twilio_400_errors === 0 && es.total > 0) {
      evidence.push("No Twilio 400 errors in events");
    } else if (es.twilio_400_errors > 0) {
      needsProof.push(`${es.twilio_400_errors} Twilio 400 errors need investigation`);
    }
    if (ds.failed === 0 && ds.total > 0) {
      evidence.push("No failed SMS deliveries");
    } else if (ds.failed > 0) {
      needsProof.push(`${ds.failed} failed SMS deliveries`);
    }
    if (q.excluded_leads_count === 0) {
      evidence.push("No test data polluting production view");
    } else {
      needsProof.push(`${q.excluded_leads_count} test/smoke leads quarantined`);
    }
    if (ds.weak_proof_count === 0) {
      evidence.push("No weak-proof SMS logs");
    } else {
      needsProof.push(`${ds.weak_proof_count} weak-proof SMS logs`);
    }
    const status = (needsProof.length === 0 && evidence.length > 0) ? "complete" : (evidence.length > 0 ? "partial" : "missing");
    return { status, evidence, needsProof, asanaComplete: status === "complete" };
  }

  return { status: "missing", evidence: [], needsProof: ["Unknown workstream"], asanaComplete: false };
}

const WORKSTREAMS = [
  { id: "audit_truth", label: "Audit & Truth Mapping", icon: Database },
  { id: "ai_voice", label: "AI Receptionist / Voice Agent", icon: Mic },
  { id: "missed_call", label: "Missed Call Recovery", icon: Phone },
  { id: "speed_to_lead", label: "Speed-to-Lead & Follow-Up", icon: Zap },
  { id: "review_referral", label: "Review, Referral & Client Communication", icon: Star },
  { id: "compliance_reliability", label: "Compliance, Reliability & QA", icon: ShieldCheck },
];

export default function AsanaSyncNotes({ data }) {
  if (!data) return null;
  const results = WORKSTREAMS.map(ws => ({ ...ws, ...evaluateWorkstream(ws.id, data) }));
  const completeCount = results.filter(r => r.status === "complete").length;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-3">
        <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-blue-800 mb-0.5">Asana Sync Notes &mdash; Admin Only</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Evidence-based status for each implementation workstream. Do not mark an Asana task complete unless app data proves it.
            No external contacts are made and no public pages are modified.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Overall: {completeCount}/{results.length} workstreams complete</p>
        <p className="text-xs text-gray-400">Asana tasks should only be marked complete when status = Complete</p>
      </div>

      {results.map(ws => {
        const style = STATUS_STYLES[ws.status];
        const Icon = ws.icon;
        return (
          <div key={ws.id} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                  <Icon className="w-4 h-4" style={{ color: style.color }} />
                </div>
                <h4 className="text-sm font-bold text-gray-900">{ws.label}</h4>
              </div>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                {style.label}
              </span>
            </div>

            {ws.evidence.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Evidence That Exists</p>
                <ul className="space-y-0.5">
                  {ws.evidence.map((e, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ws.needsProof.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-500 mb-1">What Still Needs Proof</p>
                <ul className="space-y-0.5">
                  {ws.needsProof.map((n, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Mark Asana Task Complete?</p>
              <p className={"text-xs font-bold " + (ws.asanaComplete ? "text-green-600" : "text-red-600")}>
                {ws.asanaComplete ? "Yes - evidence proves completion" : "No - proof still required"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}