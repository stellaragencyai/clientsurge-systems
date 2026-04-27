import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Menu, X, LayoutDashboard, Settings, BarChart3, MessageSquare,
  Activity, Users, FolderKanban, Zap, ClipboardList, Loader2, Send, Flame,
  Mail, Target, Star, PieChart, Layers, DollarSign, Inbox, RefreshCw, Plus,
} from 'lucide-react';
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
import DripCampaignPanel from '../components/admin/DripCampaignPanel';
import EmailCampaignPanel from '../components/admin/EmailCampaignPanel';
import NurtureCampaignPanel from '../components/admin/NurtureCampaignPanel';
import LeadPriorityQueue from '../components/admin/LeadPriorityQueue';
import LeadSourceAttribution from '../components/admin/LeadSourceAttribution';
import CampaignLibrary from '../components/admin/CampaignLibrary';
import RevenueDashboard from '../components/admin/RevenueDashboard';
import AdminInbox from '../components/admin/AdminInbox';
import AdminGlobalSearch from '../components/admin/AdminGlobalSearch';

const NAV_GROUPS = [
  {
    group: 'Main',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'leads', label: 'Leads', icon: Users },
      { id: 'client-projects', label: 'Client Projects', icon: FolderKanban },
      { id: 'inbox', label: 'Inbox', icon: Inbox, badge: true },
      { id: 'onboarding', label: 'Client Onboarding', icon: ClipboardList, external: true },
    ],
  },
  {
    group: 'Automation',
    items: [
      { id: 'automations', label: 'Automation Status', icon: Zap },
      { id: 'drip', label: 'Drip Campaigns', icon: Send },
      { id: 'nurture', label: 'Nurture Campaigns', icon: Flame },
      { id: 'email-campaigns', label: 'Email Campaigns', icon: Mail },
      { id: 'campaign-builder', label: 'Campaign Builder', icon: Layers },
      { id: 'routing', label: 'Lead Routing', icon: Target },
    ],
  },
  {
    group: 'Insights',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'revenue', label: 'Revenue & MRR', icon: DollarSign },
      { id: 'priority', label: 'Priority Queue', icon: Star },
      { id: 'attribution', label: 'Source Attribution', icon: PieChart },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'health', label: 'Integration Health', icon: Activity },
      { id: 'templates', label: 'Templates', icon: MessageSquare },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'qa', label: 'QA Tools', icon: RefreshCw },
    ],
  },
];

const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);

// Top bar contextual actions per tab
const TAB_ACTIONS = {
  leads: [{ label: 'Import Leads', icon: Plus, action: 'import' }],
  nurture: [{ label: 'Enroll Lead', icon: Plus, action: 'enroll' }],
  revenue: [{ label: 'Refresh', icon: RefreshCw, action: 'refresh' }],
};

