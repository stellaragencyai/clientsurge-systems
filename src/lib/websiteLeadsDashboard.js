export const WEBSITE_LEADS_PAGE_SIZE = 25;

export const WEBSITE_LEAD_SORT_OPTIONS = [
  { value: "-created_date", label: "Newest" },
  { value: "created_date", label: "Oldest" },
  { value: "full_name", label: "Name A-Z" },
  { value: "-last_message_sent", label: "Recently Messaged" },
];

export function buildWebsiteLeadQuery(filter, { includeHidden = false } = {}) {
  const query = filter === "all" ? {} : { lead_status: filter };
  if (!includeHidden) {
    query.archived = { $ne: true };
  }
  return query;
}

export function normalizeWebsiteLeadPage(page) {
  const parsed = Number(page);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function getWebsiteLeadFetchLimit(page, pageSize = WEBSITE_LEADS_PAGE_SIZE, multiplier = 1) {
  return normalizeWebsiteLeadPage(page) * pageSize * multiplier + 1;
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
