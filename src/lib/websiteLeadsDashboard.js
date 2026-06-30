export const WEBSITE_LEADS_PAGE_SIZE = 25;
export const WEBSITE_LEADS_MAX_FETCH = 500;

export const WEBSITE_LEAD_SORT_OPTIONS = [
  { value: "-created_date", label: "Newest" },
  { value: "created_date", label: "Oldest" },
  { value: "full_name", label: "Name A-Z" },
  { value: "-last_message_sent", label: "Recently Messaged" },
];

const NON_PRODUCTION_PATTERN = [
  "clientsurge\\.test",
  "clientsurge-install\\.internal",
  "example\\.com",
  "crm-smoke",
  "backfill-test",
  "launch-audit-qa",
  "qa-live-launch-audit",
  "sarah-smoke-test",
  "nolan.*@clientsurgesystems\\.com",
  "nolan.*@gmail\\.com",
  "stellaragencyai.*@gmail\\.com",
  "install_test",
  "ai_brain_backfill",
  "admin_test_lead",
  "post_patch_verification",
  "crm_live_smoke_test",
  "safe to ignore",
  "smoke test",
  "internal test",
  "admin test",
  "install test",
  "backfill test",
  "sarah smoke test",
  "test hvac co",
  "test spa",
  "stripe webhook proof",
  "clientsurge smoke qa",
  "clientsurge ui function smoke",
  "clientsurge admin test",
  "dsfdsf",
  "sadfsdaf",
  "hyi",
  "1dwfsdfsdf",
].join("|");

const NON_PRODUCTION_QUERY = {
  $nor: [
    { email: { $regex: NON_PRODUCTION_PATTERN, $options: "i" } },
    { source: { $regex: NON_PRODUCTION_PATTERN, $options: "i" } },
    { source_page: { $regex: NON_PRODUCTION_PATTERN, $options: "i" } },
    { consent_source: { $regex: NON_PRODUCTION_PATTERN, $options: "i" } },
    { user_agent: { $regex: NON_PRODUCTION_PATTERN, $options: "i" } },
    { full_name: { $regex: NON_PRODUCTION_PATTERN, $options: "i" } },
    { business_name: { $regex: NON_PRODUCTION_PATTERN, $options: "i" } },
    { message: { $regex: NON_PRODUCTION_PATTERN, $options: "i" } },
    { problem: { $regex: NON_PRODUCTION_PATTERN, $options: "i" } },
    { call_summary: { $regex: NON_PRODUCTION_PATTERN, $options: "i" } },
    { phone_number: { $regex: "555|^111111", $options: "i" } },
    { archived: true },
  ],
};

export function buildWebsiteLeadQuery(filter) {
  const statusQuery = filter === "all" ? {} : { lead_status: filter };
  if (Object.keys(statusQuery).length === 0) return NON_PRODUCTION_QUERY;
  return { $and: [statusQuery, NON_PRODUCTION_QUERY] };
}

export function normalizeWebsiteLeadPage(page) {
  const parsed = Number(page);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function getWebsiteLeadFetchLimit(page, pageSize = WEBSITE_LEADS_PAGE_SIZE, includeBuffer = true) {
  const safePage = normalizeWebsiteLeadPage(page);
  const minimumForPage = safePage * pageSize + 1;
  if (!includeBuffer) return minimumForPage;
  return Math.min(Math.max(minimumForPage * 4, 100), WEBSITE_LEADS_MAX_FETCH);
}

export function getWebsiteLeadPage(leads, page, pageSize = WEBSITE_LEADS_PAGE_SIZE) {
  const safePage = normalizeWebsiteLeadPage(page);
  const start = (safePage - 1) * pageSize;
  return (leads || []).slice(start, start + pageSize);
}

export function hasNextWebsiteLeadPage(leads, page, pageSize = WEBSITE_LEADS_PAGE_SIZE) {
  const safePage = normalizeWebsiteLeadPage(page);
  return (leads || []).length > safePage * pageSize;
}
