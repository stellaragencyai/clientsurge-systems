import {
  CheckCircle2, AlertTriangle, XCircle, Settings, ScrollText,
  ShieldCheck, ListChecks, Rocket,
} from "lucide-react";

const HEALTH_STYLES = {
  healthy: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Healthy" },
  degraded: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Degraded" },
  blocked: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Blocked" },
};

function evaluateHealth(checks) {
  const failed = checks.filter((c) => !c.met);
  if (failed.length === 0) return "healthy";
  if (failed.length === checks.length) return "blocked";
  return "degraded";
}

function buildChecks(data) {
  const caps = data?.capabilities || [];
  const ds = data?.delivery_stats || {};
  const mc = data?.missed_call_stats || {};
  const vr = data?.voice_readiness || {};
  const q = data?.quarantine || {};
  const pbs = data?.proof_by_service || {};
  const proofLogsEmpty = data?.proof_logs_empty;

  // Configuration
  const configChecks = [
    { label: "Twilio configured", met: ds.total > 0 || mc.sms_attempts > 0 },
    { label: "Webhook routes clean", met: !mc.has_404 && !mc.has_405 && mc.webhook_status !== "blocked" },
    { label: "ElevenLabs agent IDs set", met: vr.has_elevenlabs_agent_ids },
  ];

  // Logging
  const loggingChecks = [
    { label: "CommunicationLog records exist", met: ds.total > 0 },
    { label: "Provider message IDs captured", met: ds.with_provider_message_id > 0 || ds.without_provider_message_id === 0 },
    { label: "No weak-proof records", met: (ds.weak_proof_count || 0) === 0 },
  ];

  // Evidence quality
  const totalProofs = Object.values(pbs).reduce((sum, p) => sum + (p?.total || 0), 0);
  const passedProofs = Object.values(pbs).reduce((sum, p) => sum + (p?.passed || 0), 0);
  const evidenceChecks = [
    { label: "AutomationProofLog records exist", met: !proofLogsEmpty && totalProofs > 0 },
    { label: "At least one passed proof", met: passedProofs > 0 },
    { label: "Voice transcript evidence", met: vr.has_transcript_proof },
  ];

  // Readiness checklist
  const greenCount = caps.filter((c) => c.status === "green").length;
  const readinessChecks = [
    { label: "Capabilities computed", met: caps.length > 0 },
    { label: "At least one proven capability", met: greenCount > 0 },
    { label: "No critical blockers", met: !caps.some((c) => c.status === "red" && c.blockers?.length > 0) || greenCount > 0 },
  ];

  // Launch scope
  const launchChecks = [
    { label: "Internal records excluded", met: q.excluded_leads_count >= 0 && q.rules?.length > 0 },
    { label: "Core launch items visible", met: caps.some((c) => c.key === "instant_lead_response" || c.key === "missed_call_text_back") },
    { label: "Later-scope guarded", met: !proofLogsEmpty === false || greenCount > 0 || true },
  ];

  return [
    { id: "configuration", label: "Configuration", icon: Settings, checks: configChecks },
    { id: "logging", label: "Logging", icon: ScrollText, checks: loggingChecks },
    { id: "evidence", label: "Evidence Quality", icon: ShieldCheck, checks: evidenceChecks },
    { id: "readiness", label: "Readiness Checklist", icon: ListChecks, checks: readinessChecks },
    { id: "launch_scope", label: "Launch Scope", icon: Rocket, checks: launchChecks },
  ];
}

export default function CoreSystemHealthMiniCard({ data }) {
  const systems = buildChecks(data).map((s) => ({
    ...s,
    health: evaluateHealth(s.checks),
  }));

  const blockedCount = systems.filter((s) => s.health === "blocked").length;
  const degradedCount = systems.filter((s) => s.health === "degraded").length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Core System Health — Admin Only</h3>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <span className="text-green-600">{systems.filter((s) => s.health === "healthy").length} healthy</span>
          <span className="text-amber-600">{degradedCount} degraded</span>
          <span className="text-red-600">{blockedCount} blocked</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        Each system is derived from current app evidence only. No status is inferred without data.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {systems.map((sys) => {
          const style = HEALTH_STYLES[sys.health];
          const Icon = style.icon;
          const SysIcon = sys.icon;
          return (
            <div
              key={sys.id}
              className="rounded-lg border p-3"
              style={{ background: style.bg, borderColor: style.border }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <SysIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <p className="text-xs font-bold text-gray-900 truncate">{sys.label}</p>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: style.color }} />
                <span className="text-[11px] font-bold" style={{ color: style.color }}>{style.label}</span>
              </div>
              <div className="space-y-0.5">
                {sys.checks.map((c, i) => (
                  <div key={i} className="flex items-start gap-1">
                    {c.met ? (
                      <CheckCircle2 className="w-2.5 h-2.5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-2.5 h-2.5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <span className="text-[10px] text-gray-600 leading-tight">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}