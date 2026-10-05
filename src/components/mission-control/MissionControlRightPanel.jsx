import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye, RefreshCw, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MissionControlRightPanel() {
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [alertList, eventList] = await Promise.all([
          base44.admin.entities.Alert.filter({}, '-created_date', 10),
          base44.admin.entities.CommunicationEvent.filter({}, '-created_date', 10),
        ]);
        setAlerts(alertList || []);
        setEvents(eventList || []);
      } catch (e) {
        console.error('Failed to load right panel data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'launch_blocker');

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="border-b border-border p-5 flex items-center justify-between">
        <h3 className="font-bold text-sm text-foreground">Truth + Alerts</h3>
        <button className="p-1.5 hover:bg-muted rounded transition-colors">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="border-b border-border p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-3">
              🚨 Critical ({criticalAlerts.length})
            </p>
            <div className="space-y-2">
              {criticalAlerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                  className="w-full text-left rounded-lg border border-red-200 bg-red-50 p-2.5 hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-red-900 truncate">{alert.title || 'Unknown Alert'}</p>
                      <p className="text-xs text-red-700 mt-1 line-clamp-2">{alert.description || 'No details'}</p>
                    </div>
                  </div>
                  {expandedAlert === alert.id && (
                    <div className="mt-2 pt-2 border-t border-red-200 text-xs text-red-800">
                      <p><strong>Type:</strong> {alert.alert_type}</p>
                      <p><strong>Status:</strong> {alert.status}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Truth Stream */}
        <div className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Last Events
          </p>
          <div className="space-y-2">
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="text-xs text-muted-foreground">No events yet</p>
            ) : (
              events.map((event) => (
                <button
                  key={event.id}
                  className="w-full text-left rounded-lg border border-border bg-muted/30 p-2.5 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <Eye className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate capitalize">
                        {(event.event_type || 'event').replace(/_/g, ' ')}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {event.channel} • {new Date(event.created_date).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${
                      event.status === 'sent' || event.status === 'delivered'
                        ? 'bg-green-100 text-green-700'
                        : event.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}