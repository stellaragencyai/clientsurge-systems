import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ADMIN_ROUTE_PREFIXES,
  NOINDEX_ROUTE_PREFIXES,
  PUBLIC_DIRECTORY_PAGES,
  ROBOTS_DISALLOW_PATHS,
} from "../src/lib/publicRouteMetadata.js";
import {
  ENTERPRISE_ADMIN_PERMISSIONS,
  ENTERPRISE_ADMIN_ROLES,
  ENTERPRISE_ADMIN_SCOPES,
  ENTERPRISE_SETTINGS_ROUTES,
  ENTERPRISE_SETTINGS_SECTIONS,
  ENTERPRISE_STATE_CONTRACTS,
  ROLE_PERMISSION_MATRIX,
} from "../src/lib/enterpriseAdminFoundation.js";
import { buildEnterpriseOrganizationSectionReadModel } from "../src/lib/enterpriseOrganizationSettingsReadModel.js";
import { buildEnterpriseTeamSectionReadModel } from "../src/lib/enterpriseTeamManagementReadModel.js";
import {
  ENTERPRISE_RBAC_AUDIT_FIELDS,
  buildPermissionChangeAuditContract,
  can,
  evaluateEnterprisePermission,
} from "../src/lib/enterpriseRbac.js";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const adminShellSource = readFileSync(new URL("../src/components/admin/AdminShell.jsx", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../src/pages/settings/EnterpriseSettingsPage.jsx", import.meta.url), "utf8");
const organizationSource = readFileSync(new URL("../src/lib/enterpriseOrganizationSettingsSource.js", import.meta.url), "utf8");
const teamSource = readFileSync(new URL("../src/lib/enterpriseTeamManagementSource.js", import.meta.url), "utf8");

test("Phase D settings routes are mounted behind the admin guard and out of public routing", () => {
  assert.match(appSource, /allowedRoles=\{\["admin", "super_admin"\]\}/);
  assert.match(appSource, /lazy\(\(\) => import\("\.\/pages\/settings\/EnterpriseSettingsPage"\)\)/);
  assert.match(appSource, /routePath\("settings"\), element: <Navigate to=\{routePath\("settings", "organization"\)\} replace \/>/);

  for (const route of ENTERPRISE_SETTINGS_ROUTES) {
    assert.match(
      appSource,
      new RegExp(`routePath\\("settings", "${route.id}"\\).*<EnterpriseSettingsPage sectionId="${route.id}" />`),
      `${route.path} should be explicitly mounted`,
    );
    assert.equal(PUBLIC_DIRECTORY_PAGES.includes(route.path), false, `${route.path} must not be public directory output`);
  }

  assert.equal(ADMIN_ROUTE_PREFIXES.includes("/settings"), true);
  assert.equal(NOINDEX_ROUTE_PREFIXES.includes("/settings"), true);
  assert.equal(ROBOTS_DISALLOW_PATHS.includes("/settings"), true);
  assert.equal(ROBOTS_DISALLOW_PATHS.includes("/settings/"), true);
  assert.match(adminShellSource, /label: "Enterprise Settings", icon: Settings,\s+path: "\/settings\/organization"/);
});

test("Phase D route inventory covers all enterprise administration systems from issue 1382", () => {
  assert.deepEqual(ENTERPRISE_SETTINGS_ROUTES.map((route) => route.id), [
    "organization",
    "team",
    "roles",
    "integrations",
    "billing",
    "usage",
    "notifications",
    "security",
    "audit",
    "support",
  ]);

  for (const route of ENTERPRISE_SETTINGS_ROUTES) {
    const section = ENTERPRISE_SETTINGS_SECTIONS[route.id];
    assert.ok(section, `${route.id} should have a review section`);
    for (const key of ["source", "freshness", "scope", "verification"]) {
      assert.ok(section.sourceSemantics[key], `${route.id} should define ${key} semantics`);
    }
    assert.ok(section.panels.length > 0, `${route.id} should define panels`);
    assert.ok(section.safeguards.length > 0, `${route.id} should define destructive-action safeguards`);
    assert.ok(section.auditEvents.length > 0, `${route.id} should define activity/audit events`);
    assert.ok(section.acceptance.length > 0, `${route.id} should define acceptance criteria`);
  }
});

test("required organization, team, integration, billing, and security panels are present", () => {
  const expectedPanels = {
    organization: ["Company", "Locations", "Domains", "Brand", "Preferences"],
    team: ["Users", "Invites", "Teams", "Assignments", "Activity"],
    security: ["Login History", "Sessions", "Permissions Changes", "Audit Events", "Security Alerts"],
  };

  for (const [sectionId, titles] of Object.entries(expectedPanels)) {
    assert.deepEqual(
      ENTERPRISE_SETTINGS_SECTIONS[sectionId].panels.map((panel) => panel.title),
      titles,
    );
  }

  for (const status of ["Connected", "Verifying", "Healthy", "Degraded", "Disconnected", "Permission Required", "Unknown"]) {
    assert.ok(ENTERPRISE_STATE_CONTRACTS.integrations.includes(status), `${status} integration state missing`);
  }

  for (const status of ["Active", "Trial", "Past Due", "Cancelled", "Scheduled Change", "Payment Failed"]) {
    assert.ok(ENTERPRISE_STATE_CONTRACTS.billing.includes(status), `${status} billing state missing`);
  }
});

test("RBAC contract is explicit by role, permission, and scope", () => {
  assert.deepEqual(ENTERPRISE_ADMIN_ROLES, [
    "Owner",
    "Admin",
    "Manager",
    "Sales",
    "Marketing",
    "Support",
    "Analyst",
    "Viewer",
  ]);
  assert.deepEqual(ENTERPRISE_ADMIN_PERMISSIONS, ["View", "Create", "Edit", "Delete", "Approve", "Export", "Manage"]);
  assert.deepEqual(ENTERPRISE_ADMIN_SCOPES, ["Organization", "Client", "Location"]);

  for (const role of ENTERPRISE_ADMIN_ROLES) {
    for (const scope of ENTERPRISE_ADMIN_SCOPES) {
      const row = ROLE_PERMISSION_MATRIX.find((item) => item.role === role && item.scope === scope);
      assert.ok(row, `${role} should define ${scope} scope permissions`);
      assert.ok(row.permissions.includes("View"), `${role} ${scope} should include View`);
    }
  }

  assert.deepEqual(
    ROLE_PERMISSION_MATRIX.find((row) => row.role === "Owner" && row.scope === "Organization").permissions,
    ENTERPRISE_ADMIN_PERMISSIONS,
  );
  assert.deepEqual(
    ROLE_PERMISSION_MATRIX.find((row) => row.role === "Viewer" && row.scope === "Client").permissions,
    ["View"],
  );
});

test("RBAC evaluator returns allow decisions, deny reasons, and audit semantics", () => {
  assert.equal(can("Owner", "Delete", "Organization"), true);
  assert.equal(can("super_admin", "manage", "org"), true);
  assert.equal(can("Sales", "Delete", "Organization"), false);

  const denied = evaluateEnterprisePermission({ role: "Sales", permission: "Delete", scope: "Organization" });
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, "permission_not_granted");
  assert.equal(denied.auditEvent.outcome, "denied");

  const unknown = evaluateEnterprisePermission({ role: "Contractor", permission: "View", scope: "Client" });
  assert.equal(unknown.allowed, false);
  assert.equal(unknown.reason, "unknown_role");

  const auditContract = buildPermissionChangeAuditContract({
    actor: "owner@clientsurgesystems.com",
    target: "analyst@clientsurgesystems.com",
    role: "Analyst",
    permission: "Export",
    scope: "Client",
  });
  assert.equal(auditContract.action, "rbac.permission.changed");
  assert.equal(auditContract.outcome, "pending");
  for (const field of ["actor", "action", "target", "timestamp", "source", "outcome", "reason"]) {
    assert.ok(ENTERPRISE_RBAC_AUDIT_FIELDS.includes(field), `${field} should be required for RBAC audit`);
  }
});

test("Phase D UI includes accessibility, screen-reader, and reduced-motion hooks", () => {
  for (const required of [
    "aria-current",
    "aria-live=\"polite\"",
    "role=\"status\"",
    "aria-label=\"Enterprise settings sections\"",
    "aria-labelledby",
    "<caption className=\"sr-only\">Enterprise RBAC matrix by role and scope</caption>",
    "motion-reduce:transition-none",
    "Read-only Source Binding",
  ]) {
    assert.ok(pageSource.includes(required), `${required} missing from Phase D settings page`);
  }
});

test("organization settings read model binds read-only sources without claiming production verification", () => {
  const section = buildEnterpriseOrganizationSectionReadModel({
    adminSettings: {
      company_name: "ClientSurge Operations",
      legal_name: "ClientSurge LLC",
      primary_industry: "AI automation",
      primary_domain: "clientsurgesystems.com",
      timezone: "America/Phoenix",
      resend_from_email: "support@clientsurgesystems.com",
      default_approval_policy: "Owner approval required",
    },
    clientProjects: [
      {
        business_name: "Signal Med Spa",
        business_type: "Med Spa",
        location_name: "Phoenix",
        timezone: "America/Phoenix",
      },
    ],
    hostname: "clientsurgesystems.com",
  });

  assert.equal(section.sourceBinding.mode, "read-only");
  assert.equal(section.sourceBinding.status, "Current");
  assert.match(section.sourceSemantics.source, /Read-only AdminSettings, ClientProject/);
  assert.match(section.sourceSemantics.verification, /remain unverified/);

  const company = section.panels.find((panel) => panel.id === "company");
  const locations = section.panels.find((panel) => panel.id === "locations");
  const domains = section.panels.find((panel) => panel.id === "domains");
  const brand = section.panels.find((panel) => panel.id === "brand");
  const preferences = section.panels.find((panel) => panel.id === "preferences");

  assert.deepEqual(company.fields[0], ["Display name", "ClientSurge Operations (read-only source)"]);
  assert.deepEqual(company.fields[1], ["Legal name", "ClientSurge LLC (read-only source)"]);
  assert.deepEqual(locations.fields[2], ["Location count", "1"]);
  assert.deepEqual(domains.fields[0], ["Primary domain", "clientsurgesystems.com (read-only source)"]);
  assert.deepEqual(brand.fields[2], ["Email sender brand", "clientsurgesystems.com (read-only source)"]);
  assert.deepEqual(preferences.fields[0], ["Timezone", "America/Phoenix (read-only source)"]);
});

test("organization source binding remains read-only and does not introduce mutations", () => {
  for (const forbidden of [".create(", ".update(", ".delete(", "saveAdminSettings", "functions.invoke"]) {
    assert.equal(organizationSource.includes(forbidden), false, `${forbidden} must not appear in read-only source binding`);
  }

  assert.match(organizationSource, /AdminSettings/);
  assert.match(organizationSource, /ClientProject/);
  assert.match(organizationSource, /\.list\(/);
});

test("team management read model binds available sources and keeps canonical team records unverified", () => {
  const section = buildEnterpriseTeamSectionReadModel({
    users: [
      {
        full_name: "Ops Admin",
        email: "ops@clientsurgesystems.com",
        role: "admin",
        routing_active: true,
        routing_categories: ["High-Value"],
      },
      {
        full_name: "Read Only",
        email: "viewer@clientsurgesystems.com",
        role: "user",
        routing_active: false,
      },
    ],
    clientProjects: [
      {
        business_name: "Signal Med Spa",
        client_email: "owner@signal.example",
        support_priority: "Urgent",
      },
    ],
    auditLogs: [
      { action: "rbac.permission.granted", notes: "permission scope changed" },
      { action: "team.assignment.changed", notes: "backup owner assigned" },
    ],
  });

  assert.equal(section.sourceBinding.mode, "read-only");
  assert.equal(section.sourceBinding.status, "Current");
  assert.equal(section.sourceBinding.users, "2 read");
  assert.equal(section.sourceBinding.canonicalTeams, "unavailable");
  assert.match(section.sourceSemantics.verification, /canonical Team, Invite, Assignment/);

  const users = section.panels.find((panel) => panel.id === "users");
  const invites = section.panels.find((panel) => panel.id === "invites");
  const assignments = section.panels.find((panel) => panel.id === "assignments");
  const activity = section.panels.find((panel) => panel.id === "activity");

  assert.deepEqual(users.fields[0], ["Active users", "2 (read-only source)"]);
  assert.deepEqual(users.fields[1], ["Enterprise roles", "Admin, Viewer (derived read-only source)"]);
  assert.deepEqual(invites.fields[0], ["Pending invites", "1 inferred (derived read-only source)"]);
  assert.deepEqual(assignments.fields[2], ["Organization Manage", "Manager denied until Admin or Owner"]);
  assert.deepEqual(activity.fields[1], ["Permission changes", "1 (derived read-only source)"]);
});

test("team management source binding remains read-only and does not introduce mutations", () => {
  for (const forbidden of [".create(", ".update(", ".delete(", "inviteUser", "functions.invoke"]) {
    assert.equal(teamSource.includes(forbidden), false, `${forbidden} must not appear in read-only team source binding`);
  }

  assert.match(teamSource, /User/);
  assert.match(teamSource, /ClientProject/);
  assert.match(teamSource, /AuditLog/);
  assert.match(teamSource, /\.list\(/);
});
