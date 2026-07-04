import { Activity } from "lucide-react";

const HEALTH_STYLES = {
  healthy: { color: "#059669", bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.2)", label: "Healthy" },
  degraded: { color: "#D97706", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.2)", label: "Degraded" },
  blocked: { color: "#DC2626", bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.18)", label: "Blocked" },
};

function deriveHealth(data) {
  const caps = data?.capabilities || [];
  const deliveryStats = data?.delivery_stats || {};
  const missedCallStats = data?.missed_call_stats || {};
  const voiceReadiness = data?.voice_readiness || {};
  const quarantine = data?.quarantine || {};
  const proofByService = data?.proof_by_service || {};

  // Configuration
  const twilioConfigured = voiceReadiness.has_elevenlabs_agent_ids || caps.some((c) => c.evidence_sources?.length > 0);
  const configHealth = twilioConfigured ? "healthy" : "blocked";

  // Logging
  const hasLogs = (deliveryStats.total || 0) > 0 || caps.some((c) => c.evidence_sources?.some((s) => s.includes("CommunicationLog") || s.includes("CommunicationEvent")));
  const loggingHealth = hasLogs ? "healthy" : "degraded";

  // Evidence quality
  const totalProofs = Object.values(proofByService).reduce((acc, p) => acc + (p?.total || 0), 0);
  const passedProofs = Object.values(proofByService).reduce((acc, p) => acc + (p?.passed || 0), 0);
  const weakProof = deliveryStats.weak_proof_count || 0;
  let evidenceHealth = "blocked";
  if (passedProofs > 0 && weakProof === 0) evidenceHealth = "healthy";
  else if (totalProofs > 0 || weakProof > 0) evidenceHealth = "degraded";

  // Readiness checklist
  const greenCount = caps.filter((c) => c.status === "green").length;
  const redCount = caps.filter((c) => c.status === "red").length;
  let checklistHealth = "blocked";
  if (greenCount > 0 && redCount === 0) checklistHealth = "healthy";
  else if (greenCount > 0) checklistHealth = "degraded";

  // Launch scope
  const coreBlocked = caps.filter((c) => c.status !== "green" && c.key !== "lead_reactivation").length;
  const referralBlocked = caps.find((c) => c.key === "lead_reactivation")?.status !== "green";
  let scopeHealth = "blocked";
  if (coreBlocked === 0 && referralBlocked) scopeHealth = "degraded";
  else if (coreBlocked === 0) scopeHealth = "healthy";

  // Internal exclusion visibility
  const exclusionVisible = quarantine && quarantine.excluded_leads_count !== undefined;

  return [
    { key: "configuration", label: "Configuration", health: configHealth, note: "Twilio + ElevenLabs agent IDs present?" },
    { key: "logging", label: "Logging", health: loggingHealth, note: "CommunicationLog / CommunicationEvent records exist?" },
    { key: "evidence", label: "Evidence Quality", health: evidenceHealth, note: `${passedProofs} passed / ${totalProofs} total proofs · ${weakProof} weak` },
    { key: "checklist", label: "Readiness Checklist", health: checklistHealth, note: `${greenCount} proven · ${redCount} not done` },
    { key: "scope", label: "Launch Scope", health: scopeHealth, note: exclusionVisible ? "Internal exclusion visible" : "Exclusion not visible" },
  ];
}

export default function CoreSystemHealthCard({ data }) {
  const rows = deriveHealth(data);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900">Core System Health — Admin Only</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">Each pillar is healthy, degraded, or blocked based on current app evidence.</p>
      <div className="grid gap-2">
        {rows.map((r) => {
          const s = HEALTH_STYLES[r.health];
          return (
            <div key={r.key} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{r.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{r.note}</p>
              </div>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold flex-shrink-0"
                style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}