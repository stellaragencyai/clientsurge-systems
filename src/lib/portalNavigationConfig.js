/**
 * Shared Client Portal Navigation Contract
 * Single source of truth for portal sidebar tabs, icons, labels, and groups.
 * Used by PortalSidebar, ClientPortal header, and any portal-aware component.
 */

export const CLIENT_PORTAL_NAV_GROUPS = [
  {
    id: "overview",
    label: "Overview",
    tabs: [
      { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
      { id: "progress", label: "Setup Progress", icon: "Rocket" },
      { id: "timeline", label: "Timeline", icon: "MapPin" },
      { id: "order-status", label: "Order Status", icon: "Package" },
    ],
  },
  {
    id: "system",
    label: "System",
    tabs: [
      { id: "quickstart", label: "Quick Start", icon: "Zap" },
      { id: "performance", label: "Automations", icon: "Target" },
      { id: "realtime", label: "Real-Time Metrics", icon: "Activity" },
      { id: "metrics", label: "Lead Flow", icon: "Users" },
      { id: "leads", label: "Lead Activity", icon: "UserCheck" },
    ],
  },
  {
    id: "work",
    label: "Tasks & Files",
    tabs: [
      { id: "tasks", label: "Tasks", icon: "CheckSquare" },
      { id: "checklist", label: "Checklist", icon: "ListChecks" },
      { id: "deadlines", label: "Deadlines", icon: "Calendar" },
      { id: "files", label: "Files & Credentials", icon: "FolderOpen" },
    ],
  },
  {
    id: "account",
    label: "Account",
    tabs: [
      { id: "billing", label: "Billing", icon: "CreditCard" },
      { id: "plan", label: "My Plan", icon: "Package" },
      { id: "reports", label: "Weekly Report", icon: "FileText" },
      { id: "referrals", label: "Referrals", icon: "Gift" },
    ],
  },
  {
    id: "help",
    label: "Help",
    tabs: [
      { id: "support", label: "Support", icon: "MessageSquare" },
      { id: "updates", label: "What's New", icon: "Bell" },
      { id: "settings", label: "Settings", icon: "Settings" },
    ],
  },
];

export const CLIENT_PORTAL_TABS = CLIENT_PORTAL_NAV_GROUPS.flatMap((group) =>
  group.tabs.map((tab) => ({ ...tab, group: group.label, groupId: group.id }))
);

export function getClientPortalTab(tabId) {
  return CLIENT_PORTAL_TABS.find((tab) => tab.id === tabId) || CLIENT_PORTAL_TABS[0];
}