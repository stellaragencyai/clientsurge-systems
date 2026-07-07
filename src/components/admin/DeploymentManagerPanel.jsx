/**
 * DeploymentManagerPanel — Phase 3.4
 *
 * Admin command center for managing ClientDeployment records.
 * Shows all deployments with full visibility and admin actions.
 *
 * Admin actions:
 *   - Approve activation
 *   - Retry failed module
 *   - Pause deployment
 *   - Resume deployment
 *   - View proof logs
 *   - View event history
 *
 * All actions create audit logs.
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  RefreshCw, Loader2, ShieldCheck, AlertCircle, Pause, Play, RotateCw,
  Eye, ChevronDown, ChevronUp, Search,
} from "lucide-react";
import { getDeploymentDisplayStatus, getModuleDisplayStatus, DEPLOYMENT_STATUS } from "@/lib/deploymentStatusModel";
import { buildAutomationSummary } from "@/lib/deploymentCardBuilder";

export default function DeploymentManagerPanel() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [proofLogs, setProofLogs] = useState({});

  useEffect(() => {
    loadDeployments();
  }, []);

  async function loadDeployments() {
    setLoading(true);
    try {
      const result = await base44.asServiceRole.entities.ClientDeployment.list("-created_date", 100);
      setDeployments(result || []);

      // Load proof logs for each deployment in parallel
      const proofLogMap = {};
      await Promise.all(
        (result || []).map(async (dep) => {
          try {
            const logs = await base44.asServiceRole.entities.AutomationProofLog.filter(
              { client_deployment_id: dep.id },
              "-tested_at",
              20
            );
            proofLogMap[dep.id] = logs || [];
          } catch {
            proofLogMap[dep.id] = [];
          }
        })
      );
      setProofLogs(proofLogMap);
    } catch (err) {
      console.error("[DeploymentManager] Error loading deployments:", err);
      setDeployments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(deploymentId, action) {
    setActionLoading(`${deploymentId}_${action}`);
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        action: `deployment_${action}`,
        entity_type: "ClientDeployment",
        entity_id: deploymentId,
        description: `Admin triggered ${action} on deployment ${deploymentId}`,
        metadata_json: JSON.stringify({ deployment_id: deploymentId, action, timestamp: new Date().toISOString() }),
      });

      if (action === "pause") {
        await base44.asServiceRole.entities.ClientDeployment.update(deploymentId, { deployment_status: DEPLOYMENT_STATUS.PAUSED });
      } else if (action === "resume") {
        await base44.asServiceRole.entities.ClientDeployment.update(deploymentId, { deployment_status: DEPLOYMENT_STATUS.ONBOARDING });
      } else if (action === "approve") {
        await base44.asServiceRole.entities.ClientDeployment.update(deploymentId, { deployment_status: DEPLOYMENT_STATUS.LIVE, went_live_at: new Date().toISOString() });
      }

      await loadDeployments();
    } catch (err) {
      console.error(`[DeploymentManager] Action ${action} failed:`, err);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = deployments.filter((dep) => {
    const matchesSearch = !search ||
      (dep.client_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (dep.industry_slug || "").toLowerCase().includes(search.toLowerCase()) ||
      (dep.package_tier_key || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || dep.deployment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#0088CC] animate-spin" />
        <span className="ml-3 text-sm text-gray-400">Loading deployments…</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Deployment Manager</h2>
          <p className="text-sm text-muted-foreground">ClientDeployment is the source of truth for all client system status.</p>
        </div>
        <button
          onClick={loadDeployments}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted/50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Deployments" value={deployments.length} color="#0088CC" />
        <SummaryCard label="Live" value={deployments.filter(d => d.deployment_status === "live").length} color="#10B981" />
        <SummaryCard label="Onboarding" value={deployments.filter(d => ["onboarding", "configuring", "testing", "ready"].includes(d.deployment_status)).length} color="#D4AF37" />
        <SummaryCard label="Blocked" value={deployments.filter(d => ["paused", "error", "cancelled"].includes(d.deployment_status)).length} color="#EF4444" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client, industry, or package…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border text-sm bg-background"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border text-sm bg-background"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="onboarding">Onboarding</option>
          <option value="configuring">Configuring</option>
          <option value="testing">Testing</option>
          <option value="ready">Ready</option>
          <option value="live">Live</option>
          <option value="paused">Paused</option>
          <option value="error">Error</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Deployment table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Client</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Industry</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Package</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Modules</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Health</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Proof</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                  No deployments found.
                </td>
              </tr>
            ) : (
              filtered.map((dep) => {
                const depProofLogs = proofLogs[dep.id] || [];
                const summary = buildAutomationSummary(dep, depProofLogs);
                const display = getDeploymentDisplayStatus(dep.deployment_status);
                const isExpanded = expandedId === dep.id;
                const errors = dep.errors || [];

                return (
                  <>
                    <tr key={dep.id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : dep.id)}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{dep.client_id || "—"}</p>
                          <p className="text-[10px] text-gray-400">{dep.id?.slice(-12)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{dep.industry_slug || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 text-[#0088CC] capitalize">
                          {dep.package_tier_key || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: display.bg_color, color: display.color }}>
                          {display.short_label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {summary.live_modules}/{summary.activated_modules} live
                      </td>
                      <td className="px-4 py-3">
                        <HealthBadge status={dep.health_status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {depProofLogs.length} logs
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs text-[#0088CC] font-semibold hover:underline">
                          {isExpanded ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />}
                          Details
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${dep.id}_detail`} className="bg-gray-50/30">
                        <td colSpan={8} className="px-4 py-4">
                          <ExpandedDetail
                            deployment={dep}
                            proofLogs={depProofLogs}
                            summary={summary}
                            errors={errors}
                            actionLoading={actionLoading}
                            onAction={handleAction}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-center">
        All admin actions are logged to the AuditLog entity for traceability.
      </p>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "12" }}>
          <ShieldCheck className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
    </div>
  );
}

function HealthBadge({ status }) {
  const colors = { healthy: "#10B981", warning: "#F59E0B", critical: "#EF4444", unknown: "#6B7280" };
  const color = colors[status] || colors.unknown;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full" style={{ background: color + "12", color }}>
      {status || "unknown"}
    </span>
  );
}

function ExpandedDetail({ deployment, proofLogs, summary, errors, actionLoading, onAction }) {
  const moduleStatuses = deployment.module_installation_status || {};
  const activatedModules = deployment.activated_modules || [];

  return (
    <div className="space-y-4">
      {/* Module breakdown */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Module Installation Status</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(moduleStatuses).map(([key, status]) => {
            const display = getModuleDisplayStatus(status);
            const isActivated = activatedModules.includes(key);
            return (
              <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-gray-700">{key.replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-gray-400">{isActivated ? "In package" : "Not in package"}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: display.color + "12", color: display.color }}>
                  {display.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Active Errors ({errors.length})</p>
          <div className="space-y-1.5">
            {errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-700">{err.error_code || "Error"} — {err.module_key || "system"}</p>
                  <p className="text-[10px] text-red-600">{err.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proof logs */}
      {proofLogs.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Recent Proof Logs ({proofLogs.length})</p>
          <div className="space-y-1">
            {proofLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-gray-700">{log.service_key?.replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-gray-400">{log.tested_at ? new Date(log.tested_at).toLocaleString() : "—"}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                  background: log.status === "pass" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                  color: log.status === "pass" ? "#10B981" : "#EF4444",
                }}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin actions */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Admin Actions</p>
        <div className="flex flex-wrap gap-2">
          {deployment.deployment_status === "ready" && (
            <ActionButton
              label="Approve Activation"
              icon={ShieldCheck}
              color="#10B981"
              loading={actionLoading === `${deployment.id}_approve`}
              onClick={() => onAction(deployment.id, "approve")}
            />
          )}
          {deployment.deployment_status !== "paused" && deployment.deployment_status !== "cancelled" && (
            <ActionButton
              label="Pause"
              icon={Pause}
              color="#F59E0B"
              loading={actionLoading === `${deployment.id}_pause`}
              onClick={() => onAction(deployment.id, "pause")}
            />
          )}
          {deployment.deployment_status === "paused" && (
            <ActionButton
              label="Resume"
              icon={Play}
              color="#0088CC"
              loading={actionLoading === `${deployment.id}_resume`}
              onClick={() => onAction(deployment.id, "resume")}
            />
          )}
          {errors.length > 0 && (
            <ActionButton
              label="Retry Failed Module"
              icon={RotateCw}
              color="#0088CC"
              loading={actionLoading === `${deployment.id}_retry`}
              onClick={() => onAction(deployment.id, "retry")}
            />
          )}
          <ActionButton
            label="View Proof Logs"
            icon={Eye}
            color="#6B7280"
            onClick={() => window.open(`/admin?tab=audit-log`, "_self")}
          />
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, icon: Icon, color, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50"
      style={{ background: color + "12", color, border: `1px solid ${color}30` }}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}