import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Server, Eye, ListChecks, Users, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LiveLeadsFeed from '../components/mission-control/LiveLeadsFeed';
import SystemHealthPanel from '../components/mission-control/SystemHealthPanel';
import SystemStatusIndicator from '../components/mission-control/SystemStatusIndicator';
import AlertsFeed from '../components/mission-control/AlertsFeed';
import ConversionPipeline from '../components/mission-control/ConversionPipeline';
import TenantSwitcher from '../components/mission-control/TenantSwitcher';
import SystemVisibilityDashboard from '../components/mission-control/SystemVisibilityDashboard';
import LeadIntelligenceTable from '../components/admin/LeadIntelligenceTable';
import { useTenantContext } from '@/lib/useTenantContext.jsx';
import { useRealTimePolling } from '@/hooks/useRealTimePolling';

const TABS = [
  { id: 'overview',     label: 'Overview',     icon: Eye },
  { id: 'leads',        label: 'Recent Leads', icon: Users },
  { id: 'intelligence', label: 'Intelligence', icon: BarChart2 },
  { id: 'system',       label: 'System',       icon: Server },
];

export default function MissionControlDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selectedClientId, selectedProjectId, isAdmin } = useTenantContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);
  const [pollingStatus, setPollingStatus] = useState('CONNECTING');
  const [pollingLastUpdated, setPollingLastUpdated] = useState(Date.now());

  const checkWorkerHealth = async () => {
    try {
      await base44.entities.CommunicationEvent.list('-created_date', 1);
      return { status: 'ok' };
    } catch (err) {
      throw new Error('Worker health check failed');
    }
  };

  const { lastUpdated } = useRealTimePolling(checkWorkerHealth, 3000, null, setPollingStatus, isAutoRefreshing);

  useEffect(() => {
    setPollingLastUpdated(lastUpdated);
  }, [lastUpdated]);

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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mission Control</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Real-time leads, messages, and system health</p>
            </div>
            <div className="flex items-center gap-3">
              <SystemStatusIndicator status={pollingStatus} lastUpdated={pollingLastUpdated} />
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAutoRefreshing}
                  onChange={(e) => setIsAutoRefreshing(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
              <button
                onClick={() => setLastRefresh(Date.now())}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all text-sm font-medium shadow-sm"
                aria-label="Manually refresh dashboard data"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-3 pt-3 border-t border-border">
              <TenantSwitcher />
            </div>
          )}

          {(selectedClientId || selectedProjectId) && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-primary/8 border border-primary/25">
              <p className="text-xs font-semibold text-primary">
                ✓ Viewing data for: {selectedProjectId ? 'Project' : 'Client'}
              </p>
            </div>
          )}
        </div>

        {/* Tab Navigation — 4 tabs only */}
        <div className="border-t border-border bg-background/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-0">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <>
            <button
              onClick={() => navigate('/admin/opportunity-review')}
              className="w-full flex items-center justify-between mb-6 px-5 py-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,136,204,0.1)', border: '1px solid rgba(0,136,204,0.2)' }}>
                  <ListChecks className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Opportunity Review Queue</p>
                  <p className="text-xs text-muted-foreground">Classify leads before manual sales work</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Open →</span>
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SystemVisibilityDashboard />
              </div>
              <div className="space-y-6">
                <AlertsFeed lastUpdated={pollingLastUpdated} />
                <ConversionPipeline lastUpdated={pollingLastUpdated} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'leads' && (
          <LiveLeadsFeed
            filters={{ phoneNumber: '', intentType: 'all', dateRange: 'last24h' }}
            refreshKey={lastRefresh}
          />
        )}

        {activeTab === 'intelligence' && (
          <LeadIntelligenceTable />
        )}

        {activeTab === 'system' && (
          <SystemHealthPanel refreshKey={lastRefresh} />
        )}
      </div>
    </div>
  );
}