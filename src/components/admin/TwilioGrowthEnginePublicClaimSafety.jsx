import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert, Megaphone } from "lucide-react";

const CLAIM_STYLES = {
  safe: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Claim Safe: Yes" },
  unsafe: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Claim Safe: No" },
  partial: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Claim Safe: Conditional" },
};

function evaluateClaim(data, claimId) {
  const caps = data.capabilities || [];
  const pbs = data.proof_by_service || {};
  const ds = data.delivery_stats || {};
  const mc = data.missed_call_stats || {};
  const vr = data.voice_readiness || {};

  switch (claimId) {
    case "ai_receptionist": {
      const cap = caps.find(c => c.key === "ai_voice_receptionist");
      const proof = pbs.ai_voice_receptionist || { passed: 0 };
      const safe = cap?.status === "green" && proof.passed > 0 && vr.has_transcript_proof && vr.has_elevenlabs_agent_ids;
      const supporting = [];
      if (vr.inbound_voice_enabled) supporting.push("inbound_voice_enabled = true");
      if (vr.has_elevenlabs_agent_ids) supporting.push("ElevenLabs agent IDs configured");
      if (vr.has_transcript_proof) supporting.push("Transcript proof exists");
      if (proof.passed > 0) supporting.push(`${proof.passed} proof log(s) passed`);
      const missing = [];
      if (!vr.inbound_voice_enabled) missing.push("inbound_voice_enabled is false");
      if (!vr.has_elevenlabs_agent_ids) missing.push("No ElevenLabs agent IDs");
      if (!vr.has_transcript_proof) missing.push("No transcript/summary evidence");
      if (proof.passed === 0) missing.push("No AutomationProofLog passed");
      return {
        claim_safe: safe ? "yes" : "no",
        status: safe ? "safe" : "unsafe",
        supporting,
        missing,
        wording: safe ? "Claim as operational — backed by proof records and transcript evidence" : "Do not claim yet — voice agent lacks transcript proof and passed proof logs",
      };
    }
    case "instant_lead_response": {
      const cap = caps.find(c => c.key === "instant_lead_response");
      const proof = pbs.instant_lead_response || { passed: 0 };
      const safe = cap?.status === "green" && proof.passed > 0 && ds.delivered > 0;
      const supporting = [];
      if (ds.delivered > 0) supporting.push(`${ds.delivered} delivered SMS in CommunicationLog`);
      if (ds.with_provider_message_id > 0) supporting.push(`${ds.with_provider_message_id} logs with provider_message_id`);
      if (proof.passed > 0) supporting.push(`${proof.passed} proof log(s) passed`);
      const missing = [];
      if (ds.delivered === 0) missing.push("No delivered SMS evidence");
      if (proof.passed === 0) missing.push("No AutomationProofLog passed");
      if (ds.weak_proof_count > 0) missing.push(`${ds.weak_proof_count} weak-proof records`);
      return {
        claim_safe: safe ? "yes" : "no",
        status: safe ? "safe" : "unsafe",
        supporting,
        missing,
        wording: safe ? "Claim as operational — backed by delivered SMS and proof logs" : "Do not claim yet — no delivered SMS proof or passed proof logs",
      };
    }
    case "missed_call_recovery": {
      const cap = caps.find(c => c.key === "missed_call_text_back");
      const proof = pbs.missed_call_text_back || { passed: 0 };
      const safe = cap?.status === "green" && proof.passed > 0 && !mc.has_404 && !mc.has_405;
      const supporting = [];
      if (mc.webhook_status === "configured") supporting.push("Webhook configured (200)");
      if (mc.sms_attempts > 0) supporting.push(`${mc.sms_attempts} missed-call SMS attempts`);
      if (proof.passed > 0) supporting.push(`${proof.passed} proof log(s) passed`);
      const missing = [];
      if (mc.has_404) missing.push("Webhook returning 404");
      if (mc.has_405) missing.push("Webhook returning 405");
      if (mc.sms_attempts === 0) missing.push("No missed-call SMS attempts logged");
      if (proof.passed === 0) missing.push("No AutomationProofLog passed");
      return {
        claim_safe: safe ? "yes" : "no",
        status: safe ? "safe" : "unsafe",
        supporting,
        missing,
        wording: safe ? "Claim as operational — backed by clean route and proof logs" : "Do not claim yet — webhook is blocked or no proof logs exist",
      };
    }
    case "automated_follow_up": {
      const cap = caps.find(c => c.key === "nurture_sequence_14d");
      const proof = pbs.nurture_sequence_14d || { passed: 0 };
      const safe = cap?.status === "green" && proof.passed > 0 && ds.with_provider_message_id > 0;
      const supporting = [];
      if (ds.with_provider_message_id > 0) supporting.push(`${ds.with_provider_message_id} logs with provider_message_id`);
      if (proof.passed > 0) supporting.push(`${proof.passed} proof log(s) passed`);
      const missing = [];
      if (ds.with_provider_message_id === 0) missing.push("No logs with provider_message_id");
      if (proof.passed === 0) missing.push("No AutomationProofLog passed");
      return {
        claim_safe: safe ? "yes" : "no",
        status: safe ? "safe" : "unsafe",
        supporting,
        missing,
        wording: safe ? "Claim as operational — backed by provider IDs and proof logs" : "Do not claim yet — no provider IDs or passed proof logs",
      };
    }
    case "review_requests": {
      const cap = caps.find(c => c.key === "review_request");
      const proof = pbs.review_request || { passed: 0 };
      const safe = cap?.status === "green" && proof.passed > 0;
      const supporting = [];
      if (proof.total > 0) supporting.push(`${proof.total} proof log(s) exist`);
      if (proof.passed > 0) supporting.push(`${proof.passed} proof log(s) passed`);
      const missing = [];
      if (proof.total === 0) missing.push("No proof logs exist for review_request");
      if (proof.passed === 0) missing.push("No proof logs passed");
      return {
        claim_safe: safe ? "yes" : "no",
        status: safe ? "safe" : "unsafe",
        supporting,
        missing,
        wording: safe ? "Claim as operational — backed by proof logs" : "Do not claim yet — no proof logs for review request flow",
      };
    }
    case "referral_engine": {
      const cap = caps.find(c => c.key === "lead_reactivation");
      const proof = pbs.lead_reactivation || { passed: 0 };
      const safe = cap?.status === "green" && proof.passed > 0;
      const supporting = [];
      if (proof.total > 0) supporting.push(`${proof.total} proof log(s) exist`);
      const missing = [];
      if (proof.total === 0) missing.push("No proof logs exist for lead_reactivation");
      if (proof.passed === 0) missing.push("No proof logs passed");
      if (!cap || cap.status !== "green") missing.push("Capability not at green status");
      return {
        claim_safe: safe ? "yes" : "no",
        status: safe ? "safe" : "unsafe",
        supporting,
        missing,
        wording: safe ? "Claim as operational — backed by proof logs" : "Do not claim yet — no evidence record for referral/reactivation flow",
      };
    }
    case "client_progress_updates": {
      const cap = caps.find(c => c.key === "inbound_sms_assistant");
      const proof = pbs.inbound_sms_assistant || { passed: 0 };
      const safe = cap?.status === "green" && proof.passed > 0;
      const supporting = [];
      if (proof.total > 0) supporting.push(`${proof.total} proof log(s) exist`);
      const missing = [];
      if (proof.total === 0) missing.push("No proof logs exist for inbound_sms_assistant");
      if (proof.passed === 0) missing.push("No proof logs passed");
      return {
        claim_safe: safe ? "yes" : "no",
        status: safe ? "safe" : "unsafe",
        supporting,
        missing,
        wording: safe ? "Claim as operational — backed by proof logs" : "Do not claim yet — no proof logs for client status update flow",
      };
    }
    default:
      return { claim_safe: "no", status: "unsafe", supporting: [], missing: ["Unknown claim"], wording: "Do not claim yet" };
  }
}

