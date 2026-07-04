import {
  ShieldAlert, ShieldX, AlertTriangle, AlertOctagon,
  XCircle, FileWarning, Database, MicOff, FileX,
} from "lucide-react";

const SEVERITY_STYLES = {
  critical: { color: "#DC2626", bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.2)", icon: ShieldX, label: "Critical" },
  high: { color: "#EA580C", bg: "rgba(234,88,12,0.06)", border: "rgba(234,88,12,0.2)", icon: AlertOctagon, label: "High" },
  medium: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Medium" },
  low: { color: "#6B7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.2)", icon: ShieldAlert, label: "Low" },
};

/**
 * Builds a risk register from existing audit data.
 * Only includes risks that are supported by app data or readiness logic.
 * Does NOT trigger any external systems — read-only derived analysis.
 */
function buildRisks(data) {
  const risks = [];

  const capabilities = data?.capabilities || [];
  const deliveryStats = data?.delivery_stats || {};
  const eventStats = data?.event_stats || {};
  const missedCallStats = data?.missed_call_stats || {};
  const voiceReadiness = data?.voice_readiness || {};
  const proofByService = data?.proof_by_service || {};
  const quarantine = data?.quarantine || {};
  const qaChecklists = data?.qa_checklists || [];

  // ── Risk: Public claims ahead of proof ──
  const greenCapabilities = capabilities.filter(c => c.status === "green");
  const redCapabilities = capabilities.filter(c => c.status === "red");
  const proofLogsEmpty = capabilities.length > 0 && capabilities.every(c => !c.proof || c.proof.total === 0);

  if (greenCapabilities.length === 0 || proofLogsEmpty) {
    risks.push({
      name: "Public claims ahead of proof",
      severity: proofLogsEmpty ? "critical" : "high",
      evidence: proofLogsEmpty
        ? "AutomationProofLog is empty — no capability has passed proof evidence."
        : `${greenCapabilities.length} of ${capabilities.length} capabilities are proven; ${redCapabilities.length} have no evidence.`,
      mitigation: "Do not publish any public marketing claim about automation capabilities until at least one AutomationProofLog pass record exists per claimed service.",
      ownerDecision: "Product owner must approve any public claim only after reviewing the Proof Center tab.",
    });
  }

  // ── Risk: Provider errors not resolved ──
  const twilio400Errors = eventStats.twilio_400_errors || 0;
  const failedEvents = eventStats.failed_events || 0;
  const deliveryFailures = deliveryStats.failed || 0;
  const weakProofCount = deliveryStats.weak_proof_count || 0;
  const noProviderId = deliveryStats.without_provider_message_id || 0;

  if (twilio400Errors > 0 || failedEvents > 0 || deliveryFailures > 0 || noProviderId > 0) {
    const parts = [];
    if (twilio400Errors > 0) parts.push(`${twilio400Errors} Twilio 400 errors`);
    if (failedEvents > 0) parts.push(`${failedEvents} failed communication events`);
    if (deliveryFailures > 0) parts.push(`${deliveryFailures} failed SMS deliveries`);
    if (noProviderId > 0) parts.push(`${noProviderId} records without provider_message_id`);
    risks.push({
      name: "Provider errors not resolved",
      severity: twilio400Errors > 0 || deliveryFailures > 10 ? "high" : "medium",
      evidence: parts.join("; ") + " in CommunicationLog / CommunicationEvent.",
      mitigation: "Inspect request payloads, sender permissions, and Twilio credentials. Resolve 400 errors and verify provider_message_id is populated on all outbound records.",
      ownerDecision: "Engineering owner to confirm all 400 errors are resolved before go-live.",
    });
  }

  // ── Risk: Incomplete checklist creating false trust ──
  const allFalseChecklists = qaChecklists.filter(cl => cl.all_false);
  const incompleteChecklists = qaChecklists.filter(cl => !cl.went_live_at && !cl.all_false && !cl.client_approved);

  if (allFalseChecklists.length > 0 || incompleteChecklists.length > 0) {
    risks.push({
      name: "Incomplete checklist creating false trust",
      severity: allFalseChecklists.length > 0 ? "high" : "medium",
      evidence: allFalseChecklists.length > 0
        ? `${allFalseChecklists.length} checklist(s) have all flags false — no setup completed.`
        : `${incompleteChecklists.length} checklist(s) are in progress without client sign-off.`,
      mitigation: "Require all checklist flags to be true and client_approved before marking any service as active. Do not allow went_live_at to be set without sign-off.",
      ownerDecision: "Onboarding lead must verify checklist completion and client sign-off for each service.",
    });
  }

  // ── Risk: Internal/test data counted as production ──
  const excludedLeads = quarantine.excluded_leads_count || 0;
  if (excludedLeads > 0) {
    risks.push({
      name: "Internal/test data counted as production",
      severity: "medium",
      evidence: `${excludedLeads} test/smoke/internal lead(s) excluded from production metrics but still in the database.`,
      mitigation: "Verify the exclusion rules are enforced in all dashboard queries. Ensure no public metric references unfiltered counts.",
      ownerDecision: "Data owner to confirm exclusion rules are active in production reporting queries.",
    });
  }

  // ── Risk: Voice workflow activated without prerequisites ──
  if (voiceReadiness.inbound_voice_enabled && (!voiceReadiness.has_elevenlabs_agent_ids || !voiceReadiness.has_transcript_proof)) {
    risks.push({
      name: "Voice workflow activated without prerequisites",
      severity: "high",
      evidence: `inbound_voice_enabled is true but${!voiceReadiness.has_elevenlabs_agent_ids ? " ElevenLabs agent IDs are missing" : ""}${!voiceReadiness.has_transcript_proof ? " no transcript proof exists" : ""}.`,
      mitigation: "Disable inbound_voice_enabled until ElevenLabs agent IDs are configured and a real call test generates a transcript.",
      ownerDecision: "Voice lead to disable inbound voice and re-enable only after prerequisites are met.",
    });
  } else if (!voiceReadiness.inbound_voice_enabled && voiceReadiness.blockers?.length > 0) {
    risks.push({
      name: "Voice workflow activated without prerequisites",
      severity: "low",
      evidence: `Inbound voice is not enabled but has blockers: ${voiceReadiness.blockers.join(", ")}.`,
      mitigation: "Resolve all voice blockers before enabling inbound_voice_enabled.",
      ownerDecision: "Voice lead to address blockers before requesting enablement.",
    });
  }

  // ── Risk: Review/referral launched before core response system is stable ──
  const reviewCap = capabilities.find(c => c.key === "review_request");
  const referralCap = capabilities.find(c => c.key === "lead_reactivation");
  const instantLeadCap = capabilities.find(c => c.key === "instant_lead_response");
  const coreStable = instantLeadCap?.status === "green";
  const reviewOrReferralActive = reviewCap?.status === "green" || referralCap?.status === "green";

  if (!coreStable && reviewOrReferralActive) {
    risks.push({
      name: "Review/referral launched before core response system is stable",
      severity: "high",
      evidence: `Instant Lead Response is ${instantLeadCap?.status || "unknown"} but Review Request is ${reviewCap?.status || "unknown"} and Referral Engine is ${referralCap?.status || "unknown"}.`,
      mitigation: "Pause review_request and lead_reactivation flows until instant_lead_response has a passing AutomationProofLog and delivered SMS evidence.",
      ownerDecision: "Product owner to confirm core response system stability before promoting review/referral.",
    });
  }

  // ── Risk: Missing proof records preventing reliable customer reporting ──
  const servicesWithoutProof = Object.entries(proofByService).filter(([, p]) => !p || p.passed === 0);
  if (servicesWithoutProof.length > 0) {
    risks.push({
      name: "Missing proof records preventing reliable customer reporting",
      severity: servicesWithoutProof.length >= 4 ? "high" : "medium",
      evidence: `${servicesWithoutProof.length} of ${Object.keys(proofByService).length} services have zero passed proof records: ${servicesWithoutProof.map(([k]) => k).join(", ")}.`,
      mitigation: "Create and pass AutomationProofLog records for each service before including it in any customer-facing report.",
      ownerDecision: "Reporting owner to exclude unproven services from customer reports until proof exists.",
    });
  }

  // Sort by severity
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  risks.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));
  return risks;
}

