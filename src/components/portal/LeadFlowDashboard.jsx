import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, PhoneOff, RefreshCw, TrendingUp, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function MetricCard({ icon: Icon, label, value, trend, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };

  return (
    <div className={`rounded-xl border p-6 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
        <Icon className="w-5 h-5 opacity-60" />
      </div>
      <p className="text-4xl font-bold">{value}</p>
      {trend && (
        <p className="mt-2 text-xs flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </p>
      )}
    </div>
  );
}

export default function LeadFlowDashboard() {
  const [metrics, setMetrics] = useState({
    active_leads: 0,
    appointments_booked: 0,
    missed_calls_recovered: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await base44.functions.invoke('getClientLeadFlowMetrics', {});
      setMetrics(res.data);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      setError('Failed to load metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Lead Flow Summary</h3>
          <p className="text-sm text-muted-foreground mt-1">Real-time metrics across all your leads</p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          icon={Activity}
          label="Active Leads"
          value={metrics.active_leads}
          trend="Leads in pipeline"
          color="blue"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Appointments Booked"
          value={metrics.appointments_booked}
          trend="Confirmed bookings"
          color="green"
        />
        <MetricCard
          icon={PhoneOff}
          label="Missed Calls Recovered"
          value={metrics.missed_calls_recovered}
          trend="Last 7 days"
          color="purple"
        />
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <p className="text-xs text-muted-foreground text-right">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}