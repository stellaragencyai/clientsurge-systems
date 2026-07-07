import { useState, useEffect, useCallback, Fragment } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Wrench,
  AlertTriangle,
  Copy,
  Download,
  ExternalLink,
  Zap,
} from "lucide-react";

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Failed" },
  blocked: { icon: ShieldAlert, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", label: "Blocked" },
  running: { icon: Loader2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Running" },
  queued: { icon: Clock, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", label: "Queued" },
};

const MODULE_LABELS = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  lead_nurture: "Lead Nurture",
  ai_booking_agent: "AI Booking Agent",
  daily_digest: "Daily Digest",
  review_reactivation: "Review Reactivation",
};

export default function AutomationActivityPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ total: 0, completed: 0, failed: 0, blocked: 0, running: 0 });
  const [expandedRow, setExpandedRow] = useState(null);
  const [deploymentHealth, setDeploymentHealth] = useState({});

  // Filters
  const [filterModule, setFilterModule] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClient, setFilterClient] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        limit: 100,
        ...(filterModule !== "all" && { module_key: filterModule }),
        ...(filterStatus !== "all" && { execution_status: filterStatus }),
        ...(filterClient && { client_id: filterClient }),
        ...(filterIndustry !== "all" && { industry_slug: filterIndustry }),
        ...(filterDateFrom && { date_from: new Date(filterDateFrom).toISOString() }),
        ...(filterDateTo && { date_to: new Date(filterDateTo + "T23:59:59").toISOString() }),
      };
      const res = await base44.functions.invoke("getAutomationActivity", payload);
      const data = res.data || res;
      setLogs(data.logs || []);
      setStats(data.stats || { total: 0, completed: 0, failed: 0, blocked: 0, running: 0 });
    } catch (err) {
      setError(err?.message || "Failed to load automation activity");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filterModule, filterStatus, filterClient, filterIndustry, filterDateFrom, filterDateTo]);

  // URL query param persistence — read on mount, write on filter change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status")) setFilterStatus(params.get("status"));
    if (params.get("module")) setFilterModule(params.get("module"));
    if (params.get("client_id")) setFilterClient(params.get("client_id"));
    if (params.get("industry")) setFilterIndustry(params.get("industry"));
    if (params.get("deployment_id")) setFilterClient(params.get("deployment_id"));
    if (params.get("from")) setFilterDateFrom(params.get("from"));
    if (params.get("to")) setFilterDateTo(params.get("to"));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterModule !== "all") params.set("module", filterModule);
    if (filterClient) params.set("client_id", filterClient);
    if (filterIndustry !== "all") params.set("industry", filterIndustry);
    if (filterDateFrom) params.set("from", filterDateFrom);
    if (filterDateTo) params.set("to", filterDateTo);
    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [filterStatus, filterModule, filterClient, filterIndustry, filterDateFrom, filterDateTo]);

  // Quick filter handlers
  const quickFilterFailed = () => setFilterStatus("failed");
  const quickFilterBlocked = () => setFilterStatus("blocked");
  const quickFilterLast24h = () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    setFilterDateFrom(yesterday);
    setFilterDateTo("");
  };
  const quickFilterClear = () => {
    setFilterStatus("all");
    setFilterModule("all");
    setFilterClient("");
    setFilterIndustry("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const copyLogToClipboard = (log) => {
    const logData = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(logData).catch(() => {});
  };

  const exportLog = (log) => {
    const logData = JSON.stringify(log, null, 2);
    const blob = new Blob([logData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `automation-log-${log.id || "record"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchDeploymentHealth = async (deploymentId) => {
    if (deploymentHealth[deploymentId]) {
      setExpandedRow(expandedRow === deploymentId ? null : deploymentId);
      return;
    }
    try {
      const res = await base44.functions.invoke("calculateDeploymentHealth", { deployment_id: deploymentId });
      const data = res.data || res;
      setDeploymentHealth((prev) => ({ ...prev, [deploymentId]: data }));
    } catch (err) {
      setDeploymentHealth((prev) => ({ ...prev, [deploymentId]: { error: err.message } }));
    }
    setExpandedRow(expandedRow === deploymentId ? null : deploymentId);
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard label="Total" value={stats.total} icon={Activity} color="text-gray-700" bg="bg-gray-50" />
        <SummaryCard label="Completed" value={stats.completed} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <SummaryCard label="Failed" value={stats.failed} icon={XCircle} color="text-red-600" bg="bg-red-50" />
        <SummaryCard label="Blocked" value={stats.blocked} icon={ShieldAlert} color="text-orange-600" bg="bg-orange-50" />
        <SummaryCard label="Running" value={stats.running} icon={Clock} color="text-blue-600" bg="bg-blue-50" />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-1">Quick Filters:</span>
        <Button variant={filterStatus === "failed" ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={quickFilterFailed}>
          <XCircle className="w-3.5 h-3.5 mr-1" /> Failed
        </Button>
        <Button variant={filterStatus === "blocked" ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={quickFilterBlocked}>
          <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Blocked
        </Button>
        <Button variant={filterDateFrom ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={quickFilterLast24h}>
          <Clock className="w-3.5 h-3.5 mr-1" /> Last 24 Hours
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-500" onClick={quickFilterClear}>
          Clear All
        </Button>
      </div>

      {/* Needs Attention + Recommended Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NeedsAttentionPanel logs={logs} />
        <RecommendedActionsPanel logs={logs} />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter className="w-4 h-4" /> Filters
          </div>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {Object.entries(MODULE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterIndustry} onValueChange={setFilterIndustry}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="hvac">HVAC</SelectItem>
              <SelectItem value="med_spa">Med Spa</SelectItem>
              <SelectItem value="dental">Dental</SelectItem>
              <SelectItem value="roofing">Roofing</SelectItem>
              <SelectItem value="chiropractic">Chiropractic</SelectItem>
              <SelectItem value="contractors">Contractors</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Client ID..."
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="w-[160px] h-9"
          />
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="h-9 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="h-9 rounded-md border border-gray-200 px-2 text-sm text-gray-700"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-9">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Error Banner */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </Card>
      )}

      {/* Activity Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Client</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Deployment</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Industry</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Package</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Module</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Provider Result</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Errors</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading automation activity...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No automation executions found matching the current filters.
                    {stats.total === 0
                      ? " When automations run, their execution logs will appear here."
                      : " Try clearing filters or widening the date range."}
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                   const cfg = STATUS_CONFIG[log.execution_status] || STATUS_CONFIG.queued;
                   const Icon = cfg.icon;
                   const isExpanded = expandedRow === log.id;
                   const hasDeployment = !!log.client_deployment_id;
                   return (
                     <Fragment key={log.id || idx}>
                       <tr
                         className={`border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer ${isExpanded ? "bg-blue-50/30" : ""}`}
                        onClick={() => hasDeployment ? fetchDeploymentHealth(log.client_deployment_id) : setExpandedRow(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-3 text-gray-700 font-medium truncate max-w-[120px]">
                          {log.client_id ? log.client_id.substring(0, 12) + "..." : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {log.deployment ? (
                            <div className="flex flex-col gap-0.5">
                              <Badge variant="outline" className="text-xs font-normal w-fit">{log.deployment.deployment_status}</Badge>
                              {log.deployment.health_status && (
                                <span className={`text-[10px] font-semibold ${
                                  log.deployment.health_status === "healthy" ? "text-green-600" :
                                  log.deployment.health_status === "warning" ? "text-yellow-600" : "text-red-600"
                                }`}>
                                  {log.deployment.health_status}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">No deployment</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <Badge variant="outline" className="text-xs font-normal">{log.industry_slug || "—"}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs font-semibold">
                          {log.package_tier_key || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {MODULE_LABELS[log.module_key] || log.module_key}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                            <Icon className={`w-3.5 h-3.5 ${log.execution_status === "running" ? "animate-spin" : ""}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {log.created_date ? new Date(log.created_date).toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs font-mono truncate max-w-[120px]">
                          {log.external_provider_reference || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {log.error_message ? (
                            <span className="text-red-600 truncate block max-w-[200px]" title={log.error_message}>
                              {log.error_message}
                            </span>
                          ) : (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> OK
                            </span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                         <tr className="bg-gray-50/40">
                           <td colSpan={9} className="px-6 py-4">
                             <DeploymentHealthDetail
                               health={deploymentHealth[log.client_deployment_id]}
                               deploymentId={log.client_deployment_id}
                             />
                             {/* Drill-down links + copy/export */}
                             <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-200">
                               {log.client_deployment_id && (
                                 <a
                                   href={`/admin/deployment-control?deployment_id=${log.client_deployment_id}`}
                                   className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                                   onClick={(e) => e.stopPropagation()}
                                 >
                                   <ExternalLink className="w-3.5 h-3.5" /> View Deployment
                                 </a>
                               )}
                               {log.lead_id && (
                                 <a
                                   href={`/admin/leads/${log.lead_id}`}
                                   className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                                   onClick={(e) => e.stopPropagation()}
                                 >
                                   <ExternalLink className="w-3.5 h-3.5" /> View Lead
                                 </a>
                               )}
                               <button
                                 className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-700"
                                 onClick={(e) => { e.stopPropagation(); copyLogToClipboard(log); }}
                               >
                                 <Copy className="w-3.5 h-3.5" /> Copy JSON
                               </button>
                               <button
                                 className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-700"
                                 onClick={(e) => { e.stopPropagation(); exportLog(log); }}
                               >
                                 <Download className="w-3.5 h-3.5" /> Export
                               </button>
                             </div>
                           </td>
                         </tr>
                       )}
                      </Fragment>
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

function NeedsAttentionPanel({ logs }) {
  const failedLogs = logs.filter((l) => l.execution_status === "failed" || l.execution_status === "blocked");
  const failedByModule = {};
  failedLogs.forEach((l) => {
    if (!failedByModule[l.module_key]) {
      failedByModule[l.module_key] = { count: 0, latest: null, error: null };
    }
    failedByModule[l.module_key].count++;
    if (!failedByModule[l.module_key].latest || l.created_date > failedByModule[l.module_key].latest) {
      failedByModule[l.module_key].latest = l.created_date;
      failedByModule[l.module_key].error = l.error_message;
    }
  });
  const failedEntries = Object.entries(failedByModule).sort((a, b) => b[1].count - a[1].count);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <h3 className="text-sm font-bold text-gray-800">Needs Attention</h3>
      </div>
      {failedEntries.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-green-600 py-2">
          <CheckCircle2 className="w-4 h-4" /> No failed modules in current results.
        </div>
      ) : (
        <div className="space-y-2">
          {failedEntries.map(([moduleKey, data]) => (
            <div key={moduleKey} className="flex items-start justify-between rounded-lg border border-red-100 bg-red-50/50 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-800">{MODULE_LABELS[moduleKey] || moduleKey}</p>
                {data.error && (
                  <p className="text-xs text-red-600 truncate mt-0.5" title={data.error}>{data.error}</p>
                )}
                {data.latest && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Last: {new Date(data.latest).toLocaleString()}
                  </p>
                )}
              </div>
              <Badge variant="destructive" className="text-xs ml-2 flex-shrink-0">{data.count}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RecommendedActionsPanel({ logs }) {
  const actions = [];
  const failedLogs = logs.filter((l) => l.execution_status === "failed" || l.execution_status === "blocked");

  const moduleFailCounts = {};
  failedLogs.forEach((l) => {
    moduleFailCounts[l.module_key] = (moduleFailCounts[l.module_key] || 0) + 1;
  });

  Object.entries(moduleFailCounts).forEach(([moduleKey, count]) => {
    if (moduleKey === "instant_lead_response") {
      actions.push({ module: moduleKey, action: "Verify Twilio SMS credentials and messaging service configuration", severity: count > 3 ? "critical" : "warning" });
    }
    if (moduleKey === "missed_call_text_back") {
      actions.push({ module: moduleKey, action: "Check Twilio voice webhook URL and missed-call webhook endpoint", severity: count > 3 ? "critical" : "warning" });
    }
    if (moduleKey === "lead_nurture") {
      actions.push({ module: moduleKey, action: "Review nurture sequence templates and send-hour configuration", severity: "warning" });
    }
    if (moduleKey === "ai_booking_agent") {
      actions.push({ module: moduleKey, action: "Verify booking link is set and AI intent classification thresholds", severity: count > 2 ? "critical" : "warning" });
    }
    if (moduleKey === "daily_digest") {
      actions.push({ module: moduleKey, action: "Check Resend email provider configuration and digest scheduling", severity: "warning" });
    }
    if (moduleKey === "review_reactivation") {
      actions.push({ module: moduleKey, action: "Verify review request templates and opt-out compliance", severity: "warning" });
    }
  });

  const blockedCount = logs.filter((l) => l.execution_status === "blocked").length;
  if (blockedCount > 0) {
    actions.push({ module: "permission", action: `${blockedCount} execution(s) blocked — review module permissions and package tier assignments`, severity: "warning" });
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-bold text-gray-800">Recommended Actions</h3>
      </div>
      {actions.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-green-600 py-2">
          <CheckCircle2 className="w-4 h-4" /> No actions needed — all systems operational.
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((a, i) => (
            <div key={i} className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${
              a.severity === "critical" ? "border-red-200 bg-red-50/50" : "border-yellow-200 bg-yellow-50/50"
            }`}>
              <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${a.severity === "critical" ? "text-red-500" : "text-yellow-500"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-700">{MODULE_LABELS[a.module] || a.module}</p>
                <p className="text-xs text-gray-600 mt-0.5">{a.action}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DeploymentHealthDetail({ health, deploymentId }) {
  if (!health) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading deployment health...
      </div>
    );
  }
  if (health.error) {
    return <div className="text-sm text-red-600">Error: {health.error}</div>;
  }

  const healthColor = health.health_status === "healthy" ? "text-green-600" : health.health_status === "warning" ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">Deployment Health</p>
          <p className={`text-lg font-bold ${healthColor} capitalize`}>{health.health_status || "unknown"}</p>
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase">Summary</p>
          <p className="text-sm text-gray-700">{health.health_summary || "No summary available"}</p>
        </div>
      </div>

      {health.module_health && health.module_health.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Module Health</p>
          <div className="flex flex-wrap gap-2">
            {health.module_health.map((mh, i) => (
              <div key={i} className="rounded-lg border border-gray-200 px-3 py-2 bg-white">
                <p className="text-xs font-medium text-gray-700">{MODULE_LABELS[mh.module_key] || mh.module_key}</p>
                <p className={`text-xs font-semibold ${mh.execution_status === "healthy" ? "text-green-600" : mh.execution_status === "warning" ? "text-yellow-600" : "text-red-600"}`}>
                  {mh.execution_status}
                </p>
                {mh.issues && mh.issues.length > 0 && (
                  <p className="text-[10px] text-gray-400 mt-1">{mh.issues.join("; ")}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {health.blockers && health.blockers.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-600 mb-1">Active Blockers</p>
          <ul className="text-xs text-gray-700 list-disc list-inside">
            {health.blockers.map((b, i) => (
              <li key={i}>{b.message} {b.suggested_action && <span className="text-gray-400">→ {b.suggested_action}</span>}</li>
            ))}
          </ul>
        </div>
      )}

      {health.warnings && health.warnings.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-yellow-600 mb-1">Warnings</p>
          <ul className="text-xs text-gray-700 list-disc list-inside">
            {health.warnings.map((w, i) => (
              <li key={i}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {health.blockers && health.blockers.length === 0 && health.warnings && health.warnings.length === 0 && (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> All modules healthy — no action needed.
        </p>
      )}
    </div>
  );
}