import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Zap, RefreshCw, CheckCircle2, Clock, Loader2 } from 'lucide-react';

export default function FailureHandlingMonitorPanel() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('getFailureMetrics', {});
      setMetrics(result?.data || result);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        <p className="text-sm">Could not load failure metrics</p>
      </div>
    );
  }

  const { summary, health_status, failed_jobs, recently_retried, dead_letter_queue, failed_events_by_channel } = metrics;

  const healthColor = health_status === 'healthy' ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Failed Jobs"
          value={summary.failed_jobs}
          icon={AlertTriangle}
          color="text-red-600 bg-red-50"
        />
        <SummaryCard
          label="Retried (In Progress)"
          value={summary.retried_jobs}
          icon={RefreshCw}
          color="text-blue-600 bg-blue-50"
        />
        <SummaryCard
          label="Dead Letter Queue"
          value={summary.dead_letter_count}
          icon={Zap}
          color="text-amber-600 bg-amber-50"
        />
        <SummaryCard
          label="Failed Communication Events"
          value={summary.failed_communication_events}
          icon={Clock}
          color="text-orange-600 bg-orange-50"
        />
      </div>

      {/* Health Status */}
      <div className={`rounded-lg border border-border p-4 flex items-center gap-3 ${healthColor}`}>
        <CheckCircle2 className="w-5 h-5" />
        <div>
          <p className="text-sm font-semibold">System Health: <span className="capitalize">{health_status}</span></p>
          <p className="text-xs opacity-75 mt-0.5">
            {health_status === 'healthy'
              ? 'All systems operational. No critical failures detected.'
              : 'Review failures and dead letter queue to restore health.'}
          </p>
        </div>
        <button
          onClick={loadMetrics}
          className="ml-auto p-1.5 hover:bg-white/50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Failed Jobs Section */}
      {failed_jobs.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Failed Jobs (Last 20)
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {failed_jobs.map(job => (
              <div key={job.id} className="flex items-start gap-2 p-2 rounded-lg bg-red-50/50 border border-red-100">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{job.event_type}</p>
                  <p className="text-[11px] text-muted-foreground">Attempts: {job.retry_count || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Retried Jobs */}
      {recently_retried.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Recently Retried (In Progress)
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recently_retried.map(job => (
              <div key={job.id} className="flex items-start gap-2 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                <RefreshCw className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{job.event_type}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Next retry: {job.next_retry_at ? new Date(job.next_retry_at).toLocaleString() : 'TBD'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dead Letter Queue */}
      {dead_letter_queue.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-900 mb-3">
            Dead Letter Queue (Pending Review)
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {dead_letter_queue.slice(0, 20).map(item => (
              <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-white border border-amber-100">
                <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{item.entity_name}: {item.entity_id.substring(0, 12)}...</p>
                  <p className="text-[11px] text-muted-foreground truncate">{item.error_message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Moved: {new Date(item.moved_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          {dead_letter_queue.length > 20 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">+{dead_letter_queue.length - 20} more items</p>
          )}
        </div>
      )}

      {/* Failed Events by Channel */}
      {Object.keys(failed_events_by_channel).length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Failed Communication Events by Channel
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(failed_events_by_channel).map(([channel, count]) => (
              <div key={channel} className="px-3 py-2 rounded-lg bg-orange-50 border border-orange-100">
                <p className="text-xs font-semibold text-orange-800 capitalize">{channel}</p>
                <p className="text-xs text-orange-600">{count} failed</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {summary.failed_jobs === 0 && summary.dead_letter_count === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2 opacity-60" />
          <p className="text-sm font-semibold text-foreground">No failures detected</p>
          <p className="text-xs text-muted-foreground mt-1">All automations and events are processing successfully.</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className={`rounded-lg border border-border p-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-70">{label}</p>
          <p className="text-2xl font-black mt-1">{value}</p>
        </div>
        <Icon className="w-5 h-5 opacity-60" />
      </div>
    </div>
  );
}