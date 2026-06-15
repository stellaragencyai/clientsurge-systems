import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Users, TrendingUp, DollarSign, Settings, Plus } from 'lucide-react';

export default function AgencyDashboard({ agencyId }) {
  const [agency, setAgency] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateClient, setShowCreateClient] = useState(false);

  useEffect(() => {
    const loadAgencyData = async () => {
      setLoading(true);
      try {
        const response = await base44.functions.invoke('getAgencyDashboard', {
          agency_id: agencyId,
        });
        setAgency(response.data.agency);
        setMetrics(response.data.metrics);
      } catch (error) {
        console.error('Error loading agency dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (agencyId) {
      loadAgencyData();
    }
  }, [agencyId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground font-medium">Agency not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{agency.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {agency.status === 'active' ? '✓ Active' : agency.status} • {agency.plan} plan
          </p>
        </div>
        <div className="flex gap-2">
          {agency.white_label_enabled && (
            <button className="px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 text-sm font-medium">
              <Settings className="w-4 h-4 inline mr-2" />
              Branding
            </button>
          )}
          <button
            onClick={() => setShowCreateClient(true)}
            className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Client
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border p-4 bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Clients
            </span>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {metrics?.total_clients || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {metrics?.active_count || 0} active
          </p>
        </div>

        <div className="rounded-lg border border-border p-4 bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Revenue MTD
            </span>
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            ${(metrics?.revenue_mtd || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Recurring revenue
          </p>
        </div>

        <div className="rounded-lg border border-border p-4 bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Leads
            </span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {metrics?.total_leads || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Across all clients
          </p>
        </div>

        <div className="rounded-lg border border-border p-4 bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Automations
            </span>
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {metrics?.total_automations || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Active rules
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      {metrics && (
        <div className="rounded-lg border border-border p-6 bg-card">
          <h3 className="font-semibold text-foreground mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Churn Rate
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {metrics.churn_rate?.toFixed(1) || '0'}%
                </span>
                <span className="text-xs text-muted-foreground">per month</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Net Revenue Retention
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${(metrics.nrr || 100) >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                  {metrics.nrr?.toFixed(0) || '100'}%
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Avg Revenue / Client
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  ${(metrics.revenue_per_client || 0).toLocaleString('en-US')}
                </span>
                <span className="text-xs text-muted-foreground">monthly</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* White-Label Info */}
      {agency.white_label_enabled && (
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-primary mb-2">✓ White-Label Enabled</p>
          <p className="text-xs text-muted-foreground">
            {agency.custom_domain
              ? `Custom domain: ${agency.custom_domain}`
              : 'Configure custom domain and branding in settings'}
          </p>
        </div>
      )}
    </div>
  );
}