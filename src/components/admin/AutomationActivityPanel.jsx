import { useCallback, useEffect, useState } from "react";
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
  ShieldAlert,
  Wrench,
  AlertTriangle,
  Copy,
  Download,
  Database,
} from "lucide-react";

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Failed" },
  blocked: { icon: ShieldAlert, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", label: "Blocked" },
  running: { icon: Loader2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Running" },
  queued: { icon: Clock, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", label: "Queued" },
  unknown: { icon: AlertCircle, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", label: "Unknown" },
};

const MODULE_LABELS = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  lead_nurture: "Lead Nurture",
  nurture_sequence_14d: "14-Day Nurture",
  ai_booking_agent: "AI Booking Agent",
  daily_digest: "Daily Digest",
  review_reactivation: "Review Reactivation",
  review_request: "Review Request",
  lead_reactivation: "Lead Reactivation",
};

const EMPTY_STATS = { total: 0, completed: 0, failed: 0, blocked: 0, running: 0, unknown: 0 };

export default function AutomationActivityPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(EMPTY_STATS);
  const [coverage, setCoverage] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

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
        ...(filterDateTo && { date_to: new Date(`${filterDateTo}T23:59:59`).toISOString() }),
      };
      const res = await base44.functions.invoke("getAutomationActivity", payload);
      const data = res.data || res;
      setLogs(data.logs || []);
      setStats(data.stats || EMPTY_STATS);
      setCoverage(data.data_coverage || null);
      setWarnings(data.coverage_warnings || []);
    } catch (err) {
      setError(err?.message || "Failed to load automation activity");
      setLogs([]);
      setStats(EMPTY_STATS);
      setCoverage(null);
      setWarnings([]);
    } finally {
      setLoading(false);
    }
  }, [filterModule, filterStatus, filterClient, filterIndustry, filterDateFrom, filterDateTo]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status")) setFilterStatus(params.get("status"));
    if (params.get("module")) setFilterModule(params.get("module"));
    if (params.get("client_id")) setFilterClient(params.get("client_id"));
    if (params.get("deployment_id")) setFilterClient(params.get("deployment_id"));
    if (params.get("industry")) setFilterIndustry(params.get("industry"));
    if (params.get("from")) setFilterDateFrom(params.get("from"));
    if (params.get("to")) setFilterDateTo(params.get("to"));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterModule !== "all") params.set("module", filterModule);
    if (filterClient) params.set("client_id", filterClient);
    if (filterIndustry !== "all") params.set("industry", filterIndustry);
    if (filterDateFrom) params.set("from", filterDateFrom);
    if (filterDateTo) params.set("to", filterDateTo);
    window.history.replaceState(null, "", params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname);
  }, [filterStatus, filterModule, filterClient, filterIndustry, filterDateFrom, filterDateTo]);

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

  const copyLogToClipboard = (log) => navigator.clipboard?.writeText(JSON.stringify(log, null, 2)).catch(() => {});

  const exportLog = (log) => {
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `automation-log-${log.id || "record"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const hasCoverageProblem = warnings.length > 0 || !coverage?.logs_queried || (!loading && logs.length === 0);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-bold">Automation activity is sampled operational evidence.</p>
            <p className="mt-1">No failed rows in this view does not prove all automations are healthy. Use coverage, filters, and provider logs before treating this as proof.</p>
            {coverage?.request_id && <p className="mt-1 text-xs">Request ID: {coverage.request_id}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <SummaryCard label="Total" value={stats.total} icon={Activity} color="text-gray-700" bg="bg-gray-50" />
        <SummaryCard label="Completed" value={stats.completed} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <SummaryCard label="Failed" value={stats.failed} icon={XCircle} color="text-red-600" bg="bg-red-50" />
        <SummaryCard label="Blocked" value={stats.blocked} icon={ShieldAlert} color="text-orange-600" bg="bg-orange-50" />
        <SummaryCard label="Running" value={stats.running} icon={Clock} color="text-blue-600" bg="bg-blue-50" />
        <SummaryCard label="Unknown" value={stats.unknown || 0} icon={AlertCircle} color="text-slate-600" bg="bg-slate-50" />
      </div>

      <CoverageCard coverage={coverage} warnings={warnings} hasCoverageProblem={hasCoverageProblem} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-1">Quick Filters:</span>
        <Button variant={filterStatus === "failed" ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setFilterStatus("failed")}>
          <XCircle className="w-3.5 h-3.5 mr-1" /> Failed
        </Button>
        <Button variant={filterStatus === "blocked" ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setFilterStatus("blocked")}>
          <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Blocked
        </Button>
        <Button variant={filterDateFrom ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={quickFilterLast24h}>
          <Clock className="w-3.5 h-3.5 mr-1" /> Last 24 Hours
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-500" onClick={quickFilterClear}>Clear All</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NeedsAttentionPanel logs={logs} coverageProblem={hasCoverageProblem} />
        <RecommendedActionsPanel logs={logs} coverageProblem={hasCoverageProblem} />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Filter className="w-4 h-4" /> Filters</div>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="All Modules" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {Object.entries(MODULE_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="All Statuses" /></SelectTrigger>
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
            <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="All Industries" /></SelectTrigger>
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
          <Input placeholder="Client or deployment ID..." value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="w-[190px] h-9" />
          <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-9 rounded-md border border-gray-200 px-2 text-sm text-gray-700" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-9 rounded-md border border-gray-200 px-2 text-sm text-gray-700" />
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-9">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700"><AlertCircle className="w-5 h-5" /><span className="text-sm font-medium">{error}</span></div>
        </Card>
      )}

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
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Errors / Notes</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading automation activity...</td></tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">No automation executions found matching the current filters.</p>
                    <p className="mt-1 text-xs">This is unknown coverage, not proof that all systems are operational.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => <LogRow key={log.id || index} log={log} expanded={expandedRow === (log.id || index)} onToggle={() => setExpandedRow(expandedRow === (log.id || index) ? null : (log.id || index))} onCopy={copyLogToClipboard} onExport={exportLog} />)
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
      <div className="flex items-center justify-between"><div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p><p className={`text-xl font-bold ${color}`}>{value}</p></div><Icon className={`w-5 h-5 ${color} opacity-50`} /></div>
    </Card>
  );
}

function CoverageCard({ coverage, warnings, hasCoverageProblem }) {
  return (
    <Card className={`p-4 ${hasCoverageProblem ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><Database className="w-4 h-4" /><h3 className="text-sm font-bold text-gray-800">Data Coverage</h3></div>
          <p className="mt-1 text-xs text-gray-600">{coverage?.proof_label || "AutomationExecutionLog sample only — not live provider proof"}</p>
          <p className="mt-1 text-xs text-gray-500">Last log: {coverage?.last_log_at ? new Date(coverage.last_log_at).toLocaleString() : "No sampled log"}</p>
        </div>
        <Badge variant="outline" className="bg-white">{hasCoverageProblem ? "Needs Evidence" : "Sample Loaded"}</Badge>
      </div>
      {warnings.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-800">{warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul>}
    </Card>
  );
}

function NeedsAttentionPanel({ logs, coverageProblem }) {
  const failedLogs = logs.filter((log) => log.execution_status === "failed" || log.execution_status === "blocked");
  if (coverageProblem && failedLogs.length === 0) {
    return <Card className="p-4 border-amber-200 bg-amber-50"><div className="flex items-center gap-2 text-sm text-amber-800"><AlertTriangle className="w-4 h-4" /> Coverage is incomplete or empty. Verify logs before declaring operations healthy.</div></Card>;
  }
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-red-500" /><h3 className="text-sm font-bold text-gray-800">Needs Attention</h3></div>
      {failedLogs.length === 0 ? <div className="flex items-center gap-2 text-sm text-green-600 py-2"><CheckCircle2 className="w-4 h-4" /> No failed modules in the sampled results.</div> : <FailureList logs={failedLogs} />}
    </Card>
  );
}

