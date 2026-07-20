import { ENTERPRISE_SETTINGS_SECTIONS } from "./enterpriseAdminFoundation.js";
import {
  ENTERPRISE_RBAC_AUDIT_FIELDS,
  buildPermissionChangeAuditContract,
  can,
  normalizeEnterpriseRole,
} from "./enterpriseRbac.js";

const FIXTURE_LABEL = "fixture fallback";
const READ_ONLY_LABEL = "read-only source";
const DERIVED_LABEL = "derived read-only source";

function isPresent(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function valueWithSource(value, source) {
  return `${value} (${source})`;
}

function fallbackValue(value) {
  return valueWithSource(value, FIXTURE_LABEL);
}

function countRecords(records) {
  return Array.isArray(records) ? records.length : 0;
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

function mapBase44RoleToEnterpriseRole(role) {
  if (String(role || "").toLowerCase() === "admin") return "Admin";
  return normalizeEnterpriseRole(role) || "Viewer";
}

function countPermissionAuditLogs(auditLogs) {
  return auditLogs.filter((item) => String(item.action || "").toLowerCase().includes("rbac")
    || String(item.action || "").toLowerCase().includes("permission")
    || String(item.notes || "").toLowerCase().includes("permission")).length;
}

export function buildEnterpriseTeamSectionReadModel({
  users = [],
  clientProjects = [],
  auditLogs = [],
  sourceErrors = [],
} = {}) {
  const base = ENTERPRISE_SETTINGS_SECTIONS.team;
  const userCount = countRecords(users);
  const projectCount = countRecords(clientProjects);
  const auditCount = countRecords(auditLogs);
  const hasUsers = userCount > 0;
  const hasProjects = projectCount > 0;
  const hasAuditLogs = auditCount > 0;
  const sourceStatus = sourceErrors.length ? "Partial" : hasUsers || hasProjects || hasAuditLogs ? "Current" : "Empty";
  const sourceSummary = [
    hasUsers ? "User" : null,
    hasProjects ? "ClientProject" : null,
    hasAuditLogs ? "AuditLog" : null,
  ].filter(Boolean).join(", ");

  const enterpriseRoles = uniqueNonEmpty(users.map((user) => mapBase44RoleToEnterpriseRole(user.role)));
  const routingEnabledUsers = users.filter((user) => user.routing_active === true).length;
  const routingCategories = uniqueNonEmpty(users.flatMap((user) => user.routing_categories || []));
  const inferredInviteEmails = uniqueNonEmpty(clientProjects.map((project) => project.client_email || project.contact_email));
  const urgentProjects = clientProjects.filter((project) => String(project.support_priority || "").toLowerCase() === "urgent").length;
  const permissionAuditCount = countPermissionAuditLogs(auditLogs);
  const managerOrgManageAllowed = can("Manager", "Manage", "Organization");
  const permissionAuditContract = buildPermissionChangeAuditContract({
    role: "Admin",
    permission: "Manage",
    scope: "Organization",
  });

  return {
    ...base,
    sourceSemantics: {
      source: "Read-only User, ClientProject, and AuditLog binding with fixture fallback for canonical Team, Invite, and Assignment records",
      freshness: hasUsers || hasProjects || hasAuditLogs
        ? "Read-only source snapshot; identity provider and team proof still pending"
        : "Fixture fallback; no team source records available",
      scope: "Organization, Client, Location",
      verification: "Values remain unverified until Worker #3 binds canonical Team, Invite, Assignment, and identity-provider proof",
    },
    sourceBinding: {
      mode: "read-only",
      status: sourceStatus,
      sources: sourceSummary || "fixture fallback only",
      users: `${userCount} read`,
      clientProjects: `${projectCount} read`,
      auditLogs: `${auditCount} read`,
      canonicalInvites: "unavailable",
      canonicalTeams: "unavailable",
      canonicalAssignments: "unavailable",
      rolePolicy: managerOrgManageAllowed ? "Manager can manage Organization" : "Manager denied Organization Manage",
      errors: sourceErrors.map((error) => String(error).slice(0, 180)),
    },
    panels: base.panels.map((panel) => {
      if (panel.id === "users") {
        return replacePanel(panel, {
          status: hasUsers ? "Partial" : "Current",
          source: "User read-only snapshot; enterprise role assignments still require canonical mapping",
          freshness: hasUsers ? "Read-only source snapshot" : "Fixture fallback; no User records read",
          verification: "User access requires identity-provider proof and enterprise role/scope assignment records",
          nextAction: "Bind users to canonical membership records with role and scope filters.",
          fields: [
            ["Active users", hasUsers ? valueWithSource(String(userCount), READ_ONLY_LABEL) : fallbackValue("No User records read")],
            ["Enterprise roles", enterpriseRoles.length ? valueWithSource(enterpriseRoles.join(", "), DERIVED_LABEL) : fallbackValue("Role scope required")],
            ["Routing-enabled users", hasUsers ? valueWithSource(String(routingEnabledUsers), READ_ONLY_LABEL) : fallbackValue("Shown as restricted")],
          ],
        });
      }

      if (panel.id === "invites") {
        return replacePanel(panel, {
          status: hasProjects ? "Partial" : "Delayed",
          source: "ClientProject contact snapshot; canonical Invite source not yet bound",
          freshness: hasProjects ? "Derived from read-only ClientProject contacts" : "Fixture fallback; no Invite records available",
          verification: "Invites require delivery status, expiration, actor, role, and scope proof before resend/cancel actions open",
          nextAction: "Create or bind canonical Invite records and delivery lifecycle events.",
          fields: [
            ["Pending invites", hasProjects ? valueWithSource(`${inferredInviteEmails.length} inferred`, DERIVED_LABEL) : fallbackValue("No invite source bound")],
            ["Expiration", fallbackValue("7 days proposed")],
            ["Approval", "Admin or Owner (RBAC policy)"],
          ],
        });
      }

      if (panel.id === "teams") {
        return replacePanel(panel, {
          status: routingCategories.length ? "Partial" : "Unavailable",
          source: "User routing category snapshot; canonical Team source not yet bound",
          freshness: routingCategories.length ? "Derived from read-only User routing categories" : "No canonical Team records",
          verification: "Teams require organization-scoped group records plus client/location overlays before assignment use",
          nextAction: "Create Team records or bind routing categories to canonical organization groups.",
          fields: [
            ["Routing categories", routingCategories.length ? valueWithSource(routingCategories.join(", "), DERIVED_LABEL) : fallbackValue("Ops, Sales, Support proposed")],
            ["Canonical team records", "Unavailable until Team entity exists"],
            ["Scope model", "Organization groups with client overlays"],
          ],
        });
      }

      if (panel.id === "assignments") {
        return replacePanel(panel, {
          status: hasProjects ? "Partial" : "Current",
          source: "ClientProject ownership and support snapshot; canonical Assignment source not yet bound",
          freshness: hasProjects ? "Read-only source snapshot" : "Fixture fallback; no assignment source",
          verification: "Assignments require owner, backup, scope, reason, and audit proof before mutation flows open",
          nextAction: "Connect owner, backup, and escalation assignment records with RBAC enforcement.",
          fields: [
            ["Client assignments", hasProjects ? valueWithSource(`${projectCount} project snapshots`, READ_ONLY_LABEL) : fallbackValue("No assignment source bound")],
            ["Escalation risk", hasProjects ? valueWithSource(`${urgentProjects} urgent support project(s)`, DERIVED_LABEL) : fallbackValue("Replacement owner required")],
            ["Organization Manage", managerOrgManageAllowed ? "Manager allowed" : "Manager denied until Admin or Owner"],
          ],
        });
      }

      if (panel.id === "activity") {
        return replacePanel(panel, {
          status: hasAuditLogs ? "Partial" : "Current",
          source: "AuditLog read-only snapshot and RBAC audit contract",
          freshness: hasAuditLogs ? "Read-only source snapshot" : "Fixture fallback; no AuditLog records read",
          verification: "Team activity requires actor, action, target, timestamp, source, outcome, role, permission, scope, and reason",
          nextAction: "Send invite, role, and assignment events to immutable audit history before writes are enabled.",
          fields: [
            ["Audit events", hasAuditLogs ? valueWithSource(String(auditCount), READ_ONLY_LABEL) : fallbackValue("No AuditLog records read")],
            ["Permission changes", hasAuditLogs ? valueWithSource(String(permissionAuditCount), DERIVED_LABEL) : fallbackValue("Reason capture required")],
            ["Required fields", ENTERPRISE_RBAC_AUDIT_FIELDS.join(", ")],
          ],
          auditContract: permissionAuditContract,
        });
      }

      return panel;
    }),
  };
}
