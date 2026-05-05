/**
 * IntegrationHealthDashboard
 * Real-time integration health monitor with live pings,
 * failure trend tracking, and auto fix-it task creation.
 */
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Zap, Loader2,
  Clock, Activity, MessageSquare, Mail, CreditCard, ClipboardList,
  ExternalLink, ChevronDown, ChevronUp, Shield, AlertCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import AutomationAlertsPanel from "./AutomationAlertsPanel";
import FailedEventsPanel from "./FailedEventsPanel";

const PROVIDER_ICONS = {
  twilio: MessageSquare,
  resend: Mail,
  stripe: CreditCard,
};

const STATUS_CONFIG = {
  healthy:   { label: "Healthy",        color: "bg-green-50 border-green-200 text-green-800",  dot: "bg-green-500",  icon: CheckCircle2 },
  error:     { label: "Error",          color: "bg-red-50 border-red-200 text-red-800",        dot: "bg-red-500",    icon: XCircle },
  disabled:  { label: "Disabled",       color: "bg-yellow-50 border-yellow-200 text-yellow-800", dot: "bg-yellow-400", icon: AlertTriangle },
  unavailable:{ label: "Not Configured", color: "bg-slate-50 border-slate-200 text-slate-600",  dot: "bg-slate-300",  icon: Clock },
};

