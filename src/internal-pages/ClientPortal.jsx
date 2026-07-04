import { lazy, Suspense, useState, useEffect, useLayoutEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, LayoutDashboard, Eye } from "lucide-react";
import { useLeadNotifications } from "../hooks/useLeadNotifications";
import PortalLoadingSkeleton from "../components/portal/PortalLoadingSkeleton";

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

const TABS = [
  { id: "progress", label: "🚀 Setup Progress" },
  { id: "timeline", label: "📍 Timeline" },
  { id: "quickstart", label: "⚡ Quick Start" },
  { id: "performance", label: "🎯 Performance" },
  { id: "realtime", label: "📡 Real-Time Metrics" },
  { id: "metrics", label: "Lead Flow" },
  { id: "tasks", label: "Tasks" },
  { id: "checklist", label: "Checklist" },
  { id: "leads", label: "My Leads" },
  { id: "deadlines", label: "Deadlines" },
  { id: "files", label: "Files & Docs" },
  { id: "billing", label: "Billing" },
  { id: "referrals", label: "Referrals" },
  { id: "support", label: "Support & Messaging" },
  { id: "plan", label: "My Plan" },
  { id: "reports", label: "Weekly Report" },
  { id: "updates", label: "What's New" },
  { id: "settings", label: "Settings" },
];

