import { lazy, Suspense, useState, useEffect, useLayoutEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, LayoutDashboard } from "lucide-react";
import SetupProgressHub from "../components/portal/SetupProgressHub";
import SupportChat from "../components/portal/SupportChat";
import PlanManager from "../components/portal/PlanManager";
import LeadActivityFeed from "../components/portal/LeadActivityFeed";
import PaymentFailedBanner from "../components/portal/PaymentFailedBanner";
import LeadFlowDashboard from "../components/portal/LeadFlowDashboard";
import NotificationBell from "../components/portal/NotificationBell";
import QuickStartWizard from "../components/portal/QuickStartWizard";
import QuickStartInline from "../components/portal/QuickStartInline";
import DeadlinesPanel from "../components/portal/DeadlinesPanel";
import FilesPanel from "../components/portal/FilesPanel";
import BillingDashboard from "../components/portal/BillingDashboard";
import ReferABusiness from "../components/portal/ReferABusiness";
import PortalSettings from "../components/portal/PortalSettings";
import TasksDashboard from "../components/portal/TasksDashboard";
import AutomationsOverview from "../components/portal/AutomationsOverview";
import AutomatedResponsesLog from "../components/portal/AutomatedResponsesLog";
import AutomationChecklist from "../components/portal/AutomationChecklist";
import PortalWhatsNew from "../components/portal/PortalWhatsNew";
import ClientOrderStatusTab from "../components/portal/ClientOrderStatusTab";
import { useLeadNotifications } from "../hooks/useLeadNotifications";
import PortalLoadingSkeleton from "../components/portal/PortalLoadingSkeleton";
import PortalTimeline from "../components/portal/PortalTimeline";
import SystemStatusBadge from "../components/portal/SystemStatusBadge";
import OrderTracker from "../components/landing/OrderTracker";

const RevenueMetricsPanel = lazy(() => import("../components/portal/RevenueMetricsPanel"));
const WeeklyReports = lazy(() => import("../components/portal/WeeklyReports"));

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

function LazyPortalPanel({ children }) {
  return <Suspense fallback={<PortalPanelSkeleton />}>{children}</Suspense>;
}

const TABS = [
  { id: "progress", label: "🚀 Setup Progress" },
  { id: "timeline", label: "📍 Timeline" },
  { id: "quickstart", label: "⚡ Quick Start" },
  { id: "performance", label: "🎯 Performance" },
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
        setNotFound(!context.project);
        setPortalError(context.message || "");
      } catch (error) {
        setProject(null);
        setPortalOrder(null);
        setSubscription(null);
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
        setNotFound(false);
        setPortalError(context.message || "");
      } else {
        setProject(null);
        setPortalOrder(context?.order || null);
        setSubscription(context?.subscription || null);
        setNotFound(true);
        setPortalError(context?.message || "No portal project is linked to this account yet.");
      }
    } catch (error) {
      setProject(null);
      setPortalOrder(null);
      setSubscription(null);
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
        <QuickStartWizard
          project={project}
          onComplete={() => { setShowQuickStart(false); refreshProject(); }}
          onDismiss={() => setShowQuickStart(false)}
        />
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
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClear={clearNotifications}
          />
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
          <SystemStatusBadge project={project} />
        </div>
      </div>

      {/* Payment Failed Banner */}
      <PaymentFailedBanner subscription={subscription} order={portalOrder} />

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
      <main id="main-content" className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 portal-tab-content">
        {activeTab === "quickstart" && (
          <QuickStartInline
            project={project}
            onComplete={() => { refreshProject(); setActiveTab("metrics"); }}
          />
        )}
        {activeTab === "performance" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Revenue & Automations</h2>
              <p className="text-muted-foreground">Track your system performance, active automations, and revenue impact.</p>
            </div>
            <LazyPortalPanel>
              <RevenueMetricsPanel />
            </LazyPortalPanel>
            <div className="border-t border-border pt-8">
              <h3 className="text-xl font-bold text-foreground mb-4">Active Automations</h3>
              <AutomationsOverview />
            </div>
            <div className="border-t border-border pt-8">
              <h3 className="text-xl font-bold text-foreground mb-4">System Activity</h3>
              <AutomatedResponsesLog />
            </div>
          </div>
        )}
        {activeTab === "metrics" && (
          <LeadFlowDashboard />
        )}
        {activeTab === "tasks" && (
          <TasksDashboard project={project} />
        )}
        {activeTab === "checklist" && (
          <AutomationChecklist order_id={portalOrder?.id} />
        )}
        {activeTab === "leads" && (
          <LeadActivityFeed project={project} />
        )}
        {activeTab === "progress" && (
          <div className="space-y-6">
            <SetupProgressHub project={project} order={portalOrder} user={user} />
            <OrderTracker />
          </div>
        )}
        {activeTab === "order-status" && (
          <ClientOrderStatusTab order_id={portalOrder?.id} />
        )}
        {activeTab === "timeline" && (
          <PortalTimeline order={portalOrder} project={project} />
        )}
        {activeTab === "deadlines" && (
          <DeadlinesPanel project={project} />
        )}
        {activeTab === "files" && (
          <FilesPanel project={project} />
        )}
        {activeTab === "billing" && (
          <BillingDashboard project={project} order={portalOrder} subscription={subscription} onSubscriptionChanged={refreshProject} />
        )}
        {activeTab === "referrals" && (
          <ReferABusiness
            order_id={portalOrder?.id || project?.id || user?.email}
            client_name={project?.client_name || project?.business_name || user?.full_name || user?.email}
          />
        )}
        {activeTab === "support" && (
          <SupportChat project={project} user={user} />
        )}
        {activeTab === "plan" && (
          <PlanManager project={project} subscription={subscription} onUpdated={refreshProject} />
        )}
        {activeTab === "reports" && (
          <LazyPortalPanel>
            <WeeklyReports project={project} />
          </LazyPortalPanel>
        )}
        {activeTab === "updates" && (
          <PortalWhatsNew />
        )}
        {activeTab === "settings" && (
          <PortalSettings project={project} user={user} onUpdated={refreshProject} />
        )}
      </main>
    </div>
  );
}