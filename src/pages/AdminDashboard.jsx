import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, LayoutDashboard, Settings, BarChart3, MessageSquare, Activity, Users, FolderKanban, Zap, ClipboardList, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fetchLeadPipelineSummary, getLeadPipelineError } from '@/lib/leadPipelineApi';
import AdminSettingsPanel from '../components/admin/AdminSettingsPanel';
import LeadManagementDashboard from '../components/admin/LeadManagementDashboard';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import CommunicationTemplates from '../components/admin/CommunicationTemplates';
import IntegrationHealth from '../components/admin/IntegrationHealth';
import ClientProjectsPanel from '../components/admin/ClientProjectsPanel';
import AutomationsPanel from '../components/admin/AutomationsPanel';
import QaCustomerPanel from '../components/admin/QaCustomerPanel';
import LeadRoutingPanel from '../components/admin/LeadRoutingPanel';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'client-projects', label: 'Client Projects', icon: FolderKanban },
  { id: 'onboarding', label: 'Client Onboarding', icon: ClipboardList },
  { id: 'automations', label: 'Automation Status', icon: Zap },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'templates', label: 'Templates', icon: MessageSquare },
  { id: 'health', label: 'Integration Health', icon: Activity },
  { id: 'routing', label: 'Lead Routing', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminDashboard() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    setLoggingOut(true);
    base44.auth.logout('/');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'leads':
        return <LeadManagementDashboard />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'templates':
        return <CommunicationTemplates />;
      case 'health':
        return <IntegrationHealth />;
      case 'client-projects':
        return <ClientProjectsPanel />;
      case 'automations':
        return <AutomationsPanel />;
      case 'onboarding':
        navigate('/admin/onboarding');
        return null;
      case 'routing':
        return <LeadRoutingPanel />;
      case 'settings':
        return <AdminSettingsPanel />;
      case 'overview':
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-border transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <h1 className="font-display text-xl font-semibold text-foreground">
              ClientSurge <span className="text-primary">Admin</span>
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border space-y-3">
            <div className="px-4 py-2">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="text-sm font-semibold text-foreground truncate">{user?.full_name || 'Admin'}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors text-sm disabled:opacity-60"
            >
              {loggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {loggingOut ? 'Signing out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-border px-6 py-4 flex items-center justify-between lg:justify-end sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-foreground hidden sm:block">
            {NAV_ITEMS.find(item => item.id === activeTab)?.label || 'Dashboard'}
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
        />
      )}

      {/* Logout spinner overlay */}
      {loggingOut && (
        <div className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function OverviewDashboard() {
  const [snapshot, setSnapshot] = useState({
    summary: {
      total_leads: 0,
      status_counts: {},
      segment_counts: {},
      recommended_offer_counts: {},
      recent_lead_activity: [],
      priority_queue: [],
      last7Days: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      const response = await fetchLeadPipelineSummary({ limit: 10, offset: 0 });
      setSnapshot(response);
      setError("");
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(getLeadPipelineError(err, "Unable to load lead overview right now."));
    } finally {
      setLoading(false);
    }
  };

  const totalLeads = snapshot.summary.total_leads || 0;
  const recentLeads = snapshot.summary.recent_lead_activity || [];
  const priorityQueue = snapshot.summary.priority_queue || [];
  const newToday = snapshot.summary.last7Days?.[snapshot.summary.last7Days.length - 1]?.leads || 0;

  const stats = [
    { label: 'Total Leads', value: totalLeads, color: 'blue' },
    { label: 'New Today', value: newToday, color: 'green' },
    { label: 'Follow-Up Due', value: snapshot.summary.segment_counts?.follow_up || 0, color: 'purple' },
    { label: 'Awaiting Close', value: snapshot.summary.segment_counts?.awaiting_close || 0, color: 'emerald' },
  ];

  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Canonical lead activation overview across the current admin sales queue.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className={`rounded-xl border border-border p-6 ${colors[stat.color]}`}>
            <p className="text-sm font-medium opacity-75">{stat.label}</p>
            <p className="text-4xl font-bold mt-2">{loading ? '-' : stat.value}</p>
          </div>
        ))}
      </div>

      <QaCustomerPanel />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr,1fr]">
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Priority Outreach Queue</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : priorityQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No priority leads yet</p>
            ) : (
              priorityQueue.slice(0, 6).map((lead, index) => (
                <div key={lead.id} className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        #{index + 1} {lead.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{lead.business_name}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-foreground">
                      {lead.activation_priority}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-foreground">{lead.next_action?.label || "Review lead"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{lead.next_action?.detail || "Review lead context."}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Offer: {lead.recommended_offer?.package_name || lead.recommended_offer?.primary_service_name || 'No advisory offer'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Offer Mix</h3>
          <div className="space-y-3">
            <OverviewLine
              label="Starter"
              value={snapshot.summary.recommended_offer_counts?.starter_system || 0}
              helper="Response + booking fit"
            />
            <OverviewLine
              label="Growth"
              value={snapshot.summary.recommended_offer_counts?.growth_system || 0}
              helper="Response + nurture fit"
            />
            <OverviewLine
              label="Pro"
              value={snapshot.summary.recommended_offer_counts?.pro_system || 0}
              helper="Full-stack fit"
            />
            <OverviewLine
              label="Single Service"
              value={snapshot.summary.recommended_offer_counts?.single_service || 0}
              helper="One clear first-service fit"
            />
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Lead Movement</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet</p>
          ) : (
            recentLeads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-foreground text-sm">{lead.full_name}</p>
                  <p className="text-xs text-muted-foreground">{lead.business_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lead.recent_movement?.detail || (lead.last_activity_at ? new Date(lead.last_activity_at).toLocaleDateString() : 'Not tracked')}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  lead.status === 'Booked' ? 'bg-green-100 text-green-800' :
                  lead.status === 'Qualified' ? 'bg-purple-100 text-purple-800' :
                  lead.status === 'Contacted' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {lead.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Activation Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-3">Actionability Snapshot</h3>
          <div className="space-y-3 text-sm">
            <OverviewLine label="Reactivation Ready" value={snapshot.summary.segment_counts?.reactivation || 0} helper="Dormant leads fit reactivation." />
            <OverviewLine label="Nurture Ready" value={snapshot.summary.segment_counts?.nurture || 0} helper="Leads fit structured follow-up." />
            <OverviewLine label="High-Value Outreach" value={snapshot.summary.segment_counts?.high_value_outreach || 0} helper="High-intent or high-score." />
            <OverviewLine label="Demo Requested" value={snapshot.summary.segment_counts?.demo_requested || 0} helper="Demo-booking leads waiting on work." />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-3">Operator Guidance</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>&#10003; Work the priority queue before broad list scanning.</p>
            <p>&#10003; Follow-up and demo-close signals should be handled before nurture-only leads.</p>
            <p>&#10003; Treat recommended offers as advisory, then confirm fit in the lead detail view.</p>
            <p>&#10003; Keep status changes canonical so timestamps and segments stay accurate.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewLine({ label, value, helper }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </div>
      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}