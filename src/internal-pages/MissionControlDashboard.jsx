import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import {
  RefreshCw, Phone, MessageSquare, TrendingUp, Server, Eye, ListChecks,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LiveLeadsFeed from '../components/mission-control/LiveLeadsFeed';
import ConversationsViewer from '../components/mission-control/ConversationsViewer';
import MessageLogTable from '../components/mission-control/MessageLogTable';
import IntentAnalytics from '../components/mission-control/IntentAnalytics';
import SystemHealthPanel from '../components/mission-control/SystemHealthPanel';
import SystemStatusIndicator from '../components/mission-control/SystemStatusIndicator';
import AlertsFeed from '../components/mission-control/AlertsFeed';
import ConversionPipeline from '../components/mission-control/ConversionPipeline';
import TenantSwitcher from '../components/mission-control/TenantSwitcher';
import SystemVisibilityDashboard from '../components/mission-control/SystemVisibilityDashboard';
import { useTenantContext } from '@/lib/useTenantContext.jsx';
import { useRealTimePolling } from '@/hooks/useRealTimePolling';

export default function MissionControlDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selectedClientId, selectedProjectId, isAdmin } = useTenantContext();
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
      <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Real-time leads, messages, and revenue insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SystemStatusIndicator
                status={pollingStatus}
                lastUpdated={pollingLastUpdated}
              />
              <button
                onClick={() => setLastRefresh(Date.now())}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all text-sm font-medium shadow-sm"
                title="Manual refresh"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Tenant Switcher (Admin Only) */}
          {isAdmin && (
            <div className="mb-4 pb-4 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Tenant:</p>
              <TenantSwitcher />
            </div>
          )}

          {/* Selected Tenant Info */}
          {(selectedClientId || selectedProjectId) && (
           <div className="mb-4 p-3.5 rounded-lg bg-primary/8 border border-primary/25">
             <p className="text-xs font-semibold text-primary">
               ✓ Viewing data for: {selectedProjectId ? 'Project' : 'Client'}
             </p>
           </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2 mt-4">
            <input
              type="text"
              placeholder="Filter by phone..."
              value={filters.phoneNumber}
              onChange={(e) =>
                setFilters({ ...filters, phoneNumber: e.target.value })
              }
              className="px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background focus:ring-2 focus:ring-primary focus:outline-none shadow-sm"
            />
            <select
              value={filters.intentType}
              onChange={(e) =>
                setFilters({ ...filters, intentType: e.target.value })
              }
              className="px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background focus:ring-2 focus:ring-primary focus:outline-none shadow-sm"
            >
              <option value="all">All Intents</option>
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
              className="px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background focus:ring-2 focus:ring-primary focus:outline-none shadow-sm"
            >
              <option value="last1h">Last 1 Hour</option>
              <option value="last24h">Last 24 Hours</option>
              <option value="last7d">Last 7 Days</option>
              <option value="last30d">Last 30 Days</option>
            </select>
            <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-all bg-background shadow-sm">
              <input
                type="checkbox"
                checked={isAutoRefreshing}
                onChange={(e) => setIsAutoRefreshing(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium whitespace-nowrap">Auto-refresh (3s)</span>
            </label>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-border bg-background/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-0 overflow-x-auto scrollbar-hide">
              {[
                { id: 'visibility', label: 'Overview', icon: Eye },
                { id: 'alerts', label: 'Alerts', icon: TrendingUp },
                { id: 'live-feeds', label: 'Recent Leads', icon: TrendingUp },
                { id: 'conversations', label: 'Conversations', icon: MessageSquare },
                { id: 'message-log', label: 'Messages', icon: Phone },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'health', label: 'System Status', icon: Server },
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'visibility' && (
          <>
            {/* Opportunity Review shortcut */}
            <button
              onClick={() => navigate('/admin/opportunity-review')}
              className="w-full flex items-center justify-between mb-6 px-5 py-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,136,204,0.1)", border: "1px solid rgba(0,136,204,0.2)" }}>
                  <ListChecks className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-700 font-semibold text-foreground">Opportunity Review Queue</p>
                  <p className="text-xs text-muted-foreground">Classify leads before manual sales work — review real vs. QA records</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Open →</span>
            </button>
            <SystemVisibilityDashboard />
          </>
        )}
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