function FailureList({ logs }) {
  const grouped = logs.reduce((acc, log) => {
    const key = log.module_key || "unknown";
    acc[key] = acc[key] || { count: 0, error: null, latest: null };
    acc[key].count += 1;
    if (!acc[key].latest || log.created_date > acc[key].latest) {
      acc[key].latest = log.created_date;
      acc[key].error = log.error_message;
    }
    return acc;
  }, {});
  return <div className="space-y-2">{Object.entries(grouped).map(([moduleKey, data]) => <div key={moduleKey} className="flex items-start justify-between rounded-lg border border-red-100 bg-red-50/50 px-3 py-2"><div><p className="text-xs font-bold text-gray-800">{MODULE_LABELS[moduleKey] || moduleKey}</p>{data.error && <p className="mt-0.5 text-xs text-red-600">{data.error}</p>}</div><Badge variant="destructive">{data.count}</Badge></div>)}</div>;
}

function RecommendedActionsPanel({ logs, coverageProblem }) {
  const failedLogs = logs.filter((log) => log.execution_status === "failed" || log.execution_status === "blocked");
  const actions = [];
  if (coverageProblem) actions.push({ module: "coverage", action: "Verify AutomationExecutionLog coverage and provider logs before making an operational claim.", severity: "warning" });
  if (failedLogs.some((log) => log.module_key === "instant_lead_response")) actions.push({ module: "instant_lead_response", action: "Verify Twilio SMS credentials, messaging service, and lead response logs.", severity: "critical" });
  if (failedLogs.some((log) => log.module_key === "missed_call_text_back")) actions.push({ module: "missed_call_text_back", action: "Check Twilio voice webhook URL and missed-call webhook endpoint.", severity: "critical" });
  if (failedLogs.some((log) => log.module_key === "daily_digest")) actions.push({ module: "daily_digest", action: "Check Resend sender configuration and digest scheduling.", severity: "warning" });
  if (failedLogs.some((log) => log.execution_status === "blocked")) actions.push({ module: "permission", action: "Review module permissions, package tier, and deployment pause state.", severity: "warning" });
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3"><Wrench className="w-4 h-4 text-blue-500" /><h3 className="text-sm font-bold text-gray-800">Recommended Actions</h3></div>
      {actions.length === 0 ? <div className="flex items-center gap-2 text-sm text-green-600 py-2"><CheckCircle2 className="w-4 h-4" /> No actions needed in the sampled results.</div> : <div className="space-y-2">{actions.map((action, index) => <div key={index} className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${action.severity === "critical" ? "border-red-200 bg-red-50/50" : "border-yellow-200 bg-yellow-50/50"}`}><AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${action.severity === "critical" ? "text-red-500" : "text-yellow-500"}`} /><div><p className="text-xs font-semibold text-gray-700">{MODULE_LABELS[action.module] || action.module}</p><p className="mt-0.5 text-xs text-gray-600">{action.action}</p></div></div>)}</div>}
    </Card>
  );
}

