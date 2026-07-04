import {
  CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Megaphone, Lock,
} from "lucide-react";

const STATUS_STYLES = {
  safe: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Safe to Claim" },
  not_safe: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Do Not Claim" },
  setup_only: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Setup Only" },
};

function evaluateClaim(claimKey, data) {
  const capabilities = data.capabilities || [];
  const proofByService = data.proof_by_service || {};
  const deliveryStats = data.delivery_stats || {};
  const voiceReadiness = data.voice_readiness || {};
  const missedCallStats = data.missed_call_stats || {};
  const proofLogsEmpty = data.proof_logs_empty;

  const supporting = [];
  const missing = [];

  switch (claimKey) {
    case "ai_receptionist": {
      const cap = capabilities.find(c => c.key === "ai_voice_receptionist");
      const proof = proofByService["ai_voice_receptionist"] || { total: 0, passed: 0 };
      if (voiceReadiness.inbound_voice_enabled) supporting.push("inbound_voice_enabled = true");
      if (voiceReadiness.has_elevenlabs_agent_ids) supporting.push("ElevenLabs agent IDs configured");
      if (voiceReadiness.has_elevenlabs_phone_number_ids) supporting.push("ElevenLabs phone number IDs configured");
      if (voiceReadiness.has_transcript_proof) supporting.push("Transcript/summary evidence exists");
      if (proof.passed > 0) supporting.push(`AutomationProofLog: ${proof.passed} passed`);

      if (!voiceReadiness.inbound_voice_enabled) missing.push("inbound_voice_enabled is false");
      if (!voiceReadiness.has_elevenlabs_agent_ids) missing.push("No ElevenLabs agent IDs");
      if (!voiceReadiness.has_elevenlabs_phone_number_ids) missing.push("No ElevenLabs phone number IDs");
      if (!voiceReadiness.has_transcript_proof) missing.push("No transcript or meaningful summary evidence");
      if (proof.passed === 0) missing.push("No AutomationProofLog pass for ai_voice_receptionist");

      const isSafe = voiceReadiness.inbound_voice_enabled && voiceReadiness.has_elevenlabs_agent_ids && voiceReadiness.has_elevenlabs_phone_number_ids && voiceReadiness.has_transcript_proof && proof.passed > 0;
      const hasSomeSetup = voiceReadiness.inbound_voice_enabled || voiceReadiness.has_elevenlabs_agent_ids;
      return { status: isSafe ? "safe" : hasSomeSetup ? "setup_only" : "not_safe", supporting, missing };
    }

    case "instant_lead_response": {
      const proof = proofByService["instant_lead_response"] || { total: 0, passed: 0 };
      if (deliveryStats.delivered > 0) supporting.push(`${deliveryStats.delivered} delivered SMS in CommunicationLog`);
      if (deliveryStats.with_provider_message_id > 0) supporting.push(`${deliveryStats.with_provider_message_id} logs with provider_message_id`);
      if (proof.passed > 0) supporting.push(`AutomationProofLog: ${proof.passed} passed`);

      if (deliveryStats.delivered === 0) missing.push("No delivered SMS proof in CommunicationLog");
      if (proof.passed === 0) missing.push("No AutomationProofLog pass for instant_lead_response");

      const isSafe = deliveryStats.delivered > 0 && proof.passed > 0;
      const hasSomeSetup = deliveryStats.total > 0 || proof.total > 0;
      return { status: isSafe ? "safe" : hasSomeSetup ? "setup_only" : "not_safe", supporting, missing };
    }

    case "missed_call_recovery": {
      const proof = proofByService["missed_call_text_back"] || { total: 0, passed: 0 };
      if (missedCallStats.webhook_status === "configured") supporting.push("Missed-call webhook configured");
      if (missedCallStats.sms_attempts > 0) supporting.push(`${missedCallStats.sms_attempts} missed-call SMS attempts`);
      if (missedCallStats.successful_sends > 0) supporting.push(`${missedCallStats.successful_sends} successful sends`);
      if (proof.passed > 0) supporting.push(`AutomationProofLog: ${proof.passed} passed`);

      if (missedCallStats.has_404) missing.push("Webhook returning 404");
      if (missedCallStats.has_405) missing.push("Webhook returning 405");
      if (missedCallStats.sms_attempts === 0) missing.push("No missed-call SMS attempts logged");
      if (missedCallStats.webhook_status !== "configured") missing.push("Missed-call webhook not configured or blocked");
      if (proof.passed === 0) missing.push("No AutomationProofLog pass for missed_call_text_back");

      const isSafe = missedCallStats.webhook_status === "configured" && missedCallStats.sms_attempts > 0 && missedCallStats.successful_sends > 0 && proof.passed > 0 && !missedCallStats.has_404 && !missedCallStats.has_405;
      const hasSomeSetup = missedCallStats.webhook_status !== "not_set" || proof.total > 0;
      return { status: isSafe ? "safe" : hasSomeSetup ? "setup_only" : "not_safe", supporting, missing };
    }

    case "automated_follow_up": {
      const proof = proofByService["nurture_sequence_14d"] || { total: 0, passed: 0 };
      if (deliveryStats.with_provider_message_id > 0) supporting.push(`${deliveryStats.with_provider_message_id} logs with provider_message_id`);
      if (proof.total > 0) supporting.push(`${proof.total} proof log(s) exist`);
      if (proof.passed > 0) supporting.push(`AutomationProofLog: ${proof.passed} passed`);

      if (deliveryStats.with_provider_message_id === 0) missing.push("No SMS logs with provider_message_id");
      if (proof.passed === 0) missing.push("No AutomationProofLog pass for nurture_sequence_14d");
      if (proof.total === 0) missing.push("No proof logs for nurture sequence at all");

      const isSafe = deliveryStats.with_provider_message_id > 0 && proof.passed > 0;
      const hasSomeSetup = proof.total > 0 || deliveryStats.total > 0;
      return { status: isSafe ? "safe" : hasSomeSetup ? "setup_only" : "not_safe", supporting, missing };
    }

    case "review_requests": {
      const proof = proofByService["review_request"] || { total: 0, passed: 0 };
      if (proof.passed > 0) supporting.push(`AutomationProofLog: ${proof.passed} passed`);

      if (proof.total === 0) missing.push("No AutomationProofLog records for review_request");
      if (proof.passed === 0) missing.push("No passed proof for review_request");
      missing.push("No real review request evidence record found");

      const isSafe = proof.passed > 0;
      return { status: isSafe ? "safe" : "not_safe", supporting, missing };
    }

    case "referral_engine": {
      const proof = proofByService["lead_reactivation"] || { total: 0, passed: 0 };
      if (proof.passed > 0) supporting.push(`AutomationProofLog: ${proof.passed} passed`);

      if (proof.total === 0) missing.push("No AutomationProofLog records for lead_reactivation");
      if (proof.passed === 0) missing.push("No passed proof for referral/reactivation flow");
      missing.push("No real referral workflow or evidence record exists");

      const isSafe = proof.passed > 0;
      return { status: isSafe ? "safe" : "not_safe", supporting, missing };
    }

    case "client_progress_updates": {
      const proof = proofByService["inbound_sms_assistant"] || { total: 0, passed: 0 };
      if (proof.passed > 0) supporting.push(`AutomationProofLog: ${proof.passed} passed`);

      if (proof.total === 0) missing.push("No AutomationProofLog records for inbound_sms_assistant");
      if (proof.passed === 0) missing.push("No passed proof for client status update flow");

      const isSafe = proof.passed > 0;
      return { status: isSafe ? "safe" : "not_safe", supporting, missing };
    }

    default:
      return { status: "not_safe", supporting: [], missing: ["Unknown claim category"] };
  }
}

