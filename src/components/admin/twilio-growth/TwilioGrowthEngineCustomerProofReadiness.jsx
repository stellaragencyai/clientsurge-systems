import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const CAP_DEFS = [
  {
    key: "instant_lead_response",
    label: "Instant Lead Response",
    artifactNeeded: "A CommunicationLog or CommunicationEvent tied to a real (non-test) lead, with a valid provider_message_id and delivery_status=delivered.",
  },
  {
    key: "missed_call_text_back",
    label: "Missed Call Text-Back",
    artifactNeeded: "An inbound call event plus a related outbound follow-up CommunicationEvent with delivery proof, and no webhook 404/405 blocker.",
  },
  {
    key: "inbound_sms_assistant",
    label: "Client SMS Onboarding / Status Updates",
    artifactNeeded: "An inbound SMS CommunicationEvent plus a classification or response record showing the assistant handled it.",
  },
  {
    key: "ai_voice_receptionist",
    label: "AI Receptionist / Voice Agent",
    artifactNeeded: "An inbound voice CommunicationEvent with a non-empty transcript or call_summary. Ringing-only events are not proof.",
  },
  {
    key: "nurture_sequence_14d",
    label: "Automated Follow-Up / Nurture",
    artifactNeeded: "A sequence enrollment record with a valid lead ID and delivery proof for each outbound step.",
  },
  {
    key: "review_request",
    label: "Review Request Engine",
    artifactNeeded: "review_link_set=true on an AutomationChecklist, plus a logged outbound review communication event.",
  },
  {
    key: "lead_reactivation",
    label: "Referral / Reactivation Engine",
    artifactNeeded: "A dormant lead segment plus a logged reactivation CommunicationEvent or CommunicationLog.",
  },
];

function evaluateCap(capDef, data) {
  const caps = data.capabilities || [];
  const cap = caps.find(c => c.key === capDef.key);
  const delivery = data.delivery_stats || {};
  const voice = data.voice_readiness || {};
  const missed = data.missed_call_stats || {};

  let artifactFound = null;
  let isQaOnly = false;
  let ready = false;
  let reasonNotReady = "";

  switch (capDef.key) {
    case "instant_lead_response": {
      const delivered = delivery.delivered || 0;
      const withProviderId = delivery.with_provider_message_id || 0;
      if (delivered > 0 && withProviderId > 0) {
        ready = true;
        artifactFound = `${delivered} delivered SMS with valid provider message IDs in CommunicationLog.`;
      } else if (delivery.sent_only > 0 || delivery.queued > 0) {
        artifactFound = `${delivery.sent_only || 0} sent-only (no delivery proof), ${delivery.queued || 0} queued.`;
        isQaOnly = true;
        reasonNotReady = "Messages sent but not proven delivered. Need delivery_status=delivered with provider_message_id.";
      } else {
        reasonNotReady = "No delivered SMS evidence found in CommunicationLog.";
      }
      break;
    }
    case "missed_call_text_back": {
      if (missed.has_404 || missed.has_405) {
        reasonNotReady = `Webhook returning ${missed.has_404 ? "404" : "405"} — recovery route is broken.`;
      } else if ((missed.sms_attempts || 0) > 0 && (missed.successful_sends || 0) > 0) {
        ready = true;
        artifactFound = `${missed.successful_sends} successful missed-call SMS sends logged.`;
      } else if ((missed.sms_attempts || 0) > 0) {
        artifactFound = `${missed.sms_attempts} attempts, 0 successful sends.`;
        isQaOnly = true;
        reasonNotReady = "Missed-call SMS attempted but none delivered successfully.";
      } else {
        reasonNotReady = "No missed-call SMS attempts logged.";
      }
      break;
    }
    case "inbound_sms_assistant": {
      const capData = cap;
      if (capData?.proof?.passed > 0) {
        ready = true;
        artifactFound = "AutomationProofLog passed for inbound_sms_assistant.";
      } else {
        reasonNotReady = "No passed AutomationProofLog for inbound SMS assistant.";
      }
      break;
    }
    case "ai_voice_receptionist": {
      if (voice.has_transcript_proof && voice.inbound_voice_enabled && voice.has_elevenlabs_agent_ids) {
        ready = true;
        artifactFound = "Live call transcript or call summary exists on a WebsiteLead record.";
      } else {
        if (!voice.inbound_voice_enabled) reasonNotReady = "inbound_voice_enabled is false.";
        else if (!voice.has_elevenlabs_agent_ids) reasonNotReady = "ElevenLabs agent IDs not configured.";
        else if (!voice.has_transcript_proof) reasonNotReady = "No live call transcript or call summary proof found.";
        else reasonNotReady = "Voice readiness prerequisites incomplete.";
      }
      break;
    }
    case "nurture_sequence_14d": {
      if (cap?.proof?.passed > 0 && (delivery.with_provider_message_id || 0) > 0) {
        ready = true;
        artifactFound = "Passed proof log plus SMS logs with provider message IDs.";
      } else {
        reasonNotReady = "Missing proof log, provider IDs, valid lead IDs, or stop-on-reply proof.";
      }
      break;
    }
    case "review_request": {
      if (cap?.status === "green" && cap?.proof?.passed > 0) {
        ready = true;
        artifactFound = "Passed proof log for review_request.";
      } else {
        reasonNotReady = "No passed AutomationProofLog for review_request.";
      }
      break;
    }
    case "lead_reactivation": {
      if (cap?.proof?.passed > 0) {
        ready = true;
        artifactFound = "Passed proof log for lead_reactivation.";
      } else {
        reasonNotReady = "No real referral/reactivation flow or automation with proof.";
      }
      break;
    }
    default:
      reasonNotReady = "Capability not evaluated.";
  }

  // If proof is unclear, set ready=false
  if (!artifactFound && !reasonNotReady) {
    ready = false;
    reasonNotReady = "Proof status unclear — defaulting to not ready.";
  }

  return { ready, artifactFound, isQaOnly, reasonNotReady };
}

