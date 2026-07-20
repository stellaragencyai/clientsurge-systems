import { base44 } from "@/api/base44Client";
import { buildEnterpriseOrganizationSectionReadModel } from "./enterpriseOrganizationSettingsReadModel.js";

function entityFromClient(client, name) {
  return client?.entities?.[name] || client?.asServiceRole?.entities?.[name] || null;
}

async function listEntity(entity, sort = "-created_date", limit = 10) {
  if (!entity?.list) return [];
  const records = await entity.list(sort, limit);
  return Array.isArray(records) ? records : [];
}

function currentHostname() {
  if (typeof window === "undefined") return "clientsurgesystems.com";
  return window.location.hostname || "clientsurgesystems.com";
}

export async function fetchEnterpriseOrganizationSection({ client = base44, hostname = currentHostname() } = {}) {
  const sourceErrors = [];
  let adminSettings = {};
  let clientProjects = [];

  try {
    const records = await listEntity(entityFromClient(client, "AdminSettings"), "-created_date", 1);
    adminSettings = records[0] || {};
  } catch (error) {
    sourceErrors.push(`AdminSettings read failed: ${error?.message || error}`);
  }

  try {
    clientProjects = await listEntity(entityFromClient(client, "ClientProject"), "-updated_date", 25);
  } catch (error) {
    sourceErrors.push(`ClientProject read failed: ${error?.message || error}`);
  }

  return buildEnterpriseOrganizationSectionReadModel({
    adminSettings,
    clientProjects,
    hostname,
    sourceErrors,
  });
}
