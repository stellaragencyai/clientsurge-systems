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

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const adminShellSource = readFileSync(new URL("../src/components/admin/AdminShell.jsx", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../src/pages/settings/EnterpriseSettingsPage.jsx", import.meta.url), "utf8");

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

test("Phase D UI includes accessibility, screen-reader, and reduced-motion hooks", () => {
  for (const required of [
    "aria-current",
    "aria-live=\"polite\"",
    "role=\"status\"",
    "aria-label=\"Enterprise settings sections\"",
    "aria-labelledby",
    "<caption className=\"sr-only\">Enterprise RBAC matrix by role and scope</caption>",
    "motion-reduce:transition-none",
  ]) {
    assert.ok(pageSource.includes(required), `${required} missing from Phase D settings page`);
  }
});
