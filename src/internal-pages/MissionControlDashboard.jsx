import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import {
  RefreshCw, Phone, MessageSquare, TrendingUp, Server,
} from 'lucide-react';
import LiveLeadsFeed from '../components/mission-control/LiveLeadsFeed';
import ConversationsViewer from '../components/mission-control/ConversationsViewer';
import MessageLogTable from '../components/mission-control/MessageLogTable';
import IntentAnalytics from '../components/mission-control/IntentAnalytics';
import SystemHealthPanel from '../components/mission-control/SystemHealthPanel';
import SystemStatusIndicator from '../components/mission-control/SystemStatusIndicator';
import AlertsFeed from '../components/mission-control/AlertsFeed';
import ConversionPipeline from '../components/mission-control/ConversionPipeline';
import { useRealTimePolling } from '@/hooks/useRealTimePolling';

export default function MissionControlDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('live-feeds');
  const [filters, setFilters] = useState({
    phoneNumber: '',
    intentType: 'all',
    dateRange: 'last24h',
  });
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);
  const [pollingStatus, setPollingStatus] = useState('CONNECTING');
  const [pollingLastUpdated, setPollingLastUpdated] = useState(Date.now());

  // Worker health check for real-time connection
  const checkWorkerHealth = async () => {
    try {
      // Simple health check - can be replaced with actual Worker endpoint
      await base44.entities.CommunicationEvent.list('-created_date', 1);
      return { status: 'ok' };
    } catch (err) {
      throw new Error('Worker health check failed');
    }
  };

  // Real-time polling with 3-second interval
  const { status, lastUpdated } = useRealTimePolling(
    checkWorkerHealth,
    3000, // 3 seconds
    null,
    setPollingStatus,
    isAutoRefreshing
  );

  useEffect(() => {
    setPollingLastUpdated(lastUpdated);
  }, [lastUpdated]);

  // Role-based access
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Mission Control is available to admins only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mission Control</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time lead intelligence & system monitoring
              </p>
            </div>
            <div className="flex items-center gap-4">
              <SystemStatusIndicator
                status={pollingStatus}
                lastUpdated={pollingLastUpdated}
              />
              <button
                onClick={() => setLastRefresh(Date.now())}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
                title="Manual refresh"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3 mt-4">
            <input
              type="text"
              placeholder="Filter by phone number..."
              value={filters.phoneNumber}
              onChange={(e) =>
                setFilters({ ...filters, phoneNumber: e.target.value })
              }
              className="px-3 py-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <select
              value={filters.intentType}
              onChange={(e) =>
                setFilters({ ...filters, intentType: e.target.value })
              }
              className="px-3 py-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="all">All Intent Types</option>
              <option value="lead">Lead Inquiry</option>
              <option value="booking">Booking Request</option>
              <option value="support">Support</option>
              <option value="spam">Spam/Bot</option>
            </select>
            <select
              value={filters.dateRange}
              onChange={(e) =>
                setFilters({ ...filters, dateRange: e.target.value })
              }
              className="px-3 py-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="last1h">Last 1 Hour</option>
              <option value="last24h">Last 24 Hours</option>
              <option value="last7d">Last 7 Days</option>
              <option value="last30d">Last 30 Days</option>
            </select>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border cursor-pointer hover:bg-muted transition-colors">
              <input
                type="checkbox"
                checked={isAutoRefreshing}
                onChange={(e) => setIsAutoRefreshing(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Auto-refresh (3s)</span>
            </label>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-0 overflow-x-auto">
              {[
                { id: 'alerts', label: 'Alerts', icon: TrendingUp },
                { id: 'live-feeds', label: 'Live Feeds', icon: TrendingUp },
                { id: 'conversations', label: 'Conversations', icon: MessageSquare },
                { id: 'message-log', label: 'Message Log', icon: Phone },
                { id: 'analytics', label: 'Intent Analytics', icon: TrendingUp },
                { id: 'health', label: 'System Health', icon: Server },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'alerts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AlertsFeed lastUpdated={pollingLastUpdated} />
            </div>
            <div>
              <ConversionPipeline lastUpdated={pollingLastUpdated} />
            </div>
          </div>
        )}
        {activeTab === 'live-feeds' && (
          <LiveLeadsFeed filters={filters} refreshKey={lastRefresh} />
        )}
        {activeTab === 'conversations' && (
          <ConversationsViewer filters={filters} refreshKey={lastRefresh} />
        )}
        {activeTab === 'message-log' && (
          <MessageLogTable filters={filters} refreshKey={lastRefresh} />
        )}
        {activeTab === 'analytics' && (
          <IntentAnalytics filters={filters} refreshKey={lastRefresh} />
        )}
        {activeTab === 'health' && (
          <SystemHealthPanel refreshKey={lastRefresh} />
        )}
      </div>
    </div>
  );
}