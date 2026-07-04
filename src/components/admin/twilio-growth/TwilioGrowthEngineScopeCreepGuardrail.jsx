import { AlertTriangle, ShieldAlert } from "lucide-react";

export default function TwilioGrowthEngineScopeCreepGuardrail({ data }) {
  if (!data) return null;

  const caps = data.capabilities || [];
  const proofEmpty = data.proof_logs_empty;
  const quarantine = data.quarantine || {};

  const speedToLead = caps.find(c => c.key === "instant_lead_response");
  const missedCall = caps.find(c => c.key === "missed_call_text_back");
  const referral = caps.find(c => c.key === "lead_reactivation");
  const voiceBroadcast = caps.find(c => c.key === "voice_broadcasts");

  const warnings = [];

  // Rule 1: If speed-to-lead or missed-call is not trusted, warn before referral/voice broadcasts
  if (speedToLead && speedToLead.status !== "green" && (referral?.status !== "green" || voiceBroadcast?.status !== "green")) {
    warnings.push({
      rule: "Speed-to-Lead not trusted — do not prioritize Referral Engine or Voice Broadcasts",
      detail: `Website Speed-to-Lead is "${speedToLead.status}". Building referral or promotional calling capabilities before the core lead response pipeline is proven is scope creep. Focus on getting instant_lead_response to green first.`,
      action: "Pause work on referral/voice broadcast. Resolve speed-to-lead blockers: " + (speedToLead.blockers?.[0] || "see capability matrix."),
    });
  }
  if (missedCall && missedCall.status !== "green" && (referral?.status !== "green" || voiceBroadcast?.status !== "green")) {
    warnings.push({
      rule: "Missed Call Recovery not trusted — do not prioritize Referral Engine or Voice Broadcasts",
      detail: `Missed Call Recovery is "${missedCall.status}". The core call-recovery pipeline must be trusted before expanding to lower-priority voice features.`,
      action: "Pause work on referral/voice broadcast. Resolve missed-call blockers: " + (missedCall.blockers?.[0] || "see capability matrix."),
    });
  }

  // Rule 2: If proof records are missing, warn before expanding public claims
  if (proofEmpty) {
    warnings.push({
      rule: "AutomationProofLog is empty — do not expand public claims",
      detail: "No proof records exist. Any public claim about automation capabilities is unbacked by evidence. Expanding claims now creates legal and trust risk.",
      action: "Create and pass AutomationProofLog records for core capabilities before any new public claims.",
    });
  } else {
    const noProof = caps.filter(c => c.service_key && c.proof?.passed === 0);
    if (noProof.length > 0) {
      warnings.push({
        rule: `${noProof.length} capabilities have no passed proof — do not expand public claims for them`,
        detail: `Capabilities without passed proof: ${noProof.map(c => c.label).join(", ")}. Public claims require passed proof records.`,
        action: "Create and pass proof logs for these capabilities before claiming them publicly.",
      });
    }
  }

  // Rule 3: If internal/test data is not excluded, warn before trusting production metrics
  if (quarantine.excluded_leads_count === undefined) {
    warnings.push({
      rule: "Test data exclusion status unknown — do not trust production metrics",
      detail: "The audit could not determine whether internal/test records are excluded from production metrics. Production numbers may be inflated.",
      action: "Verify the exclusion rules in the audit function and re-run the audit.",
    });
  } else if (quarantine.excluded_leads_count > 0 && quarantine.production_leads_count === 0) {
    warnings.push({
      rule: "Only test data exists — production metrics are not meaningful",
      detail: `All ${quarantine.excluded_leads_count} records are test/internal. Zero production records. Do not trust any production KPIs.`,
      action: "Generate real production leads before evaluating production metrics.",
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "linear-gradient(135deg, rgba(217,119,6,0.04), rgba(217,119,6,0.01))", border: "1px solid rgba(217,119,6,0.15)" }}>
        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-700">Scope Creep Guardrail — Admin Only</p>
          <p className="text-xs text-gray-500 mt-1">Warns when lower-priority work is being attempted while critical/high revenue-impact capabilities are still partial or missing.</p>
        </div>
      </div>

      {warnings.length === 0 ? (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-green-600" />
          <p className="text-xs text-green-700 font-semibold">No scope creep warnings. Critical capabilities are trusted or lower-priority work is not in progress.</p>
        </div>
      ) : (
        warnings.map((w, i) => (
          <div key={i} className="bg-white rounded-xl border border-amber-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.2)" }}>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-gray-900 pt-1">{w.rule}</p>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-xs text-gray-600 leading-relaxed">{w.detail}</p>
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mb-0.5">Suggested Action</p>
                <p className="text-xs text-gray-600">{w.action}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}