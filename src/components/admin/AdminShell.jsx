/**
 * AdminShell — shared layout wrapper for all standalone admin pages.
 * Provides a consistent sidebar + topbar with full nav links back to /admin.
 */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { countWebhookErrorEvents } from "@/lib/adminUnreadCounts";
import {
  LogOut, Menu, X, LayoutDashboard, Settings, BarChart3, MessageSquare,
  Activity, Users, FolderKanban, Zap, ClipboardList, Loader2, Send, Flame,
  Mail, Target, PieChart, Layers, DollarSign, Inbox, RefreshCw,
  Server, RotateCcw, BookOpen, Star, ArrowLeft, ShieldCheck, ListChecks,
} from "lucide-react";
import AdminGlobalSearch from "./AdminGlobalSearch";
import DarkModeToggle from "./DarkModeToggle";

const NAV_GROUPS = [
  {
    group: "Main",
    items: [
      { id: "overview",         label: "Overview",          icon: LayoutDashboard, path: "/admin" },
      { id: "leads",            label: "Leads",             icon: Users,           path: "/admin", tab: "leads" },
      { id: "crm-health",       label: "CRM Health",        icon: ShieldCheck,     path: "/admin", tab: "crm-health" },
      { id: "client-projects",  label: "Client Projects",   icon: FolderKanban,    path: "/admin", tab: "client-projects" },
      { id: "inbox",            label: "Inbox",             icon: Inbox,           path: "/admin", tab: "inbox", badge: "inbox" },
      { id: "onboarding",       label: "Client Onboarding", icon: ClipboardList,   path: "/admin/onboarding" },
      { id: "onboarding-pipeline", label: "Onboarding Pipeline", icon: LayoutDashboard, path: "/admin/onboarding-pipeline" },
    ],
  },
  {
    group: "Automation",
    items: [
      { id: "website-leads",    label: "Website Leads",     icon: Target,          path: "/admin", tab: "website-leads" },
      { id: "install-queue",    label: "Install Queue",     icon: Server,          path: "/admin", tab: "install-queue" },
      { id: "install-checklists", label: "Install Checklists", icon: ClipboardList, path: "/admin", tab: "install-checklists" },
      { id: "automations",      label: "Automation Status", icon: Zap,             path: "/admin/automations" },
      { id: "drip",             label: "Drip Campaigns",    icon: Send,            path: "/admin", tab: "drip" },
      { id: "nurture",          label: "Nurture Campaigns", icon: Flame,           path: "/admin", tab: "nurture" },
      { id: "cadence",          label: "Dynamic Cadence",   icon: Settings,        path: "/admin", tab: "cadence" },
      { id: "email-campaigns",  label: "Email Campaigns",   icon: Mail,            path: "/admin", tab: "email-campaigns" },
      { id: "campaign-builder", label: "Campaign Builder",  icon: Layers,          path: "/admin", tab: "campaign-builder" },
      { id: "reactivation",     label: "Lead Reactivation", icon: RotateCcw,       path: "/admin", tab: "reactivation" },
      { id: "routing",          label: "Lead Routing",      icon: Target,          path: "/admin", tab: "routing" },
    ],
  },
  {
    group: "Insights",
    items: [
      { id: "analytics",        label: "Analytics",         icon: BarChart3,       path: "/admin", tab: "analytics" },
      { id: "revenue",          label: "Revenue & MRR",     icon: DollarSign,      path: "/admin", tab: "revenue" },
      { id: "priority",         label: "Priority Queue",    icon: Star,            path: "/admin", tab: "priority" },
      { id: "attribution",      label: "Source Attribution",icon: PieChart,        path: "/admin", tab: "attribution" },
      { id: "opportunity-review", label: "Opportunity Review", icon: ListChecks,    path: "/admin/opportunity-review" },
    ],
  },
  {
    group: "System",
    items: [
      { id: "ops-verification", label: "Ops Verification Center", icon: ShieldCheck, path: "/admin/ops-verification" },
      { id: "audit-command-center", label: "Audit Command Center", icon: ShieldCheck, path: "/admin", tab: "audit-command-center" },
      { id: "task-board",       label: "Task Board",        icon: ClipboardList,   path: "/admin", tab: "task-board" },
      { id: "health",           label: "Integration Health",icon: Activity,        path: "/admin", tab: "health" },
      { id: "audit-log",        label: "Audit Log",         icon: ShieldCheck,     path: "/admin", tab: "audit-log" },
      { id: "logs",             label: "Communication Logs",icon: MessageSquare,   path: "/admin", tab: "logs", badge: "webhook-errors" },
      { id: "templates",        label: "Templates",         icon: MessageSquare,   path: "/admin", tab: "templates" },
      { id: "review-request",   label: "Review Requests",   icon: Star,            path: "/admin", tab: "review-request" },
      { id: "settings",         label: "Settings",          icon: Settings,        path: "/admin", tab: "settings" },
      { id: "qa",               label: "QA Tools",          icon: RefreshCw,       path: "/admin", tab: "qa" },
      { id: "install-guide",    label: "Install Guide",     icon: BookOpen,        path: "/admin/install-guide" },
    ],
  },
];

