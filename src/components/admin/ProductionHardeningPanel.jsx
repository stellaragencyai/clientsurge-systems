import React, { useEffect, useState } from 'react';
import { Shield, RefreshCw, AlertTriangle, CheckCircle2, AlertCircle, Zap, MessageSquare, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getHealthStyle, computeProductionReadiness } from '@/lib/productionSafety';

function StatusDot({ status }) {
  const { dot } = getHealthStyle(status);
  return <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />;
}

function HealthBadge({ status }) {
  const { badge, label } = getHealthStyle(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge}`}>
      <StatusDot status={status} />
      {label}
    </span>
  );
}

function MetricBox({ label, value, subtext, warn, critical }) {
  return (
    <div className={`rounded-lg border p-4 ${critical ? 'bg-red-50 border-red-200' : warn ? 'bg-amber-50 border-amber-200' : 'bg-white border-border'}`}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${critical ? 'text-red-700' : warn ? 'text-amber-700' : 'text-foreground'}`}>{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
}

function SystemRow({ icon: Icon, label, status, detail }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-50">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
      <HealthBadge status={status} />
    </div>
  );
}

function SignalCard({ signal, severity }) {
  const colors = {
    critical: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };
  const Icon = severity === 'critical' ? AlertCircle : AlertTriangle;
  return (
    <div className={`rounded-lg border p-3 flex items-start gap-3 ${colors[severity]}`}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <p className="text-xs font-medium">{signal.message}</p>
    </div>
  );
}

