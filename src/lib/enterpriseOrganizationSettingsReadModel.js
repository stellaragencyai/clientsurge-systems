import { ENTERPRISE_SETTINGS_SECTIONS } from "./enterpriseAdminFoundation.js";

const FIXTURE_LABEL = "fixture fallback";
const READ_ONLY_LABEL = "read-only source";
const DEFAULT_HOSTNAME = "clientsurgesystems.com";

function isPresent(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function pickValue(...values) {
  return values.find(isPresent);
}

function valueWithSource(value, source) {
  return `${value} (${source})`;
}

function fallbackValue(value) {
  return valueWithSource(value, FIXTURE_LABEL);
}

function countClientProjects(clientProjects) {
  return Array.isArray(clientProjects) ? clientProjects.length : 0;
}

function latestProject(clientProjects) {
  return Array.isArray(clientProjects) ? clientProjects.find(Boolean) || {} : {};
}

function domainFromEmail(email) {
  if (!isPresent(email) || !String(email).includes("@")) return null;
  return String(email).split("@").pop();
}

function normalizeHostname(hostname) {
  if (!isPresent(hostname)) return DEFAULT_HOSTNAME;
  return String(hostname).replace(/^https?:\/\//, "").split("/")[0].split(":")[0] || DEFAULT_HOSTNAME;
}

function uniqueNonEmpty(values) {
  return Array.from(new Set(values.filter(isPresent).map((value) => String(value).trim())));
}

function replacePanel(basePanel, overrides) {
  return {
    ...basePanel,
    ...overrides,
    fields: overrides.fields || basePanel.fields,
  };
}

export function buildEnterpriseOrganizationSectionReadModel({
  adminSettings = {},
  clientProjects = [],
  hostname = DEFAULT_HOSTNAME,
  sourceErrors = [],
} = {}) {
  const base = ENTERPRISE_SETTINGS_SECTIONS.organization;
  const project = latestProject(clientProjects);
  const projectCount = countClientProjects(clientProjects);
  const hasAdminSettings = Boolean(adminSettings && Object.keys(adminSettings).length);
  const hasProjects = projectCount > 0;
  const host = normalizeHostname(hostname);
  const sourceStatus = sourceErrors.length ? "Partial" : hasAdminSettings || hasProjects ? "Current" : "Empty";
  const sourceSummary = [
    hasAdminSettings ? "AdminSettings" : null,
    hasProjects ? "ClientProject" : null,
    host ? "runtime host" : null,
  ].filter(Boolean).join(", ");

  const displayName = pickValue(
    adminSettings.organization_display_name,
    adminSettings.company_name,
    adminSettings.business_name,
    project.business_name,
    "ClientSurge Systems",
  );
  const legalName = pickValue(adminSettings.legal_name, adminSettings.company_legal_name, "Pending verification");
  const primaryIndustry = pickValue(
    adminSettings.primary_industry,
    adminSettings.business_type,
    project.business_type,
    "Local service automation",
  );

  const locationNames = uniqueNonEmpty(clientProjects.map((item) => item.location_name || item.market || item.business_city));
  const timezone = pickValue(adminSettings.timezone, project.timezone, "America/Phoenix");
  const operatingRegion = pickValue(adminSettings.operating_region, project.state, "United States");
  const locationCount = locationNames.length || (hasProjects ? "ClientProject records available; no canonical location records" : "No canonical location source bound");

  const primaryDomain = pickValue(
    adminSettings.primary_domain,
    adminSettings.production_domain,
    adminSettings.app_domain,
    host,
    DEFAULT_HOSTNAME,
  );
  const senderDomain = domainFromEmail(adminSettings.resend_from_email || adminSettings.gmail_from_email);
  const logoSet = pickValue(adminSettings.logo_url, adminSettings.brand_logo_url, "/clientsurge-logo.svg");
  const defaultApproval = pickValue(adminSettings.default_approval_policy, "Owner approval required");

  return {
    ...base,
    sourceSemantics: {
      source: "Read-only AdminSettings, ClientProject, and runtime host binding with fixture fallback",
      freshness: hasAdminSettings || hasProjects
        ? "Read-only source snapshot; production verification still pending"
        : "Fixture fallback; no source records available",
      scope: "Organization",
      verification: "Values remain unverified until Worker #2 binds canonical Organization proof",
    },
    sourceBinding: {
      mode: "read-only",
      status: sourceStatus,
      sources: sourceSummary || "fixture fallback only",
      adminSettings: hasAdminSettings ? "available" : "empty",
      clientProjects: `${projectCount} read`,
      hostname: host,
      errors: sourceErrors.map((error) => String(error).slice(0, 180)),
    },
    panels: base.panels.map((panel) => {
      if (panel.id === "company") {
        return replacePanel(panel, {
          status: hasAdminSettings || hasProjects ? "Partial" : "Current",
          source: "AdminSettings and ClientProject read-only snapshot",
          freshness: "Read-only source snapshot; not production verified",
          verification: "Company values require Organization proof before saved settings are trusted",
          nextAction: "Promote approved company fields into a canonical Organization source.",
          fields: [
            ["Display name", hasAdminSettings || hasProjects ? valueWithSource(displayName, READ_ONLY_LABEL) : fallbackValue(displayName)],
            ["Legal name", hasAdminSettings ? valueWithSource(legalName, READ_ONLY_LABEL) : fallbackValue(legalName)],
            ["Primary industry", hasAdminSettings || hasProjects ? valueWithSource(primaryIndustry, READ_ONLY_LABEL) : fallbackValue(primaryIndustry)],
          ],
        });
      }

      if (panel.id === "locations") {
        return replacePanel(panel, {
          status: hasProjects ? "Partial" : "Unavailable",
          source: "ClientProject read-only snapshot; canonical Location source not yet bound",
          freshness: hasProjects ? "ClientProject source snapshot; Location proof pending" : "No location source records",
          verification: "Location values require canonical Location records before routing decisions are trusted",
          nextAction: "Create or bind Organization Location records with timezone and assignment scope.",
          fields: [
            ["Primary timezone", valueWithSource(timezone, hasAdminSettings || hasProjects ? READ_ONLY_LABEL : FIXTURE_LABEL)],
            ["Operating region", valueWithSource(operatingRegion, hasAdminSettings || hasProjects ? READ_ONLY_LABEL : FIXTURE_LABEL)],
            ["Location count", String(locationCount)],
          ],
        });
      }

      if (panel.id === "domains") {
        return replacePanel(panel, {
          status: "Stale",
          source: "Runtime host and AdminSettings domain read-only snapshot",
          freshness: "Runtime-visible value only; DNS and edge proof still required",
          verification: "Domain values require public route and security header proof before launch use",
          nextAction: "Attach Cloudflare route proof, Base44 publish proof, and header verification.",
          fields: [
            ["Primary domain", valueWithSource(primaryDomain, hasAdminSettings ? READ_ONLY_LABEL : "runtime host")],
            ["Security headers", "Not verified in this view"],
            ["Return path", "/settings/security#audit-events"],
          ],
        });
      }

      if (panel.id === "brand") {
        return replacePanel(panel, {
          status: hasAdminSettings ? "Partial" : "Current",
          source: "AdminSettings sender and asset read-only snapshot",
          freshness: "Read-only source snapshot; brand asset approval pending",
          verification: "Brand sender and asset values require approved brand registry proof",
          nextAction: "Bind approved logos, colors, and sender identity to a canonical asset source.",
          fields: [
            ["Primary accent", "Commerce Blue reserved for purchase actions"],
            ["Logo set", valueWithSource(logoSet, hasAdminSettings ? READ_ONLY_LABEL : FIXTURE_LABEL)],
            ["Email sender brand", senderDomain ? valueWithSource(senderDomain, READ_ONLY_LABEL) : "Restricted until verified"],
          ],
        });
      }

      if (panel.id === "preferences") {
        return replacePanel(panel, {
          status: hasAdminSettings ? "Partial" : "Current",
          source: "AdminSettings preferences read-only snapshot",
          freshness: "Read-only source snapshot; audited preference writes not enabled",
          verification: "Preference values require audited Organization settings mutation before write flows open",
          nextAction: "Wire preference saves through audited settings mutation after Worker #2 approval.",
          fields: [
            ["Timezone", valueWithSource(timezone, hasAdminSettings || hasProjects ? READ_ONLY_LABEL : FIXTURE_LABEL)],
            ["Default approval", valueWithSource(defaultApproval, hasAdminSettings ? READ_ONLY_LABEL : FIXTURE_LABEL)],
            ["Data display", "Proof gated"],
          ],
        });
      }

      return panel;
    }),
  };
}
