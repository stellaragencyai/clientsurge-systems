import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, XCircle, Zap, RefreshCw, CheckCircle2,
  ChevronDown, ChevronUp, Bell, BellOff, Loader2, ArrowRight, X
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const STALL_THRESHOLDS_MS = {
  instant_sms: 60 * 60 * 1000,
  confirmation_email: 3 * 60 * 60 * 1000,
  admin_notification: 2 * 60 * 60 * 1000,
  nurture_sequence: 6 * 60 * 60 * 1000,
  webhook_dispatch: 4 * 60 * 60 * 1000,
};
const DEFAULT_STALL_MS = 4 * 60 * 60 * 1000;
const FAILURE_WINDOW_MS = 6 * 60 * 60 * 1000;
const POLL_INTERVAL_MS = 60 * 1000; // 1 minute

function formatAge(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

function severityConfig(severity) {
  if (severity === "critical") return {
    border: "border-red-300",
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-700",
    icon: <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />,
    dot: "bg-red-500",
    btnStyle: "bg-red-600 hover:bg-red-700 text-white",
  };
  return {
    border: "border-blue-300",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    icon: <AlertTriangle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />,
    dot: "bg-blue-400",
    btnStyle: "bg-blue-500 hover:bg-blue-600 text-white",
  };
}

function deriveAlertsFromData({ stalledJobs = [], failedJobs = [], failedEvents = [], stalledLeads = [] }) {
  const now = Date.now();
  const alerts = [];

  // 1. Stalled queued jobs
  for (const job of stalledJobs) {
    const scheduledAt = job.scheduled_for
      ? new Date(job.scheduled_for).getTime()
      : new Date(job.created_date).getTime();
    const threshold = STALL_THRESHOLDS_MS[job.job_type] || DEFAULT_STALL_MS;
    const age = now - scheduledAt;
    if (age > threshold) {
      alerts.push({
        id: `stalled_job_${job.id}`,
        type: "stalled_automation",
        severity: age > threshold * 3 ? "critical" : "warning",
        title: `Stalled: ${job.job_type.replace(/_/g, " ")}`,
        description: `Queued ${formatAge(age)}, has not been processed. Lead may not have received automated outreach.`,
        fix_action: "retry_job",
        fix_label: "Retry Job",
        entity_id: job.id,
        entity_type: "AutomationJob",
        metadata: { job_type: job.job_type, attempts: job.attempts || 0, lead_id: job.lead_id },
        created_at: job.scheduled_for || job.created_date,
      });
    }
  }

  // 2. Failed jobs (last 4h)
  const failedRecent = failedJobs.filter(j =>
    now - new Date(j.updated_date || j.created_date).getTime() < 4 * 60 * 60 * 1000
  );
  if (failedRecent.length > 0) {
    const types = [...new Set(failedRecent.map(j => j.job_type.replace(/_/g, " ")))];
    alerts.push({
      id: "failed_automation_jobs",
      type: "stalled_automation",
      severity: failedRecent.length >= 3 ? "critical" : "warning",
      title: `${failedRecent.length} automation job${failedRecent.length > 1 ? "s" : ""} failed`,
      description: `Types: ${types.join(", ")}. ${failedRecent[0]?.last_error ? `Error: ${failedRecent[0].last_error.slice(0, 100)}` : ""}`,
      fix_action: "retry_all_failed",
      fix_label: "Retry All Failed",
      entity_id: failedRecent[0]?.id,
      entity_type: "AutomationJob",
      metadata: { failed_ids: failedRecent.map(j => j.id), count: failedRecent.length },
      created_at: failedRecent[0]?.updated_date,
    });
  }

  // 3. Provider/webhook failures grouped by provider
  const byProvider = {};
  for (const evt of failedEvents) {
    if (now - new Date(evt.created_date).getTime() > FAILURE_WINDOW_MS) continue;
    const k = evt.provider || "unknown";
    if (!byProvider[k]) byProvider[k] = [];
    byProvider[k].push(evt);
  }
  for (const [provider, failures] of Object.entries(byProvider)) {
    const count = failures.length;
    const latest = failures[0];
    alerts.push({
      id: `webhook_error_${provider}`,
      type: "webhook_error",
      severity: count >= 5 ? "critical" : "warning",
      title: `${count} ${provider} failure${count > 1 ? "s" : ""} (last 6h)`,
      description: `Latest: ${(latest.error_message || "No error details").slice(0, 160)}`,
      fix_action: "check_integration",
      fix_label: "Check Integration",
      entity_id: latest.id,
      entity_type: "CommunicationEvent",
      metadata: { provider, failure_count: count },
      created_at: latest.created_date,
    });
  }

  // 4. New leads with no response after 1 hour
  if (stalledLeads.length > 0) {
    alerts.push({
      id: "stalled_new_leads",
      type: "lead_flow_blocked",
      severity: stalledLeads.length >= 3 ? "critical" : "warning",
      title: `${stalledLeads.length} lead${stalledLeads.length > 1 ? "s" : ""} with no auto-response`,
      description: `Submitted 1+ hour ago with no automated outreach sent. Check Twilio / Resend config.`,
      fix_action: "check_integration",
      fix_label: "Check Integrations",
      entity_id: stalledLeads[0]?.id,
      entity_type: "WebsiteLead",
      metadata: { count: stalledLeads.length },
      created_at: stalledLeads[0]?.created_date,
    });
  }

  alerts.sort((a, b) => {
    if (a.severity === "critical" && b.severity !== "critical") return -1;
    if (b.severity === "critical" && a.severity !== "critical") return 1;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  return alerts;
}

// ── Individual Alert Card ────────────────────────────────────────────────────

function AlertCard({ alert, onFix, onDismiss, fixing }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = severityConfig(alert.severity);
  const typeLabels = {
    stalled_automation: "Stalled Automation",
    webhook_error: "Webhook Error",
    lead_flow_blocked: "Lead Flow Blocked",
  };

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all`}>
      <div className="px-4 py-3 flex items-start gap-3">
        {cfg.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${cfg.badge}`}>
              {typeLabels[alert.type] || alert.type}
            </span>
            <span className="text-xs text-muted-foreground">
              {alert.created_at ? formatAge(Date.now() - new Date(alert.created_at).getTime()) : ""}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground mt-1">{alert.title}</p>
          {expanded && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.description}</p>
          )}
          {alert.metadata?.attempts > 0 && expanded && (
            <p className="text-xs text-muted-foreground mt-1">Attempts: {alert.metadata.attempts}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
              : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
          <button
            onClick={() => onDismiss(alert.id)}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="px-4 pb-3 flex items-center gap-2">
        <button
          onClick={() => onFix(alert)}
          disabled={fixing === alert.id}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${cfg.btnStyle}`}
        >
          {fixing === alert.id
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <Zap className="w-3 h-3" />}
          {fixing === alert.id ? "Fixing…" : alert.fix_label || "Fix Now"}
        </button>
        {expanded && alert.metadata?.lead_id && (
          <span className="text-xs text-muted-foreground">Lead: {alert.metadata.lead_id.slice(0, 8)}…</span>
        )}
      </div>
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────────

export default function AutomationAlertsPanel({ onNavigate, compact = false }) {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(null);
  const [fixResult, setFixResult] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [muted, setMuted] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const now = Date.now();

      // Parallel fetches
      const [stalledJobsRes, failedJobsRes, failedEventsRes, stalledLeadsRes] = await Promise.allSettled([
        base44.entities.AutomationJob.filter({ status: "queued" }, "-scheduled_for", 50),
        base44.entities.AutomationJob.filter({ status: "failed" }, "-updated_date", 20),
        base44.entities.CommunicationEvent.filter({ status: "failed" }, "-created_date", 100),
        base44.entities.WebsiteLead.filter({ lead_status: "new" }, "-created_date", 30),
      ]);

      const stalledJobs = stalledJobsRes.status === "fulfilled" ? stalledJobsRes.value : [];
      const failedJobs = failedJobsRes.status === "fulfilled" ? failedJobsRes.value : [];
      const failedEvents = failedEventsRes.status === "fulfilled" ? failedEventsRes.value : [];
      const allNewLeads = stalledLeadsRes.status === "fulfilled" ? stalledLeadsRes.value : [];

      const stalledLeads = allNewLeads.filter(l =>
        now - new Date(l.created_date).getTime() > 60 * 60 * 1000 &&
        !l.initial_response_sent_at &&
        l.automation_enabled !== false
      );

      const derived = deriveAlertsFromData({ stalledJobs, failedJobs, failedEvents, stalledLeads });
      setAlerts(derived);
      setLastChecked(new Date());
    } catch (err) {
      console.error("AutomationAlertsPanel fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleFix = async (alert) => {
    setFixing(alert.id);
    setFixResult(null);
    try {
      if (alert.fix_action === "retry_job") {
        await base44.entities.AutomationJob.update(alert.entity_id, {
          status: "queued",
          attempts: 0,
          last_error: null,
          scheduled_for: new Date().toISOString(),
        });
        setFixResult({ id: alert.id, success: true, message: "Job re-queued for processing" });
        setDismissed(prev => new Set([...prev, alert.id]));
      } else if (alert.fix_action === "retry_all_failed") {
        const ids = alert.metadata?.failed_ids || [alert.entity_id];
        for (const id of ids) {
          await base44.entities.AutomationJob.update(id, {
            status: "queued",
            attempts: 0,
            last_error: null,
            scheduled_for: new Date().toISOString(),
          });
        }
        setFixResult({ id: alert.id, success: true, message: `${ids.length} job${ids.length > 1 ? "s" : ""} re-queued` });
        setDismissed(prev => new Set([...prev, alert.id]));
      } else if (alert.fix_action === "check_integration") {
        if (onNavigate) onNavigate("health");
        setFixResult({ id: alert.id, success: true, message: "Navigating to Integration Health…" });
      }
      setTimeout(fetchAlerts, 2000);
    } catch (err) {
      setFixResult({ id: alert.id, success: false, message: err?.message || "Fix action failed" });
    } finally {
      setFixing(null);
    }
  };

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));
  const criticalCount = visibleAlerts.filter(a => a.severity === "critical").length;
  const hasAlerts = visibleAlerts.length > 0;

  // Compact mode — just a status badge for embedding in the overview
  if (compact) {
    if (loading) return null;
    if (!hasAlerts) return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-xs font-semibold text-green-700">
        <CheckCircle2 className="w-3.5 h-3.5" /> All automations healthy
      </div>
    );
    return (
      <button
        onClick={() => onNavigate && onNavigate("health")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
          criticalCount > 0
            ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
            : "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
        }`}
      >
        {criticalCount > 0
          ? <XCircle className="w-3.5 h-3.5" />
          : <AlertTriangle className="w-3.5 h-3.5" />}
        {criticalCount > 0 ? `${criticalCount} critical alert${criticalCount > 1 ? "s" : ""}` : `${visibleAlerts.length} warning${visibleAlerts.length > 1 ? "s" : ""}`}
        <ArrowRight className="w-3 h-3 opacity-60" />
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              Automation Alerts
              {hasAlerts && !loading && (
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                  criticalCount > 0 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {visibleAlerts.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : "Checking…"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted(m => !m)}
            title={muted ? "Unmute alerts" : "Mute alerts"}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            {muted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { setLoading(true); fetchAlerts(); }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Checking…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Fix result toast */}
      {fixResult && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium ${
          fixResult.success
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {fixResult.success
            ? <CheckCircle2 className="w-4 h-4 text-green-600" />
            : <XCircle className="w-4 h-4 text-red-600" />}
          {fixResult.message}
          <button onClick={() => setFixResult(null)} className="ml-auto p-1 hover:opacity-60">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Alert list */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Scanning for stalled automations and errors…
        </div>
      ) : muted ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <BellOff className="w-4 h-4" /> Alerts muted. Click the bell icon to re-enable.
        </div>
      ) : !hasAlerts ? (
        <div className="flex items-center gap-3 px-4 py-5 rounded-xl bg-green-50 border border-green-200">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">All systems operational</p>
            <p className="text-xs text-green-700 mt-0.5">No stalled automations or webhook errors detected.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onFix={handleFix}
              onDismiss={(id) => setDismissed(prev => new Set([...prev, id]))}
              fixing={fixing}
            />
          ))}
        </div>
      )}
    </div>
  );
}