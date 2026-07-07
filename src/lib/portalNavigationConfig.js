/**
 * Shared Client Portal Navigation Contract
 * Phase 4.2 — Consolidated to 8 premium SaaS sections.
 * Single source of truth for portal sidebar sections, mobile nav, and tab mapping.
 */

export const PORTAL_SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    icon: "LayoutDashboard",
    defaultTab: "dashboard",
    description: "Executive summary",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    icon: "Rocket",
    defaultTab: "progress",
    description: "Everything required to launch",
    subTabs: [
      { id: "progress", label: "Setup Progress", icon: "Rocket" },
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
    id: "automations",
    label: "Automations",
    icon: "Target",
    defaultTab: "performance",
    description: "Automation control center",
    subTabs: [
      { id: "performance", label: "Performance", icon: "Target" },
      { id: "realtime", label: "Real-Time", icon: "Activity" },
    ],
  },
  {
    id: "leads",
    label: "Leads",
    icon: "Users",
    defaultTab: "leads",
    description: "Business intelligence",
    subTabs: [
      { id: "leads", label: "Lead Activity", icon: "UserCheck" },
      { id: "metrics", label: "Lead Flow", icon: "Users" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: "FileText",
    defaultTab: "reports",
    description: "Performance visibility",
  },
  {
    id: "billing",
    label: "Billing",
    icon: "CreditCard",
    defaultTab: "billing",
    description: "Account management",
    subTabs: [
      { id: "billing", label: "Billing", icon: "CreditCard" },
      { id: "plan", label: "My Plan", icon: "Package" },
    ],
  },
  {
    id: "support",
    label: "Support",
    icon: "MessageSquare",
    defaultTab: "support",
    description: "Customer success",
    subTabs: [
      { id: "support", label: "Support", icon: "MessageSquare" },
      { id: "referrals", label: "Referrals", icon: "Gift" },
      { id: "updates", label: "What's New", icon: "Bell" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: "Settings",
    defaultTab: "settings",
    description: "Account control",
  },
];

export const PORTAL_MOBILE_NAV = [
  { id: "overview", label: "Home", icon: "LayoutDashboard" },
  { id: "onboarding", label: "Setup", icon: "Rocket" },
  { id: "automations", label: "Systems", icon: "Zap" },
  { id: "leads", label: "Leads", icon: "Users" },
  { id: "support", label: "Help", icon: "MessageSquare" },
];

const TAB_TO_SECTION_MAP = {};
PORTAL_SECTIONS.forEach((section) => {
  const allTabs = section.subTabs
    ? [section.defaultTab, ...section.subTabs.map((t) => t.id)]
    : [section.defaultTab];
  allTabs.forEach((tabId) => {
    TAB_TO_SECTION_MAP[tabId] = section.id;
  });
});

export function getPortalSection(sectionId) {
  return PORTAL_SECTIONS.find((s) => s.id === sectionId) || PORTAL_SECTIONS[0];
}

export function getSectionForTab(tabId) {
  return TAB_TO_SECTION_MAP[tabId] || "overview";
}

export function getSectionTabs(sectionId) {
  const section = getPortalSection(sectionId);
  if (section.subTabs) return section.subTabs;
  return [{ id: section.defaultTab, label: section.label, icon: section.icon }];
}

// ── Backward compatibility exports ──
export const CLIENT_PORTAL_NAV_GROUPS = PORTAL_SECTIONS.map((section) => ({
  id: section.id,
  label: section.label,
  tabs: section.subTabs || [{ id: section.defaultTab, label: section.label, icon: section.icon }],
}));

export const CLIENT_PORTAL_TABS = CLIENT_PORTAL_NAV_GROUPS.flatMap((group) =>
  group.tabs.map((tab) => ({ ...tab, group: group.label, groupId: group.id }))
);

export function getClientPortalTab(tabId) {
  return CLIENT_PORTAL_TABS.find((tab) => tab.id === tabId) || CLIENT_PORTAL_TABS[0];
}