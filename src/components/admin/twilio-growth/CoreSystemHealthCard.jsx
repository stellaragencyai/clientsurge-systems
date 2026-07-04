import { Activity, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const HEALTH_STYLES = {
  healthy: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Healthy" },
  degraded: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Degraded" },
  blocked: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Blocked" },
};

function evalConfiguration(data) {
  const vr = data?.voice_readiness || {};
  const caps = data?.capabilities || [];
  const hasConfig = caps.some((c) => c.evidence_sources?.length > 0);
  if (!vr.has_elevenlabs_agent_ids && !hasConfig) return "blocked";
  if (!vr.has_elevenlabs_agent_ids) return "degraded";
  return "healthy";
}

function evalLogging(data) {
  const ds = data?.delivery_stats || {};
  const es = data?.event_stats || {};
  if (ds.total === 0 && es.failed_events === 0) return "blocked";
  if (ds.without_provider_message_id > 0 || es.twilio_400_errors > 0) return "degraded";
  return "healthy";
}

function evalEvidenceQuality(data) {
  if (data?.proof_logs_empty) return "blocked";
  const ds = data?.delivery_stats || {};
  if (ds.weak_proof_count > 0) return "degraded";
  return "healthy";
}

function evalReadinessChecklist(data) {
  const caps = data?.capabilities || [];
  const green = caps.filter((c) => c.status === "green").length;
  const red = caps.filter((c) => c.status === "red").length;
  if (green === 0 && red > 0) return "blocked";
  if (red > 0 || green < caps.length) return "degraded";
  return "healthy";
}

function evalLaunchScope(data) {
  const notReady = (data?.capabilities || []).filter((c) => c.status !== "green");
  if (notReady.length === 0) return "healthy";
  if (notReady.length > (data?.capabilities || []).length / 2) return "blocked";
  return "degraded";
}

const HEALTH_ITEMS = [
  { id: "configuration", label: "Configuration", evaluator: evalConfiguration },
  { id: "logging", label: "Logging", evaluator: evalLogging },
  { id: "evidence_quality", label: "Evidence Quality", evaluator: evalEvidenceQuality },
  { id: "readiness_checklist", label: "Readiness Checklist", evaluator: evalReadinessChecklist },
  { id: "launch_scope", label: "Launch Scope", evaluator: evalLaunchScope },
];

export default function CoreSystemHealthCard({ data }) {
  const items = HEALTH_ITEMS.map((item) => ({
    ...item,
    health: item.evaluator(data),
  }));
  const healthyCount = items.filter((i) => i.health === "healthy").length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-500" />
          <h3 className="text-sm font-bold text-gray-900">Core System Health — Admin Only</h3>
        </div>
        <span className="text-xs font-semibold text-gray-400">{healthyCount}/{items.length} healthy</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const style = HEALTH_STYLES[item.health];
          const Icon = style.icon;
          return (
            <div
              key={item.id}
              className="rounded-lg p-3 flex items-center gap-2.5"
              style={{ background: style.bg, border: `1px solid ${style.border}` }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: style.color }} />
              <div>
                <p className="text-xs font-semibold text-gray-900">{item.label}</p>
                <p className="text-[11px] font-medium" style={{ color: style.color }}>{style.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}