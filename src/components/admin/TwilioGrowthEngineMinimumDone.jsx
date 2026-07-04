import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const DONE_DEFS = [
  {
    workstream: "Audit & Truth Mapping",
    definition: "Done when the app shows capability status, evidence source, blocker, and next action for every capability.",
    checks: ["Capability matrix visible", "Evidence sources listed", "Blockers shown", "Next actions shown"],
  },
  {
    workstream: "AI Receptionist / Voice Agent",
    definition: "Done only when configuration exists, inbound voice is enabled, required voice prerequisites exist, and a meaningful summary/transcript evidence record exists.",
    checks: ["AdminSettings configuration exists", "inbound_voice_enabled = true", "ElevenLabs agent IDs configured", "Transcript or call summary proof exists"],
  },
  {
    workstream: "Missed Call Recovery",
    definition: "Done only when route health is clean, a related recovery evidence record exists, and the result is not only a provider attempt.",
    checks: ["Webhook returns 200 (no 404/405)", "Recovery SMS evidence logged", "Evidence is final outcome, not just attempt"],
  },
  {
    workstream: "Speed-to-Lead & Follow-Up",
    definition: "Done only when a real eligible lead has first-response evidence and sequence readiness is proven.",
    checks: ["Real lead with first-response SMS/email", "delivery_status = delivered", "Nurture sequence enrollment with valid lead ID"],
  },
  {
    workstream: "Review / Referral",
    definition: "Done only when configured, evidence exists, and the workflow is not just a schema/service key.",
    checks: ["review_link_set = true", "Outbound review communication logged", "Real referral/reactivation workflow exists (not just service key)"],
  },
  {
    workstream: "Compliance / Reliability",
    definition: "Done only when internal records are excluded, provider errors are surfaced, and incomplete proof stays blocked.",
    checks: ["Test/internal records excluded from production KPIs", "Provider 400 errors surfaced", "Incomplete proof stays blocked from green status"],
  },
];

function isDone(checks, data) {
  if (!data) return false;
  const caps = data.capabilities || [];
  const delivery = data.delivery_stats || {};
  const missed = data.missed_call_stats || {};
  const voice = data.voice_readiness || {};
  const quarantine = data.quarantine || {};
  const proofEmpty = data.proof_logs_empty;

  switch (checks.workstream) {
    case "Audit & Truth Mapping":
      return caps.length > 0 && caps.every(c => c.evidence_sources && c.blockers !== undefined && c.next_action !== undefined);
    case "AI Receptionist / Voice Agent":
      return voice.inbound_voice_enabled && voice.has_elevenlabs_agent_ids && voice.has_transcript_proof;
    case "Missed Call Recovery":
      return !missed.has_404 && !missed.has_405 && missed.sms_attempts > 0 && missed.successful_sends > 0;
    case "Speed-to-Lead & Follow-Up":
      return delivery.delivered > 0 && delivery.with_provider_message_id > 0;
    case "Review / Referral":
      return !proofEmpty && caps.find(c => c.key === "review_request")?.status === "green";
    case "Compliance / Reliability":
      return quarantine.excluded_leads_count !== undefined && (delivery.weak_proof_count === 0 || delivery.weak_proof_count === undefined) && !proofEmpty;
    default:
      return false;
  }
}

export default function TwilioGrowthEngineMinimumDone({ data }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900">Minimum Definition of Done — Admin Only</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Each workstream has a strict definition of done. No workstream is marked complete unless app data proves all criteria are met.
      </p>
      <div className="space-y-3">
        {DONE_DEFS.map(def => {
          const done = isDone(def, data);
          return (
            <div key={def.workstream} className="rounded-lg border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{def.workstream}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{def.definition}</p>
                </div>
                {done ? (
                  <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Done
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
                    <AlertTriangle className="w-3 h-3" /> Not Done
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {def.checks.map(c => (
                  <span key={c} className="flex items-center gap-1 text-[11px] text-gray-400">
                    {done ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <XCircle className="w-3 h-3 text-gray-300" />}
                    {c}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}