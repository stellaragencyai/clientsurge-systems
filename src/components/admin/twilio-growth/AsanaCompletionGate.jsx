import { CheckCircle2, XCircle, AlertTriangle, ListChecks } from "lucide-react";

function evaluateWorkstream(id, data) {
  const caps = data.capabilities || [];
  const pbs = data.proof_by_service || {};
  const ds = data.delivery_stats || {};
  const es = data.event_stats || {};
  const vr = data.voice_readiness || {};
  const mc = data.missed_call_stats || {};
  const q = data.quarantine || {};

  switch (id) {
    case "audit_truth": {
      const hasCaps = caps.length > 0;
      const hasEvidence = caps.every(c => c.evidence_sources && c.evidence_sources.length > 0);
      const hasBlockers = caps.every(c => c.blockers !== undefined);
      const hasNextActions = caps.every(c => c.next_action !== undefined);
      const missing = [];
      if (!hasCaps) missing.push("Capability matrix not populated");
      if (!hasEvidence) missing.push("Not all capabilities show evidence sources");
      if (!hasBlockers) missing.push("Not all capabilities show blockers");
      if (!hasNextActions) missing.push("Not all capabilities show next actions");
      // Audit can be complete if evidence/blockers/next actions are visible
      const shouldComplete = hasCaps && hasEvidence && hasBlockers && hasNextActions;
      return {
        shouldComplete,
        reason: shouldComplete
          ? "Capability evidence, blockers, and next actions are all visible in the audit."
          : "Audit matrix is incomplete — not all capabilities show evidence/blockers/next actions.",
        missingEvidence: missing,
        currentStatus: `${caps.length} capabilities mapped, ${hasEvidence ? "all have evidence sources" : "some missing evidence"}`,
      };
    }
    case "ai_voice": {
      const cap = caps.find(c => c.key === "ai_voice_receptionist");
      const proof = pbs["ai_voice_receptionist"];
      const missing = [];
      if (!vr.inbound_voice_enabled) missing.push("inbound_voice_enabled is false");
      if (!vr.has_elevenlabs_agent_ids) missing.push("ElevenLabs agent IDs not configured");
      if (!vr.has_elevenlabs_phone_number_ids) missing.push("ElevenLabs phone number IDs not configured");
      if (!vr.has_transcript_proof) missing.push("No transcript proof from real call");
      if (!proof || proof.passed === 0) missing.push("No passed AutomationProofLog");
      const shouldComplete = vr.inbound_voice_enabled && vr.has_elevenlabs_agent_ids && vr.has_transcript_proof && proof?.passed > 0;
      return {
        shouldComplete,
        reason: shouldComplete
          ? "Voice config exists, inbound voice enabled, prerequisites met, and transcript proof exists."
          : "Build workstream cannot be complete — proof is missing or prerequisites unmet.",
        missingEvidence: missing,
        currentStatus: cap?.status ? `Capability status: ${cap.status}` : "Not evaluated",
      };
    }
    case "missed_call": {
      const cap = caps.find(c => c.key === "missed_call_text_back");
      const proof = pbs["missed_call_text_back"];
      const missing = [];
      if (mc.has_404) missing.push("Webhook returning 404");
      if (mc.has_405) missing.push("Webhook returning 405");
      if (!mc.webhook_url) missing.push("missed_call_webhook_url not set");
      if (mc.sms_attempts === 0) missing.push("No missed-call SMS attempts logged");
      if (!proof || proof.passed === 0) missing.push("No passed AutomationProofLog");
      const shouldComplete = mc.webhook_status === "configured" && mc.sms_attempts > 0 && proof?.passed > 0;
      return {
        shouldComplete,
        reason: shouldComplete
          ? "Route health is clean, recovery evidence exists, and proof has passed."
          : "Build workstream cannot be complete — proof is missing or route is unhealthy.",
        missingEvidence: missing,
        currentStatus: cap?.status ? `Capability status: ${cap.status}` : "Not evaluated",
      };
    }
    case "speed_to_lead": {
      const cap = caps.find(c => c.key === "instant_lead_response");
      const proof = pbs["instant_lead_response"];
      const nurtureProof = pbs["nurture_sequence_14d"];
      const missing = [];
      if (ds.delivered === 0) missing.push("No delivered SMS proof for first response");
      if (ds.with_provider_message_id === 0) missing.push("No logs with provider_message_id");
      if (!proof || proof.passed === 0) missing.push("No passed proof for instant_lead_response");
      if (!nurtureProof || nurtureProof.passed === 0) missing.push("No passed proof for nurture_sequence_14d");
      const shouldComplete = ds.delivered > 0 && proof?.passed > 0;
      return {
        shouldComplete,
        reason: shouldComplete
          ? "Real lead has first-response evidence and sequence readiness is proven."
          : "Build workstream cannot be complete — proof is missing.",
        missingEvidence: missing,
        currentStatus: cap?.status ? `Capability status: ${cap.status}` : "Not evaluated",
      };
    }
    case "review_referral": {
      const reviewCap = caps.find(c => c.key === "review_request");
      const referralCap = caps.find(c => c.key === "lead_reactivation");
      const smsCap = caps.find(c => c.key === "inbound_sms_assistant");
      const reviewProof = pbs["review_request"];
      const referralProof = pbs["lead_reactivation"];
      const smsProof = pbs["inbound_sms_assistant"];
      const missing = [];
      if (!reviewProof || reviewProof.passed === 0) missing.push("No passed proof for review_request");
      if (!referralProof || referralProof.passed === 0) missing.push("No passed proof for lead_reactivation (referral)");
      if (!smsProof || smsProof.passed === 0) missing.push("No passed proof for inbound_sms_assistant");
      const shouldComplete = reviewProof?.passed > 0 && referralProof?.passed > 0 && smsProof?.passed > 0;
      return {
        shouldComplete,
        reason: shouldComplete
          ? "Review, referral, and client communication all have passing proof records."
          : "Build workstream cannot be complete — proof is missing for one or more services.",
        missingEvidence: missing,
        currentStatus: `Review: ${reviewCap?.status || "?"}, Referral: ${referralCap?.status || "?"}, SMS: ${smsCap?.status || "?"}`,
      };
    }
    case "compliance_reliability": {
      const missing = [];
      if (es.twilio_400_errors > 0) missing.push(`${es.twilio_400_errors} Twilio 400 errors`);
      if (es.failed_events > 0) missing.push(`${es.failed_events} failed events`);
      if (ds.weak_proof_count > 0) missing.push(`${ds.weak_proof_count} weak-proof SMS logs`);
      if (q.excluded_leads_count > 0) missing.push(`${q.excluded_leads_count} test records in production view`);
      const hasEvents = es.total > 0;
      const shouldComplete = hasEvents && missing.length === 0;
      return {
        shouldComplete,
        reason: shouldComplete
          ? "Internal records excluded, no provider errors, no incomplete proof blocking."
          : "Build workstream cannot be complete — provider errors or test data still present.",
        missingEvidence: missing,
        currentStatus: `${es.total} events, ${missing.length} issues`,
      };
    }
    default:
      return { shouldComplete: false, reason: "Unknown workstream", missingEvidence: [], currentStatus: "N/A" };
  }
}

