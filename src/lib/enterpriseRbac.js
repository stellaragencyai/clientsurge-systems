import {
  ENTERPRISE_ADMIN_PERMISSIONS,
  ENTERPRISE_ADMIN_ROLES,
  ENTERPRISE_ADMIN_SCOPES,
  ROLE_SCOPE_PERMISSIONS,
} from "./enterpriseAdminFoundation.js";

export const ENTERPRISE_RBAC_AUDIT_FIELDS = [
  "actor",
  "action",
  "target",
  "timestamp",
  "source",
  "outcome",
  "reason",
  "role",
  "permission",
  "scope",
];

const ROLE_ALIASES = {
  owner: "Owner",
  admin: "Admin",
  super_admin: "Owner",
  manager: "Manager",
  sales: "Sales",
  marketing: "Marketing",
  support: "Support",
  analyst: "Analyst",
  viewer: "Viewer",
  user: "Viewer",
};

const PERMISSION_ALIASES = {
  view: "View",
  read: "View",
  create: "Create",
  add: "Create",
  edit: "Edit",
  update: "Edit",
  delete: "Delete",
  remove: "Delete",
  approve: "Approve",
  export: "Export",
  download: "Export",
  manage: "Manage",
  administer: "Manage",
};

const SCOPE_ALIASES = {
  organization: "Organization",
  org: "Organization",
  client: "Client",
  project: "Client",
  location: "Location",
  market: "Location",
};

function normalizeWithAliases(value, aliases, allowedValues) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const direct = allowedValues.find((item) => item === raw);
  if (direct) return direct;
  return aliases[raw.toLowerCase()] || null;
}

export function normalizeEnterpriseRole(role) {
  return normalizeWithAliases(role, ROLE_ALIASES, ENTERPRISE_ADMIN_ROLES);
}

export function normalizeEnterprisePermission(permission) {
  return normalizeWithAliases(permission, PERMISSION_ALIASES, ENTERPRISE_ADMIN_PERMISSIONS);
}

export function normalizeEnterpriseScope(scope) {
  return normalizeWithAliases(scope, SCOPE_ALIASES, ENTERPRISE_ADMIN_SCOPES);
}

function denied(reason, message, normalized, input) {
  return {
    allowed: false,
    reason,
    message,
    input,
    role: normalized.role,
    permission: normalized.permission,
    scope: normalized.scope,
    allowedPermissions: [],
    auditEvent: {
      action: "rbac.permission.evaluated",
      target: `${input.role || "unknown"}:${input.scope || "unknown"}:${input.permission || "unknown"}`,
      source: "enterpriseRbac.evaluateEnterprisePermission",
      outcome: "denied",
      reason,
    },
  };
}

export function evaluateEnterprisePermission({ role, permission, scope } = {}) {
  const input = { role, permission, scope };
  const normalized = {
    role: normalizeEnterpriseRole(role),
    permission: normalizeEnterprisePermission(permission),
    scope: normalizeEnterpriseScope(scope),
  };

  if (!normalized.role) {
    return denied("unknown_role", `Unknown enterprise role: ${role || "missing"}`, normalized, input);
  }

  if (!normalized.permission) {
    return denied("unknown_permission", `Unknown enterprise permission: ${permission || "missing"}`, normalized, input);
  }

  if (!normalized.scope) {
    return denied("unknown_scope", `Unknown enterprise scope: ${scope || "missing"}`, normalized, input);
  }

  const allowedPermissions = ROLE_SCOPE_PERMISSIONS[normalized.role]?.[normalized.scope] || [];
  const allowed = allowedPermissions.includes(normalized.permission);

  return {
    allowed,
    reason: allowed ? "allowed_by_role_scope_matrix" : "permission_not_granted",
    message: allowed
      ? `${normalized.role} can ${normalized.permission} ${normalized.scope} resources.`
      : `${normalized.role} lacks ${normalized.permission} permission for ${normalized.scope} scope.`,
    input,
    role: normalized.role,
    permission: normalized.permission,
    scope: normalized.scope,
    allowedPermissions,
    auditEvent: {
      action: "rbac.permission.evaluated",
      target: `${normalized.role}:${normalized.scope}:${normalized.permission}`,
      source: "enterpriseRbac.evaluateEnterprisePermission",
      outcome: allowed ? "allowed" : "denied",
      reason: allowed ? "allowed_by_role_scope_matrix" : "permission_not_granted",
    },
  };
}

export function can(role, permission, scope) {
  return evaluateEnterprisePermission({ role, permission, scope }).allowed;
}

export function buildPermissionChangeAuditContract({
  actor = "required",
  target = "required",
  role,
  permission,
  scope,
  outcome = "pending",
  reason = "required",
} = {}) {
  return {
    actor,
    action: "rbac.permission.changed",
    target,
    timestamp: "required",
    source: "Enterprise RBAC",
    outcome,
    reason,
    role: normalizeEnterpriseRole(role) || "required",
    permission: normalizeEnterprisePermission(permission) || "required",
    scope: normalizeEnterpriseScope(scope) || "required",
    requiredFields: ENTERPRISE_RBAC_AUDIT_FIELDS,
  };
}
