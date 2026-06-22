import { lazy, Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, Menu, X, LayoutDashboard, Settings, BarChart3, MessageSquare,
  Activity, Users, FolderKanban, Zap, ClipboardList, Loader2, Send, Flame,
  Mail, Target, Star, PieChart, Layers, DollarSign, Inbox, RefreshCw,
  Server, RotateCcw, BookOpen, Wand2, Sparkles, Crosshair, Trophy,
  CalendarCheck2, ShieldCheck, Eye, TrendingDown, Database,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fetchLeadPipelineSummary, getLeadPipelineError } from '@/lib/leadPipelineApi';
import { countWebhookErrorEvents } from '@/lib/adminUnreadCounts';
import AdminSettingsPanel from '../components/admin/AdminSettingsPanel';
import LeadsTable from '../components/admin/LeadsTable';
import LeadsRecentChanges from '../components/admin/LeadsRecentChanges';
import LeadIntelligenceDashboard from '../components/admin/LeadIntelligenceDashboard';
import LeadIntelligenceMiniPanel from '../components/admin/LeadIntelligenceMiniPanel';
import LeadManagementDashboard from '../components/admin/LeadManagementDashboard';
import CrmHealthDashboard from '../components/admin/CrmHealthDashboard';
import LaunchGatesPanel from '../components/admin/LaunchGatesPanel';
import CommunicationTemplates from '../components/admin/CommunicationTemplates';
import IntegrationHealth from '../components/admin/IntegrationHealth';
import ClientProjectsPanel from '../components/admin/ClientProjectsPanel';
import AutomationsPanel from '../components/admin/AutomationsPanel';
import QaCustomerPanel from '../components/admin/QaCustomerPanel';
import LeadRoutingPanel from '../components/admin/LeadRoutingPanel';
import DripCampaignPanel from '../components/admin/DripCampaignPanel';
import NurtureCampaignPanel from '../components/admin/NurtureCampaignPanel';
import LeadPriorityQueue from '../components/admin/LeadPriorityQueue';
import DynamicCadencePanel from '../components/admin/DynamicCadencePanel';
import CampaignLibrary from '../components/admin/CampaignLibrary';
import AdminInbox from '../components/admin/AdminInbox';
import AdminGlobalSearch from '../components/admin/AdminGlobalSearch';
import InstallQueuePanel from '../components/admin/InstallQueuePanel';
import WebsiteLeadsDashboard from '../components/admin/WebsiteLeadsDashboard';
import AdminDemoBookingsTab from '../components/admin/AdminDemoBookingsTab';
import CommunicationLogsPanel from '../components/admin/CommunicationLogsPanel';
import AutomationInstallChecklist from '../components/admin/AutomationInstallChecklist';
import ReviewRequestPanel from '../components/admin/ReviewRequestPanel';
import LeadReactivationPanel from '../components/admin/LeadReactivationPanel';
import TaskBoardPanel from '../components/admin/TaskBoardPanel';
import AutomationAlertsPanel from '../components/admin/AutomationAlertsPanel';
import AdminFailedJobsPanel from '../components/admin/AdminFailedJobsPanel';
import AuditLogPanel from '../components/admin/AuditLogPanel';
import AIAgentsDashboard from '../components/admin/AIAgentsDashboard';
import TwilioRuntimeHealth from '../components/admin/TwilioRuntimeHealth';
import InstantLeadResponseDebugPanel from '../components/admin/InstantLeadResponseDebugPanel';
import CanonicalSystemMap from '../components/admin/CanonicalSystemMap';
import TemplatesView from '../components/admin/TemplatesView';
import PipelineProofAuditButton from '../components/admin/PipelineProofAuditButton';
import AdminReconciliationButton from '../components/admin/AdminReconciliationButton';
import { AdminQuickActions, ChurnRiskPanel, InstallStatusTable, LTVCard } from '../components/admin/AdminDashboardCards';
import WebsiteCopyPanel from '../components/admin/WebsiteCopyPanel';
import SocialMediaEngine from '../components/admin/SocialMediaEngine';
import SniperDashboard from '../components/admin/SniperDashboard';
import LandingPageAnalyticsPanel from '../components/admin/LandingPageAnalyticsPanel';
import SalesFunnelPanel from '../components/admin/SalesFunnelPanel';
import CustomerOnboardingPanel from '../components/admin/CustomerOnboardingPanel';
import ResourceLibrary from '../components/admin/ResourceLibrary';
import AdminAICommandBar from '../components/admin/AdminAICommandBar';
import SessionTimeoutModal from '../components/admin/SessionTimeoutModal';
import StripeTestModeBanner from '../components/admin/StripeTestModeBanner';

