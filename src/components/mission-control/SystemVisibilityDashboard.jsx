import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Activity, Database, MessageSquare, Zap, TrendingUp, AlertCircle,
  CheckCircle2, Clock, Wifi, WifiOff, Eye, Building2, FileText,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MODULE_ICONS = {
  crm: <Database className="w-5 h-5" />,
  messaging: <MessageSquare className="w-5 h-5" />,
  automation: <Zap className="w-5 h-5" />,
  onboarding: <Activity className="w-5 h-5" />,
  analytics: <TrendingUp className="w-5 h-5" />,
};

const STATUS_COLORS = {
  healthy: 'text-green-600 bg-green-50 border-green-200',
  degraded: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  error: 'text-red-600 bg-red-50 border-red-200',
  connected: 'text-green-600 bg-green-50 border-green-200',
  not_configured: 'text-gray-600 bg-gray-50 border-gray-200',
};

export default function SystemVisibilityDashboard() {
  const [visibility, setVisibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  useEffect(() => {
    fetchVisibility();
    if (!autoRefresh) return;

    const interval = setInterval(fetchVisibility, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchVisibility = async () => {
    try {
      const response = await base44.functions.invoke('getSystemVisibility', { limit: 50 });
      setVisibility(response.data.visibility);
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Error fetching system visibility:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-96 bg-muted rounded-lg animate-pulse" />;
  }

  if (!visibility) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load system visibility</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">System Overview</h2>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (5s)
          </label>
          <div className="text-xs text-muted-foreground">
            Updated {Math.round((Date.now() - lastUpdated) / 1000)}s ago
          </div>
        </div>
      </div>

      {/* Module Overview */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          System Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(visibility.modules).map(([key, module]) => (
            <div
              key={key}
              className={`p-4 rounded-lg border ${STATUS_COLORS[module.status]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {MODULE_ICONS[key]}
                  {module.status === 'healthy' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                </div>
              </div>
              <div className="text-xs font-semibold line-clamp-2">{module.name}</div>
              <div className="text-2xl font-bold mt-1">{Math.round(module.metric)}</div>
              <div className="text-xs opacity-75 mt-1">
                {module.status === 'healthy' ? '✓ Healthy' : '⚠ Error'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Status */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Wifi className="w-4 h-4" />
          Integration Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(visibility.integrations).map(([key, integration]) => (
            <div
              key={key}
              className={`p-4 rounded-lg border ${STATUS_COLORS[integration.status]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{integration.name}</span>
                {integration.status === 'connected' ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
              </div>
              <div className="text-xs">
                {integration.status === 'connected' ? '✓ Connected' : '○ Not configured'}
              </div>
              {(integration.phone_number || integration.from_email || integration.mode) && (
                <div className="text-xs opacity-75 mt-1 truncate">
                  {integration.phone_number || integration.from_email || integration.mode}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Event Flow Visualization */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Data Flow
        </h3>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="text-center flex-1">
              <div className="text-primary mb-1">Twilio</div>
              <div className="text-muted-foreground text-xs">Inbound SMS/Calls</div>
            </div>
            <div className="text-muted-foreground flex-1 text-center">→</div>
            <div className="text-center flex-1">
              <div className="text-primary mb-1">Worker</div>
              <div className="text-muted-foreground text-xs">Webhook Handler</div>
            </div>
            <div className="text-muted-foreground flex-1 text-center">→</div>
            <div className="text-center flex-1">
              <div className="text-primary mb-1">CommunicationEvent</div>
              <div className="text-muted-foreground text-xs">Event Log</div>
            </div>
            <div className="text-muted-foreground flex-1 text-center">→</div>
            <div className="text-center flex-1">
              <div className="text-primary mb-1">Leads</div>
              <div className="text-muted-foreground text-xs">CRM Data</div>
            </div>
            <div className="text-muted-foreground flex-1 text-center">→</div>
            <div className="text-center flex-1">
              <div className="text-primary mb-1">Dashboard</div>
              <div className="text-muted-foreground text-xs">Analytics View</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Activity
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {visibility.recent_events.length > 0 ? (
            visibility.recent_events.map((event, idx) => (
              <div key={idx} className="p-3 border border-border rounded-lg text-sm hover:bg-muted/30">
                <div className="flex items-start justify-between mb-1">
                  <span className="font-semibold capitalize">
                    {event.event_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-1.5 py-0.5 bg-muted rounded text-xs">
                    {event.channel}
                  </span>
                  <span className="px-1.5 py-0.5 bg-muted rounded text-xs capitalize">
                    {event.direction}
                  </span>
                  <span className="px-1.5 py-0.5 bg-muted rounded text-xs">
                    {event.status}
                  </span>
                  {event.lead_id && (
                    <span className="px-1.5 py-0.5 bg-muted rounded text-xs">
                      Lead: {event.lead_id.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">No recent events</div>
          )}
        </div>
      </div>

      {/* Account Overview */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Account Overview
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Accounts */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              Active Accounts ({visibility.tenants.clients.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {visibility.tenants.clients.slice(0, 10).map((client) => (
                <div
                  key={client.id}
                  className="p-2 text-xs border border-border rounded-lg hover:bg-muted/30"
                >
                  <div className="font-semibold truncate">{client.name}</div>
                  <div className="text-muted-foreground truncate">{client.contact_email}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="capitalize text-xs px-2 py-0.5 rounded bg-muted">
                      {client.lifecycle_stage.replace(/_/g, ' ')}
                    </span>
                    {client.is_override && (
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                        Override
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {visibility.tenants.clients.length === 0 && (
                <div className="text-center text-muted-foreground py-4">No clients</div>
              )}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              Active Services ({visibility.tenants.projects.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {visibility.tenants.projects.slice(0, 10).map((project) => (
                <div
                  key={project.id}
                  className="p-2 text-xs border border-border rounded-lg hover:bg-muted/30"
                >
                  <div className="font-semibold truncate">{project.business_name}</div>
                  <div className="text-muted-foreground truncate">{project.plan}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="capitalize text-xs px-2 py-0.5 rounded bg-muted">
                      {project.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
              {visibility.tenants.projects.length === 0 && (
                <div className="text-center text-muted-foreground py-4">No projects</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}