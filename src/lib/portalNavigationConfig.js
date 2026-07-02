export const CLIENT_PORTAL_NAV_GROUPS = [
  {
    id: "start",
    label: "Start",
    tabs: [
      { id: "progress", label: "Overview" },
      { id: "order-status", label: "Order Status" },
      { id: "timeline", label: "Timeline" },
      { id: "quickstart", label: "Quick Start" },
    ],
  },
  {
    id: "systems",
    label: "Systems",
    tabs: [
      { id: "performance", label: "Automations" },
      { id: "metrics", label: "Lead Flow" },
      { id: "leads", label: "Lead Activity" },
    ],
  },
  {
    id: "work",
    label: "Work",
    tabs: [
      { id: "tasks", label: "Tasks" },
      { id: "checklist", label: "Checklist" },
      { id: "deadlines", label: "Deadlines" },
    ],
  },
  {
    id: "account",
    label: "Account",
    tabs: [
      { id: "files", label: "Files & Credentials" },
      { id: "billing", label: "Billing" },
      { id: "plan", label: "Plan" },
      { id: "reports", label: "Reports" },
    ],
  },
  {
    id: "help",
    label: "Help",
    tabs: [
      { id: "support", label: "Support" },
      { id: "referrals", label: "Referrals" },
      { id: "updates", label: "What's New" },
      { id: "settings", label: "Settings" },
    ],
  },
];

export const CLIENT_PORTAL_TABS = CLIENT_PORTAL_NAV_GROUPS.flatMap((group) =>
  group.tabs.map((tab) => ({ ...tab, group: group.label }))
);

export function getClientPortalTab(tabId) {
  return CLIENT_PORTAL_TABS.find((tab) => tab.id === tabId) || CLIENT_PORTAL_TABS[0];
}
