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
  ADMIN_MOBILE_QUICK_NAVIGATION_ITEMS,
  ADMIN_SHELL_NAVIGATION_GROUPS,
  getPlatformNavigationGroups,
  getPlatformNavigationItems,
} from "@/lib/platformIntegrationFoundation";
import {
  LogOut, Menu, X, LayoutDashboard, Settings, BarChart3, MessageSquare,
  Activity, Users, FolderKanban, Zap, ClipboardList, Loader2, Send, Flame,
  Mail, Target, PieChart, Layers, DollarSign, Inbox, RefreshCw,
  Server, RotateCcw, BookOpen, Star, ArrowLeft, ShieldCheck, ListChecks, Ban,
  Sparkles,
} from "lucide-react";
import AdminGlobalSearch from "./AdminGlobalSearch";
import DarkModeToggle from "./DarkModeToggle";
import AdminSessionGuard from "./AdminSessionGuard";

const NAV_ICON_BY_ROUTE_ID = {
  "admin-overview": LayoutDashboard,
  "platform-integration": Layers,
  "audit-command-center": ShieldCheck,
  "launch-proof": ShieldCheck,
  "lead-intelligence": Flame,
  analytics: BarChart3,
  revenue: DollarSign,
  attribution: PieChart,
  health: Activity,
  "guided-onboarding": Zap,
  "client-projects": FolderKanban,
  "deployment-manager": ShieldCheck,
  "install-queue": Server,
  "launch-gates": ClipboardList,
  "ops-verification": ShieldCheck,
  "inbound-readiness": ShieldCheck,
  "broken-flows": Ban,
  "publish-drift": Server,
  leads: Users,
  priority: Star,
  "website-leads": Target,
  "demo-bookings": ClipboardList,
  "client-onboarding": ClipboardList,
  "onboarding-pipeline": LayoutDashboard,
  "opportunity-review": ListChecks,
  inbox: Inbox,
  "communication-logs": MessageSquare,
  templates: MessageSquare,
  "review-request": Star,
  "email-campaigns": Mail,
  routing: Target,
  "ai-marketing": Sparkles,
  automations: Zap,
  "ai-sales": Zap,
  "automation-activity": Activity,
  "task-board": ClipboardList,
  "campaign-builder": Layers,
  drip: Send,
  nurture: Flame,
  cadence: Settings,
  reactivation: RotateCcw,
  "settings-organization": Settings,
  settings: Settings,
  "crm-health": ShieldCheck,
  "sprint2-blockers": Ban,
  "audit-log": ShieldCheck,
  qa: RefreshCw,
  "install-guide": BookOpen,
  "settings-billing": DollarSign,
  "settings-usage": Activity,
  "settings-support": MessageSquare,
};

function addPresentation(items) {
  return items.map((item) => ({
    ...item,
    icon: NAV_ICON_BY_ROUTE_ID[item.routeId] || LayoutDashboard,
  }));
}

function addGroupPresentation(groups) {
  return groups.map((group) => ({
    ...group,
    items: addPresentation(group.items),
  }));
}

const isDesktopViewport = () => typeof window === "undefined" || window.innerWidth >= 1024;

export default function AdminShell({ children, title, activeId }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(isDesktopViewport);
  const [loggingOut, setLoggingOut] = useState(false);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [webhookErrorCount, setWebhookErrorCount] = useState(0);
  const navGroups = addGroupPresentation(getPlatformNavigationGroups(user, ADMIN_SHELL_NAVIGATION_GROUPS));
  const mobileQuickNav = addPresentation(getPlatformNavigationItems(user, ADMIN_MOBILE_QUICK_NAVIGATION_ITEMS));

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
    navigate(item.destination || item.path || "/admin");
    if (typeof window !== "undefined" && window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleLogout = () => {
    setLoggingOut(true);
    base44.auth.logout("/");
  };

  const isActive = (item) => {
    const currentTab = new URLSearchParams(location.search).get("tab");
    if (activeId === item.id || activeId === item.routeId) return true;
    if (item.tab) {
      return location.pathname === item.path && currentTab === item.tab;
    }
    if (item.path !== "/admin") {
      return location.pathname === item.path;
    }
    return location.pathname === "/admin" && !currentTab && item.routeId === "admin-overview";
  };

  return (
    <AdminSessionGuard isAdmin={isAdmin}>
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[min(20rem,86vw)] lg:w-64 bg-background border-r border-border transition-transform duration-300 lg:translate-x-0 shadow-2xl lg:shadow-none pt-[env(safe-area-inset-top)] lg:pt-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        <div className="p-4 border-b border-border">
          <button
            onClick={() => navigate("/admin")}
            className="font-display text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            ClientSurge <span className="text-primary">Admin</span>
          </button>
        </div>

        <div className="px-3 py-2 border-b border-border">
          <AdminGlobalSearch
            onNavigate={() => {
              if (typeof window !== "undefined" && window.innerWidth < 1024) setSidebarOpen(false);
            }}
          />
        </div>

        <nav className="flex-1 p-3 overflow-y-auto space-y-4 overscroll-contain">
          {navGroups.map(({ group, items }) => (
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

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-background/95 backdrop-blur border-b border-border px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-10 pt-[max(0.625rem,env(safe-area-inset-top))] lg:pt-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden inline-flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-lg transition-colors text-sm font-semibold"
              aria-label={sidebarOpen ? "Close admin navigation" : "Open admin navigation"}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              <span className="hidden sm:inline">Menu</span>
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
            {mobileQuickNav.map((item) => (
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

        <div className="flex-1 overflow-auto p-3 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-7xl mx-auto min-w-0">{children}</div>
        </div>
      </div>

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
    </AdminSessionGuard>
  );
}
