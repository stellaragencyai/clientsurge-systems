import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, LogOut, LayoutDashboard } from "lucide-react";
import BuildTracker from "../components/portal/BuildTracker";
import SupportChat from "../components/portal/SupportChat";
import PlanManager from "../components/portal/PlanManager";
import LeadActivityFeed from "../components/portal/LeadActivityFeed";
import PaymentFailedBanner from "../components/portal/PaymentFailedBanner";
import LeadFlowDashboard from "../components/portal/LeadFlowDashboard";
import NotificationBell from "../components/portal/NotificationBell";
import ClientOnboardingWizard from "../components/portal/ClientOnboardingWizard";
import DeadlinesPanel from "../components/portal/DeadlinesPanel";
import FilesPanel from "../components/portal/FilesPanel";
import BillingDashboard from "../components/portal/BillingDashboard";
import PortalSettings from "../components/portal/PortalSettings";
import TasksDashboard from "../components/portal/TasksDashboard";
import { useLeadNotifications } from "../hooks/useLeadNotifications";

const TABS = [
  { id: "metrics", label: "Lead Flow" },
  { id: "tasks", label: "Tasks" },
  { id: "leads", label: "My Leads" },
  { id: "progress", label: "Build Progress" },
  { id: "deadlines", label: "Deadlines" },
  { id: "files", label: "Files & Docs" },
  { id: "billing", label: "Billing" },
  { id: "support", label: "Support & Messaging" },
  { id: "plan", label: "My Plan" },
  { id: "settings", label: "Settings" },
];

export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [portalOrder, setPortalOrder] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [portalError, setPortalError] = useState("");
  const [activeTab, setActiveTab] = useState("leads");
  const [showOnboarding, setShowOnboarding] = useState(false);
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
        // Show wizard if not completed
        setShowOnboarding(!context.project?.onboarding_wizard_completed);
        setNotFound(false);
        setPortalError("");
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
      setLoading(false);
    };
    init();
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
        setPortalError("");
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">No Project Found</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            {portalError || (
              <>
                We couldn't find a project linked to <span className="font-semibold text-foreground">{user?.email}</span>.
                If you've recently signed up, your project may still be getting set up. Please contact us.
              </>
            )}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Wizard */}
      {showOnboarding && project && (
        <ClientOnboardingWizard
          project={project}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-display font-semibold text-foreground flex flex-col leading-tight">
            <span className="text-sm">ClientSurge</span>
            <span className="text-xs text-primary">Systems</span>
          </div>
          <span className="text-muted-foreground/40 text-lg">·</span>
          <span className="text-sm font-medium text-muted-foreground">Client Portal</span>
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
            <p className="text-xs font-semibold text-foreground">{project.business_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
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
        style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 60%,#c8965c 100%)" }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-amber-300/70 uppercase tracking-widest mb-1">Welcome Back</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-white mb-1">
            {project.business_name}
          </h1>
          <p className="text-amber-100/70 text-sm">
            Plan: <span className="font-semibold text-amber-200">{project.plan}</span>
            {project.go_live_date && (
              <span className="ml-3">· Target go-live: <span className="font-semibold text-amber-200">{project.go_live_date}</span></span>
            )}
          </p>
        </div>
      </div>

      {/* Payment Failed Banner */}
      <PaymentFailedBanner subscription={subscription} order={portalOrder} />

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="border-b border-border bg-white px-6 overflow-x-auto">
        <div className="max-w-4xl mx-auto flex gap-1 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === "metrics" && (
          <LeadFlowDashboard />
        )}
        {activeTab === "tasks" && (
          <TasksDashboard project={project} />
        )}
        {activeTab === "leads" && (
          <LeadActivityFeed project={project} />
        )}
        {activeTab === "progress" && (
          <BuildTracker project={project} order={portalOrder} />
        )}
        {activeTab === "deadlines" && (
          <DeadlinesPanel project={project} />
        )}
        {activeTab === "files" && (
          <FilesPanel project={project} />
        )}
        {activeTab === "billing" && (
          <BillingDashboard project={project} subscription={subscription} />
        )}
        {activeTab === "support" && (
          <SupportChat project={project} user={user} />
        )}
        {activeTab === "plan" && (
          <PlanManager project={project} subscription={subscription} onUpdated={refreshProject} />
        )}
        {activeTab === "settings" && (
          <PortalSettings project={project} user={user} onUpdated={refreshProject} />
        )}
      </div>
    </div>
  );
}
