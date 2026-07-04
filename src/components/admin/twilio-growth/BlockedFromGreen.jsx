import { Ban, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const STATUS_STYLES = {
  green: { color: "#059669", icon: CheckCircle2, label: "Proven" },
  yellow: { color: "#D97706", icon: AlertTriangle, label: "Partial" },
  red: { color: "#DC2626", icon: XCircle, label: "Not Done" },
};

function getBlockedReasons(cap, data) {
  const reasons = [];
  const pbs = data.proof_by_service || {};
  const ds = data.delivery_stats || {};
  const mc = data.missed_call_stats || {};
  const vr = data.voice_readiness || {};
  const es = data.event_stats || {};

  if (cap.proof?.total === 0) {
    reasons.push("No proof record exists — no AutomationProofLog has been created for this capability.");
  } else if (cap.proof?.passed === 0 && cap.proof?.total > 0) {
    reasons.push("Proof records exist but none have passed — all are pending or failed.");
  }

  switch (cap.key) {
    case "ai_voice_receptionist":
      if (!vr.has_elevenlabs_agent_ids) reasons.push("Required configuration missing — ElevenLabs agent IDs are not set.");
      if (!vr.has_elevenlabs_phone_number_ids) reasons.push("Required configuration missing — ElevenLabs phone number IDs are not set.");
      if (!vr.inbound_voice_enabled) reasons.push("Required configuration missing — inbound_voice_enabled is false.");
      if (!vr.has_transcript_proof) reasons.push("Voice assistant lacks transcript or meaningful summary evidence — no real call transcript exists.");
      break;
    case "missed_call_text_back":
      if (mc.has_404) reasons.push("Required configuration missing — missed-call webhook is returning 404.");
      if (mc.has_405) reasons.push("Required configuration missing — missed-call webhook is returning 405.");
      if (!mc.webhook_url) reasons.push("Required configuration missing — missed_call_webhook_url is not set.");
      if (mc.sms_attempts === 0) reasons.push("Latest record is only an attempt, not final outcome proof — no missed-call SMS attempts logged.");
      if (mc.failures > 0 && mc.successful_sends === 0) reasons.push("Latest record is only an attempt — all missed-call SMS attempts failed.");
      break;
    case "instant_lead_response":
      if (ds.delivered === 0) reasons.push("Latest record is only an attempt, not final outcome proof — no SMS log has delivery_status=delivered.");
      if (ds.without_provider_message_id > 0 && ds.with_provider_message_id === 0) reasons.push("Related evidence record is missing important fields — no CommunicationLog has a provider_message_id.");
      if (ds.weak_proof_count > 0 && ds.delivered === 0) reasons.push("Latest evidence is only an attempt — weak-proof records exist (sent status without provider_message_id).");
      break;
    case "nurture_sequence_14d":
      if (ds.with_provider_message_id === 0) reasons.push("Related evidence record is missing important fields — no CommunicationLog has a provider_message_id for nurture steps.");
      if (cap.proof?.total === 0) reasons.push("No proof record exists — no AutomationProofLog for nurture sequence enrollment or step delivery.");
      break;
    case "review_request":
      if (cap.proof?.total === 0) reasons.push("Review/referral workflow has no evidence record — no AutomationProofLog exists for review_request.");
      break;
    case "lead_reactivation":
      if (cap.proof?.total === 0) reasons.push("Review/referral workflow has no evidence record — no AutomationProofLog exists for lead_reactivation (referral engine).");
      break;
    case "inbound_sms_assistant":
      if (cap.proof?.total === 0) reasons.push("No proof record exists — no AutomationProofLog for inbound SMS assistant.");
      if (es.total === 0) reasons.push("Related evidence record is missing important fields — no CommunicationEvent records exist for inbound SMS.");
      break;
    case "ai_booking_agent":
      if (!vr.has_transcript_proof) reasons.push("Voice assistant lacks transcript or meaningful summary evidence — no call transcript exists on any WebsiteLead.");
      break;
    case "voice_broadcasts":
      if (!vr.voice_calls_enabled) reasons.push("Required configuration missing — voice_calls_enabled is false.");
      break;
    case "automation_proof_logs":
      if (cap.proof?.total === 0) reasons.push("No proof record exists — AutomationProofLog entity is completely empty.");
      else if (cap.proof?.passed === 0) reasons.push("Proof records exist but none have passed.");
      break;
    default:
      if (cap.blockers?.length > 0) reasons.push(...cap.blockers.map(b => `Blocked: ${b}`));
  }

  return [...new Set(reasons)];
}

export default function BlockedFromGreen({ data }) {
  if (!data) return null;
  const allCaps = data.capabilities || [];
  const blocked = allCaps.filter(c => c.status !== "green");
  const greenCount = allCaps.filter(c => c.status === "green").length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-2" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <Ban className="w-4 h-4 text-gray-400" />
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-900">{blocked.length} capabilities</span> blocked from green. {greenCount} are proven.
        </p>
      </div>

      {blocked.length === 0 ? (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <p className="text-xs text-green-700 font-semibold">All capabilities proven green. No blockers detected.</p>
        </div>
      ) : (
        blocked.map(cap => {
          const style = STATUS_STYLES[cap.status] || STATUS_STYLES.red;
          const reasons = getBlockedReasons(cap, data);
          return (
            <div key={cap.key} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <style.icon className="w-4 h-4 flex-shrink-0" style={{ color: style.color }} />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{cap.label}</h4>
                    {cap.service_key && <p className="text-[11px] text-gray-400 font-mono">{cap.service_key}</p>}
                  </div>
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0" style={{ color: style.color, background: `${style.color}11`, border: `1px solid ${style.color}30` }}>
                  {style.label}
                </span>
              </div>
              {reasons.length > 0 ? (
                <ul className="space-y-1.5">
                  {reasons.map((reason, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                      <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{reason}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">No specific blockers identified — review manually.</p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}