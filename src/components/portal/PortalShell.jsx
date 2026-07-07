/**
 * PortalShell — unified SaaS workspace shell for the client portal.
 * Wraps sidebar + header + sub-tab nav + mobile bottom nav.
 * All portal pages share the same layout, spacing, navigation, and error behavior.
 */
import { lazy, Suspense, useState } from "react";
import PortalSidebar from "./PortalSidebar";
import PortalMobileBottomNav from "./PortalMobileBottomNav";
import PortalHeader from "./PortalHeader";
import PortalLogoutConfirm from "./PortalLogoutConfirm";
import { getSectionTabs, getPortalSection, getClientPortalTab } from "@/lib/portalNavigationConfig";

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
  showLogoutConfirm = false,
  onLogoutConfirm,
  onLogoutCancel,
  businessName,
  userEmail,
  user,
  project,
  plan,
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
  const sectionConfig = getPortalSection(section);
  const sectionLabel = sectionConfig?.label || "Dashboard";
  const deploymentStatus = project?._deploymentStatus || null;

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
        {/* Enhanced Header (Phase 4.3) */}
        <PortalHeader
          sectionLabel={getClientPortalTab(activeTab)?.label || sectionLabel}
          businessName={businessName}
          plan={plan || project?.plan}
          deploymentStatus={deploymentStatus}
          onOpenMobile={() => setMobileSidebarOpen(true)}
          onSupportClick={() => onSectionChange("support")}
        >
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
        </PortalHeader>

        {/* Sub-tab navigation bar — shown when section has multiple tabs */}
        {showSubTabs && (
          <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-2 flex items-center gap-1 overflow-x-auto">
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

      {showLogoutConfirm && (
        <PortalLogoutConfirm onConfirm={onLogoutConfirm} onCancel={onLogoutCancel} />
      )}

      <PortalMobileBottomNav section={section} onSectionChange={onSectionChange} />
    </div>
  );
}