export default function TwilioGrowthEngineRiskRegister({ data }) {
  const risks = buildRisks(data);

  const counts = {
    critical: risks.filter(r => r.severity === "critical").length,
    high: risks.filter(r => r.severity === "high").length,
    medium: risks.filter(r => r.severity === "medium").length,
    low: risks.filter(r => r.severity === "low").length,
  };

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Risk Register — Admin Only</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          Risks are derived from live audit data and readiness logic. Only risks with supporting evidence are shown.
          This panel does not trigger external systems — it is a read-only diagnostic for admin decision-making.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(SEVERITY_STYLES).map(([key, style]) => {
            const Icon = style.icon;
            return (
              <div key={key} className="rounded-lg border p-3" style={{ borderColor: style.border, background: style.bg }}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5" style={{ color: style.color }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: style.color }}>{style.label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: style.color }}>{counts[key]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk cards */}
      {risks.length === 0 ? (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-green-600" />
          <p className="text-xs text-green-700 font-semibold">No risks detected from current audit data. Continue monitoring.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {risks.map((risk, i) => {
            const style = SEVERITY_STYLES[risk.severity] || SEVERITY_STYLES.low;
            const Icon = style.icon;
            return (
              <div key={i} className="bg-white rounded-xl border p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)", borderColor: style.border }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                    <Icon className="w-4 h-4" style={{ color: style.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-gray-900">{risk.name}</h4>
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide flex-shrink-0" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                        {style.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Evidence / Reason</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{risk.evidence}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Mitigation</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{risk.mitigation}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Owner Decision Required</p>
                  <p className="text-xs text-gray-700 font-medium">{risk.ownerDecision}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}