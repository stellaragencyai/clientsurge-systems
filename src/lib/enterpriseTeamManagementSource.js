import { base44 } from "@/api/base44Client";
import { buildEnterpriseTeamSectionReadModel } from "./enterpriseTeamManagementReadModel.js";

function entityFromClient(client, name) {
  return client?.entities?.[name] || client?.asServiceRole?.entities?.[name] || null;
}

async function listEntity(entity, sort = "-created_date", limit = 25) {
  if (!entity?.list) return [];
  const records = await entity.list(sort, limit);
  return Array.isArray(records) ? records : [];
}

export async function fetchEnterpriseTeamSection({ client = base44 } = {}) {
  const sourceErrors = [];
  let users = [];
  let clientProjects = [];
  let auditLogs = [];

  try {
    users = await listEntity(entityFromClient(client, "User"), "-created_date", 50);
  } catch (error) {
    sourceErrors.push(`User read failed: ${error?.message || error}`);
  }

  try {
    clientProjects = await listEntity(entityFromClient(client, "ClientProject"), "-updated_date", 50);
  } catch (error) {
    sourceErrors.push(`ClientProject read failed: ${error?.message || error}`);
  }

  try {
    auditLogs = await listEntity(entityFromClient(client, "AuditLog"), "-timestamp", 50);
  } catch (error) {
    sourceErrors.push(`AuditLog read failed: ${error?.message || error}`);
  }

  return buildEnterpriseTeamSectionReadModel({
    users,
    clientProjects,
    auditLogs,
    sourceErrors,
  });
}
