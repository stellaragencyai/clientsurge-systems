import { lazy, Suspense, useState, useEffect, useLayoutEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, LayoutDashboard, Eye, Menu, X } from "lucide-react";
import { useLeadNotifications } from "../hooks/useLeadNotifications";
import PortalLoadingSkeleton from "../components/portal/PortalLoadingSkeleton";
import PortalSidebar from "../components/portal/PortalSidebar";
import PortalDashboardOverview from "../components/portal/PortalDashboardOverview";
import PortalStateBoundary from "../components/portal/PortalStateBoundary";
import PortalTabWrapper from "../components/portal/PortalTabWrapper";
import { usePortalState } from "../hooks/usePortalState";

// ── All portal components lazy-loaded to keep the ClientPortal chunk small ──
// This prevents Vite from bundling 30+ components into one massive chunk that
// can fail to load in preview/production environments (504 Gateway Timeout).
const SetupProgressHub = lazy(() => import("../components/portal/SetupProgressHub"));
const SupportChat = lazy(() => import("../components/portal/SupportChat"));
const PlanManager = lazy(() => import("../components/portal/PlanManager"));
const LeadActivityFeed = lazy(() => import("../components/portal/LeadActivityFeed"));
const PaymentFailedBanner = lazy(() => import("../components/portal/PaymentFailedBanner"));
const LeadFlowDashboard = lazy(() => import("../components/portal/LeadFlowDashboard"));
const NotificationBell = lazy(() => import("../components/portal/NotificationBell"));
const QuickStartWizard = lazy(() => import("../components/portal/QuickStartWizard"));
const QuickStartInline = lazy(() => import("../components/portal/QuickStartInline"));
const DeadlinesPanel = lazy(() => import("../components/portal/DeadlinesPanel"));
const FilesPanel = lazy(() => import("../components/portal/FilesPanel"));
const BillingDashboard = lazy(() => import("../components/portal/BillingDashboard"));
const ReferABusiness = lazy(() => import("../components/portal/ReferABusiness"));
const PortalSettings = lazy(() => import("../components/portal/PortalSettings"));
const TasksDashboard = lazy(() => import("../components/portal/TasksDashboard"));
const AutomationsOverview = lazy(() => import("../components/portal/AutomationsOverview"));
const AutomatedResponsesLog = lazy(() => import("../components/portal/AutomatedResponsesLog"));
const AutomationChecklist = lazy(() => import("../components/portal/AutomationChecklist"));
const PortalWhatsNew = lazy(() => import("../components/portal/PortalWhatsNew"));
const ClientOrderStatusTab = lazy(() => import("../components/portal/ClientOrderStatusTab"));
const PortalTimeline = lazy(() => import("../components/portal/PortalTimeline"));
const SystemStatusBadge = lazy(() => import("../components/portal/SystemStatusBadge"));
const OrderTracker = lazy(() => import("../components/landing/OrderTracker"));
const OnboardingMissingAssetsBanner = lazy(() => import("../components/portal/OnboardingMissingAssetsBanner"));
const EmptyStateDashboard = lazy(() => import("../components/portal/EmptyStateDashboard"));
const GettingStartedBanner = lazy(() => import("../components/portal/GettingStartedBanner"));
const LaunchReadinessPanel = lazy(() => import("../components/dashboard/LaunchReadinessPanel"));
const ActiveAutomationsPanel = lazy(() => import("../components/dashboard/ActiveAutomationsPanel"));
const RecentSystemProofPanel = lazy(() => import("../components/dashboard/RecentSystemProofPanel"));
const RecentIssuesPanel = lazy(() => import("../components/dashboard/RecentIssuesPanel"));
const AdminPreviewBanner = lazy(() => import("../components/dashboard/AdminPreviewBanner"));
const InternalFilterNotice = lazy(() => import("../components/dashboard/InternalFilterNotice"));
const RevenueMetricsPanel = lazy(() => import("../components/portal/RevenueMetricsPanel"));
const WeeklyReports = lazy(() => import("../components/portal/WeeklyReports"));
const RealTimeMetricsPanel = lazy(() => import("../components/portal/RealTimeMetricsPanel"));

function PortalPanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-48 rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 rounded-xl border border-border bg-muted/40" />
        <div className="h-24 rounded-xl border border-border bg-muted/40" />
        <div className="h-24 rounded-xl border border-border bg-muted/40" />
      </div>
      <div className="h-64 rounded-xl border border-border bg-muted/30" />
    </div>
  );
}

function PortalLazy({ children }) {
  return <Suspense fallback={<PortalPanelSkeleton />}>{children}</Suspense>;
}

// Tab labels for the dashboard title lookup
const TAB_LABELS = {
  dashboard: "Dashboard",
  progress: "Setup Progress",
  timeline: "Timeline",
  quickstart: "Quick Start",
  performance: "Performance",
  realtime: "Real-Time Metrics",
  metrics: "Lead Flow",
  tasks: "Tasks",
  checklist: "Checklist",
  leads: "My Leads",
  deadlines: "Deadlines",
  files: "Files & Docs",
  billing: "Billing",
  referrals: "Referrals",
  support: "Support & Messaging",
  plan: "My Plan",
  reports: "Weekly Report",
  updates: "What's New",
  settings: "Settings",
  "order-status": "Order Status",
};

export default function ClientPortal() {
  // Prevent search engines from indexing private portal
  useLayoutEffect(() => {
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.setAttribute("content", "noindex,nofollow");
    return () => { if (robots) robots.setAttribute("content", "index,follow"); };
  }, []);

  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [portalOrder, setPortalOrder] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [portalError, setPortalError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isAdminPreview, setIsAdminPreview] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useLeadNotifications();

  // Phase A.1: PortalStateEngine — normalized proof-validated card states
  const portalContextData = loading ? null : { project, order: portalOrder, subscription, health: healthData, is_admin_preview: isAdminPreview };
  const { portalState, loading: portalStateLoading } = usePortalState(portalContextData);

  useEffect(() => {
    const init = async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }
      const me = await base44.auth.me();
      setUser(me);
      try {
        const resp = await base44.functions.invoke("getClientPortalContext", {});
        const context = resp.data || resp;
        setProject(context.project || null);
        setPortalOrder(context.order || null);
        setSubscription(context.subscription || null);
        setShowQuickStart(context.project?.quick_start_completed !== true);
        setIsAdminPreview(context.is_admin_preview === true);
        setHealthData(context.health || null);
        setUserRole(context.user_role || null);
        setNotFound(!context.project && !context.is_admin_preview);
        setPortalError(context.message || "");
      } catch (error) {
        setProject(null);
        setPortalOrder(null);
        setSubscription(null);
        setIsAdminPreview(false);
        setHealthData(null);
        setNotFound(true);
        setPortalError(
          error?.data?.error ||
          error?.message ||
          "No portal project is linked to this account yet."
        );
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const openFilesTab = () => setActiveTab("files");
    window.addEventListener("clientsurge:portal-open-files", openFilesTab);
    return () => window.removeEventListener("clientsurge:portal-open-files", openFilesTab);
  }, []);

  const refreshProject = async () => {
    if (!user) return;
    try {
      const resp = await base44.functions.invoke("getClientPortalContext", {});
      const context = resp.data || resp;
      if (context?.project) {
        setProject(context.project);
        setPortalOrder(context.order || null);
        setSubscription(context.subscription || null);
        setIsAdminPreview(context.is_admin_preview === true);
        setHealthData(context.health || null);
        setNotFound(false);
        setPortalError(context.message || "");
      } else {
        setProject(null);
        setPortalOrder(context?.order || null);
        setSubscription(context?.subscription || null);
        setIsAdminPreview(context?.is_admin_preview === true);
        setHealthData(context?.health || null);
        setNotFound(!context?.is_admin_preview);
        setPortalError(context?.message || "No portal project is linked to this account yet.");
      }
    } catch (error) {
      setProject(null);
      setPortalOrder(null);
      setSubscription(null);
      setIsAdminPreview(false);
      setHealthData(null);
      setNotFound(true);
      setPortalError(
        error?.data?.error ||
        error?.message ||
        "No portal project is linked to this account yet."
      );
    }
  };

  // Real-time subscription at page level
  useEffect(() => {
    if (!project?.id) return;
    const unsubscribe = base44.entities.ClientProject.subscribe((event) => {
      if (event.id === project.id && event.type !== "delete") {
        setProject(event.data);
      }
    });
    return unsubscribe;
  }, [project?.id]);

  useEffect(() => {
    if (!portalOrder?.id) return;
    const unsubscribe = base44.entities.Order.subscribe((event) => {
      if (event.id === portalOrder.id && event.type !== "delete") {
        refreshProject();
      }
    });
    return unsubscribe;
  }, [portalOrder?.id]);

  if (loading) {
    return <PortalLoadingSkeleton />;
  }

  if (notFound || !project) {
    // Admin preview mode — show info banner, not a confusing empty state
    if (isAdminPreview || user?.role === "admin" || user?.role === "super_admin") {
      return (
        <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#F7F8FA" }}>
          <div className="max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)" }}>
              <Eye className="w-8 h-8" style={{ color: "#B8941F" }} />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-2">Admin Preview Mode</h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              No client selected. You're logged in as an admin ({user?.email}), and no paid client order resolved for this account.
            </p>
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-left mb-6">
              <p className="text-xs font-semibold text-foreground mb-2">What this means:</p>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Admins see this preview state instead of an error</li>
                <li>To view a real client dashboard, log in with that client's email</li>
                <li>Or use the Admin Dashboard for system-level views</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <a href="/admin"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}>
                Go to Admin Dashboard
              </a>
              <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Back to Home</a>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#F7F8FA" }}>
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">Setting Up Your System</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            {portalError || "Your services are being set up. You'll receive a confirmation email within 24 hours once your project is linked."}
          </p>
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-left mb-6">
            <p className="text-xs font-semibold text-foreground mb-2">What to expect:</p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>Our team reviews your order within 1 business day</li>
              <li>You'll get an onboarding form to configure your system</li>
              <li>Your portal will reflect live status within 24–48 hours</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <a
              href="mailto:support@clientsurgesystems.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
            >
              Contact Support
            </a>
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#f8f9fc" }}>
      {/* Quick Start Wizard (modal overlay) */}
      {showQuickStart && project && (
        <PortalLazy>
          <QuickStartWizard
            project={project}
            onComplete={() => { setShowQuickStart(false); refreshProject(); }}
            onDismiss={() => setShowQuickStart(false)}
          />
        </PortalLazy>
      )}

      {/* Sidebar Navigation */}
      <PortalSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => base44.auth.logout("/")}
        businessName={project?.business_name}
        userEmail={user?.email}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top header bar */}
        <header
          className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between flex-shrink-0"
          role="banner"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-50"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 font-display">
              {TAB_LABELS[activeTab] || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <PortalLazy>
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClear={clearNotifications}
              />
            </PortalLazy>
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-gray-500">
                {(user?.full_name || user?.email || "U")[0].toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Admin Preview Banner */}
        {isAdminPreview && (
          <div className="px-6 pt-4">
            <PortalLazy>
              <AdminPreviewBanner userEmail={user?.email} linkStatus={portalError || "no_paid_order"} />
            </PortalLazy>
          </div>
        )}

        {/* Content */}
        <main id="main-content" className="flex-1 px-6 py-6 overflow-y-auto">
          {activeTab === "dashboard" && (
            <PortalStateBoundary onRetry={refreshProject}>
              <PortalDashboardOverview
                project={project}
                portalOrder={portalOrder}
                subscription={subscription}
                healthData={healthData}
                user={user}
                userEmail={user?.email}
                isAdminPreview={isAdminPreview}
                userRole={userRole}
                setActiveTab={setActiveTab}
                refreshProject={refreshProject}
                portalState={portalState}
                portalStateLoading={portalStateLoading}
              />
            </PortalStateBoundary>
          )}
          {activeTab === "quickstart" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="installation_progress"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <QuickStartInline
                  project={project}
                  onComplete={() => { refreshProject(); setActiveTab("dashboard"); }}
                />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "performance" && (
           <PortalTabWrapper
             portalState={portalState}
             portalStateLoading={portalStateLoading}
             cardKey="automation_health"
             isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
             onRetry={refreshProject}
           >
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Revenue & Automations</h2>
                <p className="text-muted-foreground">Track your system performance, active automations, and revenue impact.</p>
              </div>

              <PortalLazy>
                {isAdminPreview && <AdminPreviewBanner userEmail={user?.email} linkStatus={"no_paid_order"} />}
              </PortalLazy>

              <PortalLazy>
                <InternalFilterNotice isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"} />
              </PortalLazy>

              <PortalLazy>
                <LaunchReadinessPanel
                  order={portalOrder}
                  project={project}
                  events={healthData?.recent_events || []}
                  portalState={portalState}
                  isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
                />
              </PortalLazy>

              <PortalLazy>
                <ActiveAutomationsPanel
                  packageKey={portalOrder?.package_type || portalOrder?.selected_package_type}
                  services={portalOrder?.services || []}
                  failedEvents={(healthData?.recent_events || []).filter(e => e.status === "failed")}
                  isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
                  portalState={portalState}
                />
              </PortalLazy>

              <PortalLazy>
                <RecentSystemProofPanel
                  events={healthData?.recent_events || []}
                  isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
                  portalState={portalState}
                />
              </PortalLazy>

              <PortalLazy>
                <RecentIssuesPanel
                  events={healthData?.recent_events || []}
                  isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
                  portalState={portalState}
                />
              </PortalLazy>

              <PortalLazy>
                <RevenueMetricsPanel
                  portalState={portalState}
                  isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
                />
              </PortalLazy>

              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-bold text-foreground mb-3">Active Automations</h3>
                <PortalLazy>
                  <AutomationsOverview portalState={portalState} order_id={portalOrder?.id} />
                </PortalLazy>
              </div>
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-bold text-foreground mb-3">System Activity</h3>
                <PortalLazy>
                  <AutomatedResponsesLog portalState={portalState} />
                </PortalLazy>
              </div>
            </div>
           </PortalTabWrapper>
          )}
          {activeTab === "realtime" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="automation_health"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <RealTimeMetricsPanel
                  project={project}
                  isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
                  portalState={portalState}
                />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "metrics" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="lead_capture"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <LeadFlowDashboard portalState={portalState} emptyState={<EmptyStateDashboard variant="leads" />} />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "tasks" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="activity_log"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <TasksDashboard
                  project={project}
                  portalState={portalState}
                  isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
                />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "checklist" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="installation_progress"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <AutomationChecklist
                  order_id={portalOrder?.id}
                  portalState={portalState}
                  isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
                />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "leads" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="lead_capture"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <LeadActivityFeed
                  project={project}
                  portalState={portalState}
                  isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
                />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "progress" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="installation_progress"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <div className="space-y-5">
                <PortalLazy>
                  <GettingStartedBanner project={project} order={portalOrder} />
                </PortalLazy>
                <PortalLazy>
                  <SetupProgressHub
                    project={project}
                    order={portalOrder}
                    user={user}
                    portalState={portalState}
                    isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
                  />
                </PortalLazy>
                <PortalLazy>
                  <OrderTracker />
                </PortalLazy>
              </div>
            </PortalTabWrapper>
          )}
          {activeTab === "order-status" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="installation_progress"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <ClientOrderStatusTab order_id={portalOrder?.id} />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "timeline" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="timeline"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <PortalTimeline order={portalOrder} project={project} />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "deadlines" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="timeline"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <DeadlinesPanel project={project} />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "files" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="documents"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <FilesPanel project={project} />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "billing" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="billing"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <BillingDashboard project={project} order={portalOrder} subscription={subscription} onSubscriptionChanged={refreshProject} />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "referrals" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="recommendations"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <ReferABusiness
                  order_id={portalOrder?.id || project?.id || user?.email}
                  client_name={project?.client_name || project?.business_name || user?.full_name || user?.email}
                />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "support" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="support"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <SupportChat project={project} user={user} />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "plan" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="billing"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <PlanManager project={project} subscription={subscription} onUpdated={refreshProject} />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "reports" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="reports"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <WeeklyReports project={project} portalState={portalState} />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "updates" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="recommendations"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <PortalWhatsNew />
              </PortalLazy>
            </PortalTabWrapper>
          )}
          {activeTab === "settings" && (
            <PortalTabWrapper
              portalState={portalState}
              portalStateLoading={portalStateLoading}
              cardKey="support"
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              onRetry={refreshProject}
            >
              <PortalLazy>
                <PortalSettings project={project} user={user} onUpdated={refreshProject} />
              </PortalLazy>
            </PortalTabWrapper>
          )}
        </main>
      </div>
    </div>
  );
}