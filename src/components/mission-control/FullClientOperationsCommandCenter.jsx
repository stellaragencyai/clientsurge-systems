import React, { useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, Clock, TrendingUp, Users,
  Zap, BarChart3, AlertCircle, RefreshCw, Filter
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

function StatCard({ icon: Icon, label, value, color = 'text-primary' }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 flex items-start gap-3">
      <div className={`p-2.5 rounded-lg ${color === 'text-green-600' ? 'bg-green-50' : color === 'text-red-600' ? 'bg-red-50' : 'bg-blue-50'}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    healthy: 'bg-green-100 text-green-700',
    degraded: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100'}`}>
      {status.toUpperCase()}
    </span>
  );
}

function ClientCard({ client }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-foreground">{client.business_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{client.email}</p>
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold capitalize ${
          client.workspace_status === 'active' ? 'bg-green-50 text-green-700' :
          client.workspace_status === 'onboarding' ? 'bg-blue-50 text-blue-700' :
          'bg-gray-50 text-gray-600'
        }`}>
          {client.workspace_status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded bg-muted/30 p-2">
          <p className="text-muted-foreground font-medium">Leads</p>
          <p className="text-sm font-bold text-foreground">{client.leads_total}</p>
        </div>
        <div className="rounded bg-muted/30 p-2">
          <p className="text-muted-foreground font-medium">Messages</p>
          <p className="text-sm font-bold text-foreground">{client.messages_sent}</p>
        </div>
        <div className="rounded bg-muted/30 p-2">
          <p className="text-muted-foreground font-medium">Plan</p>
          <p className="text-sm font-bold text-foreground capitalize">{client.plan_type}</p>
        </div>
      </div>
    </div>
  );
}

function LeadPriorityItem({ lead, rank }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: 'rgba(0,174,239,0.1)', color: '#00AEEF' }}>
        {rank}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{lead.business_name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{lead.email}</p>
      </div>
      <span className={`inline-flex text-xs font-semibold px-2 py-1 rounded ${
        lead.intelligence_segment === 'HOT_LEADS' ? 'bg-red-50 text-red-700' :
        lead.intelligence_segment === 'HIGH_INTENT' ? 'bg-orange-50 text-orange-700' :
        'bg-blue-50 text-blue-700'
      }`}>
        {lead.intelligence_segment?.replace(/_/g, ' ')}
      </span>
    </div>
  );
}

function BlockerItem({ blocker }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-700">{blocker.client}</p>
          <p className="text-xs text-red-600 mt-0.5">{blocker.issue}</p>
        </div>
      </div>
    </div>
  );
}

export default function FullClientOperationsCommandCenter() {
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [obsRes, clientRes, leadsRes] = await Promise.all([
        base44.functions.invoke('getSystemObservabilityMetrics', {}),
        base44.functions.invoke('getPlatformClientsOverview', {}),
        base44.asServiceRole.entities.Leads.filter({}, '-intelligence_score', 100),
      ]);

      setData(obsRes?.data);
      setClients(clientRes?.data?.clients || []);
      setLeads(leadsRes || []);
    } catch (err) {
      console.error('Failed to fetch command center data:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading operations command center...</div>;
  }

  const observability = data?.observability || {};
  const kpis = observability.kpis || {};
  const leadFlow = observability.lead_flow_24h || {};
  const healthIndicators = observability.health_indicators || {};

  // Calculate health status
  const healthScore = (healthIndicators.automation_health?.success_rate || 0) +
    (100 - (healthIndicators.messaging_health?.sms_failure_rate || 0)) +
    (100 - (healthIndicators.messaging_health?.email_failure_rate || 0));
  const avgHealth = Math.round(healthScore / 3);
  const healthStatus = avgHealth >= 80 ? 'healthy' : avgHealth >= 50 ? 'degraded' : 'critical';

  // Get blockers
  const blockers = [];
  clients.forEach(c => {
    if (c.churn_risk === 'high') {
      blockers.push({ client: c.business_name, issue: `High churn risk — requires immediate attention` });
    }
    if (c.workspace_status === 'paused') {
      blockers.push({ client: c.business_name, issue: `Workspace paused — activate to resume operations` });
    }
  });

  // Top priority leads
  const priorityLeads = leads
    .filter(l => l.intelligence_segment && ['HOT_LEADS', 'HIGH_INTENT'].includes(l.intelligence_segment))
    .sort((a, b) => (b.intelligence_score || 0) - (a.intelligence_score || 0))
    .slice(0, 5);

  // Stale leads
  const staleLeads = leads
    .filter(l => l.last_activity_at && new Date(l.last_activity_at).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            Client Operations Command Center
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Unified executive dashboard — all systems overview</p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Executive Overview */}
      <div className="rounded-lg border border-border bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Executive Overview</h3>
          <StatusBadge status={healthStatus} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={Users} label="Active Clients" value={clients.length} />
          <StatCard icon={TrendingUp} label="Total Leads" value={leads.length.toLocaleString()} />
          <StatCard icon={Zap} label="Automations" value={kpis.total_jobs || 0} />
          <StatCard icon={CheckCircle2} label="Success Rate" value={`${healthIndicators.automation_health?.success_rate || 0}%`} color="text-green-600" />
          <StatCard icon={Activity} label="Events (24h)" value={kpis.total_events_24h || 0} />
        </div>
      </div>

      {/* Client Operations & Lead Operations (Side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Operations */}
        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-foreground">Active Clients ({clients.filter(c => c.workspace_status === 'active').length})</h3>
            <Filter className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {clients.slice(0, 8).map(client => (
              <ClientCard key={client.client_id} client={client} />
            ))}
          </div>
        </div>

        {/* Lead Distribution */}
        <div className="rounded-lg border border-border bg-white p-6">
          <h3 className="font-bold text-foreground mb-4">Lead Distribution</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-foreground">HOT (80-100)</span>
                <span className="font-bold text-red-600">{leads.filter(l => l.intelligence_score >= 80).length}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (leads.filter(l => l.intelligence_score >= 80).length / leads.length) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-foreground">HIGH INTENT (65-79)</span>
                <span className="font-bold text-orange-600">{leads.filter(l => l.intelligence_score >= 65 && l.intelligence_score < 80).length}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-orange-500" style={{ width: `${Math.min(100, (leads.filter(l => l.intelligence_score >= 65 && l.intelligence_score < 80).length / leads.length) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-foreground">ENGAGED (50-64)</span>
                <span className="font-bold text-blue-600">{leads.filter(l => l.intelligence_score >= 50 && l.intelligence_score < 65).length}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (leads.filter(l => l.intelligence_score >= 50 && l.intelligence_score < 65).length / leads.length) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-foreground">NURTURE / DORMANT (0-49)</span>
                <span className="font-bold text-gray-600">{leads.filter(l => l.intelligence_score < 50).length}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gray-400" style={{ width: `${Math.min(100, (leads.filter(l => l.intelligence_score < 50).length / leads.length) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automation & Event Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automation Operations */}
        <div className="rounded-lg border border-border bg-white p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Automation Health
          </h3>
          <div className="space-y-3">
            <div className="rounded p-3 bg-gray-50">
              <p className="text-xs text-muted-foreground font-medium mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-foreground">{healthIndicators.automation_health?.success_rate || 0}%</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded p-3 bg-blue-50">
                <p className="text-xs text-blue-700 font-medium">Processing</p>
                <p className="text-lg font-bold text-blue-900">{kpis.total_jobs - kpis.successful_jobs - kpis.failed_jobs || 0}</p>
              </div>
              <div className="rounded p-3 bg-green-50">
                <p className="text-xs text-green-700 font-medium">Completed</p>
                <p className="text-lg font-bold text-green-900">{kpis.successful_jobs || 0}</p>
              </div>
              <div className="rounded p-3 bg-red-50">
                <p className="text-xs text-red-700 font-medium">Failed</p>
                <p className="text-lg font-bold text-red-900">{kpis.failed_jobs || 0}</p>
              </div>
              <div className="rounded p-3 bg-gray-50">
                <p className="text-xs text-gray-700 font-medium">Total</p>
                <p className="text-lg font-bold text-gray-900">{kpis.total_jobs || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Event System Health */}
        <div className="rounded-lg border border-border bg-white p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Event System Health (24h)
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">Total Events</p>
              <p className="text-lg font-bold text-foreground">{kpis.total_events_24h || 0}</p>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">SMS Sent</p>
              <p className="text-lg font-bold" style={{ color: '#00AEEF' }}>{observability.events_breakdown?.sms_sent || 0}</p>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">Emails Sent</p>
              <p className="text-lg font-bold text-blue-600">{observability.events_breakdown?.email_sent || 0}</p>
            </div>
            <div className="flex items-center justify-between py-2">
              <p className="text-sm font-medium text-foreground">Failed Events</p>
              <p className="text-lg font-bold text-red-600">{kpis.failed_events || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Blockers & Risks */}
      {blockers.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="font-bold text-red-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Active Blockers & Risks ({blockers.length})
          </h3>
          <div className="space-y-3">
            {blockers.map((blocker, idx) => (
              <BlockerItem key={idx} blocker={blocker} />
            ))}
          </div>
        </div>
      )}

      {/* Priority Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Priority Leads */}
        {priorityLeads.length > 0 && (
          <div className="rounded-lg border border-border bg-white p-6">
            <h3 className="font-bold text-foreground mb-4">🔥 Top Priority Leads</h3>
            <div className="space-y-1">
              {priorityLeads.map((lead, idx) => (
                <LeadPriorityItem key={lead.id} lead={lead} rank={idx + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Stale Leads Needing Attention */}
        {staleLeads.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h3 className="font-bold text-amber-900 mb-4">⚠️ Stale Leads (7+ days inactive)</h3>
            <div className="space-y-2">
              {staleLeads.map((lead) => (
                <div key={lead.id} className="text-sm py-2 border-b border-amber-200 last:border-0">
                  <p className="font-medium text-foreground">{lead.business_name}</p>
                  <p className="text-xs text-muted-foreground">{lead.email}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Operational Statistics */}
      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="font-bold text-foreground mb-4">Operational Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Avg Client Health</p>
            <p className="text-2xl font-bold text-foreground mt-2">{Math.round(clients.reduce((a, c) => a + (c.health_score || 0), 0) / clients.length || 0)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Leads per Client</p>
            <p className="text-2xl font-bold text-foreground mt-2">{Math.round(leads.length / clients.length || 0)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Conversion Rate</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{Math.round((leads.filter(l => l.status === 'Booked' || l.status === 'Closed').length / leads.length) * 100 || 0)}%</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Revenue</p>
            <p className="text-2xl font-bold text-foreground mt-2">${clients.reduce((a, c) => a + (c.revenue_total || 0), 0).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}