import { AlertTriangle, Zap, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PortalHealthAlerts({ clientId, orderId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealthAlerts = async () => {
      try {
        const response = await fetch(`/api/system-health-alerts?order_id=${orderId}`, {
          method: 'GET',
        });
        if (response.ok) {
          const data = await response.json();
          setAlerts(data.alerts || []);
        }
      } catch (err) {
        console.error('Failed to fetch health alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthAlerts();
    const interval = setInterval(fetchHealthAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) return <div className="h-20 bg-muted rounded-lg animate-pulse" />;
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {alerts.map((alert) => {
        const severity = alert.severity || 'warning';
        const Icon = severity === 'critical' ? AlertTriangle : Zap;
        const bgColor = severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
        const textColor = severity === 'critical' ? 'text-red-800' : 'text-amber-800';
        const iconColor = severity === 'critical' ? 'text-red-600' : 'text-amber-600';

        return (
          <div key={alert.id} className={`rounded-lg border ${bgColor} p-4`}>
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1">
                <p className={`font-semibold ${textColor}`}>{alert.title}</p>
                <p className={`text-sm ${textColor} opacity-90 mt-1`}>{alert.message}</p>
                {alert.action && (
                  <a
                    href={alert.action_url || '#'}
                    className="text-xs font-semibold mt-2 inline-block underline hover:opacity-75"
                  >
                    {alert.action} →
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}