const AnalyticsDashboard = lazy(() => import('../components/admin/AnalyticsDashboard'));
const EmailCampaignPanel = lazy(() => import('../components/admin/EmailCampaignPanel'));
const LeadSourceAttribution = lazy(() => import('../components/admin/LeadSourceAttribution'));
const RevenueDashboard = lazy(() => import('../components/admin/RevenueDashboard'));
const RevenueTrackingDashboard = lazy(() => import('../components/admin/RevenueTrackingDashboard'));
const PlatformClientsPanel = lazy(() => import('../components/admin/PlatformClientsPanel'));
const UnifiedOnboardingProgress = lazy(() => import('../components/admin/UnifiedOnboardingProgress'));
const LeadDataQualityDashboard = lazy(() => import('../components/admin/LeadDataQualityDashboard'));

function AdminPanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-xl border border-border bg-muted/40" />
        <div className="h-28 rounded-xl border border-border bg-muted/40" />
        <div className="h-28 rounded-xl border border-border bg-muted/40" />
      </div>
      <div className="h-72 rounded-xl border border-border bg-muted/30" />
    </div>
  );
}

function LazyAdminPanel({ children }) {
  return <Suspense fallback={<AdminPanelSkeleton />}>{children}</Suspense>;
}

const NAV_GROUPS = [
  {
    group: 'Leads & Intelligence',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'leads', label: 'Leads', icon: Users },
      { id: 'lead-intelligence', label: 'Lead Intelligence', icon: Flame },
      { id: 'priority', label: 'Priority Queue', icon: Star },
      { id: 'crm-health', label: 'CRM Health', icon: ShieldCheck },
      { id: 'inbox', label: 'Inbox', icon: Inbox, badge: 'inbox' },
    ],
  },
  {
    group: 'Clients & Onboarding',
    items: [
      { id: 'customer-onboarding', label: 'Customer Onboarding', icon: ClipboardList },
      { id: 'client-projects', label: 'Client Projects', icon: FolderKanban },
      { id: 'onboarding', label: 'Onboarding', icon: ClipboardList, external: true, externalPath: '/admin/onboarding' },
      { id: 'onboarding-orchestration', label: 'Onboarding Progress', icon: Zap },
      { id: 'install-queue', label: 'Install Queue', icon: Server },
      { id: 'install-checklists', label: 'Install Checklists', icon: ClipboardList },
      { id: 'launch-gates', label: 'Launch Gates', icon: ClipboardList },
      { id: 'demo-bookings', label: 'Demo Bookings', icon: CalendarCheck2 },
      { id: 'website-leads', label: 'Website Leads', icon: Target },
    ],
  },
  {
    group: 'Automation',
    items: [
      { id: 'automations', label: 'Automation Status', icon: Zap, external: true, externalPath: '/admin/automations' },
      { id: 'email-campaigns', label: 'Email Campaigns', icon: Mail },
      { id: 'cadence', label: 'Dynamic Cadence', icon: Settings },
      { id: 'reactivation', label: 'Lead Reactivation', icon: RotateCcw },
      { id: 'routing', label: 'Lead Routing', icon: Target },
      { id: 'failed-jobs', label: 'Failed Jobs', icon: Loader2 },
      { id: 'instant-response', label: 'Instant Response', icon: Send },
    ],
  },
  {
    group: 'Revenue & Funnels',
    items: [
      { id: 'sales-funnel', label: 'Sales Funnel', icon: TrendingDown },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'revenue', label: 'Revenue & MRR', icon: DollarSign },
      { id: 'revenue-tracking', label: 'Revenue Tracking', icon: DollarSign },
      { id: 'attribution', label: 'Source Attribution', icon: PieChart },
      { id: 'landing-traffic', label: 'Landing Traffic', icon: BarChart3 },
      { id: 'campaign-builder', label: 'Campaign Builder', icon: Layers },
    ],
  },
  {
    group: 'System Health',
    items: [
      { id: 'data-quality', label: 'Data Quality', icon: Activity },
      { id: 'platform-clients', label: 'Platform Clients', icon: Users },
      { id: 'twilio-health', label: 'Twilio Health', icon: Activity },
      { id: 'health', label: 'Integration Health', icon: Activity },
      { id: 'logs', label: 'Communication Logs', icon: MessageSquare, badge: 'webhook-errors' },
      { id: 'audit-log', label: 'Audit Log', icon: ShieldCheck },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    group: 'Tools',
    items: [
      { id: 'canonical-map', label: 'System Map', icon: Database },
      { id: 'resource-library', label: 'Resource Library', icon: BookOpen },
      { id: 'ai-sales-reps', label: 'AI Sales Reps', icon: Users },
      { id: 'sniper', label: 'Lead Sniper', icon: Crosshair },
      { id: 'ai-sales-cmd', label: 'AI Sales Command', icon: Zap, external: true, externalPath: '/admin/ai-sales' },
      { id: 'performance-wars', label: 'Performance Wars', icon: Trophy, external: true, externalPath: '/admin/performance-wars' },
      { id: 'social-engine', label: 'Social Media Engine', icon: Sparkles },
      { id: 'website-copy', label: 'Website Copy AI', icon: Wand2 },
      { id: 'task-board', label: 'Task Board', icon: ClipboardList },
      { id: 'templates', label: 'Templates', icon: MessageSquare },
      { id: 'review-request', label: 'Review Requests', icon: Star },
      { id: 'qa', label: 'QA Tools', icon: RefreshCw },
      { id: 'install-guide', label: 'Install Guide', icon: BookOpen, external: true, externalPath: '/admin/install-guide' },
    ],
  },
];

