import { AlertTriangle, ShieldCheck, Mic, Star, FileText, Database } from "lucide-react";

const DECISIONS = [
  {
    id: "voice_activation",
    icon: Mic,
    decision: "Activate AI voice assistant after prerequisites are met?",
    whyItMatters: "Once inbound_voice_enabled is true, inbound calls are answered by AI. If ElevenLabs agent IDs or phone number IDs are wrong, callers get a broken experience. This cannot be rolled back silently — clients may notice immediately.",
    defaultRecommendation: "Do NOT activate until a real call test produces a transcript and an AutomationProofLog pass exists. Keep inbound_voice_enabled = false until then.",
    impactIfIgnored: "Inbound calls could be answered by a misconfigured agent, producing silence, errors, or wrong information. Client trust erodes immediately on first failed call.",
  },
  {
    id: "review_referral_scope",
    icon: Star,
    decision: "Are review/referral workflows part of the current launch scope or deferred to a later phase?",
    whyItMatters: "The referral engine (lead_reactivation) has no proof records and no real workflow built. If it's in scope, work must start now. If deferred, public claims must not mention it.",
    defaultRecommendation: "Defer to a later phase. Keep these capabilities at 'missing' status and do not mention them in public-facing copy until a real workflow + proof exists.",
    impactIfIgnored: "If claimed publicly without a workflow, clients expect a feature that doesn't work. If built prematurely, engineering time is diverted from critical-path items (instant response, missed-call recovery).",
  },
  {
    id: "proof_before_claims",
    icon: FileText,
    decision: "Should production proof records be created before public claims are expanded?",
    whyItMatters: "AutomationProofLog is currently empty or has no passes. Public claims about automation capabilities are unsupported by evidence. Expanding claims before proof creates a trust gap if audited.",
    defaultRecommendation: "Yes — create and pass AutomationProofLog records for instant_lead_response and missed_call_text_back BEFORE expanding any public claims. Proof first, claims second.",
    impactIfIgnored: "Public marketing promises capabilities the system cannot prove. If a client asks for evidence or a dispute arises, there is nothing to show. Regulatory or legal risk if claims are challenged.",
  },
  {
    id: "test_data_exclusion",
    icon: Database,
    decision: "Should internal/test records stay excluded from all public dashboards permanently?",
    whyItMatters: "Test, smoke, and internal records currently exist alongside production data. They are excluded from metrics but remain in the database. If they leak into client-facing views, metrics are inflated and misleading.",
    defaultRecommendation: "Yes — keep internal/test records excluded from ALL public and client-facing dashboards. Maintain the quarantine rules permanently. Do not surface test data in any client portal.",
    impactIfIgnored: "Clients see inflated lead counts, fake deliveries, or test messages in their portals. Trust in the entire dashboard collapses when a client spots a test record in production views.",
  },
];

export default function OwnerDecisionNeeded({ data }) {
  const proofEmpty = data?.proof_logs_empty;
  const voiceReady = data?.voice_readiness || {};
  const pbs = data?.proof_by_service || {};
  const reviewProof = pbs["review_request"]?.passed > 0;
  const referralProof = pbs["lead_reactivation"]?.passed > 0;

  const getDecisionState = (id) => {
    switch (id) {
      case "voice_activation":
        if (voiceReady.inbound_voice_enabled) return { label: "Already active", tone: "amber" };
        if (voiceReady.has_elevenlabs_agent_ids && voiceReady.has_transcript_proof) return { label: "Prerequisites met — decision pending", tone: "amber" };
        return { label: "Prerequisites not yet met", tone: "slate" };
      case "review_referral_scope":
        if (reviewProof || referralProof) return { label: "Partial proof exists", tone: "amber" };
        return { label: "No proof — scope decision needed", tone: "red" };
      case "proof_before_claims":
        if (!proofEmpty && Object.values(pbs).some(p => p.passed > 0)) return { label: "Some proof exists", tone: "amber" };
        return { label: "No proof records — decision urgent", tone: "red" };
      case "test_data_exclusion":
        const excluded = data?.quarantine?.excluded_leads_count || 0;
        if (excluded > 0) return { label: `${excluded} records quarantined — policy decision needed`, tone: "amber" };
        return { label: "No test data detected", tone: "green" };
      default:
        return { label: "Review needed", tone: "slate" };
    }
  };

  const TONE_STYLES = {
    red: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)" },
    amber: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)" },
    green: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)" },
    slate: { color: "#475569", bg: "rgba(71,85,105,0.04)", border: "rgba(71,85,105,0.16)" },
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-800 mb-0.5">Owner Decision Needed — Admin Only</p>
          <p className="text-xs text-amber-700">
            Items where an owner decision is required before the system can advance. These are not auto-resolved — a human must decide.
          </p>
        </div>
      </div>

      {DECISIONS.map(d => {
        const state = getDecisionState(d.id);
        const style = TONE_STYLES[state.tone];
        const Icon = d.icon;
        return (
          <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                  <Icon className="w-4 h-4" style={{ color: style.color }} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{d.decision}</h4>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide inline-block mt-1" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                    {state.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Why It Matters</p>
                <p className="text-xs text-gray-600 leading-relaxed">{d.whyItMatters}</p>
              </div>
              <div className="rounded-lg bg-green-50 border border-green-100 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-green-500 mb-0.5">Default Safe Recommendation</p>
                <p className="text-xs text-green-700 font-medium leading-relaxed">{d.defaultRecommendation}</p>
              </div>
              <div className="rounded-lg bg-red-50 border border-red-100 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-0.5">Impact If Ignored</p>
                <p className="text-xs text-red-600 leading-relaxed">{d.impactIfIgnored}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}