const WORKSTREAMS = [
  { id: "audit_truth", label: "Audit & Truth Mapping" },
  { id: "ai_voice", label: "AI Receptionist / Voice Agent" },
  { id: "missed_call", label: "Missed Call Recovery" },
  { id: "speed_to_lead", label: "Speed-to-Lead & Follow-Up" },
  { id: "review_referral", label: "Review, Referral & Client Communication" },
  { id: "compliance_reliability", label: "Compliance, Reliability & QA" },
];

export default function AsanaCompletionGate({ data }) {
  if (!data) return null;
  const results = WORKSTREAMS.map(ws => ({ ...ws, ...evaluateWorkstream(ws.id, data) }));
  const yesCount = results.filter(r => r.shouldComplete).length;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-2">
        <ListChecks className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-blue-800 mb-0.5">Asana Completion Gate — Admin Only</p>
          <p className="text-xs text-blue-700">
            Guidance only — do not mark anything complete automatically. {yesCount}/{results.length} workstreams meet the gate.
          </p>
        </div>
      </div>

      {results.map(ws => {
        const Icon = ws.shouldComplete ? CheckCircle2 : XCircle;
        const color = ws.shouldComplete ? "#059669" : "#DC2626";
        return (
          <div key={ws.id} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <Icon className="w-5 h-5 flex-shrink-0" style={{ color }} />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{ws.label}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{ws.currentStatus}</p>
                </div>
              </div>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-bold flex-shrink-0" style={{ color, background: `${color}11`, border: `1px solid ${color}30` }}>
                {ws.shouldComplete ? "✓ Mark Complete" : "✗ Do NOT Mark"}
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Reason</p>
                <p className="text-xs text-gray-600 leading-relaxed">{ws.reason}</p>
              </div>
              {ws.missingEvidence.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-0.5">Required Evidence Still Missing</p>
                  <ul className="space-y-0.5">
                    {ws.missingEvidence.map((m, i) => (
                      <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}