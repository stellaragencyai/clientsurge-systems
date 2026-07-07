import { useState, useEffect, useCallback } from "react";
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
                    No automation executions found. Try adjusting filters.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const cfg = STATUS_CONFIG[log.execution_status] || STATUS_CONFIG.queued;
                  const Icon = cfg.icon;
                  const isExpanded = expandedRow === log.id;
                  const hasDeployment = !!log.client_deployment_id;
                  return (
                    <>
                      <tr
                        key={log.id || idx}
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
                          <td colSpan={8} className="px-6 py-4">
                            <DeploymentHealthDetail
                              health={deploymentHealth[log.client_deployment_id]}
                              deploymentId={log.client_deployment_id}
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