const isDesktopViewport = () => typeof window === "undefined" || window.innerWidth >= 1024;
const MOBILE_QUICK_NAV = [
  { id: "overview", label: "Overview", path: "/admin" },
  { id: "leads", label: "Leads", path: "/admin", tab: "leads" },
  { id: "inbox", label: "Inbox", path: "/admin", tab: "inbox" },
  { id: "settings", label: "Settings", path: "/admin", tab: "settings" },
];

export default function AdminShell({ children, title, activeId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(isDesktopViewport);
  const [loggingOut, setLoggingOut] = useState(false);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [webhookErrorCount, setWebhookErrorCount] = useState(0);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(isDesktopViewport());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const [msgs, failedEvents] = await Promise.all([
          base44.entities.SupportMessage.filter({ read: false }, "-created_date", 200),
          base44.asServiceRole.entities.CommunicationEvent.filter({ status: "failed" }, "-created_date", 200),
        ]);
        setInboxUnread((msgs || []).filter(m => m.role === "client").length);
        setWebhookErrorCount(countWebhookErrorEvents(failedEvents || []));
      } catch {}
    };
    loadUnread();
    const t = setInterval(loadUnread, 30000);
    return () => clearInterval(t);
  }, []);

  const handleNavClick = (item) => {
    if (item.tab) {
      // Navigate to /admin with a ?tab= param so AdminDashboard can pick it up
      navigate(`/admin?tab=${item.tab}`);
    } else {
      navigate(item.path);
    }
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleLogout = () => {
    setLoggingOut(true);
    base44.auth.logout("/");
  };

  const isActive = (item) => {
    const currentTab = new URLSearchParams(location.search).get("tab");
    if (item.tab) {
      return activeId === item.id || (location.pathname === item.path && currentTab === item.tab);
    }
    if (item.path !== "/admin" && !item.tab) {
      return location.pathname === item.path;
    }
    return activeId === item.id;
  };

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[min(20rem,86vw)] lg:w-64 bg-background border-r border-border transition-transform duration-300 lg:translate-x-0 shadow-2xl lg:shadow-none pt-[env(safe-area-inset-top)] lg:pt-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <button
            onClick={() => navigate("/admin")}
            className="font-display text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            ClientSurge <span className="text-primary">Admin</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border">
          <AdminGlobalSearch
            onNavigate={(tab) => {
              navigate(`/admin?tab=${tab}`);
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-4 overscroll-contain">
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group}>
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  const unread = item.badge === "inbox"
                    ? inboxUnread
                    : item.badge === "webhook-errors"
                    ? webhookErrorCount
                    : 0;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3 lg:py-2.5 rounded-lg transition-colors font-medium text-sm ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {unread > 0 && (
                        <span className={`rounded-full text-[10px] font-bold px-1.5 py-0.5 ${active ? "bg-white/20 text-white" : "bg-primary text-primary-foreground"}`}>
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="px-4 py-2">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-semibold text-foreground truncate">{user?.full_name || "Admin"}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors text-sm disabled:opacity-60"
          >
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {loggingOut ? "Signing out…" : "Logout"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-background/95 backdrop-blur border-b border-border px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-10 pt-[max(0.625rem,env(safe-area-inset-top))] lg:pt-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden inline-flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-lg transition-colors text-sm font-semibold"
              aria-label={sidebarOpen ? "Close admin navigation" : "Open admin navigation"}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              <span>Menu</span>
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Main Menu
            </button>
            <span className="hidden lg:block text-muted-foreground/40">|</span>
            <h2 className="truncate text-sm sm:text-base font-semibold text-foreground">{title}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <DarkModeToggle />
            {inboxUnread > 0 && (
              <button
                onClick={() => navigate("/admin?tab=inbox")}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
              >
                <Inbox className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{inboxUnread} unread</span>
                <span className="xs:hidden">{inboxUnread}</span>
              </button>
            )}
          </div>
        </div>

        <div className="lg:hidden border-b border-border bg-background/95 px-3 py-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {MOBILE_QUICK_NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive(item)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-7xl mx-auto min-w-0">{children}</div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/35 backdrop-blur-[2px] z-30 lg:hidden"
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