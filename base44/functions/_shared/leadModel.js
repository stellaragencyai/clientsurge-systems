export const LEAD_MODEL_SCOPES = {
  CUSTOMER_CANONICAL: "customer_canonical",
  PLATFORM_WEBSITE_ONLY: "platform_website_only",
  LEGACY: "legacy",
};

export const LEAD_MODEL_LABELS = {
  customerLeads: "Customer Leads",
  websiteLeads: "Platform Website Leads",
  legacyLeads: "Legacy Lead Discovery",
};

export function buildLeadModelMetadata(scope, metadata = {}) {
  return {
    lead_model_scope: scope,
    ...metadata,
  };
}

export function buildCustomerLeadMetadata(metadata = {}) {
  return buildLeadModelMetadata(LEAD_MODEL_SCOPES.CUSTOMER_CANONICAL, metadata);
}

export function buildPlatformWebsiteLeadMetadata(metadata = {}) {
  return buildLeadModelMetadata(LEAD_MODEL_SCOPES.PLATFORM_WEBSITE_ONLY, metadata);
}

export function buildLegacyLeadMetadata(metadata = {}) {
  return buildLeadModelMetadata(LEAD_MODEL_SCOPES.LEGACY, metadata);
}
