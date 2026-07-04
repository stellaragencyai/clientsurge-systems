import { CheckCircle2, XCircle, AlertTriangle, ListChecks } from "lucide-react";

const STATUS_CONFIG = {
  complete: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Complete" },
  partial: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Partial" },
  missing: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Missing" },
};

function evaluateWorkstream(id, data) {
  const caps = data.capabilities || [];
  const proofByService = data.proof_by_service || {};
  const deliveryStats = data.delivery_stats || {};
  const eventStats = data.event_stats || {};
  const voiceReadiness = data.voice_readiness || {};
  const missedCall = data.missed_call_stats || {};
  const quarantine = data.quarantine || {};
  const checklists = data.qa_checklists || [];

  switch (id) {
    case "audit_truth_mapping": {
      const proofCap = caps.find(c => c.key === "automation_proof_logs");
      const totalProofs = Object.values(proofByService).reduce((s, p) => s + (p.total || 0), 0);
      const passedProofs = Object.values(proofByService).reduce((s, p) => s + (p.passed || 0), 0);
      const evidence = [];
      const needsProof = [];
      if (totalProofs > 0) evidence.push(`${totalProofs} AutomationProofLog records exist`);
      else needsProof.push("No AutomationProofLog records exist at all");
      if (passedProofs > 0) evidence.push(`${passedProofs} passed proof checks`);
      else needsProof.push("Zero proof checks have passed");
      if (proofCap) evidence.push(`Capability matrix has ${caps.length} capabilities mapped`);
      const status = passedProofs > 0 && totalProofs > 0 ? "partial" : "missing";
      return { status, evidence, needsProof, markComplete: false };
    }
    case "ai_voice": {
      const cap = caps.find(c => c.key === "ai_voice_receptionist");
      const evidence = [];
      const needsProof = [];
      if (voiceReadiness.inbound_voice_enabled) evidence.push("inbound_voice_enabled is true");
      else needsProof.push("inbound_voice_enabled is false");
      if (voiceReadiness.has_elevenlabs_agent_ids) evidence.push("ElevenLabs agent IDs configured");
      else needsProof.push("ElevenLabs agent IDs not configured");
      if (voiceReadiness.has_elevenlabs_phone_number_ids) evidence.push("ElevenLabs phone number IDs configured");
      else needsProof.push("ElevenLabs phone number IDs not configured");
      if (voiceReadiness.has_transcript_proof) evidence.push("Transcript proof exists on WebsiteLead");
      else needsProof.push("No transcript proof from a real call");
      const proof = proofByService["ai_voice_receptionist"];
      if (proof?.passed > 0) evidence.push(`${proof.passed} passed proof logs`);
      else needsProof.push("No passed AutomationProofLog for ai_voice_receptionist");
      const status = cap?.status === "green" ? "complete" : voiceReadiness.inbound_voice_enabled || voiceReadiness.has_elevenlabs_agent_ids ? "partial" : "missing";
      return { status, evidence, needsProof, markComplete: cap?.status === "green" };
    }
    case "missed_call": {
      const cap = caps.find(c => c.key === "missed_call_text_back");
      const evidence = [];
      const needsProof = [];
      if (missedCall.webhook_status === "configured") evidence.push("Missed-call webhook URL configured");
      else needsProof.push("Missed-call webhook URL not configured or blocked");
      if (missedCall.has_404) needsProof.push("Webhook returning 404");
      if (missedCall.has_405) needsProof.push("Webhook returning 405");
      if (missedCall.sms_attempts > 0) evidence.push(`${missedCall.sms_attempts} missed-call SMS attempts logged`);
      else needsProof.push("No missed-call SMS attempts logged");
      if (missedCall.successful_sends > 0) evidence.push(`${missedCall.successful_sends} successful sends`);
      const proof = proofByService["missed_call_text_back"];
      if (proof?.passed > 0) evidence.push(`${proof.passed} passed proof logs`);
      else needsProof.push("No passed AutomationProofLog for missed_call_text_back");
      const status = cap?.status === "green" ? "complete" : missedCall.sms_attempts > 0 || missedCall.webhook_status === "configured" ? "partial" : "missing";
      return { status, evidence, needsProof, markComplete: cap?.status === "green" };
    }
    case "speed_to_lead": {
      const instantCap = caps.find(c => c.key === "instant_lead_response");
      const nurtureCap = caps.find(c => c.key === "nurture_sequence_14d");
      const evidence = [];
      const needsProof = [];
      if (deliveryStats.delivered > 0) evidence.push(`${deliveryStats.delivered} delivered SMS logs`);
      else needsProof.push("No delivered SMS proof");
      if (deliveryStats.with_provider_message_id > 0) evidence.push(`${deliveryStats.with_provider_message_id} logs with provider_message_id`);
      else needsProof.push("No logs with provider_message_id");
      const instantProof = proofByService["instant_lead_response"];
      if (instantProof?.passed > 0) evidence.push(`${instantProof.passed} instant_lead_response proof logs passed`);
      else needsProof.push("No passed proof for instant_lead_response");
      const nurtureProof = proofByService["nurture_sequence_14d"];
      if (nurtureProof?.passed > 0) evidence.push(`${nurtureProof.passed} nurture_sequence proof logs passed`);
      else needsProof.push("No passed proof for nurture_sequence_14d");
      const instantStatus = instantCap?.status;
      const nurtureStatus = nurtureCap?.status;
      const status = instantStatus === "green" && nurtureStatus === "green" ? "complete" : instantStatus !== "red" || nurtureStatus !== "red" ? "partial" : "missing";
      return { status, evidence, needsProof, markComplete: instantStatus === "green" && nurtureStatus === "green" };
    }
    case "review_referral": {
      const reviewCap = caps.find(c => c.key === "review_request");
      const referralCap = caps.find(c => c.key === "lead_reactivation");
      const smsCap = caps.find(c => c.key === "inbound_sms_assistant");
      const evidence = [];
      const needsProof = [];
      const reviewProof = proofByService["review_request"];
      const referralProof = proofByService["lead_reactivation"];
      const smsProof = proofByService["inbound_sms_assistant"];
      if (reviewProof?.passed > 0) evidence.push(`${reviewProof.passed} review_request proof logs passed`);
      else needsProof.push("No passed proof for review_request");
      if (referralProof?.passed > 0) evidence.push(`${referralProof.passed} lead_reactivation proof logs passed`);
      else needsProof.push("No passed proof for lead_reactivation (referral engine)");
      if (smsProof?.passed > 0) evidence.push(`${smsProof.passed} inbound_sms_assistant proof logs passed`);
      else needsProof.push("No passed proof for inbound_sms_assistant");
      const reviewOk = reviewCap?.status === "green";
      const referralOk = referralCap?.status === "green";
      const smsOk = smsCap?.status === "green";
      const status = reviewOk && referralOk && smsOk ? "complete" : reviewCap?.status !== "red" || referralCap?.status !== "red" || smsCap?.status !== "red" ? "partial" : "missing";
      return { status, evidence, needsProof, markComplete: reviewOk && referralOk && smsOk };
    }
    case "compliance_reliability": {
      const evidence = [];
      const needsProof = [];
      if (eventStats.total > 0) evidence.push(`${eventStats.total} CommunicationEvent records logged`);
      else needsProof.push("No CommunicationEvent records");
      if (eventStats.twilio_400_errors > 0) needsProof.push(`${eventStats.twilio_400_errors} Twilio 400 errors need resolution`);
      if (eventStats.failed_events > 0) needsProof.push(`${eventStats.failed_events} failed events need resolution`);
      else evidence.push("Zero failed events");
      if (deliveryStats.weak_proof_count > 0) needsProof.push(`${deliveryStats.weak_proof_count} weak-proof SMS logs (no provider_message_id)`);
      if (quarantine.excluded_leads_count > 0) needsProof.push(`${quarantine.excluded_leads_count} test/internal records in production view`);
      else evidence.push("No test data polluting production views");
      if (data.settings_summary?.twilio_account_sid_present) evidence.push("Twilio credentials present");
      else needsProof.push("Twilio account SID not set");
      const hasErrors = eventStats.twilio_400_errors > 0 || eventStats.failed_events > 0 || deliveryStats.weak_proof_count > 0;
      const status = !hasErrors && eventStats.total > 0 ? "complete" : eventStats.total > 0 ? "partial" : "missing";
      return { status, evidence, needsProof, markComplete: !hasErrors && eventStats.total > 0 };
    }
    default:
      return { status: "missing", evidence: [], needsProof: ["Unknown workstream"], markComplete: false };
  }
}

