import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SystemHealthModule() {
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState({
    total_events: 0,
    failed: 0,
    success_rate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await base44.admin.entities.CommunicationEvent.filter(
          {},
          '-created_date',
          50
        );
        setEvents(result || []);

        const failed = (result || []).filter((e) => e.status === 'failed').length;
        const total = (result || []).length;

        setMetrics({
          total_events: total,
          failed,
          success_rate: total > 0 ? (((total - failed) / total) * 100).toFixed(1) : 0,
        });
      } catch (e) {
        console.error('Failed to load system health:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Real-time subscription
    const unsubscribe = base44.admin.entities.CommunicationEvent.subscribe((event) => {
      if (event.type === 'create') {
        setEvents((prev) => [event.data, ...prev.slice(0, 49)]);
      }
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading system health...</div>;
  }

  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-start gap-4 mb-2">
          <div className="w-1.5 h-12 bg-primary rounded-sm flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">System Health</h1>
            <p className="text-sm text-muted-foreground mt-2">Event processing and delivery metrics.</p>
          </div>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground font-semibold">Total Events</p>
          <p className="text-4xl font-bold text-primary mt-2">{metrics.total_events}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground font-semibold">Success Rate</p>
          <p className="text-4xl font-bold text-emerald-600 mt-2">{metrics.success_rate}%</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground font-semibold">Failed Events</p>
          <p className={`text-4xl font-bold mt-2 ${metrics.failed > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {metrics.failed}
          </p>
        </div>
      </div>

      {/* Event Log */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border p-6">
          <h2 className="text-xl font-semibold text-foreground">Recent Events</h2>
        </div>
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {events.map((event) => (
            <div key={event.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                {event.status === 'failed' ? (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground capitalize">
                    {(event.event_type || 'event').replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.channel} • {new Date(event.created_date).toLocaleString()}
                  </p>
                  {event.error_message && (
                    <p className="text-xs text-red-600 mt-2">{event.error_message}</p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded flex-shrink-0 ${
                  event.status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : event.status === 'delivered'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {event.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}