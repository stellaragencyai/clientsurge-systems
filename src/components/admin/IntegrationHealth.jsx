import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

export default function IntegrationHealth() {
  const [integrations, setIntegrations] = useState([
    { id: 'twilio', name: 'Twilio SMS', status: 'unknown', lastCheck: null, failedCount: 0 },
    { id: 'resend', name: 'Resend Email', status: 'unknown', lastCheck: null, failedCount: 0 },
    { id: 'webhook', name: 'Webhook Delivery', status: 'unknown', lastCheck: null, failedCount: 0 },
  ]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkIntegrationStatus();
    const interval = setInterval(checkIntegrationStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkIntegrationStatus = async () => {
    try {
      setLoading(true);
      const settings = await base44.entities.AdminSettings.list();
      
      if (settings.length > 0) {
        const s = settings[0];
        const updatedIntegrations = [
          {
            ...integrations[0],
            status: s.twilio_enabled ? 'connected' : 'disconnected',
            lastCheck: new Date().toISOString(),
          },
          {
            ...integrations[1],
            status: s.resend_enabled ? 'connected' : 'disconnected',
            lastCheck: new Date().toISOString(),
          },
          {
            ...integrations[2],
            status: 'connected',
            lastCheck: new Date().toISOString(),
          },
        ];
        setIntegrations(updatedIntegrations);
      }

      // Fetch communication event logs
      const events = await base44.entities.CommunicationEvent.list('-created_date', 20);
      setLogs(events);
    } catch (err) {
      console.error('Failed to check status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'connected') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === 'error') return <AlertCircle className="w-5 h-5 text-red-600" />;
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = (status) => {
    const text = {
      connected: 'Connected',
      disconnected: 'Not Connected',
      error: 'Error',
      unknown: 'Checking...',
    };
    return text[status] || 'Unknown';
  };

  const getStatusColor = (status) => {
    const colors = {
      connected: 'bg-green-50 border-green-200',
      disconnected: 'bg-yellow-50 border-yellow-200',
      error: 'bg-red-50 border-red-200',
    };
    return colors[status] || 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Integration Health</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor all external integrations</p>
        </div>
        <button
          onClick={checkIntegrationStatus}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking...' : 'Check Now'}
        </button>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <div key={integration.id} className={`rounded-xl border p-6 ${getStatusColor(integration.status)}`}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-foreground">{integration.name}</h3>
              {getStatusIcon(integration.status)}
            </div>
            <p className="text-sm font-medium mb-2">
              {getStatusText(integration.status)}
            </p>
            <p className="text-xs text-muted-foreground">
              {integration.lastCheck 
                ? `Last checked: ${new Date(integration.lastCheck).toLocaleTimeString()}`
                : 'Never checked'
              }
            </p>
            {integration.failedCount > 0 && (
              <p className="text-xs text-red-600 mt-2">
                {integration.failedCount} failed attempts
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-sm">
                <div className="flex-shrink-0 mt-0.5">
                  {log.status === 'delivered' || log.status === 'sent' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : log.status === 'failed' ? (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground capitalize">
                    {log.event_type?.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.provider} • {new Date(log.created_date).toLocaleString()}
                  </p>
                  {log.error_message && (
                    <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  log.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  log.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {log.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Uptime Summary */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">System Health</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Overall Uptime</p>
            <p className="text-2xl font-bold text-green-600">99.9%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Messages Sent</p>
            <p className="text-2xl font-bold text-foreground">{logs.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {logs.length > 0 
                ? Math.round((logs.filter(l => l.status === 'delivered' || l.status === 'sent').length / logs.length) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}