import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import FullClientOperationsCommandCenter from './FullClientOperationsCommandCenter';
import AssistedOperationsMode from './AssistedOperationsMode';

function MetricCard({ label, value, icon: Icon, subtext }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg" style={{ background: 'rgba(0, 174, 239, 0.08)' }}>
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

function HealthBadge({ status }) {
  const colors = {
    'Healthy': 'bg-green-50 text-green-700 border-green-200',
    'Degraded': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Issue': 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[status] || colors['Healthy']}`}>
      {status}
    </span>
  );
}

function ActivityItem({ item }) {
  if (item.type === 'event') {
    return (
      <div className="py-3 border-b border-border last:border-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground capitalize">{item.event_type}</p>
            <p className="text-xs text-muted-foreground">{item.channel} • {item.provider}</p>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${
            item.status === 'sent' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {item.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{new Date(item.timestamp).toLocaleString()}</p>
      </div>
    );
  }
  
  if (item.type === 'job') {
    return (
      <div className="py-3 border-b border-border last:border-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground capitalize">{item.job_type || 'Job'}</p>
            <p className="text-xs text-muted-foreground">Automation Job</p>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${
            item.status === 'completed' ? 'bg-green-50 text-green-700' : item.status === 'processing' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
          }`}>
            {item.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{new Date(item.timestamp).toLocaleString()}</p>
      </div>
    );
  }

  if (item.type === 'lead') {
    return (
      <div className="py-3 border-b border-border last:border-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{item.business_name || 'New Lead'}</p>
            <p className="text-xs text-muted-foreground capitalize">{item.status}</p>
          </div>
          <span className="text-xs font-semibold text-primary">Lead</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{new Date(item.timestamp).toLocaleString()}</p>
      </div>
    );
  }
}

export default function SystemObservabilityDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await base44.functions.invoke('getSystemObservabilityMetrics', {});
        setMetrics(res?.data);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading system metrics...</div>;
  }

  if (!metrics) {
    return <div className="p-8 text-center text-red-600">Failed to load observability data.</div>;
  }

  const { core_metrics, lead_flow_24h, health_indicators, activity_feed } = metrics;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-8 h-8 text-primary" />
          System Observability
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time system health and activity monitoring</p>
      </div>

      {/* ASSISTED OPERATIONS MODE */}
      <AssistedOperationsMode />

      {/* FULL CLIENT OPERATIONS COMMAND CENTER */}
      <FullClientOperationsCommandCenter />

      {/* Core Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Core Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricCard label="Total Leads" value={core_metrics.total_leads} icon={Zap} />
          <MetricCard label="Total Events" value={core_metrics.total_events} icon={Activity} />
          <MetricCard label="Total Jobs" value={core_metrics.total_jobs} icon={CheckCircle2} />
          <MetricCard label="Success Rate" value={`${core_metrics.success_rate}%`} icon={CheckCircle2} />
          <MetricCard label="Failed Events" value={core_metrics.failed_events} icon={AlertTriangle} />
        </div>
      </div>

      {/* Lead Flow & Health Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Flow */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Lead Flow (24h)</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">New Leads</span>
              <span className="text-lg font-bold text-foreground">{lead_flow_24h.new_leads}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Contacted</span>
              <span className="text-lg font-bold text-foreground">{lead_flow_24h.contacted}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Responded</span>
              <span className="text-lg font-bold text-foreground">{lead_flow_24h.responded}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-muted-foreground">Booked</span>
              <span className="text-lg font-bold text-foreground">{lead_flow_24h.booked}</span>
            </div>
          </div>
        </div>

        {/* Health Indicators */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Messaging</span>
              <HealthBadge status={health_indicators.messaging_health.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Automation</span>
              <HealthBadge status={health_indicators.automation_health.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Event Queue</span>
              <HealthBadge status={health_indicators.event_queue_health.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
        <div>
          {activity_feed.map((item, idx) => (
            <ActivityItem key={idx} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}