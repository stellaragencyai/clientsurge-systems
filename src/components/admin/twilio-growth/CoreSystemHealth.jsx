import { Activity } from "lucide-react";

const HEALTH_STYLES = {
  healthy: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", label: "Healthy" },
  degraded: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", label: "Degraded" },
  blocked: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", label: "Blocked" },
};

function healthFor(data) {
  const caps = data?.capabilities || [];
  const greenCount = caps.filter(c => c.status === "green").length;
  const totalCount = caps.length || 1;

  // Configuration: based on AdminSettings webhook presence + checklist flags
  const ds = data?.delivery_stats || {};
  const configHealthy = (data?.missed_call_stats?.webhook_status === "configured" && !data?.missed_call_stats?.has_404 && !data?.missed_call_stats?.has_405);
  const configBlocked = data?.missed_call_stats?.has_404 || data?.missed_call_stats?.has_405;
  const config = configBlocked ? "blocked" : configHealthy ? "healthy" : "degraded";

  // Logging: CommunicationLog / CommunicationEvent records exist
  const totalLogs = (ds.total || 0);
  const logging = totalLogs > 0 ? "healthy" : "blocked";

  // Evidence quality: proof logs + provider message IDs
  const weakProof = ds.weak_proof_count || 0;
  const noProviderId = ds.without_provider_message_id || 0;
  const proofEmpty = data?.proof_logs_empty;
  const evidence = proofEmpty ? "blocked" : (weakProof > 0 || noProviderId > 0) ? "degraded" : "healthy";

  // Readiness checklist: AutomationChecklist records with meaningful flags
  const checklists = data?.qa_checklists || [];
  const checklistHealthy = checklists.length > 0 && checklists.some(cl => !cl.all_false && cl.went_live_at);
  const checklistBlocked = checklists.length === 0 || checklists.every(cl => cl.all_false);
  const readinessChecklist = checklistBlocked ? "blocked" : checklistHealthy ? "healthy" : "degraded";

  // Launch scope: core items green ratio
  const scopeRatio = greenCount / totalCount;
  const launchScope = scopeRatio >= 0.5 ? "healthy" : scopeRatio > 0 ? "degraded" : "blocked";

  return [
    { label: "Configuration", status: config },
    { label: "Logging", status: logging },
    { label: "Evidence Quality", status: evidence },
    { label: "Readiness Checklist", status: readinessChecklist },
    { label: "Launch Scope", status: launchScope },
  ];
}

export default function CoreSystemHealth({ data }) {
  const items = healthFor(data);
  const blockedCount = items.filter(i => i.status === "blocked").length;
  const degradedCount = items.filter(i => i.status === "degraded").length;
  const overall = blockedCount > 0 ? "blocked" : degradedCount > 0 ? "degraded" : "healthy";
  const overallStyle = HEALTH_STYLES[overall];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900">Core System Health</h3>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ color: overallStyle.color, background: overallStyle.bg, border: `1px solid ${overallStyle.border}` }}
        >
          {overallStyle.label}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {items.map(item => {
          const s = HEALTH_STYLES[item.status];
          return (
            <div
              key={item.label}
              className="rounded-lg p-2.5 text-center"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <p className="text-[10px] font-semibold text-gray-500 mb-1">{item.label}</p>
              <p className="text-xs font-bold" style={{ color: s.color }}>{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}