const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);
const VALID_TAB_IDS = new Set(ALL_NAV.filter(item => !item.external).map(item => item.id));

function getActiveTabFromSearch(search) {
  const tab = new URLSearchParams(search).get('tab');
  return tab && VALID_TAB_IDS.has(tab) ? tab : 'overview';
}

export default function AdminDashboard() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => getActiveTabFromSearch(location.search));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [previewingAsClient, setPreviewingAsClient] = useState(false);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [webhookErrorCount, setWebhookErrorCount] = useState(0);

  // Sync tab from URL param (e.g. when navigating back from sub-pages)
  useEffect(() => {
    setActiveTab(getActiveTabFromSearch(location.search));
  }, [location.search]);

  // Load unread counts for nav badges
  useEffect(() => {
    const loadUnread = async () => {
      try {
        const [msgs, failedEvents] = await Promise.all([
          base44.asServiceRole.entities.SupportMessage.filter({ read: false }, "-created_date", 200),
          base44.asServiceRole.entities.CommunicationEvent.filter({ status: "failed" }, "-created_date", 200),
        ]);
        setInboxUnread((msgs || []).length);
        setWebhookErrorCount(countWebhookErrorEvents(failedEvents || []));
      } catch {}
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="hidden lg:block w-64 border-r border-border p-4">
          <div className="h-6 w-40 rounded bg-muted mb-6" />
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="mb-3 h-9 rounded-lg bg-muted/70" />
          ))}
        </div>
        <div className="flex-1 p-6">
          <div className="mb-6 h-8 w-56 rounded bg-muted" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-28 rounded-xl border border-border bg-muted/40" />
            <div className="h-28 rounded-xl border border-border bg-muted/40" />
            <div className="h-28 rounded-xl border border-border bg-muted/40" />
          </div>
          <div className="mt-6 h-80 rounded-xl border border-border bg-muted/30" />
        </div>
      </div>
    );
  }

  // Role guard is handled by ProtectedRoute in App.jsx — no redundant check needed here

  const handlePreviewAsClient = async () => {
    setPreviewingAsClient(true);
    try {
      const res = await base44.functions.invoke('getDemoClientAccess', {});
      const email = res?.data?.email || 'demo@clientsurge.com';
      // Open the client portal directly in a new tab
      window.open('/client-portal', '_blank');
    } catch (e) {
      // Fallback: just open client portal
      window.open('/client-portal', '_blank');
    } finally {
      setPreviewingAsClient(false);
    }
  };

  const handleLogout = () => {
    setLoggingOut(true);
    base44.auth.logout('/');
  };

  const handleTabChange = (tabId, external, externalPath) => {
    if (external) {
      navigate(externalPath || '/admin/onboarding');
      return;
    }
    const nextTab = VALID_TAB_IDS.has(tabId) ? tabId : 'overview';
    const nextPath = nextTab === 'overview' ? '/admin' : `/admin?tab=${encodeURIComponent(nextTab)}`;
    navigate(nextPath);
    setActiveTab(nextTab);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const currentTabLabel = ALL_NAV.find(n => n.id === activeTab)?.label || 'Dashboard';

  const renderContent = () => {
    switch (activeTab) {
      case 'leads': return (
        <div className="space-y-6">
          <LeadsTable />
          <LeadsRecentChanges />
        </div>
      );
      case 'lead-intelligence': return <LeadIntelligenceDashboard />;
      case 'crm-health': return <CrmHealthDashboard />;
      case 'launch-gates': return <LaunchGatesPanel />;
      case 'sales-funnel': return <SalesFunnelPanel />;
      case 'customer-onboarding': return <CustomerOnboardingPanel />;
      case 'resource-library': return <ResourceLibrary />;
      case 'canonical-map': return <CanonicalSystemMap />;
      case 'templates': return <TemplatesView />;
      case 'analytics': return <LazyAdminPanel><AnalyticsDashboard /></LazyAdminPanel>;
      case 'twilio-health': return <TwilioRuntimeHealth />;
      case 'health': return <IntegrationHealth />;
      case 'client-projects': return <ClientProjectsPanel />;
      case 'ai-sales-reps': return <AIAgentsDashboard />;
      case 'automations': return <AutomationsPanel />;
      case 'drip': return <DripCampaignPanel />;
      case 'nurture': return <NurtureCampaignPanel />;
      case 'email-campaigns': return <LazyAdminPanel><EmailCampaignPanel /></LazyAdminPanel>;
      case 'routing': return <LeadRoutingPanel />;
      case 'priority': return <LeadPriorityQueue />;
      case 'attribution': return <LazyAdminPanel><LeadSourceAttribution /></LazyAdminPanel>;
      case 'landing-traffic': return <LandingPageAnalyticsPanel />;
      case 'campaign-builder': return <CampaignLibrary />;
      case 'revenue': return <LazyAdminPanel><RevenueDashboard /></LazyAdminPanel>;
      case 'revenue-tracking': return <LazyAdminPanel><RevenueTrackingDashboard /></LazyAdminPanel>;
      case 'onboarding-orchestration': return <LazyAdminPanel><UnifiedOnboardingProgress /></LazyAdminPanel>;
      case 'data-quality': return <LazyAdminPanel><LeadDataQualityDashboard /></LazyAdminPanel>;
      case 'platform-clients': return <LazyAdminPanel><PlatformClientsPanel /></LazyAdminPanel>;
      case 'inbox': return <AdminInbox />;
      case 'install-queue': return <InstallQueuePanel />;
      case 'install-checklists': return <AutomationInstallChecklist />;
      case 'website-leads': return <WebsiteLeadsDashboard />;
      case 'demo-bookings': return <AdminDemoBookingsTab />;
      case 'logs': return <CommunicationLogsPanel />;
      case 'failed-jobs': return <AdminFailedJobsPanel />;
      case 'instant-response': return <InstantLeadResponseDebugPanel />;
      case 'audit-log': return <AuditLogPanel />;
      case 'cadence': return <DynamicCadencePanel />;
      case 'reactivation': return <LeadReactivationPanel />;
      case 'review-request': return <ReviewRequestPanel />;
      case 'sniper': return <SniperDashboard />;
      case 'social-engine': return <SocialMediaEngine />;
      case 'website-copy': return <WebsiteCopyPanel />;
      case 'task-board': return <TaskBoardPanel />;
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
      <StripeTestModeBanner />
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
          <AdminGlobalSearch onNavigate={(tab) => handleTabChange(tab)} />
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
                  const unread = item.badge === 'inbox'
                    ? inboxUnread
                    : item.badge === 'webhook-errors'
                    ? webhookErrorCount
                    : 0;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id, item.external, item.externalPath)}
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
            onClick={handlePreviewAsClient}
            disabled={previewingAsClient}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/8 text-primary font-medium hover:bg-primary/15 transition-colors text-sm disabled:opacity-60"
          >
            {previewingAsClient ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            {previewingAsClient ? 'Opening...' : 'Preview as Client'}
          </button>
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
        <div className="bg-background border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-10">
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
                onClick={() => handleTabChange('inbox')}
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
  const [orders, setOrders] = useState([]);
  const [onboardings, setOnboardings] = useState([]);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      const [response, orderRecords, onboardingRecords] = await Promise.all([
        fetchLeadPipelineSummary({ limit: 10, offset: 0 }),
        base44.asServiceRole.entities.Order.filter({ payment_status: "paid" }, "-created_date", 200).catch(() => []),
        base44.entities.OnboardingClient.list("-created_date", 100).catch(() => []),
      ]);
      setSnapshot(response);
      setOrders(orderRecords || []);
      setOnboardings(onboardingRecords || []);
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
      <AdminAICommandBar />

      {/* Intelligence Quick KPIs */}
      <LeadIntelligenceMiniPanel onNavigate={onNavigate} />

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1">Lead activation overview — click any card to drill in.</p>
        </div>
        <div className="flex items-center gap-3">
          <PipelineProofAuditButton onComplete={() => fetchOverviewData()} />
          <AdminReconciliationButton onComplete={() => fetchOverviewData()} />
          <AutomationAlertsPanel compact onNavigate={onNavigate} />
        </div>
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
        <div className="bg-card rounded-xl border border-border p-6">
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
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Offer Mix</h3>
          <div className="space-y-3">
            {[
              { key: 'starter_system', label: 'Starter System', helper: 'Response + missed-call fit' },
              { key: 'growth_system', label: 'Growth System', helper: 'Response + nurture fit' },
              { key: 'elite_system', legacyKey: 'pro_system', label: 'Elite System', helper: 'Full-stack fit' },
              { key: 'single_service', label: 'Single Service', helper: 'One clear first-service fit' },
            ].map(({ key, legacyKey, label, helper }) => (
              <button
                key={key}
                onClick={() => onNavigate('leads')}
                className="w-full flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{helper}</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-foreground flex-shrink-0">
                  {(offerCounts[key] || 0) + (legacyKey ? offerCounts[legacyKey] || 0 : 0)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <LTVCard orders={orders} />
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <ChurnRiskPanel orders={orders} />
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <InstallStatusTable onboardings={onboardings.slice(0, 20)} />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Recent Paid Orders</h3>
            <p className="text-sm text-muted-foreground">Run the common operator actions against the latest paid orders.</p>
          </div>
          <button onClick={fetchOverviewData} className="text-xs font-semibold text-primary hover:text-primary/80">Refresh</button>
        </div>
        <div className="space-y-3">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/10 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{order.business_name || order.customer_name || "Unnamed client"}</p>
                <p className="text-xs text-muted-foreground">
                  {order.customer_email || "No email"} · {order.selected_package_type || order.package_type || "single_service"}
                </p>
              </div>
              <AdminQuickActions order={order} onRefresh={fetchOverviewData} />
            </div>
          ))}
          {orders.length === 0 && <p className="text-sm text-muted-foreground">No paid orders available yet.</p>}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-card rounded-xl border border-border p-6">
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
        <div className="bg-card rounded-xl border border-border p-6">
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
        <div className="bg-card rounded-xl border border-border p-6">
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

      <SessionTimeoutModal onLogout={() => base44.auth.logout('/')} logoutAfterMs={45 * 60 * 1000} />
    </div>
  );
}