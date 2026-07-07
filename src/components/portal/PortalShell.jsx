/**
 * PortalShell — unified SaaS workspace shell for the client portal.
 * Wraps sidebar + header + sub-tab nav + mobile bottom nav.
 * All portal pages share the same layout, spacing, navigation, and error behavior.
 */
import { lazy, Suspense, useState } from "react";
import { Menu } from "lucide-react";
import PortalSidebar from "./PortalSidebar";
import PortalMobileBottomNav from "./PortalMobileBottomNav";
import { getSectionTabs } from "@/lib/portalNavigationConfig";

const NotificationBell = lazy(() => import("./NotificationBell"));

function ShellLazy({ children }) {
  return <Suspense fallback={<div className="h-8 w-8" />}>{children}</Suspense>;
}

export default function PortalShell({
  activeTab,
  setActiveTab,
  section,
  onSectionChange,
  onLogout,
  businessName,
  userEmail,
  user,
  project,
  tabLabels = {},
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  overlay,
  children,
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const sectionTabs = getSectionTabs(section);
  const showSubTabs = sectionTabs.length > 1;

  return (
    <div className="min-h-screen flex" style={{ background: "#f8f9fc" }}>
      {overlay}

      <PortalSidebar
        section={section}
        onSectionChange={onSectionChange}
        onLogout={onLogout}
        businessName={businessName}
        userEmail={userEmail}
        project={project}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header
          className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between flex-shrink-0"
          role="banner"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 font-display">
              {tabLabels[activeTab] || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ShellLazy>
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                onClear={onClearNotifications}
              />
            </ShellLazy>
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-gray-500">
                {(user?.full_name || user?.email || "U")[0].toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Sub-tab navigation bar — shown when section has multiple tabs */}
        {showSubTabs && (
          <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-1 overflow-x-auto">
            {sectionTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                    isActive
                      ? "bg-[#00AEEF] text-white shadow-[0_2px_8px_rgba(0,174,239,0.3)]"
                      : "text-gray-600 hover:bg-blue-50 hover:text-[#0088CC]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Main content */}
        <main id="main-content" className="flex-1 px-6 py-6 overflow-y-auto pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      <PortalMobileBottomNav section={section} onSectionChange={onSectionChange} />
    </div>
  );
}