TABS.splice(1, 0, { id: "order-status", label: "Order Status" });

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
  const [activeTab, setActiveTab] = useState("progress");
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [isAdminPreview, setIsAdminPreview] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useLeadNotifications();

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
        const context = await base44.functions.invoke("getClientPortalContext", {});
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
      const context = await base44.functions.invoke("getClientPortalContext", {});
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
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
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
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
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
    <div className="min-h-screen bg-background">
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

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 md:px-6 h-16 flex items-center justify-between" role="banner">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
          >
            <span className="text-white text-xs font-bold">CS</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold" style={{ background: "linear-gradient(135deg,#0088CC,#00AEEF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ClientSurge Systems</span>
            <span className="text-[10px] text-muted-foreground">Client Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <PortalLazy>
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClear={clearNotifications}
            />
          </PortalLazy>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-foreground">{project?.business_name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={() => base44.auth.logout("/")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {/* Hero greeting */}
      <div
        className="px-6 py-10"
        style={{ background: "linear-gradient(135deg,#003B8F 0%,#006BB0 60%,#00AEEF 100%)" }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-blue-200/70 uppercase tracking-widest mb-1">Welcome Back</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-white mb-1">
            {project?.business_name}
          </h1>
          <p className="text-blue-100/70 text-sm">
            Plan: <span className="font-semibold text-blue-200">{project?.plan}</span>
            {project?.go_live_date && (
              <span className="ml-3">· Target go-live: <span className="font-semibold text-blue-200">{project.go_live_date}</span></span>
            )}
          </p>
          <PortalLazy>
            <SystemStatusBadge project={project} />
          </PortalLazy>
        </div>
      </div>

      {/* Payment Failed Banner */}
      <PortalLazy>
        <PaymentFailedBanner subscription={subscription} order={portalOrder} />
      </PortalLazy>

      {/* Admin Preview Banner — shown globally when admin is in preview mode */}
      {isAdminPreview && (
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4">
          <PortalLazy>
            <AdminPreviewBanner userEmail={user?.email} linkStatus={portalError || "no_paid_order"} />
          </PortalLazy>
        </div>
      )}

      {/* Missing assets banner — shown if onboarding is incomplete */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4">
        <PortalLazy>
          <OnboardingMissingAssetsBanner project={project} onNavigate={setActiveTab} />
        </PortalLazy>
      </div>

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="border-b border-border bg-background px-4 md:px-6 overflow-x-auto relative" role="tablist" aria-label="Portal sections">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-background to-transparent z-10" aria-hidden="true" />
        <div className="max-w-4xl mx-auto flex gap-0.5 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 md:px-4 py-3.5 text-xs md:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap min-h-[44px] ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main id="main-content" className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10 portal-tab-content">
        {activeTab === "quickstart" && (
          <PortalLazy>
            <QuickStartInline
              project={project}
              onComplete={() => { refreshProject(); setActiveTab("metrics"); }}
            />
          </PortalLazy>
        )}
        {activeTab === "performance" && (
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
              />
            </PortalLazy>

            <PortalLazy>
              <ActiveAutomationsPanel
                packageKey={portalOrder?.package_type || portalOrder?.selected_package_type}
                services={portalOrder?.services || []}
                failedEvents={(healthData?.recent_events || []).filter(e => e.status === "failed")}
                isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              />
            </PortalLazy>

            <PortalLazy>
              <RecentSystemProofPanel
                events={healthData?.recent_events || []}
                isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              />
            </PortalLazy>

            <PortalLazy>
              <RecentIssuesPanel
                events={healthData?.recent_events || []}
                isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              />
            </PortalLazy>

            <PortalLazy>
              <RevenueMetricsPanel />
            </PortalLazy>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-bold text-foreground mb-3">Active Automations</h3>
              <PortalLazy>
                <AutomationsOverview />
              </PortalLazy>
            </div>
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-bold text-foreground mb-3">System Activity</h3>
              <PortalLazy>
                <AutomatedResponsesLog />
              </PortalLazy>
            </div>
          </div>
        )}
        {activeTab === "realtime" && (
          <PortalLazy>
            <RealTimeMetricsPanel project={project} />
          </PortalLazy>
        )}
        {activeTab === "metrics" && (
          <PortalLazy>
            <LeadFlowDashboard emptyState={<EmptyStateDashboard variant="leads" />} />
          </PortalLazy>
        )}
        {activeTab === "tasks" && (
          <PortalLazy>
            <TasksDashboard project={project} />
          </PortalLazy>
        )}
        {activeTab === "checklist" && (
          <PortalLazy>
            <AutomationChecklist order_id={portalOrder?.id} />
          </PortalLazy>
        )}
        {activeTab === "leads" && (
          <PortalLazy>
            <LeadActivityFeed project={project} />
          </PortalLazy>
        )}
        {activeTab === "progress" && (
          <div className="space-y-5">
            <PortalLazy>
              <GettingStartedBanner project={project} order={portalOrder} />
            </PortalLazy>
            <PortalLazy>
              <SetupProgressHub project={project} order={portalOrder} user={user} />
            </PortalLazy>
            <PortalLazy>
              <OrderTracker />
            </PortalLazy>
          </div>
        )}
        {activeTab === "order-status" && (
          <PortalLazy>
            <ClientOrderStatusTab order_id={portalOrder?.id} />
          </PortalLazy>
        )}
        {activeTab === "timeline" && (
          <PortalLazy>
            <PortalTimeline order={portalOrder} project={project} />
          </PortalLazy>
        )}
        {activeTab === "deadlines" && (
          <PortalLazy>
            <DeadlinesPanel project={project} />
          </PortalLazy>
        )}
        {activeTab === "files" && (
          <PortalLazy>
            <FilesPanel project={project} />
          </PortalLazy>
        )}
        {activeTab === "billing" && (
          <PortalLazy>
            <BillingDashboard project={project} order={portalOrder} subscription={subscription} onSubscriptionChanged={refreshProject} />
          </PortalLazy>
        )}
        {activeTab === "referrals" && (
          <PortalLazy>
            <ReferABusiness
              order_id={portalOrder?.id || project?.id || user?.email}
              client_name={project?.client_name || project?.business_name || user?.full_name || user?.email}
            />
          </PortalLazy>
        )}
        {activeTab === "support" && (
          <PortalLazy>
            <SupportChat project={project} user={user} />
          </PortalLazy>
        )}
        {activeTab === "plan" && (
          <PortalLazy>
            <PlanManager project={project} subscription={subscription} onUpdated={refreshProject} />
          </PortalLazy>
        )}
        {activeTab === "reports" && (
          <PortalLazy>
            <WeeklyReports project={project} />
          </PortalLazy>
        )}
        {activeTab === "updates" && (
          <PortalLazy>
            <PortalWhatsNew />
          </PortalLazy>
        )}
        {activeTab === "settings" && (
          <PortalLazy>
            <PortalSettings project={project} user={user} onUpdated={refreshProject} />
          </PortalLazy>
        )}
      </main>
    </div>
  );
}