export default function ProductionHardeningPanel() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    setRefreshing(true);
    try {
      const res = await base44.functions.invoke('getDeploymentHardeningMetrics', {});
      setMetrics(res?.data);
    } catch (err) {
      console.error('Failed to load hardening metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        Failed to load hardening metrics. Try refreshing.
      </div>
    );
  }

  const readiness = computeProductionReadiness(metrics);
  const allSignals = [...(metrics.critical_signals || []), ...(metrics.warnings || [])];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Production Hardening Status
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-world deployment safety, rate limits, fail-safes, and queue health
          </p>
        </div>
        <button
          onClick={fetch}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Production Readiness Banner */}
      <div className={`rounded-xl border-2 p-5 flex items-start gap-5 ${
        readiness.ready ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
      }`}>
        <div className={`p-3 rounded-xl ${readiness.ready ? 'bg-green-100' : 'bg-red-100'}`}>
          {readiness.ready
            ? <CheckCircle2 className="w-7 h-7 text-green-700" />
            : <AlertCircle className="w-7 h-7 text-red-700" />
          }
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className={`text-xl font-bold ${readiness.ready ? 'text-green-800' : 'text-red-800'}`}>
              {readiness.ready ? 'System Production Ready' : 'Production Issues Detected'}
            </h3>
            <HealthBadge status={metrics.overall_status} />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-32 h-3 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${readiness.score >= 80 ? 'bg-green-500' : readiness.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${readiness.score}%` }}
                />
              </div>
              <span className={`text-sm font-bold ${readiness.ready ? 'text-green-700' : 'text-red-700'}`}>
                {readiness.score}% ready
              </span>
            </div>
          </div>
          {readiness.issues.length > 0 && (
            <ul className="mt-2 space-y-1">
              {readiness.issues.map((issue, i) => (
                <li key={i} className="text-xs text-red-700 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricBox
          label="Events (24h)"
          value={metrics.summary_kpis.total_events_24h}
          subtext="CommunicationEvent records"
        />
        <MetricBox
          label="Jobs (24h)"
          value={metrics.summary_kpis.total_jobs_24h}
          subtext="Automation executions"
        />
        <MetricBox
          label="Success Rate"
          value={`${metrics.summary_kpis.overall_success_rate}%`}
          warn={metrics.summary_kpis.overall_success_rate < 80}
          critical={metrics.summary_kpis.overall_success_rate < 60}
          subtext="Automation jobs"
        />
        <MetricBox
          label="Queue Backlog"
          value={metrics.summary_kpis.queue_backlog}
          warn={metrics.summary_kpis.queue_backlog >= 20}
          critical={metrics.summary_kpis.queue_backlog >= 100}
          subtext={metrics.queue_health.backpressure_active ? '⚠ Backpressure active' : 'Normal'}
        />
      </div>

      {/* System Health Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sub-system Health */}
        <div className="rounded-xl border border-border bg-white p-5">
          <h3 className="font-bold text-foreground mb-4">Sub-System Health</h3>
          <SystemRow
            icon={Activity}
            label="Event Queue"
            status={metrics.queue_health.status}
            detail={`${metrics.queue_health.backlog_size} backlog · ${metrics.queue_health.pending} pending · ${metrics.queue_health.failed} failed`}
          />
          <SystemRow
            icon={Zap}
            label="Automation Engine"
            status={metrics.automation_health.status}
            detail={`${metrics.automation_health.success_rate}% success · ${metrics.automation_health.high_retry_count} high-retry jobs`}
          />
          <SystemRow
            icon={MessageSquare}
            label="Messaging Delivery"
            status={metrics.messaging_health.status}
            detail={`${metrics.messaging_health.failure_rate_percent}% failure rate · ${metrics.messaging_health.sms_sent_24h} SMS · ${metrics.messaging_health.email_sent_24h} email`}
          />
          <SystemRow
            icon={Activity}
            label="Lead Ingestion"
            status={metrics.lead_ingestion.status}
            detail={`${metrics.lead_ingestion.new_leads_24h} new leads in last 24h`}
          />
        </div>

        {/* Rate Limit + Fail-Safe Status */}
        <div className="rounded-xl border border-border bg-white p-5">
          <h3 className="font-bold text-foreground mb-4">Rate Limits & Fail-Safes</h3>
          <div className="space-y-3">
            <div className={`flex items-center justify-between rounded-lg p-3 ${metrics.messaging_health.sms_rate_limit_warning ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
              <div>
                <p className="text-sm font-medium text-foreground">SMS Rate Limit</p>
                <p className="text-xs text-muted-foreground">{metrics.messaging_health.sms_sent_24h} sent today (800 safe limit)</p>
              </div>
              <HealthBadge status={metrics.messaging_health.sms_rate_limit_warning ? 'degraded' : 'healthy'} />
            </div>
            <div className={`flex items-center justify-between rounded-lg p-3 ${metrics.messaging_health.email_rate_limit_warning ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
              <div>
                <p className="text-sm font-medium text-foreground">Email Rate Limit</p>
                <p className="text-xs text-muted-foreground">{metrics.messaging_health.email_sent_24h} sent today (500 safe limit)</p>
              </div>
              <HealthBadge status={metrics.messaging_health.email_rate_limit_warning ? 'degraded' : 'healthy'} />
            </div>
            <div className={`flex items-center justify-between rounded-lg p-3 ${metrics.automation_health.cascade_risk ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
              <div>
                <p className="text-sm font-medium text-foreground">Cascade Failure Risk</p>
                <p className="text-xs text-muted-foreground">{metrics.automation_health.failed} failed jobs · {metrics.automation_health.high_retry_count} high-retry</p>
              </div>
              <HealthBadge status={metrics.automation_health.cascade_risk ? 'critical' : 'healthy'} />
            </div>
            <div className="flex items-center justify-between rounded-lg p-3 bg-gray-50">
              <div>
                <p className="text-sm font-medium text-foreground">Queue Backpressure</p>
                <p className="text-xs text-muted-foreground">{metrics.queue_health.backlog_size} items queued</p>
              </div>
              <HealthBadge status={metrics.queue_health.backpressure_active ? 'degraded' : 'healthy'} />
            </div>
          </div>
        </div>
      </div>

      {/* Active Signals */}
      {allSignals.length > 0 && (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-border">
            <h3 className="font-bold text-foreground">
              Active Signals ({allSignals.length})
            </h3>
          </div>
          <div className="p-5 space-y-2">
            {(metrics.critical_signals || []).map((s, i) => <SignalCard key={i} signal={s} severity="critical" />)}
            {(metrics.warnings || []).map((s, i) => <SignalCard key={i} signal={s} severity="warning" />)}
          </div>
        </div>
      )}

      {allSignals.length === 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="font-semibold text-green-700">No active signals</p>
          <p className="text-sm text-green-600 mt-1">All systems operating within safe parameters</p>
        </div>
      )}

      {/* Top Failure Reasons */}
      {metrics.top_failure_reasons?.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-5">
          <h3 className="font-bold text-foreground mb-4">Top Failure Patterns</h3>
          <div className="space-y-2">
            {metrics.top_failure_reasons.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-4 rounded-lg bg-red-50 border border-red-100 p-3">
                <p className="text-xs font-medium text-red-700 flex-1">{item.reason}</p>
                <span className="text-xs font-bold text-red-600 flex-shrink-0">{item.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}