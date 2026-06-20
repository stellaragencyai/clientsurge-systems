import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, Zap, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function KPICard({ label, value, icon: Icon, color = 'text-blue-600' }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color.includes('red') ? 'bg-red-50' : color.includes('green') ? 'bg-green-50' : 'bg-blue-50'}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      </div>
    </div>
  );
}

function PipelineStage({ label, count }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 rounded-lg flex items-center justify-center font-bold text-sm"
        style={{ background: 'rgba(0, 174, 239, 0.08)', color: '#00AEEF' }}>
        {count}
      </div>
      <span className="text-xs font-semibold text-muted-foreground text-center">{label}</span>
    </div>
  );
}

function EventBreakdownRow({ label, count }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-sm font-bold" style={{ color: '#00AEEF' }}>{count}</span>
    </div>
  );
}

function ErrorItem({ error }) {
  return (
    <div className="rounded-lg border border-border p-3 text-xs bg-red-50/30">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-foreground">{error.event_type}</p>
          <p className="text-muted-foreground mt-0.5">{error.error}</p>
          <p className="text-xs text-muted-foreground mt-1">{new Date(error.timestamp).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default function SystemObservabilityDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMetrics = async () => {
    try {
      const res = await base44.functions.invoke('getSystemObservabilityMetrics', {});
      setMetrics(res?.data?.observability);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch observability metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading system observability...</div>;
  }

  if (!metrics) {
    return <div className="p-6 text-center text-red-600">Failed to load observability data.</div>;
  }

  const { kpis, pipeline_stages, automation, events_breakdown, lead_flow, recent_errors, system_status } = metrics;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            System Observability
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time platform health, event flow, and automation performance
          </p>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* System Health Status */}
      <div className="rounded-lg border-2 p-5 flex items-center gap-4"
        style={{ borderColor: system_status.healthy ? '#22c55e' : '#ef4444', background: system_status.healthy ? 'rgba(34, 197, 94, 0.04)' : 'rgba(239, 68, 68, 0.04)' }}>
        <div className={`p-3 rounded-lg ${system_status.healthy ? 'bg-green-50' : 'bg-red-50'}`}>
          <CheckCircle2 className={`w-6 h-6 ${system_status.healthy ? 'text-green-600' : 'text-red-600'}`} />
        </div>
        <div>
          <p className="font-semibold text-foreground">
            {system_status.healthy ? 'System Healthy' : 'System Issues Detected'}
          </p>
          <p className="text-sm text-muted-foreground">Health Score: {system_status.health_score}%</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Key Performance Indicators (24h)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard label="Events Processed" value={kpis.total_events_24h} icon={Zap} />
          <KPICard label="Successful Jobs" value={kpis.successful_jobs} icon={CheckCircle2} color="text-green-600" />
          <KPICard label="Failed Jobs" value={kpis.failed_jobs} icon={AlertTriangle} color="text-red-600" />
          <KPICard label="Deduped Events" value={kpis.dedup_events} icon={TrendingUp} />
          <KPICard label="Retry Count" value={kpis.retry_count} icon={Activity} />
          <KPICard label="Avg Processing Time (sec)" value={kpis.avg_processing_time_sec} icon={Clock} />
        </div>
      </div>

      {/* Pipeline Flow */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Event Pipeline Flow (24h)</h2>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-around gap-2 overflow-x-auto pb-4">
            <PipelineStage label="Leads Created" count={pipeline_stages.lead_created} />
            <div className="text-2xl text-muted-foreground">→</div>
            <PipelineStage label="Events Generated" count={pipeline_stages.events_generated} />
            <div className="text-2xl text-muted-foreground">→</div>
            <PipelineStage label="Automation Jobs" count={pipeline_stages.automation_jobs} />
            <div className="text-2xl text-muted-foreground">→</div>
            <PipelineStage label="Messages Sent" count={pipeline_stages.messages_sent} />
            <div className="text-2xl text-muted-foreground">→</div>
            <PipelineStage label="Webhooks Sent" count={pipeline_stages.webhooks_sent} />
          </div>
        </div>
      </div>

      {/* Automation Performance & Event Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automation Status */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Automation Jobs
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Queued</span>
              <span className="font-bold text-foreground">{automation.queued}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Processing</span>
              <span className="font-bold text-foreground">{automation.processing}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Completed</span>
              <span className="font-bold text-green-600">{automation.completed}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-muted-foreground">Failed</span>
              <span className="font-bold text-red-600">{automation.failed}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Success Rate</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full" style={{ width: `${automation.success_rate_percent}%`, background: '#00AEEF' }} />
              </div>
              <span className="font-bold text-sm">{automation.success_rate_percent}%</span>
            </div>
          </div>
        </div>

        {/* Event Breakdown */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-bold text-foreground mb-4">Communication Events (24h)</h3>
          <div>
            <EventBreakdownRow label="SMS Sent" count={events_breakdown.sms_sent} />
            <EventBreakdownRow label="Email Sent" count={events_breakdown.email_sent} />
            <EventBreakdownRow label="Webhooks Sent" count={events_breakdown.webhook_sent} />
            <EventBreakdownRow label="Leads Created" count={events_breakdown.lead_created} />
            <EventBreakdownRow label="Automations Triggered" count={events_breakdown.automation_triggered} />
          </div>
        </div>
      </div>

      {/* Lead Flow */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-bold text-foreground mb-4">Lead Flow (24h)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{lead_flow.new_leads_24h}</p>
            <p className="text-xs font-medium text-muted-foreground mt-1">New Leads</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{lead_flow.contacted}</p>
            <p className="text-xs font-medium text-muted-foreground mt-1">Contacted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{lead_flow.replied}</p>
            <p className="text-xs font-medium text-muted-foreground mt-1">Replied</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{lead_flow.booked}</p>
            <p className="text-xs font-medium text-muted-foreground mt-1">Booked</p>
          </div>
        </div>
      </div>

      {/* Errors & Issues */}
      {recent_errors.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Recent Errors ({recent_errors.length})
          </h3>
          <div className="space-y-3">
            {recent_errors.map((err, idx) => (
              <ErrorItem key={idx} error={err} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}