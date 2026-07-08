import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, Database, ShieldAlert, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import FullClientOperationsCommandCenter from './FullClientOperationsCommandCenter';
import AssistedOperationsMode from './AssistedOperationsMode';

function formatValue(value) {
  if (value === null || value === undefined) return 'Unknown';
  return value;
}

function MetricCard({ label, value, icon: Icon, subtext, truthLabel }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg" style={{ background: 'rgba(0, 174, 239, 0.08)' }}>
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
          {truthLabel && <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">{truthLabel}</span>}
        </div>
        <p className="text-2xl font-bold text-foreground mt-1">{formatValue(value)}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

function HealthBadge({ status }) {
  const colors = {
    Healthy: 'bg-green-50 text-green-700 border-green-200',
    Degraded: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Issue: 'bg-red-50 text-red-700 border-red-200',
    Unknown: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  const label = status || 'Unknown';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[label] || colors.Unknown}`}>
      {label}
    </span>
  );
}

function ActivityItem({ item }) {
  const status = item.status || 'unknown';
  const tone = status === 'sent' || status === 'completed' || status === 'processed'
    ? 'bg-green-50 text-green-700'
    : status === 'processing' || status === 'running' || status === 'queued'
      ? 'bg-blue-50 text-blue-700'
      : 'bg-red-50 text-red-700';

  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground capitalize truncate">
            {item.event_type || item.job_type || item.business_name || item.type || 'Activity'}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.type}{item.channel ? ` • ${item.channel}` : ''}{item.provider ? ` • ${item.provider}` : ''}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded ${tone}`}>{status}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'No timestamp'}</p>
    </div>
  );
}

function CoveragePanel({ coverage = {}, warnings = [] }) {
  const entries = Object.entries(coverage);
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" /> Data Coverage
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">Dashboard numbers are based on posted Base44 records, not direct live provider proof.</p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">Evidence Required</span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {entries.map(([key, source]) => (
          <div key={key} className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{key.replace(/_/g, ' ')}</p>
              <HealthBadge status={source.queried ? 'Healthy' : 'Unknown'} />
            </div>
            <p className="mt-2 text-lg font-black text-foreground">{source.count ?? 0}</p>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              Latest: {source.latest_record_at ? new Date(source.latest_record_at).toLocaleString() : 'No records'}
            </p>
            {source.warning && <p className="mt-2 text-[11px] leading-4 text-red-600">{source.warning}</p>}
          </div>
        ))}
      </div>
      {warnings.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Coverage warnings</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-800">
            {warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SystemObservabilityDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      setError('');
      const res = await base44.functions.invoke('getSystemObservabilityMetrics', {});
      setMetrics(res?.data || res || null);
    } catch (err) {
      setError(err?.message || 'Failed to fetch observability metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading system metrics...</div>;

  if (error || !metrics) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-bold">Failed to load observability data.</p>
          <p className="mt-1 text-sm">{error || 'No metrics payload returned.'}</p>
        </div>
      </div>
    );
  }

  const coreMetrics = metrics.core_metrics || {};
  const leadFlow = metrics.lead_flow_24h || {};
  const health = metrics.health_indicators || {};
  const activityFeed = metrics.activity_feed || [];
  const suggestions = metrics.suggestions || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" /> System Observability
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Posted-record monitoring. Updated {metrics.timestamp ? new Date(metrics.timestamp).toLocaleString() : 'unknown'}.
          </p>
          {metrics.request_id && <p className="mt-1 text-xs text-muted-foreground">Request ID: {metrics.request_id}</p>}
        </div>
        <button onClick={fetchMetrics} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted">
          Refresh
        </button>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-bold">Truth label: {metrics.proof_label || 'Posted records only'}</p>
            <p className="mt-1">Do not use these dashboard numbers as public proof unless they are reconciled to provider records, logs, or billing sources.</p>
          </div>
        </div>
      </div>

      <AssistedOperationsMode />
      <FullClientOperationsCommandCenter />

      <CoveragePanel coverage={metrics.data_coverage || {}} warnings={metrics.coverage_warnings || []} />

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Core Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricCard label="Total Leads" value={coreMetrics.total_leads ?? 0} icon={Zap} truthLabel="Posted" />
          <MetricCard label="Total Events" value={coreMetrics.total_events ?? 0} icon={Activity} truthLabel="Posted" />
          <MetricCard label="Automation Jobs" value={coreMetrics.total_jobs ?? 0} icon={CheckCircle2} truthLabel="Posted" />
          <MetricCard label="Job Success Rate" value={coreMetrics.success_rate === null || coreMetrics.success_rate === undefined ? 'Unknown' : `${coreMetrics.success_rate}%`} icon={CheckCircle2} subtext="Unknown when no jobs exist." />
          <MetricCard label="Failed Events" value={coreMetrics.failed_events ?? 0} icon={AlertTriangle} truthLabel="Posted" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Lead Flow (24h)</h3>
          {[
            ['New Leads', leadFlow.new_leads],
            ['Contacted', leadFlow.contacted],
            ['Responded', leadFlow.responded],
            ['Booked', leadFlow.booked],
          ].map(([label, value], index) => (
            <div key={label} className={`flex items-center justify-between py-2 ${index < 3 ? 'border-b border-border' : ''}`}>
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <span className="text-lg font-bold text-foreground">{value ?? 0}</span>
            </div>
          ))}
          <p className="mt-3 text-xs text-muted-foreground">Source: Leads records created in the last 24 hours.</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">Messaging</span>
              <HealthBadge status={health.messaging_health?.status} />
            </div>
            <p className="text-xs text-muted-foreground">Evidence: {health.messaging_health?.evidence_count ?? 0} sampled SMS/email events · SMS failures {formatValue(health.messaging_health?.sms_failure_rate)}% · Email failures {formatValue(health.messaging_health?.email_failure_rate)}%</p>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <span className="text-sm font-medium text-muted-foreground">Automation</span>
              <HealthBadge status={health.automation_health?.status} />
            </div>
            <p className="text-xs text-muted-foreground">Evidence: {health.automation_health?.evidence_count ?? 0} jobs/logs · failed executions {health.automation_health?.failed_execution_logs ?? 0}</p>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <span className="text-sm font-medium text-muted-foreground">Event Queue</span>
              <HealthBadge status={health.event_queue_health?.status} />
            </div>
            <p className="text-xs text-muted-foreground">Evidence: {health.event_queue_health?.evidence_count ?? 0} queue records · queued {health.event_queue_health?.queued ?? 0}</p>
          </div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Recommended Actions</h3>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={`${suggestion.title}-${index}`} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-amber-900">{suggestion.title}</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">{suggestion.priority}</span>
                </div>
                <p className="mt-1 text-xs text-amber-800">{suggestion.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
        {activityFeed.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No recent activity records were returned. This is unknown coverage, not proof that nothing happened.
          </div>
        ) : (
          <div>{activityFeed.map((item, index) => <ActivityItem key={index} item={item} />)}</div>
        )}
      </div>
    </div>
  );
}
