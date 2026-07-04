import { AlertTriangle, ShieldAlert, Ban } from "lucide-react";

/**
 * Scope Creep Guardrail — warns admins when attempting to work on lower-priority capabilities
 * while critical/high revenue-impact capabilities are still partial or missing.
 */
export default function ScopeCreepGuardrail({ data }) {
  if (!data) return null;

  const caps = data.capabilities || [];
  const delivery = data.delivery_stats || {};
  const missed = data.missed_call_stats || {};
  const quarantine = data.quarantine || {};
  const proofEmpty = data.proof_logs_empty;

  // Critical capabilities
  const speedToLead = caps.find(c => c.key === "instant_lead_response");
  const missedCall = caps.find(c => c.key === "missed_call_text_back");

  const speedToLeadTrusted = speedToLead?.status === "green";
  const missedCallTrusted = missedCall?.status === "green";

  // Lower-priority capabilities
  const referralEngine = caps.find(c => c.key === "lead_reactivation");
  const voiceBroadcasts = caps.find(c => c.key === "voice_broadcasts");

  const warnings = [];

  // Rule 1: Speed-to-Lead or Missed Call Recovery not trusted → warn before Referral/Voice Broadcasts
  if ((!speedToLeadTrusted || !missedCallTrusted) && (referralEngine || voiceBroadcasts)) {
    const untrusted = [];
    if (!speedToLeadTrusted) untrusted.push("Website Speed-to-Lead");
    if (!missedCallTrusted) untrusted.push("Missed Call Recovery");
    warnings.push({
      id: "critical_before_lower",
      severity: "high",
      title: "Critical capabilities not trusted — do not focus on lower-priority work",
      detail: `${untrusted.join(" and ")} ${untrusted.length === 1 ? "is" : "are"} not yet trusted (green). Do not prioritize Referral Engine or Voice Broadcasts until these critical revenue-impact capabilities are proven with real evidence.`,
      affectedItems: ["Referral Engine", "Voice Broadcasts / Promotional Calling"],
      rule: "If Website Speed-to-Lead or Missed Call Recovery is not trusted, show warning before focusing on Referral Engine or Voice Broadcasts.",
    });
  }

  // Rule 2: Proof records missing → warn before expanding public claims
  if (proofEmpty) {
    warnings.push({
      id: "proof_missing_public_claims",
      severity: "critical",
      title: "AutomationProofLog is empty — do not expand public claims",
      detail: "No proof records exist. Expanding public claims about automation capabilities without proof creates legal and reputational risk. Every public claim must map to a green capability with a passed proof log.",
      affectedItems: ["Advanced Public Proof Claims", "Any public marketing copy referencing automation features"],
      rule: "If proof records are missing, show warning before expanding public claims.",
    });
  }

  // Rule 3: Internal/test data not excluded → warn before trusting production metrics
  const testExclusions = quarantine.excluded_leads_count || 0;
  const productionLeads = quarantine.production_leads_count || 0;
  const weakProofCount = delivery.weak_proof_count || 0;

  if (weakProofCount > 0) {
    warnings.push({
      id: "test_data_not_excluded",
      severity: "high",
      title: "Weak proof records detected — production metrics may be unreliable",
      detail: `${weakProofCount} records have weak proof (provider_message_id=null with status=sent/queued). These may be internal/test records polluting production metrics. Do not trust production KPIs until weak proof records are resolved or excluded.`,
      affectedItems: ["Production KPI trust", "Dashboard metrics", "Customer-facing reporting"],
      rule: "If internal/test data is not excluded, show warning before trusting production metrics.",
    });
  }

  // Also check if quarantine rules are defined
  if (!quarantine.rules || quarantine.rules.length === 0) {
    warnings.push({
      id: "no_exclusion_rules",
      severity: "medium",
      title: "No test data exclusion rules defined",
      detail: "Test data exclusion rules are not configured. Internal/smoke/test records may be polluting production metrics. Define exclusion rules before trusting any production KPI.",
      affectedItems: ["Production KPI trust", "Dashboard metrics"],
      rule: "If internal/test data is not excluded, show warning before trusting production metrics.",
    });
  }

  // Additional: check for any non-green critical capability
  const criticalCaps = caps.filter(c => ["instant_lead_response", "missed_call_text_back", "ai_voice_receptionist"].includes(c.key) && c.status !== "green");
  if (criticalCaps.length > 0) {
    warnings.push({
      id: "critical_caps_not_green",
      severity: "high",
      title: "Critical revenue-impact capabilities are not trusted",
      detail: `${criticalCaps.length} critical capabilities are not green: ${criticalCaps.map(c => c.label).join(", ")}. Focus on these before any lower-priority work.`,
      affectedItems: criticalCaps.map(c => c.label),
      rule: "Critical capabilities (Speed-to-Lead, Missed Call Recovery, AI Voice) must be trusted before lower-priority capabilities.",
    });
  }

  const hasWarnings = warnings.length > 0;
  const criticalCount = warnings.filter(w => w.severity === "critical").length;
  const highCount = warnings.filter(w => w.severity === "high").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl p-5 flex items-start gap-3" style={{
        background: hasWarnings
          ? "linear-gradient(135deg, rgba(220,38,38,0.06), rgba(220,38,38,0.02))"
          : "linear-gradient(135deg, rgba(5,150,105,0.06), rgba(5,150,105,0.02))",
        border: `1px solid ${hasWarnings ? "rgba(220,38,38,0.2)" : "rgba(5,150,105,0.2)"}`,
      }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{
          background: hasWarnings ? "rgba(220,38,38,0.1)" : "rgba(5,150,105,0.1)",
          border: `1px solid ${hasWarnings ? "rgba(220,38,38,0.25)" : "rgba(5,150,105,0.25)"}`,
        }}>
          {hasWarnings ? <ShieldAlert className="w-4 h-4 text-red-600" /> : <Ban className="w-4 h-4 text-green-600" />}
        </div>
        <div>
          <p className="text-sm font-bold mb-1" style={{ color: hasWarnings ? "#DC2626" : "#059669" }}>
            {hasWarnings
              ? `${warnings.length} scope creep warning${warnings.length === 1 ? "" : "s"} active`
              : "No scope creep warnings — safe to work on any priority level"}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            {hasWarnings
              ? `${criticalCount} critical · ${highCount} high priority. Address critical capabilities before lower-priority work.`
              : "All critical capabilities are trusted and proof records exist. Lower-priority work is safe to prioritize."}
          </p>
        </div>
      </div>

      {/* Warnings */}
      {hasWarnings ? (
        <div className="space-y-3">
          {warnings.map(w => (
            <div key={w.id} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                  background: w.severity === "critical" ? "rgba(220,38,38,0.08)" : w.severity === "high" ? "rgba(217,119,6,0.06)" : "rgba(107,114,128,0.06)",
                  border: `1px solid ${w.severity === "critical" ? "rgba(220,38,38,0.2)" : w.severity === "high" ? "rgba(217,119,6,0.2)" : "rgba(107,114,128,0.2)"}`,
                }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: w.severity === "critical" ? "#DC2626" : w.severity === "high" ? "#D97706" : "#6B7280" }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900">{w.title}</h4>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{
                      color: w.severity === "critical" ? "#DC2626" : w.severity === "high" ? "#D97706" : "#6B7280",
                      background: w.severity === "critical" ? "rgba(220,38,38,0.06)" : w.severity === "high" ? "rgba(217,119,6,0.06)" : "rgba(107,114,128,0.06)",
                      border: `1px solid ${w.severity === "critical" ? "rgba(220,38,38,0.15)" : w.severity === "high" ? "rgba(217,119,6,0.15)" : "rgba(107,114,128,0.15)"}`,
                    }}>
                      {w.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">{w.detail}</p>
                </div>
              </div>
              <div className="ml-11 space-y-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Affected Items</p>
                  <div className="flex flex-wrap gap-1.5">
                    {w.affectedItems.map((item, i) => (
                      <span key={i} className="rounded-md px-2 py-0.5 text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-100">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Guardrail Rule</p>
                  <p className="text-xs text-gray-500 leading-relaxed italic">{w.rule}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 flex items-center gap-2">
          <Ban className="w-4 h-4 text-green-600" />
          <p className="text-xs text-green-700 font-semibold">No scope creep warnings. All guardrails passed.</p>
        </div>
      )}
    </div>
  );
}