const WORKSTREAMS = [
  { id: "audit_truth_mapping", label: "Audit & Truth Mapping", description: "AutomationProofLog coverage and capability matrix completeness." },
  { id: "ai_voice", label: "AI Receptionist / Voice Agent", description: "ElevenLabs agent config, inbound voice, transcript proof." },
  { id: "missed_call", label: "Missed Call Recovery", description: "Webhook health, SMS attempt logs, proof records." },
  { id: "speed_to_lead", label: "Speed-to-Lead & Follow-Up", description: "Instant response and nurture sequence delivery proof." },
  { id: "review_referral", label: "Review, Referral & Client Communication", description: "Review request, referral engine, and inbound SMS assistant proof." },
  { id: "compliance_reliability", label: "Compliance, Reliability & QA", description: "Provider errors, failed events, test data quarantine, credential verification." },
];

export default function AsanaSyncNotes({ data }) {
  if (!data) return null;

  const results = WORKSTREAMS.map(ws => ({ ...ws, ...evaluateWorkstream(ws.id, data) }));
  const completeCount = results.filter(r => r.status === "complete").length;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-2">
        <ListChecks className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-blue-700 font-semibold mb-0.5">Asana Sync Notes — Admin Only</p>
          <p className="text-[11px] text-blue-600">
            Maps app evidence to implementation workstreams. Do not mark any Asana task complete unless app data proves it. {completeCount}/{results.length} workstreams are complete.
          </p>
        </div>
      </div>

      {results.map(ws => {
        const style = STATUS_CONFIG[ws.status];
        const Icon = style.icon;
        return (
          <div key={ws.id} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                  <Icon className="w-4 h-4" style={{ color: style.color }} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{ws.label}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{ws.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                  {style.label}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wide ${ws.markComplete ? "text-green-600" : "text-red-600"}`}>
                  Asana: {ws.markComplete ? "✓ Complete" : "✗ Do NOT mark complete"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Evidence That Exists</p>
                {ws.evidence.length > 0 ? (
                  <ul className="space-y-1">
                    {ws.evidence.map((e, i) => (
                      <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400">No evidence yet.</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">What Still Needs Proof</p>
                {ws.needsProof.length > 0 ? (
                  <ul className="space-y-1">
                    {ws.needsProof.map((n, i) => (
                      <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                        <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-green-600 font-medium">All proof requirements met.</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}