function LogRow({ log, expanded, onToggle, onCopy, onExport }) {
  const statusKey = log.execution_status || "unknown";
  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.unknown;
  const Icon = cfg.icon;
  return (
    <>
      <tr className={`border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer ${expanded ? "bg-blue-50/30" : ""}`} onClick={onToggle}>
        <td className="px-4 py-3 text-gray-700 font-medium truncate max-w-[120px]">{log.client_id ? `${String(log.client_id).slice(0, 12)}...` : "—"}</td>
        <td className="px-4 py-3">{log.deployment ? <Badge variant="outline" className="text-xs font-normal">{log.deployment.deployment_status || "deployment"}</Badge> : <span className="text-gray-400 text-xs">No deployment</span>}</td>
        <td className="px-4 py-3 text-gray-600"><Badge variant="outline" className="text-xs font-normal">{log.industry_slug || "—"}</Badge></td>
        <td className="px-4 py-3 text-gray-600 text-xs font-semibold">{log.package_tier_key || "—"}</td>
        <td className="px-4 py-3 text-gray-700">{MODULE_LABELS[log.module_key] || log.module_key || "Unknown"}</td>
        <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} ${cfg.border} border`}><Icon className={`w-3.5 h-3.5 ${statusKey === "running" ? "animate-spin" : ""}`} />{cfg.label}</span></td>
        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{log.created_date ? new Date(log.created_date).toLocaleString() : "—"}</td>
        <td className="px-4 py-3 text-xs">{log.error_message ? <span className="text-red-600 truncate block max-w-[240px]" title={log.error_message}>{log.error_message}</span> : <span className="text-gray-500">{log.observability_note || "No error on sampled row"}</span>}</td>
        <td className="px-4 py-3 text-xs"><div className="flex gap-2"><button onClick={(event) => { event.stopPropagation(); onCopy(log); }} className="text-gray-500 hover:text-gray-800"><Copy className="w-3.5 h-3.5" /></button><button onClick={(event) => { event.stopPropagation(); onExport(log); }} className="text-gray-500 hover:text-gray-800"><Download className="w-3.5 h-3.5" /></button></div></td>
      </tr>
      {expanded && <tr className="bg-gray-50/40"><td colSpan={9} className="px-6 py-4"><pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(log, null, 2)}</pre></td></tr>}
    </>
  );
}
