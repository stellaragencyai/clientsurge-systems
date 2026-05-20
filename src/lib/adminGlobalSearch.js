const SEARCH_LIMIT_PER_ENTITY = 5;

const ENTITY_CONFIG = {
  lead: {
    label: "Lead",
    tab: "leads",
    fields: ["business_name", "full_name", "name", "email", "phone", "phone_number", "industry"],
    labelFields: ["business_name", "full_name", "name", "email"],
    subFields: ["industry", "email", "phone", "phone_number"],
  },
  client: {
    label: "Client",
    tab: "client-projects",
    fields: ["business_name", "client_name", "full_name", "email", "client_email", "contact_email", "phone"],
    labelFields: ["business_name", "client_name", "full_name", "email", "client_email"],
    subFields: ["client_email", "contact_email", "email", "plan", "phone"],
  },
  order: {
    label: "Order",
    tab: "install-queue",
    fields: ["business_name", "customer_name", "customer_email", "customer_phone", "stripe_session_id", "id"],
    labelFields: ["business_name", "customer_name", "customer_email", "id"],
    subFields: ["customer_email", "payment_status", "order_status", "pipeline_status"],
  },
  support: {
    label: "Support",
    tab: "inbox",
    fields: ["sender_name", "sender_email", "message", "description", "project_id"],
    labelFields: ["sender_name", "sender_email", "project_id"],
    subFields: ["message", "description", "sender_email"],
  },
};

function pickFirst(record, fields) {
  return fields.map((field) => record?.[field]).find((value) => value !== undefined && value !== null && String(value).trim());
}

function matchesQuery(record, fields, query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (normalizedQuery.length < 2) return false;

  return fields.some((field) => String(record?.[field] || "").toLowerCase().includes(normalizedQuery));
}

export function buildAdminGlobalSearchResults(entityRecords, query, maxResults = 8) {
  const results = Object.entries(ENTITY_CONFIG).flatMap(([type, config]) => {
    const records = entityRecords?.[type] || [];
    return records
      .filter((record) => matchesQuery(record, config.fields, query))
      .slice(0, SEARCH_LIMIT_PER_ENTITY)
      .map((record) => ({
        type,
        tab: config.tab,
        id: record.id,
        label: String(pickFirst(record, config.labelFields) || config.label),
        sub: String(pickFirst(record, config.subFields) || config.label),
        data: record,
      }));
  });

  return results.slice(0, maxResults);
}

export function getAdminGlobalSearchPlaceholder() {
  return "Search leads, clients, orders, support...";
}
