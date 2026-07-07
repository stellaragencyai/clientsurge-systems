/**
 * PortalSidebar — Enhancement #6, #7
 * Primary nav: Dashboard, Setup Progress, Performance, My Leads, Weekly Report, Billing, Support.
 * Lower-frequency tools in collapsible groups: More Setup, Work Tools, Account Tools.
 * Section badges shown only when real data exists — never fabricated.
 */
import { useState } from "react";
import {
  LayoutDashboard, Rocket, Zap, Target, Activity, Users, UserCheck,
  CheckSquare, ListChecks, CreditCard, FolderOpen, Calendar, Gift,
  MessageSquare, Package, FileText, Bell, Settings, LogOut, X, MapPin,
  ChevronDown, MoreHorizontal, ClipboardList,
} from "lucide-react";
import { PORTAL_SECTIONS } from "@/lib/portalNavigationConfig";

const ICON_MAP = {
  LayoutDashboard, Rocket, Zap, Target, Activity, Users, UserCheck,
  CheckSquare, ListChecks, CreditCard, FolderOpen, Calendar, Gift,
  MessageSquare, Package, FileText, Bell, Settings, MapPin, ClipboardList,
};

const PRIMARY_SECTION_IDS = [
  "overview", "onboarding", "automations", "leads", "reports", "billing", "support",
];

// Sub-tab groups for collapsible sections
const COLLAPSIBLE_GROUPS = [
  {
    label: "More Setup",
    tabs: [
      { id: "timeline", label: "Timeline", icon: "MapPin" },
      { id: "quickstart", label: "Quick Start", icon: "Zap" },
      { id: "tasks", label: "Tasks", icon: "CheckSquare" },
      { id: "checklist", label: "Checklist", icon: "ListChecks" },
      { id: "deadlines", label: "Deadlines", icon: "Calendar" },
      { id: "files", label: "Files & Docs", icon: "FolderOpen" },
      { id: "order-status", label: "Order Status", icon: "Package" },
    ],
  },
  {
    label: "Work Tools",
    tabs: [
      { id: "realtime", label: "Real-Time Metrics", icon: "Activity" },
      { id: "metrics", label: "Lead Flow", icon: "Users" },
      { id: "referrals", label: "Referrals", icon: "Gift" },
      { id: "updates", label: "What's New", icon: "Bell" },
      { id: "plan", label: "My Plan", icon: "Package" },
    ],
  },
  {
    label: "Account Tools",
    tabs: [
      { id: "settings", label: "Settings", icon: "Settings" },
    ],
  },
];

// Map tab IDs to badge keys
const TAB_BADGE_MAP = {
  tasks: "tasks",
  checklist: "tasks",
  performance: "issues",
  realtime: "issues",
  billing: "billing",
  plan: "billing",
  files: "files",
  support: "notifications",
  referrals: "notifications",
};

export default function PortalSidebar({
  section,
  onSectionChange,
  onSignOut,
  navigateTab,
  businessName,
  userEmail,
  project,
  badges = {},
  mobileOpen,
  onCloseMobile,
}) {
  const [expandedGroup, setExpandedGroup] = useState(null);
  const safeBusiness = businessName || "Your Business";
  const safeEmail = userEmail || "—";

  const primarySections = PORTAL_SECTIONS.filter((s) => PRIMARY_SECTION_IDS.includes(s.id));

  const getBadgeForTab = (tabId) => {
    const badgeKey = TAB_BADGE_MAP[tabId];
    if (!badgeKey) return null;
    const value = badges[badgeKey];
    if (value === undefined || value === null || value === 0 || value === false) return null;
    return value;
  };

  const renderBadge = (count) => {
    if (count === null || count === undefined) return null;
    const isBool = typeof count === "boolean";
    if (isBool) {
      return (
        <span
          className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"
          title="Needs attention"
        />
      );
    }
    const num = typeof count === "number" ? count : 0;
    if (num <= 0) return null;
    return (
      <span
        className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex-shrink-0"
        style={{ background: num > 0 ? "#EF4444" : "#9CA3AF" }}
      >
        {num}
      </span>
    );
  };

  const renderNavButton = (item, isPrimary = true) => {
    const Icon = ICON_MAP[item.icon] || LayoutDashboard;
    const isActive = section === item.id;
    const badgeCount = isPrimary ? getBadgeForTab(item.defaultTab) : null;
    return (
      <button
        key={item.id}
        onClick={() => {
          onSectionChange(item.id);
          onCloseMobile?.();
        }}
        aria-current={isActive ? "page" : undefined}
        title={item.label}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF] ${
          isActive
            ? "bg-[#00AEEF] text-white shadow-[0_2px_8px_rgba(0,174,239,0.3)]"
            : "text-gray-600 hover:bg-blue-50 hover:text-[#0088CC]"
        }`}
      >
        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
        <span className="truncate flex-1 text-left">{item.label}</span>
        {badgeCount !== null && renderBadge(badgeCount)}
      </button>
    );
  };

  const renderSubTabButton = (tab) => {
    const Icon = ICON_MAP[tab.icon] || LayoutDashboard;
    const badgeCount = getBadgeForTab(tab.id);
    return (
      <button
        key={tab.id}
        onClick={() => {
          navigateTab?.(tab.id);
          onCloseMobile?.();
        }}
        title={tab.label}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors min-h-[40px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
      >
        <Icon className="w-4 h-4 flex-shrink-0 text-gray-400" />
        <span className="truncate flex-1 text-left">{tab.label}</span>
        {badgeCount !== null && renderBadge(badgeCount)}
      </button>
    );
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-[260px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        role="navigation"
        aria-label="Client portal navigation"
      >
        {/* Logo + mobile close */}
        <div className="px-5 h-16 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
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
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
            aria-label="Close navigation menu"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business identity + plan badge */}
        <div className="px-4 py-3 border-b border-gray-50 bg-blue-50/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Business</p>
          <p className="text-sm font-bold text-gray-900 truncate" title={safeBusiness}>{safeBusiness}</p>
          {project?.plan && (
            <span
              className="mt-1.5 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
            >
              {project.plan}
            </span>
          )}
        </div>

        {/* Primary nav — 7 visible destinations */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {primarySections.map((item) => renderNavButton(item))}

          {/* Collapsible groups for lower-frequency tools */}
          {COLLAPSIBLE_GROUPS.map((group) => {
            // Only show groups that have tabs
            if (!group.tabs || group.tabs.length === 0) return null;
            const isExpanded = expandedGroup === group.label;
            // Check if any tab in this group has a badge
            const hasBadge = group.tabs.some((t) => getBadgeForTab(t.id) !== null);
            return (
              <div key={group.label} className="pt-1">
                <button
                  onClick={() => setExpandedGroup(isExpanded ? null : group.label)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
                >
                  <MoreHorizontal className="w-[18px] h-[18px] flex-shrink-0 text-gray-400" />
                  <span className="truncate flex-1 text-left">{group.label}</span>
                  {hasBadge && renderBadge(1)}
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>
                {isExpanded && (
                  <div className="space-y-0.5 mt-0.5 ml-3 border-l border-gray-100 pl-2">
                    {group.tabs.map(renderSubTabButton)}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User footer + logout */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}>
              <span className="text-xs font-bold text-white">
                {(safeBusiness || "U")[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate" title={safeBusiness}>{safeBusiness}</p>
              <p className="text-[10px] text-gray-400 truncate" title={safeEmail}>{safeEmail}</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
            aria-label="Sign out of your account"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}