export default function TwilioGrowthEngineCustomerProofReadiness({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <h3 className="text-sm font-bold text-gray-900">Customer Proof Readiness — Admin Only</h3>
        <p className="text-xs text-gray-500 mt-1">Determines whether ClientSurge can safely show a customer that a communication feature is working. Requires a real evidence artifact, not only configuration.</p>
      </div>

      {CAP_DEFS.map(capDef => {
        const result = evaluateCap(capDef, data);
        return (
          <div key={capDef.key} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="text-sm font-bold text-gray-900">{capDef.label}</h4>
              <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold flex-shrink-0 ${
                result.ready ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {result.ready ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {result.ready ? "Ready" : "Not Ready"}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Proof Artifact Needed</p>
                <p className="text-gray-600 leading-relaxed">{capDef.artifactNeeded}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Current Artifact Found</p>
                {result.artifactFound ? (
                  <p className="text-gray-600 leading-relaxed flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-gray-300 mt-0.5 flex-shrink-0" />
                    <span>
                      {result.artifactFound}
                      {result.isQaOnly && <span className="ml-1 text-amber-600 font-semibold">(QA only — not production proof)</span>}
                    </span>
                  </p>
                ) : (
                  <p className="text-gray-400 flex items-start gap-1.5">
                    <XCircle className="w-3 h-3 text-gray-300 mt-0.5 flex-shrink-0" />
                    <span>No artifact found.</span>
                  </p>
                )}
              </div>
              {!result.ready && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-0.5">Reason Not Ready</p>
                  <p className="text-red-600 leading-relaxed">{result.reasonNotReady}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Recommended Action</p>
                <p className="text-gray-600 leading-relaxed">
                  {result.ready
                    ? "Safe to show customers. Continue maintaining proof records."
                    : "Do not show customers until a real evidence artifact is produced and verified."}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}