function formatAgo(iso) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function IntegrationCard({ integration, onRunHealthCheck }) {
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);
  const cfg = STATUS_CONFIG[integration.derived_status] || STATUS_CONFIG.unavailable;
  const StatusIcon = cfg.icon;
  const ProviderIcon = PROVIDER_ICONS[integration.id] || Activity;

  const handleRunCheck = async () => {
    setRunning(true);
    await onRunHealthCheck();
    setRunning(false);
  };

  return (
    <div className={`rounded-xl border-2 transition-all ${cfg.color}`}>
      {/* Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <ProviderIcon className="w-6 h-6" />
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${cfg.dot}`} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">{integration.name}</p>
            <p className="text-xs opacity-75 truncate">{integration.status_reason}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {integration.recent_failure_count > 0 && (
            <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
              {integration.recent_failure_count} failures/6h
            </span>
          )}
          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
            <StatusIcon className="w-3 h-3" />
            {cfg.label}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-current border-opacity-20 px-5 pb-5 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Live Ping</p>
              <div className="flex items-center gap-1.5">
                {integration.live_ping_ok
                  ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                  : <XCircle className="w-4 h-4 text-red-600" />}
                <span className="font-medium">{integration.live_ping_ok ? "API Reachable" : "API Unreachable"}</span>
              </div>
              {integration.live_ping_error && (
                <p className="text-xs opacity-70 mt-1 font-mono">{integration.live_ping_error}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Last Activity</p>
              <p className="font-medium">{formatAgo(integration.latest_activity_at)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Failures (6h)</p>
              <p className={`font-bold ${integration.recent_failure_count >= 3 ? "text-red-600" : ""}`}>
                {integration.recent_failure_count}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Auto Tasks</p>
              <p className="font-medium text-xs">
                {integration.recent_failure_count >= 3
                  ? "Fix-it task auto-created"
                  : "None needed"}
              </p>
            </div>
          </div>

          {integration.missing_configuration?.length > 0 && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2">
              <p className="text-xs font-bold text-yellow-800 mb-1">Configuration needed:</p>
              <ul className="space-y-0.5">
                {integration.missing_configuration.map((item, i) => (
                  <li key={i} className="text-xs text-yellow-700 flex items-center gap-1">
                    <span>→</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleRunCheck}
            disabled={running}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-current border-opacity-30 text-xs font-semibold hover:bg-black/5 transition-colors disabled:opacity-50"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {running ? "Running check..." : "Run Live Check Now"}
          </button>
        </div>
      )}
    </div>
  );
}

function FixItTasksPanel({ tasks }) {
  if (!tasks || tasks.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Auto-Created Fix-It Tasks</h3>
        <span className="ml-auto text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{tasks.length} open</span>
      </div>
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-900 truncate">{task.title}</p>
              <p className="text-xs text-red-700 mt-0.5 line-clamp-2">{task.notes?.split('\n')[3] || ""}</p>
              <p className="text-[10px] text-red-500 mt-1">Created {formatAgo(task.created_date)} · Priority: {task.priority}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex-shrink-0">
              {task.status}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        These tasks are auto-created when persistent errors are detected. Mark them done in the Task Board once resolved.
      </p>
    </div>
  );
}

export default function IntegrationHealthDashboard() {
  const [data, setData] = useState(null);
  const [fixItTasks, setFixItTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] = useState(null);
  const [checkResult, setCheckResult] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "failed"
  const [failedCount, setFailedCount] = useState(0);

  const loadHealth = useCallback(async () => {
    try {
      setError("");
      const [healthRes, tasksRes, failedEvts] = await Promise.all([
        base44.functions.invoke("getIntegrationHealth", {}),
        base44.entities.ProjectTask.filter(
          { domain: "D09_DevOps_Monitoring", status: "pending" },
          "-created_date",
          20
        ),
        base44.entities.CommunicationEvent.filter({ status: "failed" }, "-created_date", 5),
      ]);
      setData(healthRes.data);
      setFixItTasks((tasksRes || []).filter(t => t.title?.includes("Integration Alert")));
      setFailedCount((failedEvts || []).length);
      setLastChecked(new Date());
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load health data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [loadHealth]);

  const runFullCheck = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await base44.functions.invoke("runIntegrationHealthCheck", {});
      setCheckResult(res.data);
      await loadHealth();
    } catch (err) {
      setError(err?.response?.data?.error || "Health check failed");
    } finally {
      setChecking(false);
    }
  };

  const integrations = data?.integrations || [];
  const system = data?.system || {};
  const recentActivity = data?.recent_activity || [];
  const allHealthy = integrations.every(i => i.derived_status === "healthy");
  const errorCount = integrations.filter(i => i.derived_status === "error").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Integration Health
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time live API pings for Twilio, Resend, and Stripe. Persistent errors auto-create fix-it tasks.
          </p>
          {lastChecked && (
            <p className="text-xs text-muted-foreground mt-1">
              Last refreshed: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadHealth}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={runFullCheck}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {checking ? "Running Full Check..." : "Run Full Health Check"}
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "overview" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Activity className="w-4 h-4" /> Overview
        </button>
        <button
          onClick={() => setActiveTab("failed")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "failed" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <AlertCircle className="w-4 h-4" /> Failed Events
          {failedCount > 0 && (
            <span className="rounded-full text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700">
              {failedCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "failed" && <FailedEventsPanel />}

      {activeTab === "overview" && <>
      {/* Status Banner */}
      {!loading && (
        <div className={`rounded-xl border-2 p-4 flex items-center gap-3 ${
          allHealthy
            ? "bg-green-50 border-green-200"
            : errorCount > 0
              ? "bg-red-50 border-red-200"
              : "bg-yellow-50 border-yellow-200"
        }`}>
          {allHealthy
            ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            : errorCount > 0
              ? <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              : <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />}
          <div>
            <p className={`font-semibold text-sm ${allHealthy ? "text-green-800" : errorCount > 0 ? "text-red-800" : "text-yellow-800"}`}>
              {system.uptime?.label || (allHealthy ? "All Systems Operational" : "Issues Detected")}
            </p>
            <p className={`text-xs ${allHealthy ? "text-green-700" : errorCount > 0 ? "text-red-700" : "text-yellow-700"}`}>
              {system.uptime?.reason || `${errorCount} integration${errorCount !== 1 ? "s" : ""} with errors`}
            </p>
          </div>
          {system.success_rate_percent != null && (
            <div className="ml-auto text-right flex-shrink-0">
              <p className="text-2xl font-bold text-foreground">{system.success_rate_percent}%</p>
              <p className="text-xs text-muted-foreground">success rate</p>
            </div>
          )}
        </div>
      )}

      {/* Check result toast */}
      {checkResult && (
        <div className={`rounded-xl border p-4 text-sm ${checkResult.all_healthy ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
          <p className="font-semibold mb-1">
            {checkResult.all_healthy ? "✅ All integrations healthy" : "⚠️ Issues detected — fix-it tasks created"}
          </p>
          <div className="flex gap-4 text-xs">
            <span>Twilio: {checkResult.ping_results?.twilio?.ok ? "✓" : "✗"}</span>
            <span>Resend: {checkResult.ping_results?.resend?.ok ? "✓" : "✗"}</span>
            <span>Stripe: {checkResult.ping_results?.stripe?.ok ? "✓" : "✗"}</span>
            {checkResult.tasks?.filter(t => t.created).length > 0 && (
              <span className="font-semibold">{checkResult.tasks.filter(t => t.created).length} new task(s) created</span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Integration Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {integrations.map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onRunHealthCheck={runFullCheck}
            />
          ))}
        </div>
      )}

      {/* KPI Row */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Messages Tracked", value: system.messages_tracked || 0, color: "text-foreground" },
            { label: "Successful", value: system.successful_activity_count || 0, color: "text-green-700" },
            { label: "Failed", value: system.failed_activity_count || 0, color: "text-red-700" },
            { label: "Fix-It Tasks", value: fixItTasks.length, color: fixItTasks.length > 0 ? "text-red-700" : "text-green-700" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-border p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Fix-It Tasks */}
      <FixItTasksPanel tasks={fixItTasks} />

      {/* Automation Alerts */}
      <div className="bg-white rounded-xl border border-border p-6">
        <AutomationAlertsPanel />
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Recent Activity Log</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {recentActivity.map(evt => (
              <div key={evt.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 text-sm">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  evt.status === "failed" ? "bg-red-500" :
                  evt.status === "sent" || evt.status === "delivered" ? "bg-green-500" : "bg-slate-300"
                }`} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground">{evt.subject || evt.event_type?.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{evt.provider} · {evt.channel}</span>
                  {evt.error_message && (
                    <p className="text-xs text-red-600 mt-0.5 truncate">{evt.error_message}</p>
                  )}
                </div>
                <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  evt.status === "failed" ? "bg-red-100 text-red-700" :
                  evt.status === "sent" || evt.status === "delivered" ? "bg-green-100 text-green-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {evt.status}
                </span>
                <span className="text-[11px] text-muted-foreground flex-shrink-0">
                  {formatAgo(evt.created_date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduler info */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-start gap-3">
        <Clock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Automatic Health Monitoring</p>
          <p>The system runs <code className="bg-muted px-1 rounded">runIntegrationHealthCheck</code> every hour. If Twilio, Resend, or Stripe fail 3+ times in 6 hours, a fix-it task is automatically created in the Task Board and deduplicated within 24 hours.</p>
        </div>
      </div>
      </>}
    </div>
  );
}