import React, { useEffect, useState } from 'react';
import { Eye, AlertTriangle, CheckCircle2, Clock, Users, Zap, MessageSquare, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PRIORITY_COLORS = {
  High: 'bg-red-50 border-red-200 text-red-700',
  Medium: 'bg-amber-50 border-amber-200 text-amber-700',
  Low: 'bg-blue-50 border-blue-200 text-blue-700',
};
const AREA_ICONS = {
  Leads: Users,
  Clients: Users,
  Automation: Zap,
  Messaging: MessageSquare,
};

function HealthPill({ status }) {
  const styles = {
    Healthy: 'bg-green-100 text-green-700 border-green-200',
    Degraded: 'bg-amber-100 text-amber-700 border-amber-200',
    'Needs Attention': 'bg-red-100 text-red-700 border-red-200',
  };
  const icons = {
    Healthy: CheckCircle2,
    Degraded: AlertTriangle,
    'Needs Attention': AlertTriangle,
  };
  const Icon = icons[status] || CheckCircle2;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${styles[status] || styles.Healthy}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
}

function PriorityStreamItem({ item }) {
  const AreaIcon = AREA_ICONS[item.area] || Zap;
  return (
    <div className={`rounded-lg border p-4 flex items-start gap-4 ${PRIORITY_COLORS[item.priority]}`}>
      <div className="p-2 rounded-lg bg-white/60 flex-shrink-0">
        <AreaIcon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="font-semibold text-sm">{item.title}</p>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${PRIORITY_COLORS[item.priority]}`}>
              {item.priority}
            </span>
            <span className="text-[11px] font-medium opacity-70">{item.area}</span>
          </div>
        </div>
        <p className="text-xs mt-1 opacity-80">{item.description}</p>
      </div>
    </div>
  );
}

function HealthRow({ label, status }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <HealthPill status={status} />
    </div>
  );
}

export default function AssistedOperationsMode() {
  const [ops, setOps] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const build = async () => {
      try {
        const [obsRes, clientRes, leadsHot, leadsStale, failedEvents] = await Promise.all([
          base44.functions.invoke('getSystemObservabilityMetrics', {}).catch(() => null),
          base44.functions.invoke('getPlatformClientsOverview', {}).catch(() => null),
          base44.asServiceRole.entities.Leads.filter({ intelligence_segment: 'HOT_LEADS' }, '-last_activity_at', 20).catch(() => []),
          base44.asServiceRole.entities.Leads.filter({ lead_state: 'DORMANT' }, '-last_activity_at', 20).catch(() => []),
          base44.asServiceRole.entities.CommunicationEvent.filter({ status: 'failed' }, '-created_date', 50).catch(() => []),
        ]);

        const obs = obsRes?.data?.observability || {};
        const kpis = obs.kpis || {};
        const healthIndicators = obs.health_indicators || {};
        const clients = clientRes?.data?.clients || [];

        // Build priority stream
        const stream = [];

        // Hot leads not recently updated
        const staleHot = (leadsHot || []).filter(l =>
          !l.last_activity_at || new Date(l.last_activity_at) < new Date(Date.now() - 48 * 60 * 60 * 1000)
        );
        if (staleHot.length > 0) {
          stream.push({
            title: `${staleHot.length} HOT lead(s) not updated in 48+ hours`,
            description: `These high-intent leads may need immediate outreach review before they go cold.`,
            priority: 'High',
            area: 'Leads',
          });
        }

        // Clients with high churn risk
        const churnClients = (clients || []).filter(c => c.churn_risk === 'high');
        if (churnClients.length > 0) {
          stream.push({
            title: `${churnClients.length} client(s) flagged with high churn risk`,
            description: `${churnClients.map(c => c.business_name).slice(0, 3).join(', ')} may require proactive retention review.`,
            priority: 'High',
            area: 'Clients',
          });
        }

        // Failed automation events
        if ((failedEvents || []).length > 10) {
          stream.push({
            title: `${(failedEvents || []).length} failed communication events detected`,
            description: `High failure count may indicate messaging delivery issues. Review logs for recurring providers.`,
            priority: 'Medium',
            area: 'Automation',
          });
        }

        // Dormant leads with no follow-up
        if ((leadsStale || []).length > 50) {
          stream.push({
            title: `${(leadsStale || []).length} dormant leads in system`,
            description: 'Large dormant lead pool. Consider reactivation campaign review.', 
            priority: 'Low',
            area: 'Leads',
          });
        }

        // Automation success rate
        const successRate = healthIndicators.automation_health?.success_rate || 100;
        if (successRate < 80) {
          stream.push({
            title: `Automation success rate is ${successRate}% — below threshold`,
            description: 'Success rate below 80% may indicate systematic job failures. Investigate failed jobs log.',
            priority: successRate < 60 ? 'High' : 'Medium',
            area: 'Automation',
          });
        }

        // Clients with blocked onboarding
        const blockedClients = (clients || []).filter(c => c.workspace_status === 'paused');
        if (blockedClients.length > 0) {
          stream.push({
            title: `${blockedClients.length} client(s) in paused state`,
            description: 'Paused workspaces may have incomplete setup steps. Review client project status.',
            priority: 'Medium',
            area: 'Clients',
          });
        }

        // System health
        const automationStatus = successRate >= 85 ? 'Healthy' : successRate >= 65 ? 'Degraded' : 'Needs Attention';
        const messagingStatus = (failedEvents || []).length < 5 ? 'Healthy' : (failedEvents || []).length < 20 ? 'Degraded' : 'Needs Attention';
        const leadPipelineStatus = staleHot.length === 0 ? 'Healthy' : staleHot.length < 5 ? 'Degraded' : 'Needs Attention';
        const eventStatus = (kpis.total_events_24h || 0) > 0 ? 'Healthy' : 'Needs Attention';

        setOps({
          priorityStream: stream,
          health: {
            leadPipeline: leadPipelineStatus,
            automation: automationStatus,
            eventProcessing: eventStatus,
            messagingDelivery: messagingStatus,
          },
          metrics: {
            totalLeads: kpis.total_leads || 0,
            automationSuccessRate: successRate,
            totalClients: clients.length,
            failedEvents: (failedEvents || []).length,
            hotLeads: (leadsHot || []).length,
          },
          blockedClients,
          churnClients,
        });
      } catch (err) {
        console.error('Assisted ops build failed:', err);
      } finally {
        setLoading(false);
      }
    };

    build();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
      </div>
    );
  }

  if (!ops) return null;

  const overallHealthScore = Object.values(ops.health).filter(s => s === 'Healthy').length;
  const overallStatus = overallHealthScore === 4 ? 'All systems nominal' : overallHealthScore >= 2 ? 'Some areas need review' : 'Multiple areas need attention';

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-5 border-b border-border flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white shadow-sm border border-border">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Assisted Operations Mode</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Read-only intelligence layer · No actions are executed</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border ${
            overallHealthScore === 4 ? 'bg-green-50 border-green-200 text-green-700' :
            overallHealthScore >= 2 ? 'bg-amber-50 border-amber-200 text-amber-700' :
            'bg-red-50 border-red-200 text-red-700'
          }`}>
            {overallStatus}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Top Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Leads', value: ops.metrics.totalLeads.toLocaleString() },
            { label: 'Hot Leads', value: ops.metrics.hotLeads, highlight: ops.metrics.hotLeads > 10 },
            { label: 'Active Clients', value: ops.metrics.totalClients },
            { label: 'Automation Rate', value: `${ops.metrics.automationSuccessRate}%`, low: ops.metrics.automationSuccessRate < 80 },
            { label: 'Failed Events', value: ops.metrics.failedEvents, highlight: ops.metrics.failedEvents > 5 },
          ].map(({ label, value, highlight, low }) => (
            <div key={label} className={`rounded-lg border p-4 text-center ${low ? 'border-red-200 bg-red-50' : highlight ? 'border-amber-200 bg-amber-50' : 'border-border bg-gray-50'}`}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold mt-2 ${low ? 'text-red-700' : highlight ? 'text-amber-700' : 'text-foreground'}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Operational Priority Stream */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">
              Operational Priority Stream ({ops.priorityStream.length})
            </h3>
            {ops.priorityStream.length === 0 ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-5 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-green-700">All systems clear</p>
                <p className="text-xs text-green-600 mt-1">No priority issues detected at this time</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {ops.priorityStream.map((item, idx) => (
                  <PriorityStreamItem key={idx} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* System Health Snapshot */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">
              System Health Snapshot
            </h3>
            <div className="rounded-lg border border-border bg-white p-4">
              <HealthRow label="Lead Pipeline" status={ops.health.leadPipeline} />
              <HealthRow label="Automation System" status={ops.health.automation} />
              <HealthRow label="Event Processing" status={ops.health.eventProcessing} />
              <HealthRow label="Messaging Delivery" status={ops.health.messagingDelivery} />
            </div>
          </div>
        </div>

        {/* Client Attention Panel */}
        {(ops.blockedClients.length > 0 || ops.churnClients.length > 0) && (
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">Client Attention Required</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ops.churnClients.slice(0, 3).map(c => (
                <div key={c.client_id} className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-800">{c.business_name}</p>
                  <p className="text-xs text-red-600 mt-1">High churn risk · Plan: {c.plan_type}</p>
                </div>
              ))}
              {ops.blockedClients.slice(0, 3).map(c => (
                <div key={c.client_id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">{c.business_name}</p>
                  <p className="text-xs text-amber-600 mt-1">Workspace paused · Needs activation review</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground italic text-center border-t border-border pt-4">
          This panel is observational only. No data is modified or actions triggered.
        </p>
      </div>
    </div>
  );
}