export default function AdminDashboard() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [inboxUnread, setInboxUnread] = useState(0);

  // Load unread message count for inbox badge
  useEffect(() => {
    const loadUnread = async () => {
      try {
        const msgs = await base44.entities.SupportMessage.filter({ read: false }, "-created_date", 200);
        const clientMsgs = (msgs || []).filter(m => m.role === "client");
        setInboxUnread(clientMsgs.length);
      } catch {}
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const handleTabChange = (tabId, external) => {
    if (external) {
      navigate('/admin/onboarding');
      return;
    }
    setActiveTab(tabId);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const currentTabLabel = ALL_NAV.find(n => n.id === activeTab)?.label || 'Dashboard';

  const renderContent = () => {
    switch (activeTab) {
      case 'leads': return <LeadManagementDashboard />;
      case 'analytics': return <AnalyticsDashboard />;
      case 'templates': return <CommunicationTemplates />;
      case 'health': return <IntegrationHealth />;
      case 'client-projects': return <ClientProjectsPanel />;
      case 'automations': return <AutomationsPanel />;
      case 'drip': return <DripCampaignPanel />;
      case 'nurture': return <NurtureCampaignPanel />;
      case 'email-campaigns': return <EmailCampaignPanel />;
      case 'routing': return <LeadRoutingPanel />;
      case 'priority': return <LeadPriorityQueue />;
      case 'attribution': return <LeadSourceAttribution />;
      case 'campaign-builder': return <CampaignLibrary />;
      case 'revenue': return <RevenueDashboard />;
      case 'inbox': return <AdminInbox />;
      case 'qa': return (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">QA Tools</h2>
          <p className="text-sm text-muted-foreground">Internal testing tools. Admin only.</p>
          <QaCustomerPanel />
        </div>
      );
      case 'settings': return <AdminSettingsPanel />;
      case 'overview':
      default:
        return <OverviewDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-background border-r border-border transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border bg-background">
          <h1 className="font-display text-lg font-semibold text-foreground">
            ClientSurge <span className="text-primary">Admin</span>
          </h1>
        </div>

        {/* Global Search */}
        <div className="px-3 py-2 border-b border-border">
          <AdminGlobalSearch onNavigate={(tab) => { setActiveTab(tab); if (window.innerWidth < 1024) setSidebarOpen(false); }} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-4">
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group}>
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{group}</p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const unread = item.badge ? inboxUnread : 0;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id, item.external)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {unread > 0 && (
                        <span className={`rounded-full text-[10px] font-bold px-1.5 py-0.5 ${isActive ? 'bg-white/20 text-white' : 'bg-primary text-primary-foreground'}`}>
                          {unread}
                        </span>
                      )}
                      {item.external && (
                        <span className="text-[10px] text-muted-foreground opacity-60">↗</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {loggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
            </button>
            <h2 className="text-base font-semibold text-foreground">{currentTabLabel}</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Inbox quick badge */}
            {inboxUnread > 0 && activeTab !== 'inbox' && (
              <button
                onClick={() => setActiveTab('inbox')}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
              >
                <Inbox className="w-3.5 h-3.5" />
                {inboxUnread} unread
              </button>
            )}
          </div>
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

      {loggingOut && (
        <div className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function OverviewDashboard({ onNavigate }) {
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
      setError(getLeadPipelineError(err, "Unable to load lead overview right now."));
    } finally {
      setLoading(false);
    }
  };

  const totalLeads = snapshot.summary.total_leads || 0;
  const recentLeads = snapshot.summary.recent_lead_activity || [];
  const priorityQueue = snapshot.summary.priority_queue || [];
  const newToday = snapshot.summary.last7Days?.[snapshot.summary.last7Days.length - 1]?.leads || 0;
  const offerCounts = snapshot.summary.recommended_offer_counts || {};

  const stats = [
    { label: 'Total Leads', value: totalLeads, color: 'bg-blue-50 text-blue-700', tab: 'leads' },
    { label: 'New Today', value: newToday, color: 'bg-green-50 text-green-700', tab: 'leads' },
    { label: 'Follow-Up Due', value: snapshot.summary.segment_counts?.follow_up || 0, color: 'bg-purple-50 text-purple-700', tab: 'leads' },
    { label: 'Awaiting Close', value: snapshot.summary.segment_counts?.awaiting_close || 0, color: 'bg-emerald-50 text-emerald-700', tab: 'leads' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Lead activation overview — click any card to drill in.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <button
            key={idx}
            onClick={() => onNavigate(stat.tab)}
            className={`rounded-xl border border-border p-6 text-left hover:shadow-md transition-shadow cursor-pointer ${stat.color}`}
          >
            <p className="text-sm font-medium opacity-75">{stat.label}</p>
            <p className="text-4xl font-bold mt-2">
              {loading
                ? <span className="inline-block w-10 h-8 rounded bg-current opacity-10 animate-pulse" />
                : stat.value}
            </p>
          </button>
        ))}
      </div>

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
                      <p className="text-sm font-semibold text-foreground">#{index + 1} {lead.full_name}</p>
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
          <button onClick={() => onNavigate('leads')} className="mt-4 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
            View all leads →
          </button>
        </div>

        {/* Offer Mix — clickable */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Offer Mix</h3>
          <div className="space-y-3">
            {[
              { key: 'starter_system', label: 'Starter', helper: 'Response + booking fit' },
              { key: 'growth_system', label: 'Growth', helper: 'Response + nurture fit' },
              { key: 'pro_system', label: 'Pro', helper: 'Full-stack fit' },
              { key: 'single_service', label: 'Single Service', helper: 'One clear first-service fit' },
            ].map(({ key, label, helper }) => (
              <button
                key={key}
                onClick={() => onNavigate('leads')}
                className="w-full flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{helper}</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-foreground flex-shrink-0">{offerCounts[key] || 0}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Lead Movement</h3>
          <button onClick={() => onNavigate('leads')} className="text-xs font-semibold text-primary hover:text-primary/80">View all →</button>
        </div>
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
            {[
              { label: "Reactivation Ready", key: "reactivation", helper: "Dormant leads fit reactivation." },
              { label: "Nurture Ready", key: "nurture", helper: "Leads fit structured follow-up." },
              { label: "High-Value Outreach", key: "high_value_outreach", helper: "High-intent or high-score." },
              { label: "Demo Requested", key: "demo_requested", helper: "Demo-booking leads waiting on work." },
            ].map(({ label, key, helper }) => (
              <button
                key={key}
                onClick={() => onNavigate('leads')}
                className="w-full flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{helper}</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-foreground flex-shrink-0">{snapshot.summary.segment_counts?.[key] || 0}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-3">Operator Guidance</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Work the priority queue before broad list scanning.</p>
            <p>✓ Follow-up and demo-close signals should be handled before nurture-only leads.</p>
            <p>✓ Treat recommended offers as advisory, then confirm fit in the lead detail view.</p>
            <p>✓ Keep status changes canonical so timestamps and segments stay accurate.</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => onNavigate('revenue')} className="rounded-lg bg-primary/8 border border-primary/20 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors">
              View Revenue →
            </button>
            <button onClick={() => onNavigate('analytics')} className="rounded-lg bg-muted border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors">
              View Analytics →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}