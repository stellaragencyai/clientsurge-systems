import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Real-time alerts feed showing high-intent leads and engagement triggers.
 * Auto-refreshes and marks as read when viewed.
 */
export default function AlertsFeed({ lastUpdated = 0 }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, critical, high, new

  // Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const allAlerts = await base44.entities.Alert.list('-created_date', 50);

        // Filter based on selected filter
        let filtered = allAlerts;
        if (filter === 'critical') {
          filtered = allAlerts.filter(a => a.severity === 'critical');
        } else if (filter === 'high') {
          filtered = allAlerts.filter(a => ['critical', 'high'].includes(a.severity));
        } else if (filter === 'new') {
          filtered = allAlerts.filter(a => !a.read_status);
        }

        setAlerts(filtered);
      } catch (err) {
        console.error('[AlertsFeed] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [filter, lastUpdated]);

  const markAsRead = async (alertId) => {
    try {
      await base44.entities.Alert.update(alertId, {
        read_status: true,
        read_at: new Date().toISOString(),
      });

      // Update local state
      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, read_status: true } : a))
      );
    } catch (err) {
      console.error('[AlertsFeed] Mark as read failed:', err);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <Zap className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const unreadCount = alerts.filter(a => !a.read_status).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Live Alerts</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-1">
          {['all', 'critical', 'high', 'new'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                filter === f
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? 'All' : f === 'new' ? 'Unread' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No alerts at this time
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${getSeverityColor(alert.severity)} ${
                !alert.read_status ? 'ring-1 ring-primary/30' : ''
              }`}
              onClick={() => markAsRead(alert.id)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {alert.lead_name || alert.phone_number}
                    </p>
                    <span className="text-xs font-medium text-muted-foreground flex-shrink-0">
                      {Math.round((Date.now() - new Date(alert.created_date).getTime()) / 1000)}s ago
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    {alert.message?.substring(0, 60)}...
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/50">
                      Score: {alert.lead_score}
                    </span>
                    {alert.closing_message_sent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Closed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}