const CLAIMS = [
  { id: "ai_receptionist", label: "24/7 AI Receptionist" },
  { id: "instant_lead_response", label: "Instant Lead Response" },
  { id: "missed_call_recovery", label: "Missed-Call Recovery" },
  { id: "automated_follow_up", label: "Automated Follow-Up" },
  { id: "review_requests", label: "Review Requests" },
  { id: "referral_engine", label: "Referral Engine" },
  { id: "client_progress_updates", label: "Client Progress Updates" },
];

export default function TwilioGrowthEnginePublicClaimSafety({ data }) {
  if (!data) return null;
  const results = CLAIMS.map(c => ({ ...c, ...evaluateClaim(data, c.id) }));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="w-4 h-4 text-gray-700" />
          <h3 className="text-sm font-bold text-gray-900">Public Claim Safety Check</h3>
        </div>
        <p className="text-xs text-gray-500">Compares internal readiness against possible public website claims. Admin only — does not alter public copy. A claim is safe only when backed by real proof records.</p>
      </div>

      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Important:</strong> This panel does not modify public website copy. It only tells admins which claims are safe to make. Until a claim is backed by proof records, the recommended wording is "do not claim yet."
        </p>
      </div>

      {results.map(claim => {
        const cfg = CLAIM_STYLES[claim.status] || CLAIM_STYLES.unsafe;
        const Icon = cfg.icon;
        return (
          <div key={claim.id} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="text-sm font-bold text-gray-900">{claim.label}</h4>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide flex-shrink-0" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                {cfg.label}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {claim.supporting.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1">Supporting Evidence</p>
                  <ul className="space-y-0.5">
                    {claim.supporting.map((s, i) => (
                      <li key={i} className="text-gray-600 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {claim.missing.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Missing Evidence</p>
                  <ul className="space-y-0.5">
                    {claim.missing.map((m, i) => (
                      <li key={i} className="text-red-600 flex items-start gap-1.5">
                        <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Recommended Public Wording</p>
              <p className="text-xs text-gray-700 font-medium">{claim.wording}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}