import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, PhoneOff, RefreshCw, TrendingUp, Loader2, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ConversionFunnel from './ConversionFunnel';

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

  const handleExport = async () => {
    try {
      const res = await base44.functions.invoke('exportLeadMetricsCSV', {});
      const csv = res.data;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `lead-metrics-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const safeSetMetrics = (data) => { if (isMounted) setMetrics(data); };
    const safeSetError = (msg) => { if (isMounted) setError(msg); };
    const safeSetLoading = (v) => { if (isMounted) setLoading(v); };
    const safeSetUpdated = (v) => { if (isMounted) setLastUpdated(v); };

    const load = async () => {
      try {
        safeSetLoading(true);
        const res = await base44.functions.invoke('getClientLeadFlowMetrics', {});
        safeSetMetrics(res.data);
        safeSetUpdated(new Date());
        safeSetError('');
      } catch (err) {
        safeSetError('Failed to load metrics');
      } finally {
        safeSetLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6">
       {/* Header */}
       <div className="flex items-center justify-between gap-3">
         <div>
           <h3 className="text-xl font-semibold text-foreground">Leads Overview</h3>
           <p className="text-sm text-muted-foreground mt-1">Your lead pipeline metrics</p>
         </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => { setLoading(true); base44.functions.invoke('getClientLeadFlowMetrics', {}).then(res => { setMetrics(res.data); setLastUpdated(new Date()); setError(''); }).catch(() => setError('Failed to load metrics')).finally(() => setLoading(false)); }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>
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

      {/* Conversion Funnel */}
      <div className="mt-8 border-t border-border pt-8">
        <ConversionFunnel />
      </div>
    </div>
  );
}