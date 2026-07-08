import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, RefreshCw, ShieldCheck, AlertTriangle, XCircle,
  Package, Server, Activity, ChevronRight,
} from "lucide-react";

const MODULE_LABELS = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  lead_nurture: "Lead Nurture",
  ai_booking_agent: "AI Booking Agent",
  daily_digest: "Daily Digest",
  review_reactivation: "Review Reactivation",
};

const STATUS_COLORS = {
  live: "bg-green-100 text-green-700 border-green-200",
  onboarding: "bg-blue-100 text-blue-700 border-blue-200",
  configuring: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ready: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-gray-100 text-gray-600 border-gray-200",
  paused: "bg-gray-100 text-gray-600 border-gray-200",
  error: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

const INSTALL_STATUS_LABELS = {
  not_started: "Not Started",
  needs_setup: "Needs Setup",
  connected: "Connected",
  test_mode: "Test Mode",
  tested: "Tested",
  failed: "Failed",
  ready: "Ready",
  installing: "Installing",
  installed: "Installed",
  verified: "Verified",
};

const INSTALL_STATUS_COLORS = {
  not_started: "text-gray-500",
  needs_setup: "text-yellow-600",
  connected: "text-blue-600",
  test_mode: "text-blue-600",
  tested: "text-blue-600",
  failed: "text-red-600",
  ready: "text-green-600",
  installing: "text-yellow-600",
  installed: "text-green-600",
  verified: "text-green-600",
};

const HEALTH_COLORS = {
  healthy: "text-green-600",
  warning: "text-yellow-600",
  critical: "text-red-600",
  unknown: "text-gray-400",
};

function getFunctionData(response) {
  return response?.data || response || {};
}

function getErrorMessage(error, fallback) {
  return error?.data?.error || error?.message || fallback;
}

function getTrackedModuleKeys(dep) {
  const activated = Array.isArray(dep.activated_modules) ? dep.activated_modules : [];
  const statusMap = dep.module_installation_status || {};

  // Only show modules that are actually activated for the deployment/package.
  // This avoids showing Pro-only modules as "not_started" on Starter deployments.
  return activated.filter((key) => Object.prototype.hasOwnProperty.call(statusMap, key) || MODULE_LABELS[key]);
}

export default function DeploymentControlCenterPanel() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [executionStats, setExecutionStats] = useState({});
  const [healthCache, setHealthCache] = useState({});

  const fetchDeployments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await base44.functions.invoke("getDeploymentControlCenter", {
        limit: 200,
        log_limit: 500,
      });
      const data = getFunctionData(response);
      if (data.error) throw new Error(data.error);

      setDeployments(data.deployments || []);
      setExecutionStats(data.executionStats || {});
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load deployments"));
      setDeployments([]);
      setExecutionStats({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const fetchHealth = async (deploymentId) => {
    if (healthCache[deploymentId]) {
      setExpandedRow(expandedRow === deploymentId ? null : deploymentId);
      return;
    }
    try {
      const res = await base44.functions.invoke("calculateDeploymentHealth", { deployment_id: deploymentId });
      const data = getFunctionData(res);
      setHealthCache((prev) => ({ ...prev, [deploymentId]: data }));
    } catch (err) {
      setHealthCache((prev) => ({ ...prev, [deploymentId]: { error: err.message } }));
    }
    setExpandedRow(expandedRow === deploymentId ? null : deploymentId);
  };

  const stats = {
    total: deployments.length,
    live: deployments.filter((d) => d.deployment_status === "live").length,
    onboarding: deployments.filter((d) => ["onboarding", "configuring", "ready"].includes(d.deployment_status)).length,
    issues: deployments.filter((d) => d.deployment_status === "error" || d.health_status === "critical").length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Deployments" value={stats.total} icon={Server} color="text-gray-700" bg="bg-gray-50" />
        <SummaryCard label="Live" value={stats.live} icon={ShieldCheck} color="text-green-600" bg="bg-green-50" />
        <SummaryCard label="Onboarding" value={stats.onboarding} icon={Package} color="text-blue-600" bg="bg-blue-50" />
        <SummaryCard label="Issues" value={stats.issues} icon={AlertTriangle} color="text-red-600" bg="bg-red-50" />
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">All Client Deployments</h2>
        <Button variant="outline" size="sm" onClick={fetchDeployments} disabled={loading} className="h-9">
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Client</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Industry</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Package</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Modules</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Health</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Failed/Blocked</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading deployments...
                  </td>
                </tr>
              ) : deployments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <Server className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No deployments found. Deployments will appear here when clients purchase.
                  </td>
                </tr>
              ) : (
                deployments.map((dep) => {
                  const depStats = executionStats[dep.id] || { failed: 0, blocked: 0, lastExecution: null };
                  const isActive = expandedRow === dep.id;
                  const moduleStatus = dep.module_installation_status || {};
                  const moduleKeys = getTrackedModuleKeys(dep);
                  return (
                    <DeploymentRow
                      key={dep.id}
                      dep={dep}
                      depStats={depStats}
                      isActive={isActive}
                      onToggle={() => fetchHealth(dep.id)}
                      health={healthCache[dep.id]}
                      moduleKeys={moduleKeys}
                      moduleStatus={moduleStatus}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function DeploymentRow({ dep, depStats, isActive, onToggle, health, moduleKeys, moduleStatus }) {
  const statusClass = STATUS_COLORS[dep.deployment_status] || STATUS_COLORS.pending;
  const healthClass = HEALTH_COLORS[dep.health_status] || HEALTH_COLORS.unknown;
  const hasIssues = depStats.failed > 0 || depStats.blocked > 0;
  const readyCount = moduleKeys.filter((k) => ["verified", "ready", "installed", "tested", "connected"].includes(moduleStatus[k])).length;

  return (
    <>
      <tr
        className={`border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer ${isActive ? "bg-blue-50/30" : ""}`}
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-gray-700 font-medium">
          <div className="truncate max-w-[160px]">{dep.client_id ? dep.client_id.substring(0, 16) + "..." : "—"}</div>
        </td>
        <td className="px-4 py-3">
          <Badge variant="outline" className="text-xs font-normal">{dep.industry_slug || "—"}</Badge>
        </td>
        <td className="px-4 py-3 text-gray-600 text-xs font-semibold uppercase">
          {dep.package_tier_key || "—"}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass}`}>
            {dep.deployment_status}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-600 text-xs">
          {moduleKeys.length > 0 ? (
            <span>{readyCount}/{moduleKeys.length} active</span>
          ) : (
            <span className="text-gray-400">None activated</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs font-semibold capitalize ${healthClass}`}>
            {dep.health_status || "unknown"}
          </span>
        </td>
        <td className="px-4 py-3">
          {hasIssues ? (
            <div className="flex items-center gap-2">
              {depStats.failed > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                  <XCircle className="w-3.5 h-3.5" /> {depStats.failed}
                </span>
              )}
              {depStats.blocked > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600">
                  <ShieldCheck className="w-3.5 h-3.5" /> {depStats.blocked}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
          {depStats.lastExecution ? new Date(depStats.lastExecution).toLocaleString() : "—"}
        </td>
      </tr>
      {isActive && (
        <tr className="bg-gray-50/40">
          <td colSpan={8} className="px-6 py-4">
            <DeploymentDetail dep={dep} health={health} moduleKeys={moduleKeys} moduleStatus={moduleStatus} />
          </td>
        </tr>
      )}
    </>
  );
}

function DeploymentDetail({ dep, health, moduleKeys, moduleStatus }) {
  const missingSetup = (dep.errors || []).filter((e) => !e.resolved_at);
  const installationProgress = dep.installation_progress || {};
  const healthClass = HEALTH_COLORS[dep.health_status] || HEALTH_COLORS.unknown;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Deployment ID</p>
          <p className="text-xs font-mono text-gray-700 break-all">{dep.id}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Health Summary</p>
          <p className={`text-sm font-semibold ${healthClass}`}>
            {health?.health_summary || dep.health_summary || "Needs data"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Last Health Check</p>
          <p className="text-xs text-gray-600">
            {dep.health_checked_at ? new Date(dep.health_checked_at).toLocaleString() : "Never"}
          </p>
        </div>
      </div>

      {moduleKeys.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Module Installation Status</p>
          <div className="flex flex-wrap gap-2">
            {moduleKeys.map((key) => {
              const status = moduleStatus[key] || "not_started";
              const label = INSTALL_STATUS_LABELS[status] || status;
              const color = INSTALL_STATUS_COLORS[status] || "text-gray-500";
              return (
                <div key={key} className="rounded-lg border border-gray-200 px-3 py-2 bg-white">
                  <p className="text-xs font-medium text-gray-700">{MODULE_LABELS[key] || key}</p>
                  <p className={`text-xs font-semibold ${color}`}>{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">Activated Modules</p>
        <div className="flex flex-wrap gap-1.5">
          {(dep.activated_modules || []).length > 0 ? (
            dep.activated_modules.map((m) => (
              <Badge key={m} variant="outline" className="text-xs">{MODULE_LABELS[m] || m}</Badge>
            ))
          ) : (
            <span className="text-xs text-gray-400">No modules activated</span>
          )}
        </div>
      </div>

      {installationProgress.completion_percentage !== undefined && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-600">Installation Progress</p>
            <span className="text-xs font-bold text-gray-700">{installationProgress.completion_percentage}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${installationProgress.completion_percentage}%` }}
            />
          </div>
          {installationProgress.current_step && (
            <p className="text-xs text-gray-500 mt-1">Current: {installationProgress.current_step}</p>
          )}
        </div>
      )}

      {missingSetup.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-600 mb-2">Missing Setup Items / Unresolved Errors</p>
          <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
            {missingSetup.map((e, i) => (
              <li key={i}>
                {e.message || e.error_code || "Unknown error"}
                {e.suggested_action && <span className="text-gray-400"> → {e.suggested_action}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {health && health.error ? (
        <p className="text-xs text-red-600">Health check error: {health.error}</p>
      ) : health ? (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">Calculated Health</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Status:</span>{" "}
              <span className={`font-semibold ${HEALTH_COLORS[health.health_status] || HEALTH_COLORS.unknown}`}>
                {health.health_status || "unknown"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Score:</span>{" "}
              <span className="font-semibold text-gray-700">{health.health_score ?? "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500">Blockers:</span>{" "}
              <span className="font-semibold text-red-600">{health.blockers?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Warnings:</span>{" "}
              <span className="font-semibold text-yellow-600">{health.warnings?.length || 0}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400">Loading health data...</p>
      )}

      <div className="flex items-center gap-2 pt-2">
        <a
          href={`/admin/automation-activity?deployment_id=${dep.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
        >
          <Activity className="w-3.5 h-3.5" /> View Automation Activity
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, bg }) {
  return (
    <Card className={`p-3 ${bg} border-0`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
        <Icon className={`w-5 h-5 ${color} opacity-50`} />
      </div>
    </Card>
  );
}
