import React, { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, Users, Zap, Activity, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function PriorityItem({ item, index }) {
  const priorityColors = {
    'High': 'bg-red-50 border-red-200 text-red-900',
    'Medium': 'bg-amber-50 border-amber-200 text-amber-900',
    'Low': 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const areaIcons = {
    'Leads': <Users className="w-4 h-4" />,
    'Clients': <AlertCircle className="w-4 h-4" />,
    'Automation': <Zap className="w-4 h-4" />,
    'Messaging': <Activity className="w-4 h-4" />,
  };

  return (
    <div className={`rounded-lg border p-4 ${priorityColors[item.priority]}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-black/10 text-xs font-bold">
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm opacity-85 mt-1">{item.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {areaIcons[item.area]}
              <span className="text-xs font-bold uppercase">{item.area}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthStatusBadge({ status }) {
  const statusColors = {
    'Healthy': 'bg-green-50 text-green-700 border-green-200',
    'Degraded': 'bg-amber-50 text-amber-700 border-amber-200',
    'Needs Attention': 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border ${statusColors[status]}`}>
      {status}
    </span>
  );
}

function HealthCard({ icon: Icon, label, status, detail }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(0, 174, 239, 0.08)' }}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-1">{detail}</p>
          </div>
        </div>
        <HealthStatusBadge status={status} />
      </div>
    </div>
  );
}

export default function AssistedOperationsMode() {
  const [priorities, setPriorities] = useState([]);
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [observability, setObservability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [obsRes, clientRes, leadsRes, pipelineRes] = await Promise.all([
        base44.functions.invoke('getSystemObservabilityMetrics', {}),
        base44.functions.invoke('getPlatformClientsOverview', {}),
        base44.asServiceRole.entities.Leads.filter({}, '-intelligence_score', 100),
        base44.functions.invoke('getLeadPipelineSummary', {}),
      ]);

      setObservability(obsRes?.data?.observability);
      setClients(clientRes?.data?.clients || []);
      setLeads(leadsRes || []);

      // Compute operational priorities
      const computedPriorities = computePriorities(leadsRes, clientRes?.data?.clients, obsRes?.data?.observability);
      setPriorities(computedPriorities);
    } catch (err) {
      console.error('Failed to fetch operations data:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const computePriorities = (leadsList, clientsList, obs) => {
    const items = [];

    // High-intent uncontacted leads
    const hotUncontacted = (leadsList || [])
      .filter(l => l.intelligence_score >= 65 && !l.last_contacted_at)
      .length;
    if (hotUncontacted > 0) {
      items.push({
        title: `${hotUncontacted} High-Intent Leads Uncontacted`,
        description: 'These leads show strong buying signals but haven\'t been reached yet.',
        area: 'Leads',
        priority: hotUncontacted > 5 ? 'High' : 'Medium',
      });
    }

    // Stale high-value leads
    const staleHotLeads = (leadsList || [])
      .filter(l => l.intelligence_score >= 75 && l.last_activity_at && new Date(l.last_activity_at).getTime() < Date.now() - 3 * 24 * 60 * 60 * 1000)
      .length;
    if (staleHotLeads > 0) {
      items.push({
        title: `${staleHotLeads} High-Intent Leads Inactive (3+ days)`,
        description: 'Hot leads showing no activity — immediate re-engagement recommended.',
        area: 'Leads',
        priority: 'High',
      });
    }

    // Clients in onboarding delays
    const blockedClients = (clientsList || [])
      .filter(c => c.workspace_status === 'onboarding' || c.workspace_status === 'setup')
      .length;
    if (blockedClients > 0) {
      items.push({
        title: `${blockedClients} Clients in Onboarding`,
        description: 'Review and move these clients toward activation.',
        area: 'Clients',
        priority: blockedClients > 2 ? 'High' : 'Medium',
      });
    }

    // Clients with churn risk
    const churnRisk = (clientsList || [])
      .filter(c => c.churn_risk === 'high')
      .length;
    if (churnRisk > 0) {
      items.push({
        title: `${churnRisk} Clients at Churn Risk`,
        description: 'Health scores low or activity declining — intervention needed.',
        area: 'Clients',
        priority: 'High',
      });
    }

    // Automation failures
    const automationHealth = obs?.health_indicators?.automation_health?.success_rate || 100;
    if (automationHealth < 95) {
      items.push({
        title: `Automation Success Rate: ${automationHealth}%`,
        description: 'Below target threshold — investigate recent failures.',
        area: 'Automation',
        priority: automationHealth < 85 ? 'High' : 'Medium',
      });
    }

    // Messaging delivery issues
    const emailFailRate = obs?.health_indicators?.messaging_health?.email_failure_rate || 0;
    if (emailFailRate > 5) {
      items.push({
        title: `Email Failure Rate: ${emailFailRate}%`,
        description: 'Higher than expected delivery issues detected.',
        area: 'Messaging',
        priority: 'Medium',
      });
    }

    // High retry counts
    const totalRetries = obs?.kpis?.retry_count || 0;
    if (totalRetries > 50) {
      items.push({
        title: `High Retry Activity: ${totalRetries} retries`,
        description: 'Elevated retry counts suggest processing delays or intermittent failures.',
        area: 'Automation',
        priority: 'Medium',
      });
    }

    return items.sort((a, b) => {
      const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return priorityMap[b.priority] - priorityMap[a.priority];
    }).slice(0, 10);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading operational intelligence...</div>;
  }

  // Determine health statuses
  const leadHealth = (leads || []).filter(l => l.intelligence_score >= 65).length > leads.length * 0.3 ? 'Healthy' : 'Degraded';
  const automationHealth = (observability?.health_indicators?.automation_health?.success_rate || 0) >= 95 ? 'Healthy' : (observability?.health_indicators?.automation_health?.success_rate || 0) >= 80 ? 'Degraded' : 'Needs Attention';
  const eventHealth = (observability?.health_indicators?.event_queue_health?.backlog || 0) < 100 ? 'Healthy' : 'Degraded';
  const messagingHealth = (observability?.health_indicators?.messaging_health?.sms_failure_rate || 0) < 5 && (observability?.health_indicators?.messaging_health?.email_failure_rate || 0) < 5 ? 'Healthy' : 'Degraded';

  // Client attention items
  const clientsNeeding = (clients || [])
    .filter(c => c.workspace_status === 'onboarding' || c.workspace_status === 'setup' || c.churn_risk === 'high')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            Assisted Operations Mode
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Operational intelligence — system focus recommendations (read-only)</p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
        >
          <Activity className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* System Health Snapshot */}
      <div className="rounded-lg border border-border bg-gradient-to-r from-slate-50 to-gray-50 p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">System Health Snapshot</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <HealthCard
            icon={TrendingUp}
            label="Lead Pipeline"
            status={leadHealth}
            detail={`${(leads || []).filter(l => l.intelligence_score >= 65).length} qualified leads`}
          />
          <HealthCard
            icon={Zap}
            label="Automation System"
            status={automationHealth}
            detail={`${observability?.health_indicators?.automation_health?.success_rate || 0}% success rate`}
          />
          <HealthCard
            icon={Activity}
            label="Event Processing"
            status={eventHealth}
            detail={`${observability?.health_indicators?.event_queue_health?.backlog || 0} items queued`}
          />
          <HealthCard
            icon={Clock}
            label="Messaging Delivery"
            status={messagingHealth}
            detail={`${observability?.health_indicators?.messaging_health?.sms_failure_rate || 0}% SMS failures`}
          />
        </div>
      </div>

      {/* Operational Priority Stream */}
      {priorities.length > 0 && (
        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-border">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Operational Priority Stream ({priorities.length} items)
            </h3>
          </div>
          <div className="p-6 space-y-3">
            {priorities.map((item, idx) => (
              <PriorityItem key={idx} item={item} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Client Attention Panel */}
      {clientsNeeding.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Clients Needing Attention ({clientsNeeding.length})
          </h3>
          <div className="space-y-2">
            {clientsNeeding.map(client => (
              <div key={client.client_id} className="rounded p-3 bg-white border border-amber-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{client.business_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{client.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded capitalize ${
                      client.workspace_status === 'onboarding' ? 'bg-blue-100 text-blue-700' :
                      client.churn_risk === 'high' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {client.workspace_status === 'onboarding' ? 'Onboarding' :
                       client.churn_risk === 'high' ? 'Churn Risk' :
                       'Setup'}
                    </span>
                    <p className="text-xs text-muted-foreground">{client.leads_total} leads</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-white p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Automation Performance
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-medium text-foreground">Success Rate</span>
              <span className="text-lg font-bold text-green-600">{observability?.health_indicators?.automation_health?.success_rate || 0}%</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-medium text-foreground">Completed Jobs</span>
              <span className="text-lg font-bold text-foreground">{observability?.kpis?.successful_jobs || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-foreground">Failed Jobs</span>
              <span className="text-lg font-bold text-red-600">{observability?.kpis?.failed_jobs || 0}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-white p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Lead Conversion Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-medium text-foreground">Total Leads</span>
              <span className="text-lg font-bold text-foreground">{(leads || []).length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-medium text-foreground">High Intent</span>
              <span className="text-lg font-bold text-orange-600">{(leads || []).filter(l => l.intelligence_score >= 65 && l.intelligence_score < 80).length}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-foreground">Hot Leads</span>
              <span className="text-lg font-bold text-red-600">{(leads || []).filter(l => l.intelligence_score >= 80).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operations Guidance */}
      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="font-bold text-foreground mb-3">Operational Guidance</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>✓ This dashboard is read-only — recommendations only, no actions are triggered automatically.</li>
          <li>✓ Focus on high-priority items first — they impact the most leads or clients.</li>
          <li>✓ Address automation failures before scaling new outreach campaigns.</li>
          <li>✓ Monitor client health scores — early intervention prevents churn.</li>
          <li>✓ Check system health snapshot every 30 minutes during high-activity periods.</li>
        </ul>
      </div>
    </div>
  );
}