const CLAIMS = [
  { key: "ai_receptionist", label: "24/7 AI Receptionist", public_example: "AI receptionist answers calls 24/7" },
  { key: "instant_lead_response", label: "Instant Lead Response", public_example: "Leads get an instant SMS/email response" },
  { key: "missed_call_recovery", label: "Missed-Call Recovery", public_example: "Missed calls automatically get a text back" },
  { key: "automated_follow_up", label: "Automated Follow-Up", public_example: "Automated nurture sequence follows up with leads" },
  { key: "review_requests", label: "Review Requests", public_example: "Automatically requests reviews from customers" },
  { key: "referral_engine", label: "Referral Engine", public_example: "Reactivates dormant leads and drives referrals" },
  { key: "client_progress_updates", label: "Client Progress Updates", public_example: "Clients get automated status updates via SMS" },
];

function getRecommendedWording(status) {
  switch (status) {
    case "safe": return "Claim as an active feature — evidence supports it.";
    case "setup_only": return "Claim as 'in setup' or 'planned' — do not claim as live or active.";
    case "not_safe": return "Do not claim yet — no supporting evidence exists.";
    default: return "Do not claim yet.";
  }
}

export default function PublicClaimSafetyCheck({ data }) {
  if (!data) return null;

  const results = CLAIMS.map(claim => ({ ...claim, ...evaluateClaim(claim.key, data) }));
  const safeCount = results.filter(r => r.status === "safe").length;
  const notSafeCount = results.filter(r => r.status === "not_safe").length;
  const setupOnlyCount = results.filter(r => r.status === "setup_only").length;

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-900 mb-1">Admin-Only — Do Not Alter Public Website Copy</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            This panel compares internal readiness against possible public claims. It does not modify any public page.
            A claim is only "safe" when real app data proves the feature works end-to-end. Until then, public wording
            should say "in setup" or "planned" — or not mention the feature at all.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Public Claim Safety Summary</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{safeCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mt-0.5">Safe to Claim</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{setupOnlyCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mt-0.5">Setup Only</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{notSafeCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-red-600 mt-0.5">Do Not Claim</p>
          </div>
        </div>
      </div>

      {/* Claim cards */}
      {results.map(claim => {
        const style = STATUS_STYLES[claim.status];
        const Icon = style.icon;
        return (
          <div key={claim.key} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                  <Icon className="w-4 h-4" style={{ color: style.color }} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{claim.label}</h4>
                  <p className="text-[11px] text-gray-400 italic mt-0.5">Example public claim: "{claim.public_example}"</p>
                </div>
              </div>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                {style.label}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Supporting Evidence</p>
                {claim.supporting.length > 0 ? (
                  <ul className="space-y-0.5">
                    {claim.supporting.map((s, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-300 italic">None found</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Missing Evidence</p>
                {claim.missing.length > 0 ? (
                  <ul className="space-y-0.5">
                    {claim.missing.map((m, i) => (
                      <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                        <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-green-600 italic">All evidence present</p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Recommended Public Wording</p>
              <p className="text-xs text-gray-700 font-medium">{getRecommendedWording(claim.status)}</p>
            </div>
          </div>
        );
      })}

      {/* Footer note */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          This check is read-only and computed from live app data. It does not contact anyone, trigger external systems,
          or modify public website copy. When in doubt, default to "do not claim yet" until proof records confirm the
          feature works end-to-end.
        </p>
      </div>
    </div>
  );
}