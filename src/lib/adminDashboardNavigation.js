export const DEFAULT_ADMIN_TAB = "overview";
export const INSTALL_QUEUE_TAB = "install-queue";
const VALID_TABS = new Set([
  "overview",
  "leads",
  "client-projects",
  "inbox",
  "website-leads",
  "install-queue",
  "install-checklists",
  "automations",
  "drip",
  "nurture",
  "cadence",
  "email-campaigns",
  "campaign-builder",
  "routing",
  "analytics",
  "revenue",
  "priority",
  "attribution",
  "health",
  "logs",
  "templates",
  "review-request",
  "settings",
  "qa",
]);

export function parseAdminDashboardSearch(search) {
  const params = new URLSearchParams(search || "");
  const requestedTab = params.get("tab") || DEFAULT_ADMIN_TAB;
  const tab = VALID_TABS.has(requestedTab) ? requestedTab : DEFAULT_ADMIN_TAB;
  const orderId = params.get("order") || "";

  return {
    tab,
    orderId: tab === INSTALL_QUEUE_TAB ? orderId : "",
  };
}

export function buildAdminDashboardSearch({ tab, orderId }) {
  const params = new URLSearchParams();
  const nextTab = VALID_TABS.has(tab) ? tab : DEFAULT_ADMIN_TAB;

  if (nextTab !== DEFAULT_ADMIN_TAB) {
    params.set("tab", nextTab);
  }

  if (nextTab === INSTALL_QUEUE_TAB && orderId) {
    params.set("order", orderId);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
