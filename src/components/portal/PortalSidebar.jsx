/**
 * PortalSidebar — fixed left-hand navigation matching the IdentityIQ layout.
 * Replaces the horizontal scrolling tab bar.
 */
import {
  LayoutDashboard, Rocket, MapPin, Zap, Target, Activity,
  Users, UserCheck, CheckSquare, ListChecks, CreditCard,
  FolderOpen, Calendar, Gift, MessageSquare, Package,
  FileText, Bell, Settings, LogOut,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "progress", label: "Setup Progress", icon: Rocket },
      { id: "timeline", label: "Timeline", icon: MapPin },
      { id: "order-status", label: "Order Status", icon: Package },
    ],
  },
  {
    label: "System",
    items: [
      { id: "quickstart", label: "Quick Start", icon: Zap },
      { id: "performance", label: "Performance", icon: Target },
      { id: "realtime", label: "Real-Time Metrics", icon: Activity },
      { id: "metrics", label: "Lead Flow", icon: Users },
      { id: "leads", label: "My Leads", icon: UserCheck },
    ],
  },
  {
    label: "Tasks & Files",
    items: [
      { id: "tasks", label: "Tasks", icon: CheckSquare },
      { id: "checklist", label: "Checklist", icon: ListChecks },
      { id: "deadlines", label: "Deadlines", icon: Calendar },
      { id: "files", label: "Files & Docs", icon: FolderOpen },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "billing", label: "Billing", icon: CreditCard },
      { id: "plan", label: "My Plan", icon: Package },
      { id: "reports", label: "Weekly Report", icon: FileText },
      { id: "referrals", label: "Referrals", icon: Gift },
      { id: "support", label: "Support", icon: MessageSquare },
      { id: "updates", label: "What's New", icon: Bell },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function PortalSidebar({ activeTab, setActiveTab, onLogout, businessName, userEmail, mobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-[240px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        role="navigation"
        aria-label="Portal navigation"
      >
        {/* Logo */}
        <div className="px-5 h-16 flex items-center gap-2.5 border-b border-gray-100 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
          >
            <span className="text-white text-xs font-bold">CS</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-gray-900">ClientSurge</span>
            <span className="text-[10px] text-gray-400">Client Portal</span>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        onCloseMobile?.();
                      }}
                      aria-current={isActive ? "page" : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                        isActive
                          ? "bg-gray-800 text-white"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-gray-500">
                {(businessName || "U")[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{businessName}</p>
              <p className="text-[10px] text-gray-400 truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}