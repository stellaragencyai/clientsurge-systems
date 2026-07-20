#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ADMIN_DASHBOARD_NAVIGATION_GROUPS,
  ADMIN_DASHBOARD_SECONDARY_NAVIGATION_ITEMS,
  ADMIN_MOBILE_QUICK_NAVIGATION_ITEMS,
  ADMIN_SHELL_NAVIGATION_GROUPS,
  PLATFORM_ROUTES,
} from "../src/lib/platformIntegrationFoundation.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceFile = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const routeIdForNavEntry = (entry) => (typeof entry === "string" ? entry : entry.routeId);
const navRouteIds = (groups) => groups.flatMap((group) => group.items.map(routeIdForNavEntry));

function recordCheck(checks, id, condition, detail = {}) {
  checks.push({ id, ok: Boolean(condition), detail });
}

export function validateRouteRegistryAuthority() {
  const checks = [];
  const routeIds = new Set(PLATFORM_ROUTES.map((route) => route.id));
  const adminShellSource = sourceFile("src/components/admin/AdminShell.jsx");
  const adminDashboardSource = sourceFile("src/internal-pages/AdminDashboard.jsx");
  const registrySource = sourceFile("src/lib/platformIntegrationFoundation.js");

  const shellRouteIds = navRouteIds(ADMIN_SHELL_NAVIGATION_GROUPS);
  const dashboardRouteIds = [
    ...navRouteIds(ADMIN_DASHBOARD_NAVIGATION_GROUPS),
    ...ADMIN_DASHBOARD_SECONDARY_NAVIGATION_ITEMS.map(routeIdForNavEntry),
    ...ADMIN_MOBILE_QUICK_NAVIGATION_ITEMS.map(routeIdForNavEntry),
  ];

  recordCheck(
    checks,
    "registry.exports-navigation-groups",
    registrySource.includes("export const ADMIN_SHELL_NAVIGATION_GROUPS") &&
      registrySource.includes("export const ADMIN_DASHBOARD_NAVIGATION_GROUPS") &&
      registrySource.includes("export function getPlatformNavigationGroups"),
  );
  recordCheck(
    checks,
    "registry.shell-route-ids-exist",
    shellRouteIds.every((routeId) => routeIds.has(routeId)),
    { shellRouteIds },
  );
  recordCheck(
    checks,
    "registry.dashboard-route-ids-exist",
    dashboardRouteIds.every((routeId) => routeIds.has(routeId)),
    { dashboardRouteIds },
  );
  recordCheck(
    checks,
    "admin-shell-consumes-registry",
    adminShellSource.includes("getPlatformNavigationGroups") &&
      adminShellSource.includes("ADMIN_SHELL_NAVIGATION_GROUPS") &&
      adminShellSource.includes("ADMIN_MOBILE_QUICK_NAVIGATION_ITEMS") &&
      !/const\s+NAV_GROUPS\s*=\s*\[/.test(adminShellSource),
  );
  recordCheck(
    checks,
    "admin-dashboard-consumes-registry",
    adminDashboardSource.includes("getPlatformNavigationGroups") &&
      adminDashboardSource.includes("ADMIN_DASHBOARD_NAVIGATION_GROUPS") &&
      adminDashboardSource.includes("ADMIN_DASHBOARD_SECONDARY_NAVIGATION_ITEMS") &&
      !/const\s+NAV_GROUPS\s*=\s*\[/.test(adminDashboardSource) &&
      !/const\s+SECONDARY_NAV_ITEMS\s*=\s*\[/.test(adminDashboardSource),
  );
  recordCheck(
    checks,
    "required-routes-covered",
    [
      "admin-overview",
      "platform-integration",
      "opportunity-review",
      "appointments",
      "priority",
      "inbox",
      "automation-activity",
      "settings-billing",
    ].every((routeId) =>
      routeId === "appointments"
        ? registrySource.includes('id: "appointments"')
        : shellRouteIds.includes(routeId) || dashboardRouteIds.includes(routeId),
    ),
  );

  const failures = checks.filter((check) => !check.ok);

  return {
    ok: failures.length === 0,
    checkedAt: new Date().toISOString(),
    summary: {
      platformRoutes: PLATFORM_ROUTES.length,
      shellItems: shellRouteIds.length,
      dashboardItems: dashboardRouteIds.length,
    },
    checks,
    failures,
  };
}

function printReport(report) {
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log("ClientSurge OS route registry authority validation");
  console.log(`Status: ${report.ok ? "PASS" : "FAIL"}`);
  console.log(`Routes: ${report.summary.platformRoutes}`);
  console.log(`Shell items: ${report.summary.shellItems}`);
  console.log(`Dashboard items: ${report.summary.dashboardItems}`);
  if (!report.ok) {
    console.log("Failures:");
    for (const failure of report.failures) console.log(`- ${failure.id}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = validateRouteRegistryAuthority();
  printReport(report);

  try {
    assert.equal(report.ok, true);
  } catch {
    process.exitCode = 1;
  }
}
