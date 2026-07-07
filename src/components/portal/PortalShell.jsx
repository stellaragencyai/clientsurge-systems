/**
 * PortalShell — Enhancement #1, #2, #3, #12
 * Unified SaaS workspace shell for the client portal.
 * Wraps sidebar + premium top bar + sub-tab nav + mobile bottom nav + support pill.
 * Manages logout confirmation modal internally.
 */
import { lazy, Suspense, useState } from "react";
import PortalSidebar from "./PortalSidebar";
import PortalMobileBottomNav from "./PortalMobileBottomNav";
import PremiumPortalTopBar from "./PremiumPortalTopBar";
import PortalLogoutConfirm from "./PortalLogoutConfirm";
import PortalSupportPill from "./PortalSupportPill";
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
  navigateTab,
  businessName,
  userEmail,
  user,
  project,
  plan,
  subscription,
  supportStatus,
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  badges = {},
  overlay,
  children,
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const sectionTabs = getSectionTabs(section);
  const showSubTabs = sectionTabs.length > 1;
  const sectionConfig = getPortalSection(section);
  const sectionLabel = sectionConfig?.label || "Dashboard";
  const deploymentStatus = project?._deploymentStatus || null;

  const handleSignOutClick = () => setShowLogoutConfirm(true);
  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };
  const handleLogoutCancel = () => setShowLogoutConfirm(false);

  const tabLabel = getClientPortalTab(activeTab)?.label || sectionLabel;

  return (
    <div className="min-h-screen flex" style={{ background: "#f8f9fc" }}>
      {overlay}

      <PortalSidebar
        section={section}
        onSectionChange={onSectionChange}
        onSignOut={handleSignOutClick}
        navigateTab={navigateTab}
        businessName={businessName}
        userEmail={userEmail}
        project={project}
        badges={badges}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <PremiumPortalTopBar
          sectionLabel={tabLabel}
          businessName={businessName}
          plan={plan || project?.plan}
          deploymentStatus={deploymentStatus}
          supportStatus={supportStatus}
          onOpenMobile={() => setMobileSidebarOpen(true)}
          onNavigateTab={navigateTab}
          onSignOut={handleSignOutClick}
          user={user}
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
        </PremiumPortalTopBar>

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

        <main id="main-content" className="flex-1 px-6 py-6 overflow-y-auto pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {showLogoutConfirm && (
        <PortalLogoutConfirm onConfirm={handleLogoutConfirm} onCancel={handleLogoutCancel} />
      )}

      <PortalMobileBottomNav section={section} onSectionChange={onSectionChange} />

      <PortalSupportPill onNavigate={() => navigateTab?.("support")} />
    </div>
  );
}