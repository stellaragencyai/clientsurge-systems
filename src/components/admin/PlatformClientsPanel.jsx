import React, { useEffect, useState } from 'react';
import { Users, DollarSign, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function MetricCard({ label, value, icon: Icon, color = 'text-primary' }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg" style={{ background: 'rgba(0, 174, 239, 0.08)' }}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      </div>
    </div>
  );
}

function PlanBadge({ plan }) {
  const colors = {
    starter: 'bg-gray-100 text-gray-700',
    growth: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-green-100 text-green-700',
    trial: 'bg-orange-100 text-orange-700',
    unknown: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize ${colors[plan] || colors.unknown}`}>
      {plan}
    </span>
  );
}

function StatusBadge({ status }) {
  const colors = {
    active: 'bg-green-50 text-green-700',
    live: 'bg-green-50 text-green-700',
    onboarding: 'bg-blue-50 text-blue-700',
    setup: 'bg-blue-50 text-blue-700',
    paused: 'bg-yellow-50 text-yellow-700',
    churned: 'bg-red-50 text-red-700',
    cancelled: 'bg-red-50 text-red-700',
    unknown: 'bg-gray-50 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize ${colors[status] || colors.unknown}`}>
      {status}
    </span>
  );
}

function ChurnBadge({ risk }) {
  if (!risk || risk === 'low') return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
      risk === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
    }`}>
      <AlertTriangle className="w-3 h-3" />
      {risk} risk
    </span>
  );
}

export default function PlatformClientsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getPlatformClientsOverview', {});
      setData(res?.data);
    } catch (err) {
      console.error('Failed to fetch platform clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading client accounts...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-600">Failed to load platform overview.</div>;
  }

  const { platform_summary, clients } = data;

  const filteredClients = (clients || []).filter(c => {
    if (search && !c.business_name?.toLowerCase().includes(search.toLowerCase()) &&
        !c.email?.toLowerCase().includes(search.toLowerCase())) return false;
    if (planFilter && c.plan_type !== planFilter) return false;
    if (statusFilter && c.workspace_status !== statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Platform Clients
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Multi-tenant SaaS — all client workspaces</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Platform Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Total Clients" value={platform_summary.total_clients} icon={Users} />
        <MetricCard label="Active" value={platform_summary.active_clients} icon={TrendingUp} color="text-green-600" />
        <MetricCard label="Total Leads" value={platform_summary.total_leads_across_clients.toLocaleString()} icon={Users} />
        <MetricCard label="Total Revenue" value={`$${platform_summary.total_revenue.toLocaleString()}`} icon={DollarSign} />
        <MetricCard label="Churn Risk" value={platform_summary.high_churn_risk_count} icon={AlertTriangle} color="text-red-600" />
      </div>

      {/* Plan Distribution */}
      {Object.keys(platform_summary.plan_distribution).length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-bold text-foreground mb-3">Plan Distribution</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(platform_summary.plan_distribution).map(([plan, count]) => (
              <div key={plan} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border">
                <PlanBadge plan={plan} />
                <span className="text-sm font-bold text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border border-border bg-white p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 rounded border border-border text-sm text-foreground flex-1 min-w-[180px]"
        />
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          className="px-3 py-2 rounded border border-border text-sm font-medium text-foreground bg-white cursor-pointer"
        >
          <option value="">All Plans</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
          <option value="trial">Trial</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded border border-border text-sm font-medium text-foreground bg-white cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="onboarding">Onboarding</option>
          <option value="paused">Paused</option>
          <option value="churned">Churned</option>
        </select>
      </div>

      {/* Client Table */}
      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <div className="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-foreground">Client Accounts ({filteredClients.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Business</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Industry</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Plan</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Leads</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Messages</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Revenue</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Risk</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client, idx) => (
                <tr key={client.client_id || idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{client.business_name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{client.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{client.industry}</td>
                  <td className="px-4 py-3 text-center"><PlanBadge plan={client.plan_type} /></td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={client.workspace_status !== 'unknown' ? client.workspace_status : client.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{client.leads_total}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{client.messages_sent}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {client.revenue_total > 0 ? `$${client.revenue_total.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ChurnBadge risk={client.churn_risk} />
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No clients match the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}