import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, TrendingUp, Users, Zap, DollarSign, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function MetricCard({ icon: Icon, label, value, subtitle, color = 'text-blue-600' }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max = 100, color = 'bg-blue-600' }) {
  const percentage = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs font-semibold text-muted-foreground">{percentage}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-300`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function StatusAlert({ type, title, message }) {
  const colors = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-green-50 text-green-800 border-green-200',
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[type] || colors.info}`}>
      <p className="font-semibold text-sm mb-1">{title}</p>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function parseTruthJson(portal) {
  if (!portal?.data_truth_json) return null;
  try {
    return JSON.parse(portal.data_truth_json);
  } catch {
    return null;
  }
}

export default function ClientExperienceDashboard() {
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dataTruth = useMemo(() => parseTruthJson(portal), [portal]);
  const metricsVerified = portal?.metrics_verified === true || dataTruth?.performance_verified === true;

  useEffect(() => {
    fetchPortal();
  }, []);

  const fetchPortal = async () => {
    try {
      const user = await base44.auth.me();
      if (!user?.client_id) {
        setError('Not accessible from this context');
        setLoading(false);
        return;
      }

      const portals = await base44.entities.ClientExperiencePortal.filter(
        { client_id: user.client_id },
        '-created_date', 1
      );

      if (portals?.length > 0) {
        setPortal(portals[0]);
      } else {
        setError('Portal not yet initialized. Please contact support.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <StatusAlert type="error" title="Error" message={error} />
      </div>
    );
  }

  if (!portal) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <StatusAlert type="info" title="Coming Soon" message="Your portal is being set up. Check back shortly." />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{portal.business_name}</h1>
        <p className="text-muted-foreground mt-1">Your automation performance dashboard</p>
        {portal.last_synced_at && (
          <p className="text-xs text-muted-foreground mt-3">Last updated: {new Date(portal.last_synced_at).toLocaleString()}</p>
        )}
      </div>

      {(portal.data_truth_status && portal.data_truth_status !== 'verified') && (
        <StatusAlert
          type="warning"
          title="Dashboard Data Not Fully Verified"
          message={dataTruth?.warning || 'Some dashboard values are waiting on source records. Empty metrics should not be treated as confirmed zero activity.'}
        />
      )}

      {portal.blockers_count > 0 && (
        <StatusAlert
          type="error"
          title={`${portal.blockers_count} Item(s) Need Attention`}
          message="Please review and resolve the blockers below to progress."
        />
      )}

      {portal.onboarding_stage === 'live' && portal.automation_health_status === 'healthy' && metricsVerified && (
        <StatusAlert
          type="success"
          title="System Active"
          message="Your automations are live and backed by recent activity records."
        />
      )}

      {portal.onboarding_stage !== 'live' && (
        <StatusAlert
          type="info"
          title={`Setup in Progress: ${portal.onboarding_stage?.replace(/_/g, ' ')}`}
          message={`Your system is ${portal.onboarding_completion_percent}% complete. ${portal.ai_recommendations || ''}`}
        />
      )}

      {portal.show_overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard icon={Users} label="Leads Received" value={portal.total_leads_received} subtitle={metricsVerified ? `${portal.leads_contacted} contacted` : 'Awaiting verified source data'} />
          <MetricCard icon={TrendingUp} label="Booking Rate" value={`${portal.conversion_rate}%`} subtitle={metricsVerified ? `${portal.leads_booked} booked` : 'Not yet verified'} color="text-green-600" />
          <MetricCard icon={DollarSign} label="Revenue Generated" value={`$${portal.revenue_generated?.toFixed(0) || '0'}`} subtitle={metricsVerified ? 'Total attributed' : 'Not yet verified'} color="text-emerald-600" />
          <MetricCard icon={Zap} label="Response Time" value={`${portal.avg_response_time_minutes}m`} subtitle={metricsVerified ? 'Average' : 'Not yet verified'} color="text-orange-600" />
          <MetricCard icon={AlertTriangle} label="System Health" value={portal.automation_health_status} subtitle={metricsVerified ? 'Current status' : 'Awaiting activity'} color={portal.automation_health_status === 'healthy' && metricsVerified ? 'text-green-600' : 'text-yellow-600'} />
        </div>
      )}

      {portal.show_onboarding_progress && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Setup Progress</h3>
          <div className="space-y-4">
            <ProgressBar label="Setup Completion" value={portal.onboarding_completion_percent} color="bg-blue-600" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mt-6">
              <div className="text-center"><p className="font-semibold text-foreground">{portal.onboarding_stage}</p><p className="text-muted-foreground">Current Stage</p></div>
              <div className="text-center"><p className="font-semibold text-foreground">{portal.activation_status}</p><p className="text-muted-foreground">Activation</p></div>
              <div className="text-center"><p className="font-semibold text-foreground">{portal.blockers_count}</p><p className="text-muted-foreground">Open Issues</p></div>
              <div className="text-center"><p className="font-semibold text-foreground">{portal.automation_health_status}</p><p className="text-muted-foreground">System Health</p></div>
            </div>
          </div>
        </div>
      )}

      {(portal.ai_summary || portal.ai_recommendations) && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Insights & Recommendations</h3>
          {portal.ai_summary && <div><p className="text-sm text-muted-foreground mb-2">Summary</p><p className="text-foreground">{portal.ai_summary}</p></div>}
          {portal.ai_recommendations && <div><p className="text-sm text-muted-foreground mb-2">Next Steps</p><p className="text-foreground">{portal.ai_recommendations}</p></div>}
        </div>
      )}

      {portal.recent_activity_summary && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">Recent Activity</h3>
          <p className="text-foreground">{portal.recent_activity_summary}</p>
        </div>
      )}
    </div>
  );
}
